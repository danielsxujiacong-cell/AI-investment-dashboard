# 开发路线

## STEP 0：项目初始化

已完成项目规划、基础目录结构和开发规范建立。

## STEP 1：MVP UI 开发（假数据）

已完成具有 Apple 与 Linear 风格的深色投资 Dashboard，使用假数据支持首页、关注列表、股票详情、AI 对话、组合和每日简报，并验证桌面与手机布局。

## STEP 2：静态网站部署上线

GitHub Pages 保留为静态前端部署目标。

## STEP 2.5：线上真实行情 API

Cloudflare Worker API Proxy 与 GitHub Pages 前端均已部署；五只股票的公网行情 API、关注列表和股票详情页已验证。Finnhub Key 仅由 Worker 服务端读取。Overview、Watchlist 和详情页使用实时行情并保留 Mock 回退。

## V3 及主题模式

V1–V3 现有产品结构保留，AI Assistant 继续使用 Mock AI，待以后配置 `OPENAI_API_KEY` 后再接入服务端 Responses API。Light / Dark Mode 已加入，首次访问跟随系统偏好，用户选择保存在浏览器本地。

## STEP 3：OpenAI API（待以后配置）

暂不接入 OpenAI API。保留当前 Mock AI 页面与回复逻辑；以后配置 OPENAI_API_KEY 后再继续。

## STEP 5：用户系统和数据库

引入用户身份认证与数据库，优先评估 Supabase。

## STEP 6：个人 AI 投资助手

在行情、用户数据和 AI 能力基础上迭代个人化投资研究体验。
