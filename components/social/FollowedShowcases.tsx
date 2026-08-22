import Link from "next/link";
import { Gem, Sparkles, Star } from "lucide-react";
import type { FollowedShowcaseHighlight } from "@/lib/sparkle-finder/social-types";

export function FollowedShowcases({ highlights }: { highlights: FollowedShowcaseHighlight[] }) {
  return (
    <section className="grid gap-4" aria-labelledby="followed-showcases-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Fresh public highlights</p>
          <h2 id="followed-showcases-heading" className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Followed Showcases
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          A small, newest-first look at public pieces from collectors you follow.
        </p>
      </div>

      {highlights.length === 0 ? (
        <div className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">Your followed Showcase highlights will appear here.</p>
          <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Follow a public collector below. When they share a public piece, you can return to it from this compact view.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((highlight) => (
            <article
              className="group overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] shadow-[var(--sparkle-shadow-sm)]"
              key={highlight.collectionItemId}
            >
              <Link className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sparkle-plum)]" href={highlight.spotlightUrl}>
                <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--sparkle-blush-bg),white)] text-[var(--sparkle-plum)]">
                  {highlight.personalPhotoUrl ? (
                    <div
                      aria-label={`Public reveal shared by ${highlight.displayName}`}
                      className="size-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                      role="img"
                      style={{ backgroundImage: `url("${highlight.personalPhotoUrl}")` }}
                    />
                  ) : (
                    <Gem aria-hidden="true" className="size-12" strokeWidth={1.25} />
                  )}
                  {highlight.isRarestReveal ? (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--sparkle-plum-deep)] px-2.5 py-1 text-xs font-bold text-white">
                      <Star aria-hidden="true" className="size-3" fill="currentColor" /> Rarest Reveal
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 p-4">
                  <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
                    <Sparkles aria-hidden="true" className="size-3.5" /> @{highlight.handle}
                  </p>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum-deep)]">
                    {highlight.displayName}
                  </h3>
                  <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-[var(--sparkle-ink-muted)]">
                    {highlight.revealStory || "Shared a new public piece in their Sparkle Showcase."}
                  </p>
                  <span className="text-sm font-bold text-[var(--sparkle-plum)]">Open Reveal Spotlight</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
