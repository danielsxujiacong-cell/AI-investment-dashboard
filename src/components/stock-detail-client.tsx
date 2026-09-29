"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PerformanceChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { MarketDataStatusMessage } from "@/components/market-data-status";
import { InvestmentMemoryEditor } from "@/components/investment-memory-editor";
import { useMarketHistory } from "@/hooks/use-market-history";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import { formatHistoryTimestamp, marketHistoryRanges, type MarketHistoryRange } from "@/data/market-history";
import type { Stock } from "@/data/stocks";

export function StockDetailClient({ initialStock }: { initialStock: Stock }) {
  const marketData = useStockMarketData();
  const stock = marketData.stocks.find((item) => item.symbol === initialStock.symbol) ?? initialStock;
  const [range, setRange] = useState<MarketHistoryRange>("1M");
  const historical = useMarketHistory(stock.symbol, range);
  const points = historical.points;
  const firstClose = points[0]?.close;
  const lastClose = points[points.length - 1]?.close;
  const rangeChange = firstClose !== undefined && lastClose !== undefined ? lastClose - firstClose : null;
  const rangePercent = rangeChange !== null && firstClose ? (rangeChange / firstClose) * 100 : null;
  const chartPositive = rangeChange === null ? undefined : rangeChange >= 0;
  const axisLabels = useMemo(() => {
    if (points.length < 2) return [];
    const indices = [...new Set([0, 0.25, 0.5, 0.75, 1].map((fraction) =>
      Math.round((points.length - 1) * fraction),
    ))];
    return indices.map((index) => formatHistoryTimestamp(points[index].timestamp, range));
  }, [points, range]);
  const quotePositive = stock.changePercent >= 0;

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
          <span className={quotePositive ? "positive-text" : "negative-text"}>{quotePositive ? "+" : ""}{stock.change.toFixed(2)} ({quotePositive ? "+" : ""}{stock.changePercent.toFixed(2)}%) today</span>
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
          <div className="chart-range-group" role="group" aria-label="Historical price range">
            {marketHistoryRanges.map((item) => (
              <button
                type="button"
                key={item}
                className={range === item ? "selected" : ""}
                aria-pressed={range === item}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="stock-chart-value">
          <span>{"$" + stock.price.toFixed(2)}</span>
          <span className={chartPositive === undefined ? "" : chartPositive ? "positive-text" : "negative-text"}>
            {rangePercent === null ? "—" : (rangePercent >= 0 ? "+" : "") + rangePercent.toFixed(2) + "%"} {range}
          </span>
        </div>
        {historical.status === "loading" ? (
          <div className="chart-empty" role="status">Loading real Finnhub historical prices…</div>
        ) : historical.status === "error" ? (
          <div className="chart-empty chart-error" role="alert">{historical.error}</div>
        ) : (
          <>
            <PerformanceChart
              data={points.map((point) => point.close)}
              isPositive={chartPositive}
              label={stock.symbol + " real historical closing prices for " + range}
            />
            <div className="chart-x-axis">{axisLabels.map((label, index) => <span key={index}>{label}</span>)}</div>
          </>
        )}
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
