# Sparkle Suite Phase 5 Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Phase 5 by moving Sparkle Suite SMS/email from code-ready to verified provider-ready: Telnyx campaign assignment and handset proof, Resend one-off email proof, safe pre-show reminder enablement, and tracker/doc updates.

**Architecture:** Keep live provider actions behind explicit Louis approval. Finish the current one-off SMS/email surfaces first, then enable pre-show reminders through a guarded cron route with dry-run as the default. Update product prompts, prelaunch gates, HQ/Open Brain, and evidence docs only after proof exists.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, Telnyx 10DLC, Resend, Vitest, existing Sparkle Suite `message_log`, `sms_wallet`, `customer_audience`, and calendar services.

---

## Operating Guardrails

- Do not attach `+19044383050` to any Telnyx campaign until Louis explicitly approves that exact action.
- Do not send live SMS, live email, SignWell, Stripe, calendar, or other provider actions unless the current step explicitly asks Louis for approval and Louis approves.
- Stripe remains test mode only.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not touch `docs/sparkle-suite/marketing` unless Louis explicitly asks.
- Do not move Kim Goforth.
- Rep-facing assistant name is Nic-Nac.
- Treat existing uncommitted mobile polish/skin work as user-owned. Do not revert or mix it into Phase 5 commits unless Louis asks.

## Current Phase 5 Truth

HQ phase state on 2026-05-25:

- Phase 5 `SMS/Email Automation`: `in_progress`, 7 tasks, 4 complete.
- `5.1 Telnyx SMS integration`: `in_progress`.
- `5.2 Resend email integration`: `in_progress`.
- `5.3 Wallet deduction + balance enforcement`: `complete`.
- `5.4 AI content screening`: `complete`.
- `5.5 Send cap enforcement`: `complete`.
- `5.6 Customer opt-in forms`: `complete`.
- `5.7 Pre-show SMS reminder`: `not_started`.

Live Telnyx portal state observed on 2026-05-25:

- Brand `Sparkle Suite`: `Verified`.
- Brand TCR ID: `B6LGQP3`.
- Campaign ID: `4b30019e-140e-f6e9-0a95-4b5e0a73c301`.
- TCR Campaign ID: `C7BAANX`.
- Campaign status: `Active`.
- Assigned numbers: `0`.
- Messaging profile `Sparkle Suite SMS`: `Enabled`.
- Messaging profile sender: `+1-904-438-3050`.
- Campaign assignment screen shows `+1-904-438-3050` as the only assignable local active messaging-enabled number.

External Telnyx docs checked on 2026-05-25:

- Telnyx says an approved campaign still needs phone numbers assigned before 10DLC A2P sending works: `https://developers.telnyx.com/docs/messaging/10dlc/phone-number-assignment/index`.
- Telnyx says the number must be on a messaging profile first, the campaign must be active, and each number can be assigned to only one campaign.
- Telnyx says assignment can take minutes to days, commonly around two hours, and status should be checked until the number is `ASSIGNED`: `https://support.telnyx.com/en/articles/11072276-10dlc-number-assignment-status`.
- Telnyx compliance requirements still require separate SMS opt-in language, optional phone fields, STOP/HELP, privacy and terms links, sample messages matching use case, and consistent campaign/legal copy: `https://support.telnyx.com/en/articles/9940291-10dlc-campaign-compliance-requirements`.

## File Structure

### Provider Evidence And Runbook

- Create `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
  - Human-readable execution record and checklist.
  - Stores Telnyx portal facts, assignment proof, smoke-test evidence, and final closeout criteria.

- Modify `docs/sparkle-suite/sms/a2p-campaign-denial-remediation-2026-05-14.md`
  - Append a 2026-05-25 approval/update section.
  - Do not erase the denial history; preserve it as prior state.

### SMS Gate And Prompt Truth

- Modify `lib/prelaunch/gate-readiness.ts`
  - Replace hard-coded `Pending Telnyx review` with env-driven statuses.
  - New env flags should represent the real operational gates:
    - `SPARKLE_SMS_CAMPAIGN_APPROVED`
    - `SPARKLE_SMS_NUMBER_ASSIGNED`
    - `SPARKLE_SMS_HANDSET_SMOKE_PASSED`

- Modify `lib/nic-nac/prompt-builder.ts`
  - Stop saying campaign approval is pending after the campaign is approved.
  - Preserve warning that live SMS cannot be claimed until number assignment and handset smoke pass.

- Modify `lib/nic-nac/system-prompt.ts`
  - Same truth update as `prompt-builder.ts`.
  - Keep “bulk campaigns and show reminders are not live” until Task 5.7 is implemented and verified.

- Update tests:
  - `tests/prelaunch/prelaunch-gate-readiness.test.ts`
  - `tests/prelaunch/prelaunch-health-route.test.ts`
  - `tests/prelaunch/prelaunch-operator-handoff.test.ts`
  - `tests/nic-nac/prompt-routing.test.ts`
  - `tests/nic-nac/send-sms-notification.test.ts`
  - `tests/nic-nac/send-email-notification.test.ts`

### Telnyx Assignment And One-Off SMS Proof

- No code file should attach the number automatically.
- Use Telnyx portal or API only after Louis approval.
- Optional if using API after approval: create a temporary local script or one-off command only if needed; do not commit secrets or provider output with tokens.
- Verify `lib/telnyx/config.ts`, `lib/telnyx/client.ts`, and `lib/services/sms-notifications.ts` behavior with existing tests before and after live proof.

### Resend One-Off Email Proof

- Likely no code changes unless live proof reveals a failure.
- Existing files:
  - `lib/resend/config.ts`
  - `lib/services/email-notifications.ts`
  - `app/api/nic-nac/send-email/route.ts`
  - `lib/nic-nac/tools/send-email-notification.ts`
- Add evidence to the runbook after Louis approves a controlled test email.

### Pre-Show Reminder Enablement

- Modify `app/api/internal/show-reminders/pre-show/route.ts`
  - Keep dry-run default.
  - Add explicit `mode=live` or `dryRun=false` handling.
  - Require a second env gate such as `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
  - Pass `liveSendsEnabled` to `processDuePreShowReminders`.

- Modify `lib/services/pre-show-reminders.ts`
  - Improve message text so customer-facing reminders are short, compliant, and useful.
  - Include STOP/HELP language if the final product decision is to include it on every automated reminder.
  - Consider customer timezone or rep/site timezone only if existing calendar data supports it. Do not invent unsupported timezone behavior.

- Modify `lib/nic-nac/system-prompt.ts` and `lib/nic-nac/prompt-builder.ts`
  - After 5.7 is live, change “show reminders are not live” to “automated pre-show reminders are handled by the scheduled reminder job, not by manual chat sends.”

- Update tests:
  - `tests/services/pre-show-reminders.test.ts`
  - `tests/pre-show-reminders-route.test.ts`
  - `tests/services/message-send-limits.test.ts`
  - `tests/nic-nac/calendar-tools.test.ts`

### HQ/Open Brain Updates

- Update HQ tasks only after evidence exists:
  - `task_5_1`: complete only after campaign active, number assigned, and handset smoke passes.
  - `task_5_2`: complete only after one controlled Resend provider proof passes or Louis decides code-complete is sufficient.
  - `task_5_7`: complete only after pre-show reminder live/dry-run/live-send guard behavior is implemented and verified.
- Capture Open Brain closeout after Phase 5 is actually complete.

---

## Task 1: Create Phase 5 Closeout Runbook

**Files:**
- Create: `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
- Modify: `docs/sparkle-suite/sms/a2p-campaign-denial-remediation-2026-05-14.md`

- [ ] **Step 1: Create the runbook**

Add:

```markdown
# Sparkle Suite Phase 5 Closeout Runbook - 2026-05-25

## Purpose

This runbook closes Phase 5 SMS/Email Automation without skipping live-provider proof. It separates code-complete status from provider-live status.

## Provider State

### Telnyx

- Brand: Sparkle Suite
- Brand TCR ID: B6LGQP3
- Brand status: Verified
- Campaign ID: 4b30019e-140e-f6e9-0a95-4b5e0a73c301
- TCR Campaign ID: C7BAANX
- Campaign status: Active
- Assigned numbers before closeout: 0
- Candidate number: +1-904-438-3050
- Messaging profile: Sparkle Suite SMS
- Messaging profile status: Enabled

### Resend

- Provider proof status: pending Louis-approved live test
- Existing code path: one-off email via `sendEmailNotification`

## Approval Gates

- [ ] Louis explicitly approved assigning +1-904-438-3050 to C7BAANX.
- [ ] Telnyx assignment shows the number assigned to C7BAANX.
- [ ] Louis explicitly approved one live SMS smoke test.
- [ ] Live SMS provider response recorded.
- [ ] Handset receipt confirmed.
- [ ] Message log row checked.
- [ ] SMS wallet debit/refund behavior checked.
- [ ] Louis explicitly approved one live Resend email smoke test, or decided code-complete is sufficient.
- [ ] Pre-show reminder live mode implemented behind `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
- [ ] HQ/Open Brain updated after proof, not before.

## Evidence Log

### Telnyx Number Assignment

- Timestamp:
- Actor:
- Method: portal/API
- Result:
- Assignment status:

### SMS Smoke

- Timestamp:
- Sender:
- Recipient:
- Message body:
- Provider message ID:
- Provider status:
- Handset received:
- `message_log` row:
- Wallet transaction:

### Email Smoke

- Timestamp:
- Sender:
- Recipient:
- Subject:
- Provider email ID:
- Provider status:
- `message_log` row:

### Pre-Show Reminder Verification

- Dry-run command/result:
- Guarded live-mode disabled result:
- Live-mode approved result:
- Duplicate-send prevention result:

## Closeout Criteria

Phase 5 can be marked complete only when:

1. Telnyx campaign `C7BAANX` is active and has an assigned number.
2. A controlled SMS smoke test reaches a real handset.
3. SMS wallet and `message_log` evidence match the send result.
4. Resend one-off email has either live provider proof or Louis explicitly accepts code-complete status.
5. Pre-show SMS reminders are wired to the calendar route, default to dry-run, and require an explicit live-send env gate.
6. Nic-Nac prompt/gate copy no longer says the old Telnyx campaign is pending review after it has been approved.
7. HQ/Open Brain/docs are updated with the final status and evidence.
```

- [ ] **Step 2: Append approval update to the denial remediation doc**

Append:

```markdown
## Live Telnyx portal update - 2026-05-25

Observed in Telnyx portal after Louis reported approval:

- Brand `Sparkle Suite` is verified.
- Brand TCR ID is `B6LGQP3`.
- Campaign `4b30019e-140e-f6e9-0a95-4b5e0a73c301` / `C7BAANX` is active.
- The previous rejection reason still appears in the detail screen as history, but current campaign status is active.
- Assigned numbers remain `0`.
- Messaging profile `Sparkle Suite SMS` is enabled.
- The profile contains `+1-904-438-3050`.
- The assignment screen shows `+1-904-438-3050` as the only assignable local active messaging-enabled number.

Updated diagnosis:

- The KYC/brand remediation appears to have succeeded.
- Live SMS is still not complete because Telnyx requires an active 10DLC campaign to have an assigned phone number before sending.
- Do not call SMS live until the number assignment is complete and a controlled handset smoke test succeeds.
```

- [ ] **Step 3: Review doc diff**

Run:

```powershell
git diff -- docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md docs/sparkle-suite/sms/a2p-campaign-denial-remediation-2026-05-14.md
```

Expected: only documentation changes.

- [ ] **Step 4: Commit docs only if Louis asks**

Do not commit automatically. If approved:

```powershell
git add docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md docs/sparkle-suite/sms/a2p-campaign-denial-remediation-2026-05-14.md
git commit -m "docs: add Sparkle Suite Phase 5 closeout runbook"
```

---

## Task 2: Update SMS Gate Truth After Approval, Before Live Claim

**Files:**
- Modify: `lib/prelaunch/gate-readiness.ts`
- Modify: `tests/prelaunch/prelaunch-gate-readiness.test.ts`
- Modify: `tests/prelaunch/prelaunch-health-route.test.ts`
- Modify: `tests/prelaunch/prelaunch-operator-handoff.test.ts`

- [ ] **Step 1: Write failing gate-readiness tests**

Add tests for three states:

```ts
it('shows Telnyx review pending before campaign approval', () => {
  const items = getPrelaunchGateReadiness({})
  expect(items[0]).toMatchObject({
    key: 'sms_campaign',
    status: 'blocked',
    displayStatus: 'Pending Telnyx review',
    detail:
      'Live SMS is blocked until campaign approval, number attachment, and real handset smoke succeed.',
  })
})

it('shows number assignment pending after campaign approval', () => {
  const items = getPrelaunchGateReadiness({
    SPARKLE_SMS_CAMPAIGN_APPROVED: 'true',
  })
  expect(items[0]).toMatchObject({
    key: 'sms_campaign',
    status: 'blocked',
    displayStatus: 'Number assignment pending',
    detail:
      'Telnyx campaign C7BAANX is active, but no sending number has been assigned and verified yet.',
  })
})

it('shows handset smoke pending after number assignment', () => {
  const items = getPrelaunchGateReadiness({
    SPARKLE_SMS_CAMPAIGN_APPROVED: 'true',
    SPARKLE_SMS_NUMBER_ASSIGNED: 'true',
  })
  expect(items[0]).toMatchObject({
    key: 'sms_campaign',
    status: 'blocked',
    displayStatus: 'Handset smoke pending',
    detail:
      'Telnyx number assignment is complete; live SMS still waits for a controlled handset smoke test.',
  })
})

it('shows SMS ready after approval, assignment, and handset smoke', () => {
  const items = getPrelaunchGateReadiness({
    SPARKLE_SMS_CAMPAIGN_APPROVED: 'true',
    SPARKLE_SMS_NUMBER_ASSIGNED: 'true',
    SPARKLE_SMS_HANDSET_SMOKE_PASSED: 'true',
  })
  expect(items[0]).toMatchObject({
    key: 'sms_campaign',
    status: 'disabled',
    displayStatus: 'Provider verified',
    detail:
      'Telnyx campaign, number assignment, and handset smoke are verified; automated sends still require per-feature enablement.',
  })
})
```

- [ ] **Step 2: Run the failing tests**

Run:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-gate-readiness.test.ts tests/prelaunch/prelaunch-health-route.test.ts tests/prelaunch/prelaunch-operator-handoff.test.ts
```

Expected: gate-readiness tests fail because `getPrelaunchGateReadiness` is still hard-coded.

- [ ] **Step 3: Implement env-driven SMS gate**

Replace the hard-coded SMS gate in `lib/prelaunch/gate-readiness.ts` with:

```ts
function buildSmsCampaignGate(env: EnvLike): PrelaunchGateReadinessItem {
  const campaignApproved = env.SPARKLE_SMS_CAMPAIGN_APPROVED === 'true'
  const numberAssigned = env.SPARKLE_SMS_NUMBER_ASSIGNED === 'true'
  const handsetSmokePassed = env.SPARKLE_SMS_HANDSET_SMOKE_PASSED === 'true'

  if (!campaignApproved) {
    return {
      key: 'sms_campaign',
      label: 'SMS campaign',
      status: 'blocked',
      displayStatus: 'Pending Telnyx review',
      detail:
        'Live SMS is blocked until campaign approval, number attachment, and real handset smoke succeed.',
    }
  }

  if (!numberAssigned) {
    return {
      key: 'sms_campaign',
      label: 'SMS campaign',
      status: 'blocked',
      displayStatus: 'Number assignment pending',
      detail:
        'Telnyx campaign C7BAANX is active, but no sending number has been assigned and verified yet.',
    }
  }

  if (!handsetSmokePassed) {
    return {
      key: 'sms_campaign',
      label: 'SMS campaign',
      status: 'blocked',
      displayStatus: 'Handset smoke pending',
      detail:
        'Telnyx number assignment is complete; live SMS still waits for a controlled handset smoke test.',
    }
  }

  return {
    key: 'sms_campaign',
    label: 'SMS campaign',
    status: 'disabled',
    displayStatus: 'Provider verified',
    detail:
      'Telnyx campaign, number assignment, and handset smoke are verified; automated sends still require per-feature enablement.',
  }
}
```

Then replace the first item in the return array:

```ts
return [
  buildSmsCampaignGate(env),
  ...
]
```

- [ ] **Step 4: Update dependent snapshots/expectations**

Update health and operator-handoff tests so default env still expects `Pending Telnyx review`, and add at least one test proving approved env changes the operator handoff gate text to `Number assignment pending`.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-gate-readiness.test.ts tests/prelaunch/prelaunch-health-route.test.ts tests/prelaunch/prelaunch-operator-handoff.test.ts
```

Expected: PASS.

---

## Task 3: Update Nic-Nac SMS Truth Copy

**Files:**
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: `tests/nic-nac/prompt-routing.test.ts`
- Modify: `tests/nic-nac/send-sms-notification.test.ts`
- Modify: `tests/nic-nac/send-email-notification.test.ts`
- Modify: `tests/nic-nac/calendar-tools.test.ts`

- [ ] **Step 1: Write expectations for post-approval but pre-smoke state**

Update prompt tests to expect:

```ts
expect(prompt).toContain(
  'Telnyx campaign C7BAANX is active, but live SMS still requires number assignment and handset smoke proof.',
)
expect(prompt).toContain('Do not claim live SMS delivery unless the actual send tool returns success.')
expect(prompt).toContain('bulk SMS/email campaigns are not live')
```

- [ ] **Step 2: Run the failing prompt tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/calendar-tools.test.ts
```

Expected: FAIL while old prompt copy still says campaign approval is pending.

- [ ] **Step 3: Update prompt text**

In `lib/nic-nac/prompt-builder.ts`, replace:

```ts
- SMS sending is blocked until Telnyx 10DLC campaign approval. If a rep asks to text someone, explain that you can draft the text but cannot send it yet.
- bulk SMS/email campaigns are not live. SMS sends, show reminders, and subscriber blasts are not live.
```

with:

```ts
- Telnyx campaign C7BAANX is active, but live SMS still requires number assignment and handset smoke proof. If a rep asks to text someone before those proof gates pass, explain that you can draft the text but cannot send it yet.
- Do not claim live SMS delivery unless the actual send tool returns success.
- bulk SMS/email campaigns are not live. Show reminders and subscriber blasts are not live until the scheduled reminder job is separately enabled.
```

In `lib/nic-nac/system-prompt.ts`, replace the equivalent campaign-pending lines with matching truth:

```ts
Manual email sends are screened for prohibited recruiting language before they go out. Telnyx campaign C7BAANX is active, but live SMS still requires number assignment and handset smoke proof.

- send_sms_notification — write, no approval dialog. Do not call this before number assignment and handset smoke proof are complete. If the rep asks to text one customer directly before those gates pass, explain that you can draft the message but cannot send it yet.
```

Keep this line until Task 6 is done:

```ts
- Sending show reminders or notifications to subscribers — Not yet.
```

- [ ] **Step 4: Run prompt/tool tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/calendar-tools.test.ts
```

Expected: PASS.

---

## Task 4: Telnyx Number Assignment Proof

**Files:**
- Modify: `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
- No code changes unless assignment exposes a real code/config issue.

- [ ] **Step 1: Ask Louis for exact approval**

Ask:

```text
Do you approve assigning +1-904-438-3050 to Telnyx campaign C7BAANX / 4b30019e-140e-f6e9-0a95-4b5e0a73c301?
```

Expected: wait. Do not proceed without a direct yes.

- [ ] **Step 2: Assign the number in Telnyx**

If approved, use Chrome/Telnyx portal:

1. Open campaign `C7BAANX`.
2. Click `Assign numbers`.
3. Choose `Messaging Profile` or `Numbers`.
4. Select `Sparkle Suite SMS` or `+1-904-438-3050`.
5. Click the Telnyx `Assign` control.
6. Stop if Telnyx shows any confirmation, fee, compliance warning, or irreversible action prompt not already approved by Louis.

- [ ] **Step 3: Verify assignment status**

Use portal first. If portal is unclear, use Telnyx’s assignment-status guidance with the Telnyx API only if Louis approves API use in the current shell/session.

Expected final evidence:

```text
Campaign C7BAANX assigned numbers: 1
Number: +1-904-438-3050
Assignment status: ASSIGNED or equivalent portal success state
```

- [ ] **Step 4: Update runbook evidence**

Fill in:

```markdown
### Telnyx Number Assignment

- Timestamp: 2026-05-25 ...
- Actor: Louis/Codex under Louis approval
- Method: Telnyx portal
- Result: +1-904-438-3050 assigned to C7BAANX
- Assignment status: ...
```

- [ ] **Step 5: Do not mark 5.1 complete yet**

Number assignment alone is not enough. Continue to Task 5 for handset smoke.

---

## Task 5: Controlled One-Off SMS Smoke

**Files:**
- Modify: `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
- Modify code only if smoke reveals a bug.

- [ ] **Step 1: Confirm environment readiness without sending**

Check the environment locally or in the chosen target without printing secrets:

```powershell
node -e "const keys=['TELNYX_API_KEY','TELNYX_SMS_FROM','TELNYX_PUBLIC_KEY','SPARKLE_SMS_CAMPAIGN_APPROVED']; for (const k of keys) console.log(k + '=' + (process.env[k] ? 'set' : 'missing'))"
```

Expected:

```text
TELNYX_API_KEY=set
TELNYX_SMS_FROM=set
TELNYX_PUBLIC_KEY=set
SPARKLE_SMS_CAMPAIGN_APPROVED=set
```

If `SPARKLE_SMS_CAMPAIGN_APPROVED` is missing, set it only in the local/test environment used for smoke, not by committing secrets:

```powershell
$env:SPARKLE_SMS_CAMPAIGN_APPROVED='true'
```

- [ ] **Step 2: Identify an approved smoke recipient**

Ask Louis:

```text
Which handset number should receive the controlled Sparkle Suite SMS smoke test?
```

Expected: wait for explicit number. Do not infer from prior context.

- [ ] **Step 3: Ask Louis for send approval**

Ask:

```text
Do you approve sending one live Sparkle Suite SMS smoke test from +1-904-438-3050 to [recipient] with this body?

Sparkle Suite: SMS smoke test after 10DLC approval. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

Expected: wait for direct yes.

- [ ] **Step 4: Send through the existing application path**

Prefer the existing `sendSmsNotification` service or authenticated Nic-Nac/dashboard route so wallet debit, send caps, content screening, and `message_log` are exercised.

If a tiny local smoke runner is needed, create it only temporarily or under `scripts/` if Louis wants it kept. It must call:

```ts
await sendSmsNotification(repId, {
  recipientPhone: recipient,
  message:
    'Sparkle Suite: SMS smoke test after 10DLC approval. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.',
})
```

Do not bypass wallet/logging unless diagnosing a provider-only issue after the app-path smoke fails.

- [ ] **Step 5: Verify evidence**

Check:

```text
Provider response has message ID.
`message_log` has channel='sms', recipient, content preview, delivery_status, sent_at.
SMS wallet deducted 9 mils.
Handset received the message.
STOP reply, if tested, marks opt-out via webhook.
```

- [ ] **Step 6: Update runbook**

Fill in:

```markdown
### SMS Smoke

- Timestamp:
- Sender: +1-904-438-3050
- Recipient:
- Message body:
- Provider message ID:
- Provider status:
- Handset received:
- `message_log` row:
- Wallet transaction:
```

- [ ] **Step 7: Mark Task 5.1 complete only after proof**

After proof, update HQ:

```text
task_5_1 complete: Telnyx campaign C7BAANX is active, +1-904-438-3050 is assigned, and controlled handset smoke succeeded. Evidence recorded in docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md.
```

---

## Task 6: Resend One-Off Email Provider Proof

**Files:**
- Modify: `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
- Modify code only if smoke reveals a bug.

- [ ] **Step 1: Confirm environment readiness without printing secrets**

Run:

```powershell
node -e "const keys=['RESEND_API_KEY','RESEND_FROM_EMAIL']; for (const k of keys) console.log(k + '=' + (process.env[k] ? 'set' : 'missing'))"
```

Expected:

```text
RESEND_API_KEY=set
RESEND_FROM_EMAIL=set
```

- [ ] **Step 2: Ask Louis whether live provider proof is required**

Ask:

```text
Do you want Phase 5.2 closed with a live Resend email smoke test, or should we mark it code-complete based on existing tests and defer live email proof?
```

Expected: wait.

- [ ] **Step 3: If live proof is approved, ask for recipient and body**

Ask:

```text
Which email address should receive the controlled Sparkle Suite email smoke test?
```

Then ask:

```text
Do you approve sending one live Sparkle Suite email smoke test to [recipient] with subject "Sparkle Suite email smoke test"?
```

- [ ] **Step 4: Send through existing application path**

Use `sendEmailNotification` or the authenticated dashboard/Nic-Nac route so `message_log`, send caps, and content screening are exercised.

Smoke content:

```text
Subject: Sparkle Suite email smoke test

This is a controlled Sparkle Suite email smoke test after Phase 5 provider review.
```

- [ ] **Step 5: Verify evidence**

Check:

```text
Provider response has email ID.
`message_log` has channel='email', recipient, content preview, delivery_status='sent', sent_at.
No SMS wallet deduction happened.
```

- [ ] **Step 6: Update runbook and HQ**

If live proof passes, mark `task_5_2` complete with evidence. If Louis accepts code-complete status, mark `task_5_2` complete with that explicit decision and existing focused test coverage.

---

## Task 7: Enable Pre-Show Reminders Behind a Live Gate

**Files:**
- Modify: `app/api/internal/show-reminders/pre-show/route.ts`
- Modify: `lib/services/pre-show-reminders.ts`
- Modify: `tests/pre-show-reminders-route.test.ts`
- Modify: `tests/services/pre-show-reminders.test.ts`
- Modify: `tests/services/message-send-limits.test.ts`

- [ ] **Step 1: Write route tests for dry-run default and live gate**

Add tests:

```ts
it('keeps dry-run mode as the default even when live env is enabled', async () => {
  process.env.CRON_SECRET = 'secret-123'
  process.env.SPARKLE_PRE_SHOW_SMS_ENABLED = 'true'
  createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
  processDuePreShowRemindersMock.mockResolvedValueOnce({
    dryRun: true,
    plannedCount: 1,
    sentCount: 0,
    skippedCount: 0,
    plans: [],
    sends: [],
    skipped: [],
  })

  const response = await GET(
    new Request('http://localhost/api/internal/show-reminders/pre-show', {
      headers: { authorization: 'Bearer secret-123' },
    }),
  )

  expect(processDuePreShowRemindersMock).toHaveBeenCalledWith(
    { marker: 'admin' },
    { limit: 25, dryRun: true, liveSendsEnabled: true },
  )
  expect(response.status).toBe(200)
})

it('runs live mode only when explicitly requested and enabled', async () => {
  process.env.CRON_SECRET = 'secret-123'
  process.env.SPARKLE_PRE_SHOW_SMS_ENABLED = 'true'
  createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
  processDuePreShowRemindersMock.mockResolvedValueOnce({
    dryRun: false,
    plannedCount: 1,
    sentCount: 1,
    skippedCount: 0,
    plans: [],
    sends: [],
    skipped: [],
  })

  const response = await GET(
    new Request('http://localhost/api/internal/show-reminders/pre-show?mode=live', {
      headers: { authorization: 'Bearer secret-123' },
    }),
  )

  expect(processDuePreShowRemindersMock).toHaveBeenCalledWith(
    { marker: 'admin' },
    { limit: 25, dryRun: false, liveSendsEnabled: true },
  )
  expect(response.status).toBe(200)
})
```

- [ ] **Step 2: Run failing route tests**

Run:

```powershell
npm exec vitest run tests/pre-show-reminders-route.test.ts
```

Expected: FAIL because route always passes `dryRun: true` and no live gate.

- [ ] **Step 3: Implement route mode parsing**

Add:

```ts
function readMode(url: URL) {
  const mode = url.searchParams.get('mode')?.trim().toLowerCase()
  if (!mode || mode === 'dry-run') return { dryRun: true, error: null }
  if (mode === 'live') return { dryRun: false, error: null }
  return { dryRun: true, error: 'mode must be dry-run or live.' }
}

function arePreShowSmsSendsEnabled() {
  return process.env.SPARKLE_PRE_SHOW_SMS_ENABLED === 'true'
}
```

Then in `GET`:

```ts
const url = new URL(request.url)
const limit = readLimit(url)
const mode = readMode(url)

if (mode.error) {
  return NextResponse.json({ error: mode.error }, { status: 400 })
}

const result = await processDuePreShowReminders(createAdminClient(), {
  limit: limit ?? 25,
  dryRun: mode.dryRun,
  liveSendsEnabled: arePreShowSmsSendsEnabled(),
})
```

- [ ] **Step 4: Improve pre-show reminder body**

Replace `buildMessage` in `lib/services/pre-show-reminders.ts`:

```ts
function buildMessage(event: CalendarEvent): string {
  const title = event.title?.trim() || 'Your live show'
  const platform = event.platform.trim() || 'the live show'
  return `Sparkle Suite: Reminder - ${title} starts soon on ${platform}. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
}
```

Update expected message in `tests/services/pre-show-reminders.test.ts`.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm exec vitest run tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/services/message-send-limits.test.ts
```

Expected: PASS.

- [ ] **Step 6: Dry-run verify with local data**

With dev server/env ready:

```powershell
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" "http://localhost:3000/api/internal/show-reminders/pre-show?limit=25"
```

Expected: JSON response with `dryRun: true`, planned sends, and zero sent sends.

- [ ] **Step 7: Ask before any live reminder send**

Ask:

```text
Do you approve running the pre-show reminder route in live mode once against the current due local/test data?
```

Do not run `mode=live` without approval.

---

## Task 8: Update Nic-Nac Prompt After Pre-Show Reminder Enablement

**Files:**
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `tests/nic-nac/calendar-tools.test.ts`
- Modify: `tests/nic-nac/prompt-routing.test.ts`

- [ ] **Step 1: Write prompt expectations**

After Task 7 passes, update expectations:

```ts
expect(NIC_NAC_SYSTEM_PROMPT).toContain(
  'Automated pre-show reminders are handled by the scheduled reminder job, not by manual chat sends.',
)
expect(NIC_NAC_SYSTEM_PROMPT).toContain(
  'Do not promise a reminder was sent unless the reminder job result or message_log confirms it.',
)
```

- [ ] **Step 2: Update prompt copy**

Replace:

```ts
- Sending show reminders or notifications to subscribers — Not yet.
```

with:

```ts
- Automated pre-show reminders are handled by the scheduled reminder job, not by manual chat sends. Do not promise a reminder was sent unless the reminder job result or message_log confirms it.
```

Keep:

```ts
bulk SMS/email campaigns are not live
```

because subscriber blasts are outside Phase 5 closeout unless Louis separately activates bulk tooling.

- [ ] **Step 3: Run prompt tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/calendar-tools.test.ts tests/nic-nac/prompt-routing.test.ts
```

Expected: PASS.

---

## Task 9: Phase 5 Verification Sweep

**Files:**
- No planned file edits.

- [ ] **Step 1: Run focused Phase 5 tests**

Run:

```powershell
npm exec vitest run tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/get-notification-preferences.test.ts tests/services/message-send-limits.test.ts tests/services/message-content-screening.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/telnyx-webhook-route.test.ts tests/nic-nac-send-email-route.test.ts tests/nic-nac-messages-route.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: PASS.

- [ ] **Step 3: Run build only after focused tests pass**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Optional launch smoke**

Only if relevant env is safe and Louis approves any provider categories:

```powershell
npm run smoke:demo -- --category local_static --json
```

Expected: PASS without live provider sends.

---

## Task 10: Final Tracker And Memory Closeout

**Files:**
- Modify: `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md`
- External: HQ task tracker, Open Brain.

- [ ] **Step 1: Update final runbook status**

Add final section:

```markdown
## Final Phase 5 Status

- Task 5.1 Telnyx SMS integration:
- Task 5.2 Resend email integration:
- Task 5.3 Wallet deduction + balance enforcement: complete before this runbook
- Task 5.4 AI content screening: complete before this runbook
- Task 5.5 Send cap enforcement: complete before this runbook
- Task 5.6 Customer opt-in forms: complete before this runbook
- Task 5.7 Pre-show SMS reminder:

## Verification

- Focused Phase 5 tests:
- TypeScript:
- Build:
- Provider evidence:
```

- [ ] **Step 2: Update HQ**

Update only tasks with proof:

```text
5.1 complete if number assignment + handset smoke passed.
5.2 complete if live email smoke passed or Louis explicitly accepted code-complete status.
5.7 complete if guarded pre-show reminder live mode is implemented and verified.
```

- [ ] **Step 3: Capture Open Brain closeout**

Capture a standalone thought:

```text
SESSION CLOSE - Sparkle Suite Phase 5 SMS/Email closeout - 2026-05-25. [Summarize final truth, provider evidence, tests, remaining guardrails.]
```

- [ ] **Step 4: Commit only after Louis asks**

If approved:

```powershell
git add docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md docs/sparkle-suite/sms/a2p-campaign-denial-remediation-2026-05-14.md lib/prelaunch/gate-readiness.ts lib/nic-nac/prompt-builder.ts lib/nic-nac/system-prompt.ts app/api/internal/show-reminders/pre-show/route.ts lib/services/pre-show-reminders.ts tests/prelaunch/prelaunch-gate-readiness.test.ts tests/prelaunch/prelaunch-health-route.test.ts tests/prelaunch/prelaunch-operator-handoff.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/calendar-tools.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/services/message-send-limits.test.ts
git commit -m "feat: close Sparkle Suite Phase 5 messaging gates"
```

---

## Execution Recommendation

Use subagent-driven execution after Louis approves the plan:

1. Documentation subagent: Task 1.
2. Gate/prompt truth subagent: Tasks 2 and 3.
3. Provider smoke coordinator: Tasks 4, 5, and 6, with Louis approval gates.
4. Pre-show reminder subagent: Tasks 7 and 8.
5. Verification/closeout subagent: Tasks 9 and 10.

Do not dispatch any subagent until Louis approves implementation.

## Self-Review

- No live provider action is automatic.
- The number assignment step requires explicit Louis approval.
- The SMS smoke step requires explicit recipient and send approval.
- The email smoke step requires explicit recipient and send approval.
- Pre-show reminders default to dry-run and require `SPARKLE_PRE_SHOW_SMS_ENABLED=true` plus explicit live mode.
- Bulk SMS/email campaigns remain out of scope.
- Existing guarded files remain untouched.
- The plan separates code-complete, provider-assigned, and handset-proven states.
