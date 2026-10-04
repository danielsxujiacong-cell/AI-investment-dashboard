import { stocks, type Stock } from "@/data/stocks";
import { referenceFromStock, stockFromReference, type StockReference } from "@/data/stock-universe";

export const watchlistStorageKey = "ai-investment-dashboard:stock-universe-watchlist:v1";
export const watchlistChangedEvent = "ai-investment-dashboard:watchlist-changed";

let inMemoryWatchlist: Stock[] | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseReference(value: unknown): StockReference | null {
  if (!isRecord(value) || typeof value.symbol !== "string" || typeof value.name !== "string") return null;
  const symbol = value.symbol.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) || !value.name.trim()) return null;
  return {
    symbol,
    name: value.name.trim().slice(0, 160),
    market: typeof value.market === "string" ? value.market.slice(0, 32) : "stocks",
    exchange: typeof value.exchange === "string" ? value.exchange.slice(0, 32) : null,
  };
}

function deduplicate(stocksToKeep: Stock[]) {
  const seen = new Set<string>();
  return stocksToKeep.filter((stock) => {
    if (seen.has(stock.symbol)) return false;
    seen.add(stock.symbol);
    return true;
  });
}

export function readWatchlist(): Stock[] {
  if (typeof window === "undefined") return stocks;
  try {
    const raw = window.localStorage.getItem(watchlistStorageKey);
    if (raw === null) return inMemoryWatchlist ?? stocks;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return inMemoryWatchlist ?? stocks;
    const savedStocks = parsed.flatMap((item) => {
      const reference = parseReference(item);
      return reference ? [stockFromReference(reference)] : [];
    });
    inMemoryWatchlist = deduplicate(savedStocks);
    return inMemoryWatchlist;
  } catch {
    return inMemoryWatchlist ?? stocks;
  }
}

export function readStoredWatchlist(): Stock[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(watchlistStorageKey);
    if (raw === null) return inMemoryWatchlist;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return inMemoryWatchlist;
    const savedStocks = parsed.flatMap((item) => {
      const reference = parseReference(item);
      return reference ? [stockFromReference(reference)] : [];
    });
    inMemoryWatchlist = deduplicate(savedStocks);
    return inMemoryWatchlist;
  } catch {
    return inMemoryWatchlist;
  }
}

export function saveWatchlist(nextStocks: Stock[]) {
  inMemoryWatchlist = deduplicate(nextStocks);
  if (typeof window !== "undefined") {
    try {
      const serialized = inMemoryWatchlist.map(referenceFromStock);
      window.localStorage.setItem(watchlistStorageKey, JSON.stringify(serialized));
    } catch {
      // Keep the updated list in memory for this session when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(watchlistChangedEvent));
  }
  return inMemoryWatchlist;
}
