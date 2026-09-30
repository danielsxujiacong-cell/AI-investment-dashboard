# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

**V4.1 行情与 K 线稳定性优化已完成。** Portfolio 支持管理个人持仓，并用 Finnhub 当前报价计算市值、成本和未实现盈亏；股票详情可保存个人投资逻辑，Portfolio 可记录投资日志。AI Assistant 仍使用 Mock AI，可读取本机保存的持仓、投资记忆和现有 Watchlist。个人数据保存在当前设备的 localStorage，不会跨设备同步。Finnhub 负责当前报价，Massive 负责历史 OHLC；两个 Key 只由 Cloudflare Worker 服务端读取。Overview、Watchlist 和 Portfolio 使用真实历史收盘价，股票详情按所选周期请求真实 K 线；股票与周期数据在页面间共享，并在当前标签页的 sessionStorage 缓存 15 分钟（1D 缓存 30 秒），过期数据保留并在后台重新验证。遇到限流会优先显示真实缓存并自动延迟重试。免费 Stocks Basic 的历史聚合为 end-of-day 数据，可能比 Finnhub 当前报价晚一个或多个交易时段；页面分别标示数据来源。缺少缓存且历史接口暂不可用时显示友好状态，不绘制 Mock 曲线。

## 开发阶段

- STEP 0：项目初始化（已完成）
- STEP 1：MVP UI 开发（假数据，已完成）
- STEP 2：GitHub Pages 静态网站部署（已采用）
- STEP 2.5：Cloudflare Worker 行情代理（已部署并通过公网验证）
- V4：Personal Investment System（已完成，本机 localStorage）
- STEP 3：OpenAI API（仍暂缓；当前不连接外部 AI 服务）
- STEP 5：用户系统和数据库
- STEP 6：个人 AI 投资助手

## 开发原则

- 以快速交付可用 MVP 为优先，按阶段逐步迭代。
- 保持实现简单，只在当前阶段确有需要时增加依赖和架构复杂度。
- 报价保留 Mock Data 回退，历史图表不回退到模拟曲线；AI 继续使用 Mock AI。OpenAI API 在 STEP 3 配置 Key 后再接入。
- 每个阶段完成后更新项目状态和后续计划。

## 当前功能

- Dashboard 首页用本地持仓数量与真实历史收盘价计算一个月持仓价值趋势；没有持仓或历史接口不可用时显示空态
- NVDA、AAPL、TSLA、MSFT、AMZN 的实时行情、关注列表和股票详情；报价保留 Mock Data 回退
- Overview / Watchlist 的真实一个月 mini chart；详情页按需请求 Massive 真实 OHLC K 线和 1D / 1W / 1M / 3M / 1Y 周期
- 行情来源、Loading、限流和 Last updated 状态；历史 API 失败时优先显示真实缓存并自动延迟重试，不伪造价格曲线
- Light / Dark Mode，首次跟随系统主题并保存用户选择
- Portfolio 新增、编辑和删除个人持仓；按 Finnhub 当前价格计算市值、成本和未实现盈亏
- 股票详情中的个人 Investment Memory，以及可新增、编辑和删除的 Investment Notes
- AI Assistant 快捷问题、文字输入、加载动画和 Mock 回复；Personal Context 显示并可引用本地持仓、投资记忆和 Watchlist
- 个人投资数据保存在当前设备的 localStorage，不会跨电脑或手机同步
- 可展开的每日 AI 市场简报
- 桌面侧边栏与手机底部导航

## 本地运行

需要 Node.js 20.9 或更高版本。将 `MASSIVE_API_KEY` 写入项目本地 `.env.local`；如需本地实时报价，再加入 `FINNHUB_API_KEY`。`.env.local` 已由 `.gitignore` 排除。Massive Key 仅由本地 Worker 与部署后的 Cloudflare Worker读取，不进入前端。

```bash
npm install
node scripts/start-api-proxy.mjs
```

另开一个终端运行：

```bash
node node_modules/next/dist/bin/next dev
```

然后访问 http://localhost:3000。Finnhub 报价失败时会显示 Mock Data 回退；Massive 历史 candles 受限时会保留最近的真实缓存，未命中缓存时显示友好状态并延迟重试，不画模拟曲线。

## 行情代理部署

完成 Cloudflare Wrangler 登录后，在项目根目录运行：

```bash
node node_modules/wrangler/bin/wrangler.js deploy --config api-proxy/wrangler.jsonc --secrets-file api-proxy/.dev.vars
```

部署时将 `FINNHUB_API_KEY` 和 `MASSIVE_API_KEY` 分别作为 Worker Secrets 配置；部署命令和 `.dev.vars` 均保持在本机，不要把 API Key 写入仓库或 GitHub Pages。把 Worker URL 设置为 GitHub 仓库变量 `MARKET_API_BASE_URL`，然后推送 `main` 触发 Pages 更新。

## 后续计划

V4 已完成，继续保留 Mock AI、报价的 Finnhub Mock fallback、真实历史图表请求和设备本地数据存储。当前版本不启用 OpenAI API、登录、数据库或自动交易；个人数据不会跨设备同步。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
