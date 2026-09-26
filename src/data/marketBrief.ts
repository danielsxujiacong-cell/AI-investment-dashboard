export type BriefSection = {
  title: string;
  summary: string;
  detail: string;
};

export const marketBrief = {
  title: "Today's AI Market Brief",
  label: "PERSONALIZED FOR YOUR WATCHLIST",
  overview:
    "Technology stocks are leading today's gains as AI-related semiconductor names remain strong.",
  opportunities: "AI infrastructure and cloud spending remain key themes.",
  risks:
    "Valuations remain elevated and volatility could increase around macroeconomic data.",
  sections: [
    {
      title: "Market Overview",
      summary:
        "Technology stocks are leading today's gains as AI-related semiconductor names remain strong.",
      detail:
        "Large-cap technology is setting a constructive tone in this simulated session. Semiconductor strength is broadening into cloud platforms, keeping attention on infrastructure spending and the pace of enterprise adoption.",
    },
    {
      title: "Opportunities",
      summary: "AI infrastructure and cloud spending remain key themes.",
      detail:
        "Data-center investment, networking, and cloud capacity remain durable areas to monitor. Follow company guidance and realized revenue growth alongside headline investment plans.",
    },
    {
      title: "Risks",
      summary:
        "Valuations remain elevated and volatility could increase around macroeconomic data.",
      detail:
        "High expectations can leave richly valued growth stocks sensitive to changes in rates, earnings guidance, and macro releases. Position sizing and diversification matter when volatility rises.",
    },
  ] satisfies BriefSection[],
};
