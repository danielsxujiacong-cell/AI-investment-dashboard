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
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

收益曲线和资产配置图仍使用轻量 SVG / CSS。Portfolio holdings are demo data; no database, login, trading, RAG, or news search is included.
