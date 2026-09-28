"use client";

import { useEffect, useRef, useState } from "react";
import { getMockAiResponse } from "@/data/mockAi";
import { usePersonalData } from "@/components/personal-data-provider";
import { stocks } from "@/data/stocks";
import { Icon } from "@/components/icons";

type Message = { id: number; role: "assistant" | "user"; text: string };

const quickQuestions = [
  "Analyze NVDA",
  "What are today's portfolio risks?",
  "Summarize my watchlist",
  "Explain today's market movement",
];

export function AssistantConversation() {
  const { data, ready, storageAvailable } = usePersonalData();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Good morning, Blake. I can help you explore your portfolio, watchlist, or today's market themes. What would you like to look into?",
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

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function ask(question: string) {
    const prompt = question.trim();
    if (!prompt || pending) return;

    const userId = nextId.current++;
    const assistantId = nextId.current++;
    setMessages((current) => [...current, { id: userId, role: "user", text: prompt }]);
    setDraft("");
    setPending(true);

    timer.current = setTimeout(() => {
      setMessages((current) => [...current, {
        id: assistantId,
        role: "assistant",
        text: getMockAiResponse(prompt, {
          portfolio: data.portfolio,
          investmentMemory: data.investmentMemory,
          watchlistSymbols: stocks.map((stock) => stock.symbol),
        }),
      }]);
      setPending(false);
    }, 720);
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
          <div><span className="eyebrow">AVAILABLE TO MOCK AI</span><h2>Personal Context</h2></div>
          <span className="mock-label"><i /> LOCAL ONLY</span>
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
              <div className="context-symbols">{stocks.map((stock) => <span key={stock.symbol}>{stock.symbol}</span>)}</div>
            </div>
          </div>
        )}
        <p className="personal-data-notice">Personal data is stored locally on this device.{!storageAvailable ? " Local storage is unavailable; changes last for this visit." : ""}</p>
      </section>

      <div className="quick-prompts">
        {quickQuestions.map((question, index) => (
          <button key={question} type="button" className={"prompt-chip prompt-chip-" + index} onClick={() => ask(question)} disabled={pending}>
            <span className={"prompt-chip-icon prompt-" + index}><Icon name={index === 0 ? "activity" : index === 1 ? "shield" : index === 2 ? "watchlist" : "overview"} size={15} /></span>
            {question}
          </button>
        ))}
      </div>

      <section className="card conversation-card" aria-label="AI conversation">
        <div className="conversation-header">
          <div className="conversation-agent-mark"><Icon name="sparkles" size={16} /></div>
          <div><strong>Investment assistant</strong><span>Mock research mode</span></div>
          <div className="conversation-model"><i /> MOCK AI</div>
        </div>
        <div className="conversation-messages" role="log" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={"message-row " + message.role}>
              {message.role === "assistant" && <div className="message-avatar"><Icon name="sparkles" size={15} /></div>}
              <div className="message-bubble">
                {message.role === "assistant" && <span className="message-label">NORTHSTAR AI</span>}
                <p>{message.text}</p>
              </div>
              {message.role === "user" && <div className="message-user-avatar">B</div>}
            </div>
          ))}
          {pending && (
            <div className="message-row assistant">
              <div className="message-avatar"><Icon name="sparkles" size={15} /></div>
              <div className="message-bubble typing-bubble" aria-label="Assistant is thinking"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); ask(draft); }}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask anything about your investments..." aria-label="Message the AI assistant" />
          <span className="composer-hint">MOCK DATA</span>
          <button type="submit" aria-label="Send message" disabled={!draft.trim() || pending}><Icon name="send" size={17} /></button>
        </form>
        <p className="assistant-disclaimer">Replies are simulated and may reference the personal context shown above. No external AI service is used.</p>
      </section>
    </div>
  );
}
