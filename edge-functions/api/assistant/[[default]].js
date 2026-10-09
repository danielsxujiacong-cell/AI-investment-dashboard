const AI_API_ORIGIN = "https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev";
const ASSISTANT_API_PATHS = new Set(["/api/assistant", "/api/assistant/status"]);

export default async function onRequest(context) {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  if (!ASSISTANT_API_PATHS.has(incomingUrl.pathname)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const allowedMethod = incomingUrl.pathname === "/api/assistant/status" ? "GET" : "POST";
  if (![allowedMethod, "OPTIONS"].includes(request.method)) {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, AI_API_ORIGIN);
  const headers = new Headers();
  for (const name of ["origin", "content-type", "access-control-request-method", "access-control-request-headers"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    return await fetch(upstreamUrl, {
      method: request.method,
      headers,
      ...(request.method === "POST" ? { body: request.body } : {}),
    });
  } catch {
    return Response.json(
      { error: "AI service is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
