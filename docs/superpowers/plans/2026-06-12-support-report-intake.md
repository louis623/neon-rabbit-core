# Support Report Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sparkle Suite support report intake with a Help & Resources form, Nic-Nac reporting tool, backend-dashboard-ready records, and Google Chat notification delivery.

**Architecture:** Store every report in Supabase first, then attempt notification delivery as a best-effort side effect. The Help & Resources form and Nic-Nac tool both call the same authenticated API/service so reports have one canonical validation, storage, and notification path. Google Chat is a pluggable one-way notification channel controlled by `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL`; the future operator dashboard reads from `support_reports`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Zod, Supabase/Postgres with RLS, Vitest, Google Chat incoming webhooks.

---

## File Structure

- Create `supabase/migrations/20260612100000_support_reports.sql`: durable support report table, indexes, RLS policies, and PostgREST reload.
- Create `lib/ops/google-chat-alerts.ts`: Google Chat incoming webhook adapter.
- Create `lib/services/support-reports.ts`: validation, normalization, insert/list/update helpers, and notification orchestration.
- Create `app/api/nic-nac/support-reports/route.ts`: authenticated report creation endpoint for the Help form.
- Modify `app/nic-nac/components/DashboardPlaceholder.tsx`: Help & Resources form UI and submit handling.
- Modify `app/nic-nac/components/DashboardPlaceholder.module.css`: compact form styling that matches workspace controls.
- Create `lib/nic-nac/tools/submit-support-report.ts`: Nic-Nac tool that files support reports from chat.
- Modify `lib/nic-nac/tools/index.ts`: register the tool and route it under `resources`.
- Modify `lib/nic-nac/prompt-builder.ts` and `lib/nic-nac/system-prompt.ts`: teach Nic-Nac when to file a report and when to direct users to the form if Nic-Nac is the issue.
- Add/modify focused tests:
  - `tests/support-reports-migration.test.ts`
  - `tests/google-chat-alerts.test.ts`
  - `tests/services/support-reports.test.ts`
  - `tests/nic-nac-support-reports-route.test.ts`
  - `tests/nic-nac-help-resources-feedback-form.test.ts`
  - `tests/nic-nac/submit-support-report-tool.test.ts`
  - `tests/nic-nac/tool-routing.test.ts`
  - `tests/nic-nac-workspace-knowledge.test.ts`

## Task 1: Migration And SQL Contract

**Files:**
- Create: `supabase/migrations/20260612100000_support_reports.sql`
- Test: `tests/support-reports-migration.test.ts`

- [ ] **Step 1: Write failing migration contract tests**

Create `tests/support-reports-migration.test.ts` with tests that read the migration text and assert it contains:

```ts
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/20260612100000_support_reports.sql',
)

function readMigration() {
  return readFileSync(migrationPath, 'utf8')
}

describe('support reports migration', () => {
  it('creates a durable support_reports table for dashboard intake', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_reports')
    expect(sql).toContain("source TEXT NOT NULL")
    expect(sql).toContain("report_type TEXT NOT NULL")
    expect(sql).toContain("urgency TEXT NOT NULL DEFAULT 'normal'")
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'open'")
    expect(sql).toContain('page_or_workflow TEXT')
    expect(sql).toContain('title TEXT NOT NULL')
    expect(sql).toContain('details TEXT NOT NULL')
    expect(sql).toContain('expected_result TEXT')
    expect(sql).toContain('actual_result TEXT')
    expect(sql).toContain("notification_channel TEXT NOT NULL DEFAULT 'google_chat'")
    expect(sql).toContain("notification_status TEXT NOT NULL DEFAULT 'pending'")
    expect(sql).toContain('notification_error TEXT')
  })

  it('adds constraints for known report states and intake sources', () => {
    const sql = readMigration()

    expect(sql).toContain("source IN ('help_form', 'nic_nac')")
    expect(sql).toContain("report_type IN ('site_issue', 'bug', 'suggested_upgrade', 'workflow_idea')")
    expect(sql).toContain("urgency IN ('normal', 'blocking', 'showtime_urgent')")
    expect(sql).toContain("status IN ('open', 'reviewing', 'planned', 'resolved', 'closed')")
    expect(sql).toContain("notification_status IN ('pending', 'delivered', 'not_configured', 'failed')")
  })

  it('scopes reports with RLS and leaves operator/dashboard policies ready', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('support_reports_own_select')
    expect(sql).toContain('support_reports_own_insert')
    expect(sql).toContain('support_reports_admin_full_access')
    expect(sql).toContain('auth.uid() = rep.auth_user_id')
  })

  it('indexes the future operator dashboard queue', () => {
    const sql = readMigration()

    expect(sql).toContain('idx_support_reports_rep_created')
    expect(sql).toContain('idx_support_reports_status_urgency_created')
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'")
  })
})
```

- [ ] **Step 2: Run the migration test and confirm RED**

Run:

```bash
npm exec vitest run tests/support-reports-migration.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Add the migration**

Create `supabase/migrations/20260612100000_support_reports.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.support_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  conversation_id TEXT,
  run_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('help_form', 'nic_nac')),
  report_type TEXT NOT NULL CHECK (report_type IN ('site_issue', 'bug', 'suggested_upgrade', 'workflow_idea')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'blocking', 'showtime_urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'planned', 'resolved', 'closed')),
  page_or_workflow TEXT,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  expected_result TEXT,
  actual_result TEXT,
  contact_ok BOOLEAN NOT NULL DEFAULT true,
  notification_channel TEXT NOT NULL DEFAULT 'google_chat',
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'delivered', 'not_configured', 'failed')),
  notification_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_reports_rep_created
  ON public.support_reports(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_reports_status_urgency_created
  ON public.support_reports(status, urgency, created_at DESC);

ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_reports_own_select ON public.support_reports;
CREATE POLICY support_reports_own_select ON public.support_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reps rep
      WHERE rep.id = support_reports.rep_id
        AND auth.uid() = rep.auth_user_id
    )
  );

DROP POLICY IF EXISTS support_reports_own_insert ON public.support_reports;
CREATE POLICY support_reports_own_insert ON public.support_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reps rep
      WHERE rep.id = support_reports.rep_id
        AND auth.uid() = rep.auth_user_id
    )
  );

DROP POLICY IF EXISTS support_reports_admin_full_access ON public.support_reports;
CREATE POLICY support_reports_admin_full_access ON public.support_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 4: Run the migration test and confirm GREEN**

Run:

```bash
npm exec vitest run tests/support-reports-migration.test.ts
```

Expected: PASS.

## Task 2: Google Chat Notification Adapter

**Files:**
- Create: `lib/ops/google-chat-alerts.ts`
- Test: `tests/google-chat-alerts.test.ts`

- [ ] **Step 1: Write failing adapter tests**

Create tests for missing config, successful send, and failed send. The public API should be:

```ts
sendGoogleChatSupportAlert({
  title: 'Bug: Calendar save fails',
  urgency: 'blocking',
  lines: ['Rep: Jamie Smoke', 'Page: Calendar'],
})
```

Expected results:

- missing env returns `{ delivered: false, reason: 'google_chat_not_configured' }`
- configured env POSTs `{ text: string }` to the webhook URL
- non-2xx response throws `Google Chat alert failed: <status> <body>`
- response body included in errors is truncated to 300 characters

- [ ] **Step 2: Run adapter tests and confirm RED**

Run:

```bash
npm exec vitest run tests/google-chat-alerts.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement adapter**

Create `lib/ops/google-chat-alerts.ts` with:

```ts
export type GoogleChatSupportAlertResult =
  | { delivered: true }
  | { delivered: false; reason: 'google_chat_not_configured' }

interface SendGoogleChatSupportAlertInput {
  title: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  lines: string[]
}

function urgencyLabel(urgency: SendGoogleChatSupportAlertInput['urgency']) {
  if (urgency === 'showtime_urgent') return '[Show-time urgent]'
  if (urgency === 'blocking') return '[Blocking]'
  return '[Normal]'
}

export async function sendGoogleChatSupportAlert({
  title,
  urgency,
  lines,
}: SendGoogleChatSupportAlertInput): Promise<GoogleChatSupportAlertResult> {
  const webhookUrl = process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[google-chat-alerts] Support alert skipped because GOOGLE_CHAT_SUPPORT_WEBHOOK_URL is missing.', {
      title,
      urgency,
    })
    return { delivered: false, reason: 'google_chat_not_configured' }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      text: ['Sparkle Suite support report', `${urgencyLabel(urgency)} ${title}`, '', ...lines].join('\n'),
    }),
  })

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300)
    throw new Error(`Google Chat alert failed: ${response.status} ${body}`)
  }

  return { delivered: true }
}
```

- [ ] **Step 4: Run adapter tests and confirm GREEN**

Run:

```bash
npm exec vitest run tests/google-chat-alerts.test.ts
```

Expected: PASS.

## Task 3: Support Report Service And Operator Query

**Files:**
- Create: `lib/services/support-reports.ts`
- Test: `tests/services/support-reports.test.ts`

- [ ] **Step 1: Write failing service tests**

Test these behaviors:

- normalizes trimmed fields and validates minimum title/details
- maps Help form report types to `site_issue`, `bug`, `suggested_upgrade`, `workflow_idea`
- inserts into `support_reports` with `source`, `rep_id`, and optional `conversation_id`/`run_id`
- sends Google Chat alert after insert
- if Google Chat is not configured, updates row to `notification_status = 'not_configured'`
- if Google Chat throws, updates row to `notification_status = 'failed'` and still returns `ok: true`
- `listOperatorSupportReports` filters by status and sorts open/urgent/newest for the future dashboard

- [ ] **Step 2: Run service tests and confirm RED**

Run:

```bash
npm exec vitest run tests/services/support-reports.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement service**

Create exports:

```ts
export type SupportReportSource = 'help_form' | 'nic_nac'
export type SupportReportType = 'site_issue' | 'bug' | 'suggested_upgrade' | 'workflow_idea'
export type SupportReportUrgency = 'normal' | 'blocking' | 'showtime_urgent'
export type SupportReportStatus = 'open' | 'reviewing' | 'planned' | 'resolved' | 'closed'

export interface CreateSupportReportInput {
  repId: string
  repEmail?: string
  source: SupportReportSource
  reportType: SupportReportType
  urgency?: SupportReportUrgency
  pageOrWorkflow?: string
  title: string
  details: string
  expectedResult?: string
  actualResult?: string
  contactOk?: boolean
  conversationId?: string
  runId?: string
}

export async function createSupportReport(admin: SupabaseClient, input: CreateSupportReportInput) { ... }
export async function listOperatorSupportReports(admin: SupabaseClient, options?: { status?: SupportReportStatus; limit?: number }) { ... }
```

Service behavior:

- Use Zod for validation.
- Insert the report with `notification_status: 'pending'`.
- After insert, call `sendGoogleChatSupportAlert`.
- Update `notification_status` to `delivered`, `not_configured`, or `failed`.
- Return report id and final notification status.
- Never throw a user-facing failure solely because notification failed.

- [ ] **Step 4: Run service tests and confirm GREEN**

Run:

```bash
npm exec vitest run tests/services/support-reports.test.ts
```

Expected: PASS.

## Task 4: Authenticated Report API

**Files:**
- Create: `app/api/nic-nac/support-reports/route.ts`
- Test: `tests/nic-nac-support-reports-route.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock `getAuthenticatedRep`, `createAdminClient`, and `createSupportReport`.

Test:

- unauthenticated request returns 401
- invalid request returns 400
- valid request calls `createSupportReport` with authenticated rep id/email and `source: 'help_form'`
- notification failure status still returns 201 with report id

- [ ] **Step 2: Run route tests and confirm RED**

Run:

```bash
npm exec vitest run tests/nic-nac-support-reports-route.test.ts
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement route**

Create `app/api/nic-nac/support-reports/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSupportReport } from '@/lib/services/support-reports'

const requestSchema = z.object({
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).optional(),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  contactOk: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedRep()
    const body = requestSchema.parse(await request.json())
    const result = await createSupportReport(createAdminClient(), {
      repId: auth.repId,
      repEmail: auth.rep.email,
      source: 'help_form',
      reportType: body.reportType,
      urgency: body.urgency,
      pageOrWorkflow: body.pageOrWorkflow,
      title: body.title,
      details: body.details,
      expectedResult: body.expectedResult,
      actualResult: body.actualResult,
      contactOk: body.contactOk,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Check the report details and try again.' }, { status: 400 })
    }
    console.error('[support-reports] create route failed', error)
    return NextResponse.json({ error: 'Support report could not be saved right now.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run route tests and confirm GREEN**

Run:

```bash
npm exec vitest run tests/nic-nac-support-reports-route.test.ts
```

Expected: PASS.

## Task 5: Help & Resources Form

**Files:**
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Modify: `app/nic-nac/components/DashboardPlaceholder.module.css`
- Test: `tests/nic-nac-help-resources-feedback-form.test.ts`

- [ ] **Step 1: Write failing UI tests**

Assert the component source includes:

- `Report an issue or suggest an upgrade`
- `Site issue`
- `Bug`
- `Suggested upgrade`
- `Workflow idea`
- `Show-time urgent`
- `submitSupportReport`
- POST to `/api/nic-nac/support-reports`
- success text that confirms the report was saved
- fallback text when Google Chat notification is not configured or failed

- [ ] **Step 2: Run UI tests and confirm RED**

Run:

```bash
npm exec vitest run tests/nic-nac-help-resources-feedback-form.test.ts
```

Expected: FAIL because the form is not present.

- [ ] **Step 3: Add form state and submit handler**

Inside `HelpResourcesCard`, add local state:

```ts
const [supportForm, setSupportForm] = useState({
  reportType: 'site_issue' as SupportReportType,
  urgency: 'normal' as SupportReportUrgency,
  pageOrWorkflow: '',
  title: '',
  details: '',
  expectedResult: '',
  actualResult: '',
})
const [supportSubmitState, setSupportSubmitState] = useState<'idle' | 'submitting' | 'saved' | 'saved_notification_pending' | 'error'>('idle')
```

Add `submitSupportReport` that POSTs JSON to `/api/nic-nac/support-reports`, shows saved state for `delivered`, and shows saved-but-alert-pending language for `not_configured` or `failed`.

- [ ] **Step 4: Render form in Support Path section**

Add a compact form under the Support Path details. Use existing CSS patterns for labels, inputs, buttons, helper notes, and timeline items. Required fields: report type, urgency, title, details. Optional: page/workflow, expected result, actual result.

- [ ] **Step 5: Add CSS**

Add classes for a two-column compact form layout, textarea sizing, button row, and status message. Keep mobile single-column.

- [ ] **Step 6: Run UI tests and confirm GREEN**

Run:

```bash
npm exec vitest run tests/nic-nac-help-resources-feedback-form.test.ts
```

Expected: PASS.

## Task 6: Nic-Nac Reporting Tool

**Files:**
- Create: `lib/nic-nac/tools/submit-support-report.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Test: `tests/nic-nac/submit-support-report-tool.test.ts`
- Test: `tests/nic-nac/tool-routing.test.ts`
- Test: `tests/nic-nac-workspace-knowledge.test.ts`

- [ ] **Step 1: Write failing tool tests**

Test:

- tool name is `submit_support_report`
- schema requires `reportType`, `title`, and `details`
- execution calls `createSupportReport` with `source: 'nic_nac'`, context rep id, conversation id, and run id
- delivered result tells Nic-Nac the report was saved and Louis was notified through Google Chat
- not configured/failed result tells Nic-Nac the report was saved but automatic notification is not configured/failed

- [ ] **Step 2: Write failing routing/prompt tests**

Update existing tests to assert:

- `resources` tool pack includes `submit_support_report`
- text like `report a bug`, `file an issue`, `suggest an upgrade`, `workflow idea`, and `Nic-Nac is broken` routes to `resources`
- prompt mentions `submit_support_report`
- prompt says if the issue is about Nic-Nac itself, direct the user to the Help & Resources form as a fallback

- [ ] **Step 3: Run tests and confirm RED**

Run:

```bash
npm exec vitest run tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: FAIL because the tool and prompt text are missing.

- [ ] **Step 4: Implement tool**

Create `submit-support-report.ts` with Zod schema:

```ts
const inputSchema = z.object({
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).optional(),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
})
```

Execution calls `createSupportReport(ctx.supabase, { ...source: 'nic_nac' })`.

- [ ] **Step 5: Register and route tool**

Import the tool in `lib/nic-nac/tools/index.ts`, add it to `REGISTRY`, add it to `TOOL_PACKS.resources`, and expand resource/help bug-report intent patterns.

- [ ] **Step 6: Update prompt text**

Add concise instructions:

- Use `submit_support_report` when a rep asks to report a site issue, bug, suggested upgrade, or workflow idea.
- If the report is that Nic-Nac is malfunctioning, confusing, or not responding correctly, tell the rep they can use the Help & Resources form because the form does not depend on Nic-Nac.
- Do not claim Louis was notified unless tool result says `notificationStatus: 'delivered'`.

- [ ] **Step 7: Run tool/prompt tests and confirm GREEN**

Run:

```bash
npm exec vitest run tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

## Task 7: Verification And Handoff

**Files:**
- No new source files unless failures reveal missing coverage.

- [ ] **Step 1: Run focused feature suite**

Run:

```bash
npm exec vitest run tests/support-reports-migration.test.ts tests/google-chat-alerts.test.ts tests/services/support-reports.test.ts tests/nic-nac-support-reports-route.test.ts tests/nic-nac-help-resources-feedback-form.test.ts tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run relevant standard Nic-Nac suite**

Run:

```bash
npm exec vitest run tests/nic-nac-resources-route.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Google Chat setup handoff**

Ask Louis to create/copy the Google Chat webhook only after code is ready:

1. Open Google Chat in Chrome.
2. Create or open a space named `Sparkle Suite Support`.
3. Open the space menu.
4. Choose Apps & integrations.
5. Add a webhook named `Sparkle Suite Reports`.
6. Copy the webhook URL.
7. Set Vercel env var `GOOGLE_CHAT_SUPPORT_WEBHOOK_URL` for the target environment.

- [ ] **Step 5: Deploy/smoke if Louis wants production or demo update**

Use Sparkle Suite demo smoke rules:

- prefer reviewer-smoke session
- do not use Louis's personal account
- verify Help & Resources form renders
- submit one synthetic report if a non-production/local environment is available
- verify Google Chat receives the alert only after Louis provides a test webhook for that environment

## Sub-Agent Execution Notes

Use sub-agents after Task 3 lands because Task 1-3 define the shared interfaces. Recommended sequence:

1. Main agent executes Tasks 1-3 to lock schema, service, and API.
2. Sub-agent A executes Task 5 UI form.
3. Sub-agent B executes Task 6 Nic-Nac tool and prompt routing.
4. Reviewer sub-agent checks Tasks 1-6 for spec compliance.
5. Main agent runs Task 7 verification and handles Google Chat setup/deploy decisions.

Do not dispatch multiple implementation sub-agents editing `DashboardPlaceholder.tsx`, `tools/index.ts`, or prompt files at the same time.
