import type { Metadata } from "next";
import Link from "next/link";
import { AllocationDonut } from "@/components/charts";
import { Icon } from "@/components/icons";
import { allocations, portfolio } from "@/data/portfolio";
import { stocks } from "@/data/stocks";

export const metadata: Metadata = { title: "Portfolio" };

function money(value: number) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PortfolioPage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR INVESTMENT MIX</span>
          <h1>Portfolio<span className="heading-period">.</span></h1>
          <p>A clear view of how your capital is allocated.</p>
        </div>
        <div className="portfolio-asof"><span className="live-dot" /> SIMULATED SNAPSHOT</div>
      </div>

      <div className="portfolio-stat-grid">
        <section className="card portfolio-stat-card primary-stat">
          <span className="eyebrow">TOTAL VALUE</span>
          <strong>{money(portfolio.totalValue)}</strong>
          <span className="stat-foot"><i className="live-dot" /> Across 5 asset classes</span>
        </section>
        <section className="card portfolio-stat-card">
          <span className="eyebrow">TODAY’S GAIN</span>
          <strong className="positive-text">+{money(portfolio.todayGain)}</strong>
          <span className="stat-foot"><span className="stat-trend">↗</span> +{portfolio.todayPercent.toFixed(2)}% today</span>
        </section>
        <section className="card portfolio-stat-card">
          <span className="eyebrow">TOTAL RETURN</span>
          <strong className="positive-text">+{money(portfolio.totalReturn)}</strong>
          <span className="stat-foot"><span className="stat-trend">↗</span> +{portfolio.totalReturnPercent.toFixed(2)}% all time</span>
        </section>
      </div>

      <div className="portfolio-content-grid">
        <section className="card allocation-card">
          <div className="panel-heading">
            <div><span className="eyebrow">PORTFOLIO MIX</span><h2>Asset allocation</h2></div>
            <span className="period-chip">CURRENT</span>
          </div>
          <div className="allocation-visual">
            <AllocationDonut segments={allocations.map(({ weight, color }) => ({ weight, color }))} />
            <div className="allocation-legend">
              {allocations.map((item) => (
                <div key={item.symbol} className="allocation-legend-row">
                  <span className="legend-name"><i style={{ background: item.color }} />{item.name}</span>
                  <span>{item.weight}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="allocation-caption"><Icon name="activity" size={15} /> Technology accounts for <strong>85%</strong> of invested assets.</div>
        </section>

        <section className="card holdings-card">
          <div className="panel-heading">
            <div><span className="eyebrow">POSITIONS</span><h2>Holdings</h2></div>
            <span className="holdings-count">5 assets</span>
          </div>
          <div className="holdings-list">
            {allocations.map((item) => {
              const stock = stocks.find((entry) => entry.symbol === item.symbol);
              const content = (
                <>
                  <span className={"holding-symbol " + (item.symbol === "CASH" ? "cash-symbol" : "")} style={{ backgroundColor: item.color + "1a", color: item.color }}>{item.symbol === "CASH" ? "$" : item.symbol.slice(0, 1)}</span>
                  <span className="holding-company"><strong>{item.symbol}</strong><span>{item.name}</span></span>
                  <span className="holding-weight">{item.weight}%</span>
                  <span className="holding-value"><strong>{money(item.value)}</strong><span>{stock ? (stock.changePercent >= 0 ? "+" : "") + stock.changePercent.toFixed(2) + "%" : "Available"}</span></span>
                </>
              );
              return stock ? <Link key={item.symbol} href={"/stocks/" + item.symbol} className="holding-row">{content}<Icon name="chevron-right" size={15} /></Link> : <div key={item.symbol} className="holding-row">{content}<span className="holding-cash-tag">USD</span></div>;
            })}
          </div>
          <div className="holdings-note"><span className="live-dot" /> Position values are illustrative mock data.</div>
        </section>
      </div>

      <div className="portfolio-insight card">
        <div className="insight-icon"><Icon name="sparkles" size={19} /></div>
        <div><span className="eyebrow">A THOUGHT TO CONSIDER</span><p>Your simulated portfolio has a strong technology tilt. Diversification can help balance exposure across different market drivers.</p></div>
        <Link href="/assistant?prompt=What%20are%20today%27s%20portfolio%20risks" className="subtle-link">Ask AI <Icon name="arrow-up-right" size={14} /></Link>
      </div>
    </div>
  );
}
