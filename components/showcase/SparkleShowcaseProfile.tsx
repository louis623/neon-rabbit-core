import Link from "next/link";
import { Share2, Sparkles } from "lucide-react";
import { blockCollectorAction, followCollectorAction, reportCollectorAction, unfollowCollectorAction } from "@/app/(hub)/collectors/actions";
import { createShowcaseCommentAction, deleteShowcaseCommentAction, editShowcaseCommentAction, reportShowcaseTargetAction } from "@/app/showcase/actions";
import { CollectorFollowButton } from "@/components/social/CollectorFollowButton";
import { SocialSafetyControls } from "@/components/social/SocialSafetyControls";
import { RarestReveals } from "./RarestReveals";
import { ShowcaseCollectionRail } from "./ShowcaseCollectionRail";
import { ShowcaseComments } from "./ShowcaseComments";
import { ShowcasePieceGrid } from "./ShowcasePieceGrid";
import type { SparkleShowcase } from "@/lib/sparkle-finder/showcase-types";

type SparkleShowcaseProfileProps = {
  showcase: SparkleShowcase;
  viewerUserId?: string | null;
};

export function SparkleShowcaseProfile({ showcase, viewerUserId }: SparkleShowcaseProfileProps) {
  const { profile } = showcase;
  const isSelf = viewerUserId === profile.customer.id;

  return (
    <section className="grid gap-8" data-smoke="sparkle-showcase">
      <header className="grid gap-6 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
            {profile.profile.photoUrl ? (
              <div
                aria-label={profile.customer.displayName}
                className="size-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${profile.profile.photoUrl}")` }}
              />
            ) : (
              <Sparkles aria-hidden="true" className="size-9" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Sparkle Showcase</p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              {profile.customer.displayName}&apos;s Sparkle Showcase
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">{profile.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Stat label="Public pieces" value={showcase.pieces.length} />
              <Stat label="Rare reveals" value={showcase.rarestReveals.length} />
              <Stat label="Followers" value={profile.followerCount} />
              <Stat label="Following" value={profile.followingCount} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <CollectorFollowButton
            followAction={followCollectorAction}
            handle={profile.handle}
            isFollowing={profile.isFollowedByViewer}
            isSelf={isSelf}
            targetUserId={profile.customer.id}
            unfollowAction={unfollowCollectorAction}
            viewerUserId={viewerUserId}
          />
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
            href={`/showcase/${profile.handle}`}
          >
            <Share2 aria-hidden="true" className="size-4" />
            Share Showcase
          </Link>
          <SocialSafetyControls
            blockAction={blockCollectorAction}
            handle={profile.handle}
            isSelf={isSelf}
            reportAction={reportCollectorAction}
            targetUserId={profile.customer.id}
            viewerUserId={viewerUserId}
          />
        </div>
      </header>

      <RarestReveals handle={profile.handle} pieces={showcase.rarestReveals} />
      <ShowcaseCollectionRail collections={showcase.showcaseCollections} handle={profile.handle} />
      <ShowcasePieceGrid handle={profile.handle} pieces={showcase.pieces} />
      <ShowcaseComments
        comments={showcase.comments}
        createAction={createShowcaseCommentAction}
        deleteAction={deleteShowcaseCommentAction}
        editAction={editShowcaseCommentAction}
        handle={profile.handle}
        reportAction={reportShowcaseTargetAction}
        showcaseUserId={profile.customer.id}
        targetId={profile.customer.id}
        targetType="showcase"
        viewerUserId={viewerUserId}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
      {value} {label}
    </span>
  );
}
