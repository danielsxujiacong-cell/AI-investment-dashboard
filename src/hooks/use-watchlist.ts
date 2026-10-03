"use client";

import { useCallback, useEffect, useState } from "react";
import { stocks, type Stock } from "@/data/stocks";
import { readWatchlist, saveWatchlist, watchlistChangedEvent } from "@/data/watchlist";
import { stockFromReference, type StockReference } from "@/data/stock-universe";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Stock[]>(stocks);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncWatchlist = () => {
      setWatchlist(readWatchlist());
      setReady(true);
    };
    syncWatchlist();
    window.addEventListener(watchlistChangedEvent, syncWatchlist);
    window.addEventListener("storage", syncWatchlist);
    return () => {
      window.removeEventListener(watchlistChangedEvent, syncWatchlist);
      window.removeEventListener("storage", syncWatchlist);
    };
  }, []);

  const add = useCallback((reference: StockReference) => {
    const current = readWatchlist();
    const symbol = reference.symbol.toUpperCase();
    if (current.some((stock) => stock.symbol === symbol)) return;
    setWatchlist(saveWatchlist([...current, stockFromReference(reference)]));
    setReady(true);
  }, []);

  const remove = useCallback((symbol: string) => {
    const current = readWatchlist();
    setWatchlist(saveWatchlist(current.filter((stock) => stock.symbol !== symbol.toUpperCase())));
    setReady(true);
  }, []);

  return { stocks: watchlist, ready, add, remove };
}
