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
- AI Assistant 继续使用 Mock AI；Personal Context 显示持仓、投资记忆和 Watchlist，并可在模拟回复中引用这些信息。
- 持仓、投资记忆和日志写入当前设备的 localStorage，不登录、不跨设备同步，也不发送给外部 AI 服务。

每日市场简报、部分基本面和 AI 回复仍使用产品 Mock Data。Overview、Watchlist 和 Portfolio 图表使用 Massive 的真实历史日线收盘价；股票详情显示真实 OHLC K 线，支持 1D、1W、1M、3M、1Y。Finnhub 仅负责当前报价；报价仍保留 Mock fallback。Massive API Key 仅配置在项目 `.env.local` 和 Cloudflare Worker Secret，不进入 Git 或静态前端。Massive Stocks Basic 免费套餐包含日线与分钟聚合历史数据，5 次 API 调用/分钟；历史数据为 end-of-day，页面要区分于 Finnhub 当前报价。
