import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "@/components/app-shell";
import { PersonalDataProvider } from "@/components/personal-data-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://invest.danielxu.cn"),
  robots: { index: false, follow: false },
  title: {
    default: "AI 投资研究看板｜Daniel Xu",
    template: "%s · Northstar",
  },
  description: "Daniel Xu 的 AI 投资研究看板，提供公开市场行情与公司研究入口，个人持仓、关注列表和 AI 对话需登录。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`try {
  var savedTheme = localStorage.getItem("northstar-theme");
  var preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : preferredTheme;
} catch (_) {
  document.documentElement.dataset.theme = "dark";
}`}
        </Script>
        <PersonalDataProvider>
          <AppShell>{children}</AppShell>
        </PersonalDataProvider>
      </body>
    </html>
  );
}
