"use client";

import { useEffect, useMemo, useState } from "react";
import { PerformanceChart } from "@/components/charts";
import { usePersonalData } from "@/components/personal-data-provider";
import { Icon } from "@/components/icons";
import { formatHistoryTimestamp, getCachedHistoricalPrices, getHistoricalPrices, type HistoricalPricePoint } from "@/data/market-history";

type HistoryState = {
  status: "loading" | "ready" | "error";
  points: HistoricalPricePoint[];
};

const historyLimit = 8;

export function PortfolioPerformanceChart() {
  const { data, ready } = usePersonalData();
  const groups = useMemo(() => {
    const sharesBySymbol = new Map<string, number>();
    for (const holding of data.portfolio) {
      sharesBySymbol.set(holding.symbol, (sharesBySymbol.get(holding.symbol) ?? 0) + holding.shares);
    }
    return [...sharesBySymbol.entries()];
  }, [data.portfolio]);
  const symbols = useMemo(() => groups.map(([symbol]) => symbol), [groups]);
  const [histories, setHistories] = useState<Record<string, HistoryState>>({});

  useEffect(() => {
    if (!ready || symbols.length === 0 || symbols.length > historyLimit) return;

    let cancelled = false;
    const handleRateLimit = (event: Event) => {
      const detail = (event as CustomEvent<{ symbol: string; range: string }>).detail;
      if (!detail || detail.range !== "1M" || !symbols.includes(detail.symbol)) return;
      const cached = getCachedHistoricalPrices(detail.symbol, "1M");
      setHistories((current) => ({
        ...current,
        [detail.symbol]: cached
          ? { status: "ready", points: cached }
          : { status: "error", points: [] },
      }));
    };
    window.addEventListener("market-history-rate-limited", handleRateLimit);

    symbols.forEach((symbol) => {
      void getHistoricalPrices(symbol, "1M").then((points) => {
        if (cancelled) return;
        setHistories((current) => ({ ...current, [symbol]: { status: "ready", points } }));
      }).catch(() => {
        if (cancelled) return;
        const cached = getCachedHistoricalPrices(symbol, "1M");
        setHistories((current) => ({
          ...current,
          [symbol]: cached
            ? { status: "ready", points: cached }
            : { status: "error", points: [] },
        }));
      });
    });

    return () => {
      cancelled = true;
      window.removeEventListener("market-history-rate-limited", handleRateLimit);
    };
  }, [ready, symbols]);

  const historyReady = symbols.length > 0 && symbols.length <= historyLimit &&
    symbols.every((symbol) => histories[symbol]?.status === "ready");
  const historyLoading = symbols.length > 0 && symbols.length <= historyLimit &&
    symbols.some((symbol) => !histories[symbol] || histories[symbol].status === "loading");
  const failedSymbol = symbols.find((symbol) => histories[symbol]?.status === "error");
  const history = useMemo(() => {
    if (!historyReady) return [];
    const series = symbols.map((symbol) => histories[symbol].points);
    const timestamps = [...new Set(series.flatMap((points) => points.map((point) => point.timestamp)))]
      .sort((a, b) => a - b);
    const cursors = series.map(() => 0);
    const latestPrices: Array<number | null> = series.map(() => null);
    const points: Array<{ timestamp: number; value: number }> = [];

    for (const timestamp of timestamps) {
      series.forEach((pointsForSymbol, index) => {
        while (cursors[index] < pointsForSymbol.length && pointsForSymbol[cursors[index]].timestamp <= timestamp) {
          latestPrices[index] = pointsForSymbol[cursors[index]].close;
          cursors[index] += 1;
        }
      });
      if (latestPrices.some((price) => price === null)) continue;
      const value = groups.reduce((sum, [, shares], index) => sum + shares * (latestPrices[index] ?? 0), 0);
      points.push({ timestamp, value });
    }
    return points;
  }, [groups, histories, historyReady, symbols]);

  const seriesAvailable = history.length >= 2;
  const historyChange = seriesAvailable ? history[history.length - 1].value - history[0].value : null;
  const historyPercent = historyChange !== null && history[0].value !== 0
    ? historyChange / history[0].value * 100
    : null;
  const axisLabels = seriesAvailable
    ? [...new Set([0, 0.25, 0.5, 0.75, 1].map((fraction) =>
        formatHistoryTimestamp(history[Math.round((history.length - 1) * fraction)].timestamp, "1M"),
      ))]
    : [];
  const historyPositive = historyChange === null || historyChange >= 0;

  return (
    <section className="card portfolio-performance-card" aria-labelledby="portfolio-performance-heading">
      <div className="portfolio-performance-heading">
        <div><span className="eyebrow">REAL MASSIVE CLOSING PRICES</span><h2 id="portfolio-performance-heading">Portfolio performance</h2></div>
        <span className="portfolio-performance-period"><Icon name="activity" size={14} /> 1 MONTH</span>
      </div>
      <div className="portfolio-performance-chart">
        {seriesAvailable ? (
          <>
            <PerformanceChart
              data={history.map((point) => point.value)}
              isPositive={historyPositive}
              label="Historical value of current portfolio positions based on real Massive closing prices"
            />
            <div className="chart-x-axis">{axisLabels.map((label, index) => <span key={index}>{label}</span>)}</div>
          </>
        ) : (
          <div className="chart-empty" role={failedSymbol ? "alert" : "status"}>
            {!ready
              ? "Loading your saved holdings…"
              : symbols.length === 0
                ? "Add holdings in Portfolio to see their real one month value history."
                : symbols.length > historyLimit
                  ? "Historical trends are limited to 8 positions at a time to protect market data limits."
                  : historyLoading
                    ? "Loading real historical prices for your positions…"
                    : failedSymbol
                      ? `Real historical prices are unavailable for ${failedSymbol}.`
                      : "Real portfolio history is unavailable for these positions."}
          </div>
        )}
      </div>
      <div className="portfolio-performance-footer">
        <span><Icon name="activity" size={15} /> Current share counts · End-of-day history</span>
        {historyPercent === null ? (
          <span className="portfolio-performance-change">One month value change unavailable</span>
        ) : (
          <span className={"portfolio-performance-change " + (historyPositive ? "positive-text" : "negative-text")}>
            {historyPositive ? "Up " : "Down "}{Math.abs(historyPercent).toFixed(2)}% over 1 month
          </span>
        )}
      </div>
    </section>
  );
}
