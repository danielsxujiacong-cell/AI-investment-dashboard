import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "@/components/app-shell";
import { PersonalDataProvider } from "@/components/personal-data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Investment Dashboard",
    template: "%s · Northstar",
  },
  description: "A personal investment research workspace with live stock quotes and illustrative portfolio insights.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
