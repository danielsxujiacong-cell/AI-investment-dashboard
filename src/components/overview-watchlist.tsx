"use client";

import Link from "next/link";
import { MarketDataStatusMessage, MarketHistoryStatusMessage } from "@/components/market-data-status";
import { Icon } from "@/components/icons";
import { SectionHeading, StockRow } from "@/components/stock-row";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import { useWatchlist } from "@/hooks/use-watchlist";

export function OverviewWatchlist() {
  const marketData = useStockMarketData(true);
  const watchlist = useWatchlist();

  return (
    <section className="card watchlist-card">
      <div className="card-section-header">
        <SectionHeading eyebrow="YOUR MARKET RADAR" title="Watchlist" action={<Link href="/watchlist" className="subtle-link">See all <Icon name="arrow-right" size={14} /></Link>} />
        <span className={"watchlist-live overview-live-status market-state-" + marketData.status}>
          <i className="live-dot" />
          {marketData.status === "loading" ? "LOADING" : marketData.status === "live" ? "LIVE QUOTES" : marketData.status === "partial" ? "PARTIAL" : "MOCK DATA"}
        </span>
      </div>
      <div className="watchlist-rows">
        {marketData.stocks.slice(0, 8).map((stock) => <StockRow key={stock.symbol} stock={stock} history={marketData.history[stock.symbol]} onRemove={watchlist.remove} />)}
        {marketData.stocks.length === 0 && <div className="overview-watchlist-empty">Your Watchlist is empty. Add a stock from Watchlist.</div>}
      </div>
      <MarketHistoryStatusMessage status={marketData.historyStatus} failedSymbols={marketData.failedHistorySymbols} />
      <MarketDataStatusMessage
        status={marketData.status}
        failedSymbols={marketData.failedSymbols}
        lastUpdated={marketData.lastUpdated}
        className="overview-market-status"
      />
      <Link href="/watchlist" className="watchlist-footer-link"><span><Icon name="plus" size={15} /> View all companies</span><Icon name="arrow-right" size={15} /></Link>
    </section>
  );
}
