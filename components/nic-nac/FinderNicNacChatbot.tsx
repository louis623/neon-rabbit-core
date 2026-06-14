"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { NicNacMark } from "@/components/nic-nac/NicNacMark";

type ChatMessage = {
  role: "visitor" | "assistant";
  text: string;
};

export type FinderNicNacQuickBubble = {
  label: string;
  response: string;
};

export type FinderNicNacLead = {
  id: string;
  businessName: string;
  repName?: string;
  confidenceLabel: string;
  matchedItemName: string;
  collectionName: string;
  matchTypeLabel: string;
  nextShowLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

type FinderNicNacChatbotProps = {
  status: "ready" | "empty" | "upgrade";
  intro: string;
  quickBubbles: FinderNicNacQuickBubble[];
  leads?: FinderNicNacLead[];
  leadCountLabel?: string;
  emptyState?: string;
  compact?: boolean;
};

export function FinderNicNacChatbot({
  status,
  intro,
  quickBubbles,
  leads = [],
  leadCountLabel,
  emptyState,
  compact = false,
}: FinderNicNacChatbotProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: intro }]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function askNicNac(label: string, response: string) {
    setMessages([
      { role: "visitor", text: label },
      { role: "assistant", text: response },
    ]);
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setMessages([
      { role: "visitor", text: trimmedQuestion },
      { role: "assistant", text: buildTypedResponse(status, leads.length, emptyState) },
    ]);
    setQuestion("");
  }

  return (
    <article
      aria-label="Ask Nic-Nac"
      className={compact ? "finder-nic-nac-chatbot finder-nic-nac-chatbot--compact" : "finder-nic-nac-chatbot"}
    >
      <div className="finder-nic-nac-chatbot__head">
        <div className="finder-nic-nac-chatbot__brand">
          <NicNacMark size={28} />
          <div>
            <h2>Ask Nic-Nac</h2>
            <p>Same Nic-Nac from Sparkle Suite, focused on your Finder hunt.</p>
          </div>
        </div>
        {leadCountLabel ? <span className="finder-nic-nac-chatbot__count">{leadCountLabel}</span> : null}
      </div>

      <div className="finder-nic-nac-chatbot__starters" aria-label="Nic-Nac quick bubbles">
        {quickBubbles.map((bubble) => (
          <button
            key={bubble.label}
            onClick={() => askNicNac(bubble.label, bubble.response)}
            type="button"
          >
            {bubble.label}
          </button>
        ))}
      </div>

      <div className="finder-nic-nac-chatbot__thread" aria-live="polite">
        {messages.map((message, index) => (
          <div
            className={`finder-nic-nac-chatbot__message-row finder-nic-nac-chatbot__message-row--${message.role}`}
            key={`${message.role}-${index}-${message.text}`}
          >
            {message.role === "assistant" ? <NicNacMark size={22} /> : null}
            <p className={`finder-nic-nac-chatbot__message finder-nic-nac-chatbot__message--${message.role}`}>
              {message.text}
            </p>
          </div>
        ))}

        {status === "ready" && leads.length > 0 ? (
          <div className="finder-nic-nac-chatbot__lead-stack" aria-label="Nic-Nac matched leads">
            {leads.map((lead) => (
              <NicNacLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="finder-nic-nac-chatbot__action-bubbles" aria-label="Finder actions">
            <Link href="/library">Find a library piece</Link>
            <Link href="/silver#showcase-studio">Open Showcase Studio</Link>
          </div>
        ) : null}

        {status === "upgrade" ? (
          <div className="finder-nic-nac-chatbot__action-bubbles" aria-label="Silver actions">
            <Link href="/silver">Open Silver preview</Link>
          </div>
        ) : null}
      </div>

      <form className="finder-nic-nac-chatbot__form" onSubmit={handleSubmit}>
        <label htmlFor="sparkle-finder-nic-nac-question">Ask Nic-Nac</label>
        <div>
          <input
            id="sparkle-finder-nic-nac-question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this piece"
            ref={inputRef}
            type="text"
            value={question}
          />
          <button type="submit">Ask</button>
        </div>
      </form>
    </article>
  );
}

function NicNacLeadCard({ lead }: { lead: FinderNicNacLead }) {
  return (
    <section className="finder-nic-nac-chatbot__lead">
      <div>
        <p className="finder-nic-nac-chatbot__lead-title">{lead.businessName}</p>
        {lead.repName ? <p className="finder-nic-nac-chatbot__lead-meta">Rep: {lead.repName}</p> : null}
        <p className="finder-nic-nac-chatbot__lead-confidence">{lead.confidenceLabel}</p>
        <p className="finder-nic-nac-chatbot__lead-meta">
          {lead.matchedItemName} / {lead.collectionName}
        </p>
      </div>
      <span>{lead.matchTypeLabel}</span>
      <p className="finder-nic-nac-chatbot__show">
        <CalendarClock aria-hidden="true" />
        <strong>Next show:</strong> {lead.nextShowLabel}
      </p>
      <div className="finder-nic-nac-chatbot__lead-actions">
        <Link href={lead.primaryHref}>{lead.primaryLabel}</Link>
        {lead.secondaryHref && lead.secondaryLabel ? <Link href={lead.secondaryHref}>{lead.secondaryLabel}</Link> : null}
      </div>
    </section>
  );
}

function buildTypedResponse(status: FinderNicNacChatbotProps["status"], leadCount: number, emptyState?: string) {
  if (status === "upgrade") {
    return "I can help with Finder hunts once Silver is open for this account. Start with the Silver preview, then ask me for saved-piece and next-show leads.";
  }

  if (status === "empty") {
    return emptyState ?? "Add a piece to your collection or wishlist first, then I can check saved rep board paths and upcoming shows.";
  }

  return leadCount > 0
    ? `I found ${leadCount} bounded lead${leadCount === 1 ? "" : "s"} for this Finder piece. Start with exact matches, then check same collection and type.`
    : "I do not have a strong lead yet. Save the piece to your wishlist and I will keep the search scoped to known rep board paths.";
}
