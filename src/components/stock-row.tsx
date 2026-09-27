import Link from "next/link";
import type { ReactNode } from "react";
import type { Stock } from "@/data/stocks";
import { Icon } from "@/components/icons";
import { Sparkline } from "@/components/charts";

export function StockRow({ stock }: { stock: Stock }) {
  const positive = stock.changePercent >= 0;

  return (
    <Link href={"/stocks/" + stock.symbol} className="stock-row">
      <div className="stock-identity">
        <span className={"stock-monogram monogram-" + stock.symbol}>{stock.symbol.slice(0, 1)}</span>
        <span className="stock-name-wrap">
          <strong>{stock.symbol}</strong>
          <span>{stock.name}</span>
        </span>
      </div>
      <div className={"stock-spark " + (positive ? "positive" : "negative")}>
        <Sparkline data={stock.sparkline} />
      </div>
      <div className="stock-price">
        <strong>{"$" + stock.price.toFixed(2)}</strong>
        <span
          className={positive ? "positive-text" : "negative-text"}
          title={`${positive ? "+" : ""}${stock.change.toFixed(2)} (${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%) today`}
        >
          {positive ? "+" : ""}{stock.changePercent.toFixed(2)}%
        </span>
        <small className={positive ? "positive-text" : "negative-text"}>
          {positive ? "+$" : "-$"}{Math.abs(stock.change).toFixed(2)}
        </small>
      </div>
      <span className="stock-row-chevron"><Icon name="chevron-right" size={16} /></span>
    </Link>
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
