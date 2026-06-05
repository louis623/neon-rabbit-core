import { RepBoardGrid } from "@/components/boards/RepBoardGrid";
import { getJewelryItems, getLiveShows, getRepBoardListings, getReps } from "@/lib/sparkle-finder/service";

export default function RepBoardsPage() {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Rep Trade Boards / Dance Floors
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Browse rep-hosted board paths and dance floor context, then follow the rep-owned path for details.
        </p>
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
