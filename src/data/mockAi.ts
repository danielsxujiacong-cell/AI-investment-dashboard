// Keep the mock response layer until STEP 3 is resumed with OPENAI_API_KEY configured.
import type { InvestmentMemory, PortfolioHolding } from "@/data/personal-data";

export type MockAiPersonalContext = {
  portfolio: PortfolioHolding[];
  investmentMemory: Record<string, InvestmentMemory>;
  watchlistSymbols: string[];
};

function personalContextFor(prompt: string, context?: MockAiPersonalContext) {
  if (!context) return "";
  const personalContext = context;
  const normalized = prompt.toLowerCase();
  const knownSymbols = [...new Set([
    ...personalContext.portfolio.map((holding) => holding.symbol),
    ...Object.keys(personalContext.investmentMemory),
    ...personalContext.watchlistSymbols,
  ])];
  const mentionedSymbol = knownSymbols.find((symbol) => normalized.includes(symbol.toLowerCase()) ||
    (symbol === "NVDA" && normalized.includes("nvidia")));

  function holdingSummary(symbol: string) {
    const holding = personalContext.portfolio.find((item) => item.symbol === symbol);
    const memory = personalContext.investmentMemory[symbol];
    const details: string[] = [];
    const sentence = (value: string) => {
      const cleaned = value.trim().replace(/[.!?。！？]+$/, "");
      return cleaned ? `${cleaned}.` : "";
    };
    if (holding) details.push(`You hold ${holding.shares} ${holding.shares === 1 ? "share" : "shares"} of ${symbol}.`);
    if (memory?.buyThesis.trim()) details.push(sentence(`Your thesis: ${memory.buyThesis}`));
    if (memory?.whyWatching.trim()) details.push(sentence(`Why you are watching it: ${memory.whyWatching}`));
    if (memory?.risks.trim()) details.push(sentence(`A risk you noted: ${memory.risks}`));
    if (memory?.exitConditions.trim()) details.push(sentence(`Your review condition: ${memory.exitConditions}`));
    if (memory?.personalNotes.trim()) details.push(sentence(`Your note: ${memory.personalNotes}`));
    return details.join(" ");
  }

  if (mentionedSymbol) {
    const summary = holdingSummary(mentionedSymbol);
    return summary ? ` Your saved personal context for ${mentionedSymbol}: ${summary}` : "";
  }

  if (normalized.includes("watchlist")) {
    const names = personalContext.watchlistSymbols.length > 0 ? personalContext.watchlistSymbols.join(", ") : "none saved";
    const firstSymbol = personalContext.portfolio[0]?.symbol ?? Object.keys(personalContext.investmentMemory)[0];
    const firstSavedContext = firstSymbol ? holdingSummary(firstSymbol) : "";
    return ` Your current Watchlist includes ${names}.${firstSavedContext ? ` ${firstSavedContext}` : ""}`;
  }

  if (normalized.includes("risk")) {
    const savedRisks = Object.entries(personalContext.investmentMemory)
      .map(([symbol, memory]) => {
        const risk = memory.risks.trim();
        return risk ? `${symbol}: ${risk}` : "";
      })
      .filter(Boolean);
    if (savedRisks.length > 0) return ` Your saved risk notes say: ${savedRisks.join("; ")}.`;
  }

  const firstSymbol = personalContext.portfolio[0]?.symbol ?? Object.keys(personalContext.investmentMemory)[0];
  const firstSavedContext = firstSymbol ? holdingSummary(firstSymbol) : "";
  return firstSavedContext ? ` Your saved personal context: ${firstSavedContext}` : "";
}

export function getMockAiResponse(prompt: string, context?: MockAiPersonalContext) {
  const normalized = prompt.toLowerCase();
  let response: string;

  if (normalized.includes("nvda") || normalized.includes("nvidia")) {
    response = "NVIDIA sits at the center of the AI infrastructure cycle. Our mock snapshot shows positive momentum today, while its premium valuation makes execution, customer concentration, and data-center spending worth monitoring. This is a simulated research summary, not live market data.";
  } else if (normalized.includes("risk")) {
    response = "The main portfolio risks in this mock snapshot are concentration in large-cap technology, elevated growth-stock valuations, and sensitivity to macroeconomic data. Consider how each position fits your time horizon and risk tolerance.";
  } else if (normalized.includes("watchlist")) {
    response = "Your watchlist is broadly positive in this simulated session, led by NVDA and AMZN. TSLA is the only name lower today. The list is concentrated in technology, so sector-wide news may affect several holdings at once.";
  } else if (normalized.includes("market") || normalized.includes("movement")) {
    response = "Technology is leading this simulated market session as semiconductor and cloud themes stay in focus. The brief also flags elevated valuations and potential volatility around upcoming macroeconomic data.";
  } else {
    response = "Based on this simulated dashboard, momentum is constructive but concentrated in large-cap technology. Compare the underlying business drivers, valuation, and portfolio weight before drawing a conclusion. This response uses mock data only.";
  }

  return response + personalContextFor(prompt, context);
}
