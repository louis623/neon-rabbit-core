import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { CollectorSocialActionState } from "@/app/(hub)/collectors/actions";
import type { PublicCollectorProfile } from "@/lib/sparkle-finder/social-types";
import { CollectorFollowButton } from "./CollectorFollowButton";
import { SocialSafetyControls } from "./SocialSafetyControls";

type CollectorSocialPanelProps = {
  blockAction?: (previousState: CollectorSocialActionState, formData: FormData) => Promise<CollectorSocialActionState>;
  collectors: PublicCollectorProfile[];
  followAction?: (formData: FormData) => Promise<void>;
  query?: string;
  reportAction?: (previousState: CollectorSocialActionState, formData: FormData) => Promise<CollectorSocialActionState>;
  unfollowAction?: (formData: FormData) => Promise<void>;
  viewerUserId: string;
};

export function CollectorSocialPanel({
  blockAction,
  collectors,
  followAction,
  query = "",
  reportAction,
  unfollowAction,
  viewerUserId,
}: CollectorSocialPanelProps) {
  if (collectors.length === 0) {
    const hasSearchQuery = query.trim().length > 0;

    return (
      <section
        aria-label="Public Showcases"
        className="grid gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
      >
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
          {hasSearchQuery ? "No public Showcases match this search." : "Public Showcases will appear here."}
        </h2>
        <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          {hasSearchQuery
            ? "Try another collector name, handle, state, or TikTok handle."
            : "Check back as collectors begin sharing the jewelry they love."}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4" aria-label="Public Showcases">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Sparkle Showcase</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Public Showcases
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Follow collectors you love and come back easily to their newest public pieces and Showcase Collections.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collectors.map((collector) => {
          const isSelf = viewerUserId === collector.userId;

          return (
            <article
              className="grid min-w-0 gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
              data-smoke="collector-card"
              key={collector.userId}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
                  {collector.photoUrl ? (
                    <div
                      aria-label={collector.displayName}
                      className="size-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url("${collector.photoUrl}")` }}
                    />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-7" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                    {collector.displayName}
                  </h3>
                  <p className="truncate text-sm font-bold text-[var(--sparkle-rose)]">@{collector.handle}</p>
                </div>
              </div>

              <p className="min-h-12 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{collector.tagline}</p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Pieces" value={collector.publicPieceCount} />
                <Stat label="Followers" value={collector.followerCount} />
                <Stat label="Following" value={collector.followingCount} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
                  href={collector.showcaseUrl}
                >
                  View Showcase
                </Link>
                <CollectorFollowButton
                  followAction={followAction}
                  handle={collector.handle}
                  isFollowing={collector.isFollowedByViewer}
                  isSelf={isSelf}
                  targetUserId={collector.userId}
                  unfollowAction={unfollowAction}
                  viewerUserId={viewerUserId}
                />
              </div>

              <SocialSafetyControls
                blockAction={blockAction}
                handle={collector.handle}
                isSelf={isSelf}
                reportAction={reportAction}
                targetUserId={collector.userId}
                viewerUserId={viewerUserId}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-2">
      <span className="block text-base font-bold text-[var(--sparkle-plum-deep)]">{value}</span>
      <span className="block truncate text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[var(--sparkle-ink-muted)]">{label}</span>
    </span>
  );
}
