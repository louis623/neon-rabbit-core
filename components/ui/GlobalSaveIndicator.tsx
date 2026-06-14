"use client";

import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

export type GlobalSaveIndicatorStatus = {
  message: string;
  tone: "idle" | "saving" | "saved" | "error";
};

type GlobalSaveIndicatorProps = {
  status: GlobalSaveIndicatorStatus;
};

export function GlobalSaveIndicator({ status }: GlobalSaveIndicatorProps) {
  const Icon =
    status.tone === "error"
      ? AlertCircle
      : status.tone === "saving"
        ? LoaderCircle
        : CheckCircle2;
  const toneClassName =
    status.tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : status.tone === "saved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status.tone === "saving"
          ? "border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] text-[var(--sparkle-plum)]"
          : "border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-ink-muted)]";

  return (
    <p
      className={`sparkle-global-save-indicator pointer-events-none fixed right-3 top-24 z-[80] inline-flex min-h-9 max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border px-3 text-sm font-bold shadow-[0_10px_26px_rgba(64,41,36,0.14)] sm:right-5 ${toneClassName}`}
      role="status"
    >
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${status.tone === "saving" ? "animate-spin" : ""}`} />
      <span className="truncate">{status.message}</span>
    </p>
  );
}
