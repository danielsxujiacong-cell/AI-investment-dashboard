"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

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

  const section = navigation.find((item) => item.href === pathname) ?? {
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
          <div className="workspace-copy"><strong>Personal workspace</strong><span>Private account</span></div>
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
            <div><strong>Market pulse</strong><span><i className="live-dot" /> Session open</span></div>
            <span className="pulse-value">+0.8%</span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">B</div>
            <div className="profile-copy"><strong>Blake Weiss</strong><span>Personal</span></div>
            <Icon name="more" size={17} />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{section.label.toUpperCase()}</strong></div>
          <div className="topbar-actions">
            <div className="market-status"><i className="live-dot" /><span>Market Open</span><small>SIMULATED</small></div>
            <div className="topbar-divider" />
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
            <div className="topbar-avatar" aria-label="Blake Weiss">B</div>
          </div>
        </header>

        <div className="main-content">{children}</div>
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
