import { FavoriteRepsPanel } from "@/components/favorites/FavoriteRepsPanel";
import type { FavoriteRepCard } from "@/lib/sparkle-finder/social-types";

type FavoriteRepsDashboardProps = {
  cards: FavoriteRepCard[];
  isSilver: boolean;
};

export function FavoriteRepsDashboard({ cards, isSilver }: FavoriteRepsDashboardProps) {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Favorites
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Keep preferred rep show paths, board links, and Silver planning notes in one place.
        </p>
      </div>
      <FavoriteRepsPanel cards={cards} isSilver={isSilver} />
    </section>
  );
}
