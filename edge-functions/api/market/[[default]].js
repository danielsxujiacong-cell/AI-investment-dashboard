const MARKET_API_ORIGIN = "https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev";
const MARKET_API_PATH = /^\/api\/market\/(?:stocks|quote\/[A-Za-z0-9.-]+|candles\/[A-Za-z0-9.-]+|fundamentals\/[A-Za-z0-9.-]+)$/;

export default async function onRequest(context) {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  if (!MARKET_API_PATH.test(incomingUrl.pathname) || !["GET", "OPTIONS"].includes(request.method)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, MARKET_API_ORIGIN);
  return fetch(new Request(upstreamUrl, request));
}
