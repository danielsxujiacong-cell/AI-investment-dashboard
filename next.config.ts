import type { NextConfig } from "next";

const isGitHubPages =
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.BUILD_FOR_GITHUB_PAGES === "true";
const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: isDevelopment ? undefined : "export",
  basePath: isGitHubPages ? "/AI-investment-dashboard" : "",
  trailingSlash: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/AI-investment-dashboard" : "",
  },
  rewrites:
    isDevelopment
      ? async () => [
          {
            source: "/api/market/quote/:symbol",
            destination: "http://127.0.0.1:8787/api/market/quote/:symbol",
          },
          {
            source: "/api/market/stocks",
            destination: "http://127.0.0.1:8787/api/market/stocks",
          },
          {
            source: "/api/market/candles/:symbol",
            destination: "http://127.0.0.1:8787/api/market/candles/:symbol",
          },
          {
            source: "/api/assistant/status",
            destination: "http://127.0.0.1:8787/api/assistant/status",
          },
          {
            source: "/api/assistant",
            destination: "http://127.0.0.1:8787/api/assistant",
          },
        ]
      : undefined,
};

export default nextConfig;
