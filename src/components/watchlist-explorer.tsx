"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { StockRow } from "@/components/stock-row";
import { MarketDataStatusMessage, MarketHistoryStatusMessage } from "@/components/market-data-status";
import { useStockMarketData } from "@/hooks/use-stock-market-data";

export function WatchlistExplorer() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const marketData = useStockMarketData(true);
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return marketData.stocks.filter((stock) => stock.symbol.toLowerCase().includes(value) || stock.name.toLowerCase().includes(value));
  }, [marketData.stocks, query]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <>
      <div className="watchlist-toolbar">
        <label className="search-field">
          <Icon name="search" size={17} />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbols or companies" aria-label="Search watchlist" />
          <span className="search-shortcut">⌘ K</span>
        </label>
        <div className="watchlist-count"><span className="live-dot" /> {marketData.stocks.length} companies tracked</div>
      </div>
      <section className="card watchlist-full-card">
        <div className="watchlist-table-head">
          <span>COMPANY</span><span>1M TREND</span><span>LAST PRICE</span><span />
        </div>
        {filtered.length > 0 ? filtered.map((stock) => <StockRow key={stock.symbol} stock={stock} history={marketData.history[stock.symbol]} />) : (
          <div className="empty-search"><Icon name="search" size={20} /><p>No matches for “{query}”</p><span>Try another symbol or company name.</span></div>
        )}
        <div className="watchlist-note">
          <MarketHistoryStatusMessage status={marketData.historyStatus} failedSymbols={marketData.failedHistorySymbols} error={marketData.historyError} />
          <MarketDataStatusMessage
            status={marketData.status}
            failedSymbols={marketData.failedSymbols}
            lastUpdated={marketData.lastUpdated}
          />
        </div>
      </section>
    </>
  );
}
