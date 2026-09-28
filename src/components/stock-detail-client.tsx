"use client";

import Link from "next/link";
import { PerformanceChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { MarketDataStatusMessage } from "@/components/market-data-status";
import { InvestmentMemoryEditor } from "@/components/investment-memory-editor";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import type { Stock } from "@/data/stocks";

export function StockDetailClient({ initialStock }: { initialStock: Stock }) {
  const marketData = useStockMarketData();
  const stock = marketData.stocks.find((item) => item.symbol === initialStock.symbol) ?? initialStock;
  const positive = stock.changePercent >= 0;

  return (
    <div className="page-stack page-enter stock-detail-page">
      <Link href="/watchlist" className="back-link"><Icon name="arrow-left" size={16} /> Back to watchlist</Link>

      <div className="stock-detail-heading">
        <div className="stock-detail-identity">
          <div className={"stock-detail-monogram monogram-" + stock.symbol}>{stock.symbol.slice(0, 1)}</div>
          <div><div className="stock-symbol-line"><h1>{stock.symbol}</h1><span className="sector-chip">{stock.sector}</span></div><p>{stock.name}</p></div>
        </div>
        <div className="stock-detail-price">
          <strong>{"$" + stock.price.toFixed(2)}</strong>
          <span className={positive ? "positive-text" : "negative-text"}>{positive ? "+" : ""}{stock.change.toFixed(2)} ({positive ? "+" : ""}{stock.changePercent.toFixed(2)}%) today</span>
          <MarketDataStatusMessage
            status={marketData.status}
            failedSymbols={marketData.failedSymbols}
            lastUpdated={marketData.lastUpdated}
            className="market-data-status-detail"
          />
        </div>
      </div>

      <section className="card stock-chart-card">
        <div className="panel-heading">
          <div><span className="eyebrow">PRICE PERFORMANCE</span><h2>Price history</h2></div>
          <div className="chart-range-group"><span className="selected">1 MONTH</span></div>
        </div>
        <div className="stock-chart-value"><span>{"$" + stock.price.toFixed(2)}</span><span className={positive ? "positive-text" : "negative-text"}>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</span></div>
        <PerformanceChart data={stock.history} label={stock.symbol + " simulated one month price history"} />
        <div className="chart-x-axis"><span>SEP 01</span><span>SEP 08</span><span>SEP 15</span><span>SEP 22</span><span>TODAY</span></div>
      </section>

      <div className="stock-metric-grid">
        <div className="card stock-metric-card"><span className="eyebrow">OPEN</span><strong>{"$" + stock.open.toFixed(2)}</strong><span>Today</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">HIGH</span><strong>{"$" + stock.high.toFixed(2)}</strong><span>Today</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">LOW</span><strong>{"$" + stock.low.toFixed(2)}</strong><span>Today</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">PREVIOUS CLOSE</span><strong>{"$" + stock.previousClose.toFixed(2)}</strong><span>Last session</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">MARKET CAP</span><strong>{stock.marketCap}</strong><span>Simulated snapshot</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">PRICE / EARNINGS</span><strong>{stock.peRatio}<small>x</small></strong><span>Trailing estimate</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">52 WEEK HIGH</span><strong>{"$" + stock.weekHigh.toFixed(2)}</strong><span>52 week range</span></div>
        <div className="card stock-metric-card"><span className="eyebrow">52 WEEK LOW</span><strong>{"$" + stock.weekLow.toFixed(2)}</strong><span>52 week range</span></div>
      </div>

      <section className="card ai-insight-card">
        <div className="ai-insight-icon"><Icon name="sparkles" size={19} /></div>
        <div className="ai-insight-content">
          <div className="ai-insight-heading"><span className="eyebrow">AI INSIGHT</span><span className="mock-label"><i /> MOCK ANALYSIS</span></div>
          <p>“{stock.insight}”</p>
          <span className="ai-insight-disclaimer">Generated from product mock data. Not investment advice.</span>
        </div>
        <Link href={"/assistant?prompt=" + encodeURIComponent("Analyze " + stock.symbol)} className="primary-button ask-stock-button">Ask AI about {stock.symbol} <Icon name="arrow-up-right" size={15} /></Link>
      </section>

      <div className="stock-about"><span className="eyebrow">ABOUT {stock.symbol}</span><p>{stock.description}</p></div>
      <InvestmentMemoryEditor symbol={stock.symbol} />
    </div>
  );
}
