# Sparkle Suite Phase 5 Smoke Test Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Phase 5 SMS/email behavior through the same Sparkle Suite workspace and Nic-Nac flows a rep would actually use.

**Architecture:** Do not bypass product surfaces for sends. Use the customer site to create/update the test customer, the Sparkle Suite workspace customer roster for direct workspace email, Nic-Nac chat for assistant-driven SMS/email, and provider/database checks only as evidence after the product action happens.

**Tech Stack:** Next.js 16 App Router, Vercel branch preview, Sparkle Suite workspace, Nic-Nac chat, Supabase `customer_audience` / `message_log` / wallet tables, Telnyx 10DLC SMS, Resend email.

---

## Live Test Recipient

- Test phone: `+17206296507`
- Test email: `louischapman1@gmail.com`
- Test customer name: `Louis Phase Five Smoke`

## Hard Rules

- Do not send through raw Telnyx or Resend API scripts. Provider dashboards/APIs are evidence-only unless a recovery step explicitly says otherwise.
- Use the branch preview first: `https://sparkle-suite-pjcr1e7d0-louis-2849s-projects.vercel.app`.
- Use production domain only after branch preview passes or Louis explicitly asks to test production.
- Do not reply `STOP` during the main test run; that would intentionally opt the test phone out and block later SMS checks.
- Do not set `SPARKLE_SMS_HANDSET_SMOKE_PASSED=true` until a real handset receives at least one SMS.
- Keep `SPARKLE_PRE_SHOW_SMS_ENABLED=false` until the automated reminder dry-run has shown the exact planned recipient/message.
- Manual cap is 3 sends per channel per rolling week. Use exactly 3 live manual SMS and 3 live manual emails, then test the 4th-send block without sending a 4th live message.

## Smoke Message Set

### SMS Bodies

1. `Sparkle Suite SMS smoke 1: Your Sparkle Suite test notification is ready. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
2. `Sparkle Suite SMS smoke 2: This is a customer-care follow-up from the workspace test. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
3. `Sparkle Suite SMS smoke 3: Final Phase 5 manual SMS check before cap validation. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`

### Email Bodies

1. Subject: `Sparkle Suite smoke 1 - workspace email`
   Body: `This is the first Phase 5 smoke email sent from the Sparkle Suite workspace customer roster.`
2. Subject: `Sparkle Suite smoke 2 - Nic-Nac email`
   Body: `This is the second Phase 5 smoke email, sent by asking Nic-Nac to email a customer.`
3. Subject: `Sparkle Suite smoke 3 - Nic-Nac follow-up`
   Body: `This is the third Phase 5 smoke email, confirming repeat customer-care email sends through Nic-Nac.`

---

## Task 1: Preflight Before Any Sends

- [ ] **Step 1: Confirm the deployed preview is ready**

Check Vercel deployment `b0a019b` is ready and use the branch alias:

```text
https://sparkle-suite-pjcr1e7d0-louis-2849s-projects.vercel.app
```

Expected: deployment state is `READY`.

- [ ] **Step 2: Confirm environment readiness**

Verify without printing secret values:

```text
TELNYX_API_KEY exists
TELNYX_SMS_FROM=+19044383050
TELNYX_PUBLIC_KEY exists
SPARKLE_SMS_CAMPAIGN_APPROVED=true
SPARKLE_SMS_NUMBER_ASSIGNED=true
SPARKLE_SMS_HANDSET_SMOKE_PASSED=false
SPARKLE_PRE_SHOW_SMS_ENABLED=false
RESEND_API_KEY exists
RESEND_FROM_EMAIL exists
```

Expected: all values match; handset smoke remains false.

- [ ] **Step 3: Confirm account and wallet readiness in the workspace**

Open the preview workspace as the rep. Check the wallet/message area before sending.

Expected:
- Workspace loads for the authenticated rep.
- SMS wallet has enough balance for at least 3 sends.
- Existing weekly manual SMS/email counts will not already block the smoke run.

---

## Task 2: Customer Site Opt-In Flow

- [ ] **Step 1: Create or refresh the smoke customer from the customer-facing site**

Open the preview customer Join page, not an API client. Submit the public form with:

```text
First name: Louis
Last name: Phase Five Smoke
Email: louischapman1@gmail.com
Phone: 720-629-6507
SMS consent: checked
Email consent: checked
Marketing consent: checked if the UI presents it
```

Expected:
- Form succeeds.
- Phone is accepted only because SMS consent is selected.
- Consent copy is visible and not pre-checked.

- [ ] **Step 2: Verify the customer appears in the workspace**

Open Sparkle Suite workspace > customer/audience roster.

Expected:
- `Louis Phase Five Smoke` appears.
- Phone shows `+17206296507` or equivalent normalized display.
- Email shows `louischapman1@gmail.com`.
- Badges show SMS opted in and Email reachable.

Evidence to record:
- Customer roster screenshot.
- `customer_audience` row id if available.

---

## Task 3: Sparkle Suite Workspace Email Smoke

- [ ] **Step 1: Send workspace email 1 from the customer roster**

In the workspace roster, open the email composer for `Louis Phase Five Smoke` and send:

```text
Subject: Sparkle Suite smoke 1 - workspace email
Body: This is the first Phase 5 smoke email sent from the Sparkle Suite workspace customer roster.
```

Expected:
- Workspace shows a success state.
- Email arrives at `louischapman1@gmail.com`.
- `message_log` has one email row with `is_automated=false`.
- Resend provider has a successful/accepted event.

Evidence to record:
- Workspace success text.
- Inbox receipt timestamp.
- `message_log.id`.
- Resend message id/status.

---

## Task 4: Nic-Nac Audience Lookup Smoke

- [ ] **Step 1: Ask Nic-Nac for the test customer**

In Nic-Nac chat, ask:

```text
Show me the customer audience record for Louis Phase Five Smoke and tell me whether they can receive SMS and email.
```

Expected:
- Nic-Nac uses `get_customer_audience`.
- Nic-Nac reports SMS reachable and email reachable.
- No send happens in this step.

Evidence to record:
- Nic-Nac response.
- Run id if visible in logs.

---

## Task 5: Nic-Nac SMS Smoke

- [ ] **Step 1: Send SMS 1 through Nic-Nac**

In Nic-Nac chat, ask:

```text
Send this text to Louis Phase Five Smoke at 720-629-6507:
Sparkle Suite SMS smoke 1: Your Sparkle Suite test notification is ready. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

Expected:
- Nic-Nac calls `send_sms_notification`.
- Telnyx returns a provider message id.
- Handset receives the SMS.
- `message_log` has SMS row 1.
- SMS wallet is debited once.

- [ ] **Step 2: Send SMS 2 through Nic-Nac**

Ask:

```text
Send this text to Louis Phase Five Smoke at 720-629-6507:
Sparkle Suite SMS smoke 2: This is a customer-care follow-up from the workspace test. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

Expected: second successful SMS, second handset receipt, second wallet debit, second `message_log` row.

- [ ] **Step 3: Send SMS 3 through Nic-Nac**

Ask:

```text
Send this text to Louis Phase Five Smoke at 720-629-6507:
Sparkle Suite SMS smoke 3: Final Phase 5 manual SMS check before cap validation. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

Expected: third successful SMS, third handset receipt, third wallet debit, third `message_log` row.

- [ ] **Step 4: Confirm 4th SMS is blocked**

Ask Nic-Nac:

```text
Send one more test SMS to Louis Phase Five Smoke at 720-629-6507 saying: This fourth SMS should be blocked by the weekly send cap.
```

Expected:
- Nic-Nac returns the weekly SMS cap error.
- No Telnyx send occurs.
- No wallet debit occurs.
- No accepted fourth SMS row is written.

---

## Task 6: Nic-Nac Email Smoke

- [ ] **Step 1: Send email 2 through Nic-Nac**

Ask Nic-Nac:

```text
Email Louis Phase Five Smoke at louischapman1@gmail.com with subject "Sparkle Suite smoke 2 - Nic-Nac email" and body "This is the second Phase 5 smoke email, sent by asking Nic-Nac to email a customer."
```

Expected: email arrives, Resend accepts it, `message_log` email row 2 exists.

- [ ] **Step 2: Send email 3 through Nic-Nac**

Ask Nic-Nac:

```text
Email Louis Phase Five Smoke at louischapman1@gmail.com with subject "Sparkle Suite smoke 3 - Nic-Nac follow-up" and body "This is the third Phase 5 smoke email, confirming repeat customer-care email sends through Nic-Nac."
```

Expected: email arrives, Resend accepts it, `message_log` email row 3 exists.

- [ ] **Step 3: Confirm 4th email is blocked**

Ask Nic-Nac:

```text
Email Louis Phase Five Smoke at louischapman1@gmail.com with subject "This fourth email should be blocked" and body "This email should not send because the weekly cap should stop it."
```

Expected:
- Nic-Nac returns the weekly email cap error.
- No Resend send occurs.
- No accepted fourth email row is written.

---

## Task 7: Pre-Show Reminder Dry-Run And Optional Live Automation

- [ ] **Step 1: Create a real upcoming show through the product**

Use the workspace calendar or Nic-Nac, whichever is the normal rep path available in the preview, to create a show for the test rep roughly 20-30 minutes in the future.

Expected:
- Show appears in the workspace calendar.
- Show is `scheduled`.

- [ ] **Step 2: Run pre-show reminder dry-run**

Call the internal route in dry-run mode with the cron secret, or use the existing scheduled-job mechanism if available:

```text
GET /api/internal/show-reminders/pre-show?mode=dry-run&limit=5
Authorization: Bearer <CRON_SECRET>
```

Expected:
- Route returns `dryRun: true`.
- Planned SMS includes `+17206296507`.
- Message contains the show reminder body and STOP/HELP/rates language.
- No Telnyx send occurs.

- [ ] **Step 3: Decide whether to run one live automated pre-show reminder**

Only after Louis explicitly approves this additional live automated SMS:

```text
Set SPARKLE_PRE_SHOW_SMS_ENABLED=true for the test environment.
Run GET /api/internal/show-reminders/pre-show?mode=live&limit=5 once.
Set SPARKLE_PRE_SHOW_SMS_ENABLED=false again immediately after the run.
```

Expected if approved:
- One automated SMS arrives.
- `message_log.is_automated=true`.
- `automation_key` is `show:<event-id>:pre-show-sms`.
- Rerunning live mode does not send a duplicate for the same `automation_key`.

---

## Task 8: Evidence Capture And Phase 5 Closeout

- [ ] **Step 1: Update the runbook**

Update `docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md` with:

- SMS message ids/statuses.
- Handset receipt timestamps.
- Email provider ids/statuses.
- Inbox receipt timestamps.
- `message_log` ids.
- SMS wallet debits/refunds.
- Manual cap block evidence.
- Pre-show dry-run evidence and optional live automation evidence.

- [ ] **Step 2: Flip handset smoke flag only after proof**

After first real SMS handset receipt:

```text
SPARKLE_SMS_HANDSET_SMOKE_PASSED=true
```

Set this in the tested Vercel environment only after the phone receives a real message.

- [ ] **Step 3: Update HQ/Open Brain only after evidence**

Mark Phase 5 tasks complete only when evidence supports it:

- `5.1 Telnyx SMS integration`: complete after SMS provider response, handset receipt, message log, and wallet debit are verified.
- `5.2 Resend email integration`: complete after workspace/Nic-Nac email receipts and message logs are verified.
- `5.7 Pre-show SMS reminder`: complete after dry-run behavior and guarded live-mode behavior are verified. If live automation is not approved, mark as code-ready/guarded, not fully live.

## Stop Conditions

Stop immediately and do not continue sending if any of these happen:

- SMS does not arrive on handset after Telnyx returns accepted/sent.
- Telnyx returns carrier/compliance failure.
- Email does not arrive after Resend returns accepted.
- `message_log` row is missing or has the wrong channel/recipient/status.
- Wallet debit does not happen for a successful SMS.
- Wallet refund does not happen after a failed SMS send.
- A 4th manual send succeeds instead of being blocked.
- Customer consent status does not match the public Join form submission.

