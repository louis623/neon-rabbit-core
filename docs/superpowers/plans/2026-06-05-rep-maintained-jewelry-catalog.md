# Rep-Maintained Jewelry Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let reps add and correct shared jewelry catalog records through Nic-Nac, while Nic-Nac guards data quality and the database quietly records every catalog change.

**Architecture:** Keep the shared `jewelry_designs` catalog open to rep contribution through controlled service-role Nic-Nac tools. Add a quiet catalog change log table for traceability, add rep attribution columns to design records, and create one correction tool that can report an issue and apply safe field/photo corrections without creating a Louis-owned moderation queue.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Postgres/RLS/Storage, Vercel AI SDK tools, Vitest.

---

## Product Decision

The catalog is rep-maintained, not Louis-moderated.

Reps can add new jewelry through Nic-Nac. Nic-Nac screens for duplicate item numbers, required fields, photo quality, and obvious data issues before saving. If another rep finds bad information or a poor-quality image, they report it to Nic-Nac and work with Nic-Nac to correct it. Nic-Nac makes the correction. Louis is not the default review bottleneck.

The system must keep quiet change history behind the scenes so mistakes can be traced and repaired.

---

## Files

- Create: `supabase/migrations/<generated>_rep_maintained_jewelry_catalog.sql`
- Modify: `lib/services/types.ts`
- Modify: `lib/services/jewelry-database.ts`
- Create: `lib/services/jewelry-catalog-audit.ts`
- Create: `lib/services/jewelry-catalog-corrections.ts`
- Create: `lib/nic-nac/tools/report-jewelry-catalog-issue.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Test: `tests/jewelry-catalog-migration.test.ts`
- Test: `tests/jewelry-catalog-corrections.test.ts`
- Test: `tests/nic-nac/report-jewelry-catalog-issue.test.ts`
- Test: update existing `tests/nic-nac/add-listing-recovery.test.ts`
- Test: update existing `tests/nic-nac/tool-routing.test.ts`

---

## Task 1: Add Quiet Catalog Change History Schema

**Files:**
- Create: `supabase/migrations/<generated>_rep_maintained_jewelry_catalog.sql`
- Test: `tests/jewelry-catalog-migration.test.ts`

- [ ] **Step 1: Generate the migration file**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
supabase migration new rep_maintained_jewelry_catalog
```

Expected: Supabase creates a timestamped SQL file in `supabase/migrations`.

- [ ] **Step 2: Write the failing migration text test**

Create `tests/jewelry-catalog-migration.test.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

function readMigration() {
  const file = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('_rep_maintained_jewelry_catalog.sql'))
    .sort()
    .at(-1)

  if (!file) throw new Error('rep_maintained_jewelry_catalog migration not found')

  return fs.readFileSync(path.join(migrationsDir, file), 'utf8')
}

describe('rep-maintained jewelry catalog migration', () => {
  it('adds rep attribution columns to jewelry_designs', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_designs')
    expect(sql).toContain('created_by_rep_id UUID')
    expect(sql).toContain('last_corrected_by_rep_id UUID')
    expect(sql).toContain('last_corrected_at TIMESTAMPTZ')
  })

  it('creates a quiet jewelry catalog change log table', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS jewelry_catalog_change_log')
    expect(sql).toContain('design_id UUID NOT NULL REFERENCES jewelry_designs(id)')
    expect(sql).toContain('rep_id UUID REFERENCES reps(id)')
    expect(sql).toContain('conversation_id TEXT')
    expect(sql).toContain('change_type TEXT NOT NULL')
    expect(sql).toContain('before_state JSONB NOT NULL DEFAULT')
    expect(sql).toContain('after_state JSONB NOT NULL DEFAULT')
  })

  it('keeps catalog history quiet by enabling RLS without public read policies', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_catalog_change_log ENABLE ROW LEVEL SECURITY')
    expect(sql).not.toContain('CREATE POLICY "jewelry_catalog_change_log_public')
    expect(sql).not.toContain('CREATE POLICY "jewelry_catalog_change_log_reps_read')
  })
})
```

- [ ] **Step 3: Run the failing migration test**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-migration.test.ts
```

Expected: FAIL until the migration includes the new columns/table.

- [ ] **Step 4: Fill in the migration**

Use the generated migration file and add:

```sql
-- Rep-maintained jewelry catalog.
-- Reps contribute through Nic-Nac; Nic-Nac applies quality checks and writes
-- quiet history. This is not a manual Louis review queue.

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS created_by_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_corrected_by_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_corrected_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS jewelry_catalog_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES jewelry_designs(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  conversation_id TEXT,
  change_type TEXT NOT NULL CHECK (
    change_type IN (
      'create_design',
      'report_issue',
      'correct_design_fields',
      'replace_canonical_photo'
    )
  ),
  issue_type TEXT CHECK (
    issue_type IS NULL OR issue_type IN (
      'wrong_item_number',
      'wrong_collection',
      'wrong_design_name',
      'wrong_msrp',
      'wrong_jewelry_type',
      'wrong_material',
      'wrong_stone',
      'bad_photo',
      'duplicate',
      'other'
    )
  ),
  reason TEXT,
  before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jewelry_catalog_change_log_design
  ON jewelry_catalog_change_log(design_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jewelry_catalog_change_log_rep
  ON jewelry_catalog_change_log(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jewelry_designs_created_by_rep
  ON jewelry_designs(created_by_rep_id);

ALTER TABLE jewelry_catalog_change_log ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 5: Run the migration test**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-migration.test.ts
```

Expected: PASS.

---

## Task 2: Add Shared Catalog Audit Writer

**Files:**
- Create: `lib/services/jewelry-catalog-audit.ts`
- Modify: `lib/services/types.ts`
- Test: `tests/jewelry-catalog-corrections.test.ts`

- [ ] **Step 1: Add catalog audit types**

In `lib/services/types.ts`, add:

```ts
export type JewelryCatalogChangeType =
  | 'create_design'
  | 'report_issue'
  | 'correct_design_fields'
  | 'replace_canonical_photo'

export type JewelryCatalogIssueType =
  | 'wrong_item_number'
  | 'wrong_collection'
  | 'wrong_design_name'
  | 'wrong_msrp'
  | 'wrong_jewelry_type'
  | 'wrong_material'
  | 'wrong_stone'
  | 'bad_photo'
  | 'duplicate'
  | 'other'

export interface WriteJewelryCatalogChangeInput {
  designId: string
  repId?: string | null
  conversationId?: string | null
  changeType: JewelryCatalogChangeType
  issueType?: JewelryCatalogIssueType | null
  reason?: string | null
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
}
```

- [ ] **Step 2: Create the audit writer**

Create `lib/services/jewelry-catalog-audit.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { WriteJewelryCatalogChangeInput } from './types'

export async function writeJewelryCatalogChange(
  supabase: SupabaseClient,
  input: WriteJewelryCatalogChangeInput,
): Promise<void> {
  try {
    const { error } = await supabase.from('jewelry_catalog_change_log').insert({
      design_id: input.designId,
      rep_id: input.repId ?? null,
      conversation_id: input.conversationId ?? null,
      change_type: input.changeType,
      issue_type: input.issueType ?? null,
      reason: input.reason ?? null,
      before_state: input.beforeState,
      after_state: input.afterState,
    })

    if (error) {
      console.error('[jewelry-catalog] change log insert failed:', error)
    }
  } catch (err) {
    console.error('[jewelry-catalog] change log exception:', err)
  }
}
```

- [ ] **Step 3: Add an audit-isolation test**

In `tests/jewelry-catalog-corrections.test.ts`, start with:

```ts
import { describe, expect, it, vi } from 'vitest'
import { writeJewelryCatalogChange } from '@/lib/services/jewelry-catalog-audit'

describe('writeJewelryCatalogChange', () => {
  it('does not throw when the quiet history insert fails', async () => {
    const insert = vi.fn().mockResolvedValue({ error: new Error('audit unavailable') })
    const from = vi.fn().mockReturnValue({ insert })
    const supabase = { from } as never

    await expect(
      writeJewelryCatalogChange(supabase, {
        designId: 'design-1',
        repId: 'rep-1',
        conversationId: 'conversation-1',
        changeType: 'report_issue',
        issueType: 'bad_photo',
        reason: 'The photo is blurry.',
        beforeState: { itemNumber: 'RG100' },
        afterState: { itemNumber: 'RG100' },
      }),
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 4: Run the audit writer test**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-corrections.test.ts
```

Expected: PASS.

---

## Task 3: Attribute New Designs to the Rep Who Added Them

**Files:**
- Modify: `lib/services/types.ts`
- Modify: `lib/services/jewelry-database.ts`
- Modify: `lib/nic-nac/tools/add-listing.ts`
- Test: update `tests/nic-nac/add-listing-recovery.test.ts`

- [ ] **Step 1: Extend the create-design input**

In `lib/services/types.ts`, update `CreateDesignInput` to include:

```ts
createdByRepId?: string | null
conversationId?: string | null
```

- [ ] **Step 2: Modify `createDesign` to save rep attribution and quiet history**

In `lib/services/jewelry-database.ts`, import the audit writer:

```ts
import { writeJewelryCatalogChange } from './jewelry-catalog-audit'
```

Update the insert in `createDesign`:

```ts
.insert({
  item_number: normalizedItemNumber,
  design_name: input.designName,
  type_prefix: typePrefix,
  collection_id: collectionId,
  material: input.material ?? null,
  main_stone: input.mainStone ?? null,
  bp_msrp: input.bpMsrp ?? null,
  canonical_photo_url: input.piecePhotoUrl,
  special_features: input.specialFeatures ?? null,
  length_info: input.lengthInfo ?? null,
  created_by_rep_id: input.createdByRepId ?? null,
  ...buildPhotoPipelineUpdate(input.photoPipeline),
})
```

After the successful insert, add:

```ts
await writeJewelryCatalogChange(supabase, {
  designId: design.id as string,
  repId: input.createdByRepId ?? null,
  conversationId: input.conversationId ?? null,
  changeType: 'create_design',
  beforeState: {},
  afterState: {
    itemNumber: normalizedItemNumber,
    designName: input.designName,
    typePrefix,
    collectionId,
    collectionName,
    material: input.material ?? null,
    mainStone: input.mainStone ?? null,
    bpMsrp: input.bpMsrp ?? null,
    canonicalPhotoUrl: input.piecePhotoUrl,
  },
})
```

- [ ] **Step 3: Pass rep/conversation attribution from Nic-Nac add-listing**

In `lib/nic-nac/tools/add-listing.ts`, where `createDesign` is called, add:

```ts
createdByRepId: ctx.repId,
conversationId: ctx.conversationId,
```

- [ ] **Step 4: Update add-listing recovery tests**

In `tests/nic-nac/add-listing-recovery.test.ts`, update the create-design mock expectation so the object includes:

```ts
expect(createDesignMock).toHaveBeenCalledWith(
  expect.anything(),
  expect.objectContaining({
    createdByRepId: 'rep-1',
    conversationId: 'conversation-1',
  }),
)
```

Use the test’s actual mock rep/conversation IDs if different.

- [ ] **Step 5: Run add-listing tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/add-listing-batch.test.ts
```

Expected: PASS.

---

## Task 4: Add Safe Catalog Correction Service

**Files:**
- Create: `lib/services/jewelry-catalog-corrections.ts`
- Modify: `lib/services/types.ts`
- Test: `tests/jewelry-catalog-corrections.test.ts`

- [ ] **Step 1: Add correction types**

In `lib/services/types.ts`, add:

```ts
export interface JewelryCatalogCorrectionPatch {
  designName?: string
  collectionName?: string
  material?: string | null
  mainStone?: string | null
  bpMsrp?: number | null
  specialFeatures?: string | null
  lengthInfo?: string | null
  canonicalPhotoUrl?: string
}

export interface ReportJewelryCatalogIssueInput {
  itemNumber: string
  repId: string
  conversationId?: string | null
  issueType: JewelryCatalogIssueType
  reason: string
  correction?: JewelryCatalogCorrectionPatch
}

export interface ReportJewelryCatalogIssueResult {
  designId: string
  itemNumber: string
  changedFields: string[]
  issueLogged: boolean
  corrected: boolean
}
```

- [ ] **Step 2: Implement correction service**

Create `lib/services/jewelry-catalog-corrections.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { errors } from './errors'
import { normalizeItemNumber } from './jewelry-database'
import { writeJewelryCatalogChange } from './jewelry-catalog-audit'
import type {
  ReportJewelryCatalogIssueInput,
  ReportJewelryCatalogIssueResult,
} from './types'

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isApprovedPhotoUrl(photoUrl: string): boolean {
  try {
    const url = new URL(photoUrl)
    return url.pathname.includes('/approved/')
  } catch {
    return false
  }
}

async function findOrCreateCollectionId(
  supabase: SupabaseClient,
  rawCollectionName: string,
): Promise<string> {
  const name = rawCollectionName.trim()
  if (!name) {
    throw errors.INVALID_INPUT(
      'collectionName required',
      'I need the corrected collection name before I can update that piece.',
    )
  }

  const { data: existing, error: lookupErr } = await supabase
    .from('collections')
    .select('id')
    .eq('name', name)
    .maybeSingle()
  if (lookupErr) throw lookupErr
  if (existing?.id) return existing.id as string

  const { data: created, error: insertErr } = await supabase
    .from('collections')
    .insert({ name })
    .select('id')
    .single()
  if (insertErr) throw insertErr

  return created.id as string
}

export async function reportJewelryCatalogIssue(
  supabase: SupabaseClient,
  input: ReportJewelryCatalogIssueInput,
): Promise<ReportJewelryCatalogIssueResult> {
  if (!input.repId) throw errors.UNAUTHORIZED('repId required')
  const itemNumber = normalizeItemNumber(input.itemNumber)
  if (!itemNumber) throw errors.MISSING_ITEM_INPUT()
  if (!input.reason.trim()) {
    throw errors.INVALID_INPUT(
      'reason required',
      'Tell me what looks wrong so I can record the catalog correction clearly.',
    )
  }

  const { data: design, error: lookupErr } = await supabase
    .from('jewelry_designs')
    .select(
      'id, item_number, design_name, collection_id, material, main_stone, bp_msrp, canonical_photo_url, special_features, length_info, type_prefix',
    )
    .eq('item_number', itemNumber)
    .maybeSingle()
  if (lookupErr) throw lookupErr
  if (!design) throw errors.LISTING_NOT_FOUND(`No design for item ${itemNumber}`)

  const beforeState = {
    itemNumber: design.item_number,
    designName: design.design_name,
    collectionId: design.collection_id,
    material: design.material,
    mainStone: design.main_stone,
    bpMsrp: design.bp_msrp,
    canonicalPhotoUrl: design.canonical_photo_url,
    specialFeatures: design.special_features,
    lengthInfo: design.length_info,
    typePrefix: design.type_prefix,
  }

  await writeJewelryCatalogChange(supabase, {
    designId: design.id as string,
    repId: input.repId,
    conversationId: input.conversationId ?? null,
    changeType: 'report_issue',
    issueType: input.issueType,
    reason: input.reason,
    beforeState,
    afterState: beforeState,
  })

  const correction = input.correction
  if (!correction) {
    return {
      designId: design.id as string,
      itemNumber,
      changedFields: [],
      issueLogged: true,
      corrected: false,
    }
  }

  const patch: Record<string, unknown> = {}
  const changedFields: string[] = []

  const designName = trimOptional(correction.designName)
  if (designName && designName !== design.design_name) {
    patch.design_name = designName
    changedFields.push('designName')
  }

  const collectionName = trimOptional(correction.collectionName)
  if (collectionName) {
    const collectionId = await findOrCreateCollectionId(supabase, collectionName)
    if (collectionId !== design.collection_id) {
      patch.collection_id = collectionId
      changedFields.push('collectionName')
    }
  }

  if (correction.material !== undefined && correction.material !== design.material) {
    patch.material = correction.material
    changedFields.push('material')
  }

  if (correction.mainStone !== undefined && correction.mainStone !== design.main_stone) {
    patch.main_stone = correction.mainStone
    changedFields.push('mainStone')
  }

  if (correction.bpMsrp !== undefined && correction.bpMsrp !== design.bp_msrp) {
    patch.bp_msrp = correction.bpMsrp
    changedFields.push('bpMsrp')
  }

  if (
    correction.specialFeatures !== undefined &&
    correction.specialFeatures !== design.special_features
  ) {
    patch.special_features = correction.specialFeatures
    changedFields.push('specialFeatures')
  }

  if (correction.lengthInfo !== undefined && correction.lengthInfo !== design.length_info) {
    patch.length_info = correction.lengthInfo
    changedFields.push('lengthInfo')
  }

  if (correction.canonicalPhotoUrl !== undefined) {
    if (!isApprovedPhotoUrl(correction.canonicalPhotoUrl)) {
      throw errors.INVALID_INPUT(
        'canonical photo must be an approved pipeline asset',
        'I can only replace the catalog photo with an approved jewelry image.',
      )
    }
    if (correction.canonicalPhotoUrl !== design.canonical_photo_url) {
      patch.canonical_photo_url = correction.canonicalPhotoUrl
      changedFields.push('canonicalPhotoUrl')
    }
  }

  if (changedFields.length === 0) {
    return {
      designId: design.id as string,
      itemNumber,
      changedFields: [],
      issueLogged: true,
      corrected: false,
    }
  }

  patch.last_corrected_by_rep_id = input.repId
  patch.last_corrected_at = new Date().toISOString()
  patch.updated_at = patch.last_corrected_at

  const { data: updated, error: updateErr } = await supabase
    .from('jewelry_designs')
    .update(patch)
    .eq('id', design.id)
    .select(
      'id, item_number, design_name, collection_id, material, main_stone, bp_msrp, canonical_photo_url, special_features, length_info, type_prefix',
    )
    .single()
  if (updateErr) throw updateErr

  await writeJewelryCatalogChange(supabase, {
    designId: design.id as string,
    repId: input.repId,
    conversationId: input.conversationId ?? null,
    changeType: changedFields.includes('canonicalPhotoUrl')
      ? 'replace_canonical_photo'
      : 'correct_design_fields',
    issueType: input.issueType,
    reason: input.reason,
    beforeState,
    afterState: {
      itemNumber: updated.item_number,
      designName: updated.design_name,
      collectionId: updated.collection_id,
      material: updated.material,
      mainStone: updated.main_stone,
      bpMsrp: updated.bp_msrp,
      canonicalPhotoUrl: updated.canonical_photo_url,
      specialFeatures: updated.special_features,
      lengthInfo: updated.length_info,
      typePrefix: updated.type_prefix,
    },
  })

  return {
    designId: updated.id as string,
    itemNumber: updated.item_number as string,
    changedFields,
    issueLogged: true,
    corrected: true,
  }
}
```

- [ ] **Step 3: Add service tests**

Append tests in `tests/jewelry-catalog-corrections.test.ts` that mock Supabase and verify:

```ts
it('logs an issue without changing the design when no correction is supplied', async () => {
  // Build a Supabase mock that returns one design from jewelry_designs,
  // records jewelry_catalog_change_log inserts, and never calls update.
  // Expect result.corrected to be false and changedFields to be [].
})

it('updates safe catalog fields and records before/after history', async () => {
  // Mock jewelry_designs lookup, collections lookup, jewelry_designs update,
  // and change-log inserts. Expect design_name/material/bp_msrp patch fields,
  // last_corrected_by_rep_id, and last_corrected_at.
})

it('rejects unapproved canonical photo URLs', async () => {
  // Call reportJewelryCatalogIssue with correction.canonicalPhotoUrl set to
  // https://example.com/raw-photo.jpg. Expect INVALID_INPUT.
})
```

The test bodies should follow the existing Supabase-chain mocking style in `tests/nic-nac/add-listing-recovery.test.ts`.

- [ ] **Step 4: Run service tests**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-corrections.test.ts
```

Expected: PASS.

---

## Task 5: Add Nic-Nac Tool for Rep-Reported Catalog Issues

**Files:**
- Create: `lib/nic-nac/tools/report-jewelry-catalog-issue.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Test: `tests/nic-nac/report-jewelry-catalog-issue.test.ts`

- [ ] **Step 1: Create the tool**

Create `lib/nic-nac/tools/report-jewelry-catalog-issue.ts`:

```ts
import { z } from 'zod'
import { tool } from 'ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportJewelryCatalogIssue } from '@/lib/services/jewelry-catalog-corrections'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  itemNumber: z.string(),
  issueType: z.enum([
    'wrong_item_number',
    'wrong_collection',
    'wrong_design_name',
    'wrong_msrp',
    'wrong_jewelry_type',
    'wrong_material',
    'wrong_stone',
    'bad_photo',
    'duplicate',
    'other',
  ]),
  reason: z.string(),
  correction: z
    .object({
      designName: z.string().optional(),
      collectionName: z.string().optional(),
      material: z.string().nullable().optional(),
      mainStone: z.string().nullable().optional(),
      bpMsrp: z.number().nullable().optional(),
      specialFeatures: z.string().nullable().optional(),
      lengthInfo: z.string().nullable().optional(),
      canonicalPhotoUrl: z.string().optional(),
    })
    .optional(),
})

function explainServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    throw new NicNacToolError({
      code: err.code,
      userMessage: err.userMessage,
      cause: err,
    })
  }
  throw err
}

export const reportJewelryCatalogIssueTool: ToolDefinition = {
  name: 'report_jewelry_catalog_issue',
  readOnly: false,
  tool: (ctx) =>
    tool({
      description:
        'Report and, when the rep provides corrected information, fix inaccurate shared jewelry catalog data. Use for wrong collection, bad photo, wrong MSRP, wrong name, wrong stone/material, duplicates, or other catalog quality issues. Nic-Nac applies the correction; Louis is not the default review queue.',
      inputSchema,
      execute: async (input) => {
        const admin = createAdminClient()
        try {
          return await reportJewelryCatalogIssue(admin, {
            itemNumber: input.itemNumber,
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            issueType: input.issueType,
            reason: input.reason,
            correction: input.correction,
          })
        } catch (err) {
          explainServiceError(err)
        }
      },
    }),
}
```

- [ ] **Step 2: Register the tool**

In `lib/nic-nac/tools/index.ts`, import:

```ts
import { reportJewelryCatalogIssueTool } from './report-jewelry-catalog-issue'
```

Add it to `REGISTRY` after `searchJewelryDatabaseTool`:

```ts
reportJewelryCatalogIssueTool,
```

Add it to the `catalog` and `trade_board` packs:

```ts
catalog: ['search_jewelry_database', 'report_jewelry_catalog_issue'],
```

```ts
trade_board: [
  'list_my_trade_board',
  'remove_listing',
  'restore_listing',
  'add_listing',
  'update_listing',
  'search_jewelry_database',
  'report_jewelry_catalog_issue',
],
```

- [ ] **Step 3: Add routing patterns**

In `getToolIntentsForText`, make catalog intent trigger on quality/correction language:

```ts
if (
  hasAny([
    /\bsearch\b/,
    /\blook up\b/,
    /\bfind\b/,
    /\bcatalog\b/,
    /\bdatabase\b/,
    /\bwrong\b.*\b(item|piece|collection|photo|msrp|price|stone|material|name)\b/,
    /\b(item|piece|collection|photo|msrp|price|stone|material|name)\b.*\bwrong\b/,
    /\binaccurate\b/,
    /\bincorrect\b/,
    /\bbad photo\b/,
    /\bblurry\b/,
    /\bduplicate\b/,
  ])
) {
  add('catalog')
}
```

- [ ] **Step 4: Add tool tests**

Create `tests/nic-nac/report-jewelry-catalog-issue.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn() })),
}))

const reportJewelryCatalogIssueMock = vi.fn()

vi.mock('@/lib/services/jewelry-catalog-corrections', () => ({
  reportJewelryCatalogIssue: reportJewelryCatalogIssueMock,
}))

import { reportJewelryCatalogIssueTool } from '@/lib/nic-nac/tools/report-jewelry-catalog-issue'

describe('report_jewelry_catalog_issue tool', () => {
  it('passes authenticated rep and conversation context to the correction service', async () => {
    reportJewelryCatalogIssueMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'RG100',
      changedFields: ['collectionName'],
      issueLogged: true,
      corrected: true,
    })

    const built = reportJewelryCatalogIssueTool.tool({
      repId: 'rep-1',
      conversationId: 'conversation-1',
      runId: 'run-1',
      supabase: {} as never,
    }) as { execute: (input: unknown) => Promise<unknown> }

    const result = await built.execute({
      itemNumber: 'RG100',
      issueType: 'wrong_collection',
      reason: 'This is listed under the wrong collection.',
      correction: { collectionName: 'March 2026' },
    })

    expect(result).toMatchObject({
      designId: 'design-1',
      corrected: true,
    })
    expect(reportJewelryCatalogIssueMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        itemNumber: 'RG100',
        repId: 'rep-1',
        conversationId: 'conversation-1',
        issueType: 'wrong_collection',
        reason: 'This is listed under the wrong collection.',
        correction: { collectionName: 'March 2026' },
      }),
    )
  })
})
```

- [ ] **Step 5: Add routing test**

In `tests/nic-nac/tool-routing.test.ts`, add:

```ts
it('routes catalog correction language to the catalog tool pack', () => {
  expect(getToolIntentsForText('RG100 has the wrong collection')).toContain('catalog')
  expect(getToolIntentsForText('This item has a bad blurry photo')).toContain('catalog')
  expect(getToolIntentsForText('The MSRP is incorrect in the database')).toContain('catalog')
})
```

- [ ] **Step 6: Run tool tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/report-jewelry-catalog-issue.test.ts tests/nic-nac/tool-routing.test.ts
```

Expected: PASS.

---

## Task 6: Teach Nic-Nac the Rep-Maintained Catalog Policy

**Files:**
- Modify: `lib/nic-nac/system-prompt.ts`
- Test: add/update a prompt test, likely `tests/nic-nac-workspace-knowledge.test.ts` or `tests/nic-nac-shared-knowledge.test.ts`

- [ ] **Step 1: Update Nic-Nac’s catalog language**

In `lib/nic-nac/system-prompt.ts`, update the tool/scope section to say:

```ts
`Jewelry catalog policy:
- The shared jewelry catalog is rep-maintained through Nic-Nac, not manually reviewed by Louis by default.
- When a rep adds a new jewelry item, use add_listing recovery and require the item number, design name, collection, and an actual jewelry photo before creating the design.
- When a rep reports inaccurate catalog data or a poor-quality catalog photo, use report_jewelry_catalog_issue.
- If the rep gives enough corrected information, apply the correction through the tool. If not, ask one focused follow-up question for the missing correction detail.
- Do not promise Louis will review routine jewelry catalog issues. Louis should only be mentioned for unusual abuse, system failure, or something Nic-Nac cannot safely correct.`
```

Keep the wording near the existing trade board/catalog tool instructions so the model sees it when selecting tools.

- [ ] **Step 2: Add prompt coverage**

In the most appropriate prompt test, assert:

```ts
expect(prompt).toContain('rep-maintained through Nic-Nac')
expect(prompt).toContain('report_jewelry_catalog_issue')
expect(prompt).toContain('Do not promise Louis will review routine jewelry catalog issues')
```

- [ ] **Step 3: Run prompt tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-knowledge.test.ts tests/nic-nac-shared-knowledge.test.ts
```

Expected: PASS.

---

## Task 7: Verification And Smoke Review

**Files:**
- No feature files unless tests expose an issue.

- [ ] **Step 1: Run targeted tests**

Run:

```powershell
npm exec vitest run tests/jewelry-catalog-migration.test.ts tests/jewelry-catalog-corrections.test.ts tests/nic-nac/report-jewelry-catalog-issue.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/add-listing-batch.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-knowledge.test.ts tests/nic-nac-shared-knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npx tsc --noEmit --pretty false --incremental false
```

Expected: PASS or only known pre-existing unrelated failures. If unrelated failures remain, document exact files and messages.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Browser smoke the Nic-Nac flow**

Open:

```text
http://localhost:3001/nic-nac?conversationId=45764110-0330-4a5d-964b-5b5ff49fb662
```

Smoke prompts:

```text
RG100 has the wrong collection.
```

Expected: Nic-Nac asks for the corrected collection if missing.

Then:

```text
It should be March 2026.
```

Expected: Nic-Nac calls `report_jewelry_catalog_issue`, applies the correction if the item exists, and does not say Louis will review it.

- [ ] **Step 5: Inspect database trace**

Using the configured Supabase project, run read-only checks:

```sql
select item_number, last_corrected_by_rep_id, last_corrected_at
from jewelry_designs
where item_number = 'RG100';

select change_type, issue_type, reason, created_at
from jewelry_catalog_change_log
where design_id = (
  select id from jewelry_designs where item_number = 'RG100'
)
order by created_at desc
limit 5;
```

Expected: the design row reflects the correction and the change log has `report_issue` plus `correct_design_fields` or `replace_canonical_photo` entries.

---

## Execution Recommendation

Use subagent-driven development:

- Subagent 1: migration + migration tests.
- Subagent 2: audit/correction services + service tests.
- Subagent 3: Nic-Nac tool, registry, routing, prompt updates + tests.
- Main agent: review all diffs, run targeted tests, run typecheck/build, and browser smoke the flow.

Keep this change intentionally small. Do not add a moderation dashboard, public flag queue, owner approval flow, or Sparkle Finder browsing changes in this pass.

---

## Self-Review

- Spec coverage: covers rep-created jewelry, rep-reported issues, Nic-Nac-mediated corrections, and quiet database history.
- Scope control: does not implement the later database audit topics like richer Finder fields, advanced search, or collection normalization beyond the minimum needed for corrections.
- Risk: live Supabase verification requires project credentials/connector access. If unavailable locally, stop after local tests and document that live DB verification is pending.
