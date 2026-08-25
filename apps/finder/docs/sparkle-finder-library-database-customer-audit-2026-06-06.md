# Sparkle Finder Library Database Customer Audit

Date: 2026-06-06

Repo audited: `C:\Users\louis\sparkle-finder-repo`

Branch: `codex-sparkle-finder-v1`

Report location: `C:\Users\louis\sparkle-finder\docs\sparkle-finder-library-database-customer-audit-2026-06-06.md`

## Plain-English Summary

Sparkle Finder is partly connected to the Sparkle Suite public Finder API now.

The main jewelry library list, individual jewelry detail pages, Silver's add-existing-record list, and Silver collection save validation can use Sparkle Suite catalog records through the public API boundary.

The biggest customer-facing gap is consistency. A customer can see live API jewelry and availability on one page, but the search/filter controls, Rep Boards page, Live Shows page, dashboard board/show counts, and some Nic-Nac wording/links still behave like fixture/demo data. That means the site can feel connected in one place and disconnected in another.

The most meaningful next improvements are not a rebuild. They are small wiring fixes:

1. Make library search/filter actually drive the API or local filtering.
2. Show availability signals on cards and detail pages.
3. Fix Sparkle Suite rep board/profile links so API leads open the right place.
4. Stop customer-facing copy from saying "fixture" when API data is being used.
5. Decide whether Rep Boards and Live Shows should stay preview-only or receive API-backed views.

## What Is Working

- `lib/sparkle-finder/catalog-service.ts` reads from `GET /api/public/finder/catalog`.
- `lib/sparkle-finder/catalog-service.ts` reads individual records from `GET /api/public/finder/catalog/:designId`.
- `lib/sparkle-finder/catalog-service.ts` reads availability from `GET /api/public/finder/availability?designId=...`.
- `app/(hub)/library/page.tsx` loads catalog records through `getCatalogJewelryItems()`.
- `app/(hub)/library/[itemId]/page.tsx` loads a single catalog item and availability through the API service.
- `app/(hub)/silver/page.tsx` loads API catalog records for Silver's "Add Existing Records" list.
- `app/(hub)/silver/actions.ts` validates saved Silver collection item IDs against the API with fixture fallback disabled.
- No active app/library code directly reads raw `jewelry_designs` or `trade_listings` tables. The active Supabase reads are Sparkle Finder-owned customer/profile/membership/collection tables.

## Live API Check

Read-only check against `https://www.yoursparklesuite.com` passed.

- Catalog endpoint returned 2 items with `limit=2`.
- First item ID: `ba56d037-a1b5-46f0-b25c-e9f3cde094c2`
- First item name: `Garden Gala Bracelet`
- First item available listing count: `1`
- First item collection year: blank/null in the live response
- First item search tags: blank/empty in the live response
- Availability endpoint returned 1 exact match and 0 similar matches for that first item.

This means the API boundary is reachable today, but Finder should treat `collectionYear` and `searchTags` as optional.

## Findings

### 1. Library search and filters look real but are not wired

Customer impact: high.

The Library page renders search and filter controls, but the page does not read the URL search params and does not pass a query/type/label into the catalog service.

Evidence:

- `app/(hub)/library/page.tsx` calls `getCatalogJewelryItems()` with no query/filter options.
- `components/library/LibrarySearch.tsx` renders inputs named `q`, `type`, and `label`.
- `renderLibraryPageContent()` receives items and renders them all.

What a customer feels: "I typed something into search, but the library did not actually narrow down."

Smallest later fix:

- Let `LibraryPage` read `searchParams`.
- Pass `q` into `getCatalogJewelryItems({ query: q })`.
- Apply type/label filtering after the API result, or expand the API if Sparkle Suite wants to support those filters server-side.
- Preserve selected filter values in `LibrarySearch`.

### 2. API availability is fetched but not visible enough in the catalog grid

Customer impact: high.

Catalog API records include `availableListingCount`, but `JewelryCard` does not show it. Customers browsing the library cannot quickly tell which items currently have available rep listings.

Evidence:

- `catalog-service.ts` maps `availableListingCount`.
- `components/library/JewelryCard.tsx` renders name, collection, type, and label only.

What a customer feels: "Which of these can I actually find right now?"

Smallest later fix:

- Add a small "Available now" / "No current listings" signal on the library card.
- Optionally sort or filter available items first.

### 3. API rep board/profile links can route customers to the wrong place

Customer impact: high.

API availability rows carry Sparkle Suite paths like `/amethyst/trade?c=rep-demo`. In item detail, those paths are used directly. In Nic-Nac, they are converted into local `/rep-boards?listing=...` paths by a helper built for old fixture URLs.

Evidence:

- `app/(hub)/library/[itemId]/page.tsx` uses `href: match.rep.tradeBoardPath` for API availability rows.
- `components/nic-nac/FindThisForMe.tsx` calls `getLocalRepBoardHref(match.listing.boardUrl)`.
- `lib/sparkle-finder/route-hrefs.ts` turns the last URL/path segment into `/rep-boards?listing=...`.

What a customer feels: "I clicked the rep board lead and landed somewhere confusing or empty."

Smallest later fix:

- Add one URL helper for Sparkle Suite API paths.
- If API gives a relative Sparkle Suite path, prefix it with the Sparkle Suite base URL.
- Keep fixture local mapping only for fixture/demo URLs.
- Add tests for API path conversion.

### 4. Nic-Nac still says "fixture" even when API availability is used

Customer impact: medium.

When the detail page passes API availability into Nic-Nac, the matching data is real API data, but the UI still says "fixture lead" and "fixture-backed rep boards."

Evidence:

- `components/nic-nac/FindThisForMe.tsx` renders `{result.results.length} fixture lead/leads`.
- Free/Silver copy says "fixture-backed rep boards and next-show context."

What a customer feels: "Is this real data or just a demo?"

Smallest later fix:

- Make Nic-Nac copy data-source aware.
- For API-backed results, say "lead" or "Sparkle Suite lead."
- Keep fixture wording only in explicit local preview mode.

### 5. Rep Boards and Live Shows are still fixture-backed

Customer impact: medium to high, depending on launch expectations.

The detail page can show API availability, but the standalone Rep Boards and Live Shows pages still read local fixtures. Dashboard stats also mix live catalog counts with fixture board/show counts.

Evidence:

- `app/(hub)/rep-boards/page.tsx` uses `getRepBoardListings()`, `getLiveShows()`, `getReps()`, and `getJewelryItems()` from fixture service.
- `app/(hub)/live-shows/page.tsx` uses `getLiveShows()`.
- `app/(hub)/dashboard/page.tsx` uses API catalog records for library stats, but fixture functions for live-show and board-listing stats.

What a customer feels: "The item detail says a rep has this, but the board/calendar pages do not line up."

Smallest later fix:

- If Rep Boards/Live Shows are meant to stay preview-only, label them clearly as preview/demo.
- If they should be live, add public Finder API endpoints or adapter functions for board/listing/show index views.
- At minimum, avoid mixing live catalog counts with fixture availability counts on the dashboard.

### 6. Search helper does not include the new API fields

Customer impact: medium.

The local search helper searches name, collection, type, Bomb Party label, and item number, but not `searchTags` or `collectionYear`.

Evidence:

- `lib/sparkle-finder/search.ts` does not search `searchTags`.
- `lib/sparkle-finder/search.ts` does not search `collectionYear`.
- `types.ts` includes those fields, and the API service maps them.

What a customer feels: "I searched by a tag or year and nothing happened."

Smallest later fix:

- Include `searchTags` and `collectionYear` in local search matching.
- If API search already covers tags/year, keep local helper aligned for fallback and tests.

### 7. Silent fixture fallback can hide API outages

Customer impact: medium.

If catalog API fetch fails, the catalog service quietly falls back to local fixture jewelry. That is useful for development, but in production it can make customers see old/demo-style records without knowing the live database was unavailable.

Evidence:

- `getCatalogJewelryItems()` catches fetch failures and returns fallback items unless `useFixtureFallback` is false.
- `getCatalogJewelryItemById()` does the same for detail records.

What a customer feels: "The site still loads, but the data may not be the live library."

Smallest later fix:

- Keep fallback for local preview.
- In production, either disable fixture fallback or expose a clear "live data unavailable" empty/error state.
- Add a tiny data-source flag in service results if the UI needs to show a safe status.

### 8. Silver saved collection records can lose old fixture-linked items

Customer impact: medium for existing preview/test users.

Silver now loads API catalog records. Persisted collection records store `jewelry_item_id`. If older saved records used fixture IDs, they may no longer match API design IDs and may disappear from the saved collection view.

Evidence:

- `app/(hub)/silver/page.tsx` looks up persisted `sparkle_finder_collection_items.jewelry_item_id` against API `libraryItems`.
- It falls back to fixture `getJewelryItemById()` only for display.
- New saves are validated against API IDs in `app/(hub)/silver/actions.ts`.

What a customer feels: "A saved item vanished after the library switched over."

Smallest later fix:

- If real customers saved fixture IDs, provide a one-time migration or compatibility map.
- If only preview users saved fixture IDs, document that old preview saves are not canonical.

### 9. Tests are green but do not cover the new customer gaps

Customer impact: indirect but important.

The current suite passes, but the tests still mostly prove the old fixture experience and the catalog adapter mapping. They do not catch the unwired search controls or wrong API lead links.

Evidence:

- `npm run test` passed: 11 files, 185 tests.
- Route tests still expect fixture item IDs such as `jewel-rainbow-crown-ring`.
- Nic-Nac API test accepts `/amethyst/trade?c=rep-demo` as the board URL but does not verify a customer-safe final href.

Smallest later fix:

- Add route/component tests for API-backed library search.
- Add tests for API availability link conversion.
- Add tests that library cards render availability counts.
- Add dashboard tests that avoid mixing live and fixture source counts unless intentionally preview-labeled.

## Recommended Next Steps

### Phase 1: Quick customer clarity fixes

These are the smallest, highest-value changes.

1. Wire `/library?q=...` into `getCatalogJewelryItems({ query })`.
2. Make type/label filters actually filter the visible catalog.
3. Show `availableListingCount` on library cards.
4. Fix API rep board/profile links with a Sparkle Suite URL helper.
5. Remove "fixture" wording from Nic-Nac when live API availability is present.

### Phase 2: Consistency across pages

1. Decide whether Rep Boards and Live Shows are preview pages or live pages.
2. If live, add or consume API endpoints for board/listing/show index views.
3. If preview, label them clearly so customers do not confuse fixture board data with live availability.
4. Make dashboard stats come from one source or clearly label mixed sources.

### Phase 3: Data confidence and polish

1. Treat `collectionYear` and `searchTags` as optional in UI.
2. Add data-source/error handling so production does not silently show fixture records during an API outage.
3. Add tests for live API-shaped routes, search, availability badges, and URL conversion.
4. Consider a saved-collection ID migration if any real users saved old fixture IDs.

## Verification Run

Commands run from `C:\Users\louis\sparkle-finder-repo`:

- `npm run test`
  - Result: passed
  - 11 test files passed
  - 185 tests passed
- `npm run build`
  - Result: passed
  - Next.js production build completed successfully
- Live read-only Sparkle Suite public Finder API check
  - Result: passed
  - Catalog, detail-shaped first item, and availability data were reachable through the public API boundary.

## Bottom Line

Sparkle Finder can reach and consume the Sparkle Suite public Finder API. The jewelry database connection is real.

The next work should be small wiring and clarity work, not a rebuild: make search real, surface availability, fix lead links, clean up "fixture" wording, and decide how far Rep Boards/Live Shows should move from preview fixtures into live API-backed views.
