"use client";

import { useActionState, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import {
  favoriteRepAction,
  unfavoriteRepAction,
  type FavoriteRepActionState,
} from "@/app/(hub)/favorites/actions";

type FavoriteRepHeartButtonProps = {
  repId: string;
  repDisplayName: string;
  repSiteUrl?: string | null;
  repBoardUrl?: string | null;
  isFavorited?: boolean;
};

const initialState: FavoriteRepActionState = {
  status: "idle",
  message: "",
};

export function FavoriteRepHeartButton({
  repId,
  repDisplayName,
  repSiteUrl,
  repBoardUrl,
  isFavorited = false,
}: FavoriteRepHeartButtonProps) {
  const [actionState, favoriteAction, isFavoritePending] = useActionState(favoriteRepAction, initialState);
  const [isUnfavoritePending, setIsUnfavoritePending] = useState(false);
  const isPending = isFavoritePending || isUnfavoritePending;
  const label = isFavorited ? "Remove rep from favorites" : "Add rep to favorites";

  async function removeFavorite(formData: FormData) {
    setIsUnfavoritePending(true);

    try {
      await unfavoriteRepAction(formData);
    } finally {
      setIsUnfavoritePending(false);
    }
  }

  return (
    <form action={isFavorited ? removeFavorite : favoriteAction} className="inline-flex">
      <input name="repId" type="hidden" value={repId} />
      <input name="repDisplayName" type="hidden" value={repDisplayName} />
      <input name="repSiteUrl" type="hidden" value={repSiteUrl ?? ""} />
      <input name="repBoardUrl" type="hidden" value={repBoardUrl ?? ""} />
      <button
        aria-busy={isPending}
        aria-label={label}
        className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white text-[var(--sparkle-rose)] transition hover:border-[var(--sparkle-coral)] hover:text-[var(--sparkle-plum)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        title={label}
        type="submit"
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Heart aria-hidden="true" className={isFavorited ? "size-5 fill-current" : "size-5"} strokeWidth={1.8} />
        )}
      </button>
      {actionState.message ? <span className="sr-only">{actionState.message}</span> : null}
    </form>
  );
}
