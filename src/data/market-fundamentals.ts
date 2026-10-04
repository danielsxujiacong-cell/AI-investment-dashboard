import { marketApiUrl } from "@/data/market-api";

export type RealMarketMetric = {
  value: number | null;
  currency: string | null;
  source: string | null;
};

export type StockFundamentals = {
  marketCap: RealMarketMetric;
  peRatio: RealMarketMetric;
  weekHigh: RealMarketMetric;
  weekLow: RealMarketMetric;
};

type FundamentalsPayload = Partial<Record<keyof StockFundamentals, unknown>>;

const fundamentalsCache = new Map<string, { expiresAt: number; result: StockFundamentals }>();
const fundamentalsRequests = new Map<string, Promise<StockFundamentals>>();
const FUNDAMENTALS_TTL_MS = 5 * 60_000;

function emptyMetric(): RealMarketMetric {
  return { value: null, currency: null, source: null };
}

export function emptyStockFundamentals(): StockFundamentals {
  return {
    marketCap: emptyMetric(),
    peRatio: emptyMetric(),
    weekHigh: emptyMetric(),
    weekLow: emptyMetric(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMetric(value: unknown): RealMarketMetric {
  if (!isRecord(value)) return emptyMetric();
  const number = typeof value.value === "number" && Number.isFinite(value.value)
    ? value.value
    : null;
  const currency = typeof value.currency === "string" ? value.currency.toUpperCase() : null;
  const source = typeof value.source === "string" ? value.source : null;
  return { value: number, currency, source };
}

function parseFundamentals(payload: unknown): StockFundamentals {
  if (!isRecord(payload)) throw new Error("The fundamentals service returned an invalid response.");
  const data = payload as FundamentalsPayload;
  return {
    marketCap: parseMetric(data.marketCap),
    peRatio: parseMetric(data.peRatio),
    weekHigh: parseMetric(data.weekHigh),
    weekLow: parseMetric(data.weekLow),
  };
}

export function getStockFundamentals(symbol: string): Promise<StockFundamentals> {
  const normalizedSymbol = symbol.toUpperCase();
  const cached = fundamentalsCache.get(normalizedSymbol);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.result);

  const pending = fundamentalsRequests.get(normalizedSymbol);
  if (pending) return pending;

  const request = fetch(
    marketApiUrl("/api/market/fundamentals/" + encodeURIComponent(normalizedSymbol)),
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Stock fundamentals request failed (" + response.status + ").");
      const result = parseFundamentals(await response.json());
      fundamentalsCache.set(normalizedSymbol, { expiresAt: Date.now() + FUNDAMENTALS_TTL_MS, result });
      return result;
    })
    .finally(() => fundamentalsRequests.delete(normalizedSymbol));

  fundamentalsRequests.set(normalizedSymbol, request);
  return request;
}
