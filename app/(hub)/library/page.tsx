import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { getCatalogJewelryItems } from "@/lib/sparkle-finder/catalog-service";
import { getJewelryItems } from "@/lib/sparkle-finder/service";
import type { BombPartyLabel, JewelryItem, JewelryType } from "@/lib/sparkle-finder/types";

export type LibraryPageSearchParams = {
  q?: string | string[];
  type?: string | string[];
  label?: string | string[];
};

export type LibraryFilters = {
  q: string;
  type: JewelryType | "all";
  label: BombPartyLabel | "all";
};

const jewelryTypes: Array<JewelryType | "all"> = ["all", "ring", "earrings", "necklace", "bracelet", "other"];
const labels: Array<BombPartyLabel | "all"> = ["all", "diamond", "unicorn", "standard"];
const emptyLibraryFilters: LibraryFilters = { q: "", type: "all", label: "all" };

type LibraryPageProps = {
  searchParams?: Promise<LibraryPageSearchParams>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps = {}) {
  const filters = normalizeLibraryFilters(await searchParams);
  const items = await getCatalogJewelryItems({ query: filters.q });

  return renderLibraryPageContent(items, filters);
}

export function renderLibraryPageContent(
  items: JewelryItem[] = getJewelryItems(),
  filters: LibraryFilters = emptyLibraryFilters,
) {
  const filteredItems = items.filter((item) => matchesLibraryFilters(item, filters));
  const hasActiveFilters = filters.q.trim().length > 0 || filters.type !== "all" || filters.label !== "all";

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
      <LibrarySearch filters={filters} />
      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <JewelryCard item={item} key={item.id} />
          ))}
        </div>
      ) : hasActiveFilters ? (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          No library records match those filters.
        </p>
      ) : (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          The shared Sparkle Suite jewelry catalog is not available in this environment yet.
        </p>
      )}
    </section>
  );
}

function normalizeLibraryFilters(searchParams: LibraryPageSearchParams = {}): LibraryFilters {
  const type = getFirstSearchParam(searchParams.type);
  const label = getFirstSearchParam(searchParams.label);

  return {
    q: getFirstSearchParam(searchParams.q)?.trim() ?? "",
    type: isJewelryTypeFilter(type) ? type : "all",
    label: isLabelFilter(label) ? label : "all",
  };
}

function getFirstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isJewelryTypeFilter(value: string | undefined): value is JewelryType | "all" {
  return jewelryTypes.includes(value as JewelryType | "all");
}

function isLabelFilter(value: string | undefined): value is BombPartyLabel | "all" {
  return labels.includes(value as BombPartyLabel | "all");
}

function matchesLibraryFilters(item: JewelryItem, filters: LibraryFilters): boolean {
  if (filters.type !== "all" && item.jewelryType !== filters.type) {
    return false;
  }

  if (filters.label !== "all" && item.bpLabel !== filters.label) {
    return false;
  }

  const query = filters.q.trim().toLocaleLowerCase();

  if (!query) {
    return true;
  }

  return [
    item.name,
    item.collectionName,
    item.itemNumber,
    item.jewelryType,
    item.bpLabel,
    item.collectionYear ? String(item.collectionYear) : "",
    ...(item.searchTags ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}
