# Sparkle Suite Demo Launch Runbook - 2026-05-18

Operator: Louis

Demo account email: `louis+sparkle-demo@neonrabbit.net`

Do not put the demo password in this file, chat, tickets, commits, screenshots, or terminal history. For internal preview route smoke, prefer the temporary-password helper so Louis does not need to know, type, or store the credential during build testing.

## Before starting

1. Work from `C:\Users\louis\neon-rabbit-core`.
2. Confirm you are using test or sandbox provider credentials unless the step says to stop for approval.
3. Do not send SMS, live SignWell agreements, live Stripe charges, paid Nic-Nac calls, or attach the Telnyx number.
4. Stop if a command asks for missing env you cannot identify with confidence.

Base PowerShell setup for the session:

```powershell
cd C:\Users\louis\neon-rabbit-core
$env:DEMO_REP_EMAIL='louis+sparkle-demo@neonrabbit.net'
```

Use `--json` when you want a compact report for notes:

```powershell
npm run smoke:demo -- --category local_static --json
```

Use the aggregate launch smoke when you want one repeatable report across safe launch categories:

```powershell
npm run smoke:launch -- --categories local_static,stripe_test --json --write-report
```

Add categories only as the matching env and stop points are ready. `smoke:launch` refuses the paid Nic-Nac category and writes reports to `.local/launch-smoke-results` when `--write-report` is set.

After the current demo password and local SignWell sandbox env are restored, use the restored-env batch smoke:

```powershell
npm run smoke:launch:restored
```

Run that batch only after:

- `DEMO_REP_EMAIL` is set to the demo rep.
- The current demo password is set locally as `DEMO_REP_PASSWORD`, or a temporary password has been intentionally rotated by the preview smoke helper.
- `STRIPE_SECRET_KEY` is test mode and `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, and `STRIPE_PRICE_STANDARD_MONTHLY` are set to test prices.
- `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`, and `SIGNWELL_TEMPLATE_ID` are restored locally for sandbox/dry-run smoke.
- The local app is running at `http://localhost:3000` with the same env.

This batch intentionally skips `supabase_demo` so demo database refresh remains an explicit step.

## Safe smoke order

### 1. Local static smoke

Command:

```powershell
npm run smoke:demo -- --category local_static
```

What it does:

- Builds the demo seed plan in memory.
- Confirms the smoke categories and provider guards are wired.
- Confirms the seed shape is 2 upcoming shows, 10 listings, and 5 audience members.
- Does not read or write Supabase.
- Does not call Stripe, SignWell, Telnyx, SMS, or Nic-Nac.

Stop point:

- If this fails, stop and fix the local smoke script before touching demo data or providers.

### 2. Supabase demo seed and login smoke

Command:

```powershell
npm run smoke:demo -- --category supabase_demo --json
```

What it does:

- Uses `DEMO_REP_EMAIL` for the demo account.
- Seeds or refreshes the demo rep data idempotently.
- Writes demo rows in Supabase for the rep, site settings, jewelry designs, trade listings, calendar events, and audience.
- Verifies the demo account can log in and read visible rows.
- Does not send SMS.
- Does not call Stripe.
- Does not send SignWell agreements.
- Does not call paid Nic-Nac.

Required env:

- `DEMO_REP_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `DEMO_REP_PASSWORD`, set locally only if Louis has rotated the demo password.

Stop point:

- This writes demo database data. Run it only when Louis is ready to seed or refresh the demo account.
- If login verification fails, stop before browser walkthrough or provider checks.
- If login verification fails with invalid credentials, set the current `DEMO_REP_PASSWORD` locally or use the preview temporary-password helper for protected preview route smoke. Avoid pasting a demo password into docs, chat, or terminal history.

### 3. Local app login smoke

Command:

```powershell
$env:NEXT_PUBLIC_APP_URL='http://localhost:3000'
npm run smoke:demo -- --category local_app --json
```

What it does:

- Signs in with the demo account using local Supabase auth.
- Calls the running app's `/api/nic-nac/me` route.
- Loads the running app's `/nic-nac` route.
- Confirms the local app authenticates as `Launch Demo Rep` and renders the Nic-Nac shell.
- Does not send SMS, call Stripe, call SignWell, or call paid Nic-Nac.

Required env:

- `DEMO_REP_EMAIL`
- `DEMO_REP_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Stop point:

- If this fails, stop before provider checks. The demo account is seeded, but the local app login path is not ready.

### 4. Stripe test itemized price setup

Command:

```powershell
npm run stripe:demo-price
```

What it does:

- Uses only `STRIPE_SECRET_KEY` from `.env.local` or the current shell.
- Refuses to run unless `STRIPE_SECRET_KEY` starts with `sk_test_`.
- Finds or creates three Stripe test prices: `Sparkle Suite build fee (test only)`, `Sparkle Suite Founding Rep Monthly (test only)`, and `Sparkle Suite Standard Monthly (test only)`.
- Prints the exact `STRIPE_PRICE_BUILD_FEE=price_...`, `STRIPE_PRICE_FOUNDER_MONTHLY=price_...`, and `STRIPE_PRICE_STANDARD_MONTHLY=price_...` lines to set locally.
- Does not create a checkout session.
- Does not charge a card.
- Does not decide production pricing.

Optional overrides:

```powershell
npm run stripe:demo-price -- --json
```

Stop point:

- If the command says the Stripe key mode is `live`, stop. Do not use live Stripe keys for demo price setup.
- After it prints the three `STRIPE_PRICE_...` lines, put those values in the local shell or `.env.local`, then run the config smoke below.

### 5. Stripe test-mode config smoke

Command:

```powershell
npm run smoke:demo -- --category stripe_test --json
```

What it does:

- Checks that Stripe test-mode config is present.
- Requires `STRIPE_SECRET_KEY` to start with `sk_test_` unless an explicit live-smoke flag is set.
- Does not create a checkout session.
- Does not create a billing portal session.
- Does not charge a card.

Required env:

- `DEMO_REP_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BUILD_FEE`
- `STRIPE_PRICE_FOUNDER_MONTHLY`
- `STRIPE_PRICE_STANDARD_MONTHLY`
- `NEXT_PUBLIC_APP_URL`

Stop point:

- If `STRIPE_SECRET_KEY` starts with `sk_live_`, stop. Do not set `STRIPE_LIVE_SMOKE_CONFIRMED=true` unless Louis explicitly approves a live Stripe smoke.
- Any browser checkout or portal walkthrough is a separate approval step after this config check passes.

Vercel status:

- Development and Preview previously had only `STRIPE_PRICE_MONTHLY=price_1TYTAZHRBK3pZpO2b6WQ8kUl`; replace that single-price setup with `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, and `STRIPE_PRICE_STANDARD_MONTHLY` before the next Stripe route smoke.
- Most recently smoke-tested protected Preview `https://sparkle-suite-lxmbprga8-louis-2849s-projects.vercel.app` has passed authenticated CLI smoke for demo auth, Nic-Nac shell, Stripe test checkout, and Stripe test portal after a temporary demo password rotation.
- The same preview has passed the opt-in aggregate launch category through `npm run smoke:launch:preview-protected`.
- Production live preflight was attempted on 2026-05-18 without creating checkout or charge traffic. It is blocked because Production currently reports Stripe key mode `test` and is missing approved live build-fee, founder monthly, and standard monthly prices.

### Stripe live preflight, no checkout

Command:

```powershell
npm run smoke:stripe:live-preflight
```

What it does:

- Validates live Stripe launch config shape without calling Stripe and without creating a Checkout Session.
- Requires `STRIPE_SECRET_KEY` mode `live`.
- Requires `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, and `STRIPE_PRICE_STANDARD_MONTHLY` to match their corresponding approved live price ids.
- Requires an approved live smoke path and approval timestamp.
- Confirms `STRIPE_LIVE_SMOKE_CONFIRMED` is not set during preflight.
- Reports only key mode, host, and present/missing status; it does not print Stripe secrets, webhook secrets, or price IDs.

Required env:

- `DEMO_REP_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BUILD_FEE`
- `STRIPE_PRICE_FOUNDER_MONTHLY`
- `STRIPE_PRICE_STANDARD_MONTHLY`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID`
- `STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID`
- `STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID`
- `STRIPE_LIVE_APPROVED_SMOKE_PATH`
- `STRIPE_LIVE_APPROVED_AT`

Latest result:

- `npm run smoke:stripe:live-preflight` was attempted on 2026-05-18 and blocked before any checkout or charge because Production Stripe key mode was `test` and production monthly price/approved live price were missing.

Stop point:

- If key mode is not `live`, stop.
- If the production monthly price does not match the approved live price ID, stop.
- If `STRIPE_LIVE_SMOKE_CONFIRMED=true`, stop during preflight; that flag belongs only to a separately approved final live checkout smoke.
- Do not create a live Checkout Session or submit payment details without Louis approving the exact live path and amount.

### Protected preview CLI route smoke

Use this when Vercel Deployment Protection blocks normal HTTP smoke but the Vercel CLI is authenticated locally:

```powershell
$env:NEXT_PUBLIC_APP_URL='https://sparkle-suite-lxmbprga8-louis-2849s-projects.vercel.app'
npm run smoke:preview:vercel-curl
```

The same check is also available through the aggregate launch smoke harness as an explicit preview-only category:

```powershell
$env:NEXT_PUBLIC_APP_URL='https://sparkle-suite-lxmbprga8-louis-2849s-projects.vercel.app'
npm run smoke:launch:preview-protected
```

If the current demo password is unknown during internal testing, use the passwordless operator path instead:

```powershell
npm run smoke:launch:preview-temp-demo -- --target https://sparkle-suite-lxmbprga8-louis-2849s-projects.vercel.app
```

That command generates a temporary password in memory, rotates the demo rep, runs the protected preview route smoke, writes a launch smoke report, and does not print the password.

What it does:

- Signs in with the demo account using Supabase auth.
- Calls the protected preview through authenticated `vercel curl`.
- Verifies `/api/nic-nac/me`, `/nic-nac`, `/api/stripe/create-checkout`, and `/api/stripe/create-portal-session`.
- Creates Stripe test-mode checkout and portal sessions only.
- Writes no session cookie or provider secret to the repo.
- Does not charge a card or send live provider traffic.

Required env:

- `DEMO_REP_EMAIL`
- `DEMO_REP_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`DEMO_REP_PASSWORD` is not required when using `smoke:launch:preview-temp-demo`, because the helper creates it for the run.

Stop point:

- If `vercel curl` cannot access the deployment, complete Vercel SSO in the browser session or use an approved private protection bypass path.
- Keep browser checkout as a separate walkthrough; this CLI smoke proves protected preview routes, not full browser SSO.

### 6. Stripe local checkout and portal route smoke

Command:

```powershell
$env:NEXT_PUBLIC_APP_URL='http://localhost:3000'
$env:STRIPE_PRICE_BUILD_FEE='price_test_build_fee'
$env:STRIPE_PRICE_FOUNDER_MONTHLY='price_test_founder_monthly'
$env:STRIPE_PRICE_STANDARD_MONTHLY='price_test_standard_monthly'
npm run smoke:demo -- --category stripe_local_routes --json
```

What it does:

- Signs in with the demo account.
- Calls the running app's `/api/stripe/create-checkout` route.
- Calls the running app's `/api/stripe/create-portal-session` route.
- Creates Stripe test-mode checkout and portal sessions only.
- May create or reuse a Stripe test customer for the demo rep.
- Does not charge a card.
- Does not run live Stripe.

Required env:

- `DEMO_REP_EMAIL`
- `DEMO_REP_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BUILD_FEE`
- `STRIPE_PRICE_FOUNDER_MONTHLY`
- `STRIPE_PRICE_STANDARD_MONTHLY`
- Optional for protected Vercel previews: `VERCEL_PROTECTION_BYPASS`

Stop point:

- If `STRIPE_SECRET_KEY` is not test mode, stop.
- If the app was already running before the three `STRIPE_PRICE_...` values were set, restart the local app with those env values before running this smoke.
- If the preview reports Vercel deployment protection, either complete Vercel SSO in the browser session or set `VERCEL_PROTECTION_BYPASS` locally before deployed preview smoke.
- If the billing portal route fails, check Stripe test portal configuration before moving to a browser checkout walkthrough.

### 7. Stripe test webhook config smoke

Command:

```powershell
$env:NEXT_PUBLIC_APP_URL='https://www.yoursparklesuite.com'
npm run smoke:stripe:webhook-test-config
Remove-Item Env:\NEXT_PUBLIC_APP_URL
```

What it does:

- Lists Stripe test-mode webhook endpoints.
- Checks whether the target app has an enabled `/api/stripe/webhook` endpoint.
- Checks whether that endpoint is subscribed to the Stripe events Sparkle Suite handles for subscription launch.
- Does not create checkout sessions.
- Does not submit payment details.
- Does not create charges.
- Does not use live Stripe keys.

Required env:

- `STRIPE_SECRET_KEY` with `sk_test_`.
- `STRIPE_WEBHOOK_SECRET`.
- `NEXT_PUBLIC_APP_URL`.
- Optional: `STRIPE_WEBHOOK_EXPECTED_URL` if the Stripe endpoint should differ from `NEXT_PUBLIC_APP_URL + /api/stripe/webhook`.

Latest result:

- `npm run stripe:ensure-test-webhook -- --target https://www.yoursparklesuite.com --apply --write-secret-file .local\stripe-test-webhook-www.secret --json` created the Stripe test-mode endpoint for `https://www.yoursparklesuite.com/api/stripe/webhook` on 2026-05-19. The generated webhook secret was written only to the ignored `.local` file and was not printed.
- `npm run smoke:stripe:webhook-test-config` then passed for `https://www.yoursparklesuite.com`, reporting `endpoint matched=true`, `endpoint_status=enabled`, and `missing_events=none`.
- Installing that generated webhook secret into Vercel Production was blocked pending explicit Louis approval because replacing a production webhook secret can break verification until the matching deploy is live. Do not overwrite `STRIPE_WEBHOOK_SECRET` in Production without approving that exact step and the redeploy/promotion plan.

Stop point:

- If `STRIPE_SECRET_KEY` is live mode, stop.
- If `endpoint matched=false`, configure a Stripe test webhook endpoint for the intended target before claiming checkout completion/webhook readiness.
- If `missing_events` is not `none`, update the Stripe test webhook endpoint event subscriptions before completing a payment-flow smoke.
- If the endpoint was just created, install its generated webhook secret into the target Vercel environment only after Louis approves the target environment and deploy plan.

### 8. Stripe local signed webhook smoke

Use this against the running local app after the local Stripe env is restored. This proves the app accepts a correctly signed Stripe webhook payload without contacting Stripe.

Command:

```powershell
$env:NEXT_PUBLIC_APP_URL='http://localhost:3000'
npm run smoke:stripe:webhook-local-signature
Remove-Item Env:\NEXT_PUBLIC_APP_URL
```

What it does:

- Builds a synthetic Stripe test event locally.
- Signs it with `STRIPE_WEBHOOK_SECRET`.
- Posts it to `/api/stripe/webhook` on the running app.
- Uses an unhandled event type so no subscription state is changed.
- Does not call Stripe.
- Does not create checkout sessions.
- Does not create charges.

Required env:

- `STRIPE_WEBHOOK_SECRET`.
- `NEXT_PUBLIC_APP_URL`.
- The running app must already have complete Stripe and Supabase env available.

Latest result:

- `npm run smoke:stripe:webhook-local-signature` passed on 2026-05-19 against `http://localhost:3000`, returning `accepted=true`, `status=200`, `subscription_state_changed=false`, and `provider_call=none`.

Stop point:

- If the local app is not running, start it with the restored env first.
- If the route returns `Invalid signature`, verify the local app and the smoke command are using the same `STRIPE_WEBHOOK_SECRET`.
- This does not replace the Stripe webhook endpoint config smoke; it only proves the app route and signature path work locally.

### 9. SignWell sandbox payload smoke

Command:

```powershell
npm run smoke:demo -- --category signwell_sandbox --json
```

What it does:

- Builds a SignWell sandbox/dry-run agreement payload for `louis+sparkle-demo@neonrabbit.net`.
- Confirms the payload has `send_email=false`.
- Reports `template_id=present` and an `api_base_url_mode` value without printing the template ID, API key, or base URL.
- Does not send a live agreement.
- Does not email the recipient from SignWell.

Required env:

- `DEMO_REP_EMAIL`
- `SIGNWELL_API_KEY`
- `SIGNWELL_API_BASE_URL`
- `SIGNWELL_TEMPLATE_ID`

Vercel status:

- Development has `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`, and `SIGNWELL_TEMPLATE_ID`.
- Preview for `codex/sparkle-cross-phase-hardening` has `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`, and `SIGNWELL_TEMPLATE_ID`.
- Template ID source is the reusable SignWell template `Service Agreement Template_ Sparkle Suite (2)`.
- `npm run smoke:demo -- --category signwell_sandbox --json` passed locally with `send_email=false`.

Stop point:

- If this does not report `send_email=false`, stop.
- If `api_base_url_mode` is not the expected sandbox/dry-run target for the environment, stop and confirm the SignWell base URL before any further provider work.
- Do not enable `SIGNWELL_ALLOW_LIVE_SEND=true` or send a live agreement without Louis explicitly approving the recipient, template, and timing.

### 10. SignWell sandbox provider smoke, non-sending

Use this only when the local shell has real SignWell sandbox/test credentials restored. This makes one SignWell API request and creates a test-mode document, but keeps `send_email=false`.

Command:

```powershell
$env:SIGNWELL_SANDBOX_PROVIDER_CALL='true'
npm run smoke:signwell:sandbox-provider
Remove-Item Env:\SIGNWELL_SANDBOX_PROVIDER_CALL
```

What it does:

- Calls SignWell's create-from-template API using the configured template.
- Requires `test_mode=true` and `send_email=false` before making the provider call.
- Reports only provider status, whether a document id was present, recipient count, and base URL mode.
- Does not print the API key, base URL, template ID, document ID, embedded signing URL, or recipient email details beyond the demo address already documented.
- Does not send a live agreement email.

Required env:

- `DEMO_REP_EMAIL`
- `SIGNWELL_API_KEY`
- `SIGNWELL_API_BASE_URL`
- `SIGNWELL_TEMPLATE_ID`
- `SIGNWELL_SANDBOX_PROVIDER_CALL=true`
- Optional: `SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER` if the SignWell template placeholder is not `sparkle_suite_rep`.

Latest result:

- Attempted on 2026-05-19 after implementation. The run stopped before provider contact because local SignWell env values were not available; the ignored Vercel preview env pull showed the names but no local values to load. No SignWell API request was made.

Stop point:

- If any SignWell env value is missing, stop before provider contact.
- If `SIGNWELL_ALLOW_LIVE_SEND=true`, stop and unset it.
- If the template placeholder name does not match the SignWell template, set `SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER` and retry once.
- Do not use this for a live send. A real SignWell email remains a separate Louis approval step.

### 11. SignWell live preflight, non-sending

Use this only after Louis has approved the intended recipient, template, and send window for preflight. This does not send the agreement and must run with `SIGNWELL_ALLOW_LIVE_SEND` unset.

Command:

```powershell
npm run smoke:signwell:live-preflight
```

What it does:

- Builds a live-like SignWell payload for the approved recipient and template context.
- Confirms `send_email=false`.
- Confirms `test_mode=false` so the payload shape matches a live send boundary without emailing anyone.
- Reports SignWell base URL mode without printing the base URL, API key, or template ID.
- Confirms `SIGNWELL_ALLOW_LIVE_SEND` is false during preflight.

Required env:

- `DEMO_REP_EMAIL`
- `SIGNWELL_API_KEY`
- `SIGNWELL_API_BASE_URL`
- `SIGNWELL_TEMPLATE_ID`
- `SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL`
- `SIGNWELL_LIVE_APPROVED_TEMPLATE_NAME`
- `SIGNWELL_LIVE_APPROVED_SEND_WINDOW`

Latest result:

- `npm run smoke:signwell:live-preflight` passed on 2026-05-18 for `louis+sparkle-demo@neonrabbit.net`.

Stop point:

- If `SIGNWELL_ALLOW_LIVE_SEND=true`, stop and unset it before preflight.
- If `send_email` is not false, stop.
- If the recipient, template, or send window has not been approved in the current launch context, stop.
- A real SignWell send remains a separate Louis approval step.

## Not safe without approval

Do not run these during the normal demo launch walkthrough:

```powershell
npm run smoke:demo -- --category nic_nac_paid
```

Why:

- The category is intentionally blocked unless `NIC_NAC_ALLOW_PAID_SMOKE=true` is set.
- It represents capped paid Nic-Nac requests, not a free local check.

Approval needed first:

- Louis approves paid Nic-Nac smoke.
- `NIC_NAC_PAID_SMOKE_MAX_REQUESTS` is set to an agreed cap.
- The result destination and cost expectation are clear.

Safe preflight only:

```powershell
npm run smoke:nic-nac:paid-preflight
```

What it does:

- Validates the approved paid-smoke scope and request cap.
- Confirms the approved request count does not exceed `NIC_NAC_PAID_SMOKE_MAX_REQUESTS`.
- Confirms `NIC_NAC_ALLOW_PAID_SMOKE` is false during preflight.
- Does not call Nic-Nac, Anthropic, or any paid provider.

Required env:

- `DEMO_REP_EMAIL`
- `NIC_NAC_PAID_SMOKE_SCOPE`
- `NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS`
- `NIC_NAC_PAID_SMOKE_MAX_REQUESTS`
- `NIC_NAC_PAID_SMOKE_APPROVED_AT`

Latest result:

- `npm run smoke:nic-nac:paid-preflight` passed on 2026-05-18 with approved requests capped at 1 and `paid_calls_executed=false`.

Stop point:

- If the approved request count is above the max request cap, stop.
- If `NIC_NAC_ALLOW_PAID_SMOKE=true`, stop during preflight; that flag belongs only to a separately approved paid provider run.
- Do not run `spike/run-benchmark.ts` or `nic_nac_paid` until Louis approves the exact prompt scope, target URL, result destination, and request count.

Also do not do these without separate approval:

- Send any SMS or attach `+19044383050`.
- Send a live SignWell agreement.
- Run a live Stripe checkout or live charge.
- Run any live queue show workflow.

## Recommended launch walkthrough

1. Run `local_static`.
2. Run `supabase_demo` only when ready to refresh demo data.
3. Run `local_app` against the running local app.
4. Manually log in as `louis+sparkle-demo@neonrabbit.net` only after a stable demo password has been intentionally set for browser testing; for route smoke, use the temporary-password helper instead.
5. Confirm the dashboard opens and demo rows are visible.
6. Run `stripe:demo-price` with test keys only if any of `STRIPE_PRICE_BUILD_FEE`, `STRIPE_PRICE_FOUNDER_MONTHLY`, or `STRIPE_PRICE_STANDARD_MONTHLY` is missing.
7. Run `stripe_test` with test keys only.
8. Run `stripe_local_routes` against a running app started with the Stripe env.
9. Run `smoke:stripe:webhook-test-config` against the target app URL and stop if the endpoint is missing or missing required events.
10. Run `smoke:stripe:webhook-local-signature` against the running local app.
11. Run `signwell_sandbox` with sandbox/dry-run settings only.
12. Run `smoke:launch` with the categories that passed individually, using `--json --write-report`.
13. Follow `docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md` for the manual browser pass.
14. Stop and record blockers before any live-provider action.

## Pass notes to capture

For each command, capture:

- Date and time.
- Command category.
- Pass/fail.
- Any missing env.
- Any row counts shown by `supabase_demo`.
- Any provider mode noted by the result.

Do not capture or paste secrets.
