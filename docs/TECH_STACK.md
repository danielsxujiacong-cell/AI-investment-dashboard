# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG close-price charts and OHLC candlesticks from Massive | Overview / Watchlist 1M; details 1D / 1W / 1M / 3M / 1Y; no mock history fallback |
| Database | Supabase | 未来接入 |
| AI | Existing Mock AI | 当前采用；STEP 3 待以后配置 OPENAI_API_KEY |
| Stock Data | Finnhub quotes and Massive history via Cloudflare Worker | Finnhub supplies current quotes; Massive supplies historical OHLC. API keys stay in server-only Worker secrets. |
| UI Theme | CSS theme tokens + localStorage | Light / Dark，可首次跟随系统偏好 |
| Personal Data | Versioned localStorage store | Portfolio、Investment Memory、Investment Notes；仅当前设备保存 |
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

历史价格曲线与股票详情 K 线使用轻量 SVG，数据来自 Worker 转发的 Massive aggregate OHLC API。Stocks Basic 免费档提供 end-of-day 历史，图表最新交易日可能落后于 Finnhub 当前报价。Massive API Key 由 Worker 的 `MASSIVE_API_KEY` Secret 读取；项目本地 `.env.local` 被 Git 忽略。历史请求失败时明确展示错误且不画 Mock 曲线；Finnhub 报价仍保留 Mock fallback。市场简报和 AI 回复继续使用 Mock AI；个人投资数据仅写入本机 localStorage。当前不包含数据库、登录、自动交易、RAG 或新闻搜索。
