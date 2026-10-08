# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

**当前版本：V6.1 已实现并部署；账号级缓存验收待补。** 本版本完成详情路由、Daily Brief 账号缓存隔离与首页/文案精简；双账号实际切换及 Brief 生成需在已配置 Supabase 与 Worker 的登录会话中复测。

## 开发阶段

- STEP 0：项目初始化（已完成）
- STEP 1：MVP UI 开发（假数据，已完成）
- STEP 2：GitHub Pages 静态网站部署（已采用）
- STEP 2.5：Cloudflare Worker 行情代理（已部署并通过公网验证）
- V4：Personal Investment System（本机 localStorage fallback）
- V5：真实 GLM AI Assistant ✅
- V5.1：连续对话稳定性 ✅
- V5.2：真实 AI Daily Brief ✅
- V5.3：Stock Universe 与动态 Watchlist ✅
- V5.4：Real Fundamentals / 去除明显 Mock ✅
- V6：Supabase Auth 与跨设备个人数据同步 ✅
- V6.1：Quality & UX Polish（实现与部署完成；账号级实测待补）

## 开发原则

- 以快速交付可用 MVP 为优先，按阶段逐步迭代。
- 保持实现简单，只在当前阶段确有需要时增加依赖和架构复杂度。
- 报价保留明确标注的回退状态，历史图表不回退到模拟曲线；Assistant API 出错时使用本地 fallback，Daily Brief 保留当前账号上次成功内容或显示友好提示。AI Key 只放入 Worker Secret，绝不写入前端或 GitHub。
- 每个阶段完成后更新项目状态和后续计划。

## 当前功能

- Dashboard 首页用本地持仓数量与真实历史收盘价计算一个月持仓价值趋势；没有持仓或历史接口不可用时显示空态
- Stock Universe 搜索、动态 Watchlist 与股票详情；详情链接通过共享路由 helper 兼容原有静态股票页和新股票查询页
- Overview / Watchlist 的真实一个月 mini chart；详情页按需请求 Massive 真实 OHLC K 线和 1D / 1W / 1M / 3M / 1Y 周期
- 详情页按需读取 Finnhub Market Cap、TTM P/E 和 52 周区间；不可用字段明确标为 N/A / Unavailable，缺少 52 周字段时用 Massive 1Y 真实日线计算
- 行情来源、Loading、限流和 Last updated 状态；历史 API 失败时优先显示真实缓存并自动延迟重试，不伪造价格曲线
- Light / Dark Mode，首次跟随系统主题并保存用户选择
- Portfolio 新增、编辑和删除个人持仓；按 Finnhub 当前价格计算市值、成本和未实现盈亏
- 股票详情中的个人 Investment Memory，以及可新增、编辑和删除的 Investment Notes
- AI Assistant 保留快捷问题；配置 API 后发送个人上下文进行真实对话，显示 Thinking、API unavailable 和模型名称，失败时使用明确标记的本地 fallback
- 首页 Daily Brief 可手动生成/刷新，按 Market Overview、Opportunities、Risks、Watchlist Focus、Portfolio Note 展示 GLM 简报；按 Supabase user ID 或访客命名空间缓存，过期简报标注原日期
- 未登录时个人投资数据保存在当前设备的 localStorage；登录后 Watchlist、Portfolio、Investment Memory、Investment Notes 从 Supabase 读取并写入
- 首次登录时，只有四张云表全空且本地有数据才显示 “Import local data”；确认导入后本地副本保留
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

登录后 AI Assistant 与 Daily Brief 使用当前 Supabase 数据；未登录时使用本地数据。数据在刷新时从云端同步，当前不使用 Realtime。后续方向（Future，不在本次范围）：AI 联网新闻/财报/实时事件、更完整的 Portfolio Health、Daily/Morning Brief 自动化。

## Supabase V6 数据与同步

继续复用现有 `lanlan-cloud-pet` Supabase Project。已执行 [`supabase/v6-setup.sql`](supabase/v6-setup.sql)，为本应用创建独立表 `investment_watchlist`、`investment_portfolio`、`investment_memories`、`investment_notes`；每张表的 RLS policy 使用 `auth.uid() = user_id`。登录后 Supabase 是主数据源，未登录时使用 localStorage；首次登录仅在云端四类数据全空时提供确认导入。本地数据导入后保留作备份。多设备在刷新时同步，当前不需要 Realtime。

线上 GitHub Actions Repository Variables 已配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

本地开发如需测试云同步，可在被 `.gitignore` 排除的 `.env.local` 中配置同名变量。浏览器只使用 Project URL 与 publishable key；`service_role`、数据库密码和 AI/Finnhub/Massive secrets 不进入前端。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
