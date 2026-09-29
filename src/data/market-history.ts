import { marketApiUrl } from "@/data/market-api";

export const marketHistoryRanges = ["1D", "1W", "1M", "3M", "1Y"] as const;
export type MarketHistoryRange = (typeof marketHistoryRanges)[number];

export type HistoricalPricePoint = {
  timestamp: number;
  close: number;
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
      typeof candle.close !== "number" || !Number.isFinite(candle.close) || candle.close <= 0
    ) return [];
    return [{ timestamp: candle.timestamp, close: candle.close }];
  }).sort((a, b) => a.timestamp - b.timestamp);

  if (points.length < 2) throw new Error("There is not enough historical price data for this range.");
  return points;
}

export function getHistoricalPrices(symbol: string, range: MarketHistoryRange) {
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
    expiresAt: Date.now() + (range === "1D" ? 30_000 : 180_000),
    promise: request,
  });
  void request.catch(() => {
    if (historyCache.get(key)?.promise === request) historyCache.delete(key);
  });
  return request;
}
