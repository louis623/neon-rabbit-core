# Sparkle Finder Customer-Facing API Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sparkle Finder's customer-facing library, availability, Nic-Nac, dashboard, and preview pages clearly consume the Sparkle Suite public Finder API where it exists, and clearly label fixture-only areas where the API does not yet provide list endpoints.

**Architecture:** Keep Sparkle Finder's current routes and visual structure. Add small adapter/helper functions around the existing catalog service and route href code, wire current search/filter controls into the catalog page, surface availability metadata already returned by the API, and prevent customer confusion by removing fixture wording from API-backed flows while labeling fixture-only board/calendar pages as preview data.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Vitest, Playwright smoke tests, Sparkle Suite public Finder API.

---

## Boundaries

- Do not rebuild Sparkle Finder.
- Do not redesign UI.
- Do not restructure routes.
- Do not add open-ended Nic-Nac chat.
- Do not touch the Sparkle Suite repo.
- Do not create new Sparkle Suite API endpoints in this plan.
- Do not read raw `jewelry_designs` or `trade_listings` directly from Sparkle Finder.
- Use `C:\Users\louis\sparkle-finder-repo` for implementation, tests, commits, and push.
- Keep this plan file in the binder: `C:\Users\louis\sparkle-finder\docs\superpowers\plans\2026-06-06-sparkle-finder-customer-facing-api-gaps.md`.

## File Structure

Modify these files in `C:\Users\louis\sparkle-finder-repo`:

- `lib/sparkle-finder/catalog-service.ts`
  - Add a small exported API base URL helper for customer-facing links.
  - Keep existing catalog/detail/availability API reads.
  - Keep fixture fallback available for local preview, but make later tests explicit about fallback behavior.

- `lib/sparkle-finder/route-hrefs.ts`
  - Add Sparkle Suite path-to-URL helpers for API-returned `customerSitePath` and `tradeBoardPath`.
  - Preserve local fixture URL mapping for `sparklesuite.example`.

- `lib/sparkle-finder/search.ts`
  - Include `searchTags` and `collectionYear` in local text search.
  - Keep existing collection/type/label helpers.

- `app/(hub)/library/page.tsx`
  - Read `searchParams`.
  - Pass `q` to `getCatalogJewelryItems({ query })`.
  - Apply `type` and `label` filters to returned records.
  - Pass current filters into `LibrarySearch`.

- `components/library/LibrarySearch.tsx`
  - Render selected/default values from props.
  - Add an actual submit button and a clear link.
  - Keep same route and form pattern.

- `components/library/JewelryCard.tsx`
  - Show availability count and optional collection year/search tags without making cards visually noisy.

- `app/(hub)/library/[itemId]/page.tsx`
  - Use customer-safe Sparkle Suite links for API availability rows.
  - Keep local fixture mapping for fixture rows.

- `lib/sparkle-finder/nic-nac.ts`
  - Return a data source marker, such as `"api"` or `"fixture"`, with successful Nic-Nac results.

- `components/nic-nac/FindThisForMe.tsx`
  - Use the data source marker to avoid saying "fixture" for API-backed leads.
  - Use the new Sparkle Suite href helper for API-backed board/profile links.

- `app/(hub)/dashboard/page.tsx`
  - Stop presenting live catalog counts and fixture board/show counts as one unified live system.
  - Label board/show counts as preview if they still come from fixtures.

- `app/(hub)/rep-boards/page.tsx`
  - Label this page as preview-backed until a board-list API endpoint exists.

- `app/(hub)/live-shows/page.tsx`
  - Label this page as preview-backed until a live-show-list API endpoint exists.

Modify these tests:

- `tests/sparkle-finder/catalog-service.test.ts`
- `tests/sparkle-finder/search.test.ts`
- `tests/sparkle-finder/routes.test.ts`
- `tests/sparkle-finder/nic-nac-find.test.ts`
- `tests/smoke/sparkle-finder-home.spec.ts`

No new app route files are needed.

---

## Task 1: Add Customer-Safe Sparkle Suite Link Helpers

**Files:**

- Modify: `lib/sparkle-finder/catalog-service.ts`
- Modify: `lib/sparkle-finder/route-hrefs.ts`
- Test: `tests/sparkle-finder/catalog-service.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing tests for Sparkle Suite base URL and API path conversion**

Add this test to `tests/sparkle-finder/catalog-service.test.ts` inside the existing `describe("Sparkle Finder public API catalog service", ...)` block:

```ts
it("normalizes the Sparkle Suite Finder API base URL for customer-facing links", () => {
  expect(getSparkleSuiteFinderPublicBaseUrl({ apiBaseUrl: "https://suite.example/" })).toBe("https://suite.example");
  expect(getSparkleSuiteFinderPublicBaseUrl({ apiBaseUrl: "https://suite.example///" })).toBe("https://suite.example");
});
```

Update the import in that test file:

```ts
import {
  getCatalogJewelryItemById,
  getCatalogJewelryItems,
  getFinderAvailabilityForJewelryItem,
  getSparkleSuiteFinderPublicBaseUrl,
  mapSparkleSuiteFinderCatalogItem,
  mapSparkleSuiteFinderJewelryType,
  type SparkleSuiteFinderCatalogItem,
} from "../../lib/sparkle-finder/catalog-service";
```

Add this test to `tests/sparkle-finder/routes.test.ts` inside the existing `describe("Sparkle Finder hub routes", ...)` block:

```ts
it("converts Sparkle Suite API rep paths into customer-safe external hrefs", () => {
  expect(getSparkleSuiteRepBoardHref("/amethyst/trade?c=rep-demo", "https://suite.example")).toBe(
    "https://suite.example/amethyst/trade?c=rep-demo",
  );
  expect(getSparkleSuiteRepHref("/amethyst?c=rep-demo", "https://suite.example/")).toBe(
    "https://suite.example/amethyst?c=rep-demo",
  );
  expect(getSparkleSuiteRepBoardHref("https://suite.example/amethyst/trade?c=rep-demo", "https://ignored.example")).toBe(
    "https://suite.example/amethyst/trade?c=rep-demo",
  );
});
```

Update the route helper import in `tests/sparkle-finder/routes.test.ts`:

```ts
import {
  getLocalRepBoardHref,
  getLocalRepHref,
  getSparkleSuiteRepBoardHref,
  getSparkleSuiteRepHref,
} from "../../lib/sparkle-finder/route-hrefs";
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `C:\Users\louis\sparkle-finder-repo`:

```powershell
npm run test -- tests/sparkle-finder/catalog-service.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: fail because `getSparkleSuiteFinderPublicBaseUrl`, `getSparkleSuiteRepBoardHref`, and `getSparkleSuiteRepHref` are not exported yet.

- [ ] **Step 3: Export the public base URL helper**

In `lib/sparkle-finder/catalog-service.ts`, rename the internal helper to take a `Pick` type and export a wrapper.

Add this near the other exported functions:

```ts
export function getSparkleSuiteFinderPublicBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl"> = {}): string {
  return getSparkleSuiteFinderApiBaseUrl(options);
}
```

Change the private helper signature near the bottom from:

```ts
function getSparkleSuiteFinderApiBaseUrl(options: CatalogReadOptions): string {
```

to:

```ts
function getSparkleSuiteFinderApiBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl">): string {
```

- [ ] **Step 4: Add customer-safe Sparkle Suite href helpers**

In `lib/sparkle-finder/route-hrefs.ts`, replace the file with this focused helper set:

```ts
export function getLocalRepBoardHref(boardUrl: string): string {
  if (isSparkleSuiteExampleUrl(boardUrl)) {
    const listingSlug = getLastUrlSegment(boardUrl);

    return listingSlug ? `/rep-boards?listing=${encodeURIComponent(listingSlug)}` : "/rep-boards";
  }

  return boardUrl.startsWith("/") ? boardUrl : "/rep-boards";
}

export function getLocalRepHref(siteUrl: string): string {
  if (isSparkleSuiteExampleUrl(siteUrl)) {
    const repSlug = getLastUrlSegment(siteUrl);

    return repSlug ? `/rep-boards?rep=${encodeURIComponent(repSlug)}` : "/rep-boards";
  }

  return siteUrl.startsWith("/") ? siteUrl : "/rep-boards";
}

export function getSparkleSuiteRepBoardHref(boardPath: string, sparkleSuiteBaseUrl: string): string {
  return toSparkleSuiteHref(boardPath, sparkleSuiteBaseUrl);
}

export function getSparkleSuiteRepHref(sitePath: string, sparkleSuiteBaseUrl: string): string {
  return toSparkleSuiteHref(sitePath, sparkleSuiteBaseUrl);
}

function toSparkleSuiteHref(pathOrUrl: string, sparkleSuiteBaseUrl: string): string {
  const value = pathOrUrl.trim();

  if (!value) {
    return sparkleSuiteBaseUrl.trim().replace(/\/+$/, "");
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const baseUrl = sparkleSuiteBaseUrl.trim().replace(/\/+$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;

  return `${baseUrl}${path}`;
}

function isSparkleSuiteExampleUrl(value: string): boolean {
  return value.includes("sparklesuite.example");
}

function getLastUrlSegment(value: string): string | undefined {
  return value.split("?")[0]?.split("/").filter(Boolean).at(-1);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```powershell
npm run test -- tests/sparkle-finder/catalog-service.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 1**

Run:

```powershell
git add lib/sparkle-finder/catalog-service.ts lib/sparkle-finder/route-hrefs.ts tests/sparkle-finder/catalog-service.test.ts tests/sparkle-finder/routes.test.ts
git commit -m "fix: normalize Sparkle Suite finder links"
```

---

## Task 2: Wire Library Search and Filters

**Files:**

- Modify: `app/(hub)/library/page.tsx`
- Modify: `components/library/LibrarySearch.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing route tests for library filtering**

Add this import to `tests/sparkle-finder/routes.test.ts`:

```ts
import type { JewelryItem } from "../../lib/sparkle-finder/types";
```

Add these tests inside the existing route describe block:

```ts
it("renders selected library search filters and only matching items", () => {
  const items: JewelryItem[] = [
    {
      id: "design-ring",
      name: "Rose Diamond Ring",
      collectionName: "Garden Gala",
      collectionYear: 2026,
      jewelryType: "ring",
      imageUrl: "",
      bpLabel: "diamond",
      itemNumber: "RG1001",
      knownRepListingIds: [],
      searchTags: ["rose"],
      availableListingCount: 1,
    },
    {
      id: "design-necklace",
      name: "Ocean Standard Necklace",
      collectionName: "Ocean Glow",
      collectionYear: null,
      jewelryType: "necklace",
      imageUrl: "",
      bpLabel: "standard",
      itemNumber: "NC2001",
      knownRepListingIds: [],
      searchTags: [],
      availableListingCount: 0,
    },
  ];

  const markup = renderToStaticMarkup(
    renderLibraryPageContent(items, {
      q: "rose",
      type: "ring",
      label: "diamond",
    }),
  );

  expect(markup).toContain('value="rose"');
  expect(markup).toContain("Rose Diamond Ring");
  expect(markup).not.toContain("Ocean Standard Necklace");
});

it("renders a clear empty state when library filters have no matches", () => {
  const items: JewelryItem[] = [
    {
      id: "design-ring",
      name: "Rose Diamond Ring",
      collectionName: "Garden Gala",
      collectionYear: 2026,
      jewelryType: "ring",
      imageUrl: "",
      bpLabel: "diamond",
      itemNumber: "RG1001",
      knownRepListingIds: [],
      searchTags: ["rose"],
      availableListingCount: 1,
    },
  ];

  const markup = renderToStaticMarkup(
    renderLibraryPageContent(items, {
      q: "ocean",
      type: "necklace",
      label: "standard",
    }),
  );

  expect(markup).toContain("No library records match those filters.");
  expect(markup).not.toContain("Rose Diamond Ring");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: fail because `renderLibraryPageContent` does not accept filter state and `LibrarySearch` does not preserve selected values.

- [ ] **Step 3: Update the library page to read query params**

Replace `app/(hub)/library/page.tsx` with:

```tsx
import { JewelryCard } from "@/components/library/JewelryCard";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { getCatalogJewelryItems } from "@/lib/sparkle-finder/catalog-service";
import { getJewelryItems } from "@/lib/sparkle-finder/service";
import type { BombPartyLabel, JewelryItem, JewelryType } from "@/lib/sparkle-finder/types";

type LibraryPageSearchParams = {
  q?: string | string[];
  type?: string | string[];
  label?: string | string[];
};

export type LibraryFilters = {
  q: string;
  type: JewelryType | "all";
  label: BombPartyLabel | "all";
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<LibraryPageSearchParams>;
}) {
  const filters = normalizeLibraryFilters(await searchParams);
  const items = await getCatalogJewelryItems({ query: filters.q });

  return renderLibraryPageContent(items, filters);
}

export function renderLibraryPageContent(
  items: JewelryItem[] = getJewelryItems(),
  filters: LibraryFilters = emptyLibraryFilters,
) {
  const filteredItems = filterLibraryItems(items, filters);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Master Library</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Search the Jewelry Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Browse cataloged jewelry records, filter by type, and open a focused record to see known rep availability.
        </p>
      </div>
      <LibrarySearch filters={filters} />
      {filteredItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <JewelryCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          No library records match those filters.
        </p>
      )}
    </section>
  );
}

const emptyLibraryFilters: LibraryFilters = {
  q: "",
  type: "all",
  label: "all",
};

function normalizeLibraryFilters(searchParams: LibraryPageSearchParams | undefined): LibraryFilters {
  return {
    q: readFirstParam(searchParams?.q).trim(),
    type: readJewelryType(readFirstParam(searchParams?.type)),
    label: readBombPartyLabel(readFirstParam(searchParams?.label)),
  };
}

function filterLibraryItems(items: JewelryItem[], filters: LibraryFilters): JewelryItem[] {
  return items.filter((item) => {
    const matchesType = filters.type === "all" || item.jewelryType === filters.type;
    const matchesLabel = filters.label === "all" || item.bpLabel === filters.label;

    return matchesType && matchesLabel;
  });
}

function readFirstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readJewelryType(value: string): JewelryType | "all" {
  if (value === "ring" || value === "necklace" || value === "earrings" || value === "bracelet" || value === "other") {
    return value;
  }

  return "all";
}

function readBombPartyLabel(value: string): BombPartyLabel | "all" {
  if (value === "diamond" || value === "unicorn" || value === "standard") {
    return value;
  }

  return "all";
}
```

- [ ] **Step 4: Update the search form to preserve values and submit**

Replace `components/library/LibrarySearch.tsx` with:

```tsx
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { LibraryFilters } from "@/app/(hub)/library/page";

type LibrarySearchProps = {
  filters: LibraryFilters;
};

export function LibrarySearch({ filters }: LibrarySearchProps) {
  return (
    <form
      action="/library"
      className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)] md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto_auto]"
      method="get"
    >
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Search
        <input
          className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-3 text-sm font-medium text-[var(--sparkle-ink)] outline-none transition focus:border-[var(--sparkle-rose)] focus:ring-2 focus:ring-[rgba(232,137,157,0.18)]"
          name="q"
          placeholder="Collection, item, tag, or number"
          type="search"
          value={filters.q}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Type
        <select className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-3 text-sm" name="type" value={filters.type}>
          <option value="all">All types</option>
          <option value="ring">Rings</option>
          <option value="necklace">Necklaces</option>
          <option value="earrings">Earrings</option>
          <option value="bracelet">Bracelets</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Label
        <select className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-3 text-sm" name="label" value={filters.label}>
          <option value="all">All labels</option>
          <option value="diamond">Diamond</option>
          <option value="unicorn">Unicorn</option>
          <option value="standard">Standard</option>
        </select>
      </label>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
        type="submit"
      >
        <Search aria-hidden="true" className="size-4" />
        Search
      </button>
      <Link
        className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] px-4 text-sm font-bold text-[var(--sparkle-plum)]"
        href="/library"
      >
        <X aria-hidden="true" className="size-4" />
        Clear
      </Link>
    </form>
  );
}
```

- [ ] **Step 5: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 2**

Run:

```powershell
git add 'app/(hub)/library/page.tsx' components/library/LibrarySearch.tsx tests/sparkle-finder/routes.test.ts
git commit -m "feat: wire library search filters"
```

---

## Task 3: Surface Availability, Year, and Tags on Library Cards

**Files:**

- Modify: `components/library/JewelryCard.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing test for card metadata**

Add this test inside the route describe block:

```ts
it("shows availability and optional catalog metadata on library cards", () => {
  const items: JewelryItem[] = [
    {
      id: "design-available",
      name: "Garden Gala Bracelet",
      collectionName: "Garden Gala",
      collectionYear: 2026,
      jewelryType: "bracelet",
      imageUrl: "",
      bpLabel: "standard",
      itemNumber: "BR1001",
      knownRepListingIds: [],
      searchTags: ["rose gold", "garden"],
      availableListingCount: 2,
    },
  ];

  const markup = renderToStaticMarkup(renderLibraryPageContent(items));

  expect(markup).toContain("2 available");
  expect(markup).toContain("2026");
  expect(markup).toContain("rose gold");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: fail because card metadata is not rendered yet.

- [ ] **Step 3: Update JewelryCard metadata**

In `components/library/JewelryCard.tsx`, add a compact metadata area below the existing collection/name text. Keep existing visuals intact.

Add this helper near the bottom of the file:

```tsx
function formatAvailabilityCount(count: number | undefined): string {
  if (!count || count < 1) {
    return "No current listings";
  }

  return count === 1 ? "1 available" : `${count} available`;
}
```

Inside the card body, after the collection paragraph and before the final link/action area, add:

```tsx
<div className="mt-3 flex flex-wrap gap-2">
  <span className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
    {formatAvailabilityCount(item.availableListingCount)}
  </span>
  {item.collectionYear ? (
    <span className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
      {item.collectionYear}
    </span>
  ) : null}
  {(item.searchTags ?? []).slice(0, 2).map((tag) => (
    <span
      className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]"
      key={tag}
    >
      {tag}
    </span>
  ))}
</div>
```

- [ ] **Step 4: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 3**

Run:

```powershell
git add components/library/JewelryCard.tsx tests/sparkle-finder/routes.test.ts
git commit -m "feat: show library availability metadata"
```

---

## Task 4: Fix API Availability Links on Item Detail

**Files:**

- Modify: `app/(hub)/library/[itemId]/page.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing test for API availability external links**

Add this test to `tests/sparkle-finder/routes.test.ts`:

```ts
it("renders API-backed item detail leads with Sparkle Suite rep board links", () => {
  const apiItem: JewelryItem = {
    id: "design-api",
    name: "Garden Gala Bracelet",
    collectionName: "Garden Gala",
    collectionYear: null,
    jewelryType: "bracelet",
    imageUrl: "",
    bpLabel: "standard",
    itemNumber: "BR1001",
    knownRepListingIds: [],
    searchTags: [],
    availableListingCount: 1,
  };

  const markup = renderToStaticMarkup(
    renderItemDetailPageContent(
      { itemId: "design-api" },
      getLocalDevAuthState("silver"),
      apiItem,
      {
        requestedItem: apiItem,
        exactMatches: [
          {
            listingId: "listing-api",
            listedAt: "2026-06-06T12:00:00.000Z",
            photoUrl: "",
            item: apiItem,
            rep: {
              repId: "rep-demo",
              displayName: "Demo Rep",
              businessName: "Sparkle Suite Demo Boutique",
              profilePhotoUrl: "",
              customerSitePath: "/amethyst?c=rep-demo",
              tradeBoardPath: "/amethyst/trade?c=rep-demo",
            },
            nextShow: null,
          },
        ],
        similarMatches: [],
      },
    ),
  );

  expect(markup).toContain("https://www.yoursparklesuite.com/amethyst/trade?c=rep-demo");
  expect(markup).toContain("Sparkle Suite Demo Boutique");
});
```

Update the function signature import types if needed:

```ts
import type { FinderAvailabilityResult } from "../../lib/sparkle-finder/catalog-service";
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: fail because API rows currently use relative `tradeBoardPath` directly and the render helper does not accept injected API item/availability yet.

- [ ] **Step 3: Make item detail render helper injectable for tests and use safe hrefs**

In `app/(hub)/library/[itemId]/page.tsx`, update imports:

```tsx
import {
  getCatalogJewelryItemById,
  getFinderAvailabilityForJewelryItem,
  getSparkleSuiteFinderPublicBaseUrl,
  type FinderAvailabilityResult,
} from "@/lib/sparkle-finder/catalog-service";
import { getLocalRepBoardHref, getSparkleSuiteRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
```

Change the exported render helper signature to:

```tsx
export function renderItemDetailPageContent(
  params: ItemDetailParams,
  accountState: SparkleFinderAccountState = getLocalDevAuthState("silver"),
  injectedItem?: JewelryItem,
  availability?: FinderAvailabilityResult,
) {
  const item = injectedItem ?? getJewelryItemById(params.itemId);
```

Change API availability row mapping to:

```tsx
const sparkleSuiteBaseUrl = getSparkleSuiteFinderPublicBaseUrl();
const apiAvailabilityRows = availability
  ? [
      ...availability.exactMatches.map((match) => ({
        id: match.listingId,
        repName: match.rep.businessName,
        matchLabel: "Exact item",
        showTitle: match.nextShow?.title ?? "No upcoming show listed",
        href: getSparkleSuiteRepBoardHref(match.rep.tradeBoardPath, sparkleSuiteBaseUrl),
      })),
      ...availability.similarMatches.map((match) => ({
        id: match.listingId,
        repName: match.rep.businessName,
        matchLabel: "Same collection and type",
        showTitle: match.nextShow?.title ?? "No upcoming show listed",
        href: getSparkleSuiteRepBoardHref(match.rep.tradeBoardPath, sparkleSuiteBaseUrl),
      })),
    ]
  : [];
```

Keep fixture rows using `getLocalRepBoardHref(match.boardUrl)`.

- [ ] **Step 4: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 4**

Run:

```powershell
git add 'app/(hub)/library/[itemId]/page.tsx' tests/sparkle-finder/routes.test.ts
git commit -m "fix: link API availability to Sparkle Suite"
```

---

## Task 5: Make Nic-Nac Copy and Links Data-Source Aware

**Files:**

- Modify: `lib/sparkle-finder/nic-nac.ts`
- Modify: `components/nic-nac/FindThisForMe.tsx`
- Test: `tests/sparkle-finder/nic-nac-find.test.ts`

- [ ] **Step 1: Write failing tests for API-backed Nic-Nac wording and links**

Add this test to `tests/sparkle-finder/nic-nac-find.test.ts`:

```ts
it("renders API-backed Nic-Nac leads without fixture wording", () => {
  const markup = renderToStaticMarkup(
    createElement(FindThisForMe, {
      accountState: getLocalDevAuthState("silver"),
      jewelryItemId: "design-api",
      availability: apiAvailability(),
    }),
  );

  expect(markup).toContain("1 Sparkle Suite lead");
  expect(markup).toContain("https://www.yoursparklesuite.com/amethyst/trade?c=rep-demo");
  expect(markup).not.toContain("fixture lead");
  expect(markup).not.toContain("fixture-backed");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test -- tests/sparkle-finder/nic-nac-find.test.ts
```

Expected: fail because Nic-Nac still renders fixture wording and maps API paths through local fixture href helpers.

- [ ] **Step 3: Add data source to Nic-Nac result type**

In `lib/sparkle-finder/nic-nac.ts`, add this type:

```ts
export type NicNacDataSource = "api" | "fixture";
```

Add `dataSource: NicNacDataSource;` to the successful result type.

When availability is passed, return:

```ts
dataSource: "api",
```

When using fixture matches, return:

```ts
dataSource: "fixture",
```

- [ ] **Step 4: Update FindThisForMe wording and hrefs**

In `components/nic-nac/FindThisForMe.tsx`, update imports:

```tsx
import { getSparkleSuiteFinderPublicBaseUrl } from "@/lib/sparkle-finder/catalog-service";
import {
  getLocalRepBoardHref,
  getLocalRepHref,
  getSparkleSuiteRepBoardHref,
  getSparkleSuiteRepHref,
} from "@/lib/sparkle-finder/route-hrefs";
```

Replace the lead count span text with:

```tsx
{formatLeadCount(result.results.length, result.dataSource)}
```

Add helper:

```tsx
function formatLeadCount(count: number, dataSource: "api" | "fixture"): string {
  const noun = count === 1 ? "lead" : "leads";

  return dataSource === "api" ? `${count} Sparkle Suite ${noun}` : `${count} preview ${noun}`;
}
```

Change `NicNacMatchCard` props:

```tsx
function NicNacMatchCard({ dataSource, match }: { dataSource: "api" | "fixture"; match: NicNacFindMatch }) {
```

Change the map call:

```tsx
result.results.map((match) => <NicNacMatchCard dataSource={result.dataSource} key={match.listing.id} match={match} />)
```

Inside `NicNacMatchCard`, compute hrefs:

```tsx
const sparkleSuiteBaseUrl = getSparkleSuiteFinderPublicBaseUrl();
const boardHref =
  dataSource === "api"
    ? getSparkleSuiteRepBoardHref(match.listing.boardUrl, sparkleSuiteBaseUrl)
    : getLocalRepBoardHref(match.listing.boardUrl);
const repHref =
  dataSource === "api"
    ? getSparkleSuiteRepHref(match.rep.siteUrl, sparkleSuiteBaseUrl)
    : getLocalRepHref(match.rep.siteUrl);
```

Use `boardHref` and `repHref` in the two links.

Change the Silver upgrade copy from:

```tsx
Silver opens focused matching across fixture-backed rep boards and next-show context.
```

to:

```tsx
Silver opens focused matching across known rep board paths and next-show context.
```

- [ ] **Step 5: Run Nic-Nac tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/nic-nac-find.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 5**

Run:

```powershell
git add lib/sparkle-finder/nic-nac.ts components/nic-nac/FindThisForMe.tsx tests/sparkle-finder/nic-nac-find.test.ts
git commit -m "fix: clarify Nic-Nac API leads"
```

---

## Task 6: Search Helper Includes Tags and Collection Year

**Files:**

- Modify: `lib/sparkle-finder/search.ts`
- Test: `tests/sparkle-finder/search.test.ts`

- [ ] **Step 1: Write failing tests for tag/year search**

Add this test to `tests/sparkle-finder/search.test.ts`:

```ts
it("searches API-shaped jewelry records by tags and collection year", () => {
  const items = [
    {
      id: "design-api",
      name: "Garden Gala Bracelet",
      collectionName: "Garden Gala",
      collectionYear: 2026,
      jewelryType: "bracelet",
      imageUrl: "",
      bpLabel: "standard",
      itemNumber: "BR1001",
      knownRepListingIds: [],
      searchTags: ["rose gold", "garden"],
      availableListingCount: 1,
    },
  ] as const;

  expect(searchJewelryItemsByText(items, "rose gold")).toHaveLength(1);
  expect(searchJewelryItemsByText(items, "2026")).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test -- tests/sparkle-finder/search.test.ts
```

Expected: fail because `searchTags` and `collectionYear` are not searched.

- [ ] **Step 3: Update local text search**

In `lib/sparkle-finder/search.ts`, replace the searchable haystack construction inside `searchJewelryItemsByText` with:

```ts
const searchableText = [
  item.name,
  item.collectionName,
  item.jewelryType,
  item.bpLabel,
  item.itemNumber,
  item.collectionYear ? String(item.collectionYear) : "",
  ...(item.searchTags ?? []),
]
  .join(" ")
  .toLowerCase();
```

- [ ] **Step 4: Run search tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/search.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 6**

Run:

```powershell
git add lib/sparkle-finder/search.ts tests/sparkle-finder/search.test.ts
git commit -m "feat: search catalog tags and years"
```

---

## Task 7: Label Fixture-Only Dashboard, Rep Boards, and Live Shows as Preview Data

**Files:**

- Modify: `app/(hub)/dashboard/page.tsx`
- Modify: `app/(hub)/rep-boards/page.tsx`
- Modify: `app/(hub)/live-shows/page.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing tests for preview labels**

Add these route tests:

```ts
it("labels fixture-backed dashboard board and show stats as preview data", () => {
  const markup = renderToStaticMarkup(renderDashboardPageContent());

  expect(markup).toContain("Preview live shows");
  expect(markup).toContain("Preview board listings");
});

it("labels rep boards and live shows as preview-backed pages", () => {
  const repBoardsMarkup = renderToStaticMarkup(createElement(RepBoardsPage));
  const liveShowsMarkup = renderToStaticMarkup(createElement(LiveShowsPage));

  expect(repBoardsMarkup).toContain("Preview board data");
  expect(liveShowsMarkup).toContain("Preview calendar data");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: fail because those labels do not exist yet.

- [ ] **Step 3: Update dashboard stat labels**

In `app/(hub)/dashboard/page.tsx`, change:

```tsx
<Stat label="Live shows" value={getLiveShows().length} />
<Stat label="Board listings" value={getRepBoardListings().length} />
```

to:

```tsx
<Stat label="Preview live shows" value={getLiveShows().length} />
<Stat label="Preview board listings" value={getRepBoardListings().length} />
```

Add a small note under the stats grid:

```tsx
<p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
  Library counts use the Sparkle Suite Finder API. Board and calendar counts remain preview data until Sparkle Suite exposes list endpoints for those views.
</p>
```

- [ ] **Step 4: Update Rep Boards page copy**

In `app/(hub)/rep-boards/page.tsx`, add this paragraph under the existing heading copy:

```tsx
<p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--sparkle-ink-muted)]">
  Preview board data. Live item-level availability is shown from the jewelry detail page when Sparkle Suite API matches exist.
</p>
```

- [ ] **Step 5: Update Live Shows page copy**

In `app/(hub)/live-shows/page.tsx`, add this paragraph under the existing heading copy:

```tsx
<p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--sparkle-ink-muted)]">
  Preview calendar data. Live next-show context appears on item availability leads when Sparkle Suite API matches include it.
</p>
```

- [ ] **Step 6: Run route tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit Task 7**

Run:

```powershell
git add 'app/(hub)/dashboard/page.tsx' 'app/(hub)/rep-boards/page.tsx' 'app/(hub)/live-shows/page.tsx' tests/sparkle-finder/routes.test.ts
git commit -m "fix: label preview board and show data"
```

---

## Task 8: Add Production-Safe Fixture Fallback Coverage

**Files:**

- Modify: `lib/sparkle-finder/catalog-service.ts`
- Test: `tests/sparkle-finder/catalog-service.test.ts`

- [ ] **Step 1: Write failing test for disabled fallback**

Add this test:

```ts
it("can disable fixture fallback when a live API read fails", async () => {
  const fetchCatalog = vi.fn(async () => new Response("not found", { status: 404 }));

  const items = await getCatalogJewelryItems({
    apiBaseUrl: "https://suite.example",
    fetcher: fetchCatalog,
    useFixtureFallback: false,
  });

  expect(items).toEqual([]);
});
```

Add this test for detail fallback behavior:

```ts
it("can disable fixture fallback for missing detail records", async () => {
  const fetchDetail = vi.fn(async () => new Response("not found", { status: 404 }));

  const item = await getCatalogJewelryItemById("missing-design", {
    apiBaseUrl: "https://suite.example",
    fetcher: fetchDetail,
    useFixtureFallback: false,
  });

  expect(item).toBeUndefined();
});
```

- [ ] **Step 2: Run tests**

Run:

```powershell
npm run test -- tests/sparkle-finder/catalog-service.test.ts
```

Expected: these may already pass. If they pass, this task is still useful because it locks the behavior.

- [ ] **Step 3: If needed, update fallback functions**

If the tests fail, make sure these functions remain:

```ts
function fallbackItems(options: CatalogReadOptions): JewelryItem[] {
  return options.useFixtureFallback === false ? [] : getFixtureJewelryItems();
}

function fallbackItemById(itemId: string, options: CatalogReadOptions): JewelryItem | undefined {
  return options.useFixtureFallback === false ? undefined : getFixtureJewelryItems().find((item) => item.id === itemId);
}
```

- [ ] **Step 4: Commit Task 8**

Run:

```powershell
git add lib/sparkle-finder/catalog-service.ts tests/sparkle-finder/catalog-service.test.ts
git commit -m "test: lock catalog fallback behavior"
```

---

## Task 9: Update Smoke Test for API-Aware Customer Flow

**Files:**

- Modify: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Update existing smoke expectation for Nic-Nac link behavior**

In the smoke test named `Silver library item detail exposes bounded Nic-Nac and local rep-board paths`, keep the fixture flow as-is because it intentionally visits `jewel-rainbow-crown-ring`.

Add a second smoke test that only runs when a live API item ID is supplied:

```ts
test("Silver API-backed item detail exposes Sparkle Suite availability links when configured", async ({ page }) => {
  const apiItemId = process.env.SPARKLE_FINDER_SMOKE_API_ITEM_ID;

  test.skip(!apiItemId, "Set SPARKLE_FINDER_SMOKE_API_ITEM_ID to smoke-test a live API-backed item detail page.");

  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "sparkle_finder_auth_mode",
      value: "silver",
      url: baseUrl,
    },
  ]);

  await page.goto(`${baseUrl}/library/${apiItemId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Nic-Nac, find this for me")).toBeVisible();
  await expect(page.getByText(/Sparkle Suite lead|No known rep availability yet/)).toBeVisible();
  await expectNoGuardrailCopy(page);
});
```

- [ ] **Step 2: Run smoke test without live API item env**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected: existing smoke tests pass and the new live API smoke test is skipped.

- [ ] **Step 3: Run smoke test with known live item env**

Use the known item from the June 6 API check:

```powershell
$env:SPARKLE_FINDER_SMOKE_API_ITEM_ID="ba56d037-a1b5-46f0-b25c-e9f3cde094c2"
npm run smoke:sparkle-finder
```

Expected: smoke tests pass and the API-backed item detail test runs.

- [ ] **Step 4: Commit Task 9**

Run:

```powershell
git add tests/smoke/sparkle-finder-home.spec.ts
git commit -m "test: smoke API-backed Finder item detail"
```

---

## Task 10: Full Verification, Live Read-Only Check, Push

**Files:**

- No app files unless previous tasks exposed a necessary fix.

- [ ] **Step 1: Check working tree**

Run:

```powershell
git status --short --branch --untracked-files=all
```

Expected: on `codex-sparkle-finder-v1`, no uncommitted changes except any final intended edits.

- [ ] **Step 2: Run full test suite**

Run:

```powershell
npm run test
```

Expected: all tests pass.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: Next.js build passes.

- [ ] **Step 4: Run smoke test**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected: smoke tests pass. If no local server is running, start the existing dev server according to repo scripts before smoke testing.

- [ ] **Step 5: Run live read-only API check**

Run:

```powershell
$catalog = Invoke-RestMethod -Uri 'https://www.yoursparklesuite.com/api/public/finder/catalog?limit=2' -TimeoutSec 20
$first = $catalog.items[0]
$availability = Invoke-RestMethod -Uri "https://www.yoursparklesuite.com/api/public/finder/availability?designId=$($first.designId)&limit=5" -TimeoutSec 20
"ITEMS=$($catalog.items.Count)"
"FIRST_ID=$($first.designId)"
"FIRST_NAME=$($first.designName)"
"FIRST_AVAILABLE=$($first.availableListingCount)"
"EXACT=$($availability.exactMatches.Count)"
"SIMILAR=$($availability.similarMatches.Count)"
```

Expected: returns catalog items and availability counts without writing data.

- [ ] **Step 6: Push branch**

Run:

```powershell
git push origin codex-sparkle-finder-v1
```

Expected: branch pushed successfully.

- [ ] **Step 7: Final report**

Report:

- Commit hashes created.
- Test suite result.
- Build result.
- Smoke test result.
- Live API read-only check result.
- Any remaining limitation, especially Rep Boards/Live Shows requiring new public API index endpoints if Louis wants them fully live instead of preview-labeled.

---

## Self-Review

Spec coverage:

- Library search and filters: Task 2.
- Availability visibility: Task 3.
- API lead links: Task 1 and Task 4.
- Nic-Nac fixture wording: Task 5.
- Rep Boards/Live Shows consistency: Task 7.
- Search tags/year: Task 6.
- Fixture fallback confidence: Task 8.
- Smoke/customer flow verification: Task 9 and Task 10.

Placeholder scan:

- No `TBD`/`TODO` placeholders are required for implementation.
- Where Sparkle Suite lacks list endpoints, this plan chooses explicit preview labeling instead of pretending a live board/calendar API exists.

Type consistency:

- `LibraryFilters` is exported from `app/(hub)/library/page.tsx` and consumed by `components/library/LibrarySearch.tsx`.
- `FinderAvailabilityResult` stays the detail/Nic-Nac API availability shape.
- `NicNacDataSource` uses `"api" | "fixture"` consistently.

## Execution Recommendation

Use subagent-driven development if multiple workers are available, because the tasks are cleanly separated:

- Tasks 1, 4, and 5 are link/Nic-Nac work.
- Tasks 2, 3, and 6 are library/search work.
- Tasks 7, 8, 9, and 10 are clarity and verification work.

If executing inline in one session, do the tasks in order because later tests depend on helpers from earlier tasks.
