"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, X } from "lucide-react";
import type { CatalogFacetOption, CatalogFacetOptions } from "@/lib/sparkle-finder/catalog-service";
import type { LibraryFilters } from "@/app/(hub)/library/page";

type LibrarySearchProps = {
  facets: CatalogFacetOptions;
  filters: LibraryFilters;
};

type FilterField = "q" | "type" | "collection" | "material" | "stone" | "label" | "year";

type ActiveFilter = {
  field: FilterField;
  label: string;
  value: string;
};

const facetGroups: Array<{
  ariaLabel: string;
  field: FilterField;
  key: keyof CatalogFacetOptions;
  searchPlaceholder: string;
  title: string;
}> = [
  {
    ariaLabel: "Search collections",
    field: "collection",
    key: "collections",
    searchPlaceholder: "Search collections",
    title: "Collections",
  },
  {
    ariaLabel: "Search materials",
    field: "material",
    key: "materials",
    searchPlaceholder: "Search materials",
    title: "Materials",
  },
  {
    ariaLabel: "Search stones",
    field: "stone",
    key: "stones",
    searchPlaceholder: "Search stones",
    title: "Stone / gem",
  },
  {
    ariaLabel: "Search types",
    field: "type",
    key: "types",
    searchPlaceholder: "Search types",
    title: "Type",
  },
  {
    ariaLabel: "Search labels",
    field: "label",
    key: "labels",
    searchPlaceholder: "Search labels",
    title: "Label",
  },
  {
    ariaLabel: "Search years",
    field: "year",
    key: "years",
    searchPlaceholder: "Search years",
    title: "Year",
  },
];

export function LibrarySearch({ facets, filters }: LibrarySearchProps) {
  const activeFilterCount = getActiveFilters(filters).length;

  return (
    <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
      <form action="/library" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]" method="get">
        <div className="grid gap-2">
          <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Search the Jewelry Library
            <input
              className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-medium text-[var(--sparkle-plum-deep)]"
              defaultValue={filters.q}
              name="q"
              placeholder="Try a stone, collection, item number, or piece name"
              type="search"
            />
          </label>
          <p className="text-xs font-semibold text-[var(--sparkle-ink-muted)]">
            Not sure what it is called? Ask Nic-Nac from here.
          </p>
        </div>
        {hiddenFilterInputs(filters)}
        <div className="flex items-end">
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-rose)] px-4 text-sm font-bold text-white shadow-[var(--sparkle-shadow-sm)] lg:w-auto"
            type="submit"
          >
            <Search aria-hidden="true" className="size-4" strokeWidth={2} />
            Search
          </button>
        </div>
        <div className="flex items-end">
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-plum-deep)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum-deep)] lg:w-auto"
            href="/silver?nic-nac=library-hunt"
          >
            <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Ask Nic-Nac
          </Link>
        </div>
        <div className="flex items-end">
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-plum-deep)] lg:w-auto"
            href="/library"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={2} />
            Clear
          </Link>
        </div>
      </form>
      <SelectedFilters filters={filters} />
      <LibraryFacetPanel activeFilterCount={activeFilterCount} facets={facets} filters={filters} />
    </div>
  );
}

function LibraryFacetPanel({
  activeFilterCount,
  facets,
  filters,
}: Pick<LibrarySearchProps, "facets" | "filters"> & { activeFilterCount: number }) {
  return (
    <details className="mt-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-[var(--sparkle-plum-deep)]">
        <span>Filters</span>
        <span className="rounded-full bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs text-[var(--sparkle-ink-muted)]">
          {activeFilterCount > 0 ? `${activeFilterCount} active` : "Browse options"}
        </span>
      </summary>
      <div className="grid gap-5 border-t border-[var(--sparkle-border)] p-4 md:grid-cols-2 xl:grid-cols-3">
        {facetGroups.map((group) => (
          <FacetGroup
            activeValue={getFilterValue(filters, group.field)}
            ariaLabel={group.ariaLabel}
            field={group.field}
            filters={filters}
            key={group.key}
            options={facets[group.key]}
            searchPlaceholder={group.searchPlaceholder}
            title={group.title}
          />
        ))}
      </div>
    </details>
  );
}

function FacetGroup({
  activeValue,
  ariaLabel,
  field,
  filters,
  options,
  searchPlaceholder,
  title,
}: {
  activeValue: string;
  ariaLabel: string;
  field: FilterField;
  filters: LibraryFilters;
  options: CatalogFacetOption[];
  searchPlaceholder: string;
  title: string;
}) {
  const [facetSearch, setFacetSearch] = useState("");
  const visibleOptions = useMemo(() => {
    const normalized = facetSearch.trim().toLocaleLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.value.toLocaleLowerCase().includes(normalized));
  }, [facetSearch, options]);

  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-black text-[var(--sparkle-plum-deep)]">{title}</h3>
      <input
        aria-label={ariaLabel}
        className="min-h-10 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm text-[var(--sparkle-plum-deep)]"
        onChange={(event) => setFacetSearch(event.target.value)}
        placeholder={searchPlaceholder}
        type="search"
        value={facetSearch}
      />
      <div className="grid max-h-52 gap-2 overflow-auto pr-1">
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => {
            const isActive = activeValue === option.value;

            return (
              <Link
                aria-current={isActive ? "true" : undefined}
                className={[
                  "flex min-h-9 items-center justify-between gap-3 rounded-[var(--sparkle-radius-sm)] border px-3 py-2 text-sm font-bold",
                  isActive
                    ? "border-[var(--sparkle-rose)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum-deep)]"
                    : "border-[var(--sparkle-border)] bg-white text-[var(--sparkle-ink-muted)]",
                ].join(" ")}
                href={buildLibraryHref(filters, field, isActive ? "" : option.value)}
                key={`${field}:${option.value}`}
              >
                <span>{formatFacetValue(field, option.value)}</span>
                <span className="text-xs">{option.count}</span>
              </Link>
            );
          })
        ) : (
          <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
            No available options in this group.
          </p>
        )}
      </div>
    </section>
  );
}

function SelectedFilters({ filters }: { filters: LibraryFilters }) {
  const activeFilters = getActiveFilters(filters);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-2">
      <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--sparkle-ink-muted)]">
        Selected filters
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <Link
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-plum-deep)]"
            href={buildLibraryHref(filters, filter.field, "")}
            key={`${filter.field}:${filter.value}`}
          >
            {filter.label}: {filter.value}
            <X aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function hiddenFilterInputs(filters: LibraryFilters) {
  return getActiveFilters(filters)
    .filter((filter) => filter.field !== "q")
    .map((filter) => <input key={filter.field} name={filter.field} type="hidden" value={filter.value} />);
}

function getActiveFilters(filters: LibraryFilters): ActiveFilter[] {
  const values: ActiveFilter[] = [];
  const q = filters.q.trim();
  if (q) values.push({ field: "q", label: "Search", value: q });
  if (filters.type !== "all") values.push({ field: "type", label: "Type", value: filters.type });
  if (filters.collection) values.push({ field: "collection", label: "Collection", value: filters.collection });
  if (filters.material) values.push({ field: "material", label: "Material", value: filters.material });
  if (filters.stone) values.push({ field: "stone", label: "Stone", value: filters.stone });
  if (filters.label !== "all") values.push({ field: "label", label: "Label", value: filters.label });
  if (filters.year) values.push({ field: "year", label: "Year", value: filters.year });
  return values;
}

function buildLibraryHref(filters: LibraryFilters, field: FilterField, nextValue: string): string {
  const params = new URLSearchParams();
  const nextFilters: Record<FilterField, string> = {
    q: filters.q,
    type: filters.type === "all" ? "" : filters.type,
    collection: filters.collection ?? "",
    material: filters.material ?? "",
    stone: filters.stone ?? "",
    label: filters.label === "all" ? "" : filters.label,
    year: filters.year ?? "",
  };
  nextFilters[field] = nextValue;

  for (const [key, value] of Object.entries(nextFilters)) {
    if (value) params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `/library?${queryString}` : "/library";
}

function getFilterValue(filters: LibraryFilters, field: FilterField): string {
  if (field === "q") return filters.q;
  if (field === "type") return filters.type === "all" ? "" : filters.type;
  if (field === "label") return filters.label === "all" ? "" : filters.label;
  return filters[field] ?? "";
}

function formatFacetValue(field: FilterField, value: string): string {
  if (field === "type" || field === "label") {
    return value.replace(/^\w/, (letter) => letter.toUpperCase());
  }

  return value;
}
