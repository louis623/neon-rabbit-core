import { RepBoardGrid } from "@/components/boards/RepBoardGrid";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getJewelryItems, getLiveShows, getRepBoardListings, getReps } from "@/lib/sparkle-finder/service";

export default function RepBoardsPage() {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Dance Floor
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Browse dancers from Sparkle Suite reps, then follow the rep-owned Dance Floor path for details.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Preview dancers are shown here. Live dancer availability appears from the jewelry detail page when
          Sparkle Suite API matches exist.
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
      <RepBoardGrid
        jewelryItems={getJewelryItems()}
        listings={getRepBoardListings()}
        liveShows={getLiveShows()}
        reps={getReps()}
      />
    </section>
  );
}
