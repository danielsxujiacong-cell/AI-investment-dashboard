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

const historyCache = new Map<string, {
  expiresAt: number;
  promise: Promise<HistoricalPricePoint[]>;
}>();

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

function loadBaseHistory(symbol: string, range: "1D" | "1Y") {
  const key = symbol + ":" + range;
  const cached = historyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const request = fetch(marketApiUrl(
    "/api/market/candles/" + encodeURIComponent(symbol) + "?range=" + range,
  ), { cache: "no-store" })
    .then(async (response) => {
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = payload && typeof payload === "object"
          ? (payload as MarketHistoryPayload).error
          : null;
        throw new Error(typeof error === "string" ? error : "Historical price request failed (" + response.status + ").");
      }
      return parseCandles(payload);
    });

  historyCache.set(key, {
    expiresAt: Date.now() + (range === "1D" ? 30_000 : 300_000),
    promise: request,
  });
  void request.catch(() => {
    if (historyCache.get(key)?.promise === request) historyCache.delete(key);
  });
  return request;
}

const rangeDays: Partial<Record<MarketHistoryRange, number>> = {
  "1W": 7,
  "1M": 30,
  "3M": 92,
};

export async function getHistoricalPrices(symbol: string, range: MarketHistoryRange) {
  const baseRange = range === "1D" ? "1D" : "1Y";
  const candles = await loadBaseHistory(symbol, baseRange);
  if (range === "1D" || range === "1Y") return candles;

  const cutoff = Date.now() - (rangeDays[range] ?? 365) * 24 * 60 * 60 * 1000;
  const points = candles.filter((candle) => candle.timestamp >= cutoff);
  if (points.length < 2) throw new Error("There is not enough historical price data for this range.");
  return points;
}
