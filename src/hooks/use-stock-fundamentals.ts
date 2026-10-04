"use client";

import { useEffect, useState } from "react";
import {
  emptyStockFundamentals,
  getStockFundamentals,
  type StockFundamentals,
} from "@/data/market-fundamentals";
import { getHistoricalPrices } from "@/data/market-history";

export type StockFundamentalsState = {
  status: "loading" | "ready";
  data: StockFundamentals;
};

function hasRealValue(value: number | null) {
  return value !== null && Number.isFinite(value);
}

async function fillWeekRangeFromMassive(symbol: string, data: StockFundamentals) {
  if (hasRealValue(data.weekHigh.value) && hasRealValue(data.weekLow.value)) return data;

  const candles = await getHistoricalPrices(symbol, "1Y");
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1_000;
  const recentCandles = candles.filter((candle) => candle.timestamp >= cutoff);
  if (recentCandles.length === 0) return data;

  const highest = Math.max(...recentCandles.map((candle) => candle.high));
  const lowest = Math.min(...recentCandles.map((candle) => candle.low));
  const source = "Massive historical daily candles · 52-week calculation";
  return {
    ...data,
    weekHigh: hasRealValue(data.weekHigh.value)
      ? data.weekHigh
      : { value: highest, currency: "USD", source },
    weekLow: hasRealValue(data.weekLow.value)
      ? data.weekLow
      : { value: lowest, currency: "USD", source },
  };
}

export function useStockFundamentals(symbol: string): StockFundamentalsState {
  const [state, setState] = useState<StockFundamentalsState>({
    status: "loading",
    data: emptyStockFundamentals(),
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: emptyStockFundamentals() });

    void getStockFundamentals(symbol)
      .catch(() => emptyStockFundamentals())
      .then(async (data) => {
        if (!cancelled) setState({ status: "loading", data });
        try {
          data = await fillWeekRangeFromMassive(symbol, data);
        } catch {
          // Finnhub values remain available; missing 52-week data stays unavailable.
        }
        if (!cancelled) setState({ status: "ready", data });
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return state;
}
