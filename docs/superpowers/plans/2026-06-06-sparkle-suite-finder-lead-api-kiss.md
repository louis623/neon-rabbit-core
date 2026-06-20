# Sparkle Suite Finder Lead API KISS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Sparkle Suite public Finder API so Sparkle Finder receives only qualified lead results: available jewelry listings from reps with a live or future scheduled show, labeled with show name, rep first name, next show time, and one canonical customer-site URL.

**Architecture:** Sparkle Suite remains the source of truth. Sparkle Finder does not scrape rep sites, read raw Sparkle Suite tables, or own board/calendar data. The existing `GET /api/public/finder/*` endpoints stay in place, but their payload is tightened so Finder becomes a simple lead-generation surface that routes customers to the rep's Sparkle Suite site.

**Tech Stack:** Next.js App Router, Supabase service-role reads in `lib/sparkle-finder/public-api.ts`, Vitest route/helper tests, current Sparkle Suite public URL contract `https://www.yoursparklesuite.com/showname`.

---

## Guardrails

- Do not edit the Sparkle Finder repo.
- Do not change Sparkle Suite workspace UI, customer-site UI, trade board behavior, jewelry library behavior, or calendar behavior.
- Keep changes scoped to the public Finder API contract and its tests unless a test proves a shared helper is required.
- Treat this as a cross-repo contract change: additive or clearly versioned changes first, test before implementation, and verify existing Finder API routes still respond.
- Keep raw database column names private. `reps.business_name` can remain the source column, but the public API must call it `showName`.
- Do not expose separate trade board links, social links, live platform links, or calendar links in the Finder lead card payload. The single routing target is the rep's Sparkle Suite customer-facing site.

## Current State

Existing implementation target:

- `C:\Users\louis\sparkle-suite-repo\lib\sparkle-finder\public-api.ts`

Existing routes:

- `C:\Users\louis\sparkle-suite-repo\app\api\public\finder\catalog\route.ts`
- `C:\Users\louis\sparkle-suite-repo\app\api\public\finder\catalog\[designId]\route.ts`
- `C:\Users\louis\sparkle-suite-repo\app\api\public\finder\availability\route.ts`

Existing tests:

- `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`
- `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-routes.test.ts`

Known current mismatch:

- Availability results can include `nextShow: null`.
- Catalog `availableListingCount` counts eligible paid/public reps, but does not require a future/live show.
- Public rep payload says `businessName`, `customerSitePath`, and `tradeBoardPath`.
- Customer-site paths are currently old preview-style paths like `/amethyst?c=repId`, not the locked customer-facing URL shape.

## Target Public Contract

Availability response lead matches should use this public shape:

```ts
interface SparkleFinderPublicRep {
  repId: string
  showName: string
  repFirstName: string
  customerSiteUrl: string
}

interface SparkleFinderPublicShow {
  showId: string
  repId: string
  startsAt: string
  title: string | null
  status: 'scheduled' | 'live'
}

interface SparkleFinderAvailabilityMatch {
  listingId: string
  listedAt: string | null
  photoUrl: string | null
  photoSource: 'listing' | 'canonical' | 'missing'
  item: SparkleFinderCatalogItem
  rep: SparkleFinderPublicRep
  nextShow: SparkleFinderPublicShow
}
```

Business rule:

```text
Only return/count a trade listing for Finder lead generation when:
1. trade_listings.status = 'available'
2. the rep has paid/eligible Sparkle Suite access using the existing eligibility rules
3. the rep has at least one calendar_events row where:
   - status is 'scheduled' or 'live'
   - event_time >= now, unless status is 'live'
```

Display language:

- `showName` comes from `reps.business_name`, falling back to display name only if the show name is blank.
- `repFirstName` comes from the first token of `reps.display_name`, falling back to `Sparkle Suite Rep` only if missing.
- `customerSiteUrl` is the one CTA destination.

## File Structure

- Modify `C:\Users\louis\sparkle-suite-repo\lib\sparkle-finder\public-api.ts`
  - Public types.
  - Public rep mapping.
  - Future/live show eligibility.
  - Count logic.
  - Canonical customer-site URL builder.
- Modify `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`
  - Contract mapping tests.
  - Exclusion tests for no future/live show.
  - Count consistency tests.
- Modify `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-routes.test.ts`
  - Route contract expectations for simplified payload.
  - Limit/error behavior should remain unchanged.
- Optional, only if the repo already exposes the helper cleanly:
  - Import a public-site URL helper from `C:\Users\louis\sparkle-suite-repo\lib\public-site\show-link.ts`.
  - If importing creates coupling or test churn, keep a small Finder-local builder that uses the same slug rule and add a test.

---

### Task 1: Lock The Finder Lead Contract In Tests

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`

- [ ] **Step 1: Update the public availability mapping test first**

Replace the current expectation for `businessName`, `customerSitePath`, and `tradeBoardPath` with `showName`, `repFirstName`, and `customerSiteUrl`.

Use a fixture where `display_name` is `Gracie Smoke` and `business_name` is `Gracie Test Studio`.

Expected assertion:

```ts
expect(match).toMatchObject({
  listingId: 'listing-1',
  photoUrl: 'https://cdn.example.test/listing.png',
  photoSource: 'listing',
  rep: {
    repId: 'rep-1',
    showName: 'Gracie Test Studio',
    repFirstName: 'Gracie',
    customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
  },
  nextShow: {
    showId: 'show-1',
    startsAt: '2026-06-06T01:00:00.000Z',
    status: 'scheduled',
  },
})
expect(JSON.stringify(match)).not.toContain('businessName')
expect(JSON.stringify(match)).not.toContain('tradeBoardPath')
expect(JSON.stringify(match)).not.toContain('customerSitePath')
expect(JSON.stringify(match)).not.toContain('/amethyst?c=')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts
```

Expected: FAIL because the implementation still returns `businessName`, `customerSitePath`, and `tradeBoardPath`.

---

### Task 2: Rename Public Rep Payload Without Renaming Database Fields

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\sparkle-finder\public-api.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`

- [ ] **Step 1: Update the public rep interface**

Replace:

```ts
export interface SparkleFinderPublicRep {
  repId: string
  displayName: string
  businessName: string
  profilePhotoUrl: string | null
  customerSitePath: string
  tradeBoardPath: string
}
```

With:

```ts
export interface SparkleFinderPublicRep {
  repId: string
  showName: string
  repFirstName: string
  profilePhotoUrl: string | null
  customerSiteUrl: string
}
```

- [ ] **Step 2: Add small mapping helpers**

Add near the existing path builders:

```ts
const SPARKLE_SUITE_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_SPARKLE_SUITE_PUBLIC_ORIGIN ??
  'https://www.yoursparklesuite.com'

function normalizeFinderSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function getFinderShowName(rep: NonNullable<ReturnType<typeof readSingle<FinderRepRow>>>) {
  return (
    rep.business_name?.trim() ||
    rep.display_name?.trim() ||
    'Sparkle Suite Rep'
  )
}

function getFinderRepFirstName(displayName: string | null) {
  const first = displayName?.trim().split(/\s+/)[0]?.trim()
  return first || 'Sparkle Suite Rep'
}

function buildCustomerSiteUrl(rep: { business_name: string | null; display_name: string | null }) {
  const showName = getFinderShowName(rep as never)
  const slug = normalizeFinderSlug(showName)
  return `${SPARKLE_SUITE_PUBLIC_ORIGIN}/${encodeURIComponent(slug)}`
}
```

If TypeScript dislikes the generic helper type above, use this explicit type instead:

```ts
type FinderRepSingle = {
  id: string
  display_name: string | null
  business_name: string | null
  profile_photo_url: string | null
  custom_domain: string | null
  status: string | null
}
```

Then type the helpers with `FinderRepSingle`.

- [ ] **Step 3: Update `mapSparkleFinderAvailabilityListingRow`**

Replace the old `rep` mapping with:

```ts
const showName = getFinderShowName(rep)

rep: {
  repId: rep.id,
  showName,
  repFirstName: getFinderRepFirstName(rep.display_name),
  profilePhotoUrl: rep.profile_photo_url,
  customerSiteUrl: buildCustomerSiteUrl(rep),
},
```

- [ ] **Step 4: Remove old path builders**

Delete:

```ts
function buildCustomerSitePath(repId: string) {
  return `/amethyst?c=${encodeURIComponent(repId)}`
}

function buildTradeBoardPath(repId: string) {
  return `/amethyst/trade?c=${encodeURIComponent(repId)}`
}
```

- [ ] **Step 5: Run focused contract test**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts
```

Expected: PASS for the mapping test, unless later tests still expect the old fields.

---

### Task 3: Require Live Or Future Shows For Availability Matches

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\sparkle-finder\public-api.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`

- [ ] **Step 1: Make `nextShow` non-null in the public match type**

Change:

```ts
nextShow: SparkleFinderPublicShow | null
```

To:

```ts
nextShow: SparkleFinderPublicShow
```

- [ ] **Step 2: Add a test proving null-show matches are excluded**

Use a helper-level test for a new exported function if direct service testing is hard. Recommended export:

```ts
export function filterListingsWithNextShows(
  rows: FinderListingRow[],
  nextShows: Map<string, SparkleFinderPublicShow>,
) {
  return rows.filter((row) => nextShows.has(row.rep_id))
}
```

Test:

```ts
it('excludes available listings when the rep has no live or future show', () => {
  const rows = [
    { id: 'listing-with-show', rep_id: 'rep-1' },
    { id: 'listing-without-show', rep_id: 'rep-2' },
  ] as never

  const filtered = filterListingsWithNextShows(
    rows,
    new Map([
      [
        'rep-1',
        {
          showId: 'show-1',
          repId: 'rep-1',
          startsAt: '2026-06-10T00:00:00.000Z',
          title: 'Wednesday Reveal',
          status: 'scheduled',
        },
      ],
    ]),
  )

  expect(filtered.map((row) => row.id)).toEqual(['listing-with-show'])
})
```

- [ ] **Step 3: Filter exact and similar rows before mapping**

In `getSparkleFinderAvailability`, after `nextShows` is loaded:

```ts
const exactLeadRows = filterListingsWithNextShows(exactRows, nextShows)
const similarLeadRows = filterListingsWithNextShows(similarRows, nextShows)
```

Then map:

```ts
exactMatches: exactLeadRows.map((listing) =>
  mapSparkleFinderAvailabilityListingRow(
    listing,
    nextShows.get(listing.rep_id)!,
  ),
),
similarMatches: similarLeadRows.map((listing) =>
  mapSparkleFinderAvailabilityListingRow(
    listing,
    nextShows.get(listing.rep_id)!,
  ),
),
```

- [ ] **Step 4: Make mapper reject missing next show**

Change mapper signature:

```ts
nextShow: SparkleFinderPublicShow
```

Remove any null handling in the returned object.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts
```

Expected: PASS.

---

### Task 4: Make Catalog Counts Use The Same Qualified Lead Rule

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\sparkle-finder\public-api.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-api.test.ts`

- [ ] **Step 1: Add a pure count helper test**

Add an exported helper:

```ts
export function countListingsByDesignForQualifiedReps(
  rows: Array<{ design_id: string; rep_id: string }>,
  qualifiedRepIds: Set<string>,
) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!qualifiedRepIds.has(row.rep_id)) continue
    counts.set(row.design_id, (counts.get(row.design_id) ?? 0) + 1)
  }
  return counts
}
```

Test:

```ts
it('counts only available listings from reps with live or future shows', () => {
  const counts = countListingsByDesignForQualifiedReps(
    [
      { design_id: 'design-1', rep_id: 'rep-with-show' },
      { design_id: 'design-1', rep_id: 'rep-without-show' },
      { design_id: 'design-2', rep_id: 'rep-with-show' },
    ],
    new Set(['rep-with-show']),
  )

  expect(counts.get('design-1')).toBe(1)
  expect(counts.get('design-2')).toBe(1)
  expect(counts.has('design-3')).toBe(false)
})
```

- [ ] **Step 2: Add a loader for qualified rep IDs with shows**

Add:

```ts
async function loadRepIdsWithFinderShows(
  supabase: SupabaseClient,
  eligibleRepIds: string[],
) {
  const repIds = new Set<string>()
  if (eligibleRepIds.length === 0) return repIds

  const { data, error } = await supabase
    .from('calendar_events')
    .select('rep_id')
    .in('rep_id', eligibleRepIds)
    .in('status', ['scheduled', 'live'])
    .gte('event_time', new Date().toISOString())

  if (error) throw error
  for (const row of (data ?? []) as Array<{ rep_id: string | null }>) {
    if (row.rep_id) repIds.add(row.rep_id)
  }
  return repIds
}
```

Note: If “currently live” events may have `event_time` in the past, adjust this to OR live status without the `gte` requirement. If Supabase query composition makes OR hard, use two small queries:

```ts
// scheduled future
.eq('status', 'scheduled').gte('event_time', now)

// live now
.eq('status', 'live')
```

Then combine rep IDs.

- [ ] **Step 3: Update `countEligibleAvailableListings`**

Inside `countEligibleAvailableListings`, after `eligibleRepIds`:

```ts
const qualifiedRepIds = await loadRepIdsWithFinderShows(supabase, eligibleRepIds)
if (qualifiedRepIds.size === 0) return counts
```

Keep the existing `trade_listings` query, then count with:

```ts
return countListingsByDesignForQualifiedReps(
  (data ?? []) as Array<{ design_id: string; rep_id: string }>,
  qualifiedRepIds,
)
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts
```

Expected: PASS.

---

### Task 5: Update Route Contract Tests

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\sparkle-finder-public-routes.test.ts`

- [ ] **Step 1: Update mocked availability payload**

The route test mock should return the new public rep payload:

```ts
rep: {
  repId: 'rep-1',
  showName: 'Gracie Test Studio',
  repFirstName: 'Gracie',
  profilePhotoUrl: null,
  customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
},
nextShow: {
  showId: 'show-1',
  repId: 'rep-1',
  startsAt: '2026-06-10T00:00:00.000Z',
  title: 'Wednesday Reveal',
  status: 'scheduled',
},
```

- [ ] **Step 2: Add negative assertions**

After reading the JSON response:

```ts
expect(JSON.stringify(body)).not.toContain('businessName')
expect(JSON.stringify(body)).not.toContain('tradeBoardPath')
expect(JSON.stringify(body)).not.toContain('customerSitePath')
```

- [ ] **Step 3: Run route tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-routes.test.ts
```

Expected: PASS.

---

### Task 6: Contract Compatibility And Smoke Verification

**Files:**
- Modify only if needed after failures:
  - `C:\Users\louis\sparkle-suite-repo\tests\smoke-demo-readiness.test.ts`
  - Existing smoke scripts, only if they assert old field names.

- [ ] **Step 1: Run focused public Finder tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts tests/sparkle-finder-public-routes.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the existing live API smoke**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected:

- The public Finder catalog endpoint works.
- Availability endpoint works.
- If the old smoke expects matches without future shows, update the smoke fixture expectation to match the new rule instead of weakening the product rule.

- [ ] **Step 3: Manually check one live API URL**

Use a real design ID from catalog:

```powershell
curl.exe -L "http://localhost:3000/api/public/finder/catalog?limit=3"
curl.exe -L "http://localhost:3000/api/public/finder/availability?designId=<designId>&limit=5"
```

Expected availability JSON:

- Has `rep.showName`.
- Has `rep.repFirstName`.
- Has `rep.customerSiteUrl`.
- Has non-null `nextShow`.
- Does not have `rep.businessName`, `rep.tradeBoardPath`, or `rep.customerSitePath`.

---

### Task 7: Full Verification And Handoff

**Files:**
- No additional files expected.

- [ ] **Step 1: Run the focused regression set**

Run:

```powershell
npm exec vitest run tests/sparkle-finder-public-api.test.ts tests/sparkle-finder-public-routes.test.ts tests/services/calendar-timezone.test.ts tests/nic-nac/calendar-service.test.ts tests/amethyst-homepage-upcoming-shows.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 3: Review git diff carefully**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo diff -- lib/sparkle-finder/public-api.ts tests/sparkle-finder-public-api.test.ts tests/sparkle-finder-public-routes.test.ts app/api/public/finder
```

Expected:

- Diff is limited to public Finder API contract and tests.
- No workspace UI behavior changes.
- No customer-site rendering changes.
- No Sparkle Finder repo changes.

- [ ] **Step 4: Write handoff note**

Record:

- Public contract changed from `businessName/customerSitePath/tradeBoardPath` to `showName/repFirstName/customerSiteUrl`.
- Availability and catalog counts now require live/future scheduled show.
- Finder should render viewer-local time from `nextShow.startsAt`.
- Finder should use one CTA: `Visit Rep Site`.

## Self-Review

Spec coverage:

- KISS single-link lead flow: covered in Tasks 1, 2, 5, 6.
- Business name/show name language: covered in Tasks 1 and 2.
- Rep first name: covered in Tasks 1 and 2.
- Only show reps with future/live shows: covered in Tasks 3 and 4.
- Count consistency: covered in Task 4.
- Cross-repo caution: covered in Guardrails and Task 7.

Placeholder scan:

- No implementation step uses TODO/TBD placeholders.
- Optional import choice is bounded and includes fallback.

Type consistency:

- `nextShow` becomes non-null on availability matches.
- Public rep field names are consistent across tests, service types, and route payloads.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-06-06-sparkle-suite-finder-lead-api-kiss.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch one worker for API contract/types and one worker for tests/smoke review, with main-agent review between tasks.
2. **Inline Execution** - Execute task-by-task in this session using executing-plans, with checkpoints after public API tests and after smoke/build.
