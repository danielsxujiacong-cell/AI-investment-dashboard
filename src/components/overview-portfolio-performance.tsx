"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PerformanceChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { usePersonalData } from "@/components/personal-data-provider";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import { formatHistoryTimestamp } from "@/data/market-history";

function money(value: number) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OverviewPortfolioPerformance() {
  const { data, ready } = usePersonalData();
  const marketData = useStockMarketData(true);

  const groups = useMemo(() => {
    const sharesBySymbol = new Map<string, number>();
    for (const holding of data.portfolio) {
      sharesBySymbol.set(holding.symbol, (sharesBySymbol.get(holding.symbol) ?? 0) + holding.shares);
    }
    return [...sharesBySymbol.entries()];
  }, [data.portfolio]);

  const history = useMemo(() => {
    if (groups.length === 0) return [];
    const histories = groups.map(([symbol]) => marketData.history[symbol]);
    if (histories.some((item) => item?.status !== "ready")) return [];

    const timestamps = [...new Set(histories.flatMap((item) => item.points.map((point) => point.timestamp)))]
      .sort((a, b) => a - b);
    const cursors = histories.map(() => 0);
    const latestPrices: Array<number | null> = histories.map(() => null);
    const points: Array<{ timestamp: number; value: number }> = [];

    for (const timestamp of timestamps) {
      histories.forEach((item, index) => {
        while (cursors[index] < item.points.length && item.points[cursors[index]].timestamp <= timestamp) {
          latestPrices[index] = item.points[cursors[index]].close;
          cursors[index] += 1;
        }
      });
      if (latestPrices.some((price) => price === null)) continue;
      const value = groups.reduce(
        (sum, [, shares], index) => sum + shares * (latestPrices[index] ?? 0),
        0,
      );
      points.push({ timestamp, value });
    }

    return points;
  }, [groups, marketData.history]);

  const currentValue = groups.reduce((sum, [symbol, shares]) => {
    const quote = marketData.liveQuotes[symbol];
    return sum + (quote ? shares * quote.price : 0);
  }, 0);
  const todayGain = groups.reduce((sum, [symbol, shares]) => {
    const quote = marketData.liveQuotes[symbol];
    return sum + (quote ? shares * quote.change : 0);
  }, 0);
  const hasQuotes = ready && marketData.status !== "loading" &&
    groups.every(([symbol]) => Boolean(marketData.liveQuotes[symbol]));
  const hasHistoryError = groups
    .map(([symbol]) => marketData.history[symbol])
    .find((item) => item?.status === "error");
  const historyLoading = groups.length > 0 && !hasHistoryError &&
    groups.some(([symbol]) => marketData.history[symbol]?.status === "loading");
  const seriesAvailable = history.length >= 2;
  const historyChange = seriesAvailable
    ? history[history.length - 1].value - history[0].value
    : null;
  const historyPercent = historyChange !== null && history[0].value !== 0
    ? historyChange / history[0].value * 100
    : null;
  const todayPositive = todayGain >= 0;
  const historyPositive = historyChange === null || historyChange >= 0;
  const axisLabels = seriesAvailable
    ? [...new Set([0, 0.25, 0.5, 0.75, 1].map((fraction) =>
        formatHistoryTimestamp(history[Math.round((history.length - 1) * fraction)].timestamp, "1M"),
      ))]
    : [];

  const quoteLabel = marketData.status === "loading"
    ? "LOADING LIVE QUOTES / MARKET DATA"
    : marketData.status === "live"
      ? "LIVE QUOTES / MARKET DATA"
      : marketData.status === "partial"
        ? "PARTIAL QUOTES UNAVAILABLE"
        : "QUOTES UNAVAILABLE";

  return (
    <section className="overview-card card">
      <div className="overview-main">
        <div className="overview-card-top">
          <div>
            <span className="eyebrow">TOTAL HOLDINGS VALUE</span>
            <div className="portfolio-value">{hasQuotes ? money(currentValue) : ready && groups.length === 0 ? "$0.00" : "—"}</div>
          </div>
          <div className={"overview-date market-state-" + marketData.status}><span className="live-dot" /> {quoteLabel}</div>
        </div>
        <div className="overview-change-row">
          <span className={"change-pill " + (hasQuotes ? todayPositive ? "positive-text" : "negative-text" : "")}>
            {hasQuotes && <Icon name={todayPositive ? "arrow-up-right" : "arrow-down-right"} size={14} />}
            {hasQuotes ? (todayPositive ? "+" : "") + money(todayGain) : "—"}
          </span>
          <span className={"change-percent " + (hasQuotes ? todayPositive ? "positive-text" : "negative-text" : "")}>
            {hasQuotes && currentValue - todayGain !== 0
              ? (todayGain >= 0 ? "+" : "") + (todayGain / (currentValue - todayGain) * 100).toFixed(2) + "%"
              : "—"}
          </span>
          <span className="change-period">today</span>
        </div>
        <div className="overview-chart-wrap">
          {seriesAvailable ? (
            <>
              <PerformanceChart
                data={history.map((point) => point.value)}
                isPositive={historyPositive}
                label="Historical value of current holdings based on real Massive closing prices"
              />
              <div className="chart-x-axis">{axisLabels.map((label, index) => <span key={index}>{label}</span>)}</div>
            </>
          ) : (
            <div className="chart-empty" role={historyLoading ? "status" : hasHistoryError ? "alert" : "status"}>
              {!ready
                ? "Loading your saved holdings…"
                : groups.length === 0
                  ? "Add holdings in Portfolio to see their real one month price history."
                  : historyLoading
                    ? "Loading real historical prices for your holdings…"
                    : hasHistoryError
                      ? hasHistoryError.error
                      : "Real price history is unavailable for these holdings."}
            </div>
          )}
        </div>
        <div className="overview-bottom">
          <div>
            <span className="overview-bottom-icon"><Icon name="activity" size={16} /></span>
            <span>
              {historyPercent === null
                ? "Current holdings · 1 month"
                : <>{historyPercent >= 0 ? "Up " : "Down "}<strong>{Math.abs(historyPercent).toFixed(2)}%</strong> over 1 month</>}
            </span>
          </div>
          <Link href="/portfolio" className="text-action">View portfolio <Icon name="arrow-right" size={15} /></Link>
        </div>
        {seriesAvailable && <p className="holdings-note">Historical value applies your current share counts to Massive end-of-day closes; current holdings use Finnhub quotes. It does not include past trades or cash.</p>}
      </div>
      <aside className="overview-aside">
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
        <div className="aside-topline"><span>PORTFOLIO HEALTH</span><Icon name="more" size={17} /></div>
        <div className="health-score"><strong>—</strong></div>
        <div className="health-status">Unavailable</div>
        <div className="health-divider" />
        <p>A portfolio health score is not currently available from verified account data.</p>
        <Link href="/assistant?prompt=What%20are%20today%27s%20portfolio%20risks" className="aside-link">Explore portfolio risks <Icon name="arrow-up-right" size={14} /></Link>
      </aside>
    </section>
  );
}
