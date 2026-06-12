# Sparkle Suite Support Command Center and Support Auditor Design

## Purpose

Sparkle Suite needs a support system that does more than store bug reports. When a rep files an issue from Help & Resources or through Nic-Nac, Sparkle Suite should save the report, audit the reporting account, notify Louis in Google Chat with useful context, and preserve what was learned so future issues can be handled faster.

The first build should stay simple and reliable. It should not introduce recurring background polling, broad agent orchestration, or a full operations platform. It should create a strong support foundation that can be expanded after beta usage shows what matters.

## Scope

In scope:

- A canonical support-facing client account profile table.
- Support report workflow fields for audit status and preserved client snapshots.
- A direct report-created audit trigger.
- A `Support Auditor` service that audits one reporting account at a time.
- One Google Chat alert after audit completion, with a fallback alert if audit or summary generation fails.
- A new `/control-center` Support Command Center dashboard that replaces the old intake redirect as the main control center landing page.
- A resolution workflow that can create approved reusable support lessons.
- Simple support memory search from approved lessons.

Out of scope for v1:

- Recurring cron or scheduled sweepers.
- Helper users or multi-user client accounts.
- Editing client account profiles from the support dashboard.
- Full backend dashboard overhaul beyond the support command center.
- Chrome extension or Chrome Web Store changes.
- Live queue extension internals.
- Automatic resolution of reports.
- Embeddings or vector search for support memory.

## Key Decisions

- One client account profile equals one independent Sparkle Suite rep/business account.
- Only that rep should log in for now.
- Client profile data is display-only in the Support Command Center.
- Reports should save quickly for the rep.
- The audit should start immediately when a report is created.
- No recurring cron should be added in v1.
- The audit should use a short technical timeout rather than holding a web function open for 10 minutes.
- Product expectation: audited Google Chat alerts should usually arrive within a few minutes.
- If audit or AI summary fails, Sparkle Suite sends a fallback Google Chat alert instead of silently dropping the report.
- Google Chat alerts show full name, show name, phone, and email because the alert goes only to Louis's private Google Workspace/phone.
- Nic-Nac can know an open report exists for the same rep when relevant, but only approved resolved lessons become reusable advice.

## Data Model

### client_account_profiles

Create a canonical support-facing table with exactly one row per rep.

Recommended columns:

- `id uuid primary key`
- `rep_id uuid not null unique references public.reps(id) on delete cascade`
- `client_name text not null`
- `show_name text`
- `primary_contact_name text`
- `email text not null`
- `phone text`
- `account_status text`
- `subscription_status text`
- `support_tier text`
- `public_site_slug text`
- `custom_domain text`
- `setup_state jsonb not null default '{}'::jsonb`
- `source_snapshot jsonb not null default '{}'::jsonb`
- `internal_notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Source of truth rules:

- `reps` remains the auth/workspace identity table.
- `client_account_profiles` becomes the support-facing profile.
- Backfill from `reps.business_name`, `reps.email`, `reps.phone`, public site fields, subscription fields, and required setup answers.
- Refresh automatically during report intake or audit if a profile is missing or stale.
- Do not build dashboard editing in v1.

### support_reports

Keep the existing support report table and extend it.

Add:

- `client_account_profile_id uuid references public.client_account_profiles(id)`
- `client_snapshot jsonb not null default '{}'::jsonb`
- `audit_status text not null default 'pending'`
- `audit_started_at timestamptz`
- `audit_completed_at timestamptz`
- `audit_error text`

Audit status values:

- `pending`
- `running`
- `completed`
- `failed`
- `timed_out`

Notification status stays separate from audit status. A report can be saved even if Google Chat fails, and an audit can complete even if alert delivery fails.

### support_audits

Create one row per audit attempt.

Recommended columns:

- `id uuid primary key`
- `support_report_id uuid not null references public.support_reports(id) on delete cascade`
- `client_account_profile_id uuid references public.client_account_profiles(id)`
- `status text not null`
- `facts jsonb not null default '{}'::jsonb`
- `findings jsonb not null default '[]'::jsonb`
- `risk_flags jsonb not null default '[]'::jsonb`
- `similar_lessons jsonb not null default '[]'::jsonb`
- `recommended_first_action text`
- `ai_summary text`
- `template_summary text`
- `error_message text`
- `duration_ms integer`
- `created_at timestamptz not null default now()`
- `completed_at timestamptz`

Status values:

- `running`
- `completed`
- `failed`
- `timed_out`

### support_lessons

Create structured support memory from resolved issues.

Recommended columns:

- `id uuid primary key`
- `source_report_id uuid references public.support_reports(id) on delete set null`
- `client_account_profile_id uuid references public.client_account_profiles(id) on delete set null`
- `affected_area text not null`
- `symptom text not null`
- `root_cause text not null`
- `fix_or_workaround text not null`
- `tags text[] not null default '{}'::text[]`
- `approved_for_reuse boolean not null default false`
- `created_by text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Support lessons are not automatically trusted. The dashboard resolution workflow controls whether a lesson is approved for reuse.

## Core Flow

1. A rep submits a report from Help & Resources or Nic-Nac.
2. Sparkle Suite validates and saves the report.
3. Sparkle Suite ensures a `client_account_profiles` row exists for the reporting `rep_id`.
4. Sparkle Suite snapshots the client profile onto the report in `client_snapshot`.
5. The rep immediately receives the normal "Report saved" response.
6. Sparkle Suite immediately starts `Support Auditor` for that report.
7. `Support Auditor` marks the report `audit_status = 'running'`.
8. `Support Auditor` gathers deterministic facts.
9. `Support Auditor` searches approved `support_lessons` for similar issues.
10. `Support Auditor` writes a `support_audits` row.
11. `Support Auditor` asks AI for one compact summary from the structured facts.
12. If AI succeeds, the audit stores the AI summary.
13. If AI fails, the audit stores a template summary.
14. Sparkle Suite marks the report audit `completed`, `failed`, or `timed_out`.
15. Sparkle Suite sends one Google Chat alert.

No recurring process runs unless future production evidence shows direct audit triggering is unreliable.

## Support Auditor

`Support Auditor` is a service, not a chat personality. It audits exactly one support report and exactly one reporting account.

### Phase 1: Deterministic Audit

Gather facts from known data sources:

- Report details.
- Client account profile.
- Rep/account status.
- Required setup status.
- Public site slug/domain basics.
- Subscription or billing status if available.
- Recent Nic-Nac conversation/run when the report came from Nic-Nac.
- Workflow-specific snapshot based on `page_or_workflow`, report type, and report details.
- Approved support lessons with matching tags or text.

V1 workflow snapshots:

- Trade Board: listing counts, recent trade requests, recent approvals, pending swap cleanup counts.
- Live Queue: safe app-side state only; do not inspect protected extension internals.
- Customer site/public site: site/profile basics, public slug/domain, required setup/site settings.
- Billing/account: subscription/account status if available.
- Nic-Nac: recent run status and conversation metadata for the reporting conversation.
- Unknown/general: account profile, setup state, recent support report history, recent Nic-Nac run state if available.

Output:

- `facts`
- `findings`
- `risk_flags`
- `similar_lessons`
- `recommended_first_action`
- `missing_data`

### Phase 2: AI Summary

The AI summary receives only the structured audit facts and the submitted issue details. It produces:

- A short issue summary.
- Three to five key findings.
- One recommended first action.

If the AI call fails, use deterministic template text and still send the alert.

### Boundaries

- Audit only the reporting rep's account.
- Do not expose another rep's data.
- Do not modify client data.
- Do not mark reports resolved.
- Do not send customer-facing messages.
- Do not touch Chrome extension code.
- Do not inspect live queue extension internals.

## Google Chat Alert

Send one Google Chat alert after audit completion or audit fallback.

Format:

```text
Sparkle Suite support report

[Blocking] Bug: Trade board item vanished

Client: Jane Roberts
Show: Jane's Sparkle Party
Phone: 555-123-4567
Email: jane@example.com
Report ID: abc-123

Issue: Rep says a Trade Board item disappeared after approving a trade.
Submitted from: Help form
Workflow: Trade Board

Support Auditor: Completed
Summary: The account is active, required setup is complete, and the trade board has 12 active listings. One trade approval happened 4 minutes before the report. The outgoing listing moved to traded successfully, but the replacement listing does not appear to have been created.

Key findings:
- Recent trade approval found for customer Melissa K.
- Replacement listing missing after approval.
- No account/profile setup blockers found.
- Similar prior lesson: "Trade replacement missing ring size can pause cleanup."

Recommended first action:
Open the report in Control Center and inspect the trade swap cleanup state for the latest approval.
```

Fallback format:

```text
Sparkle Suite support report

[Blocking] Bug: Trade board item vanished

Client: Jane Roberts
Show: Jane's Sparkle Party
Phone: 555-123-4567
Email: jane@example.com
Report ID: abc-123

Issue: Rep says a Trade Board item disappeared after approving a trade.
Submitted from: Help form
Workflow: Trade Board

Support Auditor: Incomplete
Summary: The report was saved, but the account audit did not finish. Review manually.
```

## Support Command Center

`/control-center` becomes the main Support Command Center landing page. The old redirect to `/control-center/intake` should be removed. The old intake feature can remain in code temporarily if removal would create unnecessary risk, but it should no longer be the main operator path.

The dashboard is desktop-first and dense. It should also be readable on a fold phone. It should avoid marketing-style layout, oversized hero content, or decorative card stacking.

### Inbox

Purpose: triage incoming support reports.

Display:

- Client/show.
- Report type.
- Urgency.
- Title.
- Source.
- Audit status.
- Support status.
- Created time.

Sorting:

- Urgency descending.
- Audit status requiring attention.
- Created time descending.

### Report Detail

Purpose: work one support report.

Display:

- Client/show/contact block.
- Submitted report details.
- Support Auditor summary.
- Key findings.
- Recommended first action.
- Similar approved lessons.
- Full structured audit details in a collapsible/details section.
- Status controls: `open`, `reviewing`, `planned`, `resolved`, `closed`.

### Client Profile

Purpose: show support-facing profile for the reporting account.

Display only:

- Client/business name.
- Show name.
- Contact name if available.
- Email.
- Phone.
- Account/subscription/support status.
- Public site slug/domain.
- Setup state summary.
- Internal notes/flags if present.

### Resolution and Lesson

Purpose: close the support loop.

When marking a report resolved, require:

- Root cause.
- Fix or workaround.
- Affected area.
- Tags.
- Approved for reuse yes/no.

If approved for reuse, create a `support_lessons` row. If not approved, save the resolution note on the report/audit history but do not expose it to future reusable support advice.

## Nic-Nac Behavior

Nic-Nac can still file support reports.

Nic-Nac may mention that an open support report exists for the same rep when directly relevant. Nic-Nac should not use unresolved audit findings as general advice. Only approved resolved lessons are reusable support memory.

If Nic-Nac itself is the problem, the Help & Resources form remains the independent fallback path.

## Error Handling

Report insert failure:

- Return a clear error to the rep.
- Do not send Google Chat because there is no durable report.

Audit failure:

- Save the report.
- Mark audit status `failed`.
- Store sanitized error text.
- Send fallback Google Chat alert.

Audit timeout:

- Save the report.
- Mark audit status `timed_out`.
- Store sanitized timeout text.
- Send fallback Google Chat alert.

AI summary failure:

- Keep deterministic audit facts.
- Use template summary.
- Mark audit completed with AI fallback metadata.
- Send normal alert with template summary.

Google Chat failure:

- Keep the report and audit saved.
- Mark notification status `failed`.
- Show notification attention copy to the rep when appropriate.
- Surface the failed notification in the Support Command Center.

## Security and Privacy

- All support account enrichment must use server-side trusted access.
- RLS should allow reps to read their own reports only where needed.
- Operator/control center access remains restricted through existing operator auth.
- `client_account_profiles`, `support_audits`, and `support_lessons` should be service/operator controlled.
- Full contact info may appear in Google Chat because it goes only to Louis's private Google Workspace/phone.
- No cross-rep data should be included in audits, alerts, dashboard detail, or support lessons.

## Testing and Verification Strategy

Unit tests:

- Profile backfill and refresh from `reps` and setup data.
- Support report insert snapshots client profile.
- Audit status transitions.
- Support Auditor deterministic fact collection.
- AI summary fallback.
- Google Chat alert formatting for completed and fallback audits.
- Support lesson creation from resolution workflow.

Route/service tests:

- Help form creates report, starts audit, and returns quickly.
- Nic-Nac creates report, starts audit, and returns quickly.
- Operator dashboard list/detail routes enforce auth.
- Operator status update and resolution workflow enforce valid transitions.

Smoke tests:

- Synthetic Help form report produces a completed audit and Google Chat alert, then cleans up.
- Synthetic Nic-Nac report produces a completed audit and Google Chat alert, then cleans up.
- Synthetic audit failure sends fallback alert and marks the row correctly.

Manual/browser checks:

- `/control-center` opens to the Support Command Center.
- Inbox shows reports with audit status.
- Report detail shows client profile, submitted details, audit summary, and recommended action.
- Resolution workflow can save a lesson.

## Rollout

1. Add schema and service tests.
2. Add `client_account_profiles`, audit fields, `support_audits`, and `support_lessons`.
3. Implement profile refresh/backfill service.
4. Implement Support Auditor deterministic collector.
5. Implement AI summary with template fallback.
6. Update report creation to start direct audit.
7. Update Google Chat alert format.
8. Replace `/control-center` landing with Support Command Center.
9. Add resolution workflow and support lesson creation.
10. Smoke test on preview/stable demo before production.

## Future Extensions

- Add a low-frequency sweeper only if direct audit triggering proves unreliable.
- Add richer dashboard analytics after beta usage creates enough data.
- Add vector/embedding search for support lessons if simple tags/text are insufficient.
- Add dashboard profile editing only if support operations regularly need it.
- Add helper users only after the product supports multi-user accounts.
