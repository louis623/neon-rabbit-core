# Sparkle Suite Self-Serve Test Buyer Walkthrough

Use this for Louis's buyer rehearsal before any live-payment smoke. The expected
customer path is account first, Stripe Checkout second, required Nic-Nac setup
third. Do not use the old dashboard Account/Billing path for this smoke.

## Environment

Use Stripe test mode only. Local runs also need Supabase configured because the
first-run setup state is real, not a hardcoded preview:

```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SPARKLE_SELF_SERVE_ENABLED=true
SPARKLE_STRIPE_TEST_BUYER_MODE=true
```

`SPARKLE_STRIPE_TEST_BUYER_MODE=true` makes `/api/stripe/create-checkout`
create a 50-cent monthly Stripe Checkout subscription with inline test price
data. Stripe's USD minimum charge is 50 cents, so the rehearsal cannot be a
real Stripe five-cent charge.

Production and Vercel preview runs must use the deployed app URL for
`NEXT_PUBLIC_APP_URL`. Never run this smoke with live Stripe keys.

## Buyer Path

1. Open `/start`.
2. Create a new rep account with email and password, or use Google sign-in if
   the preview auth callback is configured.
3. Confirm the app opens Stripe Checkout directly. If the signed-in rep resumes
   at `/nic-nac?onboarding=checkout-required`, the app should immediately open
   checkout rather than render a separate checkout page.
4. In Stripe test checkout, use card `4242 4242 4242 4242`, any future expiry,
   any CVC, and any ZIP.
5. Confirm Stripe returns to
   `/nic-nac?onboarding=required-setup&billing=subscription-success&session_id=...`.
6. Confirm the page loads the required Nic-Nac setup experience with the first
   setup step ready, not the full dashboard and not a permanent loading state.

If the webhook is not running, the Nic-Nac return page calls `/api/stripe/sync`
with the returned `session_id`. The sync route fetches that exact Stripe Checkout
session, verifies its `rep_id` belongs to the signed-in rep, retrieves the Stripe
subscription, upserts the local subscription row, advances
`self_serve_setup_sessions` to `required_setup`, and creates the light-box
fulfillment task.

## Production Safety

The test buyer checkout refuses to run with live Stripe keys and refuses to run
when `NODE_ENV=production`.

Stop the smoke if `/api/self-serve/setup-state` returns a configuration error,
if Stripe Checkout opens in live mode, if the return page stays on loading, or if
the app shows the unlocked dashboard before required Nic-Nac setup is complete.

## Reviewer Smoke Mode

Use reviewer smoke mode when Louis needs to review the customer path without
personal data or a real payment attempt.

Required preview/local env:

```env
SPARKLE_REVIEWER_SMOKE_MODE=true
SPARKLE_REVIEWER_SMOKE_TOKEN=long-random-preview-token
SPARKLE_REVIEWER_SMOKE_EMAIL=sparkle-reviewer+preview@neonrabbit.net
SPARKLE_REVIEWER_SMOKE_PASSWORD=preview-only-password
SPARKLE_REVIEWER_SMOKE_DISPLAY_NAME=Britt Test Rep
```

Open:

```text
/start?review=long-random-preview-token
```

Then choose:

1. `Start smoke checkout` to reset the reusable reviewer rep and open Stripe
   Checkout without a Sparkle-hosted pre-checkout page.
2. `Open dashboard preview` when reviewing the unlocked dashboard state.

Reviewer smoke mode is blocked in production and requires the token. The UI is
visibly labeled as test data only.
