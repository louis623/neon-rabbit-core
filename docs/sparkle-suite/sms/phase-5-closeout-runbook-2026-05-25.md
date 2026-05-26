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

- Provider proof status: live smoke passed through workspace and Nic-Nac paths
- Existing code path: one-off email via `sendEmailNotification`

## Approval Gates

- [x] Louis explicitly approved assigning +1-904-438-3050 to C7BAANX.
- [x] Telnyx assignment shows the number assigned to C7BAANX.
- [x] Louis explicitly approved live SMS smoke testing.
- [x] Live SMS provider response recorded.
- [x] Handset receipt confirmed for manual SMS smoke.
- [x] Message log row checked.
- [x] SMS wallet debit/refund behavior checked.
- [x] Louis explicitly approved and confirmed live Resend email smoke testing.
- [x] Pre-show reminder live mode implemented behind `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
- [x] HQ/Open Brain updated after proof, not before.

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

- Timestamp: 2026-05-25T22:19:18Z, 2026-05-25T22:23:15Z, 2026-05-25T22:36:25Z
- Sender: `+19044383050`
- Recipient: `+17206296507`
- Message bodies:
  - `Sparkle Suite SMS smoke 1: Your Sparkle Suite test notification is ready. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
  - `Sparkle Suite SMS smoke 2: This is a customer-care follow-up from the workspace test. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
  - `Hi Louis, quick update from Jane's Sparkle Party: your customer-care follow-up is ready. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
- Provider status: queued by Telnyx.
- Handset received: confirmed by Louis screenshots on 2026-05-25.
- `message_log` rows: `a42de4d3-bf88-4047-b627-8f4586c054ea`, `997dcd60-456b-419a-9494-5acccbb94e34`, `e374e666-caff-4868-a633-72681ee91f01`.
- Wallet transactions: three `sms_charge` rows at 9 mils each, including `ff28739b-1a4a-4fac-8a95-015ad6d6f726`, `4eed8b5d-ab89-4db1-9d7b-ab7bce0ac838`, and `7ce28292-901e-4109-9ea8-5ad3b6dc5282`.
- Weekly cap proof: fourth manual SMS request was blocked with no extra `message_log` row and no extra wallet debit.

### Email Smoke

- Timestamp: 2026-05-25T22:13:16Z, 2026-05-25T22:16:48Z, 2026-05-25T22:18:01Z
- Sender: Sparkle Suite Resend sender.
- Recipient: `louischapman1@gmail.com`
- Subjects:
  - `Sparkle Suite smoke 1 - workspace email`
  - `Sparkle Suite smoke 2 - Nic-Nac email`
  - `Sparkle Suite smoke 3 - Nic-Nac follow-up`
- Provider status: sent by Resend-backed email service.
- Handset/inbox received: confirmed by Louis Gmail screenshot on 2026-05-25.
- `message_log` rows: `01786c9c-5508-4f91-8e20-85577b6cb72b`, `28033af5-abfc-4978-9106-7436c89e051f`, `d7445e5b-d3a7-4c25-af37-72d210ba117b`.
- Weekly cap proof: fourth manual email request was blocked with no extra accepted `message_log` row.

### Pre-Show Reminder Verification

- Dry-run command/result: covered by `tests/pre-show-reminders-route.test.ts` and `tests/services/pre-show-reminders.test.ts`; route defaults to dry-run even when `SPARKLE_PRE_SHOW_SMS_ENABLED=true`.
- Guarded live-mode disabled result: covered by `tests/services/pre-show-reminders.test.ts`; service rejects live sends without `liveSendsEnabled`.
- 2026-05-26 deploy blocker found and fixed: Vercel Hobby rejected the original `*/10 * * * *` Vercel Cron entry, so the 10-minute scheduler moved to GitHub Actions while the production route stayed on Vercel.
- Production dry-run result: one planned SMS for event `ce215d6a-e7a4-4a3e-8c30-04989c8a693b`, automation key `show:ce215d6a-e7a4-4a3e-8c30-04989c8a693b:pre-show-sms`, recipient `+17206296507`, no send.
- Live-mode approved result: 2026-05-26T12:40:12Z route response `sentCount=1`, provider message id `40319e64-4cc2-4831-ab95-6b1f73a3b69f`, status `queued`, recipient `+17206296507`.
- Telnyx provider lookup: message `40319e64-4cc2-4831-ab95-6b1f73a3b69f` was outbound from `+19044383050` to `+17206296507`, `received_at=2026-05-26T12:40:12.686Z`, `sent_at=2026-05-26T12:40:13.196Z`, `completed_at=2026-05-26T12:40:13.428Z`, no provider errors.
- `message_log` row: `8141e2da-42b3-40f9-a294-c110a36afef8`, `is_automated=true`, `delivery_status=queued`, `sent_at=2026-05-26T12:40:13.107Z`, cost `0.009`.
- Wallet transaction: `ba840c1c-948a-4509-9a68-bc8dead7ee11`, type `sms_charge`, amount `9` mils; wallet balance after send `2464` mils.
- Duplicate-send prevention result: immediate second live route call returned `sentCount=0`, `skippedCount=1`, error `automated sms reminder already sent for this show`; follow-up GitHub Actions scheduler run `26448656881` completed successfully and did not create a second log or wallet debit.

### Local Verification

- 2026-05-25: `npm exec vitest run tests/prelaunch/prelaunch-gate-readiness.test.ts tests/prelaunch/prelaunch-health-route.test.ts tests/prelaunch/prelaunch-operator-handoff.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts tests/nic-nac/calendar-tools.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/services/message-send-limits.test.ts` -> 10 files / 54 tests passed.
- 2026-05-25: `npx tsc --noEmit --pretty false` -> passed.
- 2026-05-25: `npm run build` -> passed after running outside the sandbox so Next could fetch Google Fonts.
- 2026-05-26: `npm exec vitest run tests/vercel-cron-config.test.ts tests/pre-show-reminders-route.test.ts tests/services/pre-show-reminders.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/send-sms-notification.test.ts` -> 6 files / 38 tests passed.
- 2026-05-26: `npx tsc --noEmit --pretty false` -> passed.
- 2026-05-26: `npm run build` -> passed.

### Vercel Environment Readiness

- 2026-05-25: Production and branch preview `codex/sparkle-cross-phase-hardening` were updated for SMS smoke readiness.
- `TELNYX_API_KEY` exists as a sensitive Vercel env var in production and branch preview.
- `TELNYX_SMS_FROM` is set to `+19044383050` in production and branch preview.
- `TELNYX_PUBLIC_KEY` exists in production and branch preview for webhook verification.
- `SPARKLE_SMS_CAMPAIGN_APPROVED=true` in production and branch preview.
- `SPARKLE_SMS_NUMBER_ASSIGNED=true` in production and branch preview.
- `SPARKLE_SMS_HANDSET_SMOKE_PASSED=false` in production and branch preview until handset proof succeeds.
- `SPARKLE_PRE_SHOW_SMS_ENABLED=true` in production and branch preview after Louis approval for live automated pre-show reminder smoke.
- `CRON_SECRET` exists in production and branch preview; matching `SPARKLE_PRE_SHOW_CRON_SECRET` exists in GitHub Actions for the scheduler workflow.
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
