import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import {
  getCatalogFacetOptions,
  getCatalogJewelryItemsPageResult,
  shouldUseCatalogFixtureFallback,
  type CatalogFacetOptions,
  type CatalogPageReadResult,
} from "@/lib/sparkle-finder/catalog-service";
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
  cursor?: string | string[];
};

export type LibraryFilters = {
  q: string;
  type: JewelryType | "all";
  label: BombPartyLabel | "all";
  collection?: string;
  material?: string;
  stone?: string;
  year?: string;
  cursor?: string;
};

const jewelryTypes: Array<JewelryType | "all"> = ["all", "ring", "earrings", "necklace", "bracelet", "stack"];
const labels: Array<BombPartyLabel | "all"> = ["all", "diamond", "unicorn", "standard"];
const defaultLibraryLimit = 24;
const emptyLibraryFilters: LibraryFilters = {
  q: "",
  type: "all",
  label: "all",
  collection: "",
  material: "",
  stone: "",
  year: "",
  cursor: "",
};

type LibraryPageProps = {
  searchParams?: Promise<LibraryPageSearchParams>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps = {}) {
  const filters = normalizeLibraryFilters(await searchParams);
  const catalogFilters = {
    query: filters.q,
    type: filters.type,
    label: filters.label,
    collection: filters.collection ?? "",
    material: filters.material ?? "",
    mainStone: filters.stone ?? "",
    collectionYear: normalizeCollectionYearFilter(filters.year),
    useFixtureFallback: shouldUseCatalogFixtureFallback(),
  };
  const [pageResult, facets] = await Promise.all([
    getCatalogJewelryItemsPageResult({
      ...catalogFilters,
      cursor: filters.cursor,
      limit: defaultLibraryLimit,
    }),
    getCatalogFacetOptions(catalogFilters),
  ]);
  const items = pageResult.status === "success" ? pageResult.items : [];
  const facetsAvailable = items.length === 0 || hasCatalogFacetOptions(facets);

  return renderLibraryPageContent(
    items,
    filters,
    facets,
    pageResult,
    facetsAvailable,
  );
}

export function renderLibraryPageContent(
  items: JewelryItem[] = getJewelryItems(),
  filters: LibraryFilters = emptyLibraryFilters,
  facets: CatalogFacetOptions = deriveFallbackCatalogFacetOptions(items),
  pageResult?: CatalogPageReadResult,
  facetsAvailable = true,
) {
  const filteredItems = pageResult?.status === "success"
    ? items
    : items.filter((item) => matchesLibraryFilters(item, filters));
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
      <LibrarySearch facets={facets} facetsAvailable={facetsAvailable} filters={filters} />
      <LibraryResultSummary itemCount={filteredItems.length} pageResult={pageResult} />
      {filteredItems.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <JewelryCard item={item} key={item.id} />
            ))}
          </div>
          <LibraryContinuation filters={filters} pageResult={pageResult} />
        </>
      ) : pageResult?.status === "error" ? (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          The shared Sparkle Suite jewelry catalog could not be loaded right now. Try again in a moment.
        </p>
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
    cursor: getFirstSearchParam(searchParams.cursor)?.trim() ?? "",
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

function hasCatalogFacetOptions(facets: CatalogFacetOptions): boolean {
  return Object.values(facets).some((options) => options.length > 0);
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

function buildLibraryCursorHref(filters: LibraryFilters, cursor: string): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.label !== "all") params.set("label", filters.label);
  if (filters.year) params.set("year", filters.year);
  params.set("cursor", cursor);
  return `/library?${params.toString()}`;
}

function LibraryResultSummary({
  itemCount,
  pageResult,
}: {
  itemCount: number;
  pageResult?: CatalogPageReadResult;
}) {
  if (!pageResult) {
    return (
      <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" data-smoke="library-result-summary">
        {itemCount} {itemCount === 1 ? "piece" : "pieces"}
      </p>
    );
  }

  if (pageResult.status === "error") {
    return null;
  }

  if (pageResult.pagination === "unsupported") {
    return (
      <div
        className="rounded-[var(--sparkle-radius-sm)] border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        data-smoke="library-pagination-unsupported"
        role="status"
      >
        <p className="font-black">The Jewelry Library may have more pieces than this page can show.</p>
        <p>Catalog continuation is temporarily unavailable, so these results are partial.</p>
      </div>
    );
  }

  return (
    <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" data-smoke="library-result-summary">
      {itemCount} {itemCount === 1 ? "piece" : "pieces"} on this page · {pageResult.pageInfo.totalCount} total matching {pageResult.pageInfo.totalCount === 1 ? "piece" : "pieces"}
    </p>
  );
}

function LibraryContinuation({
  filters,
  pageResult,
}: {
  filters: LibraryFilters;
  pageResult?: CatalogPageReadResult;
}) {
  if (
    !pageResult ||
    pageResult.status === "error" ||
    pageResult.pagination === "unsupported" ||
    !pageResult.pageInfo.hasMore
  ) {
    return null;
  }

  if (!pageResult.pageInfo.nextCursor) {
    return (
      <p
        className="rounded-[var(--sparkle-radius-sm)] border border-amber-300 bg-amber-50 p-4 text-center text-sm font-bold text-amber-950"
        data-smoke="library-continuation-unavailable"
        role="status"
      >
        More matching pieces exist, but the next page is temporarily unavailable.
      </p>
    );
  }

  return (
    <div className="flex justify-center">
      <a
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum-deep)] shadow-[var(--sparkle-shadow-sm)]"
        data-smoke="library-next-page"
        href={buildLibraryCursorHref(filters, pageResult.pageInfo.nextCursor)}
      >
        Next page
      </a>
    </div>
  );
}
