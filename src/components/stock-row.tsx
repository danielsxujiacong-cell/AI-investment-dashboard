import Link from "next/link";
import type { ReactNode } from "react";
import type { Stock } from "@/data/stocks";
import type { MiniHistoryState } from "@/hooks/use-stock-market-data";
import { Icon } from "@/components/icons";
import { Sparkline } from "@/components/charts";

export function StockRow({
  stock,
  history,
  onRemove,
}: {
  stock: Stock;
  history?: MiniHistoryState;
  onRemove: (symbol: string) => void;
}) {
  const chartPositive = history?.points.length
    ? history.points[history.points.length - 1].close >= history.points[0].close
    : null;

  return (
    <div className="stock-row">
      <Link href={"/stocks/" + stock.symbol} className="stock-row-link">
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
          <strong>{"$" + stock.price.toFixed(2)}</strong>
          <span
            className={stock.changePercent >= 0 ? "positive-text" : "negative-text"}
            title={
              (stock.changePercent >= 0 ? "+" : "") + stock.change.toFixed(2) +
              " (" + (stock.changePercent >= 0 ? "+" : "") + stock.changePercent.toFixed(2) + "%) today"
            }
          >
            {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
          </span>
          <small className={stock.change >= 0 ? "positive-text" : "negative-text"}>
            {stock.change >= 0 ? "+$" : "-$"}{Math.abs(stock.change).toFixed(2)}
          </small>
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
