# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

**STEP 2.5：线上真实行情已完成。** GitHub Pages 保留静态前端，Finnhub Key 由 Cloudflare Worker 服务端读取；首页关注卡片、Watchlist 和股票详情支持 NVDA、AAPL、TSLA、MSFT、AMZN，并在请求失败时回退到 Mock Data。AI Assistant 继续使用原有 Mock AI，STEP 3 等配置 `OPENAI_API_KEY` 后再继续。

## 开发阶段

- STEP 0：项目初始化（已完成）
- STEP 1：MVP UI 开发（假数据，已完成）
- STEP 2：GitHub Pages 静态网站部署（已采用）
- STEP 2.5：Cloudflare Worker 行情代理（已部署并通过公网验证）
- STEP 3：OpenAI API（待以后配置 OPENAI_API_KEY）
- STEP 5：用户系统和数据库
- STEP 6：个人 AI 投资助手

## 开发原则

- 以快速交付可用 MVP 为优先，按阶段逐步迭代。
- 保持实现简单，只在当前阶段确有需要时增加依赖和架构复杂度。
- 页面保留 Mock Data 回退与 Mock AI；OpenAI API 在 STEP 3 配置 Key 后再接入。
- 每个阶段完成后更新项目状态和后续计划。

## 当前功能

- Dashboard 首页、模拟投资组合收益曲线和 Market Open 状态
- NVDA、AAPL、TSLA、MSFT、AMZN 的实时行情、关注列表和股票详情；保留 Mock Data 回退
- 行情 Loading、失败状态和 Last updated 时间
- Light / Dark Mode，首次跟随系统主题并保存用户选择
- Portfolio 资产配置图、持仓和收益摘要
- AI Assistant 快捷问题、文字输入、加载动画和模拟回复
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

然后访问 http://localhost:3000。没有运行行情代理或 Finnhub 请求失败时，页面会继续显示 Mock Data。

## 行情代理部署

完成 Cloudflare Wrangler 登录后，在项目根目录运行：

```bash
node node_modules/wrangler/bin/wrangler.js deploy --config api-proxy/wrangler.jsonc --secrets-file api-proxy/.dev.vars
```

该本地忽略文件只含 Finnhub Key，用于将 Key 安全上传为 Worker Secret。把 Wrangler 返回的 Worker URL 设置为 GitHub 仓库变量 `MARKET_API_BASE_URL`，然后推送 `main` 触发 Pages 更新。

## 后续计划

完成 STEP 2.5 的 Cloudflare Worker 部署、GitHub Pages URL 配置和手机公网验证。STEP 3 暂缓，等配置 `OPENAI_API_KEY` 后再继续；在此之前 AI Assistant 使用 Mock AI。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
