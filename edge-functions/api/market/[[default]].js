const MARKET_API_ORIGIN = "https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev";
const MARKET_API_PATH = /^\/api\/market\/(?:stocks|quote\/[A-Za-z0-9.-]+|candles\/[A-Za-z0-9.-]+|fundamentals\/[A-Za-z0-9.-]+)$/;

export default async function onRequest(context) {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  if (!MARKET_API_PATH.test(incomingUrl.pathname) || !["GET", "OPTIONS"].includes(request.method)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, MARKET_API_ORIGIN);
  const headers = new Headers();
  for (const name of ["origin", "access-control-request-method", "access-control-request-headers"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    return await fetch(upstreamUrl, { method: request.method, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Market data upstream is temporarily unavailable." }), {
      status: 502,
      headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
