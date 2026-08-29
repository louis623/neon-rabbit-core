# Transparent Operator Support Access Implementation Plan

> **Status:** Product direction approved by Louis on August 29, 2026. This document is the implementation plan only. No support-access application code, database migration, production setting, customer account, Message Center delivery, or deployment is changed by this document.

**Goal:** Let Louis open a real rep Workspace from Sparkle Suite Control Center and help configure that rep's account and customer site without knowing, resetting, borrowing, or exposing the rep's credentials.

**Trust promise:** Every support session is time-limited, visibly labeled, attributable to Louis, recorded in an append-only audit history, and disclosed automatically to the affected rep in Message Center. Support access can never change billing, payment, subscription, authentication, ownership, or account-security state.

**Architecture:** Keep the existing independent Control Center authentication. Create a separate operator-support session and a separate support Workspace route that reuse the real Workspace UI and domain services through an explicit capability gateway. Do not impersonate the rep's Supabase Auth identity, mint a rep login, replace the rep's cookies, or silently teach existing `/api/nic-nac/*` routes to accept an operator session. Every support-enabled operation must be individually allowlisted and attributed to the operator-support session.

---

## 1. Locked Product Decisions

The following decisions are approved for the first production release:

1. **Louis can initiate support access from Control Center.** A rep does not need to share a password or complete a second approval gate.
2. **A reason is mandatory.** Louis chooses a standard reason and may add a short note before the session can start.
3. **The session acts on one exact rep.** The selected target is frozen when the session is created and cannot be changed in place.
4. **The acting identity remains Louis.** The subject account is the rep. Logs and mutations must never attribute Louis's work to the rep.
5. **The real Workspace is used.** Support work operates on the rep's actual Workspace data and customer-site configuration, not a cloned preview.
6. **The customer site remains directly reviewable.** Control Center and the support Workspace provide an exact public-site link. Public browsing itself does not need an operator session; edits do.
7. **Billing and security are excluded.** Support access cannot read or change Stripe/payment details, subscription management, checkout, SMS wallet funding, authentication, password, email ownership, linked identity, account ownership, or account deletion.
8. **Transparency is automatic.** The rep receives a Message Center notice when access begins and a completion notice when it ends or expires.
9. **Audit is append-only.** A support session and its audit events cannot be edited or deleted through product APIs or UI.
10. **Failure is closed.** If the session record, start audit, or start-notification delivery cannot be proven, the support Workspace does not open.
11. **No credential capture.** Passwords, access tokens, Live Queue codes, private links, payment data, and provider secrets never enter audit details, Message Center notices, source, vault, or ordinary logs.
12. **One active support session per operator.** Louis must end the current support session before opening another account. This avoids cross-account confusion in the same browser.

### Recommended session defaults

- Initial duration: **60 minutes**.
- Warning: **5 minutes** before expiration.
- Extension: one explicit **30-minute** extension.
- Maximum continuous session: **2 hours**.
- End conditions: Louis ends it, it expires, Control Center access expires, the operator is revoked, or the target rep is no longer eligible for support access.
- A browser refresh may resume the same active session after server verification; it may never create a replacement silently.

---

## 2. Current Architecture and Why the Support Surface Must Be Separate

### Control Center today

- `lib/supabase/operator-auth.ts` owns the independent HMAC-signed `sparkle_control_center_session` cookie.
- The Control Center session currently lasts 12 hours and identifies the internal operator independently from a rep Workspace login.
- `app/control-center/page.tsx` verifies that session and reads customer/support data through the server-side admin client.
- `SupportCommandCenter.tsx` already has the exact rep IDs and public-site identifiers needed to place support controls on each customer profile.

### Rep Workspace today

- `lib/supabase/auth.ts` derives the rep from the Supabase Auth user cookie.
- `lib/nic-nac/auth.ts` builds an authenticated Supabase client so row-level security enforces that rep's ownership.
- More than one hundred current call sites depend on `getAuthenticatedRep`, `getAuthenticatedNicNacContext`, or `getPaidNicNacContext`.
- The Workspace client calls `/api/nic-nac/*`, `/api/self-serve/*`, Stripe routes, and related APIs directly.

### Consequence

Changing `getAuthenticatedNicNacContext()` to prefer an operator cookie would be unsafe. It could grant support access to routes that were never reviewed, confuse Louis's own rep session with the target rep, bypass row-level security with an overly broad admin client, or expose billing/authentication paths accidentally.

The first release therefore uses:

```text
Control Center operator session
          │
          ▼
Create one audited support session for one rep
          │
          ▼
/control-center/support/[sessionId]
          │
          ▼
Support Workspace runtime adapter
          │
          ▼
Explicit /api/control-center/support-sessions/[sessionId]/... allowlist
          │
          ▼
Existing domain services with frozen target repId + operator attribution
```

The normal rep Workspace and its APIs remain unchanged unless a shared service must be extracted for safe reuse.

---

## 3. User Experience

### 3.1 Control Center customer profile

Add a **Support access** panel to every provisioned rep profile.

Controls:

- **Open public customer site** — opens the exact slug/custom-domain site without creating a support session.
- **Start support access** — opens the start dialog.
- **View access history** — opens the immutable session timeline for that rep.
- If the selected rep is not support-eligible, explain why and do not show an active start control.

The panel must not be placed inside the Billing card. Support access and billing are different operator concerns.

### 3.2 Start dialog

The dialog freezes and displays:

- Rep name.
- Business/show name.
- Email as an identity confirmation.
- Public-site slug/domain.
- Current account/setup status.
- A visible statement that billing, authentication, and account ownership remain blocked.

Required reason choices:

- Rep-requested setup help.
- Onboarding assistance.
- Troubleshooting a reported problem.
- Correcting customer-site or Workspace configuration.
- Follow-up on a support ticket.
- Other support reason.

Optional fields:

- Human-readable note, 10–500 characters when `Other` is selected.
- Linked Support report ID when the session starts from a report.

Final action copy:

**Notify rep and start support access**

The dialog explains that the rep receives an immediate Message Center notice and that all changes are logged.

### 3.3 Support Workspace

Use the real Workspace component family, but render it under:

`/control-center/support/[sessionId]`

The page has a persistent support banner above the normal Workspace shell:

```text
Support access
You are working in Kim's Workspace as Louis.
Reason: Onboarding assistance · Ends at 3:42 PM ET
[Open customer site] [View session log] [End support access]
```

Rules:

- The banner remains visible on desktop, mobile, drawers, dialogs, Live Site Preview, and Nic-Nac.
- The banner uses a visually distinct operator color, not the rep's skin, so the acting mode cannot be forgotten.
- The browser title includes `Support: <rep name> · Sparkle Suite`.
- Account/Billing and Password/Security controls are replaced with a clear blocked-state explanation.
- Logout becomes **End support access**. It must not log out the rep or Louis's separate Workspace session.
- A stale or ended session immediately replaces the Workspace with a closed-session screen.
- Back navigation cannot silently reactivate an ended session.

### 3.4 End flow

When Louis selects **End support access**:

1. Show the target rep, elapsed time, changed Workspace areas, and blocked actions attempted, if any.
2. Let Louis add a short completion summary for the rep; this is optional and must not contain credentials or private support notes.
3. End the session server-side.
4. Publish the completion Message Center notice.
5. Return to the target rep's Control Center profile and show the finalized history record.

If a session expires, the server performs the same closeout with `endedReason = expired`. The completion notice says the support window ended automatically.

### 3.5 Rep-visible transparency

The rep receives two immutable Sparkle Suite messages:

**Start notice**

- Title: `Sparkle Suite Support accessed your Workspace`
- Summary: `Louis opened a time-limited support session to help with account setup.`
- Body: operator display name, start time in the rep's timezone, reason, and the statement that billing/security actions were unavailable.
- Action: `View support access details`.

**Completion notice**

- Title: `Sparkle Suite Support finished working in your Workspace`
- Summary: duration and high-level areas changed.
- Body: end time, end reason, Louis's optional customer-safe completion summary, and a link to the history record.

The notice must never include raw before/after data, customer contact details, internal notes, message bodies, Live Queue codes, provider identifiers, or payment information.

### 3.6 Rep-visible history

Add a **Support access history** card under the rep's Account/Security information. This is available to the rep in normal mode and is read-only.

Each entry shows:

- Operator display name.
- Start/end timestamps in the rep's timezone.
- Reason.
- Status: active, completed, expired, or revoked.
- High-level Workspace areas viewed or changed.
- Customer-safe completion summary.

Do not expose internal diagnostic metadata, server routes, IP data, raw diffs, or audit failure details to the rep.

---

## 4. Authorization Model

### 4.1 Actor and subject are separate

Introduce a shared server contract:

```ts
type WorkspaceActor =
  | {
      mode: 'rep'
      actorRepId: string
      subjectRepId: string
    }
  | {
      mode: 'operator_support'
      operatorRepId: string
      operatorEmail: string
      operatorDisplayName: string
      subjectRepId: string
      supportSessionId: string
      capabilities: SupportCapability[]
    }
```

For rep mode, actor and subject are the same. For support mode, they never are.

Every mutation service used by support mode receives the full actor context or an audit envelope; passing only `repId` is not sufficient for support writes.

### 4.2 Session verification

Every support page and API request verifies all of the following server-side:

- A valid Control Center operator session exists.
- The operator in the cookie matches `operator_rep_id` on the support session.
- The support session exists and is `active`.
- Current time is before `expires_at`.
- The target rep still matches the frozen `target_rep_id`.
- The requested capability is present in the frozen session capability snapshot.
- The HTTP Origin is the Sparkle Suite origin for mutations.
- A session-specific CSRF value accompanies mutations.
- The session has not been ended, revoked, or superseded.

`sessionId` is an identifier, not a bearer credential. Possessing the URL without the valid Control Center session and CSRF binding grants nothing.

### 4.3 No rep login artifacts

The implementation must never:

- Ask for the rep's password.
- Reset the rep's password.
- Send a magic link for the rep.
- Generate a login link for the operator.
- Copy a Supabase refresh/access token.
- Change `auth_user_id`.
- Set Supabase Auth cookies for the target rep.
- Mint a JWT that claims the operator is the target rep.
- Store credentials or one-time codes in the support session.

### 4.4 Capability allowlist

Support access is deny-by-default. No route becomes support-enabled merely because it lives under `/api/nic-nac` or uses `repId`.

Initial capabilities:

| Capability | Initial behavior |
| --- | --- |
| `workspace.view` | Read target Workspace shell and setup state. |
| `site.view` | View exact public site and Live Site Preview. |
| `site.manage` | Edit customer-site copy, layout settings, social links, media, and supported recipes. |
| `inventory.view` | View Jewelry Library, Dance Floor, trade requests, fulfillment, and history. |
| `inventory.manage` | Add/update supported inventory and complete normal workflow actions with audit. |
| `calendar.view` | View show calendar. |
| `calendar.manage` | Add/update/cancel normal calendar events with audit. |
| `customers.view` | View the target rep's Customer List for support purposes. |
| `customers.manage` | Correct target-rep customer records and imports with audit and existing consent rules. |
| `team.view` | View Team Management and onboarding state. |
| `team.manage` | Edit non-communication team settings and participant setup data. |
| `messages.view` | Read the rep's Message Center only when necessary for the support task; do not mark messages read merely because Louis viewed them. |
| `nic_nac.use` | Use a support-specific Nic-Nac conversation with support-safe tools. |
| `live_queue.view` | View setup state needed to help with Live Queue. Never copy its private code into logs or messages. |

Permanently or initially blocked capabilities:

| Blocked area | Enforcement |
| --- | --- |
| Stripe checkout and billing portal | UI absent plus server/API denial. |
| Subscription, pricing tier, discounts, entitlements | No support capability; deny all reads that expose provider/payment details and all writes. |
| Payment methods, invoices, cards, charges | No support route or service call. |
| SMS wallet balance/reload/auto-recharge | UI absent plus server/API denial. |
| Authentication/password/email ownership | No support route; normal auth endpoints reject support-mode origin. |
| Account ownership/status/deletion | No support route; immutable target during session. |
| OAuth/API keys/provider credentials | No display, fetch, or mutation. |
| Email/SMS/customer outbound sends | Block in v1. Design separately with action-time approval and operator attribution. |
| Rep Network or Team messages sent as the rep | Block in v1; an operator may never masquerade as the rep in private conversation. |
| Data exports containing customer PII | Block in v1. |
| Message read/archive state | Support viewing must not change the rep's unread/archive state. |
| Live Queue extension or Chrome Web Store settings | Outside scope and protected by repository rules. |
| Sparkle Lab, feature flags, deployments, DNS, provider configuration | Outside the support session entirely. |

### 4.5 Route inventory gate

Create a checked-in route classification manifest containing every Workspace-affecting route and one classification:

- `support_allowed_read`
- `support_allowed_write`
- `support_blocked_sensitive`
- `rep_only`
- `not_applicable`

A test scans `app/api/nic-nac`, `app/api/self-serve`, `app/api/stripe`, relevant auth routes, and new support routes. CI fails when a new route has no classification. This prevents future features from becoming support-accessible by accident.

---

## 5. Database Design

Create one migration, provisionally:

`supabase/migrations/20260829120000_ss_operator_support_access.sql`

Use the final timestamp at implementation time to avoid collisions.

### 5.1 `operator_support_sessions`

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id uuid primary key` | Public session identifier; random and non-secret. |
| `operator_rep_id uuid` | Internal operator identity. |
| `operator_email_snapshot text` | Attribution preserved if operator profile changes. |
| `operator_display_name_snapshot text` | Rep/customer-visible attribution. |
| `target_rep_id uuid` | Frozen subject account. |
| `target_name_snapshot text` | Human-readable historical identity. |
| `target_business_snapshot text` | Human-readable historical business identity. |
| `reason_code text` | Approved reason enum/check constraint. |
| `reason_note text null` | Sanitized customer-safe reason note. |
| `support_report_id uuid null` | Optional link to the triggering Support report. |
| `status text` | `pending_notice`, `active`, `ended`, `expired`, `revoked`, `failed`. |
| `capabilities jsonb` | Frozen allowlist snapshot. |
| `csrf_token_hash text` | Hash only; never store the raw value. |
| `started_at timestamptz null` | Set only after start notice is proven. |
| `last_activity_at timestamptz null` | Server-updated activity marker. |
| `expires_at timestamptz` | Absolute expiry. |
| `extended_at timestamptz null` | Explicit extension evidence. |
| `ended_at timestamptz null` | Final end time. |
| `ended_reason text null` | `operator`, `expired`, `revoked`, `control_center_logout`, `target_ineligible`, `failure`. |
| `completion_summary text null` | Customer-safe optional closeout. |
| `start_publication_id uuid null` | Start notice evidence. |
| `end_publication_id uuid null` | Completion notice evidence. |
| `created_at`, `updated_at` | Standard timestamps. |

Constraints and indexes:

- Target and operator must differ unless a deliberate internal-demo exception is separately approved; default is to reject self-support sessions.
- Reason note length and allowed reason codes enforced in the database.
- Status/timestamp consistency checks.
- `capabilities` must be a JSON array from the known capability set.
- Partial unique index: one `active` or `pending_notice` session per operator.
- Partial unique index: one `active` or `pending_notice` session per target rep.
- Recent-history indexes by target and operator.
- No cascade deletion from rep records; preserve historical evidence with restricted/set-null behavior plus snapshots.

### 5.2 `operator_support_audit_events`

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id uuid primary key` | Event identity. |
| `support_session_id uuid` | Parent support session. |
| `operator_rep_id uuid` | Acting operator. |
| `target_rep_id uuid` | Affected account. |
| `event_type text` | Stable event vocabulary. |
| `workspace_area text` | Site, calendar, inventory, customers, team, Nic-Nac, etc. |
| `capability text null` | Capability checked. |
| `resource_type text null` | Safe domain resource label. |
| `resource_id text null` | Internal record ID when useful. |
| `action_name text null` | Stable service/action name, not raw route text. |
| `result text` | `attempted`, `succeeded`, `failed`, `denied`. |
| `safe_diff jsonb` | Redacted field-change summary. |
| `error_code text null` | Stable product error code only. |
| `idempotency_key text null` | Retry protection. |
| `request_id text null` | Correlates server logs without embedding content. |
| `created_at timestamptz` | Immutable event time. |

Event vocabulary includes:

- `session_requested`
- `rep_notice_published`
- `session_started`
- `workspace_area_viewed`
- `public_site_opened`
- `mutation_attempted`
- `mutation_succeeded`
- `mutation_failed`
- `blocked_action_attempted`
- `session_extended`
- `session_end_requested`
- `session_ended`
- `session_expired`
- `session_revoked`
- `completion_notice_published`

Append-only rules:

- Service-role/server can insert.
- No product path can update or delete.
- `anon` and `authenticated` receive no direct table privileges.
- The operator and rep receive safe views through server APIs only.
- A database trigger rejects update/delete even if a future privilege is misconfigured.

### 5.3 Safe diff contract

Allowed examples:

```json
{
  "changedFields": ["bannerText", "appearancePreset"],
  "before": {"appearancePreset": "sparkle_suite_morganite"},
  "after": {"appearancePreset": "sparkle_suite_alpine_opal"}
}
```

Sensitive fields use markers only:

```json
{
  "changedFields": ["customerEmail"],
  "before": {"customerEmail": "[redacted]"},
  "after": {"customerEmail": "[redacted]"}
}
```

Never store:

- Passwords, tokens, cookies, auth codes, Live Queue codes, payment/provider IDs, full message bodies, uploaded file contents, raw customer lists, private links, or unrestricted request/response bodies.
- Billing data, even as a diff, because support access cannot touch it.

### 5.4 Transaction and activation RPCs

Prefer narrow database functions for state transitions:

- `request_operator_support_session(...)`
- `activate_operator_support_session(...)`
- `extend_operator_support_session(...)`
- `end_operator_support_session(...)`
- `expire_operator_support_sessions(...)`
- `append_operator_support_audit_event(...)`

Each function validates current state and operator/target identity. No generic “update support session” RPC is exposed.

---

## 6. Message Center Integration

### 6.1 Schema and sender

Add an `account_activity` Message Center category to the TypeScript and database constraints. Register one automation sender:

```text
sender_key: support_access_notifier
display_name: Sparkle Suite Support
sender_type: automation
capabilities: selected audience + account_activity only
```

The sender cannot broadcast and cannot publish any other category.

### 6.2 Start notification is an activation gate

Session creation flow:

1. Create `pending_notice` session and `session_requested` audit atomically.
2. Publish a selected-audience Message Center notice with exactly one frozen target rep.
3. Verify publication status, one intended recipient, and one delivery.
4. Store `start_publication_id` and transition to `active` through the guarded RPC.
5. Return the support Workspace URL only after activation succeeds.

If steps 2–4 fail, the session remains unusable, status becomes `failed`, and Control Center shows the exact safe failure. Retry uses an idempotency key derived from the support session ID and may not duplicate the rep notice.

### 6.3 Completion notification

Ending/expiration creates one idempotent completion notice. A failed completion notice does not reopen the session. It remains visible as an operator-health failure and retries through the existing Message Center outbox pattern until delivered.

Idempotency keys:

- `support-access-start:<sessionId>`
- `support-access-end:<sessionId>`

### 6.4 Rep action link

The Message Center action URL points to a normal rep-authenticated history route, never the Control Center support URL:

`/nic-nac?section=account&panel=support-access&session=<sessionId>`

The history API verifies the rep owns the target account before returning the customer-safe record.

---

## 7. Support Workspace Runtime and API Gateway

### 7.1 Client runtime adapter

Introduce a Workspace runtime provider:

```ts
type WorkspaceRuntime =
  | { mode: 'rep' }
  | {
      mode: 'operator_support'
      sessionId: string
      csrfToken: string
      operator: { displayName: string }
      target: { repId: string; displayName: string; businessName: string }
      expiresAt: string
      capabilities: SupportCapability[]
    }
```

Add a single request helper used by Workspace components:

- Rep mode maps logical endpoints to the current `/api/nic-nac/*` and `/api/self-serve/*` URLs.
- Support mode maps only classified logical endpoints to `/api/control-center/support-sessions/[sessionId]/*`.
- Unsupported logical endpoints return a typed `SUPPORT_ACTION_BLOCKED` result before a network request.
- Support mutations include the CSRF header and an idempotency/request ID.

Add a static test that rejects new hard-coded `fetch('/api/nic-nac` and `fetch('/api/stripe` calls inside shared Workspace components. All new calls must go through the adapter.

### 7.2 Explicit support routes

Do not create an unrestricted catch-all proxy. Create explicit route handlers for approved capabilities, such as:

```text
/api/control-center/support-sessions/[sessionId]/context
/api/control-center/support-sessions/[sessionId]/setup-state
/api/control-center/support-sessions/[sessionId]/site-settings
/api/control-center/support-sessions/[sessionId]/site-settings/media
/api/control-center/support-sessions/[sessionId]/site-recipes
/api/control-center/support-sessions/[sessionId]/calendar
/api/control-center/support-sessions/[sessionId]/trade-board
/api/control-center/support-sessions/[sessionId]/trade-requests
/api/control-center/support-sessions/[sessionId]/fulfillment
/api/control-center/support-sessions/[sessionId]/customer-audience
/api/control-center/support-sessions/[sessionId]/team-management
/api/control-center/support-sessions/[sessionId]/messages
/api/control-center/support-sessions/[sessionId]/nic-nac
/api/control-center/support-sessions/[sessionId]/audit
/api/control-center/support-sessions/[sessionId]/end
```

The final route names should follow existing domain names, but every file must declare its required support capability.

### 7.3 Shared handler/service extraction

Where rep and support routes perform the same business operation:

1. Move payload validation and domain logic into a shared service/handler.
2. Keep rep route authentication and RLS client unchanged.
3. Let the support route call the same service with an admin client, frozen target `repId`, and operator audit envelope.
4. Require every query/mutation to carry an explicit target-rep predicate.
5. Verify the returned/changed record still belongs to the target rep.
6. Write the support audit only after the domain result is known.

Never pass an unrestricted admin client into client code, the model, or a generic route forwarder.

### 7.4 Server-side billing and security denial

The support Workspace does not render billing/security controls, but UI hiding is not sufficient.

Add explicit support-session denial to:

- `/api/nic-nac/account-billing`
- `/api/nic-nac/wallet-summary`
- `/api/nic-nac/send-email`
- all Stripe checkout, portal, sync, subscription, and webhook-triggering client routes
- password reset/change and account identity routes
- account deletion/status/ownership routes
- customer export routes
- any provider-credential or code-rotation routes

The denial should be `403 SUPPORT_ACTION_BLOCKED`, create a `blocked_action_attempted` audit event when a valid support session caused it, and never call the downstream provider/service.

### 7.5 Subscription gating

Support access does not grant, repair, or simulate a paid entitlement.

For a provisioned target rep:

- The support Workspace may load setup/site configuration needed to help the rep even when normal access is pending or setup-blocked.
- It must not change subscription, entitlement, pricing reservation, or checkout state.
- Public-site visibility remains governed by the account's real status.
- Expired/cancelled accounts are read-only by default; a future policy can add narrowly approved configuration repair without changing billing state.

---

## 8. Nic-Nac Support-Mode Contract

Nic-Nac must not believe Louis is Kim merely because the target `repId` is Kim's.

### 8.1 Separate support conversation

- Create or resume a Nic-Nac conversation linked to `support_session_id`.
- Do not reuse the rep's latest personal Nic-Nac conversation.
- Store operator-authored turns with an explicit support/operator actor type and operator ID.
- Keep the support conversation available for internal audit and troubleshooting.
- Do not hydrate it into the rep's ordinary “latest conversation” flow after the support session ends.

### 8.2 Model-facing context

Every support-mode turn includes an app-owned context block:

```ts
{
  product: 'sparkle_suite',
  surface: 'operator_support_workspace',
  actor: { type: 'operator_support', displayName: 'Louis' },
  subject: { repId: '<target>', displayName: '<rep>' },
  supportSessionId: '<session>',
  reason: '<approved reason>',
  capabilities: ['site.manage', 'inventory.manage', ...],
  blockedCapabilities: ['billing', 'auth', 'outbound_communications', ...]
}
```

Application code owns this state. Prompt text alone is not an authorization control.

### 8.3 Tool policy

- The shared Nic-Nac core remains shared; do not copy a second “Support Nic-Nac.”
- Product/surface/actor/capability context filters the existing tool registry.
- Billing, wallet, checkout, account identity, email/SMS send, Rep Network send, and unsupported provider tools are absent.
- Target-account tools receive the frozen target `repId` from server context; the model cannot supply or change it.
- Every support tool call records session ID, workflow, tool name, result, and safe mutation summary.
- Existing stateful workflow rules remain authoritative. Support mode does not bypass photo roles, validation, approvals, database verification, or human-escalation rules.

### 8.4 Memory policy

- Louis's support conversation must not become evidence that the rep personally stated a preference.
- Ordinary “remember this for the future” requests from support mode are blocked from rep preference memory.
- Configuration changes use their normal structured Workspace services and are attributed to the support session.
- If Louis needs to record a fact the rep explicitly supplied, use a separate, audited `rep_provided_via_support` path with source/support-session attribution; do not silently store it as direct rep speech.
- Never store support-session secrets, credentials, payment information, private customer content, or internal-only notes in Nic-Nac memory.

### 8.5 Verification

Nic-Nac support-mode changes require:

- Deterministic actor/capability tests.
- Tool-list tests proving blocked tools are absent.
- Tests proving the target `repId` cannot be changed by model input.
- Tests proving rep preference memory is not written from ordinary support turns.
- A reviewer/synthetic model replay that performs one allowed customer-site update and one blocked billing request.
- Transcript, tool-call, database, and support-audit assertions.

---

## 9. Audit Semantics

### 9.1 What “log every access” means

Every time Louis enters a rep account, create exactly one durable support session. That session is the primary access record even if no change occurs.

Within it, log:

- Major Workspace areas viewed, deduplicated to avoid hundreds of polling events.
- Every mutation attempt and result.
- Every denied sensitive action.
- Public-site opens launched from the support Workspace.
- Nic-Nac tool calls and results.
- Session extension and closeout.

Do not create an event for every polling GET, asset request, or background refresh. “Viewed Site Settings” is useful; 60 identical inbox-refresh events are not.

### 9.2 Mutation wrapper

Create a single server utility:

```ts
withOperatorSupportMutation({
  actor,
  capability,
  workspaceArea,
  actionName,
  resourceType,
  resourceId,
  buildSafeDiff,
  execute,
})
```

Behavior:

1. Verify session/capability/target/CSRF.
2. Insert or reserve an idempotent `mutation_attempted` event.
3. Execute the target-rep-scoped domain mutation.
4. Verify ownership and result.
5. Insert `mutation_succeeded` with safe diff, or `mutation_failed` with stable error code.
6. Never turn an audit failure into a false domain success. For support mode, a mutation is not acknowledged as complete unless its audit success event is durable.

### 9.3 Operator history UI

Control Center history supports:

- Filter by rep, operator, date, status, reason, Workspace area, or Support report.
- Session summary row with duration and mutation counts.
- Expandable chronological events.
- Clear denied/failed event styling.
- Links to the source Support report and safe customer-site URL.
- CSV/export is not part of v1 because the history may contain sensitive operational metadata.

---

## 10. Failure and Edge-Case Behavior

| Situation | Required behavior |
| --- | --- |
| Start notice cannot be delivered | Session stays closed/failed; no Workspace URL returned. |
| Duplicate start request/retry | Return the same session/publication or a safe conflict; never duplicate notices. |
| Operator opens second rep | Block and link to the existing active session. |
| Target rep is deleted/deactivated during access | Revoke immediately; no further reads/writes. |
| Control Center session expires | Support route closes; server expires/revokes support session. |
| Browser closes without ending | Session expires server-side and completion notice is queued. |
| Network drops during mutation | Idempotency key prevents duplicate write; UI reloads audit result. |
| Domain write succeeds but audit success insert fails | Return unresolved/error state and alert operator health; do not claim completion. Reconcile by request ID before retry. |
| Audit write is unavailable before mutation | Do not execute mutation. |
| Message Center polling occurs in support mode | Do not change rep read/archive state. |
| Rep is simultaneously using Workspace | Changes remain real-time normal data changes; rep notice/history identify the support session. Avoid full Workspace reloads. |
| Louis has his own rep Workspace open | Support route remains isolated; no target state leaks into Louis's normal Workspace and vice versa. |
| Back button reaches ended support URL | Show ended-session page; never reactivate. |
| Support target appears to require checkout unexpectedly | Do not open checkout or repair billing. Show status and return to Control Center investigation workflow. |
| Live Queue code is viewed | Allow only when needed for setup; never copy it into audit, messages, logs, source, vault, or Open Brain. |
| Uploaded files are used | Existing file validation/storage rules apply; audit stores only safe file role/record ID, not file content. |

---

## 11. Implementation Work Breakdown

### Phase A — Architecture lock and red tests

Files to add/modify:

- Add this plan.
- Add a route classification manifest under `lib/operator-support/`.
- Add capability and actor type definitions.
- Add red schema/auth/route-classification tests.
- Read the applicable Next.js 16.2.1 guides under `node_modules/next/dist/docs/` before editing routes, cookies, server/client boundaries, or dynamic pages.

Tasks:

- [ ] Inventory every current Workspace, self-serve, Stripe, auth, message, upload, and provider route.
- [ ] Classify every route before support implementation.
- [ ] Freeze v1 capability names and blocked areas.
- [ ] Define safe-diff redaction rules.
- [ ] Define support-specific Nic-Nac actor and memory contracts.
- [ ] Add tests proving normal rep auth and Control Center auth remain independent.

Exit criteria:

- Every existing route has an explicit classification.
- Tests fail because support-session schema/services do not yet exist.
- No application behavior is changed.

### Phase B — Database and core session service

Expected files:

- New Supabase migration.
- `lib/operator-support/types.ts`
- `lib/operator-support/capabilities.ts`
- `lib/operator-support/session-service.ts`
- `lib/operator-support/audit.ts`
- `lib/operator-support/redaction.ts`
- Focused migration/service tests.

Tasks:

- [ ] Create session and audit tables, constraints, indexes, trigger protections, and RPCs.
- [ ] Add secure CSRF generation/hash verification.
- [ ] Implement request, activate, extend, end, expire, and revoke services.
- [ ] Implement append-only event writer and mutation wrapper.
- [ ] Add exact operator/target guards.
- [ ] Add idempotency and concurrency tests.

Exit criteria:

- Direct authenticated/anonymous table writes are impossible.
- Update/delete of audit rows is rejected.
- One active session per operator/target is enforced under races.
- Expired/revoked sessions cannot pass capability checks.

### Phase C — Message Center transparency

Expected files:

- Modify workspace message migration through a new additive migration.
- Modify `lib/services/workspace-message-permissions.ts`.
- Extend automation/outbox processing for support access.
- Add rep-safe support-access history service/API.
- Add Message Center and idempotency tests.

Tasks:

- [ ] Add `account_activity` category and `support_access_notifier` sender.
- [ ] Build exact-one-recipient start and end publications.
- [ ] Require successful start delivery before activation.
- [ ] Add completion retry/health behavior.
- [ ] Add normal-rep support history API and action URL.

Exit criteria:

- Start retry cannot send twice.
- Wrong-recipient or changed-audience conditions fail closed.
- A session cannot become active without one verified delivery.
- Rep history cannot read another rep's sessions.

### Phase D — Control Center controls and history

Expected files:

- Modify `SupportCommandCenter.tsx` or split a dedicated customer/support component.
- Add start dialog, active-session card, and history UI.
- Add `/api/control-center/support-sessions` routes.
- Add Control Center UI/route tests.

Tasks:

- [ ] Add public-site, start-support, and history controls to the exact rep profile.
- [ ] Build frozen-identity preview and reason capture.
- [ ] Link sessions to Support reports when present.
- [ ] Display active-session conflicts clearly.
- [ ] Add operator history filters and event timeline.

Exit criteria:

- Louis sees the exact rep before starting.
- No start request can omit a valid reason.
- The UI cannot start a second active session.
- Customer/demo classification does not control authorization; exact rep identity does.

### Phase E — Support Workspace shell and request adapter

Expected files:

- Add `app/control-center/support/[sessionId]/page.tsx`.
- Add a support banner and closed-session screen.
- Add `WorkspaceRuntimeProvider` and request adapter.
- Refactor shared Workspace API calls away from hard-coded URLs.
- Add responsive and accessibility tests.

Tasks:

- [ ] Render the existing Workspace shell in support mode.
- [ ] Keep Louis's normal Workspace session untouched.
- [ ] Replace Account/Billing/Security with blocked-state UI.
- [ ] Add expiration countdown and end action.
- [ ] Ensure every dialog/drawer retains acting-as context.
- [ ] Make Message Center viewing non-mutating in support mode.

Exit criteria:

- Support mode is unmistakable at every viewport.
- Ending support does not sign out either the rep or Louis.
- Hard-coded API calls cannot bypass the runtime adapter.
- Closed/expired URLs stay closed.

### Phase F — Read-only domain coverage

Implement read coverage before writes:

- Setup state and Workspace identity.
- Customer-site settings and Live Site Preview.
- Inventory/Dance Floor/trades/fulfillment.
- Calendar.
- Customer List.
- Team Management.
- Message Center read-only behavior.
- Public site.

Tasks:

- [ ] Add explicit support routes and capability checks.
- [ ] Use frozen target rep ID for every query.
- [ ] Add cross-rep isolation tests per domain.
- [ ] Add deduplicated `workspace_area_viewed` audit events.
- [ ] Prove billing/security/provider data is absent.

Exit criteria:

- Every visible record belongs to the target rep or approved shared catalog/resource data.
- Cross-rep IDs in URL/body/query are ignored or rejected.
- Rep unread/archive state is unchanged.

### Phase G — Audited write coverage

Enable one domain at a time:

1. Customer-site settings and media.
2. Required setup/onboarding answers.
3. Calendar.
4. Inventory/Dance Floor and fulfillment.
5. Customer List corrections/imports.
6. Recipes.
7. Team Management non-communication settings.

For each domain:

- [ ] Extract/reuse the domain service.
- [ ] Add capability and payload validation.
- [ ] Add exact target ownership checks.
- [ ] Add idempotency.
- [ ] Add safe before/after diff.
- [ ] Add success/failure/denial audit.
- [ ] Add focused rep-mode regression tests.
- [ ] Add support-mode allow/deny/cross-rep tests.

Exit criteria:

- No support write can happen without a durable audit attempt.
- No support write reports success without durable success audit.
- Normal rep behavior and RLS remain unchanged.

### Phase H — Nic-Nac support mode

Expected files:

- Extend shared Nic-Nac actor/surface context.
- Add support conversation linkage/actor fields if the current schema cannot represent them safely.
- Add support tool policy and audit bridge.
- Add memory-source restrictions.
- Add deterministic and model-in-loop tests.

Tasks:

- [ ] Create support-specific conversation continuity.
- [ ] Feed explicit actor/subject/capability state to the controller/model.
- [ ] Filter tools in application code.
- [ ] Freeze target rep server-side.
- [ ] Prevent ordinary rep-preference memory writes.
- [ ] Preserve stateful workflow validation and observability.

Exit criteria:

- Nic-Nac never calls Louis “Kim” or attributes operator speech to Kim.
- Billing/auth/outbound tools are absent.
- Target rep cannot be changed through prompt injection or tool input.
- One allowed mutation and one denied billing request pass reviewer replay.

### Phase I — Closeout, history, expiration, and health

Tasks:

- [ ] Build session end review and optional customer-safe summary.
- [ ] Add idempotent completion notification.
- [ ] Add scheduled/triggered expiration processing.
- [ ] Add operator-health counts for failed notices, failed audits, stale active sessions, and reconciliation-needed mutations.
- [ ] Add safe revocation control.

Exit criteria:

- Browser abandonment still produces a final expired record and notice.
- Failed transparency/audit events are visible to the operator.
- Revocation stops the next request immediately.

### Phase J — Full verification and release

Automated verification:

- [ ] Migration/schema/RLS contract tests.
- [ ] Operator auth/session/CSRF tests.
- [ ] Route inventory completeness test.
- [ ] Capability allow/deny tests.
- [ ] Cross-rep isolation tests across every enabled domain.
- [ ] Message Center exact-recipient/idempotency tests.
- [ ] Audit immutability/redaction/idempotency tests.
- [ ] Normal rep Workspace regression suite.
- [ ] Nic-Nac actor/tool/memory/replay tests.
- [ ] TypeScript, ESLint, focused Vitest, production build.

Reviewer smoke:

- [ ] Use only isolated synthetic reviewer reps; never Louis's personal account or a real customer for pre-release mutation proof.
- [ ] Seed two distinguishable reps to prove cross-rep isolation.
- [ ] Start support session for rep A and prove rep B data is inaccessible.
- [ ] Verify exact start notice for rep A.
- [ ] View each enabled area without changing Message Center read state.
- [ ] Change a customer-site setting and verify UI, database, public preview, and audit.
- [ ] Perform one Nic-Nac-backed allowed workflow and verify tool/database/audit outcome.
- [ ] Attempt billing, wallet, auth, outbound email/SMS, and cross-rep operations; prove every one is denied before provider/business mutation.
- [ ] End the session and verify completion notice/history.
- [ ] Retry old URL and prove it remains closed.
- [ ] Reset/reseed all synthetic records and confirm no residual active session.

Release prerequisites:

- [ ] Read current vault memory and the July 31 production incident.
- [ ] Verify repo, remote, allowlisted branch, exact HEAD, Vercel project, deployment target, and both Suite aliases.
- [ ] Apply the migration with remote schema verification.
- [ ] Commit and push the exact verified branch tip.
- [ ] Manually deploy that exact tip once to production.
- [ ] Confirm `https://www.yoursparklesuite.com` and `https://yoursparklesuite.com` resolve to the exact deployment.
- [ ] Run the supported production reviewer smoke on the live `www` domain.
- [ ] Scan production errors and support-access health.
- [ ] Preserve the prior production deployment as rollback evidence.

---

## 12. Test Matrix

| Case | Expected result |
| --- | --- |
| Non-operator calls session-create API | `401/403`; no session, audit, or notice. |
| Operator starts exact rep with reason | One pending record, one start notice, one active session. |
| Start notice target changes | Activation fails; no access. |
| Start request retried | Same idempotent session/notice; no duplicate. |
| Operator opens second rep | Blocked until first session ends. |
| Guessed session ID without operator cookie | `401`; no data. |
| Valid operator with another operator's session ID | `403`; audited where safe. |
| Expired/revoked session requests data | `403/410`; no data. |
| Cross-rep resource ID in allowed route | `404/403`; no data or mutation. |
| Site setting update | Target rep changes; safe diff and operator identity recorded. |
| Billing route requested | `403 SUPPORT_ACTION_BLOCKED`; Stripe never called. |
| Password/auth route requested | Denied; Supabase Auth admin never called. |
| Email/SMS send requested | Denied; provider never called. |
| Message Center viewed | Rep unread/archive state unchanged. |
| Audit table update/delete attempted | Database rejection. |
| Mutation request replayed | One domain mutation and one success result. |
| Operator closes session | Writes stop; completion notice/history finalize. |
| Browser abandoned | Expiry finalizes session and queues completion notice. |
| Rep normal Workspace after release | Existing login, RLS, billing, messages, and Nic-Nac behavior unchanged. |
| Louis normal Workspace open concurrently | No state/cookie/account collision. |
| Nic-Nac support prompt requests another rep | Frozen target remains unchanged; attempt denied/logged. |
| Nic-Nac asked to remember operator speech as rep preference | Refused or routed to audited support-source path. |

---

## 13. Expected File Map

Final names may adjust to repository conventions, but the implementation should remain structurally recognizable.

### New server/domain files

- `lib/operator-support/types.ts`
- `lib/operator-support/capabilities.ts`
- `lib/operator-support/route-classification.ts`
- `lib/operator-support/session-service.ts`
- `lib/operator-support/request-context.ts`
- `lib/operator-support/audit.ts`
- `lib/operator-support/redaction.ts`
- `lib/operator-support/messages.ts`
- `lib/operator-support/mutation.ts`

### New UI/routes

- `app/control-center/_components/OperatorSupportAccessPanel.tsx`
- `app/control-center/_components/OperatorSupportStartDialog.tsx`
- `app/control-center/_components/OperatorSupportHistory.tsx`
- `app/control-center/support/[sessionId]/page.tsx`
- `app/control-center/support/[sessionId]/_components/SupportAccessBanner.tsx`
- `app/api/control-center/support-sessions/route.ts`
- `app/api/control-center/support-sessions/[sessionId]/...`

### Shared Workspace refactors

- `app/nic-nac/_workspace-runtime.tsx` or equivalent provider.
- `lib/nic-nac/workspace-request.ts` or equivalent logical endpoint adapter.
- Targeted changes to `_client.tsx`, `DashboardPlaceholder.tsx`, Nic-Nac chat transport, and domain cards.

### Database/tests/docs

- New operator-support migration.
- New schema, session, capability, route inventory, UI, audit, Message Center, isolation, and Nic-Nac tests.
- Production smoke script with synthetic seed/reset.
- Operator runbook after implementation.
- Security/privacy disclosure review before production launch.

---

## 14. Acceptance Criteria

The feature is complete only when all of the following are true:

- Louis can start support access from the exact rep's Control Center profile without the rep's password.
- The target rep receives a verified start notice before the Workspace opens.
- The support Workspace unmistakably identifies Louis, the target rep, the reason, and expiration.
- Louis can perform the approved setup, customer-site, operational, and Nic-Nac workflows against the target account.
- Every support session exists in immutable history even when no mutation occurs.
- Every mutation records operator, target, session, time, action, result, and safe change details.
- The rep can see a customer-safe support-access history and receives a completion notice.
- Billing, payment, subscription, wallet, authentication, ownership, deletion, provider credentials, outbound communications, and unsafe exports are denied at the server boundary.
- The support mechanism does not create or borrow a rep Auth session.
- Rep RLS and ordinary Workspace behavior remain unchanged.
- Cross-rep access and target switching are impossible under unit, integration, and reviewer-smoke tests.
- Nic-Nac distinguishes operator from rep, freezes the target in app state, filters tools by support capabilities, and does not misattribute operator speech as rep memory.
- Session expiration, revocation, browser abandonment, retries, and audit/message failures behave safely.
- The production release is the exact verified allowlisted branch tip, both Suite domains resolve to it, and the live reviewer smoke passes with synthetic data and no real charges or customer/provider side effects.

---

## 15. Explicit Non-Goals for v1

- No password bypass or credential recovery mechanism.
- No hidden impersonation.
- No billing or subscription repair through support mode.
- No Stripe/provider dashboard embedding.
- No outbound email, SMS, Rep Network, or Team message sent as the rep.
- No customer-data export.
- No silent Message Center read/archive changes.
- No multi-operator simultaneous session on one rep.
- No remote screen sharing or browser takeover of the rep's device.
- No Chrome extension or Live Queue extension changes.
- No Grok Bot/MCP ability to create or use operator support sessions in v1.
- No Guardian/Lab/deployment/DNS controls inside the support Workspace.
- No account classification rewrite as part of this feature.

---

## 16. Main Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Operator support is mistaken for rep login | Separate route, actor/subject model, persistent banner, separate conversation, explicit audit. |
| Admin client bypasses RLS too broadly | No generic proxy; explicit routes/capabilities, frozen target, target predicates, ownership verification, isolation tests. |
| A new route becomes support-enabled accidentally | Checked-in route classification manifest and CI completeness gate. |
| Billing is hidden but still callable | Server denial at billing/Stripe/auth boundaries plus provider-not-called tests. |
| Louis's own Workspace collides with target account | Independent Control Center/support route and request adapter; no target Auth cookies. |
| Audit gaps make changes untrustworthy | Fail closed before writes; success not acknowledged until durable audit; reconciliation health alerts. |
| Rep notification is delayed or duplicated | Start-delivery activation gate, frozen audience, idempotency, outbox retry for closeout. |
| Audit captures secrets or PII | Central redaction contract, allowlisted safe diffs, static/runtime tests, no raw request bodies. |
| Message viewing changes the rep's inbox | Dedicated non-mutating support read path. |
| Nic-Nac writes operator speech as rep memory | App-owned actor context, separate support conversation, memory-source restrictions, tests/replays. |
| Support session remains active after browser closes | Absolute expiry, server-side stale-session finalizer, completion notice. |
| Rep and Louis edit the same field concurrently | Use current timestamps/version checks where available; return conflicts instead of silently overwriting newer rep changes. |
| Support access is used outside customer-service purpose | Mandatory reason, one target, time limit, immutable history, rep notices, operator history, future policy review. |

---

## 17. Recommended Build Order

Build this as a sequence of independently reviewable checkpoints:

1. Route inventory, actor/capability contracts, and red tests.
2. Database session/audit model and guarded state transitions.
3. Message Center start-notice activation gate and rep history.
4. Control Center start/history UI.
5. Support Workspace shell and API runtime adapter.
6. Read-only account coverage and cross-rep isolation proof.
7. Customer-site/setup writes with full audit.
8. Remaining approved operational writes, one domain at a time.
9. Nic-Nac support-mode actor/tool/memory integration.
10. Expiration/closeout/operator health.
11. Full synthetic reviewer smoke, release, and live verification.

Do not begin with a broad impersonation cookie or a one-line change to `getAuthenticatedRep()`. The first implementation checkpoint must establish the actor/subject/session/audit foundation; otherwise later convenience refactors will erase the very accountability this feature is meant to provide.
