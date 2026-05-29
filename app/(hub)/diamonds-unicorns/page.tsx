import { JewelryCard } from "@/components/library/JewelryCard";
import { getDiamondAndUnicornItems } from "@/lib/sparkle-finder/service";

export default function DiamondsUnicornsPage() {
  const items = getDiamondAndUnicornItems();

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Diamonds & Unicorns Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          A focused view of library records carrying Bomb Party diamond or unicorn labels.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <JewelryCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
