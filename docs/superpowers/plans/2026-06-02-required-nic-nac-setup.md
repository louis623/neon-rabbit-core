# Required Nic-Nac Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the post-payment first-run Sparkle Suite workspace as a required Nic-Nac chat setup flow that resumes safely, protects the Sparkle Suite brand, creates Louis light-box tasks after payment, and unlocks the full dashboard only when the customer site is presentable.

**Architecture:** Keep `/nic-nac` as the rep workspace entry point, but route unpaid reps to checkout, paid-but-incomplete reps to a branded required setup chat, and completed reps to the full workspace. Store setup progress in dedicated Supabase tables so chat history supports the experience while structured onboarding state remains the source of truth. Extend Stripe Checkout and webhook handling to collect shipping addresses, create light-box fulfillment work, and notify Louis through Telegram-backed ops alerts.

**Tech Stack:** Next.js App Router, React, CSS Modules, Supabase Auth/Postgres/RLS, Stripe Checkout/Webhooks, Vercel AI SDK, Anthropic model via AI SDK, Vitest, Playwright/browser verification, Telegram Bot HTTP API.

---

## Source Context

- Design spec: `docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md`
- Active repo: `C:\Users\louis\sparkle-suite-repo`
- Binder only: `C:\Users\louis\sparkle-suite`
- Current branch: `codex/sparkle-cross-phase-hardening`
- Current uncommitted files before execution:
  - `app/nic-nac/components/DashboardPlaceholder.module.css`
  - `docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md`

## Controller And Subagent Workflow

Codex is the controller. The controller reads this plan, assigns one task at a time, supervises implementation, runs targeted tests after each batch, and inspects the work before moving forward.

Recommended execution mode:

1. Use `superpowers:subagent-driven-development`.
2. Dispatch a fresh implementation subagent for each task below.
3. After each implementation task, dispatch a spec-compliance reviewer subagent.
4. After spec compliance passes, dispatch a code-quality reviewer subagent.
5. The controller resolves conflicts, updates the plan checkboxes, runs the verification commands, and prepares the final branch handoff.

Subagent lanes:

- Data Contracts Agent: Tasks 1 and 2.
- Checkout/Auth Agent: Tasks 3 and 4.
- Ops Alerts Agent: Task 5.
- Nic-Nac Setup Agent: Tasks 6 and 7.
- Workspace UI/Brand Agent: Tasks 8 and 9.
- QA/Inspection Agent: Task 10.

Parallelism rule:

- Task 1 and Task 5 tests can be researched in parallel because they touch different files.
- Implementation should remain sequential once files are edited because checkout, setup state, and `/nic-nac` routing depend on shared contracts.

## File Structure

Create:

- `supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql` creates durable setup and light-box tables.
- `lib/self-serve/required-setup.ts` owns setup steps, status transitions, answer persistence, and unlock checks.
- `lib/self-serve/light-box-fulfillment.ts` owns light-box task creation from Stripe sessions.
- `lib/ops/louis-alerts.ts` owns Louis notification formatting and Telegram delivery.
- `app/api/self-serve/setup-state/route.ts` exposes setup state to the workspace.
- `app/api/auth/callback/route.ts` exchanges Supabase OAuth callback codes and routes reps to checkout or setup.
- `lib/nic-nac/required-setup-prompt.ts` contains the first-run Nic-Nac setup script and completion rules.
- `lib/nic-nac/tools/get-required-setup-state.ts` lets Nic-Nac read current setup state.
- `lib/nic-nac/tools/save-required-setup-answer.ts` lets Nic-Nac save answers and complete steps.
- `lib/nic-nac/tools/request-required-setup-support.ts` lets Nic-Nac escalate setup blockers to Louis.
- `lib/nic-nac/tools/unlock-required-setup.ts` lets Nic-Nac unlock the dashboard after requirements are met.
- `app/nic-nac/components/NicNacChatBody.tsx` extracts the current chat body from `_client.tsx`.
- `app/nic-nac/components/RequiredSetupHome.tsx` renders the required setup workspace.
- `app/nic-nac/components/RequiredSetupHome.module.css` styles the required setup workspace.
- `tests/self-serve-required-setup.test.ts` covers setup state transitions.
- `tests/light-box-fulfillment.test.ts` covers light-box task creation.
- `tests/louis-alerts.test.ts` covers Telegram alert formatting and disabled-state behavior.
- `tests/self-serve-setup-state-route.test.ts` covers setup-state API access.
- `tests/auth-callback-route.test.ts` covers OAuth callback routing.
- `tests/nic-nac-required-setup-tools.test.ts` covers setup tools.
- `tests/nic-nac-required-setup-prompt.test.ts` covers first-run prompt requirements.
- `tests/nic-nac-required-setup-client.test.tsx` covers workspace routing and setup rendering.

Modify:

- `lib/self-serve/signup.ts` changes from full signup intake to tiny account creation.
- `app/api/self-serve/signup/route.ts` preserves the signup API with the smaller payload.
- `app/start/StartSparkleSuiteForm.tsx` becomes tiny account creation plus terms checkbox plus immediate checkout redirect.
- `app/start/start.module.css` aligns the start form with Sparkle Suite landing page branding.
- `app/login/_client.tsx` adds Google sign-in and branded login styling.
- `app/api/stripe/create-checkout/route.ts` collects shipping address and routes success/cancel back into the required setup path.
- `app/api/stripe/webhook/route.ts` creates light-box tasks and alerts Louis after paid subscription checkout.
- `app/nic-nac/_client.tsx` routes unpaid, required-setup, and unlocked states.
- `app/nic-nac/_shell.module.css` supports the setup shell layout.
- `app/nic-nac/components/DashboardPlaceholder.tsx` keeps the full dashboard for unlocked reps and removes first-run checklist responsibility.
- `app/nic-nac/components/DashboardPlaceholder.module.css` removes the earlier experimental first-run polish dependency and leaves full-dashboard styling consistent.
- `lib/nic-nac/auth.ts` adds a setup-mode auth path that allows paid reps in required setup while keeping full Nic-Nac access paid.
- `app/api/nic-nac/route.ts` accepts `mode: 'required_setup'` and builds the setup prompt/tools.
- `lib/nic-nac/tools/index.ts` registers the required setup intent/tool pack.
- `lib/nic-nac/prompt-builder.ts` includes the required setup prompt in setup mode only.
- `tests/self-serve-signup-route.test.ts`, `tests/self-serve-start-page.test.ts`, `tests/stripe-create-checkout-route.test.ts`, `tests/stripe-webhook-route.test.ts`, `tests/nic-nac-entry-route.test.ts`, and `tests/nic-nac-dashboard-placeholder.test.ts` are updated for the new flow.

---

## Batch 0: Preflight And Guardrails

**Assigned worker:** Controller.

**Files:**

- Read: `AGENTS.md`
- Read: `docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md`
- Read: `docs/sparkle-suite/brand/08-production-site-design-kit.md`

- [ ] **Step 0.1: Confirm workbench and branch**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo remote -v
git -C C:\Users\louis\sparkle-suite-repo branch --show-current
git -C C:\Users\louis\sparkle-suite-repo log origin/codex/sparkle-cross-phase-hardening -1 --oneline
git -C C:\Users\louis\sparkle-suite-repo status --short
```

Expected:

```text
origin  https://github.com/louis623/sparkle-suite...
codex/sparkle-cross-phase-hardening
8ca775d feat: polish public signup Nic-Nac flow
 M app/nic-nac/components/DashboardPlaceholder.module.css
?? docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md
```

- [ ] **Step 0.2: Read protected-area instructions**

Run:

```powershell
Get-Content -Path C:\Users\louis\sparkle-suite-repo\AGENTS.md
```

Expected: instructions confirm code work is allowed in `C:\Users\louis\sparkle-suite-repo` and protected Chrome extension/live queue files must not be modified.

- [ ] **Step 0.3: Confirm no extension files are in scope**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short chrome-extension
```

Expected:

```text
```

- [ ] **Step 0.4: Keep the current spec uncommitted or commit it before implementation**

If Louis wants clean checkpoints, make the first commit only the spec file:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md
git -C C:\Users\louis\sparkle-suite-repo commit -m "docs: capture required Nic-Nac setup design"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] docs: capture required Nic-Nac setup design
 1 file changed
```

If Louis prefers not to commit until implementation, leave it uncommitted and do not modify it during app work.

---

## Batch 1: Durable Required Setup State

**Assigned worker:** Data Contracts Agent.

**Purpose:** Give setup a durable source of truth so reps resume exactly where they left off after closing the browser, changing devices, or returning from checkout.

### Task 1: Add Supabase Tables

**Files:**

- Create: `supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql`
- Test by reading migration text in: `tests/self-serve-required-setup.test.ts`

- [ ] **Step 1.1: Write the migration file**

Create `supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql`:

```sql
-- Required Nic-Nac setup state for paid self-serve reps.

CREATE TABLE IF NOT EXISTS self_serve_setup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'checkout_required',
  current_step TEXT NOT NULL DEFAULT 'account_basics',
  completed_steps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  generated_copy JSONB NOT NULL DEFAULT '{}'::JSONB,
  support_state JSONB NOT NULL DEFAULT '{}'::JSONB,
  dashboard_unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT self_serve_setup_sessions_rep_unique UNIQUE (rep_id),
  CONSTRAINT self_serve_setup_sessions_status_check CHECK (
    status IN (
      'checkout_required',
      'payment_pending',
      'required_setup',
      'setup_blocked',
      'dashboard_unlocked'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_self_serve_setup_sessions_rep_id
  ON self_serve_setup_sessions(rep_id);

CREATE TABLE IF NOT EXISTS light_box_fulfillment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'needs_order',
  shipping_name TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::JSONB,
  due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  ordered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT light_box_fulfillment_tasks_session_unique UNIQUE (stripe_checkout_session_id),
  CONSTRAINT light_box_fulfillment_tasks_status_check CHECK (
    status IN ('needs_order', 'ordered', 'blocked', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_light_box_fulfillment_tasks_rep_id
  ON light_box_fulfillment_tasks(rep_id);

CREATE INDEX IF NOT EXISTS idx_light_box_fulfillment_tasks_due
  ON light_box_fulfillment_tasks(status, due_at)
  WHERE status = 'needs_order';

ALTER TABLE self_serve_setup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_box_fulfillment_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_serve_setup_sessions_rep_read" ON self_serve_setup_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE reps.id = self_serve_setup_sessions.rep_id
        AND reps.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "self_serve_setup_sessions_service_write" ON self_serve_setup_sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "light_box_fulfillment_tasks_service_only" ON light_box_fulfillment_tasks
  FOR ALL
  USING (false)
  WITH CHECK (false);
```

- [ ] **Step 1.2: Write migration text test**

Create the first tests in `tests/self-serve-required-setup.test.ts`:

```ts
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql',
  'utf8',
)

describe('required Nic-Nac setup migration', () => {
  it('creates durable setup and light-box task tables', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS self_serve_setup_sessions')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS light_box_fulfillment_tasks')
    expect(migration).toContain("'required_setup'")
    expect(migration).toContain("'dashboard_unlocked'")
    expect(migration).toContain("INTERVAL '24 hours'")
  })

  it('keeps setup readable by the owning rep and light-box tasks service-only', () => {
    expect(migration).toContain('ALTER TABLE self_serve_setup_sessions ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('self_serve_setup_sessions_rep_read')
    expect(migration).toContain('light_box_fulfillment_tasks_service_only')
  })
})
```

- [ ] **Step 1.3: Run migration test**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts
```

Expected:

```text
PASS tests/self-serve-required-setup.test.ts
```

### Task 2: Add Setup State Service

**Files:**

- Create: `lib/self-serve/required-setup.ts`
- Modify: `tests/self-serve-required-setup.test.ts`

- [ ] **Step 2.1: Extend the failing test with service behavior**

Append to `tests/self-serve-required-setup.test.ts`:

```ts
import {
  REQUIRED_SETUP_STEPS,
  canUnlockRequiredSetup,
  getNextRequiredSetupStep,
  normalizeRequiredSetupSession,
  type RequiredSetupSessionRow,
} from '@/lib/self-serve/required-setup'

describe('required setup service contract', () => {
  it('uses the approved required step order', () => {
    expect(REQUIRED_SETUP_STEPS.map((step) => step.id)).toEqual([
      'account_basics',
      'site_skin',
      'welcome_copy',
      'about_page',
      'show_schedule',
      'customer_site_orientation',
      'live_queue_orientation',
      'trade_board_orientation',
      'final_preview_approval',
    ])
  })

  it('does not require trade-board population before unlock', () => {
    expect(REQUIRED_SETUP_STEPS.map((step) => step.id)).not.toContain('trade_board_inventory')
  })

  it('selects the next incomplete required step', () => {
    expect(getNextRequiredSetupStep(['account_basics', 'site_skin'])).toBe('welcome_copy')
  })

  it('requires every required step before unlock', () => {
    const complete = REQUIRED_SETUP_STEPS.map((step) => step.id)
    expect(canUnlockRequiredSetup(complete)).toBe(true)
    expect(canUnlockRequiredSetup(complete.filter((step) => step !== 'about_page'))).toBe(false)
  })

  it('normalizes missing rows as checkout required', () => {
    const normalized = normalizeRequiredSetupSession(null)
    expect(normalized.status).toBe('checkout_required')
    expect(normalized.currentStep).toBe('account_basics')
    expect(normalized.completedSteps).toEqual([])
  })

  it('normalizes database rows into client-safe setup state', () => {
    const row: RequiredSetupSessionRow = {
      id: 'session-1',
      rep_id: 'rep-1',
      status: 'required_setup',
      current_step: 'about_page',
      completed_steps: ['account_basics'],
      answers: { displayName: 'Louis' },
      generated_copy: { aboutOptions: ['Warm and polished.'] },
      support_state: {},
      dashboard_unlocked_at: null,
      created_at: '2026-06-02T12:00:00.000Z',
      updated_at: '2026-06-02T12:00:00.000Z',
    }

    expect(normalizeRequiredSetupSession(row)).toEqual(
      expect.objectContaining({
        id: 'session-1',
        repId: 'rep-1',
        status: 'required_setup',
        currentStep: 'about_page',
        completedSteps: ['account_basics'],
        answers: { displayName: 'Louis' },
      }),
    )
  })
})
```

- [ ] **Step 2.2: Run test to verify it fails**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts
```

Expected:

```text
FAIL tests/self-serve-required-setup.test.ts
Cannot find module '@/lib/self-serve/required-setup'
```

- [ ] **Step 2.3: Implement setup state contract**

Create `lib/self-serve/required-setup.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'

export const REQUIRED_SETUP_STEPS = [
  {
    id: 'account_basics',
    label: 'Business basics',
    required: true,
  },
  {
    id: 'site_skin',
    label: 'Customer-site look',
    required: true,
  },
  {
    id: 'welcome_copy',
    label: 'Welcome copy',
    required: true,
  },
  {
    id: 'about_page',
    label: 'About page',
    required: true,
  },
  {
    id: 'show_schedule',
    label: 'Show schedule',
    required: true,
  },
  {
    id: 'customer_site_orientation',
    label: 'Customer-site orientation',
    required: true,
  },
  {
    id: 'live_queue_orientation',
    label: 'Live Queue orientation',
    required: true,
  },
  {
    id: 'trade_board_orientation',
    label: 'Trade Board orientation',
    required: true,
  },
  {
    id: 'final_preview_approval',
    label: 'Final preview approval',
    required: true,
  },
] as const

export type RequiredSetupStepId = (typeof REQUIRED_SETUP_STEPS)[number]['id']

export type RequiredSetupStatus =
  | 'checkout_required'
  | 'payment_pending'
  | 'required_setup'
  | 'setup_blocked'
  | 'dashboard_unlocked'

export interface RequiredSetupSessionRow {
  id: string
  rep_id: string
  status: RequiredSetupStatus
  current_step: RequiredSetupStepId
  completed_steps: string[]
  answers: Record<string, unknown>
  generated_copy: Record<string, unknown>
  support_state: Record<string, unknown>
  dashboard_unlocked_at: string | null
  created_at: string
  updated_at: string
}

export interface RequiredSetupState {
  id: string | null
  repId: string | null
  status: RequiredSetupStatus
  currentStep: RequiredSetupStepId
  completedSteps: RequiredSetupStepId[]
  steps: typeof REQUIRED_SETUP_STEPS
  answers: Record<string, unknown>
  generatedCopy: Record<string, unknown>
  supportState: Record<string, unknown>
  dashboardUnlockedAt: string | null
}

const REQUIRED_STEP_IDS = REQUIRED_SETUP_STEPS.map((step) => step.id)
const REQUIRED_STEP_SET = new Set<RequiredSetupStepId>(REQUIRED_STEP_IDS)

export function isRequiredSetupStepId(value: string): value is RequiredSetupStepId {
  return REQUIRED_STEP_SET.has(value as RequiredSetupStepId)
}

export function getNextRequiredSetupStep(
  completedSteps: string[],
): RequiredSetupStepId {
  return (
    REQUIRED_SETUP_STEPS.find((step) => !completedSteps.includes(step.id))?.id ??
    'final_preview_approval'
  )
}

export function canUnlockRequiredSetup(completedSteps: string[]) {
  return REQUIRED_SETUP_STEPS.every((step) => completedSteps.includes(step.id))
}

export function normalizeRequiredSetupSession(
  row: RequiredSetupSessionRow | null,
): RequiredSetupState {
  if (!row) {
    return {
      id: null,
      repId: null,
      status: 'checkout_required',
      currentStep: 'account_basics',
      completedSteps: [],
      steps: REQUIRED_SETUP_STEPS,
      answers: {},
      generatedCopy: {},
      supportState: {},
      dashboardUnlockedAt: null,
    }
  }

  const completedSteps = row.completed_steps.filter(isRequiredSetupStepId)
  return {
    id: row.id,
    repId: row.rep_id,
    status: row.status,
    currentStep: isRequiredSetupStepId(row.current_step)
      ? row.current_step
      : getNextRequiredSetupStep(completedSteps),
    completedSteps,
    steps: REQUIRED_SETUP_STEPS,
    answers: row.answers ?? {},
    generatedCopy: row.generated_copy ?? {},
    supportState: row.support_state ?? {},
    dashboardUnlockedAt: row.dashboard_unlocked_at,
  }
}

export async function getRequiredSetupState(repId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .select('*')
    .eq('rep_id', repId)
    .maybeSingle()

  if (error) throw error
  return normalizeRequiredSetupSession((data ?? null) as RequiredSetupSessionRow | null)
}

export async function ensureRequiredSetupSession(
  repId: string,
  status: RequiredSetupStatus = 'checkout_required',
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status,
        current_step: 'account_basics',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'rep_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}
```

- [ ] **Step 2.4: Run setup tests**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts
```

Expected:

```text
PASS tests/self-serve-required-setup.test.ts
```

- [ ] **Step 2.5: Commit Batch 1**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add supabase/migrations/20260602143000_ss_required_nic_nac_setup.sql lib/self-serve/required-setup.ts tests/self-serve-required-setup.test.ts
git -C C:\Users\louis\sparkle-suite-repo commit -m "feat: add required Nic-Nac setup state"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] feat: add required Nic-Nac setup state
```

---

## Batch 2: Tiny Account Creation And Google Sign-In

**Assigned worker:** Checkout/Auth Agent.

**Purpose:** Make signup feel legitimate and simple: Google or tiny email account, then Stripe Checkout. Move business/site questions into Nic-Nac setup after billing.

### Task 3: Shrink Self-Serve Signup Input

**Files:**

- Modify: `lib/self-serve/signup.ts`
- Modify: `app/api/self-serve/signup/route.ts`
- Modify: `tests/self-serve-signup-route.test.ts`

- [ ] **Step 3.1: Update signup route test expectations**

In `tests/self-serve-signup-route.test.ts`, update the success payload to only require:

```ts
body: JSON.stringify({
  displayName: 'Louis',
  email: 'louis@example.com',
  password: 'password123',
})
```

Add assertions:

```ts
expect(createUserMock).toHaveBeenCalledWith(
  expect.objectContaining({
    email: 'louis@example.com',
    password: 'password123',
    email_confirm: true,
  }),
)
expect(insertMock).toHaveBeenCalledWith(
  expect.objectContaining({
    display_name: 'Louis',
    business_name: 'Louis',
    status: 'onboarding',
  }),
)
expect(upsertMock).toHaveBeenCalledWith(
  expect.objectContaining({
    status: 'checkout_required',
    current_step: 'account_basics',
  }),
  { onConflict: 'rep_id' },
)
```

- [ ] **Step 3.2: Run signup test to verify it fails**

Run:

```powershell
npm exec vitest run tests/self-serve-signup-route.test.ts
```

Expected:

```text
FAIL tests/self-serve-signup-route.test.ts
```

The failure should show missing `businessName`, `phone`, `primarySocialUrl`, or `shopUrl` expectations from the old intake.

- [ ] **Step 3.3: Implement tiny signup schema and setup session creation**

Modify `lib/self-serve/signup.ts`:

```ts
export const SELF_SERVE_NEXT_PATH =
  '/nic-nac?onboarding=checkout-required'

const selfServeSignupSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
})
```

Inside `createSelfServeSignup`, insert the rep with deferred business fields:

```ts
.insert({
  auth_user_id: authUserId,
  email: signup.email,
  display_name: signup.displayName,
  business_name: signup.displayName,
  phone: null,
  custom_domain: null,
  shop_link: null,
  streaming_links: {
    primary: null,
    secondary: null,
  },
  social_handles: {},
  template_id: 'default',
  status: 'onboarding',
})
```

Replace the onboarding upsert with setup-session upsert:

```ts
admin.from('self_serve_setup_sessions').upsert(
  {
    rep_id: repId,
    status: 'checkout_required',
    current_step: 'account_basics',
    completed_steps: ['self_serve_account_created'],
    answers: {
      displayName: signup.displayName,
      email: signup.email,
    },
  },
  { onConflict: 'rep_id' },
)
```

Keep `site_settings` and `sms_wallet` creation so the account has a safe default shell.

- [ ] **Step 3.4: Run signup tests**

Run:

```powershell
npm exec vitest run tests/self-serve-signup-route.test.ts
```

Expected:

```text
PASS tests/self-serve-signup-route.test.ts
```

### Task 4: Update Start/Login UI And OAuth Callback

**Files:**

- Modify: `app/start/StartSparkleSuiteForm.tsx`
- Modify: `app/start/start.module.css`
- Modify: `app/login/_client.tsx`
- Create: `app/api/auth/callback/route.ts`
- Modify: `tests/self-serve-start-page.test.ts`
- Create: `tests/auth-callback-route.test.ts`

- [ ] **Step 4.1: Add tests for tiny start form**

Update `tests/self-serve-start-page.test.ts` to assert the start page includes:

```ts
expect(source).toContain('Your name')
expect(source).toContain('Email')
expect(source).toContain('Password')
expect(source).not.toContain('Business name')
expect(source).not.toContain('Primary live/social link')
expect(source).not.toContain('Shop link')
expect(source).toContain('/api/stripe/create-checkout')
expect(source).toContain('agreementAccepted: true')
```

- [ ] **Step 4.2: Add OAuth callback route test**

Create `tests/auth-callback-route.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const exchangeCodeForSessionMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

describe('GET /api/auth/callback', () => {
  it('exchanges the OAuth code and redirects to the requested path', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock.mockResolvedValue({
          error: null,
        }),
      },
    })
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      new Request('http://localhost/api/auth/callback?code=abc&next=/nic-nac'),
    )

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/nic-nac')
  })
})
```

- [ ] **Step 4.3: Run tests to verify they fail**

Run:

```powershell
npm exec vitest run tests/self-serve-start-page.test.ts tests/auth-callback-route.test.ts
```

Expected:

```text
FAIL tests/self-serve-start-page.test.ts
FAIL tests/auth-callback-route.test.ts
```

- [ ] **Step 4.4: Implement OAuth callback**

Create `app/api/auth/callback/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/nic-nac'
  const redirectUrl = new URL(next, url.origin)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', url.origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_exchange_failed', url.origin))
  }

  return NextResponse.redirect(redirectUrl)
}
```

- [ ] **Step 4.5: Implement tiny start form checkout redirect**

Modify `app/start/StartSparkleSuiteForm.tsx` so the submitted JSON is:

```ts
body: JSON.stringify({
  displayName: form.get('displayName'),
  email,
  password,
}),
```

After password sign-in succeeds, call checkout:

```ts
const checkoutResponse = await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    planType: 'monthly',
    agreementAccepted: true,
  }),
})
const checkoutPayload = (await checkoutResponse.json().catch(() => null)) as
  | { url?: string; error?: string }
  | null

if (!checkoutResponse.ok || !checkoutPayload?.url) {
  throw new Error(checkoutPayload?.error || 'Your account was created, but checkout did not open.')
}

window.location.href = checkoutPayload.url
```

Render only these fields:

```tsx
<label>
  <span>Your name</span>
  <input name="displayName" autoComplete="name" required />
</label>
<label>
  <span>Email</span>
  <input name="email" type="email" autoComplete="email" required />
</label>
<label>
  <span>Password</span>
  <input name="password" type="password" autoComplete="new-password" minLength={8} required />
</label>
```

Add the terms checkbox copy near the submit button:

```tsx
<label className={styles.termsCheck}>
  <input name="terms" type="checkbox" required />
  <span>I agree to the Sparkle Suite Terms and understand checkout comes next.</span>
</label>
```

- [ ] **Step 4.6: Add Google sign-in button**

In `app/start/StartSparkleSuiteForm.tsx`, add:

```ts
const handleGoogleStart = async () => {
  setBusy(true)
  setError(null)
  const supabase = createClient()
  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/nic-nac?onboarding=checkout-required`,
    },
  })
  if (oauthError) {
    setBusy(false)
    setError(oauthError.message)
  }
}
```

Render:

```tsx
<button type="button" className={styles.googleButton} onClick={handleGoogleStart} disabled={busy}>
  Continue with Google
</button>
```

Apply the same Google button pattern to `app/login/_client.tsx` with `next` set to the login redirect.

- [ ] **Step 4.7: Run tests**

Run:

```powershell
npm exec vitest run tests/self-serve-start-page.test.ts tests/auth-callback-route.test.ts tests/self-serve-signup-route.test.ts
```

Expected:

```text
PASS tests/self-serve-start-page.test.ts
PASS tests/auth-callback-route.test.ts
PASS tests/self-serve-signup-route.test.ts
```

- [ ] **Step 4.8: Commit Batch 2**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add lib/self-serve/signup.ts app/api/self-serve/signup/route.ts app/start/StartSparkleSuiteForm.tsx app/start/start.module.css app/login/_client.tsx app/api/auth/callback/route.ts tests/self-serve-signup-route.test.ts tests/self-serve-start-page.test.ts tests/auth-callback-route.test.ts
git -C C:\Users\louis\sparkle-suite-repo commit -m "feat: simplify signup and add Google auth path"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] feat: simplify signup and add Google auth path
```

---

## Batch 3: Stripe Checkout, Shipping Address, And Light-Box Task

**Assigned workers:** Checkout/Auth Agent and Ops Alerts Agent.

**Purpose:** Collect a shipping address at checkout, send paid reps into required setup, and create a 24-hour light-box ordering task for Louis.

### Task 5: Add Louis Alerts Service

**Files:**

- Create: `lib/ops/louis-alerts.ts`
- Create: `tests/louis-alerts.test.ts`

- [ ] **Step 5.1: Write alert service tests**

Create `tests/louis-alerts.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Louis ops alerts', () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN
  const originalChat = process.env.LOUIS_TELEGRAM_CHAT_ID

  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    process.env.TELEGRAM_BOT_TOKEN = originalToken
    process.env.LOUIS_TELEGRAM_CHAT_ID = originalChat
  })

  it('sends Telegram alerts when configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.LOUIS_TELEGRAM_CHAT_ID = '12345'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('{"ok":true}'),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { sendLouisAlert } = await import('@/lib/ops/louis-alerts')

    await sendLouisAlert({
      title: 'Order light box',
      severity: 'info',
      lines: ['Rep: Louis', 'Due: within 24 hours'],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: expect.stringContaining('Order light box'),
      }),
    )
  })

  it('logs and skips when Telegram is not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.LOUIS_TELEGRAM_CHAT_ID
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { sendLouisAlert } = await import('@/lib/ops/louis-alerts')

    await sendLouisAlert({
      title: 'Setup error',
      severity: 'error',
      lines: ['Rep: Louis'],
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(
      '[louis-alerts] Telegram alert skipped because TELEGRAM_BOT_TOKEN or LOUIS_TELEGRAM_CHAT_ID is missing.',
      expect.objectContaining({ title: 'Setup error' }),
    )
  })
})
```

- [ ] **Step 5.2: Run test to verify it fails**

Run:

```powershell
npm exec vitest run tests/louis-alerts.test.ts
```

Expected:

```text
FAIL tests/louis-alerts.test.ts
Cannot find module '@/lib/ops/louis-alerts'
```

- [ ] **Step 5.3: Implement alert service**

Create `lib/ops/louis-alerts.ts`:

```ts
export type LouisAlertSeverity = 'info' | 'warning' | 'error'

export interface LouisAlertInput {
  title: string
  severity: LouisAlertSeverity
  lines: string[]
}

function formatAlert(input: LouisAlertInput) {
  const prefix =
    input.severity === 'error'
      ? '[Sparkle Suite error]'
      : input.severity === 'warning'
        ? '[Sparkle Suite needs attention]'
        : '[Sparkle Suite]'
  return [prefix, input.title, '', ...input.lines].join('\n')
}

export async function sendLouisAlert(input: LouisAlertInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.LOUIS_TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn(
      '[louis-alerts] Telegram alert skipped because TELEGRAM_BOT_TOKEN or LOUIS_TELEGRAM_CHAT_ID is missing.',
      { title: input.title, severity: input.severity },
    )
    return { ok: false, skipped: true as const }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatAlert(input),
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Telegram alert failed: ${response.status} ${body.slice(0, 160)}`)
  }

  return { ok: true, skipped: false as const }
}
```

- [ ] **Step 5.4: Run alert tests**

Run:

```powershell
npm exec vitest run tests/louis-alerts.test.ts
```

Expected:

```text
PASS tests/louis-alerts.test.ts
```

### Task 6: Create Light-Box Fulfillment Service

**Files:**

- Create: `lib/self-serve/light-box-fulfillment.ts`
- Create: `tests/light-box-fulfillment.test.ts`

- [ ] **Step 6.1: Write light-box service tests**

Create `tests/light-box-fulfillment.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const sendLouisAlertMock = vi.fn()

vi.mock('@/lib/ops/louis-alerts', () => ({
  sendLouisAlert: (...args: unknown[]) => sendLouisAlertMock(...args),
}))

describe('light-box fulfillment', () => {
  it('creates a 24-hour order task and alerts Louis', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => {
        expect(table).toBe('light_box_fulfillment_tasks')
        return { upsert: upsertMock }
      }),
    }
    const { createLightBoxFulfillmentTask } = await import(
      '@/lib/self-serve/light-box-fulfillment'
    )

    await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'rep@example.com',
        repName: 'Louis',
        stripeCheckoutSessionId: 'cs_123',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Louis',
        shippingAddress: {
          line1: '123 Main St',
          city: 'Jacksonville',
          state: 'FL',
          postal_code: '32210',
          country: 'US',
        },
      },
      admin as never,
    )

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        stripe_checkout_session_id: 'cs_123',
        stripe_subscription_id: 'sub_123',
        status: 'needs_order',
        shipping_name: 'Louis',
        shipping_address: expect.objectContaining({ line1: '123 Main St' }),
      }),
      { onConflict: 'stripe_checkout_session_id' },
    )
    expect(sendLouisAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Order light box within 24 hours',
        severity: 'info',
        lines: expect.arrayContaining([
          'Rep: Louis <rep@example.com>',
          'Checkout: cs_123',
        ]),
      }),
    )
  })
})
```

- [ ] **Step 6.2: Run test to verify it fails**

Run:

```powershell
npm exec vitest run tests/light-box-fulfillment.test.ts
```

Expected:

```text
FAIL tests/light-box-fulfillment.test.ts
Cannot find module '@/lib/self-serve/light-box-fulfillment'
```

- [ ] **Step 6.3: Implement light-box service**

Create `lib/self-serve/light-box-fulfillment.ts`:

```ts
import { sendLouisAlert } from '@/lib/ops/louis-alerts'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface CreateLightBoxFulfillmentInput {
  repId: string
  repEmail: string
  repName: string
  stripeCheckoutSessionId: string
  stripeSubscriptionId: string | null
  paidAtIso: string
  shippingName: string | null
  shippingAddress: Record<string, unknown>
}

function formatAddress(address: Record<string, unknown>) {
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function createLightBoxFulfillmentTask(
  input: CreateLightBoxFulfillmentInput,
  admin: AdminClient = createAdminClient(),
) {
  const now = new Date(input.paidAtIso)
  const dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const { error } = await admin.from('light_box_fulfillment_tasks').upsert(
    {
      rep_id: input.repId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_subscription_id: input.stripeSubscriptionId,
      status: 'needs_order',
      shipping_name: input.shippingName,
      shipping_address: input.shippingAddress,
      due_at: dueAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_checkout_session_id' },
  )

  if (error) throw error

  await sendLouisAlert({
    title: 'Order light box within 24 hours',
    severity: 'info',
    lines: [
      `Rep: ${input.repName} <${input.repEmail}>`,
      `Rep ID: ${input.repId}`,
      `Checkout: ${input.stripeCheckoutSessionId}`,
      `Paid: ${input.paidAtIso}`,
      `Due: ${dueAt}`,
      `Ship to: ${input.shippingName ?? 'Name not provided'}`,
      formatAddress(input.shippingAddress),
    ].filter((line) => line.trim().length > 0),
  })
}
```

- [ ] **Step 6.4: Run light-box tests**

Run:

```powershell
npm exec vitest run tests/light-box-fulfillment.test.ts tests/louis-alerts.test.ts
```

Expected:

```text
PASS tests/light-box-fulfillment.test.ts
PASS tests/louis-alerts.test.ts
```

### Task 7: Update Stripe Checkout And Webhook

**Files:**

- Modify: `app/api/stripe/create-checkout/route.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Modify: `tests/stripe-create-checkout-route.test.ts`
- Modify: `tests/stripe-webhook-route.test.ts`

- [ ] **Step 7.1: Update create-checkout tests**

In `tests/stripe-create-checkout-route.test.ts`, update the default checkout assertion:

```ts
expect(createMock).toHaveBeenCalledWith(
  expect.objectContaining({
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    phone_number_collection: {
      enabled: true,
    },
    success_url:
      'https://sparkle-suite.example/nic-nac?onboarding=required-setup&billing=subscription-success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url:
      'https://sparkle-suite.example/nic-nac?onboarding=checkout-required&billing=subscription-cancelled',
  }),
)
```

- [ ] **Step 7.2: Update webhook test for light-box task**

In `tests/stripe-webhook-route.test.ts`, add mock:

```ts
const createLightBoxFulfillmentTaskMock = vi.fn()

vi.mock('@/lib/self-serve/light-box-fulfillment', () => ({
  createLightBoxFulfillmentTask: (...args: unknown[]) =>
    createLightBoxFulfillmentTaskMock(...args),
}))
```

Extend the subscription checkout event with shipping:

```ts
customer_details: {
  name: 'Louis',
  email: 'rep@example.com',
},
shipping_details: {
  name: 'Louis',
  address: {
    line1: '123 Main St',
    city: 'Jacksonville',
    state: 'FL',
    postal_code: '32210',
    country: 'US',
  },
},
```

Make the admin mock return rep email/name after subscription handling:

```ts
if (table === 'reps') {
  return {
    update: repsUpdateMock,
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'rep-founder',
            email: 'rep@example.com',
            display_name: 'Louis',
          },
          error: null,
        }),
      })),
    })),
  }
}
```

Assert:

```ts
expect(createLightBoxFulfillmentTaskMock).toHaveBeenCalledWith(
  expect.objectContaining({
    repId: 'rep-founder',
    repEmail: 'rep@example.com',
    repName: 'Louis',
    stripeCheckoutSessionId: 'cs_verified',
    stripeSubscriptionId: 'sub_verified',
    shippingName: 'Louis',
    shippingAddress: expect.objectContaining({ line1: '123 Main St' }),
  }),
  admin,
)
```

- [ ] **Step 7.3: Run Stripe tests to verify they fail**

Run:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts
```

Expected:

```text
FAIL tests/stripe-create-checkout-route.test.ts
FAIL tests/stripe-webhook-route.test.ts
```

- [ ] **Step 7.4: Implement checkout shipping and setup URLs**

Modify `app/api/stripe/create-checkout/route.ts` session creation:

```ts
shipping_address_collection: {
  allowed_countries: ['US'],
},
phone_number_collection: {
  enabled: true,
},
success_url: `${getAppUrl()}/nic-nac?onboarding=required-setup&billing=subscription-success&session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${getAppUrl()}/nic-nac?onboarding=checkout-required&billing=subscription-cancelled`,
metadata: {
  rep_id: repId,
  plan_type: planType,
  first_run_setup: 'required_nic_nac',
  light_box_required: 'true',
  ...agreementMetadata,
  ...pricing.metadata,
},
```

Apply the same `first_run_setup` and `light_box_required` metadata to `subscription_data.metadata`.

- [ ] **Step 7.5: Implement webhook setup state and light-box task**

Modify `app/api/stripe/webhook/route.ts`:

```ts
import { createLightBoxFulfillmentTask } from '@/lib/self-serve/light-box-fulfillment'
```

After `subscriptions.upsert` succeeds in `handleCheckoutCompleted`, add:

```ts
await admin.from('self_serve_setup_sessions').upsert(
  {
    rep_id: repId,
    status: 'required_setup',
    current_step: 'account_basics',
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'rep_id' },
)

const { data: repForAlert, error: repForAlertError } = await admin
  .from('reps')
  .select('id, email, display_name')
  .eq('id', repId)
  .single()

if (repForAlertError) throw repForAlertError

await createLightBoxFulfillmentTask(
  {
    repId,
    repEmail: repForAlert.email,
    repName: repForAlert.display_name,
    stripeCheckoutSessionId: session.id,
    stripeSubscriptionId:
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id,
    paidAtIso: new Date(event.created * 1000).toISOString(),
    shippingName: session.shipping_details?.name ?? session.customer_details?.name ?? null,
    shippingAddress: (session.shipping_details?.address ?? {}) as Record<string, unknown>,
  },
  admin,
)
```

- [ ] **Step 7.6: Run Stripe and light-box tests**

Run:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/light-box-fulfillment.test.ts
```

Expected:

```text
PASS tests/stripe-create-checkout-route.test.ts
PASS tests/stripe-webhook-route.test.ts
PASS tests/light-box-fulfillment.test.ts
```

- [ ] **Step 7.7: Commit Batch 3**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add lib/ops/louis-alerts.ts lib/self-serve/light-box-fulfillment.ts app/api/stripe/create-checkout/route.ts app/api/stripe/webhook/route.ts tests/louis-alerts.test.ts tests/light-box-fulfillment.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts
git -C C:\Users\louis\sparkle-suite-repo commit -m "feat: collect shipping and create light box tasks"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] feat: collect shipping and create light box tasks
```

---

## Batch 4: Required Setup API And Nic-Nac Tools

**Assigned worker:** Nic-Nac Setup Agent.

**Purpose:** Let the UI and Nic-Nac read, save, complete, escalate, and unlock required setup in structured state.

### Task 8: Setup State API

**Files:**

- Create: `app/api/self-serve/setup-state/route.ts`
- Create: `tests/self-serve-setup-state-route.test.ts`
- Modify: `lib/self-serve/required-setup.ts`

- [ ] **Step 8.1: Add route tests**

Create `tests/self-serve-setup-state-route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const getRequiredSetupStateMock = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/self-serve/required-setup', () => ({
  getRequiredSetupState: (...args: unknown[]) => getRequiredSetupStateMock(...args),
}))

describe('/api/self-serve/setup-state', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    getRequiredSetupStateMock.mockReset()
  })

  it('returns setup state for authenticated reps', async () => {
    getAuthenticatedRepMock.mockResolvedValue({ repId: 'rep-1', rep: { id: 'rep-1' } })
    getRequiredSetupStateMock.mockResolvedValue({
      status: 'required_setup',
      currentStep: 'account_basics',
      completedSteps: [],
    })
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      state: {
        status: 'required_setup',
        currentStep: 'account_basics',
        completedSteps: [],
      },
    })
  })
})
```

- [ ] **Step 8.2: Implement route**

Create `app/api/self-serve/setup-state/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const state = await getRequiredSetupState(repId)
    return NextResponse.json({ state })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[self-serve/setup-state] Error:', error)
    return NextResponse.json({ error: 'Failed to load setup state' }, { status: 500 })
  }
}
```

- [ ] **Step 8.3: Add mutation functions to setup service**

Add to `lib/self-serve/required-setup.ts`:

```ts
export async function saveRequiredSetupAnswer({
  repId,
  stepId,
  answer,
  generatedCopy,
}: {
  repId: string
  stepId: RequiredSetupStepId
  answer: Record<string, unknown>
  generatedCopy?: Record<string, unknown>
}) {
  const state = await getRequiredSetupState(repId)
  const nextAnswers = { ...state.answers, [stepId]: answer }
  const nextGeneratedCopy = generatedCopy
    ? { ...state.generatedCopy, [stepId]: generatedCopy }
    : state.generatedCopy
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status: state.status === 'dashboard_unlocked' ? state.status : 'required_setup',
        current_step: stepId,
        answers: nextAnswers,
        generated_copy: nextGeneratedCopy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'rep_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}

export async function completeRequiredSetupStep(repId: string, stepId: RequiredSetupStepId) {
  const state = await getRequiredSetupState(repId)
  const completed = Array.from(new Set([...state.completedSteps, stepId]))
  const nextStep = getNextRequiredSetupStep(completed)
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status: canUnlockRequiredSetup(completed) ? 'required_setup' : 'required_setup',
        current_step: nextStep,
        completed_steps: completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'rep_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}

export async function unlockRequiredSetup(repId: string) {
  const state = await getRequiredSetupState(repId)
  if (!canUnlockRequiredSetup(state.completedSteps)) {
    throw new Error('Required setup cannot unlock until every required step is complete.')
  }
  const now = new Date().toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .update({
      status: 'dashboard_unlocked',
      current_step: 'final_preview_approval',
      dashboard_unlocked_at: now,
      updated_at: now,
    })
    .eq('rep_id', repId)
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}
```

- [ ] **Step 8.4: Run route and setup tests**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/self-serve-setup-state-route.test.ts
```

Expected:

```text
PASS tests/self-serve-required-setup.test.ts
PASS tests/self-serve-setup-state-route.test.ts
```

### Task 9: Required Setup Nic-Nac Tools And Prompt

**Files:**

- Create: `lib/nic-nac/required-setup-prompt.ts`
- Create: `lib/nic-nac/tools/get-required-setup-state.ts`
- Create: `lib/nic-nac/tools/save-required-setup-answer.ts`
- Create: `lib/nic-nac/tools/request-required-setup-support.ts`
- Create: `lib/nic-nac/tools/unlock-required-setup.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `app/api/nic-nac/route.ts`
- Create: `tests/nic-nac-required-setup-tools.test.ts`
- Create: `tests/nic-nac-required-setup-prompt.test.ts`
- Modify: `tests/nic-nac/tool-routing.test.ts`

- [ ] **Step 9.1: Add prompt tests**

Create `tests/nic-nac-required-setup-prompt.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildRequiredSetupPrompt } from '@/lib/nic-nac/required-setup-prompt'

describe('required Nic-Nac setup prompt', () => {
  it('requires chat-based setup and brand-safe unlock', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('one question at a time')
    expect(prompt).toContain('Do not unlock the full dashboard until every required setup step is complete')
    expect(prompt).toContain('About page')
    expect(prompt).toContain('Trade Board orientation')
    expect(prompt).toContain('The light box is ordered by Sparkle Suite after payment')
    expect(prompt).not.toContain('populate the Trade Board before unlock')
  })
})
```

- [ ] **Step 9.2: Add tool tests**

Create `tests/nic-nac-required-setup-tools.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const getRequiredSetupStateMock = vi.fn()
const saveRequiredSetupAnswerMock = vi.fn()
const completeRequiredSetupStepMock = vi.fn()
const unlockRequiredSetupMock = vi.fn()
const sendLouisAlertMock = vi.fn()

vi.mock('@/lib/self-serve/required-setup', () => ({
  getRequiredSetupState: (...args: unknown[]) => getRequiredSetupStateMock(...args),
  saveRequiredSetupAnswer: (...args: unknown[]) => saveRequiredSetupAnswerMock(...args),
  completeRequiredSetupStep: (...args: unknown[]) => completeRequiredSetupStepMock(...args),
  unlockRequiredSetup: (...args: unknown[]) => unlockRequiredSetupMock(...args),
}))

vi.mock('@/lib/ops/louis-alerts', () => ({
  sendLouisAlert: (...args: unknown[]) => sendLouisAlertMock(...args),
}))

function ctx() {
  return {
    repId: 'rep-1',
    conversationId: 'conv-1',
    runId: 'run-1',
    supabase: {} as never,
  }
}

describe('required setup tools', () => {
  it('reads required setup state', async () => {
    getRequiredSetupStateMock.mockResolvedValue({ status: 'required_setup' })
    const { getRequiredSetupStateTool } = await import(
      '@/lib/nic-nac/tools/get-required-setup-state'
    )
    const tool = getRequiredSetupStateTool.build(ctx())

    await expect(tool.execute({})).resolves.toEqual({ status: 'required_setup' })
    expect(getRequiredSetupStateMock).toHaveBeenCalledWith('rep-1')
  })

  it('saves an answer and completes the step when requested', async () => {
    saveRequiredSetupAnswerMock.mockResolvedValue({ currentStep: 'account_basics' })
    completeRequiredSetupStepMock.mockResolvedValue({ currentStep: 'site_skin' })
    const { saveRequiredSetupAnswerTool } = await import(
      '@/lib/nic-nac/tools/save-required-setup-answer'
    )
    const tool = saveRequiredSetupAnswerTool.build(ctx())

    await tool.execute({
      stepId: 'account_basics',
      answer: { businessName: 'Sparkle Test' },
      completeStep: true,
    })

    expect(saveRequiredSetupAnswerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repId: 'rep-1',
        stepId: 'account_basics',
      }),
    )
    expect(completeRequiredSetupStepMock).toHaveBeenCalledWith('rep-1', 'account_basics')
  })

  it('alerts Louis for setup blockers', async () => {
    const { requestRequiredSetupSupportTool } = await import(
      '@/lib/nic-nac/tools/request-required-setup-support'
    )
    const tool = requestRequiredSetupSupportTool.build(ctx())

    await tool.execute({
      reason: 'Rep cannot preview site',
      severity: 'error',
    })

    expect(sendLouisAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nic-Nac setup needs Louis',
        severity: 'error',
      }),
    )
  })
})
```

- [ ] **Step 9.3: Add routing test**

Append to `tests/nic-nac/tool-routing.test.ts`:

```ts
it('routes required setup mode to setup tools only', () => {
  const names = listToolNamesForIntents(['required_setup'])

  expect(names).toEqual([
    'get_required_setup_state',
    'save_required_setup_answer',
    'request_required_setup_support',
    'unlock_required_setup',
  ])
})
```

- [ ] **Step 9.4: Run tests to verify they fail**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac/tool-routing.test.ts
```

Expected:

```text
FAIL tests/nic-nac-required-setup-tools.test.ts
FAIL tests/nic-nac-required-setup-prompt.test.ts
FAIL tests/nic-nac/tool-routing.test.ts
```

- [ ] **Step 9.5: Implement required setup prompt**

Create `lib/nic-nac/required-setup-prompt.ts`:

```ts
export function buildRequiredSetupPrompt() {
  return `Required Nic-Nac setup mode:
- This is the paid rep's first workspace experience after Stripe checkout.
- Keep the experience in chat. Ask one question at a time.
- Do not send the rep to a grid of cards or different dashboard sections.
- Do not unlock the full dashboard until every required setup step is complete and the rep has approved the final preview.
- Use plain, warm, Sparkle Suite language. Avoid internal implementation language.
- Save each meaningful answer with save_required_setup_answer.
- Use get_required_setup_state before deciding where to resume.
- If a setup error prevents progress and you cannot fix it, call request_required_setup_support and tell the rep Louis has been notified.

Required setup order:
1. Business basics: display name, business name, best contact detail, shop link, and primary live/social link.
2. Customer-site look: pick or confirm the customer-site skin.
3. Welcome copy: tagline, banner, and customer-facing intro.
4. About page: invite the rep to free-talk, then turn that into 2 or 3 polished About page choices.
5. Show schedule: capture regular schedule or the answer "I do not have a regular schedule yet."
6. Customer-site orientation: explain what customers see and how the rep can ask Nic-Nac to update it.
7. Live Queue orientation: explain what Live Queue does in a short course-style answer.
8. Trade Board orientation: teach how Trade Board works. The light box is ordered by Sparkle Suite after payment and helps with photos when a piece is not in the master jewelry library. Do not require the rep to populate the Trade Board before unlock.
9. Final preview approval: summarize the chosen setup, direct the rep to preview, and unlock only when the site is presentable.

After unlock:
- Call unlock_required_setup only after the required setup state shows every required step complete.
- Congratulate briefly and tell the rep the full workspace is ready.`
}
```

- [ ] **Step 9.6: Implement required setup tools**

Each tool follows the existing `ToolDefinition` pattern from `lib/nic-nac/tools/types.ts`.

Create `lib/nic-nac/tools/get-required-setup-state.ts`:

```ts
import { tool } from 'ai'
import { z } from 'zod'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

export const getRequiredSetupStateTool: ToolDefinition = {
  name: 'get_required_setup_state',
  readOnly: true,
  build: (ctx) =>
    tool({
      description: 'Read the current required Nic-Nac setup state for this rep.',
      inputSchema: z.object({}),
      execute: async () => getRequiredSetupState(ctx.repId),
    }),
}
```

Create `lib/nic-nac/tools/save-required-setup-answer.ts`:

```ts
import { tool } from 'ai'
import { z } from 'zod'
import {
  completeRequiredSetupStep,
  saveRequiredSetupAnswer,
} from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

export const saveRequiredSetupAnswerTool: ToolDefinition = {
  name: 'save_required_setup_answer',
  readOnly: false,
  build: (ctx) =>
    tool({
      description: 'Save a setup answer and optionally mark the current required setup step complete.',
      inputSchema: z.object({
        stepId: z.enum([
          'account_basics',
          'site_skin',
          'welcome_copy',
          'about_page',
          'show_schedule',
          'customer_site_orientation',
          'live_queue_orientation',
          'trade_board_orientation',
          'final_preview_approval',
        ]),
        answer: z.record(z.string(), z.unknown()),
        generatedCopy: z.record(z.string(), z.unknown()).optional(),
        completeStep: z.boolean().default(false),
      }),
      execute: async (input) => {
        const saved = await saveRequiredSetupAnswer({
          repId: ctx.repId,
          stepId: input.stepId,
          answer: input.answer,
          generatedCopy: input.generatedCopy,
        })
        if (!input.completeStep) return saved
        return completeRequiredSetupStep(ctx.repId, input.stepId)
      },
    }),
}
```

Create `lib/nic-nac/tools/request-required-setup-support.ts`:

```ts
import { tool } from 'ai'
import { z } from 'zod'
import { sendLouisAlert } from '@/lib/ops/louis-alerts'
import type { ToolDefinition } from './types'

export const requestRequiredSetupSupportTool: ToolDefinition = {
  name: 'request_required_setup_support',
  readOnly: false,
  build: (ctx) =>
    tool({
      description: 'Notify Louis immediately when required setup is blocked.',
      inputSchema: z.object({
        reason: z.string().min(3),
        severity: z.enum(['warning', 'error']).default('warning'),
      }),
      execute: async (input) => {
        await sendLouisAlert({
          title: 'Nic-Nac setup needs Louis',
          severity: input.severity,
          lines: [
            `Rep ID: ${ctx.repId}`,
            `Conversation: ${ctx.conversationId}`,
            `Run: ${ctx.runId}`,
            `Reason: ${input.reason}`,
          ],
        })
        return { ok: true }
      },
    }),
}
```

Create `lib/nic-nac/tools/unlock-required-setup.ts`:

```ts
import { tool } from 'ai'
import { z } from 'zod'
import { unlockRequiredSetup } from '@/lib/self-serve/required-setup'
import type { ToolDefinition } from './types'

export const unlockRequiredSetupTool: ToolDefinition = {
  name: 'unlock_required_setup',
  readOnly: false,
  build: (ctx) =>
    tool({
      description: 'Unlock the full Sparkle Suite workspace after required setup is complete.',
      inputSchema: z.object({
        repApprovedPreview: z.boolean(),
      }),
      execute: async (input) => {
        if (!input.repApprovedPreview) {
          throw new Error('The rep must approve the final preview before unlock.')
        }
        return unlockRequiredSetup(ctx.repId)
      },
    }),
}
```

- [ ] **Step 9.7: Register setup intent and prompt mode**

Modify `lib/nic-nac/tools/index.ts`:

```ts
import { getRequiredSetupStateTool } from './get-required-setup-state'
import { saveRequiredSetupAnswerTool } from './save-required-setup-answer'
import { requestRequiredSetupSupportTool } from './request-required-setup-support'
import { unlockRequiredSetupTool } from './unlock-required-setup'
```

Add those tools to `REGISTRY`.

Extend `NicNacToolIntent`:

```ts
| 'required_setup'
```

Add `TOOL_PACKS.required_setup`:

```ts
required_setup: [
  'get_required_setup_state',
  'save_required_setup_answer',
  'request_required_setup_support',
  'unlock_required_setup',
],
```

Modify `lib/nic-nac/prompt-builder.ts` to accept optional `mode`:

```ts
type BuildPromptInput = {
  intents: NicNacToolIntent[]
  activeToolNames: string[]
  mode?: 'workspace' | 'required_setup'
}
```

When `mode === 'required_setup'`, include `buildRequiredSetupPrompt()` and skip unrelated intent sections unless `required_setup` is active.

- [ ] **Step 9.8: Modify `/api/nic-nac` request body for setup mode**

In `app/api/nic-nac/route.ts`, extend `PostBody`:

```ts
interface PostBody {
  conversationId: string
  messages: UIMessage[]
  mode?: 'workspace' | 'required_setup'
}
```

Use:

```ts
const mode = body.mode === 'required_setup' ? 'required_setup' : 'workspace'
const toolIntents =
  mode === 'required_setup'
    ? (['required_setup'] as const)
    : getToolIntentsForMessages(messages)
const systemPrompt = buildNicNacSystemPrompt({
  intents: toolIntents,
  activeToolNames,
  mode,
})
```

- [ ] **Step 9.9: Run Nic-Nac setup tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac/tool-routing.test.ts
```

Expected:

```text
PASS tests/nic-nac-required-setup-tools.test.ts
PASS tests/nic-nac-required-setup-prompt.test.ts
PASS tests/nic-nac/tool-routing.test.ts
```

- [ ] **Step 9.10: Commit Batch 4**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add app/api/self-serve/setup-state/route.ts lib/self-serve/required-setup.ts lib/nic-nac/required-setup-prompt.ts lib/nic-nac/tools/get-required-setup-state.ts lib/nic-nac/tools/save-required-setup-answer.ts lib/nic-nac/tools/request-required-setup-support.ts lib/nic-nac/tools/unlock-required-setup.ts lib/nic-nac/tools/index.ts lib/nic-nac/prompt-builder.ts app/api/nic-nac/route.ts tests/self-serve-setup-state-route.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac/tool-routing.test.ts
git -C C:\Users\louis\sparkle-suite-repo commit -m "feat: add required setup Nic-Nac tools"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] feat: add required setup Nic-Nac tools
```

---

## Batch 5: Branded Required Setup Workspace UI

**Assigned worker:** Workspace UI/Brand Agent.

**Purpose:** Replace the confusing first-run dashboard checklist with one seamless Sparkle Suite setup home centered on Nic-Nac chat.

### Task 10: Extract Reusable Chat Body

**Files:**

- Create: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify: `app/nic-nac/_client.tsx`
- Modify: `tests/nic-nac-required-setup-client.test.tsx`

- [ ] **Step 10.1: Create extraction test**

Create `tests/nic-nac-required-setup-client.test.tsx`:

```ts
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

const client = readFileSync('app/nic-nac/_client.tsx', 'utf8')

describe('Nic-Nac required setup client', () => {
  it('uses a reusable chat body component', () => {
    expect(client).toContain("from './components/NicNacChatBody'")
    expect(client).not.toContain('function ChatBody(')
  })
})
```

- [ ] **Step 10.2: Extract chat body**

Move `ChatBody`, `UserMessage`, `AssistantMessage`, `readCreatedAt`, `findLatestUserMessageId`, `findLatestUserMessage`, and `isFirstNicNacInRun` from `app/nic-nac/_client.tsx` into `app/nic-nac/components/NicNacChatBody.tsx`.

Export:

```ts
export function NicNacChatBody({
  conversationId,
  transport,
  initialMessages,
  onChatStateChange,
  onRolloverRecommended,
}: {
  conversationId: string
  transport: DefaultChatTransport<UIMessage>
  initialMessages: UIMessage[]
  onChatStateChange: (s: { isStreaming: boolean; hasPendingApproval: boolean }) => void
  onRolloverRecommended: (conversationId: string) => Promise<boolean>
  resetSignal: string
}) {
  // Existing ChatBody implementation moved here without behavior changes.
}
```

Replace `_client.tsx` usage:

```tsx
<NicNacChatBody
  key={conversationId}
  conversationId={conversationId!}
  transport={transport!}
  initialMessages={initialMessages!}
  onChatStateChange={setChatState}
  onRolloverRecommended={rolloverConversation}
  resetSignal={conversationId!}
/>
```

- [ ] **Step 10.3: Run extraction test**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-client.test.tsx
```

Expected:

```text
PASS tests/nic-nac-required-setup-client.test.tsx
```

### Task 11: Render Required Setup Home

**Files:**

- Create: `app/nic-nac/components/RequiredSetupHome.tsx`
- Create: `app/nic-nac/components/RequiredSetupHome.module.css`
- Modify: `app/nic-nac/_client.tsx`
- Modify: `app/nic-nac/_shell.module.css`
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Modify: `app/nic-nac/components/DashboardPlaceholder.module.css`
- Modify: `tests/nic-nac-required-setup-client.test.tsx`
- Modify: `tests/nic-nac-dashboard-placeholder.test.ts`
- Modify: `tests/nic-nac-branding.test.ts`

- [ ] **Step 11.1: Add client routing tests**

Append to `tests/nic-nac-required-setup-client.test.tsx`:

```ts
describe('required setup routing', () => {
  it('loads setup state and renders RequiredSetupHome before the full dashboard', () => {
    expect(client).toContain('/api/self-serve/setup-state')
    expect(client).toContain('RequiredSetupHome')
    expect(client).toContain("mode: 'required_setup'")
  })

  it('does not use the old self-serve-started onboarding mode', () => {
    expect(client).not.toContain("onboarding') === 'self-serve-started'")
  })
})
```

- [ ] **Step 11.2: Add brand text/style tests**

Update `tests/nic-nac-branding.test.ts` to read `RequiredSetupHome.module.css` and assert:

```ts
expect(css).toContain('#402924')
expect(css).toContain('#36221d')
expect(css).toContain('#ee2c9b')
expect(css).toContain('Playfair Display')
expect(css).toContain('DM Sans')
```

- [ ] **Step 11.3: Implement `RequiredSetupHome`**

Create `app/nic-nac/components/RequiredSetupHome.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { RequiredSetupState } from '@/lib/self-serve/required-setup'
import { NicNacGlyph } from './NicNacGlyph'
import styles from './RequiredSetupHome.module.css'

export function RequiredSetupHome({
  state,
  chat,
}: {
  state: RequiredSetupState
  chat: ReactNode
}) {
  const completed = state.completedSteps.length
  const total = state.steps.length

  return (
    <main className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.brandRow}>
          <span className={styles.mark}>S</span>
          <div>
            <p>Sparkle Suite</p>
            <h1>Set up with Nic-Nac</h1>
          </div>
        </div>
        <div className={styles.copy}>
          <p className={styles.kicker}>Paid setup</p>
          <h2>One conversation, one step at a time.</h2>
          <p>
            Nic-Nac will help shape the public site, teach the workspace, and unlock the full dashboard when everything is polished enough to represent your business and Sparkle Suite.
          </p>
        </div>
        <div className={styles.progressShell}>
          <span>{completed} of {total}</span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round((completed / total) * 100)}%` }}
            />
          </div>
        </div>
      </section>
      <section className={styles.chatPanel} aria-label="Nic-Nac required setup chat">
        <header className={styles.chatHeader}>
          <NicNacGlyph size={34} />
          <div>
            <p>Nic-Nac</p>
            <span>Required setup resumes automatically</span>
          </div>
        </header>
        <div className={styles.chatBody}>{chat}</div>
      </section>
    </main>
  )
}
```

- [ ] **Step 11.4: Implement required setup styles**

Create `app/nic-nac/components/RequiredSetupHome.module.css` with:

```css
.root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(420px, 1.18fr);
  background:
    radial-gradient(circle at top left, rgba(238, 44, 155, 0.16), transparent 34rem),
    linear-gradient(135deg, #fff8fb 0%, #f8efe9 42%, #402924 100%);
  color: #402924;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.hero {
  padding: clamp(1.5rem, 4vw, 4rem);
  display: grid;
  align-content: space-between;
  gap: 2rem;
}

.brandRow {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.mark {
  width: 2.85rem;
  height: 2.85rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(238, 44, 155, 0.32);
  background: rgba(255, 255, 255, 0.78);
  color: #ee2c9b;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.35rem;
}

.brandRow p,
.kicker,
.chatHeader p {
  margin: 0;
  color: #7b5c55;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brandRow h1,
.copy h2 {
  margin: 0;
  font-family: 'Playfair Display', Georgia, serif;
  color: #402924;
  letter-spacing: 0;
}

.brandRow h1 {
  font-size: 1.35rem;
}

.copy {
  display: grid;
  gap: 0.85rem;
  max-width: 34rem;
}

.copy h2 {
  font-size: clamp(2.4rem, 5vw, 4.8rem);
  line-height: 0.96;
}

.copy p:last-child {
  margin: 0;
  max-width: 31rem;
  color: #654944;
  line-height: 1.7;
}

.progressShell {
  max-width: 28rem;
  display: grid;
  gap: 0.7rem;
  color: #402924;
  font-weight: 800;
}

.progressTrack {
  height: 0.55rem;
  border-radius: 999px;
  background: rgba(64, 41, 36, 0.12);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff4cae, #d81b87);
}

.chatPanel {
  min-height: calc(100vh - 2rem);
  margin: 1rem;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border: 1px solid rgba(64, 41, 36, 0.14);
  border-radius: 8px;
  background: rgba(255, 252, 250, 0.94);
  box-shadow: 0 24px 70px rgba(64, 41, 36, 0.2);
}

.chatHeader {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(64, 41, 36, 0.1);
}

.chatHeader span {
  display: block;
  margin-top: 0.15rem;
  color: #7b5c55;
  font-size: 0.88rem;
}

.chatBody {
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto auto;
}

@media (max-width: 900px) {
  .root {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: auto;
  }

  .copy h2 {
    font-size: 2.6rem;
  }

  .chatPanel {
    min-height: 70vh;
  }
}
```

- [ ] **Step 11.5: Route `/nic-nac` to setup home**

Modify `app/nic-nac/_client.tsx`:

1. Fetch setup state from `/api/self-serve/setup-state`.
2. Treat `status === 'checkout_required'` or URL `onboarding=checkout-required` as checkout-required mode.
3. Treat `status === 'required_setup'` or `status === 'setup_blocked'` as required setup mode.
4. Treat `status === 'dashboard_unlocked'` as full dashboard mode.
5. Pass `mode: 'required_setup'` in `DefaultChatTransport.prepareSendMessagesRequest` while required setup mode is active.
6. Render `RequiredSetupHome` instead of `DashboardPlaceholder` during setup.

The transport body should become:

```ts
body: {
  conversationId,
  messages,
  mode: isRequiredSetupMode ? 'required_setup' : 'workspace',
},
```

The setup render should be:

```tsx
if (isRequiredSetupMode && setupState) {
  return (
    <div className={shellStyles.root}>
      <RequiredSetupHome state={setupState} chat={chatContent} />
    </div>
  )
}
```

For checkout-required mode, render one focused panel with a single button that calls `/api/stripe/create-checkout` using `{ planType: 'monthly', agreementAccepted: true }`.

- [ ] **Step 11.6: Remove first-run checklist responsibility**

Modify `app/nic-nac/components/DashboardPlaceholder.tsx`:

- Keep full-dashboard sections for unlocked reps.
- Remove `onboarding=self-serve-started` special-casing.
- Remove the setup checklist card from being the default first-run route.
- Keep account/billing section available in full dashboard.
- Keep team management visible only as locked or coming soon.

Modify `DashboardPlaceholder.module.css` to keep full dashboard styling aligned with the brand but not rely on the earlier experimental first-run polish as the main onboarding experience.

- [ ] **Step 11.7: Run UI/static tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-client.test.tsx tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-branding.test.ts
```

Expected:

```text
PASS tests/nic-nac-required-setup-client.test.tsx
PASS tests/nic-nac-dashboard-placeholder.test.ts
PASS tests/nic-nac-branding.test.ts
```

- [ ] **Step 11.8: Commit Batch 5**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo add app/nic-nac/_client.tsx app/nic-nac/_shell.module.css app/nic-nac/components/NicNacChatBody.tsx app/nic-nac/components/RequiredSetupHome.tsx app/nic-nac/components/RequiredSetupHome.module.css app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/DashboardPlaceholder.module.css tests/nic-nac-required-setup-client.test.tsx tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-branding.test.ts
git -C C:\Users\louis\sparkle-suite-repo commit -m "feat: add branded required setup workspace"
```

Expected:

```text
[codex/sparkle-cross-phase-hardening <sha>] feat: add branded required setup workspace
```

---

## Batch 6: Integration Verification And Visual Review

**Assigned worker:** QA/Inspection Agent, then Controller.

**Purpose:** Prove the flow works, looks seamless with Sparkle Suite, and does not regress existing paid workspace behavior.

### Task 12: Run Focused Test Suite

**Files:**

- Verify only; no source edits expected unless tests fail.

- [ ] **Step 12.1: Run self-serve and checkout tests**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/self-serve-setup-state-route.test.ts tests/self-serve-signup-route.test.ts tests/self-serve-start-page.test.ts tests/auth-callback-route.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/light-box-fulfillment.test.ts tests/louis-alerts.test.ts
```

Expected:

```text
PASS tests/self-serve-required-setup.test.ts
PASS tests/self-serve-setup-state-route.test.ts
PASS tests/self-serve-signup-route.test.ts
PASS tests/self-serve-start-page.test.ts
PASS tests/auth-callback-route.test.ts
PASS tests/stripe-create-checkout-route.test.ts
PASS tests/stripe-webhook-route.test.ts
PASS tests/light-box-fulfillment.test.ts
PASS tests/louis-alerts.test.ts
```

- [ ] **Step 12.2: Run Nic-Nac tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-client.test.tsx tests/nic-nac/tool-routing.test.ts tests/nic-nac-entry-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-branding.test.ts
```

Expected:

```text
PASS tests/nic-nac-required-setup-tools.test.ts
PASS tests/nic-nac-required-setup-prompt.test.ts
PASS tests/nic-nac-required-setup-client.test.tsx
PASS tests/nic-nac/tool-routing.test.ts
PASS tests/nic-nac-entry-route.test.ts
PASS tests/nic-nac-dashboard-placeholder.test.ts
PASS tests/nic-nac-branding.test.ts
```

- [ ] **Step 12.3: Run build**

Run:

```powershell
npm run build
```

Expected:

```text
Compiled successfully
```

### Task 13: Browser Verification

**Files:**

- Verify: `http://localhost:3000/start`
- Verify: `http://localhost:3000/nic-nac?onboarding=checkout-required`
- Verify: `http://localhost:3000/nic-nac?onboarding=required-setup`
- Verify: `http://localhost:3000/nic-nac`

- [ ] **Step 13.1: Start or confirm dev server**

Run:

```powershell
npm run dev
```

Expected:

```text
Local: http://localhost:3000
```

If port 3000 is already serving Sparkle Suite, keep the existing server and do not start a second one.

- [ ] **Step 13.2: Verify tiny signup page**

Open:

```text
http://localhost:3000/start
```

Expected visual result:

- The page feels like the Sparkle Suite landing pages: warm blush/cream, espresso/plum text, Playfair heading, DM Sans UI, pink accent.
- The form asks only for name, email, password, terms, and Google sign-in.
- It does not ask for business name, shop link, live/social link, phone, About page content, or trade board content.

- [ ] **Step 13.3: Verify checkout-required state**

Open:

```text
http://localhost:3000/nic-nac?onboarding=checkout-required
```

Expected visual result:

- One focused checkout-required panel.
- No full dashboard sidebar.
- No setup checklist grid.
- Primary action creates Stripe Checkout.

- [ ] **Step 13.4: Verify required setup state**

Open:

```text
http://localhost:3000/nic-nac?onboarding=required-setup
```

Expected visual result:

- The first viewport is the required setup home.
- Nic-Nac chat is the primary interaction.
- The left/intro side clearly says setup is one conversation, one step at a time.
- The page visually belongs with the Sparkle Suite landing pages.
- No text overlaps on desktop or mobile widths.

- [ ] **Step 13.5: Verify mobile**

Use browser viewport width 390px.

Expected visual result:

- No text overlaps.
- Chat remains usable.
- Header and progress fit without horizontal scroll.
- The input row stays visible and usable.

- [ ] **Step 13.6: Verify unlocked dashboard**

Use a test setup session with `status='dashboard_unlocked'`, then open:

```text
http://localhost:3000/nic-nac
```

Expected visual result:

- Full dashboard appears.
- Nic-Nac desktop/mobile shell still works.
- Team management is not sold in initial checkout and appears only as locked/coming soon if visible.

### Task 14: Final Inspection

**Assigned worker:** Controller plus final code-review subagent.

- [ ] **Step 14.1: Run dirty tree inspection**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo status --short
git -C C:\Users\louis\sparkle-suite-repo diff --stat
```

Expected:

```text
```

after commits, or only intentional uncommitted verification artifacts if Louis requested no commits.

- [ ] **Step 14.2: Run protected file check**

Run:

```powershell
git -C C:\Users\louis\sparkle-suite-repo diff --name-only HEAD~6..HEAD
```

Expected:

```text
```

The output must not include `chrome-extension/` files or live extension files.

- [ ] **Step 14.3: Final code-review subagent**

Dispatch a final reviewer with this prompt:

```text
Review the completed required Nic-Nac setup implementation against docs/superpowers/specs/2026-06-02-sparkle-suite-required-nic-nac-setup-design.md and docs/superpowers/plans/2026-06-02-required-nic-nac-setup.md. Focus on flow correctness, setup persistence, Stripe shipping/light-box fulfillment, Louis alerts, brand consistency, and regressions to paid Nic-Nac workspace behavior. Return findings ordered by severity with exact file references.
```

Expected: no blocking findings. If findings are returned, fix them, rerun the relevant tests, and repeat final review.

---

## Deployment And Environment Checklist

- Supabase migration `20260602143000_ss_required_nic_nac_setup.sql` must be applied before production traffic uses the new flow.
- Stripe webhook must receive expanded session fields already included in the event payload. If shipping details are missing in a live test, retrieve the Checkout Session in the webhook with `expand: ['customer_details']` and re-run the webhook test with that branch.
- Stripe Checkout is limited to `allowed_countries: ['US']` for V1 because Louis is ordering light boxes through Amazon Prime in the United States.
- Telegram alerts require:
  - `TELEGRAM_BOT_TOKEN`
  - `LOUIS_TELEGRAM_CHAT_ID`
- Google OAuth requires Supabase Google provider configuration with callback URL:

```text
https://<production-domain>/api/auth/callback
http://localhost:3000/api/auth/callback
```

- Team management remains out of the initial checkout and can be activated later from within the workspace.

## Acceptance Criteria

- A new rep can create a tiny account with email/password and proceed immediately to Stripe Checkout.
- Google sign-in is available on signup/login paths and routes back into Sparkle Suite.
- Stripe Checkout collects a US shipping address and phone number.
- A successful subscription checkout creates or updates `self_serve_setup_sessions` with `status='required_setup'`.
- A successful subscription checkout creates exactly one light-box task per Stripe Checkout Session and alerts Louis.
- A paid-but-incomplete rep who closes the browser returns to `/nic-nac` and resumes required Nic-Nac setup.
- First-run `/nic-nac` is a branded Nic-Nac chat setup home, not the old dashboard checklist.
- Nic-Nac saves structured setup answers and can unlock only after all required steps are complete.
- Trade Board first-run setup teaches the concept but does not require adding inventory.
- Setup errors Nic-Nac cannot fix notify Louis immediately.
- The unlocked full dashboard still works for completed reps.
- The visual feel matches Sparkle Suite prelaunch/post-launch landing page branding.

## Self-Review

- Spec coverage: This plan covers tiny account creation, Stripe checkout before setup, Google sign-in, required Nic-Nac setup, setup persistence/resume, Louis notifications, light-box fulfillment, Trade Board education, team-management deferral, and Sparkle Suite branding.
- Placeholder scan: The plan avoids indeterminate implementation entries and gives concrete file paths, command lines, expected outputs, SQL, TypeScript contracts, and CSS.
- Type consistency: Setup step IDs, status values, tool names, route modes, and environment variable names are consistent across migration, services, tools, UI, and tests.
