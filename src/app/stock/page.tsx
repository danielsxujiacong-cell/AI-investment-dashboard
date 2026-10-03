import type { Metadata } from "next";
import { StockUniverseDetailRoute } from "@/components/stock-universe-detail-route";

export const metadata: Metadata = { title: "Stock details" };

export default function StockUniverseStockPage() {
  return <StockUniverseDetailRoute />;
}
