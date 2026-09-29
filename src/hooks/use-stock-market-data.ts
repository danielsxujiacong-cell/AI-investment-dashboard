"use client";

import { useEffect, useState } from "react";
import { parseFinnhubQuote, type LiveStockQuote } from "@/data/market-quotes";
import { marketApiUrl } from "@/data/market-api";
import { getHistoricalPrices, type HistoricalPricePoint } from "@/data/market-history";
import { stocks as mockStocks, type Stock } from "@/data/stocks";

export type MarketDataStatus = "loading" | "live" | "partial" | "mock";

export type MiniHistoryState = {
  status: "loading" | "ready" | "error";
  points: HistoricalPricePoint[];
  error: string | null;
};

type QuoteResult = {
  quotes: Record<string, LiveStockQuote>;
  failures: string[];
};

type MarketDataState = {
  stocks: Stock[];
  status: MarketDataStatus;
  failedSymbols: string[];
  lastUpdated: number | null;
  history: Record<string, MiniHistoryState>;
  historyStatus: "idle" | "loading" | "ready" | "partial" | "error";
  failedHistorySymbols: string[];
  historyError: string | null;
};

const quoteCache = new Map<string, { expiresAt: number; quote: LiveStockQuote }>();
const quoteRequests = new Map<string, Promise<LiveStockQuote>>();

function loadQuote(symbol: string): Promise<LiveStockQuote> {
  const cached = quoteCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.quote);

  const pending = quoteRequests.get(symbol);
  if (pending) return pending;

  const request = fetch(marketApiUrl("/api/market/quote/" + symbol), { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Finnhub quote request failed (" + response.status + ").");
      const quote = parseFinnhubQuote(await response.json());
      quoteCache.set(symbol, { expiresAt: Date.now() + 30_000, quote });
      return quote;
    })
    .finally(() => quoteRequests.delete(symbol));

  quoteRequests.set(symbol, request);
  return request;
}

export function useStockMarketData(includeHistory = false): MarketDataState {
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [status, setStatus] = useState<MarketDataStatus>("loading");
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<string, MiniHistoryState>>({});
  const [historyStatus, setHistoryStatus] = useState<MarketDataState["historyStatus"]>(
    includeHistory ? "loading" : "idle",
  );
  const [failedHistorySymbols, setFailedHistorySymbols] = useState<string[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      const results = await Promise.allSettled(mockStocks.map((stock) => loadQuote(stock.symbol)));
      if (cancelled) return;

      const nextQuotes: Record<string, LiveStockQuote> = {};
      const nextFailures: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") nextQuotes[mockStocks[index].symbol] = result.value;
        else nextFailures.push(mockStocks[index].symbol);
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!includeHistory) {
      setHistory({});
      setHistoryStatus("idle");
      setFailedHistorySymbols([]);
      setHistoryError(null);
      return () => {
        cancelled = true;
      };
    }

    setHistoryStatus("loading");
    setHistory(Object.fromEntries(mockStocks.map((stock) => [
      stock.symbol,
      { status: "loading", points: [], error: null },
    ])));

    void Promise.allSettled(mockStocks.map((stock) => getHistoricalPrices(stock.symbol, "1M")))
      .then((results) => {
        if (cancelled) return;

        const nextHistory: Record<string, MiniHistoryState> = {};
        const nextFailures: string[] = [];
        const errors: string[] = [];
        results.forEach((result, index) => {
          const symbol = mockStocks[index].symbol;
          if (result.status === "fulfilled") {
            nextHistory[symbol] = { status: "ready", points: result.value, error: null };
          } else {
            const message = result.reason instanceof Error
              ? result.reason.message
              : "Historical price request failed.";
            nextHistory[symbol] = { status: "error", points: [], error: message };
            nextFailures.push(symbol);
            if (!errors.includes(message)) errors.push(message);
          }
        });

        setHistory(nextHistory);
        setFailedHistorySymbols(nextFailures);
        setHistoryError(errors[0] ?? null);
        setHistoryStatus(
          nextFailures.length === 0 ? "ready" :
            nextFailures.length < mockStocks.length ? "partial" : "error",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [includeHistory]);

  const mergedStocks = mockStocks.map((stock) => {
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
    status,
    failedSymbols,
    lastUpdated,
    history,
    historyStatus,
    failedHistorySymbols,
    historyError,
  };
}
