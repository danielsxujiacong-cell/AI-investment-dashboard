import Link from "next/link";
import type { ReactNode } from "react";
import type { Stock } from "@/data/stocks";
import { referenceFromStock, stockDetailHref } from "@/data/stock-universe";
import type { MiniHistoryState } from "@/hooks/use-stock-market-data";
import { Icon } from "@/components/icons";
import { Sparkline } from "@/components/charts";
import type { LiveStockQuote } from "@/data/market-quotes";

export function StockRow({
  stock,
  quote,
  history,
  onRemove,
}: {
  stock: Stock;
  quote: LiveStockQuote | null;
  history?: MiniHistoryState;
  onRemove: (symbol: string) => void;
}) {
  const chartPositive = history?.points.length
    ? history.points[history.points.length - 1].close >= history.points[0].close
    : null;

  return (
    <div className="stock-row">
      <Link href={stockDetailHref(referenceFromStock(stock))} className="stock-row-link">
        <div className="stock-identity">
          <span className={"stock-monogram monogram-" + stock.symbol}>{stock.symbol.slice(0, 1)}</span>
          <span className="stock-name-wrap">
            <strong>{stock.symbol}</strong>
            <span>{stock.name}</span>
          </span>
        </div>
        <div className={"stock-spark " + (chartPositive === null ? "" : chartPositive ? "positive" : "negative")}>
          {history?.status === "loading" ? (
            <span className="sparkline-placeholder" role="status" aria-label="Loading historical prices" />
          ) : history?.status === "ready" ? (
            <Sparkline
              data={history.points.map((point) => point.close)}
              label={stock.symbol + " one month historical price"}
              isPositive={chartPositive ?? undefined}
            />
          ) : (
            <span className="sparkline-unavailable" title={history?.error ?? "Historical prices unavailable"} aria-label="Historical prices unavailable">—</span>
          )}
        </div>
        <div className="stock-price">
          <strong>{quote ? "$" + quote.price.toFixed(2) : "N/A"}</strong>
          <span
            className={quote ? quote.changePercent >= 0 ? "positive-text" : "negative-text" : ""}
            title={quote ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%) today` : "Finnhub quote unavailable"}
          >
            {quote ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%` : "Unavailable"}
          </span>
          {quote && <small className={quote.change >= 0 ? "positive-text" : "negative-text"}>{quote.change >= 0 ? "+$" : "-$"}{Math.abs(quote.change).toFixed(2)}</small>}
        </div>
        <span className="stock-row-chevron"><Icon name="chevron-right" size={16} /></span>
      </Link>
      <button
        type="button"
        className="watchlist-remove-button"
        aria-label={"Remove " + stock.symbol + " from Watchlist"}
        title="Remove from Watchlist"
        onClick={() => onRemove(stock.symbol)}
      >
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
