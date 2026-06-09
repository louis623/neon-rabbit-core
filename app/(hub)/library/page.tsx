import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { getCatalogFacetOptions, getCatalogJewelryItems, type CatalogFacetOptions } from "@/lib/sparkle-finder/catalog-service";
import { getJewelryItems } from "@/lib/sparkle-finder/service";
import type { BombPartyLabel, JewelryItem, JewelryType } from "@/lib/sparkle-finder/types";

export type LibraryPageSearchParams = {
  q?: string | string[];
  type?: string | string[];
  label?: string | string[];
  collection?: string | string[];
  material?: string | string[];
  stone?: string | string[];
  year?: string | string[];
  limit?: string | string[];
};

export type LibraryFilters = {
  q: string;
  type: JewelryType | "all";
  label: BombPartyLabel | "all";
  collection?: string;
  material?: string;
  stone?: string;
  year?: string;
  limit?: number;
};

const jewelryTypes: Array<JewelryType | "all"> = ["all", "ring", "earrings", "necklace", "bracelet", "stack", "other"];
const labels: Array<BombPartyLabel | "all"> = ["all", "diamond", "unicorn", "standard"];
const defaultLibraryLimit = 24;
const maxLibraryLimit = 50;
const emptyLibraryFilters: LibraryFilters = {
  q: "",
  type: "all",
  label: "all",
  collection: "",
  material: "",
  stone: "",
  year: "",
  limit: defaultLibraryLimit,
};

type LibraryPageProps = {
  searchParams?: Promise<LibraryPageSearchParams>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps = {}) {
  const filters = normalizeLibraryFilters(await searchParams);
  const catalogOptions = {
    query: filters.q,
    type: filters.type,
    label: filters.label,
    collection: filters.collection ?? "",
    material: filters.material ?? "",
    mainStone: filters.stone ?? "",
    collectionYear: normalizeCollectionYearFilter(filters.year),
    limit: filters.limit,
  };
  const [items, facets] = await Promise.all([
    getCatalogJewelryItems(catalogOptions),
    getCatalogFacetOptions(catalogOptions),
  ]);

  return renderLibraryPageContent(items, filters, mergeCatalogFacetOptions(facets, deriveFallbackCatalogFacetOptions(items)));
}

export function renderLibraryPageContent(
  items: JewelryItem[] = getJewelryItems(),
  filters: LibraryFilters = emptyLibraryFilters,
  facets: CatalogFacetOptions = deriveFallbackCatalogFacetOptions(items),
) {
  const filteredItems = items.filter((item) => matchesLibraryFilters(item, filters));
  const effectiveLimit = filters.limit ?? defaultLibraryLimit;
  const hasActiveFilters =
    filters.q.trim().length > 0 ||
    filters.type !== "all" ||
    filters.label !== "all" ||
    Boolean(filters.collection?.trim()) ||
    Boolean(filters.material?.trim()) ||
    Boolean(filters.stone?.trim()) ||
    Boolean(filters.year?.trim());

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Master Jewelry Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Search the Jewelry Library by piece, collection, type, material, stone, and Bomb Party label.
        </p>
      </div>
      <LibrarySearch filters={filters} facets={facets} />
      {filteredItems.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <JewelryCard item={item} key={item.id} />
            ))}
          </div>
          {filteredItems.length >= effectiveLimit && effectiveLimit < maxLibraryLimit ? (
            <div className="flex justify-center">
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum-deep)] shadow-[var(--sparkle-shadow-sm)]"
                href={buildLibraryLimitHref(filters, Math.min(effectiveLimit + defaultLibraryLimit, maxLibraryLimit))}
              >
                Load more pieces
              </a>
            </div>
          ) : null}
        </>
      ) : hasActiveFilters ? (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          <p>No library records match those filters.</p>
          <p className="mt-2">Not sure what it is called? Ask Nic-Nac to help broaden the search.</p>
        </div>
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
    collection: getFirstSearchParam(searchParams.collection)?.trim() ?? "",
    material: getFirstSearchParam(searchParams.material)?.trim() ?? "",
    stone: getFirstSearchParam(searchParams.stone)?.trim() ?? "",
    year: getFirstSearchParam(searchParams.year)?.trim() ?? "",
    limit: normalizeLibraryLimit(getFirstSearchParam(searchParams.limit)),
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

  if (filters.collection && item.collectionName !== filters.collection) {
    return false;
  }

  if (filters.material && item.material !== filters.material) {
    return false;
  }

  if (filters.stone && item.mainStone !== filters.stone) {
    return false;
  }

  if (filters.year && String(item.collectionYear ?? "") !== filters.year) {
    return false;
  }

  const query = filters.q.trim().toLocaleLowerCase();

  if (!query) {
    return true;
  }

  return [
    item.name,
    item.collectionName,
    item.material ?? "",
    item.mainStone ?? "",
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

function deriveFallbackCatalogFacetOptions(items: JewelryItem[]): CatalogFacetOptions {
  return {
    collections: countFacetValues(items.map((item) => item.collectionName)),
    materials: countFacetValues(items.map((item) => item.material ?? "")),
    stones: countFacetValues(items.map((item) => item.mainStone ?? "")),
    types: countFacetValues(items.map((item) => item.jewelryType)),
    labels: countFacetValues(items.map((item) => item.bpLabel)),
    years: countFacetValues(items.map((item) => (item.collectionYear ? String(item.collectionYear) : ""))),
  };
}

function mergeCatalogFacetOptions(primary: CatalogFacetOptions, fallback: CatalogFacetOptions): CatalogFacetOptions {
  return {
    collections: primary.collections.length > 0 ? primary.collections : fallback.collections,
    materials: primary.materials.length > 0 ? primary.materials : fallback.materials,
    stones: primary.stones.length > 0 ? primary.stones : fallback.stones,
    types: primary.types.length > 0 ? primary.types : fallback.types,
    labels: primary.labels.length > 0 ? primary.labels : fallback.labels,
    years: primary.years.length > 0 ? primary.years : fallback.years,
  };
}

function countFacetValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

function normalizeCollectionYearFilter(year: string | undefined): number | undefined {
  if (!year || !/^\d{4}$/.test(year)) return undefined;
  const parsed = Number.parseInt(year, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function normalizeLibraryLimit(limit: string | undefined): number {
  if (!limit || !/^\d+$/.test(limit)) return defaultLibraryLimit;
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return defaultLibraryLimit;
  return Math.min(parsed, maxLibraryLimit);
}

function buildLibraryLimitHref(filters: LibraryFilters, limit: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.label !== "all") params.set("label", filters.label);
  if (filters.year) params.set("year", filters.year);
  params.set("limit", String(limit));
  return `/library?${params.toString()}`;
}
