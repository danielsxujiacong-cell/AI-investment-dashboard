import type { Metadata } from "next";
import { WatchlistExplorer } from "@/components/watchlist-explorer";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-heading page-heading-stock-universe">
        <div>
          <span className="eyebrow">YOUR MARKET RADAR</span>
          <h1>Watchlist<span className="heading-period">.</span></h1>
          <p>Manage your list and discover actively traded US stocks.</p>
        </div>
        <div className="watchlist-page-badge"><span className="live-dot" /> STOCK UNIVERSE <span className="badge-separator">/</span> MASSIVE REFERENCE DATA</div>
      </div>
      <WatchlistExplorer />
      <div className="watchlist-page-footnote"><span>↗</span> Search uses Massive reference data. Live quotes are limited to your Watchlist; history loads when you open a stock.</div>
    </div>
  );
}
