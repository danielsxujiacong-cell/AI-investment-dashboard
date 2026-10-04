# 开发路线

## STEP 0：项目初始化

已完成项目规划、基础目录结构和开发规范建立。

## STEP 1：MVP UI 开发（假数据）

已完成具有 Apple 与 Linear 风格的深色投资 Dashboard，使用假数据支持首页、关注列表、股票详情、AI 对话、组合和每日简报，并验证桌面与手机布局。

## STEP 2：静态网站部署上线

GitHub Pages 保留为静态前端部署目标。

## STEP 2.5：线上真实行情 API

Cloudflare Worker API Proxy 与 GitHub Pages 前端均已部署；Finnhub 继续提供当前报价，Massive 通过 Worker 提供历史 OHLC。两把 Key 仅由 Worker 服务端读取。Overview、Watchlist 和详情页保留 Finnhub 报价 Mock 回退，历史图表只用真实 Massive 数据。

## V3 及主题模式

V1–V3 现有产品结构保留。AI Assistant 已通过 Cloudflare Worker 接入 OpenAI-Compatible Chat Completions；接口不可用时继续回退 Mock AI。Light / Dark Mode 已加入，首次访问跟随系统偏好，用户选择保存在浏览器本地。

## V4：Personal Investment System

已完成可编辑的本地持仓、基于 Finnhub 行情的持仓估值与未实现盈亏、每只股票的 Investment Memory、Investment Notes，以及引用这些本机数据的 Mock AI Personal Context。数据保存在当前设备的 localStorage，不跨设备同步；V4 不接入 OpenAI API、Supabase、登录或自动交易。

## V5：真实 GLM AI Assistant ✅

已完成通用 Worker Chat Completions 路由、个人上下文装配、Thinking / API unavailable / 模型状态和 Mock fallback。线上使用智谱 `glm-4-flash-250414`，API Key 保存在 Worker Secret，真实对话已验收。

## V5.1：连续对话稳定性 ✅

多轮 Assistant 对话稳定性已验收。

## V5.2：真实 AI Daily Brief ✅

首页 Daily Brief 使用现有 GLM Worker。手动生成时使用当前 Watchlist、Portfolio、Finnhub 报价、Massive 1M 历史摘要、Investment Memory 和 Investment Notes；成功结果及时间写入本机 localStorage。失败重试一次并保留上次成功内容。

## V5.3：Stock Universe 与动态 Watchlist ✅

已完成 Massive Stock Universe 搜索和动态 Watchlist；Overview、市场数据请求与个人上下文使用当前 Watchlist。

## V5.4：Real Fundamentals / 去除明显 Mock ✅

详情页 fundamentals 使用 Finnhub 数据；52 周区间在 Finnhub 字段缺失时由 Massive 1Y 日线计算，并标示真实来源或不可用状态。

## V6：Supabase Auth 与跨设备个人数据同步 ✅

继续复用现有 `lanlan-cloud-pet` Supabase Project。四张独立表为 `investment_watchlist`、`investment_portfolio`、`investment_memories`、`investment_notes`；RLS 限制为 `auth.uid() = user_id`。登录后 Supabase 是主数据源，访客继续使用 localStorage。首次登录仅在云端四类数据全部为空时提供用户确认导入，导入后本地副本保留。用户已人工验收登录、导入、四类数据 CRUD、退出重登及跨设备刷新同步。AI Assistant 与 Daily Brief 使用当前同步数据；当前刷新后同步，不启用 Realtime。Finnhub、Massive 和 AI API Secret 架构未改变。

## Future（未开发）

- AI 联网新闻、财报与实时事件
- 更完整的 Portfolio Health
- Daily / Morning Brief 自动化
