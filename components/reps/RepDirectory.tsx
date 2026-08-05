import Link from "next/link";
import { CalendarDays, ExternalLink, Search } from "lucide-react";
import { FavoriteRepHeartButton } from "@/components/favorites/FavoriteRepHeartButton";
import { CustomerShowTime } from "@/components/live/CustomerShowTime";
import { getLocalRepBoardHref, getLocalRepHref } from "@/lib/sparkle-finder/route-hrefs";
import type { RepDirectoryCard } from "@/lib/sparkle-finder/rep-directory";

type RepDirectoryProps = {
  cards: RepDirectoryCard[];
  query?: string;
};

export function RepDirectory({ cards, query = "" }: RepDirectoryProps) {
  const favoriteCount = cards.filter((card) => card.isFavorited).length;

  return (
    <section className="grid gap-5" aria-labelledby="sparkle-suite-reps-heading">
      <div className="grid gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-rose)]">Reps</p>
        <div>
          <h1
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]"
            id="sparkle-suite-reps-heading"
          >
            Sparkle Suite Reps
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
            Browse reps, check show times, and save your favorites.
          </p>
          <p className="mt-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">Ranked by customer favorites.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Rep directory filters">
        <StatusChip label="Live now" />
        <StatusChip label="Live today" />
        <StatusChip label="Upcoming" />
        <StatusChip label={`Your favorites${favoriteCount > 0 ? ` (${favoriteCount})` : ""}`} />
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-3">
          {cards.map((card) => (
            <RepDirectoryListCard card={card} key={card.repId} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          {query ? (
            <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]">No reps match that search.</p>
          ) : (
            <>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                The Rep Directory is opening soon.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Sparkle Suite is welcoming its first reps this week. Their profiles and live show times will appear here as they are onboarded.
              </p>
            </>
          )}
        </div>
      )}

      <form action="/reps" className="grid gap-2 border-t border-[var(--sparkle-border)] pt-4">
        <label className="text-sm font-bold text-[var(--sparkle-plum-deep)]" htmlFor="rep-directory-search">
          Search reps
        </label>
        <div className="flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3">
          <Search aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-rose)]" />
          <input
            className="min-h-10 flex-1 bg-transparent text-base text-[var(--sparkle-ink)] outline-none placeholder:text-[var(--sparkle-ink-muted)]"
            defaultValue={query}
            id="rep-directory-search"
            name="q"
            placeholder="Search reps"
            type="search"
          />
          <button className="rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-3 py-2 text-sm font-bold text-white" type="submit">
            Search
          </button>
        </div>
      </form>
    </section>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] px-3 text-xs font-extrabold text-[var(--sparkle-plum-deep)]">
      {label}
    </span>
  );
}

function RepDirectoryListCard({ card }: { card: RepDirectoryCard }) {
  const repHref = card.customerSiteUrl ? getLocalRepHref(card.customerSiteUrl) : "";
  const boardHref = card.repBoardUrl ? getLocalRepBoardHref(card.repBoardUrl) : "";

  return (
    <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/88 p-4 shadow-[var(--sparkle-shadow-sm)]">
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
        <RepAvatar alt={`${card.displayName} profile`} name={card.displayName} src={card.avatarUrl} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              {card.displayName}
            </h2>
            <span className="inline-flex min-h-7 items-center rounded-full border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] px-2 text-xs font-extrabold text-[var(--sparkle-plum-deep)]">
              {formatFavoriteCount(card.favoriteCount)}
            </span>
            {card.state ? (
              <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-2 text-xs font-extrabold text-[var(--sparkle-ink-muted)]">
                {card.state}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--sparkle-ink-muted)]">{card.businessName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--sparkle-ink-muted)]">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.18)] bg-[var(--sparkle-blush-bg)] px-3 font-extrabold text-[var(--sparkle-plum-deep)]">
              <CalendarDays aria-hidden="true" className="size-4 text-[var(--sparkle-rose)]" />
              {card.statusLabel}
            </span>
            {card.nextShow ? (
              <span>
                {card.nextShow.title} · <CustomerShowTime value={card.nextShow.startsAt} />
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {repHref ? (
              <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={repHref}>
                View Rep <ExternalLink aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null}
            {boardHref ? (
              <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--sparkle-plum)] hover:underline" href={boardHref}>
                Board <ExternalLink aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
        <FavoriteRepHeartButton
          isFavorited={card.isFavorited}
          repBoardUrl={card.repBoardUrl}
          repDisplayName={card.displayName}
          repId={card.repId}
          repSiteUrl={card.customerSiteUrl}
        />
      </div>
    </article>
  );
}

function RepAvatar({ alt, name, src }: { alt: string; name: string; src: string | null }) {
  if (src) {
    return (
      <div
        aria-label={alt}
        className="size-12 rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url("${src}")` }}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className="grid size-12 place-items-center rounded-full border border-[rgba(238,44,155,0.2)] bg-[linear-gradient(135deg,var(--sparkle-blush-bg),rgba(142,69,184,0.24))] text-sm font-extrabold text-[var(--sparkle-plum-deep)]"
      role="img"
    >
      {getInitials(name)}
    </div>
  );
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");

  return initials || "SF";
}

function formatFavoriteCount(count: number): string {
  if (count === 1) {
    return "1 favorite";
  }

  return `${count} favorites`;
}
