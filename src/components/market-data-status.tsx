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
    message = "Loading live Finnhub quotes; Mock Data is shown until they arrive.";
  } else if (status === "live") {
    message = "Finnhub quotes · " + updatedLabel;
  } else if (status === "partial") {
    message =
      "Finnhub unavailable for " +
      failedSymbols.join(", ") +
      "; showing Mock Data for those symbols. " +
      updatedLabel;
  } else {
    message = "Finnhub quote request failed; showing Mock Data.";
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
