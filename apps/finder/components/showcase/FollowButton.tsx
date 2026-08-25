"use client";

import { useOptimistic, useTransition } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { getFollowButtonLabel } from "@/lib/sparkle-finder/showcase-actions";

type FollowButtonProps = {
  handle: string;
  isFollowing: boolean;
  isSelf: boolean;
  showcaseUserId: string;
  viewerUserId?: string | null;
  followAction?: (formData: FormData) => Promise<void>;
  unfollowAction?: (formData: FormData) => Promise<void>;
};

export function FollowButton({
  followAction,
  handle,
  isFollowing,
  isSelf,
  showcaseUserId,
  unfollowAction,
  viewerUserId,
}: FollowButtonProps) {
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(isFollowing);
  const [isPending, startTransition] = useTransition();
  const disabled = isSelf || !viewerUserId || isPending;
  const label = !viewerUserId ? "Sign in to follow" : isSelf ? "Your Showcase" : getFollowButtonLabel(optimisticFollowing);

  function submitFollow() {
    if (disabled) {
      return;
    }

    const formData = new FormData();
    formData.set("showcaseUserId", showcaseUserId);
    formData.set("handle", handle);

    startTransition(async () => {
      setOptimisticFollowing(!optimisticFollowing);

      if (optimisticFollowing) {
        await unfollowAction?.(formData);
      } else {
        await followAction?.(formData);
      }
    });
  }

  return (
    <button
      aria-busy={isPending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={submitFollow}
      type="button"
    >
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Heart aria-hidden="true" className="size-4" fill={optimisticFollowing ? "currentColor" : "none"} />
      )}
      {label}
    </button>
  );
}
