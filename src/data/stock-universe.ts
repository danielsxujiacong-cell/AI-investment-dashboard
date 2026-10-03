import { getStock, type Stock } from "@/data/stocks";

export type StockReference = {
  symbol: string;
  name: string;
  market: string;
  exchange: string | null;
};

const featuredSymbols: Array<[string, string]> = [
  ["NVDA", "NVIDIA Corporation"], ["AMD", "Advanced Micro Devices, Inc."], ["AVGO", "Broadcom Inc."],
  ["TSM", "Taiwan Semiconductor Manufacturing Company"], ["MU", "Micron Technology, Inc."], ["ARM", "Arm Holdings plc"],
  ["INTC", "Intel Corporation"], ["QCOM", "Qualcomm Incorporated"], ["SMCI", "Super Micro Computer, Inc."],
  ["MRVL", "Marvell Technology, Inc."], ["AAPL", "Apple Inc."], ["MSFT", "Microsoft Corporation"],
  ["GOOGL", "Alphabet Inc."], ["META", "Meta Platforms, Inc."], ["AMZN", "Amazon.com, Inc."],
  ["TSLA", "Tesla, Inc."], ["PLTR", "Palantir Technologies Inc."], ["ORCL", "Oracle Corporation"],
  ["CRM", "Salesforce, Inc."], ["NOW", "ServiceNow, Inc."], ["ADBE", "Adobe Inc."],
  ["SNOW", "Snowflake Inc."], ["DDOG", "Datadog, Inc."], ["NET", "Cloudflare, Inc."],
  ["CRWD", "CrowdStrike Holdings, Inc."], ["PANW", "Palo Alto Networks, Inc."], ["APP", "AppLovin Corporation"],
  ["RDDT", "Reddit, Inc."], ["HOOD", "Robinhood Markets, Inc."], ["COIN", "Coinbase Global, Inc."],
];

export const popularTechStocks: StockReference[] = featuredSymbols.map(([symbol, name]) => ({
  symbol,
  name,
  market: "stocks",
  exchange: null,
}));

export function stockFromReference(reference: StockReference): Stock {
  return {
    symbol: reference.symbol.toUpperCase(),
    name: reference.name,
    exchange: reference.exchange,
    market: reference.market || "stocks",
    sector: "US Equity",
    price: 0,
    change: 0,
    changePercent: 0,
    open: 0,
    high: 0,
    low: 0,
    previousClose: 0,
    marketCap: "—",
    peRatio: "—",
    weekHigh: 0,
    weekLow: 0,
    insight: "Company metrics and analysis are not available for this reference listing.",
    description: reference.name + " is an actively listed US stock. Live prices and historical data are loaded when you open this stock.",
  };
}

export function referenceFromStock(stock: Stock): StockReference {
  return {
    symbol: stock.symbol.toUpperCase(),
    name: stock.name,
    market: stock.market || "stocks",
    exchange: stock.exchange ?? null,
  };
}

export function stockDetailHref(reference: StockReference) {
  const symbol = reference.symbol.toUpperCase();
  if (getStock(symbol)) return "/stocks/" + encodeURIComponent(symbol);
  const params = new URLSearchParams({ symbol, name: reference.name, market: reference.market || "stocks" });
  if (reference.exchange) params.set("exchange", reference.exchange);
  return "/stock/?" + params.toString();
}
