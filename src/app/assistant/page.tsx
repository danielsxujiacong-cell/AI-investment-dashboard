import type { Metadata } from "next";
import { AssistantConversation } from "@/components/assistant-conversation";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { prompt = "" } = await searchParams;

  return (
    <div className="page-stack assistant-page page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NORTHSTAR INTELLIGENCE</span>
          <h1>AI Investment Assistant<span className="heading-period">.</span></h1>
          <p>A thoughtful research companion for your investing questions.</p>
        </div>
        <div className="assistant-mode"><span className="assistant-mode-dot" /> MOCK MODE</div>
      </div>
      <AssistantConversation initialPrompt={prompt} />
    </div>
  );
}
