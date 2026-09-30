# Handoff

## Current state

- Canonical checkout: `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V5 adds a provider-neutral `/api/assistant` OpenAI-Compatible route to the Cloudflare Worker. Requests can include Watchlist, Portfolio, successful Finnhub quotes, Investment Memory, Investment Notes, and recent conversation history.
- Current Worker variables: `AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/`, `AI_MODEL=glm-4-flash-250414`. `AI_API_KEY` is listed as a Cloudflare Worker Secret; never request or log its value.
- Worker `ai-investment-dashboard-api` is deployed at `https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev` (version `0b2d98e7-ebf8-4a41-9e14-39666c4907db`). `/api/assistant/status` returns HTTP 200, `available: true`, and model `glm-4-flash-250414`.
- Live Worker chat returned HTTP 200 for “在吗？” and “分析一下我当前的 NVDA 持仓”. The latter used an empty Portfolio, Investment Memory, and Investment Notes payload, plus Finnhub quotes for NVDA, AAPL, TSLA, MSFT, and AMZN; the AI cited NVDA at $227.21 and correctly said no share count was present, so it could not calculate position value or profit/loss.
- `README.md`, `CHANGELOG.md`, `docs/PRODUCT.md`, and `docs/ROADMAP.md` record the current AI configuration and acceptance state. Build, Git commit/push, and GitHub Pages verification are still pending.

## Next action

Run `npm run build`, review the focused AI configuration and documentation diff plus `.gitignore`, commit and push `main`, then verify the GitHub Pages workflow and live Assistant route.
