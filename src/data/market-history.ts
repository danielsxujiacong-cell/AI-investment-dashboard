import { marketApiUrl } from "@/data/market-api";

export const marketHistoryRanges = ["1D", "1W", "1M", "3M", "1Y"] as const;
export type MarketHistoryRange = (typeof marketHistoryRanges)[number];

export type HistoricalPricePoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function formatHistoryTimestamp(timestamp: number, range: MarketHistoryRange) {
  const date = new Date(timestamp);
  if (range === "1D") {
    return date.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (range === "1Y") {
    return date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      year: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
  });
}

type MarketHistoryPayload = {
  candles?: unknown;
  error?: unknown;
};

type CachedHistory = {
  cachedAt: number;
  expiresAt: number;
  points: HistoricalPricePoint[];
};

class HistoryApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const storagePrefix = "ai-investment-dashboard:historical-market-data:v1:";
const historyCache = new Map<string, CachedHistory>();
const historyRequests = new Map<string, Promise<HistoricalPricePoint[]>>();

function cacheKey(symbol: string, range: MarketHistoryRange) {
  return symbol.toUpperCase() + ":" + range;
}

function storageKey(key: string) {
  return storagePrefix + key;
}

function sessionStorageOrNull() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function cacheTtl(range: MarketHistoryRange) {
  return range === "1D" ? 30_000 : 15 * 60_000;
}

function parseCandles(payload: unknown): HistoricalPricePoint[] {
  if (!payload || typeof payload !== "object") {
    throw new Error("The historical price service returned an invalid response.");
  }

  const body = payload as MarketHistoryPayload;
  if (!Array.isArray(body.candles)) {
    throw new Error(typeof body.error === "string" ? body.error : "No historical prices were returned.");
  }

  const points = body.candles.flatMap((item): HistoricalPricePoint[] => {
    if (!item || typeof item !== "object") return [];
    const candle = item as Record<string, unknown>;
    if (
      typeof candle.timestamp !== "number" || !Number.isFinite(candle.timestamp) ||
      typeof candle.open !== "number" || !Number.isFinite(candle.open) || candle.open <= 0 ||
      typeof candle.high !== "number" || !Number.isFinite(candle.high) || candle.high <= 0 ||
      typeof candle.low !== "number" || !Number.isFinite(candle.low) || candle.low <= 0 ||
      typeof candle.close !== "number" || !Number.isFinite(candle.close) || candle.close <= 0 ||
      typeof candle.volume !== "number" || !Number.isFinite(candle.volume) || candle.volume < 0 ||
      candle.high < candle.low || candle.high < candle.open || candle.high < candle.close ||
      candle.low > candle.open || candle.low > candle.close
    ) return [];
    return [{
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }];
  }).sort((a, b) => a.timestamp - b.timestamp);

  if (points.length < 2) throw new Error("There is not enough historical price data for this range.");
  return points;
}

function readCachedHistory(symbol: string, range: MarketHistoryRange): CachedHistory | null {
  const key = cacheKey(symbol, range);
  const memoryValue = historyCache.get(key);
  if (memoryValue) return memoryValue;

  const storage = sessionStorageOrNull();
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(key));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as { cachedAt?: unknown; points?: unknown };
    if (typeof record.cachedAt !== "number" || !Number.isFinite(record.cachedAt)) return null;
    const points = parseCandles({ candles: record.points });
    const cached = {
      cachedAt: record.cachedAt,
      expiresAt: record.cachedAt + cacheTtl(range),
      points,
    };
    historyCache.set(key, cached);
    return cached;
  } catch {
    return null;
  }
}

export function getCachedHistoricalPrices(symbol: string, range: MarketHistoryRange) {
  return readCachedHistory(symbol, range)?.points ?? null;
}

function writeCachedHistory(symbol: string, range: MarketHistoryRange, points: HistoricalPricePoint[]) {
  const key = cacheKey(symbol, range);
  const cachedAt = Date.now();
  const record: CachedHistory = { cachedAt, expiresAt: cachedAt + cacheTtl(range), points };
  historyCache.set(key, record);
  try {
    sessionStorageOrNull()?.setItem(storageKey(key), JSON.stringify({ cachedAt, points }));
  } catch {
    // The in-memory cache remains available if session storage is disabled or full.
  }
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

async function fetchHistory(symbol: string, range: MarketHistoryRange) {
  const url = marketApiUrl(
    "/api/market/candles/" + encodeURIComponent(symbol) + "?range=" + range,
  );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = payload && typeof payload === "object"
          ? (payload as MarketHistoryPayload).error
          : null;
        if (response.status === 429) {
          window.dispatchEvent(new CustomEvent("market-history-rate-limited", {
            detail: { symbol: symbol.toUpperCase(), range },
          }));
        }
        throw new HistoryApiError(
          typeof error === "string" ? error : "Historical price request failed (" + response.status + ").",
          response.status,
        );
      }
      return parseCandles(payload);
    } catch (error) {
      const status = error instanceof HistoryApiError ? error.status : 0;
      const retryable = !(error instanceof HistoryApiError) || status === 429 || status >= 500;
      if (attempt > 0 || !retryable) throw error;
      await delay(status === 429 ? 65_000 : 10_000);
    }
  }

  throw new Error("Historical price request failed.");
}

export function getHistoricalPrices(symbol: string, range: MarketHistoryRange) {
  const key = cacheKey(symbol, range);
  const cached = readCachedHistory(symbol, range);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.points);

  const pending = historyRequests.get(key);
  if (pending) return pending;

  const request = fetchHistory(symbol.toUpperCase(), range)
    .then((points) => {
      writeCachedHistory(symbol, range, points);
      return points;
    })
    .finally(() => historyRequests.delete(key));
  historyRequests.set(key, request);
  return request;
}
