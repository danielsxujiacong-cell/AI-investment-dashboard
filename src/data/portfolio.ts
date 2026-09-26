export type Allocation = {
  symbol: string;
  name: string;
  weight: number;
  value: number;
  color: string;
};

export const portfolio = {
  totalValue: 128420.32,
  todayGain: 1240.18,
  todayPercent: 0.98,
  totalReturn: 16512.4,
  totalReturnPercent: 14.76,
  periodLabel: "1 month",
  history: [112, 116, 114, 121, 119, 123, 120, 128, 126, 132, 130, 137, 134, 143, 148, 146, 154, 151, 160, 158, 166, 164, 170, 176],
};

export const allocations: Allocation[] = [
  { symbol: "NVDA", name: "NVIDIA", weight: 30, value: 38526.1, color: "#9dc9ad" },
  { symbol: "AAPL", name: "Apple", weight: 25, value: 32105.08, color: "#94a8c3" },
  { symbol: "MSFT", name: "Microsoft", weight: 20, value: 25684.06, color: "#c5b38c" },
  { symbol: "TSLA", name: "Tesla", weight: 10, value: 12842.03, color: "#c58e8d" },
  { symbol: "CASH", name: "Cash", weight: 15, value: 19263.05, color: "#656a76" },
];
