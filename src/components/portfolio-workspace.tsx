"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InvestmentNotes } from "@/components/investment-notes";
import { Icon } from "@/components/icons";
import { MarketDataStatusMessage } from "@/components/market-data-status";
import { useStockMarketData } from "@/hooks/use-stock-market-data";
import { usePersonalData } from "@/components/personal-data-provider";
import type { PortfolioHolding } from "@/data/personal-data";

function money(value: number) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sharesLabel(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PortfolioWorkspace() {
  const { data, ready, storageAvailable, savePortfolio } = usePersonalData();
  const marketData = useStockMarketData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [symbol, setSymbol] = useState(marketData.stocks[0]?.symbol ?? "NVDA");
  const [shares, setShares] = useState("");
  const [averageCost, setAverageCost] = useState("");

  const positions = useMemo(() => data.portfolio.map((holding) => {
    const stock = marketData.stocks.find((item) => item.symbol === holding.symbol);
    const quote = marketData.liveQuotes[holding.symbol];
    const costBasis = holding.shares * holding.averageCost;
    const currentPrice = quote?.price ?? null;
    const currentValue = currentPrice === null ? null : holding.shares * currentPrice;
    const gainLoss = currentValue === null ? null : currentValue - costBasis;
    return {
      holding,
      stock,
      currentPrice,
      costBasis,
      currentValue,
      gainLoss,
      gainLossPercent: gainLoss === null || costBasis === 0 ? null : (gainLoss / costBasis) * 100,
    };
  }), [data.portfolio, marketData.stocks, marketData.liveQuotes]);

  const totalValue = positions.length === 0
    ? 0
    : positions.every((position) => position.currentValue !== null)
      ? positions.reduce((sum, position) => sum + (position.currentValue ?? 0), 0)
      : null;
  const totalCost = positions.reduce((sum, position) => sum + position.costBasis, 0);
  const totalGainLoss = totalValue === null ? null : totalValue - totalCost;
  const totalGainLossPercent = totalGainLoss === null || totalCost === 0 ? null : (totalGainLoss / totalCost) * 100;

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setSymbol(marketData.stocks[0]?.symbol ?? "NVDA");
    setShares("");
    setAverageCost("");
  }

  function beginAdd() {
    if (!ready) return;
    setEditingId(null);
    setSymbol(marketData.stocks[0]?.symbol ?? "NVDA");
    setShares("");
    setAverageCost("");
    setFormOpen(true);
  }

  function beginEdit(holding: PortfolioHolding) {
    if (!ready) return;
    setEditingId(holding.id);
    setSymbol(holding.symbol);
    setShares(String(holding.shares));
    setAverageCost(String(holding.averageCost));
    setFormOpen(true);
  }

  function submitHolding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    const parsedShares = Number(shares);
    const parsedAverageCost = Number(averageCost);
    if (!Number.isFinite(parsedShares) || parsedShares <= 0 || !Number.isFinite(parsedAverageCost) || parsedAverageCost <= 0) return;

    if (editingId) {
      savePortfolio(data.portfolio.map((holding) => holding.id === editingId
        ? { ...holding, symbol, shares: parsedShares, averageCost: parsedAverageCost }
        : holding));
    } else {
      savePortfolio([...data.portfolio, { id: createId(), symbol, shares: parsedShares, averageCost: parsedAverageCost }]);
    }
    resetForm();
  }

  function removeHolding(id: string) {
    if (!ready) return;
    savePortfolio(data.portfolio.filter((holding) => holding.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="page-stack page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR INVESTMENT WORKSPACE</span>
          <h1>Portfolio<span className="heading-period">.</span></h1>
          <p>Track your positions with current market quotes.</p>
        </div>
        <button type="button" className="primary-button heading-cta" onClick={beginAdd} disabled={!ready}>
          <Icon name="plus" size={15} /> Add holding
        </button>
      </div>

      <div className="portfolio-stat-grid">
        <section className="card portfolio-stat-card primary-stat">
          <span className="eyebrow">TOTAL PORTFOLIO VALUE</span>
          <strong>{ready ? totalValue === null ? "N/A" : money(totalValue) : "—"}</strong>
          <span className="stat-foot">Based on current quotes</span>
        </section>
        <section className="card portfolio-stat-card">
          <span className="eyebrow">TOTAL COST</span>
          <strong>{ready ? money(totalCost) : "—"}</strong>
          <span className="stat-foot">Your saved average costs</span>
        </section>
        <section className="card portfolio-stat-card">
          <span className="eyebrow">UNREALIZED GAIN / LOSS</span>
          <strong className={totalGainLoss === null ? "" : totalGainLoss >= 0 ? "positive-text" : "negative-text"}>
            {ready ? totalGainLoss === null ? "—" : `${totalGainLoss >= 0 ? "+" : ""}${money(totalGainLoss)}` : "—"}
          </strong>
          <span className="stat-foot">
            {totalGainLossPercent === null ? "Across your saved positions" : `${totalGainLossPercent >= 0 ? "+" : ""}${totalGainLossPercent.toFixed(2)}% unrealized`}
          </span>
        </section>
      </div>

      {formOpen && (
        <form className="card personal-form holding-form" onSubmit={submitHolding}>
          <div className="personal-form-heading">
            <div><span className="eyebrow">POSITION DETAILS</span><h2>{editingId ? "Edit holding" : "Add a holding"}</h2></div>
            <button type="button" className="text-action" onClick={resetForm}>Cancel</button>
          </div>
          <div className="personal-form-fields holding-form-fields">
            <label className="personal-field"><span>Symbol</span>
              <select value={symbol} onChange={(event) => setSymbol(event.target.value)} required>
                {marketData.stocks.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} · {stock.name}</option>)}
              </select>
            </label>
            <label className="personal-field"><span>Shares</span>
              <input type="number" min="0.000001" step="any" value={shares} onChange={(event) => setShares(event.target.value)} placeholder="20" required />
            </label>
            <label className="personal-field"><span>Average cost ($)</span>
              <input type="number" min="0.01" step="any" value={averageCost} onChange={(event) => setAverageCost(event.target.value)} placeholder="150.00" required />
            </label>
            <div className="personal-form-actions">
              <button type="submit" className="primary-button">{editingId ? "Save changes" : "Save holding"}</button>
            </div>
          </div>
          <p className="form-help">Live quotes are available for the five symbols in your Watchlist.</p>
        </form>
      )}

      <section className="card positions-card">
        <div className="panel-heading">
          <div><span className="eyebrow">POSITIONS</span><h2>My holdings</h2></div>
          <span className="holdings-count">{data.portfolio.length} {data.portfolio.length === 1 ? "position" : "positions"}</span>
        </div>
        {!ready ? <div className="position-empty">Loading your saved positions…</div> : positions.length === 0 ? (
          <div className="position-empty">
            <strong>No holdings yet</strong>
            <span>Add a symbol, share count, and average cost to start tracking your portfolio.</span>
            <button type="button" className="text-action" onClick={beginAdd} disabled={!ready}><Icon name="plus" size={14} /> Add your first holding</button>
          </div>
        ) : (
          <div className="position-list">
            {positions.map(({ holding, stock, costBasis, currentPrice, currentValue, gainLoss, gainLossPercent }) => (
              <article className="position-row" key={holding.id}>
                <div className="position-row-header">
                  <Link href={stock ? `/stocks/${holding.symbol}` : "/watchlist"} className="position-identity">
                    <span className="holding-symbol" style={{ backgroundColor: "rgba(154,199,168,.12)", color: "#9ac7a8" }}>{holding.symbol.slice(0, 1)}</span>
                    <span><strong>{holding.symbol}</strong><small>{stock?.name ?? "Quote unavailable"}</small></span>
                  </Link>
                  <div className="position-actions">
                    <button type="button" className="text-action" onClick={() => beginEdit(holding)}>Edit</button>
                    <button type="button" className="text-action danger-action" onClick={() => removeHolding(holding.id)}>Delete</button>
                  </div>
                </div>
                <div className="position-metrics">
                  <div className="position-metric"><span>SHARES</span><strong>{sharesLabel(holding.shares)}</strong></div>
                  <div className="position-metric"><span>AVERAGE COST</span><strong>{money(holding.averageCost)}</strong></div>
                  <div className="position-metric"><span>CURRENT PRICE</span><strong>{currentPrice === null ? "N/A" : money(currentPrice)}</strong></div>
                  <div className="position-metric"><span>CURRENT VALUE</span><strong>{currentValue === null ? "N/A" : money(currentValue)}</strong></div>
                  <div className="position-metric"><span>COST BASIS</span><strong>{money(costBasis)}</strong></div>
                  <div className="position-metric"><span>GAIN / LOSS</span>
                    <strong className={gainLoss === null ? "" : gainLoss >= 0 ? "positive-text" : "negative-text"}>
                      {gainLoss === null ? "N/A" : `${gainLoss >= 0 ? "+" : ""}${money(gainLoss)}`}
                    </strong>
                    <small>{gainLossPercent === null ? "" : `${gainLossPercent >= 0 ? "+" : ""}${gainLossPercent.toFixed(2)}%`}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="holdings-note">
          <MarketDataStatusMessage status={marketData.status} failedSymbols={marketData.failedSymbols} lastUpdated={marketData.lastUpdated} />
        </div>
      </section>

      <InvestmentNotes />

      <p className="personal-data-notice">Personal data is stored locally on this device.{!storageAvailable ? " Local storage is unavailable; changes last for this visit." : ""}</p>
    </div>
  );
}
