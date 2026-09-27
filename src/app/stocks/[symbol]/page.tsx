import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StockDetailClient } from "@/components/stock-detail-client";
import { getStock, stocks } from "@/data/stocks";

export function generateStaticParams() {
  return stocks.map((stock) => ({ symbol: stock.symbol }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const stock = getStock(symbol);
  return { title: stock ? stock.symbol + " · " + stock.name : "Stock details" };
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = getStock(symbol);
  if (!stock) notFound();

  return <StockDetailClient initialStock={stock} />;
}
