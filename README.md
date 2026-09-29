# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

**V4 Personal Investment System 已完成。** Portfolio 支持管理个人持仓，并用当前报价计算市值、成本和未实现盈亏；股票详情可保存个人投资逻辑，Portfolio 可记录投资日志。AI Assistant 仍使用 Mock AI，可读取本机保存的持仓、投资记忆和现有 Watchlist。个人数据保存在当前设备的 localStorage，不会跨设备同步。Finnhub Key 由 Cloudflare Worker 服务端读取。报价失败时保留 Mock Data；历史图表只显示真实 Finnhub candles，失败时显示错误，不绘制 Mock 曲线。当前 Worker 密钥访问 /stock/candle 返回 403（Premium Access Required），因此升级到支持 Stock Candles 的 Finnhub 套餐前，历史图表会显示不可用。

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
- Overview / Watchlist 的真实一个月 mini chart；详情页提供 1D / 1W / 1M / 3M / 1Y 历史区间（由 Finnhub 套餐决定是否可用）
- 行情 Loading、失败状态和 Last updated 时间；历史 API 失败时明确显示错误，不伪造价格曲线
- Light / Dark Mode，首次跟随系统主题并保存用户选择
- Portfolio 新增、编辑和删除个人持仓；按 Finnhub 当前价格计算市值、成本和未实现盈亏
- 股票详情中的个人 Investment Memory，以及可新增、编辑和删除的 Investment Notes
- AI Assistant 快捷问题、文字输入、加载动画和 Mock 回复；Personal Context 显示并可引用本地持仓、投资记忆和 Watchlist
- 个人投资数据保存在当前设备的 localStorage，不会跨电脑或手机同步
- 可展开的每日 AI 市场简报
- 桌面侧边栏与手机底部导航

## 本地运行

需要 Node.js 20.9 或更高版本，并在 `.env.local` 中配置 `FINNHUB_API_KEY`。

```bash
npm install
node scripts/start-api-proxy.mjs
```

另开一个终端运行：

```bash
node node_modules/next/dist/bin/next dev
```

然后访问 http://localhost:3000。Finnhub 报价失败时会显示 Mock Data 回退；历史 candles 失败时不会画模拟曲线，而会显示 API 错误。

## 行情代理部署

完成 Cloudflare Wrangler 登录后，在项目根目录运行：

```bash
node node_modules/wrangler/bin/wrangler.js deploy --config api-proxy/wrangler.jsonc --secrets-file api-proxy/.dev.vars
```

该本地忽略文件只含 Finnhub Key，用于将 Key 安全上传为 Worker Secret。把 Wrangler 返回的 Worker URL 设置为 GitHub 仓库变量 `MARKET_API_BASE_URL`，然后推送 `main` 触发 Pages 更新。

## 后续计划

V4 已完成，继续保留 Mock AI、报价的 Finnhub Mock fallback、真实历史图表请求和设备本地数据存储。当前版本不启用 OpenAI API、登录、数据库或自动交易；个人数据不会跨设备同步。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
