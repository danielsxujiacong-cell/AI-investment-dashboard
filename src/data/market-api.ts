const configuredApiBaseUrl = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL?.trim().replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function marketApiUrl(path: string) {
  return configuredApiBaseUrl ? configuredApiBaseUrl + path : basePath + path;
}
