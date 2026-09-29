# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG line charts from Finnhub candles | Overview / Watchlist 1M; details 1D / 1W / 1M / 3M / 1Y; no mock history fallback |
| Database | Supabase | 未来接入 |
| AI | Existing Mock AI | 当前采用；STEP 3 待以后配置 OPENAI_API_KEY |
| Stock Data | Finnhub via Cloudflare Worker | Quote endpoint keeps Mock fallback; /stock/candle is Premium and currently returns 403 for the configured key |
| UI Theme | CSS theme tokens + localStorage | Light / Dark，可首次跟随系统偏好 |
| Personal Data | Versioned localStorage store | Portfolio、Investment Memory、Investment Notes；仅当前设备保存 |
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

历史价格曲线使用轻量 SVG，数据来自 Worker 转发的 Finnhub Stock Candles。当前套餐不允许访问 /stock/candle 时明确展示错误且不画 Mock 曲线；报价仍保留 Mock fallback。市场简报和 AI 回复继续使用 Mock AI；个人投资数据仅写入本机 localStorage。当前不包含数据库、登录、自动交易、RAG 或新闻搜索。
