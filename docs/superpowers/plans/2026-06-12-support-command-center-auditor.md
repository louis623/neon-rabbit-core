# Support Command Center Auditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 Sparkle Suite Support Command Center, direct Support Auditor workflow, enriched Google Chat alerts, canonical client profiles, and reusable support lessons.

**Architecture:** Keep report submission fast, then directly start a bounded Support Auditor run for that report. Store canonical account profile data in `client_account_profiles`, preserve per-report snapshots, write structured audit rows, send one enriched Google Chat alert after audit completion/fallback, and expose the workflow through `/control-center`.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Supabase/Postgres/RLS, Supabase service-role server services, Vercel/Next server runtime, Vitest, Google Chat incoming webhook.

---

## Files

Create:

- `supabase/migrations/20260612170000_support_command_center_auditor.sql`
- `lib/services/client-account-profiles.ts`
- `lib/services/support-auditor.ts`
- `lib/services/support-lessons.ts`
- `app/control-center/_components/SupportCommandCenter.tsx`
- `tests/support-command-center-migration.test.ts`
- `tests/services/client-account-profiles.test.ts`
- `tests/services/support-auditor.test.ts`
- `tests/services/support-lessons.test.ts`
- `tests/control-center-page.test.tsx`

Modify:

- `lib/services/support-reports.ts`
- `lib/ops/google-chat-alerts.ts`
- `app/api/control-center/support-reports/route.ts`
- `app/control-center/page.tsx`
- `scripts/smoke-support-report.ts`
- Existing support-report tests as needed.

## Task 1: Schema and Migration Coverage

**Files:**
- Create: `supabase/migrations/20260612170000_support_command_center_auditor.sql`
- Create: `tests/support-command-center-migration.test.ts`

- [ ] **Step 1: Write the failing migration test**

Create `tests/support-command-center-migration.test.ts` that reads the migration SQL and asserts it includes:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260612170000_support_command_center_auditor.sql'),
  'utf8',
)

describe('support command center migration', () => {
  it('creates client account profiles, audits, lessons, and audit fields', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.client_account_profiles')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_audits')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.support_lessons')
    expect(sql).toContain('ALTER TABLE public.support_reports')
    expect(sql).toContain('client_account_profile_id')
    expect(sql).toContain('client_snapshot')
    expect(sql).toContain('audit_status')
    expect(sql).toContain("CHECK (audit_status IN ('pending', 'running', 'completed', 'failed', 'timed_out'))")
  })

  it('enables RLS and service-role policies for support-owned tables', () => {
    expect(sql).toContain('ALTER TABLE public.client_account_profiles ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('ALTER TABLE public.support_audits ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('ALTER TABLE public.support_lessons ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('client_account_profiles_admin_full_access')
    expect(sql).toContain('support_audits_admin_full_access')
    expect(sql).toContain('support_lessons_admin_full_access')
  })

  it('adds indexes for support dashboard and lesson lookup', () => {
    expect(sql).toContain('idx_client_account_profiles_rep')
    expect(sql).toContain('idx_support_reports_audit_status_created')
    expect(sql).toContain('idx_support_audits_report_created')
    expect(sql).toContain('idx_support_lessons_approved_area')
  })
})
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/support-command-center-migration.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Add the migration**

Create an idempotent migration:

- `client_account_profiles` with one row per `rep_id`.
- `support_audits`.
- `support_lessons`.
- `support_reports` audit/profile columns.
- RLS enabled on all new tables.
- Service role full access policies.
- Rep own-select policy for `client_account_profiles` only if needed for future rep-facing reads; v1 dashboard can use service role.
- Indexes named in the test.
- `NOTIFY pgrst, 'reload schema';`

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/support-command-center-migration.test.ts tests/support-reports-migration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260612170000_support_command_center_auditor.sql tests/support-command-center-migration.test.ts
git commit -m "feat: add support command center schema"
```

## Task 2: Client Account Profile Service

**Files:**
- Create: `lib/services/client-account-profiles.ts`
- Create: `tests/services/client-account-profiles.test.ts`

- [ ] **Step 1: Write failing tests**

Test that `ensureClientAccountProfile(supabase, repId)`:

- Loads `reps` by ID.
- Uses `business_name` as `client_name`.
- Uses required setup `account_basics.liveShowName` as `show_name` when available.
- Falls back to `business_name` for `show_name`.
- Upserts one profile row by `rep_id`.
- Returns a `snapshot` with `clientName`, `showName`, `email`, `phone`, `accountStatus`, and `publicSiteSlug`.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/services/client-account-profiles.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement service**

Implement:

```ts
export interface ClientAccountSnapshot {
  profileId: string
  repId: string
  clientName: string
  showName: string
  primaryContactName: string | null
  email: string
  phone: string | null
  accountStatus: string | null
  subscriptionStatus: string | null
  supportTier: string | null
  publicSiteSlug: string | null
  customDomain: string | null
}

export async function ensureClientAccountProfile(
  supabase: SupabaseClient,
  repId: string,
): Promise<ClientAccountSnapshot>
```

Use `reps` plus required setup rows if present. Keep missing optional fields as `null`. Upsert into `client_account_profiles` on `rep_id`.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/services/client-account-profiles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/services/client-account-profiles.ts tests/services/client-account-profiles.test.ts
git commit -m "feat: add client account profile service"
```

## Task 3: Support Auditor and Alert Formatting

**Files:**
- Create: `lib/services/support-auditor.ts`
- Modify: `lib/ops/google-chat-alerts.ts`
- Create: `tests/services/support-auditor.test.ts`
- Modify: `tests/google-chat-alerts.test.ts`

- [ ] **Step 1: Write failing tests**

Tests should prove:

- Completed audit collects profile/report facts and creates a `support_audits` row.
- AI summary failure falls back to template summary.
- Audit failure returns a fallback alert payload.
- Google Chat alert includes full client/show/phone/email, issue, audit status, findings, and recommended first action.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/services/support-auditor.test.ts tests/google-chat-alerts.test.ts
```

Expected: FAIL for missing auditor and old alert shape.

- [ ] **Step 3: Implement auditor**

Implement:

```ts
export async function runSupportAuditForReport(
  supabase: SupabaseClient,
  input: { reportId: string; now?: Date; summarize?: SupportAuditSummarizer },
): Promise<SupportAuditResult>
```

The auditor should:

- Load report by ID.
- Ensure/load client profile.
- Mark report `audit_status = 'running'`.
- Gather deterministic facts from support report, profile, recent support history, Nic-Nac runs when present, and lightweight workflow counts.
- Search approved support lessons by affected area/text/tags.
- Create `support_audits` row.
- Use the summarizer if provided; otherwise use template summary for v1 if no model adapter exists.
- Mark report `audit_status = 'completed'`, `failed`, or `timed_out`.
- Return a structured alert payload.

- [ ] **Step 4: Update Google Chat formatter**

Change `sendGoogleChatSupportAlert` to accept structured fields or continue accepting `lines` plus add helper `buildSupportAuditAlertText(...)`. Preserve existing behavior for callers where possible.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/services/support-auditor.test.ts tests/google-chat-alerts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add lib/services/support-auditor.ts lib/ops/google-chat-alerts.ts tests/services/support-auditor.test.ts tests/google-chat-alerts.test.ts
git commit -m "feat: add support auditor alerts"
```

## Task 4: Report Creation Integration

**Files:**
- Modify: `lib/services/support-reports.ts`
- Modify: `lib/nic-nac/tools/submit-support-report.ts` if return copy needs adjustment
- Modify: existing route/tests:
  - `tests/services/support-reports.test.ts`
  - `tests/nic-nac/submit-support-report-tool.test.ts`
  - `tests/nic-nac-support-reports-route.test.ts`

- [ ] **Step 1: Write failing tests**

Tests should prove:

- `createSupportReport` snapshots client profile onto the report.
- It returns quickly after saving and starting audit.
- It no longer sends the old immediate unaudited Google Chat alert.
- Audit failure still marks notification/audit status appropriately through auditor result.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/services/support-reports.test.ts tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac-support-reports-route.test.ts
```

Expected: FAIL because the current service still sends the old immediate alert.

- [ ] **Step 3: Implement integration**

Update `createSupportReport` to:

- Ensure profile and snapshot before insert.
- Insert `client_account_profile_id`, `client_snapshot`, and `audit_status = 'pending'`.
- Start `runSupportAuditForReport` after insert.
- Mark notification status based on auditor/alert result.
- Return `notificationStatus` as current saved status, preserving UI copy compatibility.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/services/support-reports.test.ts tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac-support-reports-route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/services/support-reports.ts lib/nic-nac/tools/submit-support-report.ts tests/services/support-reports.test.ts tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac-support-reports-route.test.ts
git commit -m "feat: audit support reports on intake"
```

## Task 5: Support Lessons and Resolution API

**Files:**
- Create: `lib/services/support-lessons.ts`
- Modify: `app/api/control-center/support-reports/route.ts`
- Create: `tests/services/support-lessons.test.ts`
- Modify: `tests/control-center-support-reports-route.test.ts`

- [ ] **Step 1: Write failing tests**

Tests should prove:

- Resolving a report can save root cause, fix/workaround, affected area, tags, and approved-for-reuse flag.
- Approved closeout creates a `support_lessons` row.
- Non-approved closeout saves resolution metadata without creating reusable lesson.
- Invalid resolved payload returns 400.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/services/support-lessons.test.ts tests/control-center-support-reports-route.test.ts
```

Expected: FAIL for missing support lessons service and route payload behavior.

- [ ] **Step 3: Implement support lessons**

Add service:

```ts
export async function resolveSupportReport(
  supabase: SupabaseClient,
  input: ResolveSupportReportInput,
): Promise<ResolvedSupportReportResult>
```

Update route PATCH to accept resolution fields when `status === 'resolved'`.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/services/support-lessons.test.ts tests/control-center-support-reports-route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/services/support-lessons.ts app/api/control-center/support-reports/route.ts tests/services/support-lessons.test.ts tests/control-center-support-reports-route.test.ts
git commit -m "feat: add support resolution lessons"
```

## Task 6: Support Command Center Dashboard

**Files:**
- Modify: `app/control-center/page.tsx`
- Create: `app/control-center/_components/SupportCommandCenter.tsx`
- Create: `tests/control-center-page.test.tsx`

- [ ] **Step 1: Write failing tests**

Test that `/control-center/page.tsx` no longer imports/uses `redirect('/control-center/intake')` and renders support command center content with Inbox, Report Detail, Client Profile, and Resolution/Lesson sections.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm exec vitest run tests/control-center-page.test.tsx
```

Expected: FAIL because the page still redirects.

- [ ] **Step 3: Implement page and component**

Use existing operator auth pattern. Render desktop-first support dashboard from server-loaded `listOperatorSupportReports` data. Use restrained dashboard styling. Include:

- Inbox table/list.
- Report detail for selected/latest report.
- Client profile block.
- Audit summary/findings.
- Resolution form scaffold posting to the existing route.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm exec vitest run tests/control-center-page.test.tsx tests/control-center-support-reports-route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add app/control-center/page.tsx app/control-center/_components/SupportCommandCenter.tsx tests/control-center-page.test.tsx
git commit -m "feat: launch support command center"
```

## Task 7: Smoke Script and Full Verification

**Files:**
- Modify: `scripts/smoke-support-report.ts`
- Modify: `package.json` if a new script is useful.

- [ ] **Step 1: Write failing smoke test/script assertions**

Update `scripts/smoke-support-report.ts` to verify:

- Client profile exists.
- Support report has `client_snapshot`.
- Audit row exists and completed.
- Google Chat notification is delivered.
- Support lesson can be created for the synthetic report if requested by the script.
- Cleanup removes synthetic report/audit/lesson/profile if synthetic-only.

- [ ] **Step 2: Run focused automated suite**

Run:

```powershell
npm exec vitest run tests/support-command-center-migration.test.ts tests/services/client-account-profiles.test.ts tests/services/support-auditor.test.ts tests/services/support-lessons.test.ts tests/services/support-reports.test.ts tests/google-chat-alerts.test.ts tests/control-center-support-reports-route.test.ts tests/control-center-page.test.tsx tests/nic-nac/submit-support-report-tool.test.ts tests/nic-nac-support-reports-route.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Apply/verify migration**

Because Supabase CLI auth/linking is currently unresolved, apply the migration in Supabase Dashboard SQL editor or through an available authenticated Supabase tool, then run a verification query proving:

- Tables exist.
- RLS enabled.
- Policies exist.
- New support report columns exist.
- Indexes exist.

- [ ] **Step 5: Run smoke**

Run:

```powershell
npm run smoke:support-report
```

Expected: PASS with completed audit, delivered Google Chat alert, and cleanup true.

- [ ] **Step 6: Browser smoke**

Use `sparkle-suite-demo-smoke` guidance where applicable. Verify `/control-center` opens to Support Command Center for an operator/reviewer smoke session and no longer redirects to `/control-center/intake`.

- [ ] **Step 7: Commit smoke updates**

```powershell
git add scripts/smoke-support-report.ts package.json
git commit -m "chore: harden support auditor smoke"
```

## Final Verification

- [ ] Focused Vitest suite passes.
- [ ] `npm run build` passes.
- [ ] Supabase schema verified remotely.
- [ ] DB-backed smoke passes and cleans up synthetic rows.
- [ ] Browser smoke verifies `/control-center`.
- [ ] Production deploy succeeds if Louis wants the completed system live now.
- [ ] Stable demo alias updated only if appropriate for reviewer smoke.
- [ ] Binder notes updated with deployment/smoke status.
