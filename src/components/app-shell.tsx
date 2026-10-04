"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { AccountMenu } from "@/components/account-menu";
import { PersonalDataStatus } from "@/components/personal-data-status";
import { usePersonalData } from "@/components/personal-data-provider";
import { useStockMarketData } from "@/hooks/use-stock-market-data";

const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "/", icon: "overview" },
  { label: "Watchlist", href: "/watchlist", icon: "watchlist" },
  { label: "Portfolio", href: "/portfolio", icon: "portfolio" },
  { label: "AI Assistant", href: "/assistant", icon: "assistant" },
];

type Theme = "light" | "dark";
const themeStorageKey = "northstar-theme";

function Brand() {
  return (
    <Link href="/" className="brand-lockup" aria-label="AI Investment Dashboard home">
      <span className="brand-mark"><span /></span>
      <span className="brand-name">northstar<span>·</span></span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("dark");
  const { user } = usePersonalData();
  const marketData = useStockMarketData({ maxWatchlistSymbols: 8 });
  const realQuotes = Object.values(marketData.liveQuotes);
  const averageChange = realQuotes.length
    ? realQuotes.reduce((sum, quote) => sum + quote.changePercent, 0) / realQuotes.length
    : null;
  const risingQuotes = realQuotes.filter((quote) => quote.changePercent > 0).length;
  const fallingQuotes = realQuotes.filter((quote) => quote.changePercent < 0).length;
  const pulseTitle = marketData.status === "loading"
    ? "Market pulse · Loading"
    : averageChange === null
      ? marketData.stocks.length === 0 ? "Market pulse" : "Market pulse · Unavailable"
      : "Market pulse · " + (marketData.status === "partial" ? "Partial" : "Live");
  const pulseSubtitle = marketData.status === "loading"
    ? "Loading Watchlist quotes…"
    : averageChange === null
      ? marketData.stocks.length === 0 ? "Add stocks to see Watchlist pulse" : "Finnhub quotes unavailable"
      : `${risingQuotes} up · ${fallingQuotes} down · ${realQuotes.length} quotes`;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    let hasSavedTheme = false;

    try {
      const savedTheme = window.localStorage.getItem(themeStorageKey);
      if (savedTheme === "light" || savedTheme === "dark") {
        root.dataset.theme = savedTheme;
        setTheme(savedTheme);
        hasSavedTheme = true;
      }
    } catch {
      // Keep the bootstrapped theme when storage is unavailable.
    }

    if (!hasSavedTheme) {
      const systemTheme = media.matches ? "light" : "dark";
      root.dataset.theme = systemTheme;
      setTheme(systemTheme);
    }

    const updateSystemTheme = (event: MediaQueryListEvent) => {
      let savedTheme: string | null = null;
      try {
        savedTheme = window.localStorage.getItem(themeStorageKey);
      } catch {
        // A storage failure should not break theme switching.
      }
      if (savedTheme !== "light" && savedTheme !== "dark") {
        const nextTheme = event.matches ? "light" : "dark";
        root.dataset.theme = nextTheme;
        setTheme(nextTheme);
      }
    };

    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Theme remains active for this visit when storage is unavailable.
    }
  }

  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const section = navigation.find((item) => (item.href.replace(/\/+$/, "") || "/") === normalizedPathname) ?? {
    label: "Company overview",
    href: pathname,
    icon: "watchlist" as IconName,
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-switcher">
          <div className="workspace-avatar">W</div>
          <div className="workspace-copy"><strong>Personal workspace</strong><span>{user ? "Supabase account" : "Local device"}</span></div>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={"nav-item" + (active ? " active" : "")} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.label === "AI Assistant" && <span className="nav-new">NEW</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="market-pulse">
            <div className="pulse-icon"><Icon name="activity" size={17} /></div>
            <div><strong>{pulseTitle}</strong><span>{averageChange !== null && <i className="live-dot" />}{pulseSubtitle}</span></div>
            <span className={"pulse-value" + (averageChange !== null && averageChange < 0 ? " negative-text" : "")}>{averageChange === null ? "—" : `${averageChange >= 0 ? "+" : ""}${averageChange.toFixed(2)}%`}</span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">{user?.email?.slice(0, 1).toUpperCase() ?? "G"}</div>
            <div className="profile-copy"><strong>{user?.email ?? "Guest"}</strong><span>{user ? "Supabase account" : "Local device"}</span></div>
            <Icon name="more" size={17} />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{section.label.toUpperCase()}</strong></div>
          <div className="topbar-actions">
            <div className="market-status"><i className="live-dot" /><span>Market Data</span></div>
            <div className="topbar-divider" />
            <AccountMenu />
            <button
              type="button"
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <button type="button" className="icon-button notification-button" aria-label="Notifications">
              <Icon name="bell" size={18} /><span className="notification-dot" />
            </button>
          </div>
        </header>

        <div className="main-content">
          <PersonalDataStatus />
          {children}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={"mobile-nav-item" + (active ? " active" : "")} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              <span>{item.label === "AI Assistant" ? "AI" : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
