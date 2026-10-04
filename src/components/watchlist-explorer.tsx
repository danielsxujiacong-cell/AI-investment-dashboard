"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { getStockDirectoryPage, type StockDirectoryPage } from "@/data/market-tickers";
import { popularTechStocks, stockDetailHref, type StockReference } from "@/data/stock-universe";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import { useWatchlist } from "@/hooks/use-watchlist";

function TrackingAction({
  reference,
  added,
  onAdd,
  onRemove,
}: {
  reference: StockReference;
  added: boolean;
  onAdd: (reference: StockReference) => void;
  onRemove: (symbol: string) => void;
}) {
  return added ? (
    <span className="stock-added-actions">
      <span className="stock-added-label">Added</span>
      <button type="button" className="stock-action-remove" onClick={() => onRemove(reference.symbol)}>Remove</button>
    </span>
  ) : (
    <button type="button" className="stock-action-add" onClick={() => onAdd(reference)}>
      <Icon name="plus" size={13} /> Add to Watchlist
    </button>
  );
}

export function WatchlistExplorer() {
  const [query, setQuery] = useState("");
  const [loadedSearch, setLoadedSearch] = useState("");
  const [directory, setDirectory] = useState<StockDirectoryPage>({ results: [], count: 0, nextCursor: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestVersion = useRef(0);
  const watchlist = useWatchlist();
  const marketData = useStockMarketData({ maxWatchlistSymbols: 30 });
  const addedSymbols = useMemo(() => new Set(watchlist.stocks.map((stock) => stock.symbol)), [watchlist.stocks]);
  const pendingQuery = query.trim();
  const effectiveSearch = pendingQuery.length >= 2 ? loadedSearch : "";
  const waitingForSearch = pendingQuery.length >= 2 && pendingQuery.toLowerCase() !== loadedSearch.toLowerCase();

  const loadPage = useCallback(async (search: string, cursor: string | null = null, append = false) => {
    const version = ++requestVersion.current;
    setError(null);
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const page = await getStockDirectoryPage(search, cursor);
      if (requestVersion.current !== version) return;
      setLoadedSearch(search);
      setDirectory((current) => {
        if (!append) return page;
        const seen = new Set(current.results.map((item) => item.symbol));
        return {
          ...page,
          results: [...current.results, ...page.results.filter((item) => !seen.has(item.symbol))],
        };
      });
    } catch (loadError) {
      if (requestVersion.current !== version) return;
      setError(loadError instanceof Error ? loadError.message : "The stock directory could not be loaded.");
    } finally {
      if (requestVersion.current === version) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      requestVersion.current += 1;
      return;
    }
    if (normalized.length < 2) {
      requestVersion.current += 1;
      return;
    }

    const timer = window.setTimeout(() => {
      void loadPage(normalized);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query, loadPage]);

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

  function loadMore() {
    if (directory.nextCursor && !loadingMore) {
      void loadPage(effectiveSearch.length >= 2 ? effectiveSearch : "", directory.nextCursor, true);
    }
  }

  function referenceFor(symbol: string, name: string, exchange: string | null = null): StockReference {
    return { symbol, name, exchange, market: "stocks" };
  }

  const trackedStocks = watchlist.stocks.map((stock) => {
    const quote = marketData.liveQuotes[stock.symbol];
    return {
      ...stock,
      price: quote?.price ?? 0,
      change: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
    };
  });

  const showsSearchHint = pendingQuery.length === 1;
  const resultHeading = pendingQuery.length >= 2 ? "Search results" : "Search stocks";

  return (
    <div className="stock-universe-layout">
      <section className="card watchlist-full-card stock-watchlist-card">
        <div className="stock-universe-section-heading">
          <div><span className="eyebrow">YOUR MARKET RADAR</span><h2>Your Watchlist</h2></div>
          <span className="watchlist-count"><i className="live-dot" /> {watchlist.stocks.length} tracked</span>
        </div>
        {trackedStocks.length > 0 ? (
          <div className="stock-watchlist-list">
            {trackedStocks.map((stock) => (
              <div className="stock-managed-row" key={stock.symbol}>
                <Link
                  href={stockDetailHref(referenceFor(stock.symbol, stock.name, stock.exchange ?? null))}
                  className="stock-managed-identity"
                >
                  <span className={"stock-monogram monogram-" + stock.symbol}>{stock.symbol.slice(0, 1)}</span>
                  <span className="stock-name-wrap"><strong>{stock.symbol}</strong><span>{stock.name}{stock.exchange ? " · " + stock.exchange : " · US stock"}</span></span>
                </Link>
                <Link
                  href={stockDetailHref(referenceFor(stock.symbol, stock.name, stock.exchange ?? null))}
                  className="stock-managed-price"
                  aria-label={"Open " + stock.symbol + " details"}
                >
                  <strong>{stock.price > 0 ? "$" + stock.price.toFixed(2) : "—"}</strong>
                  <span className={stock.price > 0 ? stock.changePercent >= 0 ? "positive-text" : "negative-text" : ""}>
                    {stock.price > 0 ? (stock.changePercent >= 0 ? "+" : "") + stock.changePercent.toFixed(2) + "%" : "Unavailable"}
                  </span>
                </Link>
                <button
                  type="button"
                  className="watchlist-remove-button stock-managed-remove-button"
                  aria-label={"Remove " + stock.symbol + " from Watchlist"}
                  title="Remove from Watchlist"
                  onClick={() => watchlist.remove(stock.symbol)}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="stock-universe-empty">Your Watchlist is empty. Add a stock from search or Popular Tech.</div>
        )}
        <p className="stock-watchlist-note">Prices and daily changes use Finnhub quotes; unavailable quotes show N/A. Open a stock to load its price history.</p>
      </section>

      <section className="stock-discover-section">
        <div className="stock-universe-section-heading">
          <div><span className="eyebrow">MASSIVE REFERENCE DATA</span><h2>Stock Universe</h2><p>Search active US stocks by ticker or company name.</p></div>
          <span className="watchlist-page-badge">Active US common stocks · searchable by ticker and name</span>
        </div>
        <div className="watchlist-toolbar stock-discover-toolbar">
          <label className="search-field">
            <Icon name="search" size={17} />
            <input ref={searchRef} value={query} onChange={(event) => { requestVersion.current += 1; setQuery(event.target.value); }} placeholder="Search NVDA or NVIDIA" aria-label="Search US stocks by ticker or company name" />
            <span className="search-shortcut">⌘ K</span>
          </label>
          <div className="watchlist-count"><span className="live-dot" /> Search results contain ticker reference data only</div>
        </div>
        <section className="card stock-directory-card">
          <div className="stock-directory-heading"><span>{resultHeading}</span><span>{effectiveSearch.length >= 2 && directory.count > 0 ? directory.count + " results on this page" : "Symbol · Company · Exchange"}</span></div>
          {showsSearchHint ? (
            <div className="stock-directory-empty">Enter at least 2 characters to search.</div>
          ) : pendingQuery.length === 0 ? (
            <div className="stock-directory-empty">Search the active US stock universe. Try NVDA, PLTR, AMD, or a company name.</div>
          ) : waitingForSearch || loading ? (
            <div className="stock-directory-empty" role="status">Searching the active US stock universe…</div>
          ) : error ? (
            <div className="stock-directory-error" role="alert">{error}</div>
          ) : directory.results.length > 0 ? (
            <div className="stock-directory-list">
              {directory.results.map((reference) => (
                <div className="stock-directory-row" key={reference.symbol}>
                  <Link href={stockDetailHref(reference)} className="stock-directory-identity">
                    <strong>{reference.symbol}</strong>
                    <span>{reference.name}</span>
                  </Link>
                  <span className="stock-directory-market">{reference.exchange ?? "US market"}<small>{reference.market.toUpperCase()}</small></span>
                  <TrackingAction reference={reference} added={addedSymbols.has(reference.symbol)} onAdd={watchlist.add} onRemove={watchlist.remove} />
                </div>
              ))}
            </div>
          ) : (
            <div className="stock-directory-empty">No matching stocks. Try a ticker or a company name.</div>
          )}
          {pendingQuery.length >= 2 && directory.nextCursor && !loading && !waitingForSearch && !error && (
            <button type="button" className="stock-directory-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more stocks"}
            </button>
          )}
        </section>
      </section>

      <section className="stock-featured-section">
        <div className="stock-universe-section-heading">
          <div><span className="eyebrow">CURATED SHORTLIST</span><h2>Popular Tech</h2><p>Featured names to get started. The stock universe is much larger.</p></div>
        </div>
        <div className="stock-featured-grid">
          {popularTechStocks.map((reference) => {
            const added = addedSymbols.has(reference.symbol);
            return (
              <div className="card stock-featured-card" key={reference.symbol}>
                <Link href={stockDetailHref(reference)} className="stock-featured-link">
                  <span className={"stock-monogram monogram-" + reference.symbol}>{reference.symbol.slice(0, 1)}</span>
                  <span><strong>{reference.symbol}</strong><small>{reference.name}</small></span>
                  <Icon name="arrow-up-right" size={14} />
                </Link>
                <TrackingAction reference={reference} added={added} onAdd={watchlist.add} onRemove={watchlist.remove} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
