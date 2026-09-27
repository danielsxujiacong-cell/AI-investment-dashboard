"use client";

import { useEffect, useState } from "react";
import { parseFinnhubQuote, type LiveStockQuote } from "@/data/market-quotes";
import { marketApiUrl } from "@/data/market-api";
import { stocks as mockStocks, type Stock } from "@/data/stocks";

export type MarketDataStatus = "loading" | "live" | "partial" | "mock";

type MarketDataState = {
  stocks: Stock[];
  status: MarketDataStatus;
  failedSymbols: string[];
  lastUpdated: number | null;
};

export function useStockMarketData(): MarketDataState {
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [status, setStatus] = useState<MarketDataStatus>("loading");
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      const results = await Promise.allSettled(
        mockStocks.map(async (stock) => {
          const response = await fetch(marketApiUrl("/api/market/quote/" + stock.symbol), {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`Finnhub quote request failed (${response.status}).`);
          }

          return [stock.symbol, parseFinnhubQuote(await response.json())] as const;
        }),
      );

      if (cancelled) return;

      const nextQuotes: Record<string, LiveStockQuote> = {};
      const nextFailures: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const [symbol, quote] = result.value;
          nextQuotes[symbol] = quote;
        } else {
          nextFailures.push(mockStocks[index].symbol);
        }
      });

      const timestamps = Object.values(nextQuotes).map((quote) => quote.updatedAt);
      setQuotes(nextQuotes);
      setFailedSymbols(nextFailures);
      setLastUpdated(timestamps.length > 0 ? Math.max(...timestamps) : null);
      setStatus(
        timestamps.length === 0 ? "mock" : nextFailures.length > 0 ? "partial" : "live",
      );
    }

    void loadQuotes();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return { stocks: mergedStocks, status, failedSymbols, lastUpdated };
}
