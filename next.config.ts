import type { NextConfig } from "next";

const isGitHubPages =
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.BUILD_FOR_GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/AI-investment-dashboard" : "",
  trailingSlash: true,
  devIndicators: false,
};

export default nextConfig;
