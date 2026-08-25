import Link from "next/link";
import { CalendarDays, NotebookPen, Search, Sparkles, UsersRound } from "lucide-react";
import { FavoriteRepHeartButton } from "@/components/favorites/FavoriteRepHeartButton";
import { FavoriteRepNotesForm } from "@/components/favorites/FavoriteRepNotesForm";
import { getLocalRepBoardHref, getLocalRepHref } from "@/lib/sparkle-finder/route-hrefs";
import type { FavoriteRepCard } from "@/lib/sparkle-finder/social-types";

type FavoriteRepsPanelProps = {
  cards: FavoriteRepCard[];
  isSilver: boolean;
};

export function FavoriteRepsPanel({ cards, isSilver }: FavoriteRepsPanelProps) {
  return (
    <section className="grid gap-4" aria-labelledby="favorite-reps-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Favorites</p>
          <h2
            className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]"
            id="favorite-reps-heading"
          >
            Favorite Reps
          </h2>
        </div>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)] hover:border-[var(--sparkle-coral)]"
          href="/favorites"
        >
          <CalendarDays aria-hidden="true" className="size-4" />
          Favorite reps
        </Link>
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-4">
          {cards.map((card) => (
            <article
              className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
              key={card.id}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                        {card.repDisplayName}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">
                        Next show: {formatNextShow(card)}
                      </p>
                    </div>
                    <FavoriteRepHeartButton
                      isFavorited
                      repBoardUrl={card.repBoardUrl}
                      repDisplayName={card.repDisplayName}
                      repId={card.repId}
                      repSiteUrl={card.repSiteUrl}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {card.repSiteUrl ? (
                      <a className="text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={getLocalRepHref(card.repSiteUrl)}>
                        Visit Rep Site
                      </a>
                    ) : null}
                    {card.repBoardUrl ? (
                      <a className="text-sm font-bold text-[var(--sparkle-plum)] hover:underline" href={getLocalRepBoardHref(card.repBoardUrl)}>
                        Dance Floor
                      </a>
                    ) : (
                      <span className="text-sm font-bold text-[var(--sparkle-ink-muted)]">Dance Floor: watching</span>
                    )}
                    <span className="text-sm font-semibold text-[var(--sparkle-ink-muted)]">
                      {card.boardItemCount} {card.boardItemCount === 1 ? "dancer" : "dancers"}
                    </span>
                  </div>
                </div>
                {isSilver ? (
                  <div className="w-full min-w-0 lg:w-80">
                    <FavoriteRepNotesForm notes={card.notes} repId={card.repId} />
                  </div>
                ) : (
                  <div className="inline-flex max-w-sm items-start gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] p-3 text-sm font-semibold leading-6 text-[var(--sparkle-ink-muted)]">
                    <NotebookPen aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--sparkle-coral)]" />
                    Silver unlocks rep notes and next-show reminders.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">No favorite reps saved yet.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Use the heart on live shows or the Dance Floor to keep rep paths close. Next-show and Dance Floor details will appear here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-3 text-sm font-bold text-white"
              href="/live-shows"
            >
              <CalendarDays aria-hidden="true" className="size-4" />
              Live shows
            </Link>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)]"
              href="/rep-boards"
            >
              <UsersRound aria-hidden="true" className="size-4" />
              Dance Floor
            </Link>
          </div>
        </div>
      )}

      {isSilver ? (
        <Link
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
          href="/silver#showcase-studio"
        >
          <Search aria-hidden="true" className="size-4" />
          Ask Nic-Nac
        </Link>
      ) : (
        <div className="inline-flex w-fit items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-2 text-sm font-bold text-[var(--sparkle-ink-muted)]">
          <Sparkles aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
          Upgrade cue for notes/reminders
        </div>
      )}
    </section>
  );
}

function formatNextShow(card: FavoriteRepCard): string {
  if (!card.nextShowAt) {
    return "No upcoming show listed";
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(card.nextShowAt));

  return card.nextShowTitle ? `${card.nextShowTitle} - ${formatted}` : formatted;
}
