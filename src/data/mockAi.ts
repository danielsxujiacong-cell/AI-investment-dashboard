// MOCK_AI — replace this response layer with an OpenAI-backed implementation in STEP 4.
export function getMockAiResponse(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("nvda") || normalized.includes("nvidia")) {
    return "NVIDIA sits at the center of the AI infrastructure cycle. Our mock snapshot shows positive momentum today, while its premium valuation makes execution, customer concentration, and data-center spending worth monitoring. This is a simulated research summary, not live market data.";
  }

  if (normalized.includes("risk")) {
    return "The main portfolio risks in this mock snapshot are concentration in large-cap technology, elevated growth-stock valuations, and sensitivity to macroeconomic data. Consider how each position fits your time horizon and risk tolerance.";
  }

  if (normalized.includes("watchlist")) {
    return "Your watchlist is broadly positive in this simulated session, led by NVDA and AMZN. TSLA is the only name lower today. The list is concentrated in technology, so sector-wide news may affect several holdings at once.";
  }

  if (normalized.includes("market") || normalized.includes("movement")) {
    return "Technology is leading this simulated market session as semiconductor and cloud themes stay in focus. The brief also flags elevated valuations and potential volatility around upcoming macroeconomic data.";
  }

  return "Based on this simulated dashboard, momentum is constructive but concentrated in large-cap technology. Compare the underlying business drivers, valuation, and portfolio weight before drawing a conclusion. This response uses mock data only.";
}
