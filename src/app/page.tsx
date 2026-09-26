import Link from "next/link";
import { PerformanceChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { MarketBriefCard } from "@/components/market-brief-card";
import { SectionHeading, StockRow } from "@/components/stock-row";
import { portfolio } from "@/data/portfolio";
import { stocks } from "@/data/stocks";

export default function DashboardPage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL WORKSPACE <span className="eyebrow-divider">·</span> SEPTEMBER 26, 2026</span>
          <h1>AI Investment Dashboard</h1>
          <p>Your personal AI investing workspace.</p>
        </div>
        <Link href="/assistant" className="primary-button heading-cta"><Icon name="sparkles" size={16} /> Ask your AI</Link>
      </div>

      <section className="overview-card card">
        <div className="overview-main">
          <div className="overview-card-top">
            <div>
              <span className="eyebrow">TOTAL PORTFOLIO</span>
              <div className="portfolio-value">$128,420<span>.32</span></div>
            </div>
            <div className="overview-date"><span className="live-dot" /> SIMULATED DATA</div>
          </div>
          <div className="overview-change-row">
            <span className="change-pill"><Icon name="arrow-up-right" size={14} /> +$1,240.18</span>
            <span className="change-percent">+0.98%</span>
            <span className="change-period">today</span>
          </div>
          <div className="overview-chart-wrap">
            <PerformanceChart data={portfolio.history} label="Simulated portfolio performance trend" />
            <div className="chart-x-axis"><span>SEP 01</span><span>SEP 08</span><span>SEP 15</span><span>SEP 22</span><span>TODAY</span></div>
          </div>
          <div className="overview-bottom">
            <div><span className="overview-bottom-icon"><Icon name="activity" size={16} /></span><span>Up <strong>6.4%</strong> this month</span></div>
            <Link href="/portfolio" className="text-action">View portfolio <Icon name="arrow-right" size={15} /></Link>
          </div>
        </div>
        <aside className="overview-aside">
          <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
          <div className="aside-topline"><span>PORTFOLIO HEALTH</span><Icon name="more" size={17} /></div>
          <div className="health-score"><strong>82</strong><span>/ 100</span></div>
          <div className="health-status"><i /> Balanced growth</div>
          <div className="health-divider" />
          <p>Your portfolio is trending higher, with technology exposure driving most of today’s movement.</p>
          <Link href="/assistant?prompt=What%20are%20today%27s%20portfolio%20risks" className="aside-link">Explore portfolio risks <Icon name="arrow-up-right" size={14} /></Link>
        </aside>
      </section>

      <div className="dashboard-grid">
        <section className="card watchlist-card">
          <div className="card-section-header">
            <SectionHeading eyebrow="YOUR MARKET RADAR" title="Watchlist" action={<Link href="/watchlist" className="subtle-link">See all <Icon name="arrow-right" size={14} /></Link>} />
            <span className="watchlist-live"><i className="live-dot" /> MARKET OPEN</span>
          </div>
          <div className="watchlist-rows">
            {stocks.map((stock) => <StockRow key={stock.symbol} stock={stock} />)}
          </div>
          <Link href="/watchlist" className="watchlist-footer-link"><span><Icon name="plus" size={15} /> View all companies</span><Icon name="arrow-right" size={15} /></Link>
        </section>

        <MarketBriefCard />
      </div>

      <div className="dashboard-bottom-line">
        <div><span className="bottom-line-icon"><Icon name="shield" size={17} /></span><div><strong>Built for perspective, not prediction.</strong><span>All figures shown here are illustrative mock data.</span></div></div>
        <Link href="/portfolio" className="bottom-line-action">Review allocations <Icon name="arrow-right" size={14} /></Link>
      </div>
    </div>
  );
}
