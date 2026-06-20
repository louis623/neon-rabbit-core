# Catalog Year And Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collection year and practical discovery tags to the Sparkle Suite jewelry catalog so Nic-Nac can create/search/correct richer catalog entries without making Louis the metadata clerk.

**Architecture:** Store `collection_year` on `collections`, because year belongs to the collection rather than every item. Store normalized `search_tags text[]` on `jewelry_designs`, because tags describe the individual piece and support workspace/Finder discovery later. Nic-Nac may suggest and save simple tags, but a service-layer normalizer blocks rarity/hype tags, limits tag count, and keeps the vocabulary practical.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Postgres/RLS, Vercel AI SDK tools, Vitest.

---

## Scope

In scope:
- Add collection year to the shared catalog.
- Add normalized search tags to jewelry designs.
- Let Nic-Nac collect, infer, save, and correct these fields.
- Include year/tags in jewelry library search results.
- Improve search so tags and collection year can be found.
- Keep quiet catalog change history aligned with the prior rep-maintained catalog decision.

Out of scope:
- Sparkle Finder repo/project work.
- Rarity, Diamond, Unicorn, popularity, scarcity, or value scoring.
- Automated release-history intelligence.
- Manual Louis review queues.
- Public customer-facing Finder UI.

---

## Product Rules

1. Collection year is practical organization, not a release-history system.
   - Good: `April Birthday` + `2026`.
   - Display can become `April 2026 Birthday Collection`.
   - Do not build a large collection taxonomy.

2. Tags are discovery helpers.
   - Good: `rose gold`, `rhodium`, `opal`, `heart`, `butterfly`, `floral`, `pink`, `stackable`.
   - Bad: `rare`, `unicorn`, `diamond`, `valuable`, `hard to find`, `high demand`, `grail`.

3. Nic-Nac can help without becoming risky.
   - Nic-Nac may derive tags from item number/type, design name, material, main stone, collection text, and explicit rep language.
   - If unsure, skip the tag.
   - Tags should be lowercase, deduped, capped, and normalized.
   - Reps can correct tags through Nic-Nac.

4. If a rep adds it through Nic-Nac and it passes the existing checks, it is live.
   - No draft/public state in this pass.
   - No Louis approval.

---

## File Map

- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\<generated>_catalog_year_tags.sql`
- Create: `C:\Users\louis\sparkle-suite-repo\lib\services\jewelry-catalog-tags.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\jewelry-database.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\jewelry-catalog-corrections.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\index.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\add-listing.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\report-jewelry-catalog-issue.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\system-prompt.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\prompt-builder.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\jewelry-catalog-tags.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\catalog-year-tags-migration.test.ts`
- Test: update `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\add-listing-recovery.test.ts`
- Test: update `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\report-jewelry-catalog-issue.test.ts`
- Test: update `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\jewelry-database.test.ts`
- Test: update `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-workspace-knowledge.test.ts`

---

## Task 1: Add Database Fields

**Files:**
- Create: `supabase/migrations/<generated>_catalog_year_tags.sql`
- Test: `tests/catalog-year-tags-migration.test.ts`

- [ ] **Step 1: Generate migration**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
supabase migration new catalog_year_tags
```

Expected: Supabase creates a timestamped migration under `supabase/migrations`.

- [ ] **Step 2: Add migration test**

Create `tests/catalog-year-tags-migration.test.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

function readMigration() {
  const file = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('_catalog_year_tags.sql'))
    .sort()
    .at(-1)

  if (!file) throw new Error('catalog_year_tags migration not found')
  return fs.readFileSync(path.join(migrationsDir, file), 'utf8')
}

describe('catalog year and tags migration', () => {
  it('adds collection_year to collections with a practical year check', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE collections')
    expect(sql).toContain('collection_year INTEGER')
    expect(sql).toContain('collections_collection_year_check')
    expect(sql).toContain('collection_year BETWEEN 2020 AND 2040')
  })

  it('adds normalized search tags to jewelry_designs', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_designs')
    expect(sql).toContain("search_tags TEXT[] NOT NULL DEFAULT '{}'::text[]")
    expect(sql).toContain('idx_designs_search_tags')
    expect(sql).toContain('USING GIN (search_tags)')
  })

  it('extends catalog change log issue types for tag and year corrections', () => {
    const sql = readMigration()

    expect(sql).toContain('wrong_collection_year')
    expect(sql).toContain('wrong_tags')
  })
})
```

- [ ] **Step 3: Fill migration**

Add this to the generated migration:

```sql
-- Catalog year and practical discovery tags.
-- Year belongs to the collection. Tags belong to the design.
-- This intentionally does not add rarity, release intelligence, or review queues.

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS collection_year INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'collections_collection_year_check'
  ) THEN
    ALTER TABLE collections
      ADD CONSTRAINT collections_collection_year_check
      CHECK (
        collection_year IS NULL
        OR collection_year BETWEEN 2020 AND 2040
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collections_year
  ON collections(collection_year);

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS search_tags TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_designs_search_tags
  ON jewelry_designs USING GIN (search_tags);

ALTER TABLE jewelry_catalog_change_log
  DROP CONSTRAINT IF EXISTS jewelry_catalog_change_log_issue_type_check;

ALTER TABLE jewelry_catalog_change_log
  ADD CONSTRAINT jewelry_catalog_change_log_issue_type_check
  CHECK (
    issue_type IS NULL OR issue_type IN (
      'wrong_item_number',
      'wrong_collection',
      'wrong_collection_year',
      'wrong_design_name',
      'wrong_msrp',
      'wrong_jewelry_type',
      'wrong_material',
      'wrong_stone',
      'wrong_tags',
      'bad_photo',
      'duplicate',
      'other'
    )
  );
```

- [ ] **Step 4: Run migration test**

Run:

```powershell
npm exec vitest run tests/catalog-year-tags-migration.test.ts
```

Expected: PASS.

---

## Task 2: Add Tag Normalizer And Guardrails

**Files:**
- Create: `lib/services/jewelry-catalog-tags.ts`
- Modify: `lib/services/index.ts`
- Test: `tests/jewelry-catalog-tags.test.ts`

- [ ] **Step 1: Create failing tests**

Create `tests/jewelry-catalog-tags.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  deriveJewelryCatalogTags,
  normalizeJewelryCatalogTags,
} from '@/lib/services/jewelry-catalog-tags'

describe('normalizeJewelryCatalogTags', () => {
  it('lowercases, trims, dedupes, and caps useful tags', () => {
    expect(
      normalizeJewelryCatalogTags([
        ' Rose Gold ',
        'rose gold',
        'Heart',
        'Pink',
        'Stackable',
        'Rhodium',
        'Opal',
        'Floral',
        'Vintage',
        'Extra',
      ]),
    ).toEqual([
      'rose gold',
      'heart',
      'pink',
      'stackable',
      'rhodium',
      'opal',
      'floral',
      'vintage',
    ])
  })

  it('blocks rarity, hype, and value judgment tags', () => {
    expect(
      normalizeJewelryCatalogTags([
        'rare',
        'unicorn',
        'diamond',
        'valuable',
        'high demand',
        'heart',
      ]),
    ).toEqual(['heart'])
  })

  it('derives practical tags from item context without rarity guesses', () => {
    expect(
      deriveJewelryCatalogTags({
        typePrefix: 'RG',
        designName: 'Rose Heart Ring',
        material: 'Rose gold',
        mainStone: 'Pink opal',
        collectionName: 'April Birthday',
        explicitTags: ['Unicorn', 'statement'],
      }),
    ).toEqual(['ring', 'rose gold', 'pink', 'opal', 'heart', 'statement'])
  })
})
```

- [ ] **Step 2: Implement tag helper**

Create `lib/services/jewelry-catalog-tags.ts`:

```ts
import type { JewelryType } from './types'

const MAX_TAGS = 8

const TYPE_TAGS: Record<JewelryType, string> = {
  RG: 'ring',
  NK: 'necklace',
  ER: 'earrings',
  ST: 'stack',
  BR: 'bracelet',
}

const BLOCKED_TAGS = new Set([
  'rare',
  'rarity',
  'unicorn',
  'diamond',
  'diamonds',
  'valuable',
  'value',
  'high demand',
  'hard to find',
  'grail',
  'limited',
  'scarce',
])

const PHRASE_TAGS = [
  'rose gold',
  'yellow gold',
  'gold tone',
  'silver tone',
  'white stone',
  'pink stone',
  'blue stone',
  'green stone',
  'purple stone',
]

const TOKEN_TAGS = new Set([
  'rhodium',
  'sterling',
  'opal',
  'amethyst',
  'sapphire',
  'ruby',
  'pearl',
  'quartz',
  'crystal',
  'pink',
  'blue',
  'purple',
  'green',
  'red',
  'black',
  'white',
  'clear',
  'heart',
  'butterfly',
  'floral',
  'flower',
  'moon',
  'star',
  'simple',
  'statement',
  'stackable',
  'vintage',
  'glam',
])

function normalizeOneTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
}

export function normalizeJewelryCatalogTags(tags: readonly string[] = []): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const raw of tags) {
    const tag = normalizeOneTag(raw)
    if (!tag) continue
    if (tag.length < 2 || tag.length > 32) continue
    if (BLOCKED_TAGS.has(tag)) continue
    if (seen.has(tag)) continue

    seen.add(tag)
    normalized.push(tag)
    if (normalized.length >= MAX_TAGS) break
  }

  return normalized
}

export function deriveJewelryCatalogTags(input: {
  typePrefix: JewelryType
  designName?: string | null
  material?: string | null
  mainStone?: string | null
  collectionName?: string | null
  explicitTags?: readonly string[] | null
}): string[] {
  const sourceText = [
    input.designName,
    input.material,
    input.mainStone,
    input.collectionName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const candidates = [TYPE_TAGS[input.typePrefix]]

  for (const phrase of PHRASE_TAGS) {
    if (sourceText.includes(phrase)) candidates.push(phrase)
  }

  for (const token of TOKEN_TAGS) {
    const pattern = new RegExp(`\\\\b${token.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')}\\\\b`)
    if (pattern.test(sourceText)) candidates.push(token)
  }

  candidates.push(...(input.explicitTags ?? []))

  return normalizeJewelryCatalogTags(candidates)
}
```

- [ ] **Step 3: Export helper**

In `lib/services/index.ts`, add:

```ts
export {
  deriveJewelryCatalogTags,
  normalizeJewelryCatalogTags,
} from './jewelry-catalog-tags'
```

- [ ] **Step 4: Run tag tests**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-tags.test.ts
```

Expected: PASS.

---

## Task 3: Extend Types And Catalog Reads

**Files:**
- Modify: `lib/services/types.ts`
- Modify: `lib/services/jewelry-database.ts`
- Test: update `tests/nic-nac/jewelry-database.test.ts`

- [ ] **Step 1: Update shared types**

In `lib/services/types.ts`:

```ts
export interface JewelryDatabaseResult {
  designId: string
  itemNumber: string
  designName: string
  material: string | null
  mainStone: string | null
  bpMsrp: number | null
  canonicalPhotoUrl: string | null
  typePrefix: JewelryType
  collectionName: string | null
  collectionYear: number | null
  searchTags: string[]
  isOnMyBoard: boolean
  activeListingsCount: number
}

export interface CreateDesignInput {
  itemNumber: string
  designName: string
  piecePhotoUrl: string
  material?: string
  mainStone?: string
  bpMsrp?: number
  collectionName?: string
  collectionYear?: number | null
  searchTags?: string[]
  specialFeatures?: string
  lengthInfo?: string
  photoPipeline?: PhotoPipelineStatePatch
  createdByRepId?: string | null
  conversationId?: string | null
}
```

Also add `collectionYear` and `searchTags` to the `ResolveItemNumberResult.design` shape.

- [ ] **Step 2: Update selects**

In `lib/services/jewelry-database.ts`, update design selects to include:

```ts
search_tags,
collection:collections(name, collection_year)
```

Update mapping:

```ts
collectionYear: (collection?.collection_year as number | null) ?? null,
searchTags: Array.isArray(d.search_tags) ? d.search_tags : [],
```

- [ ] **Step 3: Include tags in fallback search**

In `searchJewelryDatabase`, update fallback search to include `search_tags` by using a separate tag overlap query when ordinary search returns no results:

```ts
const normalizedTagQuery = normalizeJewelryCatalogTags([q])
if (designs.length === 0 && normalizedTagQuery.length > 0) {
  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(
      'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)'
    )
    .overlaps('search_tags', normalizedTagQuery)
    .limit(limit)
  if (error) throw error
  designs = (data ?? []) as unknown as DesignRow[]
}
```

Import `normalizeJewelryCatalogTags`.

- [ ] **Step 4: Update search tool tests**

In `tests/nic-nac/jewelry-database.test.ts`, update mocked service results and assertions to include:

```ts
collectionYear: 2026,
searchTags: ['ring', 'rose gold', 'heart'],
```

Expect flattened tool output to include:

```ts
collectionYear: 2026,
searchTags: ['ring', 'rose gold', 'heart'],
```

- [ ] **Step 5: Run search tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/jewelry-database.test.ts
```

Expected: PASS.

---

## Task 4: Save Collection Year And Tags During New Design Creation

**Files:**
- Modify: `lib/services/jewelry-database.ts`
- Modify: `lib/nic-nac/tools/add-listing.ts`
- Test: update `tests/nic-nac/add-listing-recovery.test.ts`

- [ ] **Step 1: Extend collection helper**

Replace `findOrCreateCollection` in `lib/services/jewelry-database.ts` with a version that accepts year:

```ts
async function findOrCreateCollection(
  supabase: SupabaseClient,
  rawCollectionName: string,
  collectionYear?: number | null,
): Promise<{ id: string; name: string; collectionYear: number | null }> {
  const name = rawCollectionName.trim()
  if (!name) {
    throw errors.INVALID_INPUT(
      'collectionName required',
      'I need the exact collection name before I can list that piece.',
    )
  }

  const { data: existing, error: lookupErr } = await supabase
    .from('collections')
    .select('id, name, collection_year')
    .eq('name', name)
    .maybeSingle()
  if (lookupErr) throw lookupErr

  if (existing) {
    if (collectionYear && !existing.collection_year) {
      const { data: updated, error: updateErr } = await supabase
        .from('collections')
        .update({ collection_year: collectionYear })
        .eq('id', existing.id)
        .is('collection_year', null)
        .select('id, name, collection_year')
        .single()
      if (updateErr) throw updateErr
      return {
        id: updated.id as string,
        name: updated.name as string,
        collectionYear: (updated.collection_year as number | null) ?? null,
      }
    }

    return {
      id: existing.id as string,
      name: existing.name as string,
      collectionYear: (existing.collection_year as number | null) ?? null,
    }
  }

  const { data: created, error: insErr } = await supabase
    .from('collections')
    .insert({ name, collection_year: collectionYear ?? null })
    .select('id, name, collection_year')
    .single()
  if (insErr) throw insErr

  return {
    id: created.id as string,
    name: created.name as string,
    collectionYear: (created.collection_year as number | null) ?? null,
  }
}
```

- [ ] **Step 2: Derive and save tags**

In `createDesign`, import `deriveJewelryCatalogTags` and compute:

```ts
const searchTags = deriveJewelryCatalogTags({
  typePrefix,
  designName: input.designName,
  material: input.material,
  mainStone: input.mainStone,
  collectionName,
  explicitTags: input.searchTags,
})
```

Add to insert:

```ts
search_tags: searchTags,
```

Add to audit `afterState`:

```ts
collectionYear,
searchTags,
```

- [ ] **Step 3: Add tool input fields**

In `lib/nic-nac/tools/add-listing.ts`, extend `newDesignShape`:

```ts
collectionYear: z.number().int().min(2020).max(2040).optional(),
searchTags: z.array(z.string()).max(8).optional(),
```

Pass them into `createDesign`:

```ts
collectionYear: input.collectionYear,
searchTags: input.searchTags,
```

For batch items, use the same shape so batch recovery can support the fields later.

- [ ] **Step 4: Update add-listing tests**

In `tests/nic-nac/add-listing-recovery.test.ts`, update the create-design expectation:

```ts
expect(createDesignMock.mock.calls[0][1]).toMatchObject({
  collectionYear: 2026,
  searchTags: ['rose gold', 'heart'],
})
```

Add this only to a test case where the tool input includes those values.

- [ ] **Step 5: Run add-listing recovery tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/add-listing-batch.test.ts
```

Expected: PASS.

---

## Task 5: Let Nic-Nac Correct Year And Tags

**Files:**
- Modify: `lib/services/types.ts`
- Modify: `lib/services/jewelry-catalog-corrections.ts`
- Modify: `lib/nic-nac/tools/report-jewelry-catalog-issue.ts`
- Test: update `tests/jewelry-catalog-corrections.test.ts`
- Test: update `tests/nic-nac/report-jewelry-catalog-issue.test.ts`

- [ ] **Step 1: Extend correction patch**

In `lib/services/types.ts`:

```ts
export interface JewelryCatalogCorrectionPatch {
  designName?: string
  collectionName?: string
  collectionYear?: number | null
  material?: string | null
  mainStone?: string | null
  bpMsrp?: number | null
  specialFeatures?: string | null
  lengthInfo?: string | null
  searchTags?: string[]
  canonicalPhotoUrl?: string
}
```

Add issue types:

```ts
| 'wrong_collection_year'
| 'wrong_tags'
```

- [ ] **Step 2: Update correction service**

In `lib/services/jewelry-catalog-corrections.ts`:
- Select `search_tags` from `jewelry_designs`.
- Select `collection:collections(id, name, collection_year)` if useful, or look up collection year separately.
- Include `searchTags` in snapshots.
- Normalize correction tags with `normalizeJewelryCatalogTags`.
- If `collectionYear` is provided, update the current or corrected collection row, not every design.

Patch logic:

```ts
if (correction.searchTags !== undefined) {
  const searchTags = normalizeJewelryCatalogTags(correction.searchTags)
  if (JSON.stringify(searchTags) !== JSON.stringify(design.search_tags ?? [])) {
    patch.search_tags = searchTags
    changedFields.push('searchTags')
  }
}
```

Collection year logic:

```ts
if (correction.collectionYear !== undefined) {
  const year = correction.collectionYear
  if (year !== null && (year < 2020 || year > 2040)) {
    throw errors.INVALID_INPUT(
      'collectionYear must be between 2020 and 2040',
      'Use a four-digit collection year between 2020 and 2040.',
    )
  }
  // Update collection row for the design's collection_id or newly chosen collection.
}
```

- [ ] **Step 3: Update correction tool schema**

In `lib/nic-nac/tools/report-jewelry-catalog-issue.ts`, add enum values:

```ts
'wrong_collection_year',
'wrong_tags',
```

Add correction fields:

```ts
collectionYear: z.number().int().min(2020).max(2040).nullable().optional(),
searchTags: z.array(z.string()).max(8).optional(),
```

- [ ] **Step 4: Update tests**

In `tests/jewelry-catalog-corrections.test.ts`, add coverage:

```ts
it('updates normalized tags and records quiet history', async () => {
  // Input: ['Rose Gold', 'rare', 'Heart']
  // Expected patch.search_tags: ['rose gold', 'heart']
  // Expected changedFields includes 'searchTags'
  // Expected change log afterState.searchTags includes ['rose gold', 'heart']
})
```

In `tests/nic-nac/report-jewelry-catalog-issue.test.ts`, update input and expectation:

```ts
correction: {
  collectionYear: 2026,
  searchTags: ['rose gold', 'heart'],
}
```

- [ ] **Step 5: Run correction tests**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-corrections.test.ts tests/nic-nac/report-jewelry-catalog-issue.test.ts
```

Expected: PASS.

---

## Task 6: Teach Nic-Nac The Year/Tag Rules

**Files:**
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Test: update `tests/nic-nac-workspace-knowledge.test.ts`

- [ ] **Step 1: Add catalog metadata rules**

Add to both full and routed catalog prompt text:

```text
Catalog year and tag rules:
- Collection year is stored on the collection, not treated as rarity or release intelligence.
- If a rep gives "April 2026 Birthday", save collectionName as "April Birthday" and collectionYear as 2026 when clear.
- If the collection year is missing and needed, ask one focused follow-up question.
- Tags are practical discovery helpers: material, stone, color, motif, and style.
- Good tags include rose gold, rhodium, sterling, opal, amethyst, sapphire, pink, blue, heart, butterfly, floral, simple, statement, stackable, vintage, glam.
- Do not use rarity or hype tags like rare, unicorn, diamond, valuable, high demand, hard to find, or grail.
- If unsure, skip the tag.
- Keep tags short, lowercase, and no more than 8.
```

- [ ] **Step 2: Update prompt tests**

In `tests/nic-nac-workspace-knowledge.test.ts`, add:

```ts
expect(prompt).toContain('Collection year is stored on the collection')
expect(prompt).toContain('Tags are practical discovery helpers')
expect(prompt).toContain('Do not use rarity or hype tags')
expect(prompt).toContain('If unsure, skip the tag')
```

- [ ] **Step 3: Run prompt tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

---

## Task 7: Show Year/Tags In Workspace Library Results

**Files:**
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: update `tests/nic-nac-dashboard-placeholder.test.ts` if it covers library result shape.

- [ ] **Step 1: Preserve API payload fields**

Where the jewelry library results are rendered, support:

```ts
collectionYear?: number | null
searchTags?: string[]
```

- [ ] **Step 2: Display concise metadata**

In each result card/list row:
- Continue showing item number, design name, collection, MSRP, board status.
- If `collectionYear` exists, show it next to the collection label.
- If `searchTags` exists, show up to 4 small neutral chips.

Do not add a large metadata panel. Keep it quiet.

Example display:

```text
April Birthday · 2026
rose gold · heart · pink
```

- [ ] **Step 3: Avoid pink glow in chips**

Use neutral chip styling:

```css
border: 1px solid rgba(64, 41, 36, 0.12);
background: rgba(255, 255, 255, 0.72);
color: var(--nic-nac-text-secondary);
box-shadow: none;
```

- [ ] **Step 4: Run dashboard tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: PASS.

---

## Task 8: Verification

**Files:**
- No new feature files unless verification exposes issues.

- [ ] **Step 1: Run targeted tests**

Run:

```powershell
npm exec vitest run tests/catalog-year-tags-migration.test.ts tests/jewelry-catalog-tags.test.ts tests/jewelry-catalog-corrections.test.ts tests/nic-nac/report-jewelry-catalog-issue.test.ts tests/nic-nac/jewelry-database.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/add-listing-batch.test.ts tests/nic-nac-workspace-knowledge.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run targeted lint**

Run:

```powershell
npx eslint lib/services/types.ts lib/services/jewelry-database.ts lib/services/jewelry-catalog-tags.ts lib/services/jewelry-catalog-corrections.ts lib/nic-nac/tools/add-listing.ts lib/nic-nac/tools/report-jewelry-catalog-issue.ts lib/nic-nac/system-prompt.ts lib/nic-nac/prompt-builder.ts app/nic-nac/components/DashboardPlaceholder.tsx tests/catalog-year-tags-migration.test.ts tests/jewelry-catalog-tags.test.ts tests/jewelry-catalog-corrections.test.ts tests/nic-nac/report-jewelry-catalog-issue.test.ts tests/nic-nac/jewelry-database.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npx tsc --noEmit --pretty false --incremental false
```

Expected: PASS, or only known pre-existing unrelated test type errors. If unrelated errors remain, document exact files.

- [ ] **Step 4: Browser smoke**

Open:

```text
http://localhost:3001/nic-nac?conversationId=45764110-0330-4a5d-964b-5b5ff49fb662
```

Smoke through Nic-Nac:

```text
Add RG1234, Rose Heart Ring, April 2026 Birthday, rose gold with pink opal and a heart design.
```

Expected:
- Nic-Nac asks for missing required fields/photo if needed.
- If enough data exists, create-design input includes `collectionYear: 2026`.
- Tags include practical tags such as `ring`, `rose gold`, `pink`, `opal`, `heart`.
- No rarity/hype tags.

Smoke correction:

```text
RG1234 has the wrong tags. It should be rose gold, heart, pink.
```

Expected:
- Nic-Nac calls `report_jewelry_catalog_issue`.
- Tags are normalized and quietly logged.
- Nic-Nac does not say Louis will review routine tag corrections.

---

## Execution Recommendation

Use subagent-driven development if available:

- Worker 1: migration + migration tests.
- Worker 2: tag helper + type/service search changes.
- Worker 3: Nic-Nac tool/prompt changes.
- Main agent: dashboard display, integration review, targeted tests, lint, browser smoke.

Keep this pass small and practical. The database gets year and tags. Nic-Nac gets enough guardrails to maintain them. Sparkle Finder remains untouched until that repo/project is active.

---

## Self-Review

- Covers collection year as a clean catalog data point.
- Covers practical tags without rarity/release intelligence.
- Keeps Louis out of routine metadata work.
- Keeps Sparkle Finder out of implementation scope.
- Adds tests for schema, normalization, Nic-Nac tool paths, prompt rules, and workspace display.
