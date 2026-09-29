"use client";

import { useEffect, useState } from "react";
import {
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
    setResult({ status: "loading", points: [], error: null });
    void getHistoricalPrices(symbol, range).then(
      (points) => {
        if (!cancelled) setResult({ status: "ready", points, error: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({
            status: "error",
            points: [],
            error: error instanceof Error ? error.message : "Historical price request failed.",
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  return result;
}
