"use client";

import { useEffect, useState } from "react";
import { StockDetailClient } from "@/components/stock-detail-client";
import { stockFromReference, type StockReference } from "@/data/stock-universe";
import type { Stock } from "@/data/stocks";

export function StockUniverseDetailRoute() {
  const [stock, setStock] = useState<Stock | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const symbol = (params.get("symbol") || "").trim().toUpperCase();
      if (/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) {
        const reference: StockReference = {
          symbol,
          name: params.get("name")?.trim() || symbol,
          market: params.get("market") || "stocks",
          exchange: params.get("exchange"),
        };
        setStock(stockFromReference(reference));
      }
      setResolved(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (stock) return <StockDetailClient initialStock={stock} />;
  return (
    <div className="page-stack page-enter stock-universe-detail-message" role={resolved ? "alert" : "status"}>
      {resolved ? "No stock was selected. Return to Watchlist and choose an active US listing." : "Loading stock details…"}
    </div>
  );
}
