# Sparkle Suite Browser Smoke Walkthrough - 2026-05-18

Purpose: handoff plan for the next session's manual or Chrome-assisted browser smoke. This is a checklist, not executable automation.

Demo rep email: `louis+sparkle-demo@neonrabbit.net`

Do not write the demo password, provider keys, Vercel bypass values, Stripe session URLs, SignWell template IDs, or other secrets into this file, screenshots, commits, or chat.

## Hard stops

- Do not send SMS.
- Do not attach or test live queue show messaging.
- Do not send live SignWell agreements.
- Do not run live Stripe charges.
- Do not run paid Nic-Nac provider calls.
- Do not set `SIGNWELL_ALLOW_LIVE_SEND=true`.
- Do not set `NIC_NAC_ALLOW_PAID_SMOKE=true`.
- Do not use live Stripe keys unless Louis separately approves a live Stripe smoke.

## Surfaces

- Local app: `http://localhost:3000`
- Deployed protected preview already smoke-tested by CLI: `https://sparkle-suite-2chlrqw8y-louis-2849s-projects.vercel.app`
- Login path: `/login`
- Rep workspace path: `/nic-nac`
- Billing controls: `/nic-nac`, Account tab, Account Billing card
- SignWell dry-run boundary: `/api/prelaunch/signwell/agreement`

For a protected Vercel preview, sign in through Vercel SSO in the browser session or use the local bypass value only from the operator's private environment. Do not paste bypass values into notes.

## Before opening the browser

1. Confirm the target environment is test/sandbox only for Stripe and SignWell.
2. Confirm the demo account was seeded and login smoke passed, per `docs/sparkle-suite/demo-launch-runbook-2026-05-18.md`.
3. For local browser smoke, start the local app with the same environment used by the passing route smoke, including test `STRIPE_PRICE_MONTHLY`.
4. Keep browser devtools Network open enough to confirm redirects and statuses, but do not preserve secret-bearing request headers in screenshots.

## Walkthrough A - Local app

1. Open `http://localhost:3000/login`.
2. Log in as `louis+sparkle-demo@neonrabbit.net` using the password Louis controls.
3. Navigate to `http://localhost:3000/nic-nac`.
4. Verify the page renders the Nic-Nac shell and identifies the workspace as the demo rep context.
5. Verify dashboard/demo data is visible:
   - Trade Board has demo listings.
   - Calendar shows demo show data.
   - Audience/customer area has demo audience data.
   - Account tab loads the Account Billing card.
6. Do not ask Nic-Nac to perform paid provider work. A harmless UI prompt is okay only if it stays inside the app and does not trigger paid provider smoke.

Expected local pass: the Nic-Nac workspace opens without auth bounce, the demo data is populated, and the Account Billing card loads without a configuration error.

Stop if login fails, the workspace is blank, demo rows are missing, billing shows missing Stripe config, or any UI path asks to enable SMS/live queue/live SignWell/live Stripe.

## Walkthrough B - Stripe test checkout cancel/return

Use test mode only.

1. In `/nic-nac`, open the Account tab.
2. In the Account Billing card, click `Start monthly subscription`.
3. Confirm the browser navigates to a Stripe-hosted checkout page.
4. Confirm the Stripe page is visibly test mode or otherwise tied to the test configuration.
5. Do not enter real card details and do not complete a charge.
6. Use Stripe's back/cancel path to return to the app.
7. Confirm the app returns to `/nic-nac` with the subscription cancellation state visible, currently expected as `?billing=subscription-cancelled`.
8. Confirm the UI shows the cancellation/return message and remains usable.

Expected pass: checkout opens in Stripe test mode, cancellation returns to the app, and the app shows the cancelled checkout state without creating a live charge.

Stop before submitting any payment form. Stop immediately if Stripe appears to be live mode, asks for real payment, or the return URL leaves the app in a broken state.

## Walkthrough C - Stripe test billing portal

Use this only after a test customer or test subscription route smoke has created enough Stripe test state for the portal route to open.

1. In `/nic-nac`, open the Account tab.
2. In the Account Billing card, click `Manage billing`.
3. Confirm the browser navigates to a Stripe-hosted billing portal page.
4. Do not update real billing details.
5. Use the portal return link or browser back path to return to the app.
6. Confirm the app returns to `/nic-nac` with the portal return state visible, currently expected as `?billing=portal-returned`.
7. Confirm the UI remains usable after return.

Expected pass: the Stripe billing portal opens in test mode and returns to the app cleanly.

Stop if the route says no Stripe customer exists; run only the safe test route smoke from the runbook if needed. Stop if the portal appears live or prompts for real billing changes.

## Walkthrough D - Deployed protected preview

Repeat Walkthrough A, B, and C against the protected preview only after browser access is available.

Use the same paths:

- `/login`
- `/nic-nac`
- `/nic-nac` Account tab for checkout and portal controls

Expected pass: protected preview behaves the same as local for login, Nic-Nac shell, demo data, Stripe test checkout cancel/return, and Stripe test portal return.

Stop if Vercel protection blocks access and Louis has not approved a browser auth path. Do not move to production to bypass preview protection.

## Walkthrough E - SignWell dry-run boundary

This is a boundary check only. Do not send an agreement.

1. Confirm `SIGNWELL_ALLOW_LIVE_SEND` is unset or false in the target environment.
2. Use only the sandbox/dry-run smoke path already documented in the runbook:
   - `npm run smoke:demo -- --category signwell_sandbox --json`
3. Confirm the reported payload has `send_email=false`.
4. If a browser/API client check is needed, prepare only a request that exercises the non-send response from `/api/prelaunch/signwell/agreement`.
5. Stop at the prepared payload or blocked live-send response.

Expected pass: the SignWell flow proves configuration and payload shape without emailing the recipient.

Stop before any action that could send a SignWell email. Stop if `send_email` is not false, if the route requires `SIGNWELL_ALLOW_LIVE_SEND=true`, or if the target environment cannot be confirmed as sandbox/dry-run.

## Capture notes

For each walkthrough, record:

- Target: local or protected preview.
- Date/time.
- Browser used.
- Pass/fail.
- Return URL state for Stripe checkout and portal.
- Any visible non-secret error text.
- Screenshots only if they do not expose secrets, provider IDs, bypass values, or passwords.

Do not capture passwords, provider keys, request headers, Vercel bypass values, Stripe session IDs, SignWell template IDs, or live customer/payment details.

## Handoff status

- Command-side smoke is documented in `docs/sparkle-suite/demo-launch-runbook-2026-05-18.md`.
- Launch readiness summary is documented in `docs/sparkle-suite/launch-readiness-2026-05-18.md`.
- Remaining browser work is manual/Chrome-assisted verification of the local app and protected preview.
- Provider sends and paid provider calls remain parked behind explicit Louis approval.
