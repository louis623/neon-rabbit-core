import Link from "next/link";
import { CalendarDays, ExternalLink, Search } from "lucide-react";
import { FavoriteRepHeartButton } from "@/components/favorites/FavoriteRepHeartButton";
import { CustomerShowTime } from "@/components/live/CustomerShowTime";
import { FinderLink } from "@/components/navigation/FinderLink";
import { getLocalRepBoardHref, getLocalRepHref } from "@/lib/sparkle-finder/route-hrefs";
import type { RepDirectoryCard, RepDirectoryView } from "@/lib/sparkle-finder/rep-directory";
import type { FinderRepDirectoryStatus } from "@/lib/sparkle-finder/catalog-service";

type RepDirectoryProps = {
  cards: RepDirectoryCard[];
  favoriteCountsAvailable: boolean;
  query?: string;
  status: FinderRepDirectoryStatus;
  view: RepDirectoryView;
};

export function RepDirectory({ cards, favoriteCountsAvailable, query = "", status, view }: RepDirectoryProps) {

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
          <p className="mt-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            {favoriteCountsAvailable ? "Ranked by customer favorites." : "Live and upcoming reps appear first."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Rep directory filters">
        <StatusChip currentView={view} label="All reps" query={query} view="all" />
        <StatusChip currentView={view} label="Live now" query={query} view="live_now" />
        <StatusChip currentView={view} label="Live today" query={query} view="live_today" />
        <StatusChip currentView={view} label="Upcoming" query={query} view="upcoming" />
        <StatusChip
          currentView={view}
          label="Your favorites"
          query={query}
          view="favorites"
        />
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-3">
          {cards.map((card) => (
            <RepDirectoryListCard card={card} favoriteCountsAvailable={favoriteCountsAvailable} key={card.repId} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          {status === "unavailable" ? (
            <>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                The Rep Directory is temporarily unavailable.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Sparkle Finder could not reach the live Sparkle Suite rep list. Your account and saved favorites are safe.
              </p>
              <Link className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href="/reps">
                Try again
              </Link>
            </>
          ) : status === "empty" ? (
            <>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                No public rep profiles are available yet.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Eligible Sparkle Suite reps will appear here automatically, including reps who have not added a dancer to their Dance Floor or scheduled a show yet.
              </p>
            </>
          ) : query ? (
            <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]">No reps match that search.</p>
          ) : (
            <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]">{getFilteredEmptyMessage(view)}</p>
          )}
        </div>
      )}

      <form action="/reps" className="grid gap-2 border-t border-[var(--sparkle-border)] pt-4">
        {view !== "all" ? <input name="view" type="hidden" value={view} /> : null}
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

function StatusChip({
  currentView,
  label,
  query,
  view,
}: {
  currentView: RepDirectoryView;
  label: string;
  query: string;
  view: RepDirectoryView;
}) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (query) params.set("q", query);
  const href = params.size > 0 ? `/reps?${params.toString()}` : "/reps";

  return (
    <Link
      aria-current={currentView === view ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-extrabold ${
        currentView === view
          ? "border-[var(--sparkle-plum)] bg-[var(--sparkle-plum)] text-white"
          : "border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum-deep)]"
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function RepDirectoryListCard({
  card,
  favoriteCountsAvailable,
}: {
  card: RepDirectoryCard;
  favoriteCountsAvailable: boolean;
}) {
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
            {favoriteCountsAvailable ? (
              <span className="inline-flex min-h-7 items-center rounded-full border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] px-2 text-xs font-extrabold text-[var(--sparkle-plum-deep)]">
                {formatFavoriteCount(card.favoriteCount)}
              </span>
            ) : null}
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
              <FinderLink className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={repHref}>
                View Rep <ExternalLink aria-hidden="true" className="size-3.5" />
              </FinderLink>
            ) : null}
            {boardHref ? (
              <FinderLink className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--sparkle-plum)] hover:underline" href={boardHref}>
                Dance Floor <ExternalLink aria-hidden="true" className="size-3.5" />
              </FinderLink>
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

function getFilteredEmptyMessage(view: RepDirectoryView): string {
  switch (view) {
    case "favorites":
      return "You have not saved any favorite reps yet.";
    case "live_now":
      return "No reps are live right now.";
    case "live_today":
      return "No reps have a live show scheduled for today.";
    case "upcoming":
      return "No upcoming rep shows are listed right now.";
    case "all":
      return "No public rep profiles are available yet.";
  }
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
