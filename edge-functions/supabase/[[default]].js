const SUPABASE_API_ORIGIN = "https://vjqsorzsilxblufpdxxc.supabase.co";
const SUPABASE_API_PATH = /^\/supabase\/(?:auth|rest)\/v1(?:\/|$)/;
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const FORWARDED_HEADERS = [
  "accept",
  "accept-profile",
  "apikey",
  "authorization",
  "cache-control",
  "content-profile",
  "content-type",
  "if-match",
  "if-none-match",
  "origin",
  "prefer",
  "range",
  "x-client-info",
  "x-supabase-api-version",
  "x-upsert",
];

export default async function onRequest(context) {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  if (!SUPABASE_API_PATH.test(incomingUrl.pathname) || !ALLOWED_METHODS.has(request.method)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const upstreamUrl = new URL(incomingUrl.pathname.replace(/^\/supabase/, "") + incomingUrl.search, SUPABASE_API_ORIGIN);
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "private, no-store");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Supabase is temporarily unavailable." }), {
      status: 502,
      headers: { "Cache-Control": "private, no-store", "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
