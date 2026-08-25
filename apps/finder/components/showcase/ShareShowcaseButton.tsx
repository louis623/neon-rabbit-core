"use client";

import { useId, useState } from "react";
import { Check, Copy, Share2, TriangleAlert } from "lucide-react";
import { getCanonicalShowcaseUrl, sharePublicShowcaseLink } from "@/lib/sparkle-finder/showcase-sharing";

type ShareShowcaseButtonProps = {
  isPublic: boolean;
  label: string;
  pathname: string;
  shareText: string;
  shareTitle: string;
  tone?: "primary" | "secondary";
};

type ShareStatus = "idle" | "sharing" | "shared" | "copied" | "cancelled" | "private" | "error";

const statusCopy: Record<Exclude<ShareStatus, "idle">, string> = {
  cancelled: "Sharing canceled.",
  copied: "Public link copied.",
  error: "The public link could not be shared or copied. Please try again.",
  private: "Make this Showcase public before sharing.",
  sharing: "Opening share options…",
  shared: "Shared.",
};

export function ShareShowcaseButton({
  isPublic,
  label,
  pathname,
  shareText,
  shareTitle,
  tone = "primary",
}: ShareShowcaseButtonProps) {
  const statusId = useId();
  const [status, setStatus] = useState<ShareStatus>("idle");
  const isError = status === "error" || status === "private";
  const isSuccess = status === "copied" || status === "shared";

  async function handleShare() {
    if (!isPublic) {
      setStatus("private");
      return;
    }

    const canonicalUrl = getCanonicalShowcaseUrl(pathname);

    if (!canonicalUrl) {
      setStatus("error");
      return;
    }

    setStatus("sharing");
    const outcome = await sharePublicShowcaseLink({
      text: shareText,
      title: shareTitle,
      url: canonicalUrl,
    });
    setStatus(outcome.status);
  }

  return (
    <div className="grid w-fit gap-1">
      <button
        aria-describedby={status === "idle" ? undefined : statusId}
        className={buttonClassName(tone)}
        disabled={status === "sharing"}
        onClick={handleShare}
        type="button"
      >
        {isSuccess ? <Check aria-hidden="true" className="size-4" /> : <Share2 aria-hidden="true" className="size-4" />}
        {label}
      </button>
      <p
        aria-live={isError ? "assertive" : "polite"}
        className={`max-w-64 text-xs font-semibold ${isError ? "text-red-700" : "text-[var(--sparkle-ink-muted)]"}`}
        id={statusId}
        role={isError ? "alert" : "status"}
      >
        {status === "idle" ? null : (
          <span className="inline-flex items-start gap-1">
            {status === "copied" ? <Copy aria-hidden="true" className="mt-0.5 size-3 shrink-0" /> : null}
            {isError ? <TriangleAlert aria-hidden="true" className="mt-0.5 size-3 shrink-0" /> : null}
            {statusCopy[status]}
          </span>
        )}
      </p>
    </div>
  );
}

function buttonClassName(tone: "primary" | "secondary") {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sparkle-plum)] disabled:cursor-wait disabled:opacity-70";

  if (tone === "secondary") {
    return `${base} border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] text-[var(--sparkle-plum-deep)] hover:border-[var(--sparkle-rose)]`;
  }

  return `${base} bg-[var(--sparkle-plum)] text-white`;
}
