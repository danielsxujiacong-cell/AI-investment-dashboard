"use client";

import { useEffect, useRef, useState } from "react";
import { getMockAiResponse } from "@/data/mockAi";
import { Icon } from "@/components/icons";

type Message = { id: number; role: "assistant" | "user"; text: string };

const quickQuestions = [
  "Analyze NVDA",
  "What are today's portfolio risks?",
  "Summarize my watchlist",
  "Explain today's market movement",
];

export function AssistantConversation({ initialPrompt = "" }: { initialPrompt?: string }) {
  const [draft, setDraft] = useState(initialPrompt);
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
      setMessages((current) => [...current, { id: assistantId, role: "assistant", text: getMockAiResponse(prompt) }]);
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
        <p className="assistant-disclaimer">AI responses are simulated and for demonstration only. They do not use live market data.</p>
      </section>
    </div>
  );
}
