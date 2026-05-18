# Sparkle Suite Demo Launch Runbook - 2026-05-18

Operator: Louis

Demo account email: `louis+sparkle-demo@neonrabbit.net`

Do not put the demo password in this file, chat, tickets, commits, screenshots, or terminal history. If a smoke needs `DEMO_REP_PASSWORD`, set it only in the local shell or `.env.local` you control.

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

### 4. Stripe test monthly price setup

Command:

```powershell
npm run stripe:demo-price
```

What it does:

- Uses only `STRIPE_SECRET_KEY` from `.env.local` or the current shell.
- Refuses to run unless `STRIPE_SECRET_KEY` starts with `sk_test_`.
- Finds or creates a Stripe test monthly price named `Sparkle Suite Launch Demo (test only)`.
- Prints the exact `STRIPE_PRICE_MONTHLY=price_...` line to set locally.
- Does not create a checkout session.
- Does not charge a card.
- Does not decide production pricing.

Optional overrides:

```powershell
npm run stripe:demo-price -- --amount-cents 100 --currency usd --json
```

Stop point:

- If the command says the Stripe key mode is `live`, stop. Do not use live Stripe keys for demo price setup.
- After it prints `STRIPE_PRICE_MONTHLY=...`, put that value in the local shell or `.env.local`, then run the config smoke below.

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
- `STRIPE_PRICE_MONTHLY`
- `NEXT_PUBLIC_APP_URL`

Stop point:

- If `STRIPE_SECRET_KEY` starts with `sk_live_`, stop. Do not set `STRIPE_LIVE_SMOKE_CONFIRMED=true` unless Louis explicitly approves a live Stripe smoke.
- Any browser checkout or portal walkthrough is a separate approval step after this config check passes.

Vercel status:

- Development has `STRIPE_PRICE_MONTHLY=price_1TYTAZHRBK3pZpO2b6WQ8kUl`.
- Preview for `codex/sparkle-cross-phase-hardening` has `STRIPE_PRICE_MONTHLY=price_1TYTAZHRBK3pZpO2b6WQ8kUl`.
- Production is intentionally not set until production Stripe key mode is verified or Louis explicitly approves production test-mode setup.

### 6. Stripe local checkout and portal route smoke

Command:

```powershell
$env:NEXT_PUBLIC_APP_URL='http://localhost:3000'
$env:STRIPE_PRICE_MONTHLY='price_1TYTAZHRBK3pZpO2b6WQ8kUl'
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
- `STRIPE_PRICE_MONTHLY`

Stop point:

- If `STRIPE_SECRET_KEY` is not test mode, stop.
- If the app was already running before `STRIPE_PRICE_MONTHLY` was set, restart the local app with the env value before running this smoke.
- If the billing portal route fails, check Stripe test portal configuration before moving to a browser checkout walkthrough.

### 7. SignWell sandbox payload smoke

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

Stop point:

- If this does not report `send_email=false`, stop.
- If `api_base_url_mode` is not the expected sandbox/dry-run target for the environment, stop and confirm the SignWell base URL before any further provider work.
- Do not enable `SIGNWELL_ALLOW_LIVE_SEND=true` or send a live agreement without Louis explicitly approving the recipient, template, and timing.

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

Also do not do these without separate approval:

- Send any SMS or attach `+19044383050`.
- Send a live SignWell agreement.
- Run a live Stripe checkout or live charge.
- Run any live queue show workflow.

## Recommended launch walkthrough

1. Run `local_static`.
2. Run `supabase_demo` only when ready to refresh demo data.
3. Run `local_app` against the running local app.
4. Manually log in as `louis+sparkle-demo@neonrabbit.net` using the password Louis controls.
5. Confirm the dashboard opens and demo rows are visible.
6. Run `stripe:demo-price` with test keys only if `STRIPE_PRICE_MONTHLY` is missing.
7. Run `stripe_test` with test keys only.
8. Run `stripe_local_routes` against a running app started with the Stripe env.
9. Run `signwell_sandbox` with sandbox/dry-run settings only.
10. Stop and record blockers before any live-provider action.

## Pass notes to capture

For each command, capture:

- Date and time.
- Command category.
- Pass/fail.
- Any missing env.
- Any row counts shown by `supabase_demo`.
- Any provider mode noted by the result.

Do not capture or paste secrets.
