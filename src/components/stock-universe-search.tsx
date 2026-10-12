"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { getStockDirectoryPage, type StockDirectoryPage } from "@/data/market-tickers";
import { stockDetailHref } from "@/data/stock-universe";

const emptyDirectory: StockDirectoryPage = { results: [], count: 0, nextCursor: null };

export function StockUniverseSearch() {
  const [query, setQuery] = useState("");
  const [directory, setDirectory] = useState<StockDirectoryPage>(emptyDirectory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const requestVersion = useRef(0);
  const search = query.trim();
  const hasSearch = search.length >= 2;

  useEffect(() => {
    if (!hasSearch) {
      requestVersion.current += 1;
      return;
    }

    const timer = window.setTimeout(() => {
      const version = ++requestVersion.current;
      setLoading(true);
      setError(null);
      void getStockDirectoryPage(search).then((page) => {
        if (requestVersion.current === version) setDirectory(page);
      }).catch((searchError) => {
        if (requestVersion.current === version) {
          setError(searchError instanceof Error ? searchError.message : "The stock universe could not be searched.");
          setDirectory(emptyDirectory);
        }
      }).finally(() => {
        if (requestVersion.current === version) setLoading(false);
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [hasSearch, search]);

  return (
    <div className="market-search-wrap" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <label className="market-search-field" htmlFor="market-stock-search">
        <Icon name="search" size={19} />
        <input
          id="market-stock-search"
          type="search"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            requestVersion.current += 1;
            setQuery(nextQuery);
            setDirectory(emptyDirectory);
            setError(null);
            setLoading(nextQuery.trim().length >= 2);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
              setDirectory(emptyDirectory);
              setLoading(false);
              setError(null);
            }
          }}
          placeholder="Search by ticker or company name"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-label="Search stocks by ticker or company name"
          aria-controls="market-stock-search-results"
          aria-expanded={open}
        />
        {loading ? <span className="market-search-progress" aria-label="Searching" /> : <kbd>↵</kbd>}
      </label>
      {open && (
        <div className="market-search-results" id="market-stock-search-results" role="listbox" aria-busy={loading}>
          {!hasSearch ? (
            <p className="market-search-hint">Enter at least 2 characters to search the active US stock universe.</p>
          ) : loading ? (
            <p className="market-search-hint" role="status">Searching stocks…</p>
          ) : error ? (
            <p className="market-search-error" role="alert">{error}</p>
          ) : directory.results.length > 0 ? (
            <>
              {directory.results.slice(0, 6).map((stock) => (
                <Link
                  className="market-search-result"
                  href={stockDetailHref(stock)}
                  key={stock.symbol}
                  role="option"
                  aria-selected="false"
                  onClick={() => setOpen(false)}
                >
                  <span><strong>{stock.symbol}</strong><small>{stock.name}</small></span>
                  <span className="market-search-exchange">{stock.exchange ?? "US market"}<Icon name="arrow-up-right" size={14} /></span>
                </Link>
              ))}
              <Link href="/stock/" className="market-search-all" onClick={() => setOpen(false)}>
                Browse the full Stock Universe <Icon name="arrow-right" size={14} />
              </Link>
            </>
          ) : (
            <p className="market-search-hint">No matching companies. Try a ticker or another name.</p>
          )}
        </div>
      )}
    </div>
  );
}
