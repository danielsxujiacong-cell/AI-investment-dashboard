"use client";

import { useEffect, useState } from "react";
import {
  getCachedHistoricalPrices,
  getHistoricalPrices,
  type HistoricalPricePoint,
  type MarketHistoryRange,
} from "@/data/market-history";

export type MarketHistoryResult = {
  status: "loading" | "ready" | "error";
  points: HistoricalPricePoint[];
  error: string | null;
};

export function useMarketHistory(symbol: string, range: MarketHistoryRange): MarketHistoryResult {
  const [result, setResult] = useState<MarketHistoryResult>({
    status: "loading",
    points: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const cachedPoints = getCachedHistoricalPrices(symbol, range);
    setResult(cachedPoints
      ? { status: "ready", points: cachedPoints, error: null }
      : { status: "loading", points: [], error: null });
    const handleRateLimit = (event: Event) => {
      const detail = (event as CustomEvent<{ symbol: string; range: MarketHistoryRange }>).detail;
      if (!cancelled && !cachedPoints && detail?.symbol === symbol && detail.range === range) {
        setResult({
          status: "error",
          points: [],
          error: "Historical prices are temporarily limited. We'll retry automatically.",
        });
      }
    };
    window.addEventListener("market-history-rate-limited", handleRateLimit);
    void getHistoricalPrices(symbol, range).then(
      (points) => {
        if (!cancelled) setResult({ status: "ready", points, error: null });
      },
      () => {
        if (!cancelled) {
          setResult({
            status: cachedPoints ? "ready" : "error",
            points: cachedPoints ?? [],
            error: cachedPoints ? null : "Historical prices are temporarily limited. We'll retry automatically.",
          });
        }
      },
    );
    return () => {
      cancelled = true;
      window.removeEventListener("market-history-rate-limited", handleRateLimit);
    };
  }, [symbol, range]);

  return result;
}
