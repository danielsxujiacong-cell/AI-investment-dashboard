# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG close-price charts and OHLC candlesticks from Massive | Overview / Watchlist 1M; details 1D / 1W / 1M / 3M / 1Y; no mock history fallback |
| Database | Supabase | 未来接入 |
| AI | OpenAI-Compatible Chat Completions via Cloudflare Worker | `AI_BASE_URL` / `AI_MODEL` variables; `AI_API_KEY` Worker Secret; failure falls back to Mock |
| Stock Data | Finnhub quotes and Massive history via Cloudflare Worker | Finnhub supplies current quotes; Massive supplies historical OHLC. API keys stay in server-only Worker secrets. |
| UI Theme | CSS theme tokens + localStorage | Light / Dark，可首次跟随系统偏好 |
| Personal Data | Versioned localStorage store | Portfolio、Investment Memory、Investment Notes；仅当前设备保存 |
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

市场价格由 Finnhub 当前报价与 Massive 历史 OHLC 提供。所有供应商凭证均留在 Worker 服务端；AI 通过标准 `/chat/completions` 端点转发，不引入供应商 SDK。Assistant 按请求转发本地 Portfolio、成功的 Finnhub 报价、Investment Memory 和 Investment Notes；Mock 用于 AI 不可用时的回退。Daily Brief 仍为 Mock。当前不包含数据库、登录、自动交易、联网搜索或新闻抓取。
