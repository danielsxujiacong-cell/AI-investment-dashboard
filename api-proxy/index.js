const allowedSymbols = new Set(["NVDA", "AAPL", "TSLA", "MSFT", "AMZN"]);
const rateBuckets = new Map();
const historyCache = new Map();
const massiveRequestTimes = [];

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

const historyRanges = { "1W": 7, "1M": 30, "3M": 92, "1Y": 366 };

function exchangeDate(timestamp) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function exchangeDateDaysAgo(days) {
  const [year, month, day] = exchangeDate(Date.now()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
}

function reserveMassiveRequest() {
  const now = Date.now();
  while (massiveRequestTimes.length > 0 && massiveRequestTimes[0] <= now - 60_000) {
    massiveRequestTimes.shift();
  }
  if (massiveRequestTimes.length >= 5) return false;
  massiveRequestTimes.push(now);
  return true;
}

function parseMassiveCandles(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.results)) return null;
  return payload.results.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candle = item;
    const numbers = [candle.o, candle.h, candle.l, candle.c, candle.v, candle.t];
    if (!numbers.every((value) => typeof value === "number" && Number.isFinite(value))) return [];
    if (candle.o <= 0 || candle.h <= 0 || candle.l <= 0 || candle.c <= 0 || candle.v < 0 || candle.t <= 0) return [];
    if (candle.h < candle.l || candle.h < candle.o || candle.h < candle.c || candle.l > candle.o || candle.l > candle.c) return [];
    return [{
      timestamp: candle.t,
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
      volume: candle.v,
    }];
  }).sort((left, right) => left.timestamp - right.timestamp);
}

async function loadMassiveCandles(env, symbol, interval) {
  const cacheKey = interval + ":" + symbol;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  if (!env.MASSIVE_API_KEY) {
    throw Object.assign(new Error("The server-side Massive key is not configured."), { code: "history_not_configured", status: 503 });
  }
  if (!reserveMassiveRequest()) {
    throw Object.assign(new Error("Massive Stocks Basic allows 5 API calls per minute; cached real history will be available shortly."), { code: "history_rate_limited", status: 429 });
  }

  const isIntraday = interval === "intraday";
  const from = exchangeDateDaysAgo(isIntraday ? 4 : 366);
  const to = exchangeDate(Date.now());
  const multiplier = isIntraday ? 5 : 1;
  const timespan = isIntraday ? "minute" : "day";
  const url = new URL(
    "https://api.massive.com/v2/aggs/ticker/" + symbol + "/range/" + multiplier + "/" + timespan + "/" + from + "/" + to,
  );
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", "50000");

  const ttl = isIntraday ? 30_000 : 300_000;
  const request = (async () => {
    try {
      const upstream = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + env.MASSIVE_API_KEY,
        },
        cf: { cacheEverything: true, cacheTtl: isIntraday ? 30 : 300 },
      });
      if (upstream.status === 401) {
        throw Object.assign(new Error("Massive rejected the server-side API key."), { code: "history_auth_failed", status: 502 });
      }
      if (upstream.status === 403) {
        throw Object.assign(new Error("Massive denied access to the historical aggregates endpoint for this account."), { code: "history_plan_restricted", status: 403 });
      }
      if (upstream.status === 429) {
        throw Object.assign(new Error("Massive API rate limit reached. Retry after the free-plan minute window resets."), { code: "history_rate_limited", status: 429 });
      }
      if (!upstream.ok) {
        throw Object.assign(new Error("Massive historical aggregates request failed (" + upstream.status + ")."), { code: "history_request_failed", status: 502 });
      }

      const payload = await upstream.json();
      if (payload?.status === "ERROR") {
        throw Object.assign(new Error("Massive rejected the historical aggregates request."), { code: "history_upstream_rejected", status: 502 });
      }
      const candles = parseMassiveCandles(payload);
      if (!candles || candles.length < 2) {
        throw Object.assign(new Error("Massive returned no usable historical candles for this range."), { code: "history_no_data", status: 404 });
      }
      return candles;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) throw error;
      throw Object.assign(new Error("Massive historical prices are temporarily unavailable."), { code: "history_upstream_unavailable", status: 502 });
    }
  })();

  historyCache.set(cacheKey, { expiresAt: Date.now() + ttl, promise: request });
  void request.catch(() => {
    if (historyCache.get(cacheKey)?.promise === request) historyCache.delete(cacheKey);
  });
  return request;
}

async function getCandles(request, env, symbol, range) {
  if (!allowedSymbols.has(symbol)) {
    return jsonResponse(request, env, { error: "Unsupported stock symbol." }, 404);
  }
  if (range !== "1D" && !Object.hasOwn(historyRanges, range)) {
    return jsonResponse(request, env, { error: "Unsupported history range." }, 400);
  }
  if (isRateLimited(request, 60)) {
    return jsonResponse(request, env, { error: "Too many requests. Please retry shortly." }, 429);
  }

  try {
    let candles = await loadMassiveCandles(env, symbol, range === "1D" ? "intraday" : "daily");
    if (range === "1D") {
      const latestSession = exchangeDate(candles[candles.length - 1].timestamp);
      candles = candles.filter((candle) => exchangeDate(candle.timestamp) === latestSession);
    } else if (range !== "1Y") {
      const cutoff = Date.now() - historyRanges[range] * 24 * 60 * 60 * 1000;
      candles = candles.filter((candle) => candle.timestamp >= cutoff);
    }

    if (candles.length < 2) {
      return jsonResponse(request, env, {
        error: "Massive returned no usable historical candles for this range.",
        code: "history_no_data",
      }, 404);
    }
    return jsonResponse(request, env, { symbol, range, candles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Massive historical prices are temporarily unavailable.";
    const code = error && typeof error === "object" && "code" in error ? error.code : "history_upstream_unavailable";
    const status = error && typeof error === "object" && "status" in error ? error.status : 502;
    return jsonResponse(request, env, { error: message, code }, status);
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
