import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";
import { getLocalRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
import type { JewelryItem, LiveShow, RepBoardListing, RepSummary } from "@/lib/sparkle-finder/types";

type RepBoardGridProps = {
  listings: RepBoardListing[];
  jewelryItems: JewelryItem[];
  reps: RepSummary[];
  liveShows: LiveShow[];
};

export function RepBoardGrid({ listings, jewelryItems, reps, liveShows }: RepBoardGridProps) {
  const itemById = new Map(jewelryItems.map((item) => [item.id, item]));
  const repById = new Map(reps.map((rep) => [rep.id, rep]));
  const showById = new Map(liveShows.map((show) => [show.id, show]));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => {
        const item = itemById.get(listing.jewelryItemId);
        const rep = repById.get(listing.repId);
        const show = rep ? showById.get(rep.nextLiveShowId) : undefined;

        if (!item || !rep) {
          return null;
        }

        return (
          <article
            className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]"
            key={listing.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
                  {rep.businessName}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">{item.collectionName}</p>
              </div>
              <span className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-bold capitalize text-[var(--sparkle-plum)]">
                {listing.status}
              </span>
            </div>
            {show ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--sparkle-ink-muted)]">
                <CalendarDays aria-hidden="true" className="size-4 text-[var(--sparkle-rose)]" />
                Next show: {show.title}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={`/library/${item.id}`}>
                View library record
              </Link>
              <a
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--sparkle-plum)] hover:underline"
                href={getLocalRepBoardHref(listing.boardUrl)}
              >
                Open rep board <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
