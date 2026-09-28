"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { usePersonalData } from "@/components/personal-data-provider";
import { stocks } from "@/data/stocks";
import type { InvestmentNote } from "@/data/personal-data";

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function InvestmentNotes() {
  const { data, ready, saveInvestmentNotes } = usePersonalData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayLocal);
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const sortedNotes = useMemo(() => [...data.investmentNotes].sort((first, second) =>
    second.date.localeCompare(first.date) || second.updatedAt.localeCompare(first.updatedAt)), [data.investmentNotes]);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setDate(todayLocal());
    setSymbol("");
    setTitle("");
    setContent("");
  }

  function beginAdd() {
    resetForm();
    setFormOpen(true);
  }

  function beginEdit(note: InvestmentNote) {
    if (!ready) return;
    setEditingId(note.id);
    setDate(note.date);
    setSymbol(note.symbol);
    setTitle(note.title);
    setContent(note.content);
    setFormOpen(true);
  }

  function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    const now = new Date().toISOString();
    const existing = data.investmentNotes.find((note) => note.id === editingId);
    const nextNote: InvestmentNote = {
      id: existing?.id ?? createId(),
      date,
      symbol,
      title: title.trim(),
      content: content.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    saveInvestmentNotes(existing
      ? data.investmentNotes.map((note) => note.id === existing.id ? nextNote : note)
      : [...data.investmentNotes, nextNote]);
    resetForm();
  }

  function removeNote(id: string) {
    saveInvestmentNotes(data.investmentNotes.filter((note) => note.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <section className="card investment-notes-card">
      <div className="panel-heading">
        <div><span className="eyebrow">YOUR RESEARCH JOURNAL</span><h2>Investment Notes</h2></div>
        <button type="button" className="text-action" onClick={beginAdd} disabled={!ready}><Icon name="plus" size={14} /> Add note</button>
      </div>

      {formOpen && (
        <form className="personal-form note-form" onSubmit={submitNote}>
          <div className="personal-form-fields note-form-fields">
            <label className="personal-field"><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <label className="personal-field"><span>Symbol (optional)</span>
              <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
                <option value="">No symbol</option>
                {stocks.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>)}
              </select>
            </label>
            <label className="personal-field note-title-field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What did you review?" required /></label>
            <label className="personal-field note-content-field"><span>Content</span><textarea rows={3} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add a brief research note…" required /></label>
            <div className="personal-form-actions">
              <button type="button" className="text-action" onClick={resetForm}>Cancel</button>
              <button type="submit" className="primary-button">{editingId ? "Save note" : "Add note"}</button>
            </div>
          </div>
        </form>
      )}

      {!ready ? <div className="notes-empty">Loading your notes…</div> : sortedNotes.length === 0 ? (
        <div className="notes-empty">No notes yet. Add a short entry when you review an investment.</div>
      ) : (
        <div className="investment-note-list">
          {sortedNotes.map((note) => (
            <article className="investment-note" key={note.id}>
              <div className="investment-note-date">{note.date}</div>
              <div className="investment-note-main">
                <div className="investment-note-title"><h3>{note.title}</h3>{note.symbol && <span className="period-chip">{note.symbol}</span>}</div>
                <p>{note.content}</p>
              </div>
              <div className="investment-note-actions">
                <button type="button" className="text-action" onClick={() => beginEdit(note)}>Edit</button>
                <button type="button" className="text-action danger-action" onClick={() => removeNote(note.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
