"use client";

import { useEffect, useRef, useState } from "react";
import { getMockAiResponse } from "@/data/mockAi";
import { usePersonalData } from "@/components/personal-data-provider";
import { Icon } from "@/components/icons";
import { getLiveStockQuote, useStockMarketData } from "@/hooks/use-stock-market-data";
import { fetchMarketApi } from "@/data/market-api";

type Message = { id: number; role: "assistant" | "user"; text: string; source?: "ai" | "mock" };
type AssistantStatus = { checked: boolean; available: boolean; model: string | null };

const quickQuestions = [
  "Analyze NVDA",
  "What are today's portfolio risks?",
  "Summarize my watchlist",
  "Explain today's market movement",
];

const nonTickerTerms = new Set(["AI", "API", "CEO", "CFO", "ETF", "FYI", "NASDAQ", "NYSE", "USD"]);

function getQuestionStockSymbols(question: string) {
  const symbols = new Set<string>();
  const addMatches = (pattern: RegExp) => {
    for (const match of question.matchAll(pattern)) {
      const symbol = (match[1] ?? match[0]).toUpperCase();
      if (!nonTickerTerms.has(symbol)) symbols.add(symbol);
      if (symbols.size >= 5) break;
    }
  };

  addMatches(/\$([A-Za-z]{1,5}(?:\.[A-Za-z])?)/g);
  addMatches(/\b[A-Z]{2,5}(?:\.[A-Z])?\b/g);
  return [...symbols].slice(0, 5);
}

export function AssistantConversation() {
  const { data, ready, storageAvailable, user } = usePersonalData();
  const marketData = useStockMarketData();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>({ checked: false, available: false, model: null });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "I can help you review your portfolio, watchlist, or market data. What would you like to explore?",
    },
  ]);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get("prompt");
    if (prompt) setDraft(prompt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMarketApi("/api/assistant/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("AI status is unavailable.");
        return response.json() as Promise<{ available?: boolean; model?: string | null }>;
      })
      .then((status) => {
        if (!cancelled) setAssistantStatus({
          checked: true,
          available: status.available === true,
          model: typeof status.model === "string" ? status.model : null,
        });
      })
      .catch(() => {
        if (!cancelled) setAssistantStatus({ checked: true, available: false, model: null });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function ask(question: string) {
    const prompt = question.trim();
    if (!prompt || pending || !ready) return;

    const userId = nextId.current++;
    const assistantId = nextId.current++;
    const history = messages.filter((message) => message.id > 0).slice(-8).map((message) => ({
      role: message.role,
      content: message.text.slice(0, 2_000),
    }));
    setMessages((current) => [...current, { id: userId, role: "user", text: prompt }]);
    setDraft("");
    setPending(true);
    setRetrying(false);

    try {
      const questionSymbols = getQuestionStockSymbols(prompt);
      const requestedQuotes = await Promise.all(questionSymbols.map(async (symbol) => {
        try {
          return [symbol, await getLiveStockQuote(symbol)] as const;
        } catch {
          return [symbol, marketData.liveQuotes[symbol] ?? null] as const;
        }
      }));
      const latestFinnhubQuotes = { ...marketData.liveQuotes };
      for (const [symbol, quote] of requestedQuotes) {
        if (quote) latestFinnhubQuotes[symbol] = quote;
      }
      const marketDataStatus = requestedQuotes.length === 0 || requestedQuotes.every(([, quote]) => quote)
        ? requestedQuotes.length > 0 ? "live" : marketData.status
        : requestedQuotes.some(([, quote]) => quote) ? "partial" : marketData.status;

      const requestBody = JSON.stringify({
        question: prompt,
        history,
        context: {
          watchlist: marketData.stocks.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            latestFinnhubQuote: marketData.liveQuotes[stock.symbol] ?? null,
          })),
          portfolio: data.portfolio.map((holding) => {
            const quote = marketData.liveQuotes[holding.symbol];
            const marketValue = quote ? holding.shares * quote.price : null;
            const costBasis = holding.shares * holding.averageCost;
            return {
              ...holding,
              currentPrice: quote?.price ?? null,
              dailyChange: quote?.change ?? null,
              dailyChangePercent: quote?.changePercent ?? null,
              quoteUpdatedAt: quote?.updatedAt ?? null,
              marketValue,
              costBasis,
              unrealizedGainLoss: marketValue === null ? null : marketValue - costBasis,
            };
          }),
          marketDataSource: "Finnhub",
          marketDataStatus,
          latestFinnhubQuotes,
          marketSnapshot: requestedQuotes.map(([symbol, quote]) => ({
            symbol,
            currentPrice: quote?.price ?? null,
            dailyChange: quote?.change ?? null,
            dailyChangePercent: quote?.changePercent ?? null,
            dailyDirection: quote ? quote.changePercent > 0 ? "up" : quote.changePercent < 0 ? "down" : "flat" : "unavailable",
          })),
          investmentMemory: data.investmentMemory,
          investmentNotes: data.investmentNotes,
        },
      });

      let result: { answer?: unknown; model?: unknown } | null = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await fetchMarketApi("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(45_000),
            body: requestBody,
          });
          if (!response.ok) throw new Error("AI service is unavailable (" + response.status + ").");
          result = await response.json() as { answer?: unknown; model?: unknown };
          if (typeof result.answer !== "string" || !result.answer.trim()) throw new Error("AI service returned an empty response.");
          break;
        } catch (error) {
          if (attempt === 2) throw error;
          setRetrying(true);
          await new Promise<void>((resolve) => {
            timer.current = setTimeout(() => {
              timer.current = null;
              resolve();
            }, 700);
          });
        }
      }

      if (!result) throw new Error("AI service returned no response.");
      const answer = result.answer;
      if (typeof answer !== "string" || !answer.trim()) throw new Error("AI service returned an empty response.");

      setMessages((current) => [...current, {
        id: assistantId,
        role: "assistant",
        text: answer,
        source: "ai",
      }]);
      setAssistantStatus((current) => ({
        checked: true,
        available: true,
        model: typeof result.model === "string" ? result.model : current.model,
      }));
    } catch {
      setAssistantStatus((current) => ({ ...current, checked: true, available: false }));
      setMessages((current) => [...current, {
        id: assistantId,
        role: "assistant",
        text: getMockAiResponse(prompt, {
          portfolio: data.portfolio,
          investmentMemory: data.investmentMemory,
          watchlistSymbols: marketData.stocks.map((stock) => stock.symbol),
        }) + "\n\nThe AI API is unavailable, so this is a Mock fallback response.",
        source: "mock",
      }]);
    } finally {
      setRetrying(false);
      setPending(false);
    }
  }

  return (
    <div className="assistant-workspace">
      <div className="assistant-intro">
        <div className="assistant-orb"><Icon name="sparkles" size={22} /></div>
        <div>
          <span className="eyebrow">YOUR RESEARCH COPILOT</span>
          <h2>What would you like to explore?</h2>
          <p>Ask a question about the companies and portfolio in your workspace.</p>
        </div>
      </div>

      <section className="card personal-context-card" aria-label="Personal Context">
        <div className="panel-heading">
          <div><span className="eyebrow">AVAILABLE TO AI ON REQUEST</span><h2>Personal Context</h2></div>
          <span className="mock-label"><i /> {user ? "SUPABASE ACCOUNT" : "ON DEVICE"}</span>
        </div>
        {!ready ? <p className="context-empty">Loading your saved context…</p> : (
          <div className="personal-context-grid">
            <div className="context-group">
              <span className="eyebrow">MY HOLDINGS & MEMORY</span>
              {data.portfolio.length === 0 && Object.keys(data.investmentMemory).length === 0 ? (
                <p className="context-empty">No holdings or investment memory saved yet.</p>
              ) : (
                <ul>
                  {data.portfolio.map((holding) => {
                    const memory = data.investmentMemory[holding.symbol];
                    return (
                      <li key={holding.id}>
                        <strong>{holding.symbol}</strong><span>Holding: {holding.shares} {holding.shares === 1 ? "share" : "shares"}</span>
                        {memory?.buyThesis && <span>Thesis: {memory.buyThesis}</span>}
                        {memory?.whyWatching && <span>Watching: {memory.whyWatching}</span>}
                        {memory?.risks && <span>Risk: {memory.risks}</span>}
                        {memory?.exitConditions && <span>Exit: {memory.exitConditions}</span>}
                        {memory?.personalNotes && <span>Note: {memory.personalNotes}</span>}
                      </li>
                    );
                  })}
                  {Object.entries(data.investmentMemory).filter(([symbol]) => !data.portfolio.some((holding) => holding.symbol === symbol)).map(([symbol, memory]) => (
                    <li key={symbol}>
                      <strong>{symbol}</strong>
                      {memory.buyThesis && <span>Thesis: {memory.buyThesis}</span>}
                      {memory.whyWatching && <span>Watching: {memory.whyWatching}</span>}
                      {memory.risks && <span>Risk: {memory.risks}</span>}
                      {memory.exitConditions && <span>Exit: {memory.exitConditions}</span>}
                      {memory.personalNotes && <span>Note: {memory.personalNotes}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="context-group watchlist-context-group">
              <span className="eyebrow">MY WATCHLIST</span>
              <div className="context-symbols">{marketData.stocks.map((stock) => <span key={stock.symbol}>{stock.symbol}</span>)}</div>
            </div>
          </div>
        )}
        <p className="personal-data-notice">{user ? "Personal context uses your signed-in Supabase data." : "Personal data is stored locally on this device."}{!user && !storageAvailable ? " Local storage is unavailable; changes last for this visit." : ""} When you send a message, its question and investment context are sent to the configured AI service through the Worker.</p>
      </section>

      <div className="quick-prompts">
        {quickQuestions.map((question, index) => (
          <button key={question} type="button" className={"prompt-chip prompt-chip-" + index} onClick={() => ask(question)} disabled={pending || !ready}>
            <span className={"prompt-chip-icon prompt-" + index}><Icon name={index === 0 ? "activity" : index === 1 ? "shield" : index === 2 ? "watchlist" : "overview"} size={15} /></span>
            {question}
          </button>
        ))}
      </div>

      <section className="card conversation-card" aria-label="AI conversation">
        <div className="conversation-header">
          <div className="conversation-agent-mark"><Icon name="sparkles" size={16} /></div>
          <div><strong>Investment assistant</strong><span>{assistantStatus.available ? "AI API · contextual research" : "Local fallback"}</span></div>
          <div className="conversation-model"><i />{pending ? retrying ? "正在重试…" : "THINKING…" : assistantStatus.available ? assistantStatus.model || "AI API" : assistantStatus.checked ? "API UNAVAILABLE · MOCK" + (assistantStatus.model ? " · " + assistantStatus.model : "") : "CHECKING API…"}</div>
        </div>
        <div className="conversation-messages" role="log" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={"message-row " + message.role}>
              {message.role === "assistant" && <div className="message-avatar"><Icon name="sparkles" size={15} /></div>}
              <div className="message-bubble">
                {message.role === "assistant" && <span className="message-label">{message.source === "mock" ? "LOCAL FALLBACK" : message.source === "ai" ? assistantStatus.model || "AI ASSISTANT" : "NORTHSTAR AI"}</span>}
                <p>{message.text}</p>
              </div>
              {message.role === "user" && <div className="message-user-avatar">You</div>}
            </div>
          ))}
          {pending && (
            <div className="message-row assistant">
              <div className="message-avatar"><Icon name="sparkles" size={15} /></div>
              <div className="message-bubble typing-bubble" aria-label="Thinking…"><span /><span /><span /><small>Thinking…</small></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); ask(draft); }}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask anything about your investments..." aria-label="Message the AI assistant" />
          <span className="composer-hint">{marketData.status === "live" || marketData.status === "partial" ? "FINNHUB QUOTES" : "QUOTES UNAVAILABLE"}</span>
          <button type="submit" aria-label="Send message" disabled={!draft.trim() || pending || !ready}><Icon name="send" size={17} /></button>
        </form>
        <p className="assistant-disclaimer">AI responses may be inaccurate and are for research only. Local fallback responses are simulated; no trades are placed.</p>
      </section>
    </div>
  );
}
