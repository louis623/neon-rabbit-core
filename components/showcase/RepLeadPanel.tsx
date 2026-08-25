import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { getLocalRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
import { getJewelryItemById, getRepById } from "@/lib/sparkle-finder/service";
import { getShowcasePieceRepLeads } from "@/lib/sparkle-finder/showcase-service";
import type { SparkleShowcasePiece } from "@/lib/sparkle-finder/showcase-types";

export function RepLeadPanel({ piece }: { piece: SparkleShowcasePiece }) {
  const seenListingIds = new Set<string>();
  const leads = getShowcasePieceRepLeads(piece).filter((lead) => {
    const listingId = lead.listingId.trim();
    if (!listingId || !lead.boardUrl.trim() || seenListingIds.has(listingId)) return false;
    seenListingIds.add(listingId);
    return true;
  });
  const wanted = piece.showcaseStatus === "iso" || piece.showcaseStatus === "wishlist";

  return (
    <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
          <Search aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            {wanted ? "Find dancer leads for this piece" : "Dancer leads"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Sparkle Finder checks the Dance Floor first so the hunt can lead back to active Sparkle Suite reps.
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] p-3"
        data-smoke="showcase-lead-summary"
        role="status"
      >
        <p className="text-sm font-black text-[var(--sparkle-plum-deep)]">
          {formatLeadCount(leads.length)} · {formatDancerCount(leads.length)}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
          Preview leads count as one dancer each. Open the exact piece for current Dance Floor quantities.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {leads.length > 0 ? (
          leads.map((lead) => {
            const rep = getRepById(lead.repId);
            const matchedItem = getJewelryItemById(lead.matchedJewelryItemId);

            return (
              <article
                className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3"
                data-design-id={lead.matchedJewelryItemId}
                data-listing-id={lead.listingId}
                data-smoke="dancer-lead-card"
                key={lead.listingId}
              >
                <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{rep?.businessName ?? "Sparkle Suite rep"}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
                  {lead.matchType === "exact_item" ? "Exact dancer lead" : "Similar dancer lead"}
                </p>
                <p className="mt-2 text-sm font-black text-[var(--sparkle-plum-deep)]">1 dancer available</p>
                <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
                  {lead.matchType === "exact_item" ? "Exact design" : "Similar design"}: {matchedItem?.name ?? "Catalog design"}
                  {matchedItem?.itemNumber ? ` · Item ${matchedItem.itemNumber}` : ""}
                </p>
                {matchedItem?.mainStone || matchedItem?.material ? (
                  <p className="text-xs leading-5 text-[var(--sparkle-ink-muted)]">
                    {[matchedItem.mainStone, matchedItem.material].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                <Link
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                  href={getLocalRepBoardHref(lead.boardUrl)}
                >
                  Open Dance Floor
                  <ExternalLink aria-hidden="true" className="size-4" />
                </Link>
              </article>
            );
          })
        ) : (
          <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">No dancer leads yet.</p>
        )}
      </div>

      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-center text-sm font-black text-[var(--sparkle-plum)] hover:bg-[var(--sparkle-paper-soft)]"
        href={`/library/${encodeURIComponent(piece.jewelryItemId)}`}
      >
        See all dancer leads
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

function formatLeadCount(count: number): string {
  return `${count} ${count === 1 ? "rep lead" : "rep leads"}`;
}

function formatDancerCount(count: number): string {
  return `${count} ${count === 1 ? "dancer available" : "dancers available"}`;
}
