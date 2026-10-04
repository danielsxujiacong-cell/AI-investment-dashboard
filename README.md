# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

**V5.4 Real Fundamentals 已接入股票详情页。** 打开详情时，Cloudflare Worker 才请求 Finnhub Company Profile 2 与 Basic Financials；Market Cap、P/E、52 Week High/Low 显示真实来源或明确的 Unavailable。Finnhub 没有提供 52 周区间时，复用 Massive 1Y 日线缓存计算；API Key 继续保留在 Worker Secret。V5.2 Daily Brief 与 AI Assistant 继续通过 Worker 调用智谱 `glm-4-flash-250414`；Brief 使用 Watchlist、Portfolio、Finnhub 报价、Massive 历史摘要、Investment Memory 和 Investment Notes。个人投资数据仍保存在当前设备。

## 开发阶段

- STEP 0：项目初始化（已完成）
- STEP 1：MVP UI 开发（假数据，已完成）
- STEP 2：GitHub Pages 静态网站部署（已采用）
- STEP 2.5：Cloudflare Worker 行情代理（已部署并通过公网验证）
- V4：Personal Investment System（已完成，本机 localStorage）
- V5 第一阶段：供应商中立的 OpenAI-Compatible AI API 接入（智谱 `glm-4-flash-250414`；真实对话已验收）
- V5.2：首页 Daily Brief 真实 AI 生成与本机当日缓存
- V5.4：详情页真实基础指标与 52 周区间回退计算
- STEP 5：用户系统和数据库
- STEP 6：个人 AI 投资助手

## 开发原则

- 以快速交付可用 MVP 为优先，按阶段逐步迭代。
- 保持实现简单，只在当前阶段确有需要时增加依赖和架构复杂度。
- 报价保留 Mock Data 回退，历史图表不回退到模拟曲线；Assistant AI API 出错时回退 Mock，Daily Brief 保留上次成功内容或显示友好提示。AI Key 只放入 Worker Secret，绝不写入前端或 GitHub。
- 每个阶段完成后更新项目状态和后续计划。

## 当前功能

- Dashboard 首页用本地持仓数量与真实历史收盘价计算一个月持仓价值趋势；没有持仓或历史接口不可用时显示空态
- NVDA、AAPL、TSLA、MSFT、AMZN 的实时行情、关注列表和股票详情；报价保留 Mock Data 回退
- Overview / Watchlist 的真实一个月 mini chart；详情页按需请求 Massive 真实 OHLC K 线和 1D / 1W / 1M / 3M / 1Y 周期
- 详情页按需读取 Finnhub Market Cap、TTM P/E 和 52 周区间；不可用字段明确标为 N/A / Unavailable，缺少 52 周字段时用 Massive 1Y 真实日线计算
- 行情来源、Loading、限流和 Last updated 状态；历史 API 失败时优先显示真实缓存并自动延迟重试，不伪造价格曲线
- Light / Dark Mode，首次跟随系统主题并保存用户选择
- Portfolio 新增、编辑和删除个人持仓；按 Finnhub 当前价格计算市值、成本和未实现盈亏
- 股票详情中的个人 Investment Memory，以及可新增、编辑和删除的 Investment Notes
- AI Assistant 保留原页面与快捷问题；配置 API 后发送个人上下文进行真实对话，显示 Thinking、API unavailable 和模型名称，失败时回退 Mock
- 首页 Daily Brief 可手动生成/刷新，按 Market Overview、Opportunities、Risks、Watchlist Focus、Portfolio Note 展示真实 GLM 简报；展示 Last generated 时间并缓存成功结果
- 个人投资数据保存在当前设备的 localStorage，不会跨电脑或手机同步
- 可展开的每日 AI 市场简报
- 桌面侧边栏与手机底部导航

## 本地运行

需要 Node.js 20.9 或更高版本。将 `MASSIVE_API_KEY` 写入项目本地 `.env.local`；如需本地实时报价，再加入 `FINNHUB_API_KEY`。`.env.local` 已由 `.gitignore` 排除；AI Key 只配置为 Cloudflare Worker Secret。

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

将 `AI_API_KEY` 配置为 Cloudflare Worker Secret（不要放进 `.env`、源码或仓库）；`AI_BASE_URL` 和 `AI_MODEL` 是可切换的 Worker variables。保留现有 `FINNHUB_API_KEY`、`MASSIVE_API_KEY` Worker Secrets。部署命令和 `.dev.vars` 均保持在本机，不要把 API Key 写入仓库或 GitHub Pages。把 Worker URL 设置为 GitHub 仓库变量 `MARKET_API_BASE_URL`，然后推送 `main` 触发 Pages 更新。

## 后续计划

个人数据仍保存在设备本地；每次发送时仅按请求转发给配置的 AI 服务。当前不包含联网搜索、新闻抓取、自动投资、定时任务、Supabase、登录或跨设备同步。真实智谱 AI 对话已通过线上 Worker 验收。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
