"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkline } from "@/components/charts";
import { Icon } from "@/components/icons";
import { getHistoricalPrices, type HistoricalPricePoint } from "@/data/market-history";
import { popularTechStocks, stockDetailHref, type StockReference } from "@/data/stock-universe";
import type { LiveStockQuote } from "@/data/market-quotes";
import { getLiveStockQuote } from "@/hooks/use-stock-market-data";

const featuredSymbols = ["NVDA", "MSFT", "AAPL", "GOOGL", "AMD", "PLTR", "TSLA", "META"];
const featuredStocks = featuredSymbols.flatMap((symbol) => {
  const reference = popularTechStocks.find((stock) => stock.symbol === symbol);
  return reference ? [reference] : [];
});

type HistoryState = {
  status: "loading" | "ready" | "unavailable";
  points: HistoricalPricePoint[];
};

function formatPrice(value: number) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(value: number) {
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

function CompanyIdentity({ stock }: { stock: StockReference }) {
  return (
    <span className="market-stock-identity">
      <span className="market-stock-monogram" aria-hidden="true">{stock.symbol.slice(0, 1)}</span>
      <span className="market-stock-name">
        <strong>{stock.symbol}</strong>
        <small>{stock.name}</small>
      </span>
    </span>
  );
}

function FeaturedStockCard({
  stock,
  quote,
  history,
}: {
  stock: StockReference;
  quote: LiveStockQuote | null | undefined;
  history: HistoryState;
}) {
  const historyPositive = history.points.length > 1
    ? history.points[history.points.length - 1].close >= history.points[0].close
    : undefined;

  return (
    <Link className="market-stock-card" href={stockDetailHref(stock)} aria-label={`Open ${stock.symbol}, ${stock.name} stock details`}>
      <div className="market-stock-card-top">
        <CompanyIdentity stock={stock} />
        <Icon name="arrow-up-right" size={15} className="market-stock-open" />
      </div>
      <div className="market-stock-quote">
        <strong>{quote ? formatPrice(quote.price) : quote === null ? "Unavailable" : "—"}</strong>
        <span className={quote ? quote.changePercent >= 0 ? "positive-text" : "negative-text" : "market-stock-quote-unavailable"}>
          {quote ? formatChange(quote.changePercent) : quote === null ? "Quote unavailable" : "Loading quote"}
        </span>
      </div>
      <div className="market-stock-chart-row">
        <div className={"market-stock-trend" + (historyPositive === undefined ? "" : historyPositive ? " positive" : " negative")}>
          {history.status === "ready" ? (
            <Sparkline
              data={history.points.map((point) => point.close)}
              label={`${stock.symbol} one month historical price trend`}
              isPositive={historyPositive}
            />
          ) : history.status === "loading" ? (
            <span className="market-stock-chart-loading" role="status" aria-label={`Loading ${stock.symbol} historical prices`} />
          ) : (
            <span className="market-stock-chart-unavailable" title="Real one month historical prices are unavailable">Unavailable</span>
          )}
        </div>
        <span className="market-stock-chart-period">1M · EOD</span>
      </div>
    </Link>
  );
}

export function FeaturedStocks() {
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote | null>>({});
  const [histories, setHistories] = useState<Record<string, HistoryState>>(() =>
    Object.fromEntries(featuredStocks.map((stock) => [stock.symbol, { status: "loading", points: [] }])),
  );
  const quotesLoaded = Object.keys(quotes).length === featuredStocks.length;
  const availableQuotes = Object.values(quotes).filter((quote) => quote !== null).length;

  useEffect(() => {
    let active = true;

    featuredStocks.forEach((stock) => {
      void getLiveStockQuote(stock.symbol).then((quote) => {
        if (active) setQuotes((current) => ({ ...current, [stock.symbol]: quote }));
      }).catch(() => {
        if (active) setQuotes((current) => ({ ...current, [stock.symbol]: null }));
      });

      void getHistoricalPrices(stock.symbol, "1M").then((points) => {
        if (active) setHistories((current) => ({ ...current, [stock.symbol]: { status: "ready", points } }));
      }).catch(() => {
        if (active) setHistories((current) => ({ ...current, [stock.symbol]: { status: "unavailable", points: [] } }));
      });
    });

    return () => { active = false; };
  }, []);

  const quoteStatus = !quotesLoaded
    ? "UPDATING QUOTES"
    : availableQuotes === featuredStocks.length
      ? "LIVE QUOTES"
      : availableQuotes > 0
        ? `${availableQuotes} OF ${featuredStocks.length} QUOTES AVAILABLE`
        : "QUOTES UNAVAILABLE";

  return (
    <section className="market-featured-section" aria-labelledby="featured-stocks-heading">
      <div className="market-section-heading">
        <div>
          <span className="eyebrow">A LIVE VIEW OF THE MARKET</span>
          <h2 id="featured-stocks-heading">Featured Stocks</h2>
        </div>
        <div className="market-featured-actions">
          <span className="market-featured-status"><i className="live-dot" />{quoteStatus}</span>
          <Link href="/stock/" className="market-explore-link">Explore all <Icon name="arrow-right" size={15} /></Link>
        </div>
      </div>

      <div className="market-featured-grid">
        {featuredStocks.map((stock) => (
          <FeaturedStockCard
            key={stock.symbol}
            stock={stock}
            quote={quotes[stock.symbol]}
            history={histories[stock.symbol]}
          />
        ))}
      </div>
      <p className="market-featured-note">Finnhub quotes · Massive one month closing prices · Unavailable data is never estimated</p>
    </section>
  );
}
