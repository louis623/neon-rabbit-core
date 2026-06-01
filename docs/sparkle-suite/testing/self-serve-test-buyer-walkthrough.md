# Sparkle Suite Self-Serve Test Buyer Walkthrough

Use this for Louis's local buyer rehearsal before any live-payment smoke.

## Local Env

Use Stripe test mode only:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SPARKLE_STRIPE_TEST_BUYER_MODE=true
```

`SPARKLE_STRIPE_TEST_BUYER_MODE=true` makes `/api/stripe/create-checkout`
create a 50-cent monthly Stripe Checkout subscription with inline test price
data. Stripe's USD minimum charge is 50 cents, so the rehearsal cannot be a
real Stripe five-cent charge.

## Buyer Path

1. Open `http://localhost:3000/?angle=2`.
2. Click `Get Sparkle Suite`.
3. Create a new rep account on `/start`.
4. Open the `Account` section in Nic-Nac.
5. Accept the Sparkle Suite terms.
6. Click `Start monthly subscription`.
7. In Stripe test checkout, use card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP.
8. Return to Nic-Nac and confirm the workspace unlocks.

If the webhook is not running, the Nic-Nac return page calls `/api/stripe/sync`
with the returned `session_id`. The sync route fetches that exact Stripe Checkout
session, verifies its `rep_id` belongs to the signed-in rep, retrieves the Stripe
subscription, and upserts the local subscription row that unlocks the workspace.

## Production Safety

The test buyer checkout refuses to run with live Stripe keys and refuses to run
when `NODE_ENV=production`.
