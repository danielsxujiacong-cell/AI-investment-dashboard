const allowedSymbols = new Set(["NVDA", "AAPL", "TSLA", "MSFT", "AMZN"]);
const rateBuckets = new Map();

function allowedOrigins(env) {
  return new Set(
    (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).has(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function jsonResponse(request, env, payload, status = 200) {
  const headers = corsHeaders(request, env);
  if (!headers) {
    return new Response(JSON.stringify({ error: "Origin is not allowed." }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isRateLimited(request, limit) {
  const address = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  if (rateBuckets.size > 2_000) {
    for (const [addressKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(addressKey);
    }
  }

  const current = rateBuckets.get(address);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(address, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (current.count >= limit) return true;

  current.count += 1;
  return false;
}

function isCompleteQuote(quote) {
  const fields = ["c", "d", "dp", "o", "h", "l", "pc", "t"];
  return (
    quote &&
    typeof quote === "object" &&
    fields.every((field) => typeof quote[field] === "number" && Number.isFinite(quote[field])) &&
    quote.c > 0 &&
    quote.o > 0 &&
    quote.h > 0 &&
    quote.l > 0 &&
    quote.pc > 0 &&
    quote.h >= quote.l
  );
}

const candleRanges = {
  "1D": { resolution: "5", days: 2 },
  "1W": { resolution: "60", days: 8 },
  "1M": { resolution: "D", days: 32 },
  "3M": { resolution: "D", days: 93 },
  "1Y": { resolution: "D", days: 366 },
};

function isCompleteCandleData(payload) {
  if (!payload || typeof payload !== "object" || payload.s !== "ok") return false;
  const { c, h, l, o, t, v } = payload;
  if (![c, h, l, o, t, v].every(Array.isArray) || c.length < 2) return false;
  if (![h, l, o, t, v].every((values) => values.length === c.length)) return false;
  const allFinite = [c, h, l, o, t, v].every((values) =>
    values.every((value) => typeof value === "number" && Number.isFinite(value))
  );
  return allFinite &&
    [c, h, l, o].every((values) => values.every((value) => value > 0)) &&
    v.every((value) => value >= 0) &&
    t.every((value) => value > 0) &&
    h.every((value, index) => value >= l[index]);
}

async function getCandles(request, env, symbol, range) {
  if (!allowedSymbols.has(symbol)) {
    return jsonResponse(request, env, { error: "Unsupported stock symbol." }, 404);
  }
  if (!Object.hasOwn(candleRanges, range)) {
    return jsonResponse(request, env, { error: "Unsupported history range." }, 400);
  }
  if (!env.FINNHUB_API_KEY) {
    return jsonResponse(request, env, { error: "Market data is not configured." }, 503);
  }
  if (isRateLimited(request, 60)) {
    return jsonResponse(request, env, { error: "Too many requests. Please retry shortly." }, 429);
  }

  const { resolution, days } = candleRanges[range];
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;
  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", resolution);
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  url.searchParams.set("token", env.FINNHUB_API_KEY);

  try {
    const upstream = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (upstream.status === 403) {
      return jsonResponse(request, env, {
        error: "Historical prices are restricted by the configured Finnhub plan: GET /stock/candle requires Premium Access.",
        code: "history_premium_required",
      }, 403);
    }
    if (upstream.status === 401) {
      return jsonResponse(request, env, {
        error: "Finnhub rejected the server-side market data credential.",
        code: "history_auth_failed",
      }, 502);
    }
    if (!upstream.ok) {
      return jsonResponse(request, env, {
        error: "Finnhub historical candles request failed (" + upstream.status + ").",
        code: "history_request_failed",
      }, 502);
    }

    const payload = await upstream.json();
    if (typeof payload?.error === "string") {
      const upstreamMessage = payload.error.toLowerCase();
      if (upstreamMessage.includes("access") || upstreamMessage.includes("premium") ||
        upstreamMessage.includes("subscription") || upstreamMessage.includes("plan")) {
        return jsonResponse(request, env, {
          error: "Historical prices are restricted by the configured Finnhub plan: GET /stock/candle requires Premium Access.",
          code: "history_premium_required",
        }, 403);
      }
      return jsonResponse(request, env, {
        error: "Finnhub rejected the historical candles request.",
        code: "history_upstream_rejected",
      }, 502);
    }
    if (payload?.s === "no_data") {
      return jsonResponse(request, env, {
        error: "Finnhub returned no historical candles for this range.",
        code: "history_no_data",
      }, 404);
    }
    if (!isCompleteCandleData(payload)) {
      return jsonResponse(request, env, {
        error: "Finnhub returned invalid historical candles.",
        code: "history_invalid_response",
      }, 502);
    }

    let candles = payload.t.map((timestamp, index) => ({
      timestamp: timestamp * 1000,
      open: payload.o[index],
      high: payload.h[index],
      low: payload.l[index],
      close: payload.c[index],
      volume: payload.v[index],
    }));

    if (range === "1D" && candles.length > 0) {
      const sessionDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(candles[candles.length - 1].timestamp));
      candles = candles.filter((candle) =>
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(candle.timestamp)) === sessionDate
      );
    }

    if (candles.length < 2) {
      return jsonResponse(request, env, {
        error: "Finnhub returned no usable candles for this range.",
        code: "history_no_data",
      }, 404);
    }

    return jsonResponse(request, env, { symbol, range, resolution, candles });
  } catch {
    return jsonResponse(request, env, {
      error: "Finnhub historical candles are temporarily unavailable.",
      code: "history_upstream_unavailable",
    }, 502);
  }
}

async function getQuote(request, env, symbol) {
  if (!allowedSymbols.has(symbol)) {
    return jsonResponse(request, env, { error: "Unsupported stock symbol." }, 404);
  }
  if (!env.FINNHUB_API_KEY) {
    return jsonResponse(request, env, { error: "Market data is not configured." }, 503);
  }
  if (isRateLimited(request, 60)) {
    return jsonResponse(request, env, { error: "Too many requests. Please retry shortly." }, 429);
  }

  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", env.FINNHUB_API_KEY);

  try {
    const upstream = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!upstream.ok) {
      return jsonResponse(request, env, { error: "Finnhub quote request failed." }, 502);
    }

    const quote = await upstream.json();
    if (!isCompleteQuote(quote)) {
      return jsonResponse(request, env, { error: "Finnhub returned an incomplete quote." }, 502);
    }

    return jsonResponse(request, env, quote);
  } catch {
    return jsonResponse(request, env, { error: "Finnhub is temporarily unavailable." }, 502);
  }
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (!headers) {
      return new Response(JSON.stringify({ error: "Origin is not allowed." }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const candlesMatch = url.pathname.match(/^\/api\/market\/candles\/([A-Za-z]+)$/);
    if (request.method === "GET" && candlesMatch) {
      return getCandles(request, env, candlesMatch[1].toUpperCase(), url.searchParams.get("range") || "");
    }

    const quoteMatch = url.pathname.match(/^\/api\/market\/quote\/([A-Za-z]+)$/);
    if (request.method === "GET" && quoteMatch) {
      return getQuote(request, env, quoteMatch[1].toUpperCase());
    }

    return jsonResponse(request, env, { error: "Not found." }, 404);
  },
};
