"use client";

import { useActionState } from "react";
import { LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { makeHeroPiece, type HeroPieceActionState } from "@/app/actions/hero-piece";

type HeroPieceActionFormProps = {
  collectionItemId: string;
  compact?: boolean;
  isSelected?: boolean;
  pieceName: string;
};

const initialHeroPieceActionState: HeroPieceActionState = {
  status: "idle",
  message: "",
};

export function HeroPieceActionForm({
  collectionItemId,
  compact = false,
  isSelected = false,
  pieceName,
}: HeroPieceActionFormProps) {
  const [state, formAction, isPending] = useActionState(
    makeHeroPiece,
    initialHeroPieceActionState,
  );

  if (isSelected) {
    return (
      <p
        aria-live="polite"
        className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[var(--sparkle-ink-muted)]"
        role="status"
      >
        <ShieldCheck aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
        {state.status === "success" ? state.message : "This is your current Hero Piece."}
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-1.5">
      <input name="collectionItemId" type="hidden" value={collectionItemId} />
      <button
        aria-busy={isPending}
        aria-label={`Make ${pieceName} your Hero Piece`}
        className={`inline-flex items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "min-h-10 w-full px-3 text-xs" : "min-h-11 px-4 text-sm"
        }`}
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Sparkles aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
        )}
        {isPending
          ? "Saving Hero Piece…"
          : compact
            ? "Make Hero Piece"
            : "Make this my Hero Piece"}
      </button>
      {isPending || state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={`text-xs font-semibold ${
            state.status === "error" || state.status === "denied"
              ? "text-[var(--sparkle-rose)]"
              : "text-[var(--sparkle-ink-muted)]"
          }`}
          role="status"
        >
          {isPending ? "Saving your Hero Piece…" : state.message}
        </p>
      ) : null}
    </form>
  );
}
