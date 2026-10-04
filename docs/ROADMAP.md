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

## V5 第一阶段：国产 OpenAI-Compatible AI API

已完成通用 Worker Chat Completions 路由、个人上下文装配、Thinking / API unavailable / 模型状态和 Mock fallback。线上使用智谱 `glm-4-flash-250414`，API Key 保存在 Worker Secret，真实对话已验收。

## V5.2：首页 Daily Brief 真实生成

已将首页 Daily Brief 接入现有 GLM Worker。用户手动生成时使用 Watchlist、Portfolio、Finnhub 当前报价、Massive 1M 历史摘要、Investment Memory 和 Investment Notes；成功结果与生成时间写入本机 localStorage，刷新时不自动重复请求。失败重试一次，保留上次成功内容或显示友好提示。

## V6：Supabase Auth 与个人数据跨设备同步

前端与独立数据表/RLS setup 已实现，继续使用现有 `lanlan-cloud-pet` Supabase Project。登录用户从 Supabase 同步 Watchlist、Portfolio、Investment Memory、Investment Notes；访客保留 localStorage。需先执行 `supabase/v6-setup.sql` 并配置公开 Project URL 与 publishable/anon key，再完成认证、导入、RLS、AI context 和跨设备验收。

## STEP 6：个人 AI 投资助手

在行情、用户数据和 AI 能力基础上迭代个人化投资研究体验。
