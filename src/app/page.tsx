import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedStocks } from "@/components/featured-stocks";
import { Icon } from "@/components/icons";
import { MarketBriefCard } from "@/components/market-brief-card";
import { StockUniverseSearch } from "@/components/stock-universe-search";

export const metadata: Metadata = {
  title: "Explore the Market",
  description: "Real market data and AI-powered research for public companies.",
};

const shortcuts = [
  { label: "Watchlist", detail: "Track companies", href: "/watchlist/", icon: "watchlist" as const },
  { label: "Portfolio", detail: "Manage holdings", href: "/portfolio/", icon: "portfolio" as const },
  { label: "AI Assistant", detail: "Explore a thesis", href: "/assistant/", icon: "assistant" as const },
];

export default function DashboardPage() {
  return (
    <div className="page-stack page-enter market-home">
      <section className="market-hero" aria-labelledby="market-home-title">
        <div className="market-hero-glow" aria-hidden="true" />
        <div className="market-hero-kicker"><span className="live-dot" /> NORTHSTAR · MARKET INTELLIGENCE</div>
        <h1 id="market-home-title">Explore the Market.</h1>
        <p>Real market data. AI-powered research.</p>
        <StockUniverseSearch />
        <div className="market-hero-footnote">
          <span>Search active US stocks</span><i aria-hidden="true" />
          <span>Browse without an account</span>
        </div>
      </section>

      <FeaturedStocks />

      <section className="market-brief-section" aria-labelledby="market-brief-heading">
        <div className="market-section-heading">
          <div>
            <span className="eyebrow">RESEARCH, GROUNDED IN MARKET DATA</span>
            <h2 id="market-brief-heading">AI Market Brief</h2>
          </div>
          <span className="market-brief-model"><Icon name="sparkles" size={14} /> GLM · ON DEMAND</span>
        </div>
        <MarketBriefCard />
      </section>

      <nav className="market-shortcuts" aria-label="Personal workspace shortcuts">
        {shortcuts.map((shortcut) => (
          <Link className="market-shortcut" href={shortcut.href} key={shortcut.label}>
            <span className="market-shortcut-icon"><Icon name={shortcut.icon} size={17} /></span>
            <span className="market-shortcut-copy"><strong>{shortcut.label}</strong><small>{shortcut.detail}</small></span>
            <Icon name="arrow-up-right" size={14} className="market-shortcut-arrow" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
