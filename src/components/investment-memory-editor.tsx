"use client";

import { useEffect, useRef, useState } from "react";
import { usePersonalData } from "@/components/personal-data-provider";
import { emptyInvestmentMemory, type InvestmentMemory } from "@/data/personal-data";

export function InvestmentMemoryEditor({ symbol }: { symbol: string }) {
  const { data, ready, storageAvailable, saveInvestmentMemory } = usePersonalData();
  const [draft, setDraft] = useState<InvestmentMemory>(emptyInvestmentMemory);
  const [saved, setSaved] = useState(false);
  const appliedSymbol = useRef("");
  const appliedMemory = useRef<InvestmentMemory | null>(null);

  useEffect(() => {
    if (!ready) return;
    const storedMemory = data.investmentMemory[symbol] ?? emptyInvestmentMemory;
    if (appliedSymbol.current !== symbol || appliedMemory.current !== storedMemory) {
      setDraft(storedMemory);
      setSaved(false);
      appliedSymbol.current = symbol;
      appliedMemory.current = storedMemory;
    }
  }, [data.investmentMemory, ready, symbol]);

  function update(field: keyof InvestmentMemory, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasContent = Object.values(draft).some((value) => value.trim().length > 0);
    appliedSymbol.current = symbol;
    appliedMemory.current = hasContent ? draft : emptyInvestmentMemory;
    saveInvestmentMemory(symbol, draft);
    setSaved(true);
  }

  return (
    <section className="card investment-memory-card">
      <div className="panel-heading">
        <div><span className="eyebrow">YOUR RESEARCH</span><h2>My Investment Memory</h2></div>
        {saved && <span className="memory-saved-status">Saved</span>}
      </div>
      <p className="memory-intro">Keep your reasons, thesis, and review points for {symbol} in one place.</p>
      <form onSubmit={save}>
        <div className="memory-fields">
          <label className="personal-field"><span>Why I’m watching / holding</span>
            <textarea rows={3} value={draft.whyWatching} onChange={(event) => update("whyWatching", event.target.value)} placeholder="What makes this company worth following?" disabled={!ready} />
          </label>
          <label className="personal-field"><span>Buy thesis</span>
            <textarea rows={3} value={draft.buyThesis} onChange={(event) => update("buyThesis", event.target.value)} placeholder="What needs to happen for this investment to work?" disabled={!ready} />
          </label>
          <label className="personal-field"><span>Risks</span>
            <textarea rows={3} value={draft.risks} onChange={(event) => update("risks", event.target.value)} placeholder="Which assumptions or risks matter most to you?" disabled={!ready} />
          </label>
          <label className="personal-field"><span>Exit conditions</span>
            <textarea rows={3} value={draft.exitConditions} onChange={(event) => update("exitConditions", event.target.value)} placeholder="What would make you reconsider or exit?" disabled={!ready} />
          </label>
          <label className="personal-field memory-notes-field"><span>Personal notes</span>
            <textarea rows={3} value={draft.personalNotes} onChange={(event) => update("personalNotes", event.target.value)} placeholder="Any details you want to remember…" disabled={!ready} />
          </label>
        </div>
        <div className="memory-footer">
          <span className="personal-data-notice">Personal data is stored locally on this device.{!storageAvailable ? " Local storage is unavailable; changes last for this visit." : ""}</span>
          <button type="submit" className="primary-button" disabled={!ready}>Save memory</button>
        </div>
      </form>
    </section>
  );
}
