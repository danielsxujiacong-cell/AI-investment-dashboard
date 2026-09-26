"use client";

import { useState } from "react";
import Link from "next/link";
import { marketBrief } from "@/data/marketBrief";
import { Icon } from "@/components/icons";

export function MarketBriefCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="card brief-card">
      <div className="brief-card-top">
        <div className="brief-icon"><Icon name="sparkles" size={19} /></div>
        <span className="brief-label">AI DAILY NOTE</span>
        <span className="brief-date">TODAY · 8:30 AM</span>
      </div>
      <div className="brief-title-row">
        <div>
          <span className="eyebrow">{marketBrief.label}</span>
          <h2>{marketBrief.title}</h2>
        </div>
        <span className="brief-quality"><i /> MOCK</span>
      </div>

      <div className="brief-overview">
        <span className="brief-overview-mark" />
        <p>{marketBrief.overview}</p>
      </div>

      <div className="brief-points">
        <div><span className="brief-point-dot opportunity" /><p><strong>Opportunity</strong>{marketBrief.opportunities}</p></div>
        <div><span className="brief-point-dot risk" /><p><strong>Risk to watch</strong>{marketBrief.risks}</p></div>
      </div>

      {expanded && (
        <div className="brief-expanded">
          {marketBrief.sections.map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.detail}</p>
            </article>
          ))}
          <div className="brief-disclaimer">Generated from simulated market data for product preview.</div>
        </div>
      )}

      <div className="brief-footer">
        <button type="button" className="text-action" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? "Show less" : "Read full brief"} <Icon name={expanded ? "arrow-left" : "arrow-right"} size={15} />
        </button>
        <Link href="/assistant?prompt=Explain%20today%27s%20market%20movement" className="brief-ask">Ask AI <Icon name="arrow-up-right" size={14} /></Link>
      </div>
    </section>
  );
}
