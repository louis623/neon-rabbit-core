# Live Show Trade Swap Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the live-show Trade Swap workflow so reps can approve a customer trade, capture the item number just revealed for that customer, ship the requested board piece, and either auto-add or defer the newly revealed piece back to the Trade Board.

**Architecture:** Add a first-class trade swap layer beside the existing trade request and fulfillment services. Keep the live-show approval path fast: capture item number first, require ring size only for rings, auto-create the replacement listing when the catalog already knows the item, and defer unknown catalog work to a post-show cleanup queue. Do not depend on LiveQ matching; LiveQ can remain separate because it does not know revealed item numbers.

**Tech Stack:** Next.js App Router, React dashboard/Nic-Nac workspace, Supabase Postgres/RPC/RLS, Vercel AI SDK tools, Vitest, existing Sparkle Suite trade board service layer.

---

## Product Rules To Lock In

- This is a live reveal swap, not a customer-possession trade.
- The customer never has the rejected reveal in their possession during the request.
- Both pieces are physically with the rep at approval time.
- The fast prompt wording is exactly: **"Which item number was just revealed for the customer?"**
- The rep should only need to enter the item number during the show.
- If the revealed item is a ring, the flow must capture ring size before creating the replacement listing.
- If the item number exists in the jewelry database, Sparkle Suite can create the replacement Trade Board listing immediately.
- If the item number is not in the jewelry database, Sparkle Suite must save the unresolved item number to the swap record and surface it after the show for catalog/listing completion.
- Do not make LiveQ/current-show matching part of the MVP. LiveQ does not identify item numbers.

## File Structure

**Create:**
- `lib/services/trade-swaps.ts` - service functions for approving a trade with revealed item capture, resolving replacement listing status, and listing unresolved swaps.
- `lib/nic-nac/tools/approve-trade-swap.ts` - Nic-Nac tool that approves a trade request and captures the just-revealed item number in one guarded action.
- `lib/nic-nac/tools/get-trade-swap-cleanup.ts` - read-only Nic-Nac tool for unresolved swapped-in reveal pieces after a show.
- `tests/services/trade-swaps.test.ts` - service-level tests for matched and unresolved replacement behavior.
- `tests/nic-nac/trade-swap-tools.test.ts` - Nic-Nac tool tests for prompt, approval, and cleanup behavior.
- `tests/trade-swap-migration.test.ts` - SQL migration contract tests.

**Modify:**
- `supabase/migrations/006_sparkle_suite_schema.sql` only if local base schema needs test fixture parity.
- Add a new dated migration such as `supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql`.
- `lib/services/types.ts` - add trade swap input/result types.
- `lib/services/trade-requests.ts` - keep existing `approveTrade`; add or call through a swap-aware approval helper without breaking current tests.
- `lib/services/trade-board.ts` - expose `ring_size` through public mapping consumers where needed.
- `lib/amethyst/trade-board-listings.ts` - map `listing.ring_size` to customer-facing `size`.
- `lib/nic-nac/tools/index.ts` - register the new swap tools.
- `lib/nic-nac/system-prompt.ts` - replace generic approval guidance with live-show swap guidance.
- `lib/nic-nac/prompt-builder.ts` - mirror production prompt rules if it owns routed workspace prompt text.
- `app/nic-nac/components/DashboardPlaceholder.tsx` - add the dashboard fallback approval flow with revealed item number capture.
- `app/api/nic-nac/trade-requests/route.ts` - accept swap approval payloads while preserving plain approve/reject compatibility.
- `app/api/nic-nac/trade-board/route.ts` - ensure ring size is accepted and returned consistently.
- `app/api/nic-nac/fulfillment-queue/route.ts` - include replacement listing/swapped-in status only if the UI needs it.
- Existing tests covering trade requests, fulfillment, board inventory, and Amethyst public board display.

**Do not modify:**
- Chrome extension code.
- Live Queue extension files.
- Chrome Web Store settings.
- Binder path `C:\Users\louis\sparkle-suite`.

## Data Model

Add swap metadata to preserve the real-world trade:

```sql
CREATE TABLE IF NOT EXISTS public.trade_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  outgoing_listing_id UUID NOT NULL REFERENCES public.trade_listings(id),
  revealed_item_number TEXT NOT NULL,
  revealed_ring_size TEXT,
  revealed_design_id UUID REFERENCES public.jewelry_designs(id),
  replacement_listing_id UUID REFERENCES public.trade_listings(id),
  replacement_status TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (replacement_status IN ('added_to_board', 'needs_catalog_details', 'needs_ring_size')),
  rep_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Recommended status meaning:

- `added_to_board`: item number matched catalog and replacement listing was created.
- `needs_ring_size`: item number matched a ring design but ring size was not supplied.
- `needs_catalog_details`: item number did not match the jewelry database; complete after show.

---

### Task 1: Add Trade Swap Migration

**Files:**
- Create: `supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql`
- Test: `tests/trade-swap-migration.test.ts`

- [ ] **Step 1: Write the failing migration contract test**

Create `tests/trade-swap-migration.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql',
)

describe('trade swap revealed item capture migration', () => {
  it('creates trade_swaps with replacement status and listing links', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.trade_swaps')
    expect(sql).toContain('request_id UUID UNIQUE NOT NULL REFERENCES public.trade_requests(id)')
    expect(sql).toContain('outgoing_listing_id UUID NOT NULL REFERENCES public.trade_listings(id)')
    expect(sql).toContain('revealed_item_number TEXT NOT NULL')
    expect(sql).toContain('revealed_ring_size TEXT')
    expect(sql).toContain('revealed_design_id UUID REFERENCES public.jewelry_designs(id)')
    expect(sql).toContain('replacement_listing_id UUID REFERENCES public.trade_listings(id)')
    expect(sql).toContain("replacement_status IN ('added_to_board', 'needs_catalog_details', 'needs_ring_size')")
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'")
  })

  it('adds rep-scoped RLS policies through the request listing owner', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('ALTER TABLE public.trade_swaps ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('trade_swaps_own_data')
    expect(sql).toContain('JOIN public.trade_listings tl ON tr.listing_id = tl.id')
    expect(sql).toContain('WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())')
  })
})
```

- [ ] **Step 2: Run the test and confirm failure**

Run:

```bash
npm exec vitest run tests/trade-swap-migration.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Create the migration**

Create `supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.trade_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  outgoing_listing_id UUID NOT NULL REFERENCES public.trade_listings(id),
  revealed_item_number TEXT NOT NULL,
  revealed_ring_size TEXT,
  revealed_design_id UUID REFERENCES public.jewelry_designs(id),
  replacement_listing_id UUID REFERENCES public.trade_listings(id),
  replacement_status TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (replacement_status IN ('added_to_board', 'needs_catalog_details', 'needs_ring_size')),
  rep_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trade_swaps_revealed_item_number_not_blank
    CHECK (length(btrim(revealed_item_number)) > 0),
  CONSTRAINT trade_swaps_revealed_ring_size_not_blank
    CHECK (revealed_ring_size IS NULL OR length(btrim(revealed_ring_size)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_outgoing_listing
  ON public.trade_swaps(outgoing_listing_id);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_replacement_status
  ON public.trade_swaps(replacement_status);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_revealed_item_number
  ON public.trade_swaps(revealed_item_number);

ALTER TABLE public.trade_swaps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY trade_swaps_own_data ON public.trade_swaps
    FOR ALL
    USING (
      request_id IN (
        SELECT tr.id
        FROM public.trade_requests tr
        JOIN public.trade_listings tl ON tr.listing_id = tl.id
        WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
      )
    )
    WITH CHECK (
      request_id IN (
        SELECT tr.id
        FROM public.trade_requests tr
        JOIN public.trade_listings tl ON tr.listing_id = tl.id
        WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY trade_swaps_admin_full_access ON public.trade_swaps
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.reps
        WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.reps
        WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 4: Run the migration test**

Run:

```bash
npm exec vitest run tests/trade-swap-migration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql tests/trade-swap-migration.test.ts
git commit -m "feat: add trade swap revealed item schema"
```

---

### Task 2: Add Trade Swap Service

**Files:**
- Create: `lib/services/trade-swaps.ts`
- Modify: `lib/services/types.ts`
- Test: `tests/services/trade-swaps.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `tests/services/trade-swaps.test.ts` with focused mocks:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { approveTradeWithRevealedItemCapture } from '@/lib/services/trade-swaps'

const approveTradeMock = vi.fn()
const addListingMock = vi.fn()

vi.mock('@/lib/services/trade-requests', () => ({
  approveTrade: (...args: unknown[]) => approveTradeMock(...args),
}))

vi.mock('@/lib/services/trade-board', () => ({
  addListing: (...args: unknown[]) => addListingMock(...args),
}))

function makeSupabase(design: Record<string, unknown> | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: design, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const insertSingle = vi.fn().mockResolvedValue({
    data: { id: 'swap-1', replacement_status: 'needs_catalog_details' },
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })
  const from = vi.fn((table: string) => {
    if (table === 'jewelry_designs') return { select }
    if (table === 'trade_swaps') return { insert }
    throw new Error(`unexpected table ${table}`)
  })

  return { client: { from } as never, spies: { from, eq, insert } }
}

beforeEach(() => {
  approveTradeMock.mockReset()
  addListingMock.mockReset()
})

describe('approveTradeWithRevealedItemCapture', () => {
  it('approves the trade and auto-adds the revealed piece when the item number exists', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'replacement-listing-1',
      designId: 'design-1',
      itemNumber: 'NK12345',
      designName: 'Moonlit Pendant',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    const { client, spies } = makeSupabase({
      id: 'design-1',
      item_number: 'NK12345',
      type_prefix: 'NK',
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: ' nk12345 ',
    })

    expect(approveTradeMock).toHaveBeenCalledWith(client, 'rep-1', 'request-1', undefined)
    expect(addListingMock).toHaveBeenCalledWith(client, 'rep-1', {
      itemNumber: 'NK12345',
      ringSize: undefined,
      repNotes: 'Added from approved trade swap for Jamie.',
    })
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      request_id: 'request-1',
      outgoing_listing_id: 'outgoing-listing-1',
      revealed_item_number: 'NK12345',
      revealed_design_id: 'design-1',
      replacement_listing_id: 'replacement-listing-1',
      replacement_status: 'added_to_board',
    })
    expect(result.replacementStatus).toBe('added_to_board')
  })

  it('saves a matched ring as needs_ring_size when ring size is missing', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    const { client } = makeSupabase({
      id: 'design-1',
      item_number: 'RG99999',
      type_prefix: 'RG',
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'RG99999',
    })

    expect(addListingMock).not.toHaveBeenCalled()
    expect(result.replacementStatus).toBe('needs_ring_size')
  })

  it('saves unresolved item number when catalog does not know the revealed item yet', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    const { client } = makeSupabase(null)

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'ER00001',
    })

    expect(addListingMock).not.toHaveBeenCalled()
    expect(result.replacementStatus).toBe('needs_catalog_details')
  })
})
```

- [ ] **Step 2: Run the service test and confirm failure**

Run:

```bash
npm exec vitest run tests/services/trade-swaps.test.ts
```

Expected: FAIL because `lib/services/trade-swaps.ts` does not exist.

- [ ] **Step 3: Add types**

Modify `lib/services/types.ts`:

```ts
export type TradeSwapReplacementStatus =
  | 'added_to_board'
  | 'needs_catalog_details'
  | 'needs_ring_size'

export interface ApproveTradeSwapInput {
  requestId: string
  revealedItemNumber: string
  revealedRingSize?: string
  repNotes?: string
}

export interface ApproveTradeSwapResult {
  requestId: string
  fulfillmentId: string
  outgoingListingId: string
  customerName: string
  revealedItemNumber: string
  revealedDesignId: string | null
  replacementListingId: string | null
  replacementStatus: TradeSwapReplacementStatus
}

export interface TradeSwapCleanupItem {
  swapId: string
  requestId: string
  customerName: string
  outgoingListingId: string
  revealedItemNumber: string
  revealedRingSize: string | null
  replacementStatus: TradeSwapReplacementStatus
  createdAt: string
}
```

- [ ] **Step 4: Implement the service**

Create `lib/services/trade-swaps.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { addListing } from '@/lib/services/trade-board'
import { approveTrade } from '@/lib/services/trade-requests'
import { errors } from '@/lib/services/errors'
import type {
  ApproveTradeSwapInput,
  ApproveTradeSwapResult,
  TradeSwapCleanupItem,
  TradeSwapReplacementStatus,
} from '@/lib/services/types'

function normalizeItemNumber(value: string) {
  return value.trim().toUpperCase()
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export async function approveTradeWithRevealedItemCapture(
  supabase: SupabaseClient,
  repId: string,
  input: ApproveTradeSwapInput,
): Promise<ApproveTradeSwapResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.requestId) throw errors.MISSING_ITEM_INPUT()
  const revealedItemNumber = normalizeItemNumber(input.revealedItemNumber)
  if (!revealedItemNumber) {
    throw errors.INVALID_INPUT(
      'revealedItemNumber required',
      'I need the item number that was just revealed for the customer.',
    )
  }

  const approved = await approveTrade(
    supabase,
    repId,
    input.requestId,
    input.repNotes,
  )

  const { data: design, error: designError } = await supabase
    .from('jewelry_designs')
    .select('id, item_number, type_prefix')
    .eq('item_number', revealedItemNumber)
    .maybeSingle()
  if (designError) throw designError

  let replacementStatus: TradeSwapReplacementStatus = 'needs_catalog_details'
  let revealedDesignId: string | null = null
  let replacementListingId: string | null = null
  const revealedRingSize = normalizeOptionalText(input.revealedRingSize)

  if (design) {
    revealedDesignId = design.id as string
    if (design.type_prefix === 'RG' && !revealedRingSize) {
      replacementStatus = 'needs_ring_size'
    } else {
      const replacement = await addListing(supabase, repId, {
        itemNumber: revealedItemNumber,
        ringSize: revealedRingSize,
        repNotes: `Added from approved trade swap for ${approved.customerName}.`,
      })
      replacementListingId = replacement.listingId
      replacementStatus = 'added_to_board'
    }
  }

  const { error: swapError } = await supabase.from('trade_swaps').insert({
    request_id: approved.requestId,
    outgoing_listing_id: approved.listingId,
    revealed_item_number: revealedItemNumber,
    revealed_ring_size: revealedRingSize ?? null,
    revealed_design_id: revealedDesignId,
    replacement_listing_id: replacementListingId,
    replacement_status: replacementStatus,
    rep_notes: input.repNotes ?? null,
  }).select('id, replacement_status').single()
  if (swapError) throw swapError

  return {
    requestId: approved.requestId,
    fulfillmentId: approved.fulfillmentId,
    outgoingListingId: approved.listingId,
    customerName: approved.customerName,
    revealedItemNumber,
    revealedDesignId,
    replacementListingId,
    replacementStatus,
  }
}

export async function getTradeSwapCleanupQueue(
  supabase: SupabaseClient,
  repId: string,
): Promise<TradeSwapCleanupItem[]> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const { data, error } = await supabase
    .from('trade_swaps')
    .select(`
      id, request_id, outgoing_listing_id, revealed_item_number,
      revealed_ring_size, replacement_status, created_at,
      request:trade_requests!inner(
        customer_name,
        listing:trade_listings!inner(rep_id)
      )
    `)
    .in('replacement_status', ['needs_catalog_details', 'needs_ring_size'])
    .order('created_at', { ascending: true })
  if (error) throw error

  type RawRow = {
    id: string
    request_id: string
    outgoing_listing_id: string
    revealed_item_number: string
    revealed_ring_size: string | null
    replacement_status: TradeSwapReplacementStatus
    created_at: string
    request: {
      customer_name: string
      listing: { rep_id: string } | { rep_id: string }[] | null
    } | Array<{
      customer_name: string
      listing: { rep_id: string } | { rep_id: string }[] | null
    }> | null
  }

  return ((data ?? []) as unknown as RawRow[])
    .map((row) => {
      const request = Array.isArray(row.request) ? row.request[0] : row.request
      const listing = Array.isArray(request?.listing)
        ? request?.listing[0]
        : request?.listing
      if (!request || !listing || listing.rep_id !== repId) return null
      return {
        swapId: row.id,
        requestId: row.request_id,
        customerName: request.customer_name,
        outgoingListingId: row.outgoing_listing_id,
        revealedItemNumber: row.revealed_item_number,
        revealedRingSize: row.revealed_ring_size,
        replacementStatus: row.replacement_status,
        createdAt: row.created_at,
      }
    })
    .filter((item): item is TradeSwapCleanupItem => item !== null)
}
```

- [ ] **Step 5: Run the service test**

Run:

```bash
npm exec vitest run tests/services/trade-swaps.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/services/types.ts lib/services/trade-swaps.ts tests/services/trade-swaps.test.ts
git commit -m "feat: capture revealed item on trade approval"
```

---

### Task 3: Add Nic-Nac Trade Swap Tools And Prompt Contract

**Files:**
- Create: `lib/nic-nac/tools/approve-trade-swap.ts`
- Create: `lib/nic-nac/tools/get-trade-swap-cleanup.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Test: `tests/nic-nac/trade-swap-tools.test.ts`
- Test: `tests/nic-nac/system-prompt-add-listing.test.ts`
- Test: `tests/nic-nac/prompt-routing.test.ts`

- [ ] **Step 1: Write failing tool and prompt tests**

Create `tests/nic-nac/trade-swap-tools.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const approveTradeWithRevealedItemCaptureMock = vi.fn()
const getTradeSwapCleanupQueueMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()

vi.mock('@/lib/services/trade-swaps', () => ({
  approveTradeWithRevealedItemCapture: (...args: unknown[]) =>
    approveTradeWithRevealedItemCaptureMock(...args),
  getTradeSwapCleanupQueue: (...args: unknown[]) =>
    getTradeSwapCleanupQueueMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ admin: true }),
}))

vi.mock('@/lib/nic-nac/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

import { makeApproveTradeSwapTool } from '@/lib/nic-nac/tools/approve-trade-swap'
import { makeGetTradeSwapCleanupTool } from '@/lib/nic-nac/tools/get-trade-swap-cleanup'

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

beforeEach(() => {
  approveTradeWithRevealedItemCaptureMock.mockReset()
  getTradeSwapCleanupQueueMock.mockReset()
  writeTradeActionAuditMock.mockReset()
})

describe('approve_trade_swap', () => {
  it('requires approval and captures the just-revealed item number', async () => {
    approveTradeWithRevealedItemCaptureMock.mockResolvedValueOnce({
      requestId: 'req-1',
      fulfillmentId: 'ful-1',
      outgoingListingId: 'listing-1',
      customerName: 'Jamie',
      revealedItemNumber: 'RG12345',
      revealedDesignId: 'design-1',
      replacementListingId: 'listing-2',
      replacementStatus: 'added_to_board',
    })

    const tool = makeApproveTradeSwapTool(makeCtx()) as unknown as {
      needsApproval?: boolean
      execute: (input: unknown) => Promise<Record<string, unknown>>
    }

    expect(tool.needsApproval).toBe(true)
    const result = await tool.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      revealedItemNumber: 'rg12345',
      revealedRingSize: '8',
    })

    expect(approveTradeWithRevealedItemCaptureMock).toHaveBeenCalledWith(
      { admin: true },
      'rep-1',
      {
        requestId: '11111111-1111-4111-8111-111111111111',
        revealedItemNumber: 'rg12345',
        revealedRingSize: '8',
        repNotes: undefined,
      },
    )
    expect(result).toMatchObject({
      customerName: 'Jamie',
      revealedItemNumber: 'RG12345',
      replacementStatus: 'added_to_board',
    })
  })
})

describe('get_trade_swap_cleanup', () => {
  it('returns unresolved swapped-in reveal pieces for post-show cleanup', async () => {
    getTradeSwapCleanupQueueMock.mockResolvedValueOnce([
      {
        swapId: 'swap-1',
        requestId: 'req-1',
        customerName: 'Jamie',
        outgoingListingId: 'listing-1',
        revealedItemNumber: 'ER00001',
        revealedRingSize: null,
        replacementStatus: 'needs_catalog_details',
        createdAt: '2026-06-11T20:00:00.000Z',
      },
    ])

    const tool = makeGetTradeSwapCleanupTool(makeCtx()) as unknown as {
      execute: (input: unknown) => Promise<Record<string, unknown>>
    }
    const result = await tool.execute({})

    expect(result).toEqual({
      count: 1,
      cleanup: [
        expect.objectContaining({
          customerName: 'Jamie',
          revealedItemNumber: 'ER00001',
          replacementStatus: 'needs_catalog_details',
        }),
      ],
    })
  })
})
```

Add prompt assertions to `tests/nic-nac/system-prompt-add-listing.test.ts` and `tests/nic-nac/prompt-routing.test.ts`:

```ts
expect(prompt).toContain('Which item number was just revealed for the customer?')
expect(prompt).toContain('Do not depend on LiveQ to identify the revealed item number')
expect(prompt).toContain('If the revealed item number is already in the jewelry database, add the replacement listing immediately')
expect(prompt).toContain('If the revealed item number is not in the jewelry database, save it to the swap cleanup queue for after the show')
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm exec vitest run tests/nic-nac/trade-swap-tools.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/prompt-routing.test.ts
```

Expected: FAIL because tools and prompt text do not exist.

- [ ] **Step 3: Implement `approve_trade_swap` tool**

Create `lib/nic-nac/tools/approve-trade-swap.ts`:

```ts
import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { approveTradeWithRevealedItemCapture } from '@/lib/services/trade-swaps'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  requestId: z.string().uuid(),
  revealedItemNumber: z.string().trim().min(1),
  revealedRingSize: z.string().trim().min(1).optional(),
  repNotes: z.string().optional(),
})

export function makeApproveTradeSwapTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Approve a trade request and capture the item number just revealed for the customer. ' +
      'Prompt wording before this tool should be exactly: "Which item number was just revealed for the customer?" ' +
      'Requires explicit rep approval. If the revealed item exists in the jewelry database, the service adds it back to the Trade Board. If it is unknown, the service saves it for post-show cleanup.',
    inputSchema,
    needsApproval: true,
    execute: async ({ requestId, revealedItemNumber, revealedRingSize, repNotes }) => {
      const admin = createAdminClient()
      const result = await approveTradeWithRevealedItemCapture(admin, ctx.repId, {
        requestId,
        revealedItemNumber,
        revealedRingSize,
        repNotes,
      })

      await writeTradeActionAudit({
        actionType: 'trade_swap_approved',
        repId: ctx.repId,
        targetListingId: result.outgoingListingId,
        beforeState: {
          requestId,
          requestStatus: 'pending',
          outgoingListingId: result.outgoingListingId,
        },
        afterState: {
          requestId: result.requestId,
          requestStatus: 'approved',
          fulfillmentId: result.fulfillmentId,
          outgoingListingId: result.outgoingListingId,
          revealedItemNumber: result.revealedItemNumber,
          replacementListingId: result.replacementListingId,
          replacementStatus: result.replacementStatus,
        },
        details: { runId: ctx.runId, conversationId: ctx.conversationId },
      })

      return result
    },
  })
}

export const approveTradeSwapTool: ToolDefinition = {
  name: 'approve_trade_swap',
  readOnly: false,
  build: (ctx) =>
    makeApproveTradeSwapTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
```

- [ ] **Step 4: Implement cleanup tool**

Create `lib/nic-nac/tools/get-trade-swap-cleanup.ts`:

```ts
import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getTradeSwapCleanupQueue } from '@/lib/services/trade-swaps'
import type { ToolDefinition } from './types'

const inputSchema = z.object({})

export function makeGetTradeSwapCleanupTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      'List approved trade swaps where the item number just revealed for the customer still needs to be added to the Trade Board after the show.',
    inputSchema,
    execute: async () => {
      const rows = await getTradeSwapCleanupQueue(ctx.supabase, ctx.repId)
      return {
        count: rows.length,
        cleanup: rows,
      }
    },
  })
}

export const getTradeSwapCleanupTool: ToolDefinition = {
  name: 'get_trade_swap_cleanup',
  readOnly: true,
  build: (ctx) =>
    makeGetTradeSwapCleanupTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
```

- [ ] **Step 5: Register tools**

Modify `lib/nic-nac/tools/index.ts` so `buildAllTools` includes:

```ts
import { approveTradeSwapTool } from './approve-trade-swap'
import { getTradeSwapCleanupTool } from './get-trade-swap-cleanup'
```

Add both tools to the trade-board tool group beside `approve_trade`, `reject_trade`, and fulfillment tools:

```ts
approveTradeSwapTool,
getTradeSwapCleanupTool,
```

- [ ] **Step 6: Update prompt guidance**

In both `lib/nic-nac/system-prompt.ts` and the routed prompt source in `lib/nic-nac/prompt-builder.ts`, add:

```text
Live-show trade swap rule: A TradeBoard request is a reveal swap. The customer does not have the rejected reveal in hand; the rep has both pieces. When approving a request during a show, ask exactly: "Which item number was just revealed for the customer?" Do not depend on LiveQ to identify the revealed item number; LiveQ only helps with queue order/revealed status and does not know jewelry item numbers. If the revealed item number is already in the jewelry database, add the replacement listing immediately. If the revealed item number is a ring, collect ring size before adding. If the revealed item number is not in the jewelry database, save it to the swap cleanup queue for after the show and do not force photo/catalog intake during the live show.
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm exec vitest run tests/nic-nac/trade-swap-tools.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/prompt-routing.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/nic-nac/tools/approve-trade-swap.ts lib/nic-nac/tools/get-trade-swap-cleanup.ts lib/nic-nac/tools/index.ts lib/nic-nac/system-prompt.ts lib/nic-nac/prompt-builder.ts tests/nic-nac/trade-swap-tools.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/prompt-routing.test.ts
git commit -m "feat: add Nic-Nac live trade swap tools"
```

---

### Task 4: Add Dashboard Fallback Swap Approval Flow

**Files:**
- Modify: `app/api/nic-nac/trade-requests/route.ts`
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: `tests/nic-nac-trade-requests-route.test.ts`
- Test: `tests/nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Add failing route test**

In `tests/nic-nac-trade-requests-route.test.ts`, add:

```ts
it('approves a trade swap when revealedItemNumber is supplied', async () => {
  approveTradeWithRevealedItemCaptureMock.mockResolvedValueOnce({
    requestId: 'req-1',
    fulfillmentId: 'ful-1',
    outgoingListingId: 'listing-1',
    customerName: 'Jamie',
    revealedItemNumber: 'RG12345',
    revealedDesignId: 'design-1',
    replacementListingId: 'replacement-listing-1',
    replacementStatus: 'added_to_board',
  })

  const response = await POST(
    new Request('http://localhost/api/nic-nac/trade-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        requestId: 'req-1',
        revealedItemNumber: 'RG12345',
        revealedRingSize: '8',
      }),
    }),
  )

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
    result: {
      revealedItemNumber: 'RG12345',
      replacementStatus: 'added_to_board',
    },
  })
})
```

Use the existing route test mock style. Import/mock `approveTradeWithRevealedItemCapture` from `@/lib/services/trade-swaps`.

- [ ] **Step 2: Add failing UI source tests**

In `tests/nic-nac-dashboard-placeholder.test.ts`, add source assertions:

```ts
expect(source).toContain('Which item number was just revealed for the customer?')
expect(source).toContain('revealedItemNumber')
expect(source).toContain('revealedRingSize')
expect(source).toContain('I saved the item number to this swap')
expect(source).toContain('Added the revealed piece back to your board')
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
npm exec vitest run tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Update route**

Modify `app/api/nic-nac/trade-requests/route.ts`:

```ts
import { approveTradeWithRevealedItemCapture } from '@/lib/services/trade-swaps'
```

Inside `action === 'approve'`, branch when `revealedItemNumber` is present:

```ts
if (action === 'approve') {
  const revealedItemNumber =
    typeof body?.revealedItemNumber === 'string'
      ? body.revealedItemNumber.trim()
      : ''
  if (revealedItemNumber) {
    const result = await approveTradeWithRevealedItemCapture(supabase, repId, {
      requestId,
      revealedItemNumber,
      revealedRingSize:
        typeof body?.revealedRingSize === 'string'
          ? body.revealedRingSize
          : undefined,
      repNotes,
    })
    return NextResponse.json({ ok: true, result })
  }

  const result = await approveTrade(supabase, repId, requestId, repNotes)
  return NextResponse.json({ ok: true, result })
}
```

- [ ] **Step 5: Add dashboard modal state**

In `DashboardPlaceholder.tsx`, add state:

```ts
const [swapApprovalDraft, setSwapApprovalDraft] = useState<{
  requestId: string
  customerName: string
} | null>(null)
const [revealedItemNumber, setRevealedItemNumber] = useState('')
const [revealedRingSize, setRevealedRingSize] = useState('')
```

Change the Approve button to open the draft instead of immediate approval:

```tsx
onClick={() => {
  setSwapApprovalDraft({
    requestId: request.id,
    customerName: request.customerName,
  })
  setRevealedItemNumber('')
  setRevealedRingSize('')
}}
```

Add a compact modal near the existing Trade Board render:

```tsx
{swapApprovalDraft ? (
  <div className={styles.modalBackdrop}>
    <div className={styles.modalPanel}>
      <div className={styles.walletSettingsTitle}>Approve trade</div>
      <label className={styles.formLabel}>
        Which item number was just revealed for the customer?
        <input
          className={styles.formInput}
          value={revealedItemNumber}
          onChange={(event) => setRevealedItemNumber(event.target.value.toUpperCase())}
          placeholder="RG12345"
        />
      </label>
      {revealedItemNumber.trim().toUpperCase().startsWith('RG') ? (
        <label className={styles.formLabel}>
          Ring size
          <input
            className={styles.formInput}
            value={revealedRingSize}
            onChange={(event) => setRevealedRingSize(event.target.value)}
            placeholder="8"
          />
        </label>
      ) : null}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.helperButton}
          onClick={() => setSwapApprovalDraft(null)}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!revealedItemNumber.trim()}
          onClick={() =>
            handleTradeRequestDecision(swapApprovalDraft.requestId, 'approve', {
              revealedItemNumber,
              revealedRingSize,
            })
          }
        >
          Approve trade
        </button>
      </div>
    </div>
  </div>
) : null}
```

If existing CSS lacks these classes, use existing modal/form classes already present in this file rather than inventing a new visual system.

- [ ] **Step 6: Update decision handler**

Change handler signature:

```ts
async function handleTradeRequestDecision(
  requestId: string,
  action: 'approve' | 'reject',
  swap?: { revealedItemNumber?: string; revealedRingSize?: string },
)
```

Add payload fields:

```ts
body: JSON.stringify({
  action,
  requestId,
  ...(action === 'reject' ? { reason: 'not_interested' } : {}),
  ...(swap?.revealedItemNumber
    ? {
        revealedItemNumber: swap.revealedItemNumber,
        revealedRingSize: swap.revealedRingSize,
      }
    : {}),
}),
```

After success, use returned replacement status:

```ts
const payload = (await response.json().catch(() => null)) as
  | {
      error?: string
      result?: {
        replacementStatus?: string
      }
    }
  | null
```

Helper messages:

```ts
const replacementStatus = payload?.result?.replacementStatus
const approveMessage =
  replacementStatus === 'added_to_board'
    ? 'Trade approved. Added the revealed piece back to your board.'
    : replacementStatus === 'needs_ring_size'
      ? 'Trade approved. I saved the item number to this swap; add the ring size after the show to put it on the board.'
      : replacementStatus === 'needs_catalog_details'
        ? 'Trade approved. I saved the item number to this swap; finish the catalog details after the show.'
        : 'Trade request approved.'
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm exec vitest run tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/api/nic-nac/trade-requests/route.ts app/nic-nac/components/DashboardPlaceholder.tsx tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "feat: add dashboard trade swap approval flow"
```

---

### Task 5: Show Ring Size On Customer Trade Board

**Files:**
- Modify: `lib/amethyst/trade-board-listings.ts`
- Test: `tests/amethyst-trade-board-route.test.ts`
- Test: `tests/amethyst-trade-template.test.ts`

- [ ] **Step 1: Write failing mapping test**

In `tests/amethyst-trade-board-route.test.ts` or `tests/amethyst-trade-template.test.ts`, add:

```ts
it('maps trade listing ring size to the customer-facing board size', () => {
  const listing = makeTradeListing({
    id: 'listing-1',
    ring_size: '8',
    design: {
      type_prefix: 'RG',
      design_name: 'Moon Ring',
      item_number: 'RG12345',
      collection: { id: 'collection-1', name: 'Birthday' },
    },
  })

  expect(mapTradeListingToAmethystTradeBoardListing(listing).size).toBe('8')
})
```

Use the local test helper style already present in the target test file. If there is no helper, create a minimal object matching `TradeListingWithDesign`.

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
npm exec vitest run tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-template.test.ts
```

Expected: FAIL because `size` is currently always `null`.

- [ ] **Step 3: Implement mapping**

Modify `lib/amethyst/trade-board-listings.ts`:

```ts
size: listing.ring_size?.trim() || null,
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-template.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/amethyst/trade-board-listings.ts tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-template.test.ts
git commit -m "fix: show ring size on customer trade board"
```

---

### Task 6: Add Post-Show Swap Cleanup Surface

**Files:**
- Modify: `app/api/nic-nac/fulfillment-queue/route.ts` only if combining queue payloads.
- Prefer create: `app/api/nic-nac/trade-swap-cleanup/route.ts`
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: `tests/nic-nac-trade-swap-cleanup-route.test.ts`
- Test: `tests/nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Write failing route test**

Create `tests/nic-nac-trade-swap-cleanup-route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPaidNicNacContextMock = vi.fn()
const getTradeSwapCleanupQueueMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  getPaidNicNacContext: () => getPaidNicNacContextMock(),
  AuthError: class AuthError extends Error {},
}))

vi.mock('@/lib/services/trade-swaps', () => ({
  getTradeSwapCleanupQueue: (...args: unknown[]) =>
    getTradeSwapCleanupQueueMock(...args),
}))

import { GET } from '@/app/api/nic-nac/trade-swap-cleanup/route'

beforeEach(() => {
  getPaidNicNacContextMock.mockReset()
  getTradeSwapCleanupQueueMock.mockReset()
})

describe('GET /api/nic-nac/trade-swap-cleanup', () => {
  it('returns unresolved trade swap replacement items', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      supabase: { auth: true },
    })
    getTradeSwapCleanupQueueMock.mockResolvedValueOnce([
      {
        swapId: 'swap-1',
        requestId: 'req-1',
        customerName: 'Jamie',
        outgoingListingId: 'listing-1',
        revealedItemNumber: 'ER00001',
        revealedRingSize: null,
        replacementStatus: 'needs_catalog_details',
        createdAt: '2026-06-11T20:00:00.000Z',
      },
    ])

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        customerName: 'Jamie',
        revealedItemNumber: 'ER00001',
      }),
    ])
  })
})
```

- [ ] **Step 2: Create route**

Create `app/api/nic-nac/trade-swap-cleanup/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { getTradeSwapCleanupQueue } from '@/lib/services/trade-swaps'
import { ServiceError } from '@/lib/services/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId, supabase } = await getPaidNicNacContext()
    const queue = await getTradeSwapCleanupQueue(supabase, repId)
    return NextResponse.json(queue)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }
    throw error
  }
}
```

- [ ] **Step 3: Add dashboard cleanup panel**

In `DashboardPlaceholder.tsx`, add fetch state for `tradeSwapCleanupState`, load `/api/nic-nac/trade-swap-cleanup` beside trade requests/fulfillment/history, and render a small panel:

```tsx
<div className={styles.workspacePanel}>
  <div className={styles.calendarHeader}>
    <div className={styles.walletSettingsTitle}>Swap cleanup</div>
    <span className={styles.rosterTag}>
      {tradeSwapCleanupState.status === 'ready'
        ? `${tradeSwapCleanupState.items.length} to finish`
        : 'Loading'}
    </span>
  </div>
  {tradeSwapCleanupState.status === 'ready' ? (
    <div className={styles.tradeList}>
      {tradeSwapCleanupState.items.length > 0 ? (
        tradeSwapCleanupState.items.map((item) => (
          <div key={item.swapId} className={styles.tradeRow}>
            <div className={styles.tradeIdentity}>
              <div className={styles.customerName}>{item.customerName}</div>
              <div className={styles.customerDate}>
                Revealed item number: {item.revealedItemNumber}
              </div>
              <div className={styles.helperNote}>
                {item.replacementStatus === 'needs_ring_size'
                  ? 'Add ring size to put this reveal back on the board.'
                  : 'Finish catalog details after the show to put this reveal back on the board.'}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>No trade swaps need cleanup right now.</div>
      )}
    </div>
  ) : (
    <div className={styles.cardFill}>
      <div className={styles.loadingLine} />
      <div className={styles.loadingLineShort} />
    </div>
  )}
</div>
```

- [ ] **Step 4: Add source assertions**

In `tests/nic-nac-dashboard-placeholder.test.ts`:

```ts
expect(source).toContain('Swap cleanup')
expect(source).toContain('/api/nic-nac/trade-swap-cleanup')
expect(source).toContain('No trade swaps need cleanup right now.')
expect(source).toContain('Revealed item number:')
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/nic-nac-trade-swap-cleanup-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/nic-nac/trade-swap-cleanup/route.ts app/nic-nac/components/DashboardPlaceholder.tsx tests/nic-nac-trade-swap-cleanup-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "feat: surface trade swap cleanup queue"
```

---

### Task 7: Update Public And Workspace Trade Language

**Files:**
- Modify: `lib/nic-nac/knowledge/tradeboard.ts`
- Modify: `lib/sparkle-suite/public-nic-nac-knowledge.ts`
- Modify: `lib/sparkle-suite/public-nic-nac-guardrails.ts`
- Modify: `lib/amethyst/trade-template-data.ts`
- Modify: `public/amethyst/trade.jsx`
- Test: `tests/sparkle-suite-public-nic-nac-contract.test.ts`
- Test: `tests/amethyst-trade-template.test.ts`

- [ ] **Step 1: Write failing language tests**

Add assertions:

```ts
expect(publicKnowledge).toContain('piece they just revealed')
expect(publicKnowledge).toContain('customers do not ship or photograph a separate trade item')
expect(publicKnowledge).not.toContain('piece they revealed or want to offer')
```

Add Amethyst copy assertions:

```ts
expect(defaultAmethystTradeTemplateData.faqAnswers.howTradeWorks).toContain('just revealed')
expect(defaultAmethystTradeTemplateData.faqAnswers.howTradeWorks).not.toContain('offered piece')
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/amethyst-trade-template.test.ts
```

Expected: FAIL until language is corrected.

- [ ] **Step 3: Replace risky wording**

Use this approved language:

```text
Customers request a rep-listed Trade Board piece when they do not want the item number just revealed for them. The customer does not create a listing, ship a separate item, or photograph anything for the Trade Board. The rep has both pieces during the live show and makes the final approval decision.
```

Replace instances of:

```text
piece they revealed or want to offer
```

with:

```text
piece just revealed for them
```

Replace “offered piece” in customer-facing trade contexts with “just-revealed piece” or “revealed item number.”

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/amethyst-trade-template.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/nic-nac/knowledge/tradeboard.ts lib/sparkle-suite/public-nic-nac-knowledge.ts lib/sparkle-suite/public-nic-nac-guardrails.ts lib/amethyst/trade-template-data.ts public/amethyst/trade.jsx tests/sparkle-suite-public-nic-nac-contract.test.ts tests/amethyst-trade-template.test.ts
git commit -m "fix: clarify Trade Board as live reveal swap flow"
```

---

### Task 8: Focused Integration Verification

**Files:**
- No source changes unless failures reveal a bug.

- [ ] **Step 1: Run focused trade suite**

Run:

```bash
npm exec vitest run tests/trade-swap-migration.test.ts tests/services/trade-swaps.test.ts tests/nic-nac/trade-swap-tools.test.ts tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-trade-swap-cleanup-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac/trade-fulfillment.test.ts tests/nic-nac-fulfillment-queue-route.test.ts tests/amethyst-trade-board-route.test.ts tests/amethyst-trade-template.test.ts tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual local browser QA**

Start the local app only after Louis approves execution:

```bash
npm run dev
```

Verify:

```text
1. Rep workspace request inbox shows pending request.
2. Approve opens the prompt: "Which item number was just revealed for the customer?"
3. Non-ring known item number approves trade and creates replacement board listing.
4. Ring known item number shows ring-size field before final approval.
5. Unknown item number approves trade and lands in Swap cleanup.
6. Customer Trade Board shows ring sizes on RG listings.
7. Nic-Nac can answer "what swaps need cleanup after the show?"
```

- [ ] **Step 4: Chrome reviewer-smoke on preview**

After deploy, use the `sparkle-suite-demo-smoke` workflow and Chrome reviewer-smoke. Do not use Louis's personal Chrome profile. Verify:

```text
1. Stable demo /start reviewer controls open workspace preview.
2. Seeded pending request can be approved through the swap modal.
3. Fulfillment queue still advances approved -> shipped -> completed.
4. Swap cleanup panel appears and handles empty/unresolved state.
5. Console shows no framework errors or warnings.
```

- [ ] **Step 5: Commit verification-only fixes if needed**

If verification exposes a code issue, fix it in the smallest scoped patch and commit:

```bash
git add <changed-files>
git commit -m "fix: stabilize trade swap workflow"
```

---

## Sub-Agent Strategy

Recommended because this is the core Sparkle Suite workflow:

- **Subagent A: Data and Service Layer** - Tasks 1-2.
- **Subagent B: Nic-Nac Tools and Prompt** - Task 3.
- **Subagent C: Dashboard Fallback UI** - Tasks 4 and 6.
- **Subagent D: Public/Customer Language and Ring Size Display** - Tasks 5 and 7.
- **Main session:** Task 8, review integration, run final verification, deploy only with Louis approval.

Do not run agents against the binder. All implementation work happens in `C:\Users\louis\sparkle-suite-repo`.

## Rollout Notes

- This migration must be applied to Supabase before any deployed preview with swap code is promoted.
- If Supabase CLI linking is still blocked, use manual Dashboard SQL only as the established launch-blocking recovery path: idempotent SQL, direct verification, and `NOTIFY pgrst, 'reload schema'`.
- Do not promote `https://sparkle-suite-demo.vercel.app` until Chrome reviewer-smoke passes the live-show swap path.
- The old guided jewelry intake plan remains useful for post-show cleanup, but this plan supersedes it as the primary Trade Board workflow.

## Self-Review

**Spec coverage:** This plan covers the corrected live-show reveal swap model, exact prompt wording, no-LiveQ dependency, known-item auto-add, ring-size requirement, unknown-item cleanup queue, dashboard fallback flow, public wording cleanup, customer ring-size display, tests, build, and reviewer-smoke.

**Placeholder scan:** No task depends on unspecified future behavior. Unknown catalog work is explicitly deferred into `needs_catalog_details` with a cleanup queue.

**Type consistency:** The plan consistently uses `revealedItemNumber`, `revealedRingSize`, `replacementStatus`, `replacementListingId`, `approve_trade_swap`, and `get_trade_swap_cleanup`.

**Risk callout:** The service implementation approves the outgoing trade before creating the swap record. If the swap insert fails after approval, the trade is still approved. If this is unacceptable, implement the approve+swap operation as a single Postgres RPC in Task 2 instead of service-level orchestration.
