"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { saveFavoriteRepNotesAction, type FavoriteRepActionState } from "@/app/(hub)/favorites/actions";

type FavoriteRepNotesFormProps = {
  repId: string;
  notes: string;
};

const initialState: FavoriteRepActionState = {
  status: "idle",
  message: "Rep notes ready.",
};

export function FavoriteRepNotesForm({ repId, notes }: FavoriteRepNotesFormProps) {
  const [actionState, formAction, isPending] = useActionState(saveFavoriteRepNotesAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="repId" type="hidden" value={repId} />
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Rep notes
        <textarea
          className="min-h-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-2 text-sm font-normal leading-6 text-[var(--sparkle-ink)]"
          defaultValue={notes}
          maxLength={500}
          name="notes"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          aria-busy={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
          Save notes
        </button>
        <p className="text-xs font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          {isPending ? "Saving notes..." : actionState.message}
        </p>
      </div>
    </form>
  );
}
