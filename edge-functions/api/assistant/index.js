const AI_API_ORIGIN = "https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev";

export default async function onRequest(context) {
  const { request } = context;
  if (!["POST", "OPTIONS"].includes(request.method)) {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const upstreamUrl = new URL("/api/assistant", AI_API_ORIGIN);
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
