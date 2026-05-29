import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { getJewelryItems } from "@/lib/sparkle-finder/service";

export default function LibraryPage() {
  const items = getJewelryItems();

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Master Jewelry Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Search the Jewelry Library by piece, collection, type, and Bomb Party label.
        </p>
      </div>
      <LibrarySearch />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <JewelryCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
