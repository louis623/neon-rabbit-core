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
3. Confirm the app sends the signed-in rep to
   `/nic-nac?onboarding=checkout-required`.
4. Confirm the first screen is focused on secure monthly checkout and light-box
   shipping details, without empty dashboard sections.
5. Click `Continue to secure Stripe checkout`.
6. In Stripe test checkout, use card `4242 4242 4242 4242`, any future expiry,
   any CVC, and any ZIP.
7. Confirm Stripe returns to
   `/nic-nac?onboarding=required-setup&billing=subscription-success&session_id=...`.
8. Confirm the page loads the required Nic-Nac setup experience with the first
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
