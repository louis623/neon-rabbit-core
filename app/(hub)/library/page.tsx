import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { getCatalogJewelryItems } from "@/lib/sparkle-finder/catalog-service";
import { getJewelryItems } from "@/lib/sparkle-finder/service";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

export default async function LibraryPage() {
  const items = await getCatalogJewelryItems();
  return renderLibraryPageContent(items);
}

export function renderLibraryPageContent(items: JewelryItem[] = getJewelryItems()) {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Master Jewelry Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Search the Jewelry Library by piece, collection, type, and Bomb Party label.
        </p>
      </div>
      <LibrarySearch />
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <JewelryCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          The shared Sparkle Suite jewelry catalog is not available in this environment yet.
        </p>
      )}
    </section>
  );
}
