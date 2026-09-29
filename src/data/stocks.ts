export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  marketCap: string;
  peRatio: string;
  weekHigh: number;
  weekLow: number;
  insight: string;
  description: string;
};

export const stocks: Stock[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors",
    price: 182.3,
    change: 4.28,
    changePercent: 2.4,
    open: 178.5,
    high: 183.2,
    low: 177.9,
    previousClose: 178.02,
    marketCap: "$4.44T",
    peRatio: "52.8",
    weekHigh: 195.95,
    weekLow: 86.62,
    insight:
      "AI infrastructure demand remains a major growth driver, while valuation remains elevated compared with historical levels.",
    description:
      "NVIDIA designs accelerated computing platforms that power modern data centers, graphics, and artificial intelligence workloads.",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Consumer Technology",
    price: 255.2,
    change: 2.07,
    changePercent: 0.82,
    open: 253.5,
    high: 256.1,
    low: 252.9,
    previousClose: 253.13,
    marketCap: "$3.78T",
    peRatio: "34.1",
    weekHigh: 260.1,
    weekLow: 164.08,
    insight:
      "Services growth and a loyal ecosystem continue to support resilience, while hardware upgrade cycles remain an important catalyst.",
    description:
      "Apple designs consumer devices and software, with a growing services business built around its global product ecosystem.",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automotive",
    price: 421.5,
    change: -5.13,
    changePercent: -1.2,
    open: 427.1,
    high: 429.4,
    low: 419.8,
    previousClose: 426.63,
    marketCap: "$1.36T",
    peRatio: "188.6",
    weekHigh: 488.54,
    weekLow: 138.8,
    insight:
      "Execution on autonomy and energy storage could broaden Tesla's growth profile, while vehicle margins and valuation remain key risks.",
    description:
      "Tesla builds electric vehicles, energy storage systems, and software focused on autonomy and sustainable transportation.",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Software",
    price: 510.2,
    change: 2.75,
    changePercent: 0.54,
    open: 508.2,
    high: 512.5,
    low: 506.8,
    previousClose: 507.45,
    marketCap: "$3.79T",
    peRatio: "38.7",
    weekHigh: 555.45,
    weekLow: 344.79,
    insight:
      "Cloud expansion and AI product adoption remain central themes, with enterprise spending trends a useful signal to follow.",
    description:
      "Microsoft develops cloud services, productivity software, operating systems, and AI products for consumers and businesses.",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    sector: "E-commerce & Cloud",
    price: 231.4,
    change: 2.65,
    changePercent: 1.16,
    open: 229.1,
    high: 232.8,
    low: 228.4,
    previousClose: 228.75,
    marketCap: "$2.44T",
    peRatio: "36.9",
    weekHigh: 242.52,
    weekLow: 151.61,
    insight:
      "AWS demand and operating efficiency are important earnings drivers, while retail margins can remain sensitive to costs.",
    description:
      "Amazon operates a global commerce marketplace alongside AWS cloud infrastructure, digital services, and logistics networks.",
  },
];

export function getStock(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol.toUpperCase());
}
