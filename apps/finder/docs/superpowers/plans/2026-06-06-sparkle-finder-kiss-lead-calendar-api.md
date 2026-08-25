# Sparkle Finder KISS Lead + Calendar API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Sparkle Finder to consume the new Sparkle Suite KISS lead contract and separate public live-show calendar feed.

**Architecture:** Sparkle Suite remains the source of truth. Sparkle Finder consumes public Finder API endpoints, displays concise lead context, and routes customers with one CTA: `Visit Rep Site`. Availability is item-specific. Calendar is independent and shows eligible reps with live/future shows whether or not they have trade-board inventory.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Vitest, Playwright smoke tests, Sparkle Suite public Finder API.

---

## Current Audit Result

Repo audited: `C:\Users\louis\sparkle-finder-repo`

Branch: `codex-sparkle-finder-v1`

Finder repo status: clean and synced with `origin/codex-sparkle-finder-v1`.

### Production API Check

Checked against `https://www.yoursparklesuite.com` on 2026-06-06.

`GET /api/public/finder/availability?designId=ba56d037-a1b5-46f0-b25c-e9f3cde094c2&limit=1`

- Status: `200`
- Content-Type: `application/json`
- Current production shape is still the old shape:
  - has nested `rep.businessName`
  - has `rep.customerSitePath`
  - has `rep.tradeBoardPath`
  - has nullable `nextShow`
  - does not expose top-level `showName`
  - does not expose top-level `repFirstName`
  - does not expose top-level `customerSiteUrl`

`GET /api/public/finder/live-shows`

- Status: `404`
- Content-Type: `text/html`
- Returned Sparkle Suite prelaunch/not-found page, not JSON.

Conclusion: Finder can be updated against the new contract using mocked tests, but final live smoke should wait until Sparkle Suite production/preview endpoint is deployed and reachable.

## New Sparkle Suite Contracts To Target

### Availability KISS Lead Contract

`GET /api/public/finder/availability?designId=...`

Expected match shape:

```ts
{
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: SparkleSuiteFinderCatalogItem;
  showName: string;
  repFirstName: string;
  customerSiteUrl: string;
  nextShow: {
    showId: string;
    showName: string;
    repFirstName: string;
    startsAt: string;
    status: "live" | "scheduled";
    customerSiteUrl: string;
  };
}
```

Rules supplied by Sparkle Suite:

- Only includes eligible/paid reps.
- Only includes reps with a live show or future scheduled show.
- Live shows qualify even if their `event_time` is in the past.
- Past scheduled shows are excluded.
- One CTA only: `customerSiteUrl`.

### Calendar Feed Contract

`GET /api/public/finder/live-shows`

Expected response:

```ts
{
  shows: [
    {
      showId: string;
      showName: string;
      repFirstName: string;
      startsAt: string;
      status: "live" | "scheduled";
      customerSiteUrl: string;
    }
  ];
}
```

Rules supplied by Sparkle Suite:

- Does not require trade-board inventory.
- Includes eligible/paid reps with live or future scheduled calendar events.
- Includes live shows even if their `event_time` is in the past.
- Excludes past scheduled shows.
- Excludes suspended/churned reps.
- One CTA only: `customerSiteUrl`.

---

## Finder Gaps

1. `lib/sparkle-finder/catalog-service.ts` still types availability around old nested `rep` and nullable `nextShow`.
2. `app/(hub)/library/[itemId]/page.tsx` still displays `businessName` and uses `tradeBoardPath` with `Open rep board path`.
3. `lib/sparkle-finder/nic-nac.ts` still maps API availability into fixture-shaped `RepSummary` / `RepBoardListing` using `businessName`, `customerSitePath`, and `tradeBoardPath`.
4. `components/nic-nac/FindThisForMe.tsx` still renders board/profile links for API-backed leads.
5. `app/(hub)/live-shows/page.tsx` is still fixture-backed and labeled preview.
6. `app/(hub)/dashboard/page.tsx` still counts preview live shows from fixtures.
7. `tests/smoke/sparkle-finder-home.spec.ts` still expects API item detail to expose `Open rep board path`, not `Visit Rep Site`.
8. `components/boards/RepBoardGrid.tsx` and `/rep-boards` remain fixture-backed. That is acceptable unless Sparkle Suite also creates a separate public board-index endpoint. The current new API handoff only covers calendar and item-specific availability.

---

## Task 1: Add Read-Only API Contract Verification Script/Test

**Files:**

- Create: `scripts/check-sparkle-suite-finder-api.ts`
- Test: optional, run directly with `npx tsx scripts/check-sparkle-suite-finder-api.ts`

- [ ] Add a script that checks:
  - `GET /api/public/finder/catalog?limit=2`
  - first item's availability endpoint
  - `GET /api/public/finder/live-shows`
- [ ] Validate status and content type.
- [ ] Validate KISS availability fields when matches exist:
  - `showName`
  - `repFirstName`
  - `customerSiteUrl`
  - non-null `nextShow`
- [ ] Validate live-shows fields:
  - `showId`
  - `showName`
  - `repFirstName`
  - `startsAt`
  - `status`
  - `customerSiteUrl`
- [ ] The script should exit nonzero if production still returns old shape or 404.

Expected current result until Sparkle Suite deploys: fail with useful message.

Command:

```powershell
npx tsx scripts/check-sparkle-suite-finder-api.ts
```

Commit:

```powershell
git add scripts/check-sparkle-suite-finder-api.ts
git commit -m "test: add Finder API contract check"
```

## Task 2: Update Finder API Types For KISS Availability

**Files:**

- Modify: `lib/sparkle-finder/catalog-service.ts`
- Modify: `tests/sparkle-finder/catalog-service.test.ts`

- [ ] Replace old `SparkleSuiteFinderPublicRep` availability dependency with a KISS match type:

```ts
export type SparkleSuiteFinderLeadShow = {
  showId: string;
  showName: string;
  repFirstName: string;
  startsAt: string;
  status: "scheduled" | "live";
  customerSiteUrl: string;
};

export type FinderAvailabilityMatch = {
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: JewelryItem;
  showName: string;
  repFirstName: string;
  customerSiteUrl: string;
  nextShow: SparkleSuiteFinderLeadShow;
};
```

- [ ] Update `SparkleSuiteFinderAvailabilityMatch` to match the new API.
- [ ] Update `mapAvailabilityMatches()` to map the new top-level fields.
- [ ] Decide fallback behavior if a malformed match has missing `nextShow`:
  - Recommended: skip malformed API match so Finder never shows an incomplete lead.
- [ ] Update catalog-service tests to use the KISS payload:
  - no `rep.businessName`
  - no `rep.customerSitePath`
  - no `rep.tradeBoardPath`
  - non-null `nextShow`
  - `customerSiteUrl`

Run:

```powershell
npm run test -- tests/sparkle-finder/catalog-service.test.ts
```

Commit:

```powershell
git add lib/sparkle-finder/catalog-service.ts tests/sparkle-finder/catalog-service.test.ts
git commit -m "feat: map KISS Finder availability leads"
```

## Task 3: Add Finder Live Shows API Adapter

**Files:**

- Modify: `lib/sparkle-finder/catalog-service.ts`
- Test: `tests/sparkle-finder/catalog-service.test.ts`

- [ ] Add:

```ts
export type FinderLiveShow = {
  showId: string;
  showName: string;
  repFirstName: string;
  startsAt: string;
  status: "scheduled" | "live";
  customerSiteUrl: string;
};
```

- [ ] Add:

```ts
export async function getFinderLiveShows(options: CatalogReadOptions = {}): Promise<FinderLiveShow[]>
```

- [ ] Call:

```txt
/api/public/finder/live-shows?limit=...
```

- [ ] Default fallback while production endpoint is unavailable:
  - return fixture live shows mapped into `FinderLiveShow[]`, or
  - return `[]` with a live-data-unavailable state.
- [ ] Recommendation for customer experience: fixture fallback is acceptable for local preview only, but page copy should not claim live data unless API succeeds.
- [ ] Add tests:
  - maps live-show API shape
  - returns fallback when API missing if fallback enabled
  - returns `[]` when `useFixtureFallback: false`

Run:

```powershell
npm run test -- tests/sparkle-finder/catalog-service.test.ts
```

Commit:

```powershell
git add lib/sparkle-finder/catalog-service.ts tests/sparkle-finder/catalog-service.test.ts
git commit -m "feat: read Finder live show feed"
```

## Task 4: Wire Master Live Calendar Page To API Feed

**Files:**

- Modify: `app/(hub)/live-shows/page.tsx`
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] Replace `getLiveShows()` fixture read with `getFinderLiveShows()`.
- [ ] Render:
  - `showName`
  - `repFirstName`
  - formatted `startsAt`
  - `status` badge: `Live now` or `Scheduled`
  - one CTA: `Visit Rep Site`
- [ ] Remove or revise "Preview calendar data" copy.
- [ ] If API/fallback returns empty:
  - show "No live or upcoming shows are listed right now."
- [ ] Add route tests for:
  - API-shaped shows render show name, rep first name, formatted time, and `Visit Rep Site`
  - live status label renders
  - empty state renders

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Commit:

```powershell
git add 'app/(hub)/live-shows/page.tsx' tests/sparkle-finder/routes.test.ts
git commit -m "feat: wire live shows to Finder API"
```

## Task 5: Update Item Detail Availability Cards To KISS Lead CTA

**Files:**

- Modify: `app/(hub)/library/[itemId]/page.tsx`
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] Replace API availability row fields:
  - `businessName` -> `showName`
  - add `repFirstName`
  - `href` -> `customerSiteUrl`
  - show `nextShow.startsAt`
  - show `nextShow.status`
- [ ] Replace CTA text:

```txt
Open rep board path
```

with:

```txt
Visit Rep Site
```

- [ ] Keep fixture fallback rows as preview-only if no API rows exist, or update fixture rows to also use `Visit Rep Site` for consistency.
- [ ] Add tests:
  - API availability renders show name and rep first name
  - API availability link uses `customerSiteUrl`
  - no old `Open rep board path` appears for API rows

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Commit:

```powershell
git add 'app/(hub)/library/[itemId]/page.tsx' tests/sparkle-finder/routes.test.ts
git commit -m "feat: show KISS availability leads"
```

## Task 6: Update Nic-Nac To KISS Lead Model

**Files:**

- Modify: `lib/sparkle-finder/nic-nac.ts`
- Modify: `components/nic-nac/FindThisForMe.tsx`
- Modify: `tests/sparkle-finder/nic-nac-find.test.ts`

- [ ] Stop mapping API leads into fake `RepSummary` / `RepBoardListing` fields.
- [ ] Either:
  - add API-specific fields to `NicNacFindMatch`, or
  - add a separate `NicNacApiFindMatch` union branch.
- [ ] For API-backed leads render:
  - show name
  - rep first name
  - next show time/status
  - one CTA: `Visit Rep Site`
- [ ] Remove API-backed `Open rep board path` and `Open rep profile`.
- [ ] Preserve fixture-backed preview behavior only for local fixtures.
- [ ] Update tests:
  - API-backed result has `customerSiteUrl`
  - API-backed UI has `Visit Rep Site`
  - API-backed UI does not contain `Open rep board path`

Run:

```powershell
npm run test -- tests/sparkle-finder/nic-nac-find.test.ts
```

Commit:

```powershell
git add lib/sparkle-finder/nic-nac.ts components/nic-nac/FindThisForMe.tsx tests/sparkle-finder/nic-nac-find.test.ts
git commit -m "feat: route Nic-Nac leads to rep sites"
```

## Task 7: Update Dashboard Calendar Count

**Files:**

- Modify: `app/(hub)/dashboard/page.tsx`
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] Load `getFinderLiveShows()` in `DashboardPage`.
- [ ] Pass live show count into `renderDashboardPageContent`.
- [ ] Replace `Preview live shows` with `Live/upcoming shows` when API-backed.
- [ ] Keep board listings labeled preview unless a separate board index endpoint exists.
- [ ] Add route tests for updated labels/counts.

Run:

```powershell
npm run test -- tests/sparkle-finder/routes.test.ts
```

Commit:

```powershell
git add 'app/(hub)/dashboard/page.tsx' tests/sparkle-finder/routes.test.ts
git commit -m "feat: count live shows from Finder API"
```

## Task 8: Update Smoke Tests

**Files:**

- Modify: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] Update API item detail smoke:
  - expect `Visit Rep Site`
  - expect href starts with Sparkle Suite customer site URL
  - stop expecting `Open rep board path`
- [ ] Add live calendar smoke gated by env if production endpoint is not stable yet:

```txt
SPARKLE_FINDER_SMOKE_EXPECT_LIVE_SHOWS=true
```

- [ ] When enabled:
  - go to `/live-shows`
  - expect at least one `Visit Rep Site`
  - expect no "Preview calendar data"

Run:

```powershell
npx playwright test tests/smoke/sparkle-finder-home.spec.ts --list
```

Commit:

```powershell
git add tests/smoke/sparkle-finder-home.spec.ts
git commit -m "test: smoke KISS Finder lead routes"
```

## Task 9: Final Verification

- [ ] Verify Sparkle Suite production/preview API contract first:

```powershell
npx tsx scripts/check-sparkle-suite-finder-api.ts
```

- [ ] Run full Finder tests:

```powershell
npm run test
```

- [ ] Run build:

```powershell
npm run build
```

- [ ] Run smoke with a live API item ID:

```powershell
$env:SPARKLE_FINDER_SMOKE_API_ITEM_ID="<known-live-design-id>"
npm run smoke:sparkle-finder
```

- [ ] If live calendar endpoint is deployed and has shows:

```powershell
$env:SPARKLE_FINDER_SMOKE_EXPECT_LIVE_SHOWS="true"
npm run smoke:sparkle-finder
```

- [ ] Push:

```powershell
git push origin codex-sparkle-finder-v1
```

## Deployment Dependency

The current production Sparkle Suite URL does not yet expose the new live-shows endpoint or KISS availability shape. Finder implementation can proceed with mocked contract tests, but final live smoke cannot honestly pass until Sparkle Suite deploys the new API to the base URL Finder uses.

Recommended sequence:

1. Sparkle Suite deploys or gives Finder the preview API base URL.
2. Finder runs `scripts/check-sparkle-suite-finder-api.ts`.
3. Finder implements Tasks 2-8.
4. Finder runs final tests/build/smoke.
5. Finder pushes.

## Plain-English Outcome

After this plan is implemented:

- Library item pages will say which show has the item.
- Nic-Nac will show show name, rep first name, and next show.
- Calendar will be live API-backed and independent of trade-board inventory.
- Customers will only see one CTA: `Visit Rep Site`.
- Sparkle Finder will stop duplicating trade board/calendar/social routing details that already live on the rep's Sparkle Suite site.
