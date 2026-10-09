"use client";

import { useEffect, useMemo, useState } from "react";
import { parseFinnhubQuote, type LiveStockQuote } from "@/data/market-quotes";
import { marketApiUrl } from "@/data/market-api";
import { getCachedHistoricalPrices, getHistoricalPrices, type HistoricalPricePoint } from "@/data/market-history";
import type { Stock } from "@/data/stocks";
import { useWatchlist } from "@/hooks/use-watchlist";

export type MarketDataStatus = "loading" | "live" | "partial" | "mock";

export type MiniHistoryState = {
  status: "loading" | "ready" | "error";
  points: HistoricalPricePoint[];
  error: string | null;
};

type MarketDataState = {
  stocks: Stock[];
  liveQuotes: Record<string, LiveStockQuote>;
  status: MarketDataStatus;
  failedSymbols: string[];
  lastUpdated: number | null;
  history: Record<string, MiniHistoryState>;
  historyStatus: "idle" | "loading" | "ready" | "partial" | "error";
  failedHistorySymbols: string[];
};

type MarketDataOptions = {
  includeHistory?: boolean;
  maxWatchlistSymbols?: number;
  activeStock?: Stock;
};

const quoteCache = new Map<string, { expiresAt: number; quote: LiveStockQuote }>();
const quoteRequests = new Map<string, Promise<LiveStockQuote>>();

export function getLiveStockQuote(symbol: string): Promise<LiveStockQuote> {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const cached = quoteCache.get(normalizedSymbol);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.quote);

  const pending = quoteRequests.get(normalizedSymbol);
  if (pending) return pending;

  const request = fetch(marketApiUrl("/api/market/quote/" + encodeURIComponent(normalizedSymbol)), { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Finnhub quote request failed (" + response.status + ").");
      const quote = parseFinnhubQuote(await response.json());
      quoteCache.set(normalizedSymbol, { expiresAt: Date.now() + 30_000, quote });
      return quote;
    })
    .finally(() => quoteRequests.delete(normalizedSymbol));

  quoteRequests.set(normalizedSymbol, request);
  return request;
}

export function useStockMarketData(input: boolean | MarketDataOptions = false): MarketDataState {
  const options = typeof input === "boolean" ? { includeHistory: input } : input;
  const includeHistory = options.includeHistory ?? false;
  const maxWatchlistSymbols = Math.max(0, options.maxWatchlistSymbols ?? 8);
  const activeStock = options.activeStock;
  const watchlist = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [status, setStatus] = useState<MarketDataStatus>("loading");
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<string, MiniHistoryState>>({});
  const [historyStatus, setHistoryStatus] = useState<MarketDataState["historyStatus"]>(
    includeHistory ? "loading" : "idle",
  );
  const [failedHistorySymbols, setFailedHistorySymbols] = useState<string[]>([]);

  const displayStocks = useMemo(() => {
    const next = [...watchlist.stocks];
    if (activeStock) {
      const index = next.findIndex((stock) => stock.symbol === activeStock.symbol);
      if (index === -1) next.push(activeStock);
      else next[index] = { ...next[index], ...activeStock, exchange: activeStock.exchange ?? next[index].exchange };
    }
    return next;
  }, [watchlist.stocks, activeStock]);

  const requestedStocks = useMemo(() => {
    const selected = watchlist.stocks.slice(0, maxWatchlistSymbols);
    if (!activeStock) return selected;
    const activeIndex = selected.findIndex((stock) => stock.symbol === activeStock.symbol);
    if (activeIndex === -1) return [...selected, activeStock];
    return selected.map((stock, index) => index === activeIndex
      ? { ...stock, ...activeStock, exchange: activeStock.exchange ?? stock.exchange }
      : stock);
  }, [watchlist.stocks, maxWatchlistSymbols, activeStock]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      if (!watchlist.ready) return;
      if (requestedStocks.length === 0) {
        setQuotes({});
        setFailedSymbols([]);
        setLastUpdated(null);
        setStatus("mock");
        return;
      }

      setStatus("loading");
      const results = await Promise.allSettled(requestedStocks.map((stock) => getLiveStockQuote(stock.symbol)));
      if (cancelled) return;

      const nextQuotes: Record<string, LiveStockQuote> = {};
      const nextFailures: string[] = [];
      results.forEach((result, index) => {
        const symbol = requestedStocks[index].symbol;
        if (result.status === "fulfilled") nextQuotes[symbol] = result.value;
        else nextFailures.push(symbol);
      });

      const timestamps = Object.values(nextQuotes).map((quote) => quote.updatedAt);
      setQuotes(nextQuotes);
      setFailedSymbols(nextFailures);
      setLastUpdated(timestamps.length > 0 ? Math.max(...timestamps) : null);
      setStatus(timestamps.length === 0 ? "mock" : nextFailures.length > 0 ? "partial" : "live");
    }

    void loadQuotes();
    return () => {
      cancelled = true;
    };
  }, [watchlist.ready, requestedStocks]);

  useEffect(() => {
    let cancelled = false;

    if (!includeHistory || !watchlist.ready || requestedStocks.length === 0) return;

    const handleRateLimit = (event: Event) => {
      const detail = (event as CustomEvent<{ symbol: string; range: string }>).detail;
      if (!detail || detail.range !== "1M" || !requestedStocks.some((stock) => stock.symbol === detail.symbol)) return;
      if (getCachedHistoricalPrices(detail.symbol, "1M")) return;
      const message = "Historical prices are temporarily limited. We'll retry automatically.";
      setHistory((current) => ({
        ...current,
        [detail.symbol]: { status: "error", points: [], error: message },
      }));
      setFailedHistorySymbols((current) => [...new Set([...current, detail.symbol])]);
      setHistoryStatus("partial");
    };
    window.addEventListener("market-history-rate-limited", handleRateLimit);

    void Promise.allSettled(requestedStocks.map((stock) => getHistoricalPrices(stock.symbol, "1M")))
      .then((results) => {
        if (cancelled) return;

        const nextHistory: Record<string, MiniHistoryState> = {};
        const nextFailures: string[] = [];
        results.forEach((result, index) => {
          const symbol = requestedStocks[index].symbol;
          if (result.status === "fulfilled") {
            nextHistory[symbol] = { status: "ready", points: result.value, error: null };
          } else {
            const cachedPoints = getCachedHistoricalPrices(symbol, "1M");
            if (cachedPoints) {
              nextHistory[symbol] = { status: "ready", points: cachedPoints, error: null };
            } else {
              const message = "Historical prices are temporarily limited. We'll retry shortly.";
              nextHistory[symbol] = { status: "error", points: [], error: message };
              nextFailures.push(symbol);
            }
          }
        });

        setHistory(nextHistory);
        setFailedHistorySymbols(nextFailures);
        setHistoryStatus(
          nextFailures.length === 0 ? "ready" :
            nextFailures.length < requestedStocks.length ? "partial" : "error",
        );
      });

    return () => {
      cancelled = true;
      window.removeEventListener("market-history-rate-limited", handleRateLimit);
    };
  }, [includeHistory, watchlist.ready, requestedStocks]);

  const mergedStocks = displayStocks.map((stock) => {
    const quote = quotes[stock.symbol];
    if (!quote) return stock;

    return {
      ...stock,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
    };
  });

  return {
    stocks: mergedStocks,
    liveQuotes: quotes,
    status: watchlist.ready ? status : "loading",
    failedSymbols,
    lastUpdated,
    history: watchlist.ready && includeHistory && requestedStocks.length > 0 ? history : {},
    historyStatus: !includeHistory ? "idle" : !watchlist.ready ? "loading" : requestedStocks.length === 0 ? "ready" : historyStatus,
    failedHistorySymbols,
  };
}
