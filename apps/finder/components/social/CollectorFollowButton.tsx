"use client";

import { useOptimistic, useTransition } from "react";
import { Heart, LoaderCircle } from "lucide-react";

type CollectorFollowButtonProps = {
  followAction?: (formData: FormData) => Promise<void>;
  handle: string;
  isFollowing: boolean;
  isSelf: boolean;
  targetUserId: string;
  unfollowAction?: (formData: FormData) => Promise<void>;
  viewerUserId?: string | null;
};

export function CollectorFollowButton({
  followAction,
  handle,
  isFollowing,
  isSelf,
  targetUserId,
  unfollowAction,
  viewerUserId,
}: CollectorFollowButtonProps) {
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(isFollowing);
  const [isPending, startTransition] = useTransition();
  const disabled = isSelf || !viewerUserId || isPending;
  const label = !viewerUserId ? "Sign in to follow" : isSelf ? "Your Showcase" : optimisticFollowing ? "Following" : "Follow";

  function submitFollow() {
    if (disabled) {
      return;
    }

    const formData = new FormData();
    formData.set("targetUserId", targetUserId);
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
      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={submitFollow}
      type="button"
    >
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Heart aria-hidden="true" className="size-4" fill={optimisticFollowing ? "currentColor" : "none"} />
      )}
      <span>{label}</span>
    </button>
  );
}
