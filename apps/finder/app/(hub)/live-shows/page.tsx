import Link from "next/link";
import { Heart, Radio } from "lucide-react";
import { FavoriteRepHeartButton } from "@/components/favorites/FavoriteRepHeartButton";
import { CustomerShowTime } from "@/components/live/CustomerShowTime";
import { FinderLink } from "@/components/navigation/FinderLink";
import {
  getFinderLiveShows,
  shouldUseCatalogFixtureFallback,
  type FinderLiveShow,
} from "@/lib/sparkle-finder/catalog-service";

export default async function LiveShowsPage() {
  const shows = await getFinderLiveShows({ useFixtureFallback: shouldUseCatalogFixtureFallback() });

  return renderLiveShowsPageContent(shows);
}

export function renderLiveShowsPageContent(shows: FinderLiveShow[] = []) {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Master Live Calendar
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          See eligible Sparkle Suite shows that are live now or scheduled ahead, then visit the rep site for the Dance
          Floor, calendar, and live details.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)] hover:border-[var(--sparkle-coral)]"
            href="/favorites"
          >
            <Heart aria-hidden="true" className="size-4" />
            Favorite reps
          </Link>
        </div>
      </div>
      {shows.length > 0 ? (
        <div className="grid gap-4">
          {shows.map((show) => (
            <article
              className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
              key={show.showId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--sparkle-coral)]">
                    <CustomerShowTime value={show.startsAt} />
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                    {show.showName}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">Rep: {show.repFirstName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <FavoriteRepHeartButton
                    repDisplayName={show.repFirstName}
                    repId={getLiveShowRepId(show)}
                    repSiteUrl={show.customerSiteUrl}
                  />
                  <span className="inline-flex min-h-8 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
                    <Radio aria-hidden="true" className="size-4 text-[var(--sparkle-rose)]" />
                    {show.status === "live" ? "Live now" : "Scheduled"}
                  </span>
                </div>
              </div>
              <FinderLink
                className="mt-4 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                href={show.customerSiteUrl}
              >
                Visit Rep Site
              </FinderLink>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          No live or upcoming shows are listed right now.
        </p>
      )}
    </section>
  );
}

function getLiveShowRepId(show: FinderLiveShow): string {
  const sitePath = new URL(show.customerSiteUrl, "https://www.yoursparklesuite.com").pathname;
  const repSlug = sitePath.split("/").filter(Boolean).at(-1);

  return repSlug ? `rep-${repSlug}` : `rep-${show.repFirstName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
