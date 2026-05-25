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

- [x] Louis explicitly approved assigning +1-904-438-3050 to C7BAANX.
- [x] Telnyx assignment shows the number assigned to C7BAANX.
- [ ] Louis explicitly approved one live SMS smoke test.
- [ ] Live SMS provider response recorded.
- [ ] Handset receipt confirmed.
- [ ] Message log row checked.
- [ ] SMS wallet debit/refund behavior checked.
- [ ] Louis explicitly approved one live Resend email smoke test, or decided code-complete is sufficient.
- [x] Pre-show reminder live mode implemented behind `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
- [ ] HQ/Open Brain updated after proof, not before.

## Evidence Log

### Telnyx Number Assignment

- Timestamp: 2026-05-25T19:54:03Z
- Actor: Codex, after Louis approval in chat
- Method: Telnyx 10DLC phone-number assignment API
- Result: `+19044383050` assigned to campaign `4b30019e-140e-f6e9-0a95-4b5e0a73c301` / `C7BAANX`
- Assignment status: `ASSIGNED`
- T-Mobile mapping status: `ADDED`
- Non-T-Mobile mapping status: `ADDED`
- AT&T mapping status: `null` in Telnyx API response
- Errors/failure reasons: `null`

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

- Dry-run command/result: covered by `tests/pre-show-reminders-route.test.ts` and `tests/services/pre-show-reminders.test.ts`; route defaults to dry-run even when `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
- Guarded live-mode disabled result: covered by `tests/services/pre-show-reminders.test.ts`; service rejects live sends without `liveSendsEnabled`.
- Live-mode approved result:
- Duplicate-send prevention result: covered by existing `sendSmsNotification` automation-key/send-limit behavior in `tests/services/message-send-limits.test.ts`.

### Local Verification

- 2026-05-25: `npm exec vitest run tests/prelaunch/prelaunch-gate-readiness.test.ts tests/prelaunch/prelaunch-health-route.test.ts tests/prelaunch/prelaunch-operator-handoff.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/calendar-tools.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/services/message-send-limits.test.ts` -> 10 files / 54 tests passed.
- 2026-05-25: `npx tsc --noEmit --pretty false` -> passed.
- 2026-05-25: `npm run build` -> passed after running outside the sandbox so Next could fetch Google Fonts.
- No Telnyx number assignment, live SMS, or live email action was performed during this implementation pass.

### Vercel Environment Readiness

- 2026-05-25: Production and branch preview `codex/sparkle-cross-phase-hardening` were updated for SMS smoke readiness.
- `TELNYX_API_KEY` exists as a sensitive Vercel env var in production and branch preview.
- `TELNYX_SMS_FROM` is set to `+19044383050` in production and branch preview.
- `TELNYX_PUBLIC_KEY` exists in production and branch preview for webhook verification.
- `SPARKLE_SMS_CAMPAIGN_APPROVED=true` in production and branch preview.
- `SPARKLE_SMS_NUMBER_ASSIGNED=true` in production and branch preview.
- `SPARKLE_SMS_HANDSET_SMOKE_PASSED=false` in production and branch preview until handset proof succeeds.
- `SPARKLE_PRE_SHOW_SMS_ENABLED=false` in production and branch preview so automated pre-show reminders remain dry-run/disabled for live sends.
- `RESEND_API_KEY` exists as a sensitive Vercel env var in production and preview, and `RESEND_FROM_EMAIL` is set in production and branch preview.

## Closeout Criteria

Phase 5 can be marked complete only when:

1. Telnyx campaign `C7BAANX` is active and has an assigned number.
2. A controlled SMS smoke test reaches a real handset.
3. SMS wallet and `message_log` evidence match the send result.
4. Resend one-off email has either live provider proof or Louis explicitly accepts code-complete status.
5. Pre-show SMS reminders are wired to the calendar route, default to dry-run, and require an explicit live-send env gate.
6. Nic-Nac prompt/gate copy no longer says the old Telnyx campaign is pending review after it has been approved.
7. HQ/Open Brain/docs are updated with the final status and evidence.
