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
    const quoteMatch = url.pathname.match(/^\/api\/market\/quote\/([A-Za-z]+)$/);
    if (request.method === "GET" && quoteMatch) {
      return getQuote(request, env, quoteMatch[1].toUpperCase());
    }

    return jsonResponse(request, env, { error: "Not found." }, 404);
  },
};
