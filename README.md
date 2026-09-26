# AI-investment-dashboard

## 项目简介

一个长期迭代的个人 AI 投资研究控制台，第一版采用 Apple 与 Linear 风格的深色 Dashboard UI。

## 当前状态

当前 **STEP 1：MVP UI 开发已完成**。网站使用本地 Mock Data，可在桌面和手机浏览；没有接入真实行情、AI 或数据库服务。

## 开发阶段

- STEP 0：项目初始化（已完成）
- STEP 1：MVP UI 开发（假数据，已完成）
- STEP 2：网站部署上线（下一步）
- STEP 3：接入真实股票行情 API
- STEP 4：接入 OpenAI API
- STEP 5：用户系统和数据库
- STEP 6：个人 AI 投资助手

## 开发原则

- 以快速交付可用 MVP 为优先，按阶段逐步迭代。
- 保持实现简单，只在当前阶段确有需要时增加依赖和架构复杂度。
- STEP 1 使用假数据完成 UI；真实行情、AI API、用户系统和数据库按路线图分阶段接入。
- 每个阶段完成后更新项目状态和后续计划。

## 当前功能

- Dashboard 首页、模拟投资组合收益曲线和 Market Open 状态
- 可搜索的股票关注列表、mini sparkline 和股票详情页
- Portfolio 资产配置图、持仓和收益摘要
- AI Assistant 快捷问题、文字输入、加载动画和模拟回复
- 可展开的每日 AI 市场简报
- 桌面侧边栏与手机底部导航

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

然后访问 http://localhost:3000。当前所有行情、分析和收益数据均为模拟数据。

## 后续计划

下一步进入 STEP 2，在 Vercel 部署并完成线上验证；此阶段不接入真实数据或 AI 服务。

详见 [开发路线](docs/ROADMAP.md)、[产品说明](docs/PRODUCT.md) 和 [技术方案](docs/TECH_STACK.md)。
