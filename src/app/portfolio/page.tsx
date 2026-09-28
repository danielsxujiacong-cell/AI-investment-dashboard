import type { Metadata } from "next";
import { PortfolioWorkspace } from "@/components/portfolio-workspace";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return <PortfolioWorkspace />;
}
