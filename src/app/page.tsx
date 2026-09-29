import Link from "next/link";
import { Icon } from "@/components/icons";
import { MarketBriefCard } from "@/components/market-brief-card";
import { OverviewWatchlist } from "@/components/overview-watchlist";
import { OverviewPortfolioPerformance } from "@/components/overview-portfolio-performance";

export default function DashboardPage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h1>AI Investment Dashboard</h1>
          <p>Your personal AI investing workspace.</p>
        </div>
        <Link href="/assistant" className="primary-button heading-cta"><Icon name="sparkles" size={16} /> Ask your AI</Link>
      </div>

      <OverviewPortfolioPerformance />

      <div className="dashboard-grid">
        <OverviewWatchlist />

        <MarketBriefCard />
      </div>

      <div className="dashboard-bottom-line">
        <div><span className="bottom-line-icon"><Icon name="shield" size={17} /></span><div><strong>Built for perspective, not prediction.</strong><span>Quotes and historical charts use market data; AI insights remain illustrative.</span></div></div>
        <Link href="/portfolio" className="bottom-line-action">Review allocations <Icon name="arrow-right" size={14} /></Link>
      </div>
    </div>
  );
}
