# Sparkle Suite Sandbox Demo Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock a brand-new Sparkle Suite demo account from signup through Stripe sandbox checkout, required setup, workspace unlock, Jewelry Library smoke, and Trade Board smoke.

**Architecture:** Use the existing Stripe Checkout Sessions subscription flow. For this afternoon, prefer the already-built local-only test-buyer branch (`SPARKLE_STRIPE_TEST_BUYER_MODE=true`), which creates a 50-cent Stripe test subscription with inline `price_data` and does not require preconfigured Stripe Price IDs. Keep the production-like Stripe test Price ID path as a secondary option if Louis wants to verify real build-fee/monthly Price objects.

**Tech Stack:** Next.js App Router, Supabase Auth/Postgres, Stripe Checkout Sessions in subscription mode, local `.env.local`, Vitest, in-app browser/Chrome for smoke testing.

---

## File Structure

- Modify locally only: `C:\Users\louis\sparkle-suite-repo\.env.local`
  - Add `SPARKLE_STRIPE_TEST_BUYER_MODE=true` for the local sandbox demo path.
  - Do not commit this file.
- Read/verify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\create-checkout\route.ts`
  - Existing guarded test-buyer branch.
- Read/verify: `C:\Users\louis\sparkle-suite-repo\lib\stripe\sparkle-suite-pricing.ts`
  - Existing 50-cent test-buyer `price_data` builder.
- Read/verify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\sync\route.ts`
  - Existing checkout return sync that creates/updates the subscription row.
- Optional modify: `C:\Users\louis\sparkle-suite-repo\lib\reviewer-smoke\session.ts`
  - Only if we decide reviewer smoke should always seed an active test subscription too.
- Optional test modify: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-session.test.ts`
  - Only if reviewer smoke seeding is implemented.

## Task 1: Choose The Sandbox Checkout Path

**Files:**
- Read: `C:\Users\louis\sparkle-suite-repo\.env.local`
- Read: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\create-checkout\route.ts`

- [ ] **Step 1: Confirm Stripe keys are test-mode**

Run:

```powershell
$rows = @()
foreach ($name in @('STRIPE_SECRET_KEY','NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
  $line = Select-String -Path .env.local -Pattern "^$name=" -ErrorAction SilentlyContinue | Select-Object -First 1
  $value = if ($line) { (($line.Line -split '=',2)[1]).Trim('"') } else { '' }
  $mode = if ($value.StartsWith('sk_test_') -or $value.StartsWith('pk_test_')) { 'test' } elseif ($value.StartsWith('sk_live_') -or $value.StartsWith('pk_live_')) { 'live' } elseif ($value) { 'unknown-set' } else { 'missing' }
  $rows += [pscustomobject]@{ name=$name; mode=$mode }
}
$rows | Format-Table -AutoSize
```

Expected: both rows show `test`.

- [ ] **Step 2: Use the existing local-only test-buyer path**

Decision: set `SPARKLE_STRIPE_TEST_BUYER_MODE=true` locally. This is the recommended afternoon path because it avoids needing Stripe Price IDs and still uses real Stripe sandbox Checkout.

- [ ] **Step 3: Keep the production-like Price ID path as optional**

If Louis wants to test real pricing objects instead, create or select Stripe test-mode Prices in the Stripe Dashboard and set:

```dotenv
STRIPE_PRICE_BUILD_FEE=price_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
```

Expected: normal checkout uses two Stripe test Price IDs, one one-time build fee and one recurring monthly subscription.

## Task 2: Enable Local Test-Buyer Checkout

**Files:**
- Modify locally only: `C:\Users\louis\sparkle-suite-repo\.env.local`

- [ ] **Step 1: Add the local-only flag**

Add this line to `.env.local`:

```dotenv
SPARKLE_STRIPE_TEST_BUYER_MODE=true
```

Expected: `.env.local` now has Stripe test keys plus the test-buyer flag. Do not add this file to git.

- [ ] **Step 2: Restart the local dev server**

Stop the current local dev server, then restart from the implementation workbench:

```powershell
npm run dev
```

Expected: local app is available at `http://localhost:3000`.

- [ ] **Step 3: Verify checkout route creates a Stripe test Checkout Session**

Use a brand-new demo account in the browser, accept terms, and click the normal checkout/start button.

Expected:
- Browser redirects to Stripe Checkout.
- Checkout amount is the configured test-buyer amount.
- Stripe page is in test/sandbox mode.
- No live Stripe payment is created.

## Task 3: Run Brand-New Demo Account Flow

**Files:**
- No code edits.

- [ ] **Step 1: Create a fresh demo account**

Use a new test email and password from `/start`.

Expected:
- Supabase Auth user is created.
- Rep row is created.
- User is signed in locally.

- [ ] **Step 2: Complete Stripe sandbox checkout**

Use Stripe sandbox payment details from Stripe’s test-mode UI or dashboard guidance.

Expected:
- Stripe Checkout completes.
- Browser returns to:

```text
http://localhost:3000/nic-nac?onboarding=required-setup&billing=subscription-success&session_id=...
```

- [ ] **Step 3: Verify checkout sync creates active subscription access**

After the return, wait for the required setup screen to load.

Expected:
- `/api/stripe/sync` runs from the page.
- `subscriptions` has an `active` or `trialing` row for the new rep.
- Required setup remains accessible.

- [ ] **Step 4: Complete required setup enough to unlock the workspace**

Use Nic-Nac required setup to fill the customer-facing site basics and unlock the dashboard.

Expected:
- Setup status becomes `dashboard_unlocked`.
- `/nic-nac` shows the workspace dashboard.
- Trade Board and Jewelry Library panels mount, not just the sidebar nav.

## Task 4: Smoke-Test Jewelry Library And Trade Board

**Files:**
- No code edits unless the smoke test finds a bug.

- [ ] **Step 1: Open Jewelry Library**

Navigate to:

```text
http://localhost:3000/nic-nac?section=jewelry-library
```

Expected:
- Search input labelled `Search designs or item numbers` is visible.
- `Search library` button is visible.

- [ ] **Step 2: Search the catalog**

Search:

```text
RG
```

Expected:
- Catalog results appear.
- Results have `Add to board` buttons for pieces not already listed.

- [ ] **Step 3: Add one catalog piece**

Click `Add to board` for one result.

Expected:
- Helper message says `<itemNumber> added to your board.`
- The same result changes to `Already listed`.

- [ ] **Step 4: Verify the Trade Board**

Open:

```text
http://localhost:3000/nic-nac?section=trade-board
```

Search the item number that was added.

Expected:
- Board inventory shows the item.
- Count increases by one.
- Row shows design name, item number, jewelry type/collection, MSRP if available, and `Remove`.

- [ ] **Step 5: Remove the test listing**

Click the row-level `Remove` button.

Expected:
- Helper message says `Listing removed from your board.`
- Board inventory no longer shows that active listing.

## Task 5: Optional Production-Like Stripe Test Price Setup

**Files:**
- Modify locally only: `C:\Users\louis\sparkle-suite-repo\.env.local`

- [ ] **Step 1: Open Stripe Dashboard in sandbox/test mode**

Use Stripe Dashboard test mode only.

Expected: dashboard indicates test mode before creating or copying any Price IDs.

- [ ] **Step 2: Create/select test Prices**

Use:
- One one-time build-fee Price.
- One recurring monthly Price.

Expected: both IDs start with `price_` and belong to test mode.

- [ ] **Step 3: Set local Price IDs**

Add to `.env.local`:

```dotenv
STRIPE_PRICE_BUILD_FEE=price_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
```

Expected: normal production-like checkout path can run without `SPARKLE_STRIPE_TEST_BUYER_MODE=true`.

- [ ] **Step 4: Restart and test normal checkout path**

Unset or remove:

```dotenv
SPARKLE_STRIPE_TEST_BUYER_MODE=true
```

Restart:

```powershell
npm run dev
```

Expected:
- Checkout creates a test-mode Stripe Checkout Session using the two configured test Prices.
- Return sync still creates active subscription access.

## Task 6: Optional Reviewer Smoke Hardening

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\reviewer-smoke\session.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-session.test.ts`

- [ ] **Step 1: Write a failing test that dashboard-unlocked reviewer smoke seeds active subscription access**

Add a test expectation that `resetReviewerSmokeSession('dashboard_unlocked')` upserts a `subscriptions` row:

```ts
expect(subscriptionUpsert).toHaveBeenCalledWith(
  expect.objectContaining({
    rep_id: 'rep-1',
    status: 'active',
    plan_tier: 'monthly',
    stripe_livemode: false,
  }),
  { onConflict: 'rep_id' },
)
```

Expected: test fails before implementation because reviewer smoke currently unlocks setup but does not seed paid workspace access.

- [ ] **Step 2: Implement reviewer subscription seeding**

Add a helper in `lib\reviewer-smoke\session.ts`:

```ts
async function ensureReviewerSubscription(admin: AdminClient, repId: string) {
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { error } = await admin.from('subscriptions').upsert(
    {
      rep_id: repId,
      stripe_subscription_id: `sub_reviewer_smoke_${repId}`,
      stripe_customer_id: `cus_reviewer_smoke_${repId}`,
      plan_tier: 'monthly',
      pricing_tier: 'smoke',
      status: 'active',
      monthly_amount: 99,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      stripe_livemode: false,
      updated_at: now.toISOString(),
    },
    { onConflict: 'rep_id' },
  )

  if (error) throw error
}
```

Call it only when `state === 'dashboard_unlocked'`.

Expected: reviewer smoke dashboard mode mounts paid workspace panels without manual test-data seeding.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
npm exec vitest run tests/reviewer-smoke-session.test.ts tests/stripe-create-checkout-route.test.ts
```

Expected: all tests pass.

## Verification Commands

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/services/account-billing.test.ts
```

Expected: checkout and billing tests pass.

If code changes are made, also run:

```powershell
npm run build
```

Expected: Next.js production build succeeds.

## Self-Review

Spec coverage:
- Brand-new demo account path is covered by Tasks 2 and 3.
- Stripe sandbox/no-real-payment concern is covered by Tasks 1, 2, and 5.
- Jewelry Library and Trade Board afternoon smoke is covered by Task 4.
- The earlier reviewer smoke billing gap is covered as optional hardening in Task 6.

Placeholder scan:
- No `TBD`, `TODO`, or “implement later” placeholders remain.

Type consistency:
- Uses existing env names from `lib\stripe\config.ts`.
- Uses existing checkout branch from `app\api\stripe\create-checkout\route.ts`.
- Uses existing subscription statuses expected by `hasPaidWorkspaceSubscription`.

