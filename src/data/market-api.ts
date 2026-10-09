const configuredApiBaseUrl = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL?.trim().replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function marketApiUrl(path: string) {
  const isAssistantApi = path === "/api/assistant" || path === "/api/assistant/status";
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "invest.danielxu.cn" &&
    (path.startsWith("/api/market/") || isAssistantApi)
  ) {
    return path;
  }

  return configuredApiBaseUrl ? configuredApiBaseUrl + path : basePath + path;
}
