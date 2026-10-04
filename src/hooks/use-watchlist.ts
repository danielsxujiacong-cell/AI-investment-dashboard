"use client";

import { useCallback } from "react";
import { usePersonalData } from "@/components/personal-data-provider";
import { stockFromReference, type StockReference } from "@/data/stock-universe";

export function useWatchlist() {
  const { watchlist, ready, saveWatchlist } = usePersonalData();

  const add = useCallback((reference: StockReference) => {
    const symbol = reference.symbol.toUpperCase();
    if (!ready || watchlist.some((stock) => stock.symbol === symbol)) return;
    saveWatchlist([...watchlist, stockFromReference(reference)]);
  }, [ready, saveWatchlist, watchlist]);

  const remove = useCallback((symbol: string) => {
    if (!ready) return;
    saveWatchlist(watchlist.filter((stock) => stock.symbol !== symbol.toUpperCase()));
  }, [ready, saveWatchlist, watchlist]);

  return { stocks: watchlist, ready, add, remove };
}
