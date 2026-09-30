# 产品说明

## 产品名称

AI-investment-dashboard

## 产品定位

AI Investment Dashboard，一个个人 AI 投资研究控制台

## MVP V1 目标

快速上线一个具有 Apple 风格 UI 的投资 Dashboard。

## 第一阶段功能

1. Dashboard 首页
2. 股票关注列表（假数据）
3. 股票详情页
4. AI 对话入口（模拟）
5. 投资组合展示
6. 每日 AI 市场简报

## 当前 V4 功能

- Overview、Watchlist 和股票详情通过 Cloudflare Worker 获取 Finnhub 实时报价，失败时回退到 Mock Data。历史 OHLC 通过同一 Worker 使用 Massive API 获取；历史请求失败时显示错误且不绘制模拟曲线。
- Portfolio 可新增、编辑、删除个人持仓，并按当前报价计算市值、成本和未实现盈亏。
- 股票详情中的 My Investment Memory 保存关注理由、买入逻辑、风险、退出条件和个人备注。
- Investment Notes 支持新增、编辑、删除，并按日期和更新时间排序。
- AI Assistant 支持通过 Cloudflare Worker 调用通用 OpenAI-Compatible 对话接口；发送时附带 Watchlist、Portfolio、真实 Finnhub 报价、Investment Memory 和 Investment Notes，接口失败时回退 Mock。
- 持仓、投资记忆和日志保存在当前设备 localStorage；用户发送消息时，该请求与投资上下文会转发到配置的 AI 服务。

每日市场简报和部分基本面仍使用产品 Mock Data。AI 通过 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 配置兼容服务；API Key 仅配置在 Cloudflare Worker Secret。V5 当前候选模型为百炼 `qwen-plus`，线上真实对话验收待 API Key 设置后进行。
