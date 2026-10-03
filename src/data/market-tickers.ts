import { marketApiUrl } from "@/data/market-api";
import type { StockReference } from "@/data/stock-universe";

export type StockDirectoryPage = {
  results: StockReference[];
  count: number;
  nextCursor: string | null;
};

const clientCache = new Map<string, { expiresAt: number; page: StockDirectoryPage }>();
const pageRequests = new Map<string, Promise<StockDirectoryPage>>();
const clientCacheTtlMs = 10 * 60_000;

function pageKey(search: string, cursor: string | null) {
  return search.trim().toUpperCase() + "::" + (cursor ?? "first");
}

export async function getStockDirectoryPage(search = "", cursor: string | null = null) {
  const normalizedSearch = search.trim();
  const key = pageKey(normalizedSearch, cursor);
  const cached = clientCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.page;

  const pending = pageRequests.get(key);
  if (pending) return pending;

  const url = new URL(marketApiUrl("/api/market/stocks"), window.location.origin);
  url.searchParams.set("apiVersion", "2");
  if (normalizedSearch) url.searchParams.set("search", normalizedSearch);
  if (cursor) url.searchParams.set("cursor", cursor);

  const request = fetch(url.toString(), { cache: "default" })
    .then(async (response) => {
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Stock directory request failed (" + response.status + ").";
        throw new Error(message);
      }
      if (!payload || typeof payload !== "object") throw new Error("The stock directory returned an invalid response.");
      const body = payload as { results?: unknown; count?: unknown; nextCursor?: unknown };
      if (!Array.isArray(body.results)) throw new Error("The stock directory returned an invalid result list.");
      const results = body.results.flatMap((item): StockReference[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (typeof row.symbol !== "string" || typeof row.name !== "string") return [];
        return [{
          symbol: row.symbol.toUpperCase(),
          name: row.name,
          market: typeof row.market === "string" ? row.market : "stocks",
          exchange: typeof row.exchange === "string" ? row.exchange : null,
        }];
      });
      return {
        results,
        count: typeof body.count === "number" && Number.isFinite(body.count) ? body.count : results.length,
        nextCursor: typeof body.nextCursor === "string" ? body.nextCursor : null,
      };
    })
    .then((page) => {
      clientCache.set(key, { expiresAt: Date.now() + clientCacheTtlMs, page });
      return page;
    })
    .finally(() => pageRequests.delete(key));

  pageRequests.set(key, request);
  return request;
}
