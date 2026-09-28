# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG charts | MVP 当前采用；TradingView Lightweight Charts 可后续评估 |
| Database | Supabase | 未来接入 |
| AI | Existing Mock AI | 当前采用；STEP 3 待以后配置 OPENAI_API_KEY |
| Stock Data | Finnhub via Cloudflare Worker | 五只股票接口已部署；前端 API 失败时回退到 Mock Data |
| UI Theme | CSS theme tokens + localStorage | Light / Dark，可首次跟随系统偏好 |
| Personal Data | Versioned localStorage store | Portfolio、Investment Memory、Investment Notes；仅当前设备保存 |
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

收益曲线仍使用轻量 SVG / CSS。行情、市场简报和 AI 回复保留 Mock fallback / Mock AI；个人投资数据仅写入本机 localStorage。当前不包含数据库、登录、自动交易、RAG 或新闻搜索。
