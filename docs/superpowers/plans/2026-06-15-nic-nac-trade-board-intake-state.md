# Nic-Nac Trade Board Intake State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase B of the approved Nic-Nac agent architecture: persistent Trade Board add-listing workflow state, explicit photo roles, controller-owned readiness, workflow-aware tool availability, and deterministic/replay verification for ER13229-style failures.

**Architecture:** Keep Nic-Nac conversational while moving workflow truth into application code. Add persistent `trade_board_intake_sessions` and `trade_board_intake_photos`, pure controller functions for state transitions and missing-field computation, route integration that keeps Trade Board tools active for active workflows, and prompt state that tells the model the current workflow contract. The model may talk, extract, and call active tools; it must not override photo roles or claim mutation success without tool results.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vercel AI SDK, Anthropic provider, Supabase/Postgres, Vitest, existing reviewer-smoke/synthetic session tooling.

---

## Preflight Notes

- Work in `C:\Users\louis\sparkle-suite-repo`, not the binder.
- Current branch expected: `codex/sparkle-cross-phase-hardening`.
- Current working tree may already contain Louis-approved in-progress Nic-Nac regression work in:
  - `lib/nic-nac/prompt-builder.ts`
  - `lib/nic-nac/system-prompt.ts`
  - `lib/nic-nac/tools/index.ts`
  - `tests/nic-nac/prompt-routing.test.ts`
  - `tests/nic-nac/system-prompt-add-listing.test.ts`
  - `tests/nic-nac/tool-routing.test.ts`
- Do not revert that work.
- Do not touch `chrome-extension/` or live queue extension files.
- Do not deploy, commit, or push unless Louis explicitly approves execution and closeout.
- Approved spec: `docs/superpowers/specs/2026-06-15-nic-nac-agent-architecture-spec-v2.md`.
- Project skill: `C:\Users\louis\sparkle-suite\.agents\skills\sparkle-nic-nac-agent-architecture\SKILL.md`.

## File Structure

Create:

- `supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql`
  - Adds workflow session/photo tables and optional telemetry columns.
- `lib/nic-nac/workflows/trade-board-intake-types.ts`
  - Shared TypeScript unions and interfaces.
- `lib/nic-nac/workflows/trade-board-intake-controller.ts`
  - Pure state machine, missing-field, photo-role, hard-fail, and next-action logic.
- `lib/nic-nac/workflows/trade-board-intake-store.ts`
  - Supabase read/write helpers for sessions/photos.
- `lib/nic-nac/workflows/trade-board-intake-context.ts`
  - Route-facing orchestration: detect active workflow, seed from messages, ingest latest turn, build prompt state, choose tool policy source.
- `lib/nic-nac/workflows/trade-board-intake-prompt.ts`
  - Compact model-facing workflow state renderer.
- `lib/nic-nac/workflows/trade-board-intake-eval.ts`
  - Hard-fail phrase detector and transcript grading helpers.
- `tests/nic-nac/trade-board-intake-controller.test.ts`
  - Pure state machine/photo-role tests.
- `tests/nic-nac/trade-board-intake-store.test.ts`
  - Store query payload tests with mocked Supabase.
- `tests/nic-nac/trade-board-intake-route-context.test.ts`
  - Active workflow detection/tool policy prompt-state tests.
- `tests/nic-nac/trade-board-intake-eval.test.ts`
  - Hard-fail phrase and grading helper tests.
- `scripts/smoke-nic-nac-trade-board-intake.ts`
  - Capped replay harness skeleton for real fixture/model/browser execution.
- `tests/nic-nac-trade-board-intake-smoke-script.test.ts`
  - Script configuration and hard-fail detector tests.

Modify:

- `app/api/nic-nac/route.ts`
  - Load/ingest workflow state before tool routing; include workflow prompt state; log workflow telemetry.
- `lib/nic-nac/tools/index.ts`
  - Add workflow-aware tool routing helpers without deleting the existing text router.
- `lib/nic-nac/tools/types.ts`
  - Add optional active workflow state to server-owned tool context.
- `lib/nic-nac/prompt-builder.ts`
  - Accept optional workflow prompt state and append it before intent prompt sections.
- `lib/nic-nac/run-telemetry.ts`
  - Accept workflow metadata for `nic_nac_runs`.
- `lib/nic-nac/tools/add-listing.ts`
  - Add a workflow authorization/readiness guard using server-owned active workflow state.
- `package.json`
  - Add `smoke:nic-nac-trade-board-intake`.

## Task 1: Add Workflow Schema

**Files:**
- Create: `supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql`
- Test: `tests/nic-nac-trade-board-intake-migration.test.ts`

- [ ] **Step 1: Write the migration structure test**

Create `tests/nic-nac-trade-board-intake-migration.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql'),
  'utf8',
)

describe('Nic-Nac Trade Board intake workflow migration', () => {
  it('creates workflow session and photo tables', () => {
    expect(migration).toContain('create table if not exists public.trade_board_intake_sessions')
    expect(migration).toContain('create table if not exists public.trade_board_intake_photos')
    expect(migration).toContain('workflow_type text not null')
    expect(migration).toContain("check (workflow_type = 'trade_board_add_listing')")
    expect(migration).toContain("declared_role text not null")
    expect(migration).toContain("visual_role text not null")
  })

  it('enforces photo-role and workflow-state constraints', () => {
    expect(migration).toContain("check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review'))")
    expect(migration).toContain("check (current_phase in ('started', 'details_capture', 'photo_capture', 'catalog_match', 'ready_to_add', 'adding', 'completed', 'cancelled', 'needs_human_review'))")
    expect(migration).toContain("check (declared_role in ('label_details', 'jewelry_front', 'unknown', 'other'))")
    expect(migration).toContain("check (visual_role in ('jewelry', 'label_or_packaging', 'uncertain'))")
    expect(migration).toContain("check (quality in ('usable', 'warning', 'blocked', 'unknown'))")
  })

  it('adds observability columns to nic_nac_runs', () => {
    expect(migration).toContain('alter table public.nic_nac_runs')
    expect(migration).toContain('add column if not exists workflow_id uuid')
    expect(migration).toContain('add column if not exists workflow_type text')
    expect(migration).toContain('add column if not exists tool_policy_source text')
    expect(migration).toContain('add column if not exists hard_fail_phrase_count integer')
  })

  it('enables RLS and rep-scoped policies', () => {
    expect(migration).toContain('alter table public.trade_board_intake_sessions enable row level security')
    expect(migration).toContain('alter table public.trade_board_intake_photos enable row level security')
    expect(migration).toContain('trade_board_intake_sessions_own_data')
    expect(migration).toContain('trade_board_intake_photos_own_data')
    expect(migration).toContain('trade_board_intake_sessions_admin_full_access')
    expect(migration).toContain('trade_board_intake_photos_admin_full_access')
  })
})
```

- [ ] **Step 2: Run the failing migration test**

Run:

```powershell
npm exec vitest run tests/nic-nac-trade-board-intake-migration.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Create the migration**

Create `supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql`:

```sql
create table if not exists public.trade_board_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id text not null,
  workflow_type text not null default 'trade_board_add_listing'
    check (workflow_type = 'trade_board_add_listing'),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review')),
  current_phase text not null default 'started'
    check (current_phase in ('started', 'details_capture', 'photo_capture', 'catalog_match', 'ready_to_add', 'adding', 'completed', 'cancelled', 'needs_human_review')),
  item_number text,
  quantity integer,
  design_name text,
  collection_name text,
  collection_year integer,
  material text,
  main_stone text,
  bp_msrp numeric,
  ring_size text,
  rep_notes text,
  trade_preferences text,
  missing_fields text[] not null default '{}',
  hard_blockers text[] not null default '{}',
  soft_warnings text[] not null default '{}',
  created_listing_ids uuid[] not null default '{}',
  created_design_id uuid,
  last_user_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create index if not exists idx_trade_board_intake_sessions_rep_active
  on public.trade_board_intake_sessions (rep_id, conversation_id, updated_at desc)
  where status = 'active';

create index if not exists idx_trade_board_intake_sessions_expires
  on public.trade_board_intake_sessions (expires_at)
  where status = 'active';

create table if not exists public.trade_board_intake_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trade_board_intake_sessions(id) on delete cascade,
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id text not null,
  conversation_message_id text,
  attachment_index integer not null,
  declared_role text not null default 'unknown'
    check (declared_role in ('label_details', 'jewelry_front', 'unknown', 'other')),
  visual_role text not null default 'uncertain'
    check (visual_role in ('jewelry', 'label_or_packaging', 'uncertain')),
  role_confirmed boolean not null default false,
  image_url text,
  quality text not null default 'unknown'
    check (quality in ('usable', 'warning', 'blocked', 'unknown')),
  quality_score integer,
  quality_issues text[] not null default '{}',
  notes text[] not null default '{}',
  ocr_or_vision_summary text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_trade_board_intake_photos_message_attachment
  on public.trade_board_intake_photos (session_id, conversation_message_id, attachment_index)
  where conversation_message_id is not null;

create index if not exists idx_trade_board_intake_photos_session
  on public.trade_board_intake_photos (session_id, created_at asc);

alter table public.trade_board_intake_sessions enable row level security;
alter table public.trade_board_intake_photos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_sessions'
      and policyname = 'trade_board_intake_sessions_own_data'
  ) then
    create policy trade_board_intake_sessions_own_data
      on public.trade_board_intake_sessions
      for select
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_sessions'
      and policyname = 'trade_board_intake_sessions_admin_full_access'
  ) then
    create policy trade_board_intake_sessions_admin_full_access
      on public.trade_board_intake_sessions
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_photos'
      and policyname = 'trade_board_intake_photos_own_data'
  ) then
    create policy trade_board_intake_photos_own_data
      on public.trade_board_intake_photos
      for select
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_photos'
      and policyname = 'trade_board_intake_photos_admin_full_access'
  ) then
    create policy trade_board_intake_photos_admin_full_access
      on public.trade_board_intake_photos
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter table public.nic_nac_runs
  add column if not exists workflow_id uuid,
  add column if not exists workflow_type text,
  add column if not exists workflow_phase_before text,
  add column if not exists workflow_phase_after text,
  add column if not exists workflow_status_before text,
  add column if not exists workflow_status_after text,
  add column if not exists tool_policy_source text,
  add column if not exists hard_fail_phrase_count integer not null default 0,
  add column if not exists hard_fail_phrases text[] not null default '{}',
  add column if not exists workflow_photo_roles jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
```

- [ ] **Step 4: Run the migration test**

Run:

```powershell
npm exec vitest run tests/nic-nac-trade-board-intake-migration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql tests/nic-nac-trade-board-intake-migration.test.ts
git commit -m "feat: add Nic-Nac intake workflow schema"
```

## Task 2: Add Shared Workflow Types And Eval Helpers

**Files:**
- Create: `lib/nic-nac/workflows/trade-board-intake-types.ts`
- Create: `lib/nic-nac/workflows/trade-board-intake-eval.ts`
- Test: `tests/nic-nac/trade-board-intake-eval.test.ts`

- [ ] **Step 1: Write failing eval helper tests**

Create `tests/nic-nac/trade-board-intake-eval.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  detectTradeBoardIntakeHardFails,
  summarizeHardFailDetection,
} from '@/lib/nic-nac/workflows/trade-board-intake-eval'

describe('Trade Board intake hard-fail detection', () => {
  it('detects manual workaround and unavailable-tool language', () => {
    const text = "I can't actually add listings from chat. Log into your workspace and add it manually."
    const result = detectTradeBoardIntakeHardFails(text)

    expect(result.count).toBe(2)
    expect(result.matches.map((m) => m.id)).toEqual([
      'cannot_add_listings',
      'manual_workspace_add',
    ])
  })

  it('detects label-photo jewelry critique language', () => {
    const result = detectTradeBoardIntakeHardFails(
      'The photo of the earrings needs a closer retake.',
    )

    expect(result.matches.map((m) => m.id)).toContain('earrings_photo_needs_after_label')
  })

  it('detects forbidden boxed-display retake language', () => {
    const result = detectTradeBoardIntakeHardFails(
      'Please take an unboxed photo on a plain background because the packaging is too prominent.',
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'unboxed',
      'plain_background',
      'packaging_too_prominent',
    ])
  })

  it('summarizes a clean transcript', () => {
    const result = summarizeHardFailDetection([
      'Got it. That first image is just the label/details source.',
      'I still need the customer-facing photo of the earrings.',
    ])

    expect(result.count).toBe(0)
    expect(result.phrases).toEqual([])
  })
})
```

- [ ] **Step 2: Run the failing eval helper tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-eval.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Create shared workflow types**

Create `lib/nic-nac/workflows/trade-board-intake-types.ts`:

```ts
export type TradeBoardIntakeWorkflowType = 'trade_board_add_listing'

export type TradeBoardIntakeStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'needs_human_review'

export type TradeBoardIntakePhase =
  | 'started'
  | 'details_capture'
  | 'photo_capture'
  | 'catalog_match'
  | 'ready_to_add'
  | 'adding'
  | 'completed'
  | 'cancelled'
  | 'needs_human_review'

export type TradeBoardPhotoDeclaredRole =
  | 'label_details'
  | 'jewelry_front'
  | 'unknown'
  | 'other'

export type TradeBoardPhotoVisualRole =
  | 'jewelry'
  | 'label_or_packaging'
  | 'uncertain'

export type TradeBoardPhotoQuality =
  | 'usable'
  | 'warning'
  | 'blocked'
  | 'unknown'

export type TradeBoardIntakeNextAction =
  | 'ask_for_item_number'
  | 'ask_for_label_details_photo'
  | 'ask_for_jewelry_front_photo'
  | 'ask_for_collection'
  | 'confirm_extracted_details'
  | 'call_search_jewelry_database'
  | 'call_add_listing'
  | 'ask_photo_role_clarification'
  | 'escalate_to_human_review'

export type TradeBoardIntakeToolPolicySource =
  | 'mode_required_setup'
  | 'active_workflow'
  | 'latest_turn_intent'
  | 'fallback_memory'
  | 'fallback_resources'

export interface TradeBoardIntakeKnownFields {
  itemNumber?: string
  quantity?: number
  designName?: string
  collectionName?: string
  collectionYear?: number
  material?: string
  mainStone?: string
  bpMsrp?: number
  ringSize?: string
  repNotes?: string
  tradePreferences?: string
}

export interface TradeBoardIntakePhotoState {
  id?: string
  conversationMessageId?: string
  attachmentIndex: number
  declaredRole: TradeBoardPhotoDeclaredRole
  visualRole: TradeBoardPhotoVisualRole
  roleConfirmed: boolean
  imageUrl?: string
  quality: TradeBoardPhotoQuality
  qualityScore?: number
  qualityIssues: string[]
  notes: string[]
}

export interface TradeBoardIntakeSessionState {
  id: string
  repId: string
  conversationId: string
  workflowType: TradeBoardIntakeWorkflowType
  status: TradeBoardIntakeStatus
  phase: TradeBoardIntakePhase
  known: TradeBoardIntakeKnownFields
  missing: string[]
  blockers: string[]
  warnings: string[]
  photos: TradeBoardIntakePhotoState[]
  createdListingIds?: string[]
  createdDesignId?: string
  lastUserMessageId?: string
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
}

export interface TradeBoardIntakePromptState {
  workflow: {
    id: string
    type: TradeBoardIntakeWorkflowType
    status: TradeBoardIntakeStatus
    phase: TradeBoardIntakePhase
  }
  known: TradeBoardIntakeKnownFields
  photos: Array<{
    index: number
    declaredRole: TradeBoardPhotoDeclaredRole
    visualRole: TradeBoardPhotoVisualRole
    roleConfirmed: boolean
    quality: TradeBoardPhotoQuality
    notes: string[]
  }>
  missing: string[]
  blockers: string[]
  nextAction: TradeBoardIntakeNextAction
  hardRules: string[]
}
```

- [ ] **Step 4: Create hard-fail helper**

Create `lib/nic-nac/workflows/trade-board-intake-eval.ts`:

```ts
export interface HardFailMatch {
  id: string
  phrase: string
}

const HARD_FAIL_PATTERNS: Array<{
  id: string
  phrase: string
  pattern: RegExp
}> = [
  {
    id: 'cannot_add_listings',
    phrase: "I can't actually add listings",
    pattern: /\bi\s+can(?:no|')?t\s+actually\s+add\s+listings\b/i,
  },
  {
    id: 'manual_workspace_add',
    phrase: 'Log into your workspace and add it manually',
    pattern: /\blog\s+into\s+your\s+workspace\b[\s\S]{0,120}\badd\s+it\s+manually\b/i,
  },
  {
    id: 'earrings_photo_needs_after_label',
    phrase: 'The photo of the earrings needs',
    pattern: /\bthe\s+photo\s+of\s+the\s+earrings\s+needs\b/i,
  },
  {
    id: 'unboxed',
    phrase: 'Unboxed',
    pattern: /\bunboxed\b/i,
  },
  {
    id: 'plain_background',
    phrase: 'Plain background',
    pattern: /\bplain\s+background\b/i,
  },
  {
    id: 'packaging_too_prominent',
    phrase: 'Packaging is too prominent',
    pattern: /\bpackaging\s+is\s+too\s+prominent\b/i,
  },
]

export function detectTradeBoardIntakeHardFails(text: string): {
  count: number
  matches: HardFailMatch[]
} {
  const matches = HARD_FAIL_PATTERNS.filter((entry) =>
    entry.pattern.test(text),
  ).map(({ id, phrase }) => ({ id, phrase }))

  return {
    count: matches.length,
    matches,
  }
}

export function summarizeHardFailDetection(texts: string[]): {
  count: number
  phrases: string[]
} {
  const seen = new Map<string, string>()
  for (const text of texts) {
    for (const match of detectTradeBoardIntakeHardFails(text).matches) {
      seen.set(match.id, match.phrase)
    }
  }

  return {
    count: seen.size,
    phrases: Array.from(seen.values()),
  }
}
```

- [ ] **Step 5: Run eval helper tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-eval.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/workflows/trade-board-intake-types.ts lib/nic-nac/workflows/trade-board-intake-eval.ts tests/nic-nac/trade-board-intake-eval.test.ts
git commit -m "feat: define Nic-Nac intake workflow contracts"
```

## Task 3: Build Pure Workflow Controller

**Files:**
- Create: `lib/nic-nac/workflows/trade-board-intake-controller.ts`
- Test: `tests/nic-nac/trade-board-intake-controller.test.ts`

- [ ] **Step 1: Write failing controller tests**

Create `tests/nic-nac/trade-board-intake-controller.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'
import {
  buildTradeBoardIntakePromptState,
  computeTradeBoardIntakeReadiness,
  createEmptyTradeBoardIntakeState,
  getTradeBoardIntakeToolsRequired,
  transitionTradeBoardIntake,
} from '@/lib/nic-nac/workflows/trade-board-intake-controller'

function baseState(overrides: Partial<TradeBoardIntakeSessionState> = {}): TradeBoardIntakeSessionState {
  return {
    id: 'workflow-1',
    repId: 'rep-1',
    conversationId: 'conv-1',
    workflowType: 'trade_board_add_listing',
    status: 'active',
    phase: 'started',
    known: {},
    missing: [],
    blockers: [],
    warnings: [],
    photos: [],
    ...overrides,
  }
}

describe('Trade Board intake controller', () => {
  it('creates an empty active workflow state', () => {
    const state = createEmptyTradeBoardIntakeState({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
    })

    expect(state.status).toBe('active')
    expect(state.phase).toBe('started')
    expect(state.workflowType).toBe('trade_board_add_listing')
    expect(state.missing).toContain('itemNumber')
  })

  it('never lets label/details photos satisfy jewelry-front readiness', () => {
    const state = baseState({
      phase: 'catalog_match',
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
        collectionYear: 2026,
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'label_details',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: ['backs of earrings visible'],
        },
      ],
    })

    const readiness = computeTradeBoardIntakeReadiness(state)

    expect(readiness.ready).toBe(false)
    expect(readiness.missing).toContain('jewelryFrontPhoto')
    expect(readiness.blockers).not.toContain('labelPhotoUnreadable')
  })

  it('accepts boxed display jewelry-front photos when clear and usable', () => {
    const state = baseState({
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'label_details',
          visualRole: 'label_or_packaging',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: [],
        },
        {
          attachmentIndex: 2,
          declaredRole: 'jewelry_front',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: ['boxed display jewelry is centered and clear'],
        },
      ],
    })

    const readiness = computeTradeBoardIntakeReadiness(state)

    expect(readiness.ready).toBe(true)
    expect(readiness.missing).toEqual([])
    expect(readiness.blockers).toEqual([])
  })

  it('keeps Trade Board tools required while active', () => {
    expect(getTradeBoardIntakeToolsRequired(baseState())).toEqual([
      'trade_board',
      'catalog',
    ])
  })

  it('builds model prompt state with the correct next action', () => {
    const promptState = buildTradeBoardIntakePromptState(
      baseState({
        known: {
          itemNumber: 'ER13229',
          designName: 'The Florence Earrings',
          collectionName: 'July Birthday',
        },
        photos: [
          {
            attachmentIndex: 1,
            declaredRole: 'label_details',
            visualRole: 'label_or_packaging',
            roleConfirmed: true,
            quality: 'usable',
            qualityIssues: [],
            notes: [],
          },
        ],
      }),
    )

    expect(promptState.nextAction).toBe('ask_for_jewelry_front_photo')
    expect(promptState.hardRules).toContain('label_details photos cannot satisfy jewelry_front')
    expect(promptState.photos[0]).toMatchObject({
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
    })
  })

  it('moves ready state to adding only through controller transition', () => {
    const state = baseState({
      phase: 'ready_to_add',
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          attachmentIndex: 1,
          declaredRole: 'jewelry_front',
          visualRole: 'jewelry',
          roleConfirmed: true,
          quality: 'usable',
          qualityIssues: [],
          notes: [],
        },
      ],
    })

    const next = transitionTradeBoardIntake(state, { type: 'authorize_add_listing' })

    expect(next.phase).toBe('adding')
    expect(next.status).toBe('active')
  })
})
```

- [ ] **Step 2: Run failing controller tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-controller.test.ts
```

Expected: FAIL because the controller module does not exist.

- [ ] **Step 3: Create controller implementation**

Create `lib/nic-nac/workflows/trade-board-intake-controller.ts`:

```ts
import type {
  TradeBoardIntakeNextAction,
  TradeBoardIntakePhase,
  TradeBoardIntakePromptState,
  TradeBoardIntakeSessionState,
} from './trade-board-intake-types'

export function createEmptyTradeBoardIntakeState(args: {
  id: string
  repId: string
  conversationId: string
}): TradeBoardIntakeSessionState {
  const state: TradeBoardIntakeSessionState = {
    id: args.id,
    repId: args.repId,
    conversationId: args.conversationId,
    workflowType: 'trade_board_add_listing',
    status: 'active',
    phase: 'started',
    known: {},
    missing: [],
    blockers: [],
    warnings: [],
    photos: [],
  }
  const readiness = computeTradeBoardIntakeReadiness(state)
  return {
    ...state,
    missing: readiness.missing,
    blockers: readiness.blockers,
  }
}

export function computeTradeBoardIntakeReadiness(
  state: TradeBoardIntakeSessionState,
): {
  ready: boolean
  missing: string[]
  blockers: string[]
  nextAction: TradeBoardIntakeNextAction
} {
  const missing: string[] = []
  const blockers: string[] = []
  const known = state.known
  const labelDetailsPhoto = state.photos.find(
    (photo) => photo.declaredRole === 'label_details',
  )
  const jewelryFrontPhoto = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' &&
      photo.quality !== 'blocked',
  )
  const blockedLabel = state.photos.find(
    (photo) =>
      photo.declaredRole === 'label_details' &&
      photo.quality === 'blocked',
  )
  const blockedJewelry = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' &&
      photo.quality === 'blocked',
  )

  if (!known.itemNumber) missing.push('itemNumber')
  if (!known.designName) missing.push('designName')
  if (!known.collectionName) missing.push('collectionName')
  if (!labelDetailsPhoto && !known.itemNumber) missing.push('labelDetailsPhoto')
  if (!jewelryFrontPhoto) missing.push('jewelryFrontPhoto')
  if (blockedLabel) blockers.push('labelPhotoUnreadable')
  if (blockedJewelry) blockers.push('jewelryPhotoUnusable')

  const ready = missing.length === 0 && blockers.length === 0
  return {
    ready,
    missing,
    blockers,
    nextAction: chooseNextAction({ ready, missing, blockers }),
  }
}

export function transitionTradeBoardIntake(
  state: TradeBoardIntakeSessionState,
  event:
    | { type: 'cancel' }
    | { type: 'expire' }
    | { type: 'escalate' }
    | { type: 'authorize_add_listing' }
    | { type: 'mark_completed'; listingIds: string[]; designId?: string },
): TradeBoardIntakeSessionState {
  if (event.type === 'cancel') {
    return { ...state, status: 'cancelled', phase: 'cancelled' }
  }
  if (event.type === 'expire') {
    return { ...state, status: 'expired', phase: state.phase }
  }
  if (event.type === 'escalate') {
    return { ...state, status: 'needs_human_review', phase: 'needs_human_review' }
  }
  if (event.type === 'authorize_add_listing') {
    const readiness = computeTradeBoardIntakeReadiness(state)
    if (!readiness.ready) {
      return {
        ...state,
        phase: inferPhase(state),
        missing: readiness.missing,
        blockers: readiness.blockers,
      }
    }
    return { ...state, phase: 'adding', missing: [], blockers: [] }
  }
  return {
    ...state,
    status: 'completed',
    phase: 'completed',
    createdListingIds: event.listingIds,
    createdDesignId: event.designId,
  }
}

export function getTradeBoardIntakeToolsRequired(
  state: TradeBoardIntakeSessionState | null,
): Array<'trade_board' | 'catalog'> {
  if (!state || state.status !== 'active') return []
  return ['trade_board', 'catalog']
}

export function buildTradeBoardIntakePromptState(
  state: TradeBoardIntakeSessionState,
): TradeBoardIntakePromptState {
  const readiness = computeTradeBoardIntakeReadiness(state)
  return {
    workflow: {
      id: state.id,
      type: state.workflowType,
      status: state.status,
      phase: inferPhase({
        ...state,
        missing: readiness.missing,
        blockers: readiness.blockers,
      }),
    },
    known: state.known,
    photos: state.photos.map((photo, index) => ({
      index: index + 1,
      declaredRole: photo.declaredRole,
      visualRole: photo.visualRole,
      roleConfirmed: photo.roleConfirmed,
      quality: photo.quality,
      notes: photo.notes,
    })),
    missing: readiness.missing,
    blockers: readiness.blockers,
    nextAction: readiness.nextAction,
    hardRules: [
      'label_details photos cannot satisfy jewelry_front',
      'visible jewelry in a label_details photo does not change its declared role',
      'boxed display jewelry photos are acceptable when centered, close, clear, and website-worthy',
      'do not ask for unboxed jewelry, plain background, or no packaging for a usable boxed display photo',
    ],
  }
}

function inferPhase(state: TradeBoardIntakeSessionState): TradeBoardIntakePhase {
  if (state.status !== 'active') {
    if (state.status === 'completed') return 'completed'
    if (state.status === 'cancelled') return 'cancelled'
    if (state.status === 'needs_human_review') return 'needs_human_review'
    return state.phase
  }
  if (state.blockers.length > 0) return 'photo_capture'
  if (state.missing.includes('itemNumber') || state.missing.includes('collectionName')) {
    return 'details_capture'
  }
  if (state.missing.includes('jewelryFrontPhoto')) return 'photo_capture'
  if (state.known.itemNumber) return 'ready_to_add'
  return 'started'
}

function chooseNextAction(args: {
  ready: boolean
  missing: string[]
  blockers: string[]
}): TradeBoardIntakeNextAction {
  if (args.blockers.includes('labelPhotoUnreadable')) return 'ask_for_label_details_photo'
  if (args.blockers.includes('jewelryPhotoUnusable')) return 'ask_for_jewelry_front_photo'
  if (args.ready) return 'call_add_listing'
  if (args.missing.includes('itemNumber')) return 'ask_for_item_number'
  if (args.missing.includes('collectionName')) return 'ask_for_collection'
  if (args.missing.includes('labelDetailsPhoto')) return 'ask_for_label_details_photo'
  if (args.missing.includes('jewelryFrontPhoto')) return 'ask_for_jewelry_front_photo'
  return 'confirm_extracted_details'
}
```

- [ ] **Step 4: Run controller tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-controller.test.ts
```

Expected: PASS after adjusting any TypeScript issues without changing the tested contract.

- [ ] **Step 5: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/workflows/trade-board-intake-controller.ts tests/nic-nac/trade-board-intake-controller.test.ts
git commit -m "feat: add Nic-Nac intake workflow controller"
```

## Task 4: Add Supabase Store Helpers

**Files:**
- Create: `lib/nic-nac/workflows/trade-board-intake-store.ts`
- Test: `tests/nic-nac/trade-board-intake-store.test.ts`

- [ ] **Step 1: Write store tests**

Create `tests/nic-nac/trade-board-intake-store.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import {
  createTradeBoardIntakeSession,
  getActiveTradeBoardIntakeSession,
  mapTradeBoardIntakeSessionRow,
  upsertTradeBoardIntakePhoto,
  updateTradeBoardIntakeSession,
} from '@/lib/nic-nac/workflows/trade-board-intake-store'

function makeBuilder(result: unknown) {
  const calls: Array<[string, unknown[]]> = []
  const builder: Record<string, unknown> = {}
  for (const name of ['select', 'eq', 'gt', 'order', 'limit', 'maybeSingle', 'insert', 'update', 'upsert']) {
    builder[name] = vi.fn((...args: unknown[]) => {
      calls.push([name, args])
      return name === 'maybeSingle' ? result : builder
    })
  }
  return { builder, calls }
}

describe('Trade Board intake store', () => {
  it('maps session rows into workflow state', () => {
    const mapped = mapTradeBoardIntakeSessionRow({
      id: 'workflow-1',
      rep_id: 'rep-1',
      conversation_id: 'conv-1',
      workflow_type: 'trade_board_add_listing',
      status: 'active',
      current_phase: 'photo_capture',
      item_number: 'ER13229',
      quantity: 1,
      design_name: 'The Florence Earrings',
      collection_name: 'July Birthday',
      collection_year: 2026,
      material: null,
      main_stone: null,
      bp_msrp: null,
      ring_size: null,
      rep_notes: null,
      trade_preferences: null,
      missing_fields: ['jewelryFrontPhoto'],
      hard_blockers: [],
      soft_warnings: [],
      last_user_message_id: 'msg-1',
      created_at: '2026-06-15T00:00:00.000Z',
      updated_at: '2026-06-15T00:00:00.000Z',
      expires_at: '2026-06-16T00:00:00.000Z',
      trade_board_intake_photos: [
        {
          id: 'photo-1',
          conversation_message_id: 'msg-1',
          attachment_index: 1,
          declared_role: 'label_details',
          visual_role: 'label_or_packaging',
          role_confirmed: true,
          image_url: 'data:image/jpeg;base64,AAA',
          quality: 'usable',
          quality_score: 90,
          quality_issues: [],
          notes: [],
        },
      ],
    })

    expect(mapped.known).toMatchObject({
      itemNumber: 'ER13229',
      designName: 'The Florence Earrings',
      collectionName: 'July Birthday',
      collectionYear: 2026,
    })
    expect(mapped.photos[0]).toMatchObject({
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
      roleConfirmed: true,
    })
  })

  it('queries the active session by rep and conversation', async () => {
    const { builder, calls } = makeBuilder({ data: null, error: null })
    const supabase = { from: vi.fn(() => builder) }

    await getActiveTradeBoardIntakeSession(supabase as never, {
      repId: 'rep-1',
      conversationId: 'conv-1',
      nowIso: '2026-06-15T00:00:00.000Z',
    })

    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_sessions')
    expect(calls).toContainEqual(['eq', ['rep_id', 'rep-1']])
    expect(calls).toContainEqual(['eq', ['conversation_id', 'conv-1']])
    expect(calls).toContainEqual(['eq', ['status', 'active']])
    expect(calls).toContainEqual(['gt', ['expires_at', '2026-06-15T00:00:00.000Z']])
  })

  it('creates, updates, and upserts through the expected tables', async () => {
    const sessionBuilder = makeBuilder({ data: { id: 'workflow-1' }, error: null })
    const photoBuilder = makeBuilder({ data: { id: 'photo-1' }, error: null })
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'trade_board_intake_photos'
          ? photoBuilder.builder
          : sessionBuilder.builder,
      ),
    }

    await createTradeBoardIntakeSession(supabase as never, {
      repId: 'rep-1',
      conversationId: 'conv-1',
    })
    await updateTradeBoardIntakeSession(supabase as never, {
      sessionId: 'workflow-1',
      patch: { current_phase: 'photo_capture' },
    })
    await upsertTradeBoardIntakePhoto(supabase as never, {
      sessionId: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
      conversationMessageId: 'msg-1',
      attachmentIndex: 1,
      declaredRole: 'label_details',
      visualRole: 'label_or_packaging',
      roleConfirmed: true,
      imageUrl: 'data:image/jpeg;base64,AAA',
      quality: 'usable',
      qualityIssues: [],
      notes: [],
    })

    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_sessions')
    expect(supabase.from).toHaveBeenCalledWith('trade_board_intake_photos')
  })
})
```

- [ ] **Step 2: Run failing store tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-store.test.ts
```

Expected: FAIL because the store module does not exist.

- [ ] **Step 3: Create store helpers**

Create `lib/nic-nac/workflows/trade-board-intake-store.ts` with mapper and helper functions. Keep SQL column names inside this file; expose camelCase workflow state to the rest of the app.

Core exported functions:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TradeBoardIntakePhotoState,
  TradeBoardIntakeSessionState,
} from './trade-board-intake-types'

export function mapTradeBoardIntakeSessionRow(row: Record<string, unknown>): TradeBoardIntakeSessionState {
  const photos = ((row.trade_board_intake_photos as Array<Record<string, unknown>> | null) ?? [])
    .map(mapTradeBoardIntakePhotoRow)

  return {
    id: row.id as string,
    repId: row.rep_id as string,
    conversationId: row.conversation_id as string,
    workflowType: 'trade_board_add_listing',
    status: row.status as TradeBoardIntakeSessionState['status'],
    phase: row.current_phase as TradeBoardIntakeSessionState['phase'],
    known: {
      ...(row.item_number ? { itemNumber: row.item_number as string } : {}),
      ...(row.quantity ? { quantity: row.quantity as number } : {}),
      ...(row.design_name ? { designName: row.design_name as string } : {}),
      ...(row.collection_name ? { collectionName: row.collection_name as string } : {}),
      ...(row.collection_year ? { collectionYear: row.collection_year as number } : {}),
      ...(row.material ? { material: row.material as string } : {}),
      ...(row.main_stone ? { mainStone: row.main_stone as string } : {}),
      ...(row.bp_msrp ? { bpMsrp: Number(row.bp_msrp) } : {}),
      ...(row.ring_size ? { ringSize: row.ring_size as string } : {}),
      ...(row.rep_notes ? { repNotes: row.rep_notes as string } : {}),
      ...(row.trade_preferences ? { tradePreferences: row.trade_preferences as string } : {}),
    },
    missing: (row.missing_fields as string[] | null) ?? [],
    blockers: (row.hard_blockers as string[] | null) ?? [],
    warnings: (row.soft_warnings as string[] | null) ?? [],
    photos,
    ...(row.last_user_message_id ? { lastUserMessageId: row.last_user_message_id as string } : {}),
    ...(row.created_at ? { createdAt: row.created_at as string } : {}),
    ...(row.updated_at ? { updatedAt: row.updated_at as string } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at as string } : {}),
  }
}

export function mapTradeBoardIntakePhotoRow(row: Record<string, unknown>): TradeBoardIntakePhotoState {
  return {
    id: row.id as string,
    ...(row.conversation_message_id ? { conversationMessageId: row.conversation_message_id as string } : {}),
    attachmentIndex: row.attachment_index as number,
    declaredRole: row.declared_role as TradeBoardIntakePhotoState['declaredRole'],
    visualRole: row.visual_role as TradeBoardIntakePhotoState['visualRole'],
    roleConfirmed: Boolean(row.role_confirmed),
    ...(row.image_url ? { imageUrl: row.image_url as string } : {}),
    quality: row.quality as TradeBoardIntakePhotoState['quality'],
    ...(row.quality_score !== null && row.quality_score !== undefined ? { qualityScore: row.quality_score as number } : {}),
    qualityIssues: (row.quality_issues as string[] | null) ?? [],
    notes: (row.notes as string[] | null) ?? [],
  }
}
```

Then implement these exported helpers:

- `getActiveTradeBoardIntakeSession(supabase, { repId, conversationId, nowIso })`
- `createTradeBoardIntakeSession(supabase, { repId, conversationId, lastUserMessageId })`
- `updateTradeBoardIntakeSession(supabase, { sessionId, patch })`
- `upsertTradeBoardIntakePhoto(supabase, args)`

Use:

```ts
.select('*, trade_board_intake_photos(*)')
```

for active session reads and order photos by `created_at` in the mapper if needed.

- [ ] **Step 4: Run store tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-store.test.ts
```

Expected: PASS after fixing mock-chain details.

- [ ] **Step 5: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/workflows/trade-board-intake-store.ts tests/nic-nac/trade-board-intake-store.test.ts
git commit -m "feat: add Nic-Nac intake workflow store"
```

## Task 5: Add Route-Facing Workflow Context

**Files:**
- Create: `lib/nic-nac/workflows/trade-board-intake-context.ts`
- Create: `lib/nic-nac/workflows/trade-board-intake-prompt.ts`
- Test: `tests/nic-nac/trade-board-intake-route-context.test.ts`

- [ ] **Step 1: Write route-context tests**

Create `tests/nic-nac/trade-board-intake-route-context.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'
import { inferDeclaredPhotoRoleFromConversation, mergeWorkflowToolIntents } from '@/lib/nic-nac/workflows/trade-board-intake-context'
import { renderTradeBoardIntakePromptState } from '@/lib/nic-nac/workflows/trade-board-intake-prompt'
import type { TradeBoardIntakePromptState } from '@/lib/nic-nac/workflows/trade-board-intake-types'

describe('Trade Board intake route context', () => {
  it('inherits label_details role after Nic-Nac asks for a label/details photo', () => {
    const messages: UIMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Upload a clear item-info tag or label photo.' }],
      } as UIMessage,
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,AAA' }],
      } as UIMessage,
    ]

    expect(inferDeclaredPhotoRoleFromConversation(messages, 0)).toBe('label_details')
  })

  it('inherits jewelry_front role after Nic-Nac asks for customer-facing jewelry photo', () => {
    const messages: UIMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'I still need the customer-facing jewelry photo.' }],
      } as UIMessage,
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,BBB' }],
      } as UIMessage,
    ]

    expect(inferDeclaredPhotoRoleFromConversation(messages, 0)).toBe('jewelry_front')
  })

  it('keeps trade board intents when workflow intents are active', () => {
    expect(mergeWorkflowToolIntents(['memory'], ['trade_board', 'catalog'])).toEqual([
      'memory',
      'trade_board',
      'catalog',
    ])
  })

  it('renders compact prompt state with hard rules', () => {
    const state: TradeBoardIntakePromptState = {
      workflow: {
        id: 'workflow-1',
        type: 'trade_board_add_listing',
        status: 'active',
        phase: 'photo_capture',
      },
      known: {
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      },
      photos: [
        {
          index: 1,
          declaredRole: 'label_details',
          visualRole: 'label_or_packaging',
          roleConfirmed: true,
          quality: 'usable',
          notes: [],
        },
      ],
      missing: ['jewelryFrontPhoto'],
      blockers: [],
      nextAction: 'ask_for_jewelry_front_photo',
      hardRules: ['label_details photos cannot satisfy jewelry_front'],
    }

    const rendered = renderTradeBoardIntakePromptState(state)

    expect(rendered).toContain('Active workflow: trade_board_add_listing')
    expect(rendered).toContain('itemNumber: ER13229')
    expect(rendered).toContain('declaredRole=label_details')
    expect(rendered).toContain('Missing: jewelryFrontPhoto')
    expect(rendered).toContain('Next action: ask_for_jewelry_front_photo')
  })
})
```

- [ ] **Step 2: Run failing route-context tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-route-context.test.ts
```

Expected: FAIL because context/prompt modules do not exist.

- [ ] **Step 3: Create prompt renderer**

Create `lib/nic-nac/workflows/trade-board-intake-prompt.ts`:

```ts
import type { TradeBoardIntakePromptState } from './trade-board-intake-types'

export function renderTradeBoardIntakePromptState(
  state: TradeBoardIntakePromptState | null,
): string {
  if (!state) return ''

  const known = Object.entries(state.known)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n')
  const photos = state.photos
    .map(
      (photo) =>
        `- photo ${photo.index}: declaredRole=${photo.declaredRole}, visualRole=${photo.visualRole}, roleConfirmed=${photo.roleConfirmed}, quality=${photo.quality}${photo.notes.length ? `, notes=${photo.notes.join('; ')}` : ''}`,
    )
    .join('\n')

  return [
    'Active workflow: trade_board_add_listing',
    `Workflow id: ${state.workflow.id}`,
    `Workflow status: ${state.workflow.status}`,
    `Workflow phase: ${state.workflow.phase}`,
    known ? `Known details:\n${known}` : 'Known details: none yet',
    photos ? `Photos:\n${photos}` : 'Photos: none yet',
    `Missing: ${state.missing.length ? state.missing.join(', ') : 'none'}`,
    `Blockers: ${state.blockers.length ? state.blockers.join(', ') : 'none'}`,
    `Next action: ${state.nextAction}`,
    `Hard rules:\n${state.hardRules.map((rule) => `- ${rule}`).join('\n')}`,
  ].join('\n')
}
```

- [ ] **Step 4: Create route context helpers**

Create `lib/nic-nac/workflows/trade-board-intake-context.ts` with:

```ts
import type { UIMessage } from 'ai'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import type { TradeBoardPhotoDeclaredRole } from './trade-board-intake-types'

export function inferDeclaredPhotoRoleFromConversation(
  messages: UIMessage[],
  attachmentIndex: number,
): TradeBoardPhotoDeclaredRole {
  const latestUserIndex = findLatestUserMessageIndex(messages)
  if (latestUserIndex === -1) return 'unknown'
  const latestUser = messages[latestUserIndex]
  const fileParts = (latestUser.parts ?? []).filter(
    (part) =>
      (part as { type?: string; mediaType?: string }).type === 'file' &&
      (part as { mediaType?: string }).mediaType?.startsWith('image/'),
  )
  if (!fileParts[attachmentIndex]) return 'unknown'

  const latestText = getMessageText(latestUser).toLowerCase()
  if (/\blabel|details|tag|back.of.card|item-info|item info\b/i.test(latestText)) {
    return 'label_details'
  }
  if (/\bjewelry|customer-facing|front photo|boxed display|piece photo\b/i.test(latestText)) {
    return 'jewelry_front'
  }

  const previousAssistant = messages
    .slice(0, latestUserIndex)
    .reverse()
    .find((message) => message.role === 'assistant')
  const assistantText = getMessageText(previousAssistant).toLowerCase()
  if (/\blabel|details|tag|back.of.card|item-info|item info\b/i.test(assistantText)) {
    return 'label_details'
  }
  if (/\bjewelry|customer-facing|front photo|boxed display|piece photo\b/i.test(assistantText)) {
    return 'jewelry_front'
  }

  return 'unknown'
}

export function mergeWorkflowToolIntents(
  latestIntents: NicNacToolIntent[],
  workflowIntents: NicNacToolIntent[],
): NicNacToolIntent[] {
  const merged: NicNacToolIntent[] = []
  for (const intent of [...latestIntents, ...workflowIntents]) {
    if (!merged.includes(intent)) merged.push(intent)
  }
  return merged
}

function findLatestUserMessageIndex(messages: UIMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return index
  }
  return -1
}

function getMessageText(message: UIMessage | undefined): string {
  return (
    message?.parts
      ?.filter((part) => (part as { type?: string }).type === 'text')
      .map((part) => (part as { text?: string }).text ?? '')
      .join('\n') ?? ''
  )
}
```

Add the full orchestration function in this same module so route integration has one server-owned entry point:

```ts
export async function getOrCreateTradeBoardIntakeContext(args: {
  supabase: SupabaseClient
  repId: string
  conversationId: string
  messages: UIMessage[]
  latestUserMessageId?: string
  mode: 'workspace' | 'required_setup'
  nowIso: string
}): Promise<{
  sessionBefore: TradeBoardIntakeSessionState | null
  sessionAfter: TradeBoardIntakeSessionState | null
  workflowIntents: NicNacToolIntent[]
  toolPolicySource: TradeBoardIntakeToolPolicySource
  workflowPromptState: string
}> {
  if (args.mode !== 'workspace') {
    return {
      sessionBefore: null,
      sessionAfter: null,
      workflowIntents: [],
      toolPolicySource: 'mode_required_setup',
      workflowPromptState: '',
    }
  }

  const existing = await getActiveTradeBoardIntakeSession(args.supabase, {
    repId: args.repId,
    conversationId: args.conversationId,
    nowIso: args.nowIso,
  })
  const shouldStart = existing !== null || hasTradeBoardIntakeSignal(args.messages)
  if (!shouldStart) {
    return {
      sessionBefore: null,
      sessionAfter: null,
      workflowIntents: [],
      toolPolicySource: 'latest_turn_intent',
      workflowPromptState: '',
    }
  }

  const baseSession =
    existing ??
    await createTradeBoardIntakeSession(args.supabase, {
      repId: args.repId,
      conversationId: args.conversationId,
      lastUserMessageId: args.latestUserMessageId,
    })
  const ingested = await ingestLatestTradeBoardIntakeTurn(args.supabase, {
    session: baseSession,
    messages: args.messages,
    latestUserMessageId: args.latestUserMessageId,
  })
  const promptState = buildTradeBoardIntakePromptState(ingested)

  return {
    sessionBefore: existing,
    sessionAfter: ingested,
    workflowIntents: getTradeBoardIntakeToolsRequired(ingested),
    toolPolicySource: 'active_workflow',
    workflowPromptState: renderTradeBoardIntakePromptState(promptState),
  }
}
```

Also implement local helpers used above:

- `hasTradeBoardIntakeSignal(messages)`: returns true for explicit add-listing language, Trade Board phrasing, item-number add intent, or an upload immediately following a workflow photo request.
- `ingestLatestTradeBoardIntakeTurn(supabase, { session, messages, latestUserMessageId })`: extracts low-risk text facts such as item number, quantity, design name, and typed collection name; upserts latest image parts with `inferDeclaredPhotoRoleFromConversation`; recomputes readiness through the controller; updates the session row; and returns the updated camelCase state.

- [ ] **Step 5: Run route-context tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/trade-board-intake-route-context.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/workflows/trade-board-intake-context.ts lib/nic-nac/workflows/trade-board-intake-prompt.ts tests/nic-nac/trade-board-intake-route-context.test.ts
git commit -m "feat: add Nic-Nac intake route context helpers"
```

## Task 6: Make Tool Routing Workflow-Aware

**Files:**
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `tests/nic-nac/tool-routing.test.ts`

- [ ] **Step 1: Add failing routing tests for workflow precedence**

Append to `tests/nic-nac/tool-routing.test.ts`:

```ts
import { mergeWorkflowToolIntents } from '@/lib/nic-nac/workflows/trade-board-intake-context'

describe('Nic-Nac workflow-aware tool routing', () => {
  it('keeps add-listing tools active when the latest turn would otherwise route to memory', () => {
    const intents = mergeWorkflowToolIntents(['memory'], ['trade_board', 'catalog'])
    const toolNames = listToolNamesForIntents(intents)

    expect(intents).toEqual(['memory', 'trade_board', 'catalog'])
    expect(toolNames).toContain('add_listing')
    expect(toolNames).toContain('search_jewelry_database')
  })

  it('does not duplicate routed tools when latest turn and workflow both include trade_board', () => {
    const intents = mergeWorkflowToolIntents(['trade_board'], ['trade_board', 'catalog'])

    expect(intents).toEqual(['trade_board', 'catalog'])
  })
})
```

- [ ] **Step 2: Run routing tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/tool-routing.test.ts
```

Expected: PASS if Task 5 is complete. If imports conflict because `tool-routing.test.ts` already has imports after executable code, move the new import to the top.

- [ ] **Step 3: Keep router changes minimal**

No production code change is required in `lib/nic-nac/tools/index.ts` if `mergeWorkflowToolIntents` remains in workflow context. If future execution chooses to expose a helper from `tools/index.ts`, add:

```ts
export function mergeToolIntents(
  primary: NicNacToolIntent[],
  secondary: NicNacToolIntent[],
): NicNacToolIntent[] {
  const merged: NicNacToolIntent[] = []
  for (const intent of [...primary, ...secondary]) {
    if (!merged.includes(intent)) merged.push(intent)
  }
  return merged
}
```

and update tests to import from `@/lib/nic-nac/tools`.

- [ ] **Step 4: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/tools/index.ts tests/nic-nac/tool-routing.test.ts
git commit -m "fix: keep Nic-Nac workflow tools active"
```

## Task 7: Integrate Workflow State Into `/api/nic-nac`

**Files:**
- Modify: `app/api/nic-nac/route.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `lib/nic-nac/run-telemetry.ts`
- Test: `tests/nic-nac/prompt-routing.test.ts`
- Test: `tests/nic-nac/run-telemetry.test.ts`

- [ ] **Step 1: Add prompt builder test for workflow block**

Append to `tests/nic-nac/prompt-routing.test.ts`:

```ts
it('includes active workflow prompt state before Trade Board instructions', () => {
  const prompt = buildNicNacSystemPrompt({
    intents: ['trade_board'],
    activeToolNames: ['add_listing', 'search_jewelry_database'],
    workflowPromptState:
      'Active workflow: trade_board_add_listing\nMissing: jewelryFrontPhoto\nNext action: ask_for_jewelry_front_photo',
  })

  expect(prompt).toContain('Active workflow: trade_board_add_listing')
  expect(prompt).toContain('Missing: jewelryFrontPhoto')
  expect(prompt.indexOf('Active workflow: trade_board_add_listing')).toBeLessThan(
    prompt.indexOf('Trade-board tools:'),
  )
})
```

- [ ] **Step 2: Modify prompt builder input type**

Modify `lib/nic-nac/prompt-builder.ts`:

```ts
type BuildPromptInput = {
  intents: NicNacToolIntent[]
  activeToolNames: string[]
  mode?: 'workspace' | 'required_setup'
  workflowPromptState?: string
}
```

In `buildNicNacSystemPrompt`, include:

```ts
const workflowPrompt = workflowPromptState
  ? `Active workflow state:\n${workflowPromptState}`
  : ''
```

and add `workflowPrompt` after the active tools block and before `sections.join('\n\n')`.

- [ ] **Step 3: Add run telemetry test**

Create or extend `tests/nic-nac/run-telemetry.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const insertMock = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: insertMock,
    }),
  }),
}))

import { logNicNacRun } from '@/lib/nic-nac/run-telemetry'

describe('Nic-Nac run telemetry workflow fields', () => {
  it('writes workflow observability fields when provided', async () => {
    insertMock.mockResolvedValueOnce({ error: null })

    await logNicNacRun({
      runId: 'run-1',
      repId: 'rep-1',
      conversationId: 'conv-1',
      model: 'claude-haiku-4-5-20251001',
      status: 'complete',
      latencyMs: 1234,
      intents: ['trade_board'],
      toolNames: ['add_listing'],
      modelContext: {
        originalMessageCount: 3,
        modelMessageCount: 3,
        droppedMessageCount: 0,
        estimatedTokens: 500,
        wasCompacted: false,
      },
      workflow: {
        id: 'workflow-1',
        type: 'trade_board_add_listing',
        phaseBefore: 'photo_capture',
        phaseAfter: 'photo_capture',
        statusBefore: 'active',
        statusAfter: 'active',
        toolPolicySource: 'active_workflow',
        photoRoles: [{ declaredRole: 'label_details', visualRole: 'label_or_packaging' }],
        hardFailPhraseCount: 0,
        hardFailPhrases: [],
      },
    })

    expect(insertMock.mock.calls[0][0]).toMatchObject({
      workflow_id: 'workflow-1',
      workflow_type: 'trade_board_add_listing',
      workflow_phase_before: 'photo_capture',
      workflow_phase_after: 'photo_capture',
      workflow_status_before: 'active',
      workflow_status_after: 'active',
      tool_policy_source: 'active_workflow',
      hard_fail_phrase_count: 0,
      hard_fail_phrases: [],
    })
  })
})
```

- [ ] **Step 4: Extend `logNicNacRun` args**

Modify `lib/nic-nac/run-telemetry.ts` to accept:

```ts
workflow?: {
  id: string
  type: string
  phaseBefore?: string
  phaseAfter?: string
  statusBefore?: string
  statusAfter?: string
  toolPolicySource?: string
  photoRoles?: unknown[]
  hardFailPhraseCount?: number
  hardFailPhrases?: string[]
}
```

Add these fields to the `insert` payload:

```ts
workflow_id: args.workflow?.id ?? null,
workflow_type: args.workflow?.type ?? null,
workflow_phase_before: args.workflow?.phaseBefore ?? null,
workflow_phase_after: args.workflow?.phaseAfter ?? null,
workflow_status_before: args.workflow?.statusBefore ?? null,
workflow_status_after: args.workflow?.statusAfter ?? null,
tool_policy_source: args.workflow?.toolPolicySource ?? null,
workflow_photo_roles: args.workflow?.photoRoles ?? [],
hard_fail_phrase_count: args.workflow?.hardFailPhraseCount ?? 0,
hard_fail_phrases: args.workflow?.hardFailPhrases ?? [],
```

- [ ] **Step 5: Add route orchestration**

Modify `app/api/nic-nac/route.ts`:

1. Import workflow helpers:

```ts
import {
  getOrCreateTradeBoardIntakeContext,
  mergeWorkflowToolIntents,
} from '@/lib/nic-nac/workflows/trade-board-intake-context'
import { summarizeHardFailDetection } from '@/lib/nic-nac/workflows/trade-board-intake-eval'
```

2. After canonical history/user message insertion and before `toolIntents`, create/load/ingest workflow context through the route-facing helper:

```ts
const tradeBoardWorkflowContext = await getOrCreateTradeBoardIntakeContext({
  supabase,
  repId,
  conversationId,
  messages,
  latestUserMessageId: userMessageId,
  mode,
  nowIso: new Date().toISOString(),
})
const activeTradeBoardWorkflow = tradeBoardWorkflowContext.sessionAfter
```

3. Compute intents:

```ts
const latestToolIntents =
  mode === 'required_setup'
    ? ['required_setup'] as NicNacToolIntent[]
    : getToolIntentsForMessages(messages)
const workflowToolIntents = tradeBoardWorkflowContext.workflowIntents
const toolIntents: NicNacToolIntent[] =
  mode === 'required_setup'
    ? latestToolIntents
    : mergeWorkflowToolIntents(latestToolIntents, workflowToolIntents)
const toolPolicySource =
  mode === 'required_setup'
    ? 'mode_required_setup'
    : tradeBoardWorkflowContext.toolPolicySource === 'active_workflow'
      ? tradeBoardWorkflowContext.toolPolicySource
      : latestToolIntents.includes('resources')
        ? 'fallback_resources'
        : latestToolIntents.includes('memory')
          ? 'fallback_memory'
          : 'latest_turn_intent'
```

4. Use the prompt state already rendered by the route context:

```ts
const workflowPromptState = tradeBoardWorkflowContext.workflowPromptState
```

5. Pass into `buildNicNacSystemPrompt`:

```ts
const systemPrompt = buildNicNacSystemPrompt({
  intents: toolIntents,
  activeToolNames,
  mode,
  workflowPromptState,
})
```

6. In `logNicNacRun`, pass workflow metadata:

```ts
const hardFailSummary = summarizeHardFailDetection(
  responseMessage.parts
    .filter((part) => (part as { type?: string }).type === 'text')
    .map((part) => (part as { text?: string }).text ?? ''),
)
```

Then:

```ts
workflow: activeTradeBoardWorkflow
  ? {
      id: activeTradeBoardWorkflow.id,
      type: activeTradeBoardWorkflow.workflowType,
      phaseBefore: activeTradeBoardWorkflow.phase,
      phaseAfter: activeTradeBoardWorkflow.phase,
      statusBefore: activeTradeBoardWorkflow.status,
      statusAfter: activeTradeBoardWorkflow.status,
      toolPolicySource,
      photoRoles: activeTradeBoardWorkflow.photos.map((photo) => ({
        declaredRole: photo.declaredRole,
        visualRole: photo.visualRole,
        roleConfirmed: photo.roleConfirmed,
        quality: photo.quality,
      })),
      hardFailPhraseCount: hardFailSummary.count,
      hardFailPhrases: hardFailSummary.phrases,
    }
  : undefined,
```

7. When building tools for the model, pass the active workflow through server-owned tool context:

```ts
const tools = buildToolsForIntents(toolIntents, {
  repId,
  supabase,
  conversationId,
  runId,
  activeTradeBoardWorkflow,
})
```

- [ ] **Step 6: Run focused route/prompt/telemetry tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/run-telemetry.test.ts tests/nic-nac/trade-board-intake-route-context.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add app/api/nic-nac/route.ts lib/nic-nac/prompt-builder.ts lib/nic-nac/run-telemetry.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/run-telemetry.test.ts
git commit -m "feat: route Nic-Nac through active intake workflows"
```

## Task 8: Guard `add_listing` With Server-Owned Workflow Readiness

**Files:**
- Modify: `lib/nic-nac/tools/types.ts`
- Modify: `lib/nic-nac/tools/add-listing.ts`
- Modify: `tests/nic-nac/add-listing-recovery.test.ts`

- [ ] **Step 1: Add failing tests for label-only active workflow**

Append to `tests/nic-nac/add-listing-recovery.test.ts`:

```ts
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'

function activeWorkflow(
  overrides: Partial<TradeBoardIntakeSessionState> = {},
): TradeBoardIntakeSessionState {
  return {
    id: 'workflow-1',
    repId: 'rep-1',
    conversationId: 'conv-1',
    workflowType: 'trade_board_add_listing',
    status: 'active',
    phase: 'photo_capture',
    known: {
      itemNumber: 'ER13229',
      designName: 'The Florence Earrings',
      collectionName: 'July Birthday',
    },
    missing: ['jewelryFrontPhoto'],
    blockers: [],
    warnings: [],
    photos: [
      {
        attachmentIndex: 1,
        declaredRole: 'label_details',
        visualRole: 'jewelry',
        roleConfirmed: true,
        quality: 'usable',
        qualityIssues: [],
        notes: ['backs of earrings visible'],
      },
    ],
    ...overrides,
  }
}

describe('add_listing - active workflow readiness guard', () => {
  it('does not use label_details photos as listing photos when server workflow state says jewelry-front is missing', async () => {
    const supabaseMock = makeConversationLookupMock([])
    const tool = makeTool(supabaseMock, {
      activeTradeBoardWorkflow: activeWorkflow(),
    })

    await expect(
      tool.execute({
        mode: 'single',
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      }),
    ).rejects.toMatchObject({
      code: 'WORKFLOW_NOT_READY',
      userMessage: expect.stringContaining('customer-facing jewelry photo'),
    })
    expect(addListingMock).not.toHaveBeenCalled()
    expect(processRepListingPhotoUrlMock).not.toHaveBeenCalled()
  })

  it('allows add_listing when active workflow readiness is satisfied', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'ER13229',
      designName: 'The Florence Earrings',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    const supabaseMock = makeConversationLookupMock([])
    const tool = makeTool(supabaseMock, {
      activeTradeBoardWorkflow: activeWorkflow({
        phase: 'ready_to_add',
        missing: [],
        photos: [
          {
            attachmentIndex: 1,
            declaredRole: 'jewelry_front',
            visualRole: 'jewelry',
            roleConfirmed: true,
            quality: 'usable',
            qualityIssues: [],
            notes: ['boxed display jewelry is centered and clear'],
          },
        ],
      }),
    })

    await expect(
      tool.execute({
        mode: 'single',
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        collectionName: 'July Birthday',
      }),
    ).resolves.toMatchObject({
      listingId: 'listing-1',
    })
  })
})
```

Adjust the test helper that builds the tool so it can merge optional context:

```ts
function makeTool(
  supabase = makeConversationLookupMock([]),
  contextOverrides: Partial<ToolContext> = {},
) {
  return addListingTool.build({
    repId: 'rep-1',
    conversationId: 'conv-1',
    runId: 'run-1',
    supabase,
    ...contextOverrides,
  } as ToolContext)
}
```

- [ ] **Step 2: Run failing add-listing test**

Run:

```powershell
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts
```

Expected: FAIL because `ToolContext` does not yet carry active workflow state and the guard does not exist.

- [ ] **Step 3: Extend server-owned tool context**

Modify `lib/nic-nac/tools/types.ts`:

```ts
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'

export type ToolContext = {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
  activeTradeBoardWorkflow?: TradeBoardIntakeSessionState | null
}
```

This is intentionally not model input. The route supplies it while building tools.

- [ ] **Step 4: Add workflow readiness guard inside `add_listing`**

Modify `lib/nic-nac/tools/add-listing.ts`:

```ts
import { computeTradeBoardIntakeReadiness } from '@/lib/nic-nac/workflows/trade-board-intake-controller'
```

At the start of the single-listing execution path, after checking `itemNumber`, add:

```ts
const activeWorkflow = ctx.activeTradeBoardWorkflow
if (activeWorkflow?.status === 'active') {
  const readiness = computeTradeBoardIntakeReadiness(activeWorkflow)
  if (!readiness.ready) {
    const needsJewelryPhoto = readiness.missing.includes('jewelryFrontPhoto')
    throw new NicNacToolError({
      code: 'WORKFLOW_NOT_READY',
      userMessage: needsJewelryPhoto
        ? 'I still need the customer-facing jewelry photo before I can save this listing.'
        : 'I still need one more required detail before I can save this listing.',
    })
  }
}
```

Keep the guard narrow: only active Trade Board intake sessions block mutation. Non-workflow add-listing behavior remains covered by existing validation.

- [ ] **Step 5: Ensure route passes active workflow into tools**

This should already be part of Task 7. Confirm the route calls the tool registry with:

```ts
activeTradeBoardWorkflow,
```

inside the server-side `ToolContext`.

- [ ] **Step 6: Run add-listing tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/trade-board-tools.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add lib/nic-nac/tools/types.ts lib/nic-nac/tools/add-listing.ts tests/nic-nac/add-listing-recovery.test.ts
git commit -m "fix: guard add listing with intake readiness"
```

## Task 9: Add Capped Replay Smoke Harness Skeleton

**Files:**
- Create: `scripts/smoke-nic-nac-trade-board-intake.ts`
- Create: `tests/nic-nac-trade-board-intake-smoke-script.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write smoke script tests**

Create `tests/nic-nac-trade-board-intake-smoke-script.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  HARD_FAIL_PHRASES,
  parseTradeBoardIntakeSmokeCases,
} from '@/scripts/smoke-nic-nac-trade-board-intake'

describe('Nic-Nac Trade Board intake smoke script', () => {
  it('exports hard-fail phrases used by the smoke gate', () => {
    expect(HARD_FAIL_PHRASES).toContain("I can't actually add listings")
    expect(HARD_FAIL_PHRASES).toContain('Log into your workspace and add it manually')
    expect(HARD_FAIL_PHRASES).toContain('The photo of the earrings needs')
    expect(HARD_FAIL_PHRASES).toContain('Unboxed')
    expect(HARD_FAIL_PHRASES).toContain('Plain background')
    expect(HARD_FAIL_PHRASES).toContain('Packaging is too prominent')
  })

  it('parses smoke cases from cases.txt-style content', () => {
    const cases = parseTradeBoardIntakeSmokeCases(`
CASE ER13229_LABEL_ONLY
message=Add ER13229 to my Trade Board
upload=ER13229-label.jpg
expect=ask_for_jewelry_front_photo
fail=The photo of the earrings needs
END
`)

    expect(cases).toEqual([
      {
        id: 'ER13229_LABEL_ONLY',
        message: 'Add ER13229 to my Trade Board',
        uploads: ['ER13229-label.jpg'],
        expect: ['ask_for_jewelry_front_photo'],
        fail: ['The photo of the earrings needs'],
      },
    ])
  })
})
```

- [ ] **Step 2: Create smoke script module**

Create `scripts/smoke-nic-nac-trade-board-intake.ts`:

```ts
export const HARD_FAIL_PHRASES = [
  "I can't actually add listings",
  'Log into your workspace and add it manually',
  'The photo of the earrings needs',
  'Unboxed',
  'Plain background',
  'Packaging is too prominent',
] as const

export interface TradeBoardIntakeSmokeCase {
  id: string
  message: string
  uploads: string[]
  expect: string[]
  fail: string[]
}

export function parseTradeBoardIntakeSmokeCases(
  raw: string,
): TradeBoardIntakeSmokeCase[] {
  const cases: TradeBoardIntakeSmokeCase[] = []
  let current: TradeBoardIntakeSmokeCase | null = null
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.startsWith('CASE ')) {
      current = {
        id: trimmed.slice('CASE '.length).trim(),
        message: '',
        uploads: [],
        expect: [],
        fail: [],
      }
      continue
    }
    if (trimmed === 'END') {
      if (current) cases.push(current)
      current = null
      continue
    }
    if (!current) continue
    const [key, ...rest] = trimmed.split('=')
    const value = rest.join('=').trim()
    if (key === 'message') current.message = value
    if (key === 'upload') current.uploads.push(value)
    if (key === 'expect') current.expect.push(value)
    if (key === 'fail') current.fail.push(value)
  }
  return cases
}

async function main() {
  const fixtureDir =
    process.env.SPARKLE_NIC_NAC_SMOKE_ASSETS ??
    'C:\\Users\\louis\\sparkle-suite-smoke-assets'
  console.log(JSON.stringify({
    ok: false,
    status: 'not_implemented_for_live_calls',
    fixtureDir,
    message:
      'Smoke harness parser is present. Live UI/API replay should be implemented after workflow state lands and fixture photos exist.',
  }))
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
```

- [ ] **Step 3: Add npm script**

Modify `package.json` scripts:

```json
"smoke:nic-nac:trade-board-intake": "tsx scripts/smoke-nic-nac-trade-board-intake.ts"
```

- [ ] **Step 4: Run smoke script tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-trade-board-intake-smoke-script.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run only during implementation closeout with Louis approval:

```powershell
git add scripts/smoke-nic-nac-trade-board-intake.ts tests/nic-nac-trade-board-intake-smoke-script.test.ts package.json
git commit -m "chore: add Nic-Nac intake smoke harness"
```

## Task 10: Focused Verification Bundle

**Files:**
- No new files unless verification exposes a bug.

- [ ] **Step 1: Run workflow-focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-trade-board-intake-migration.test.ts tests/nic-nac/trade-board-intake-eval.test.ts tests/nic-nac/trade-board-intake-controller.test.ts tests/nic-nac/trade-board-intake-store.test.ts tests/nic-nac/trade-board-intake-route-context.test.ts tests/nic-nac-trade-board-intake-smoke-script.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run existing Nic-Nac add-listing/routing tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/tool-routing.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/trade-board-tools.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the full Nic-Nac suite**

Run:

```powershell
npm exec vitest run tests/nic-nac
```

Expected: PASS except any already-known unrelated stale expectations documented before execution. If new failures appear in Trade Board intake, fix before moving on.

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 5: Smoke harness dry run**

Run:

```powershell
npm run smoke:nic-nac:trade-board-intake
```

Expected: JSON output with `status:"not_implemented_for_live_calls"` until the live replay path is implemented in a later phase.

- [ ] **Step 6: Record verification status**

Update the relevant binder/HQ handoff only after Louis approves closeout. Include:

- passed test commands
- build result
- whether live replay is still dry-run only
- whether fixture folder exists
- remaining caveats

## Task 11: Deployment Decision Gate

**Files:**
- No code changes.

- [ ] **Step 1: Stop and ask Louis before deploying**

Do not deploy automatically. Ask Louis whether to:

- keep the work local/uncommitted,
- commit only,
- commit and push,
- deploy preview and update stable demo alias after smoke.

- [ ] **Step 2: If Louis approves deploy, follow stable demo rule**

After preview deploy, update/confirm:

`https://sparkle-suite-demo.vercel.app/`

points to the intended deployment before saying it is ready for review.

## Self-Review Checklist

- Spec coverage:
  - workflow state: Tasks 1, 3, 4, 7
  - photo roles: Tasks 1, 3, 5, 8
  - controller/model contract: Tasks 3, 5, 7
  - tool availability: Tasks 5, 6, 7
  - hard-fail eval: Tasks 2, 7, 9
  - smoke path: Task 9
  - verification: Task 10
  - deploy gate: Task 11
- Known out-of-scope for this plan:
  - full provider/model comparison
  - full browser upload automation implementation
  - production Supabase migration application
  - UI role chips/buttons beyond role inference; that belongs to Phase C
- Red flags avoided:
  - no Chrome extension changes
  - no prompt-only fix as the main solution
  - no claim that dry-run smoke equals live replay
  - no automatic deploy
