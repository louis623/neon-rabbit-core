import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { getLocalRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
import { getRepById } from "@/lib/sparkle-finder/service";
import { getShowcasePieceRepLeads } from "@/lib/sparkle-finder/showcase-service";
import type { SparkleShowcasePiece } from "@/lib/sparkle-finder/showcase-types";

export function RepLeadPanel({ piece }: { piece: SparkleShowcasePiece }) {
  const leads = getShowcasePieceRepLeads(piece);
  const wanted = piece.showcaseStatus === "iso" || piece.showcaseStatus === "wishlist";

  return (
    <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
          <Search aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            {wanted ? "Find reps with this piece" : "Rep leads"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Sparkle Finder checks the Dance Floor first so the hunt can lead back to active Sparkle Suite reps.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {leads.length > 0 ? (
          leads.map((lead) => {
            const rep = getRepById(lead.repId);

            return (
              <article className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3" key={lead.listingId}>
                <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{rep?.businessName ?? "Sparkle Suite rep"}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
                  {lead.matchType === "exact_item" ? "Exact item lead" : "Same Bomb Party Collection and type"}
                </p>
                <Link
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                  href={getLocalRepBoardHref(lead.boardUrl)}
                >
                  Open Dance Floor
                  <ExternalLink aria-hidden="true" className="size-4" />
                </Link>
              </article>
            );
          })
        ) : (
          <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">No rep leads yet.</p>
        )}
      </div>
    </section>
  );
}
