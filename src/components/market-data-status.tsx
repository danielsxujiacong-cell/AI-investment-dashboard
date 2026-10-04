import type { MarketDataStatus } from "@/hooks/use-stock-market-data";

export function MarketDataStatusMessage({
  status,
  failedSymbols,
  lastUpdated,
  className = "",
}: {
  status: MarketDataStatus;
  failedSymbols: string[];
  lastUpdated: number | null;
  className?: string;
}) {
  const updatedLabel = lastUpdated
    ? "Last updated " +
      new Date(lastUpdated).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  let message = "";
  if (status === "loading") {
    message = "Loading Live Quotes / Market Data from Finnhub; unavailable values are shown until they arrive.";
  } else if (status === "live") {
    message = "Live Quotes / Market Data · Finnhub · " + updatedLabel;
  } else if (status === "partial") {
    message =
      "Live Quotes / Market Data · Finnhub unavailable for " +
      failedSymbols.join(", ") +
      "; affected values are unavailable. " +
      updatedLabel;
  } else {
    message = failedSymbols.length > 0
      ? "Live Quotes / Market Data unavailable for " + failedSymbols.join(", ") + "; affected values are unavailable."
      : "No Watchlist stocks available for Live Quotes / Market Data.";
  }

  return (
    <div
      className={`market-data-status market-data-status-${status} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="live-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}


export function MarketHistoryStatusMessage({
  status,
  failedSymbols,
}: {
  status: "idle" | "loading" | "ready" | "partial" | "error";
  failedSymbols: string[];
}) {
  if (status === "idle") return null;

  const message = status === "loading"
    ? "Loading Historical Market Data from Massive…"
    : status === "ready"
      ? "Historical Market Data · Massive end-of-day prices."
      : status === "partial"
        ? "Historical prices are temporarily limited for " + failedSymbols.join(", ") + "; cached real data remains visible where available, and we'll retry automatically."
        : "Historical prices are temporarily limited. We'll retry automatically.";

  return (
    <div className={"market-history-status market-history-status-" + status} role="status" aria-live="polite">
      <span>{message}</span>
    </div>
  );
}
