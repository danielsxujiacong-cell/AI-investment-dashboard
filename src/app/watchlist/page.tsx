import type { Metadata } from "next";
import { WatchlistExplorer } from "@/components/watchlist-explorer";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR MARKET RADAR</span>
          <h1>Watchlist<span className="heading-period">.</span></h1>
          <p>A focused view of the companies on your mind.</p>
        </div>
        <div className="watchlist-page-badge"><span className="live-dot" /> 5 symbols <span className="badge-separator">/</span> Finnhub with Mock fallback</div>
      </div>
      <WatchlistExplorer />
      <div className="watchlist-page-footnote"><span>↗</span> Finnhub quotes are used when available; existing Mock Data remains the fallback.</div>
    </div>
  );
}
