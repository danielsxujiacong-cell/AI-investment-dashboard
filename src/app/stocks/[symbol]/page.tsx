import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PerformanceChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { getStock, stocks } from "@/data/stocks";

export function generateStaticParams() {
  return stocks.map((stock) => ({ symbol: stock.symbol }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const stock = getStock(symbol);
  return { title: stock ? stock.symbol + " · " + stock.name : "Stock details" };
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = getStock(symbol);
  if (!stock) notFound();

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
    </div>
  );
}
