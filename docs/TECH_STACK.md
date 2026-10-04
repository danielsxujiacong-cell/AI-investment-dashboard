# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG close-price charts and OHLC candlesticks from Massive | Overview / Watchlist 1M; details 1D / 1W / 1M / 3M / 1Y; no mock history fallback |
| Database | Supabase | 复用现有 `lanlan-cloud-pet` Project；V6 四张独立表已创建，RLS 使用 `auth.uid() = user_id`，线上配置已启用 |
| AI | OpenAI-Compatible Chat Completions via Cloudflare Worker | Zhipu `glm-4-flash-250414`; `AI_API_KEY` Worker Secret; Daily Brief retries once and keeps the last successful result |
| Stock Data | Finnhub quotes and Massive history via Cloudflare Worker | Finnhub supplies current quotes; Massive supplies historical OHLC. API keys stay in server-only Worker secrets. |
| UI Theme | CSS theme tokens + localStorage | Light / Dark，可首次跟随系统偏好 |
| Personal Data | Supabase Auth/PostgREST + versioned localStorage fallback | 登录后同步 Watchlist、Portfolio、Investment Memory、Investment Notes；访客保留本机模式 |
| Deployment | GitHub Pages + Cloudflare Workers | 静态站与行情 Proxy 均已部署 |

市场价格由 Finnhub 当前报价与 Massive 历史 OHLC 提供。所有市场与 AI 供应商凭证均留在 Worker 服务端；AI 通过标准 `/chat/completions` 端点转发，不引入供应商 SDK。Assistant 按请求转发当前个人 Portfolio、Watchlist、Investment Memory、Investment Notes 与行情上下文；Assistant API 不可用时保留现有 Mock 回退。首页 Daily Brief 手动生成时还会发送 Massive 1M 历史摘要，成功后按本地日期保存在 localStorage；失败重试一次并保留最近成功简报。Supabase 的客户端只使用公开 URL 与 publishable/anon key，并由 RLS 限制用户数据；不使用 service_role。
