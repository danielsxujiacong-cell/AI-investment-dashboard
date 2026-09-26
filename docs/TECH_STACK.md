# 技术方案

| 类别 | 方案 | 状态 |
| --- | --- | --- |
| Frontend | Next.js 16 + TypeScript + App Router | 当前采用 |
| UI | Tailwind CSS 4 + custom CSS | 当前采用 |
| Charts | Inline SVG charts | MVP 当前采用；TradingView Lightweight Charts 可后续评估 |
| Database | Supabase | 未来接入 |
| AI | OpenAI API | 未来接入 |
| Stock Data | Polygon / Alpha Vantage | 未来接入 |
| Deployment | Vercel | STEP 2 计划采用 |

当前版本只使用本地 Mock Data；不接入真实行情 API、OpenAI API、Supabase、登录或交易功能。收益曲线和资产配置图使用轻量 SVG / CSS，没有额外图表库。
