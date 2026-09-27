import type { Stock } from "@/data/stocks";

export type LiveStockQuote = Pick<
  Stock,
  "price" | "change" | "changePercent" | "open" | "high" | "low" | "previousClose"
> & {
  updatedAt: number;
};

type FinnhubQuotePayload = Record<string, unknown>;

export function parseFinnhubQuote(payload: unknown): LiveStockQuote {
  if (!payload || typeof payload !== "object") {
    throw new Error("Finnhub returned an invalid quote.");
  }

  const quote = payload as FinnhubQuotePayload;
  const values = [quote.c, quote.d, quote.dp, quote.h, quote.l, quote.o, quote.pc, quote.t];
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error("Finnhub returned an incomplete quote.");
  }

  const current = quote.c as number;
  const change = quote.d as number;
  const changePercent = quote.dp as number;
  const high = quote.h as number;
  const low = quote.l as number;
  const open = quote.o as number;
  const previousClose = quote.pc as number;
  const timestamp = quote.t as number;

  if (current <= 0 || open <= 0 || high <= 0 || low <= 0 || previousClose <= 0 || high < low) {
    throw new Error("Finnhub returned an unavailable quote.");
  }

  return {
    price: current,
    change,
    changePercent,
    open,
    high,
    low,
    previousClose,
    updatedAt: timestamp > 0 ? timestamp * 1000 : Date.now(),
  };
}
