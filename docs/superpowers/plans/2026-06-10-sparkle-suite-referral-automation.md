# Sparkle Suite Referral Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sparkle Suite referral program so every rep has a shareable code, referred paid accounts are tracked automatically, and referrers receive a one-month Stripe billing credit after the referred rep completes 3 paid subscription months.

**Architecture:** Keep the Supabase database as the source of truth, use Stripe Checkout metadata to carry referral context into paid subscription creation, and use Stripe invoice webhooks to count paid service months and issue customer-balance credits. Display referral details in the rep-facing Account area and add a Help & Resources workflow so reps know where to find and share their code.

**Tech Stack:** Next.js App Router, React, Supabase Postgres/RLS, Stripe Checkout Sessions, Stripe Billing webhooks, Vitest, Vercel preview deployments, Sparkle Suite reviewer-smoke demo flow.

---

## Operating Rules

- Implementation workbench: `C:\Users\louis\sparkle-suite-repo`
- Binder and handoff notes only: `C:\Users\louis\sparkle-suite`
- Do not implement, build, test, commit, or push from `C:\Users\louis\sparkle-suite`.
- Do not touch Chrome Web Store settings.
- Do not modify Sparkle Suite Chrome extension code.
- Read `C:\Users\louis\sparkle-suite\LIVE_EXTENSION_SAFETY.md` before any live extension discussion.
- Use `sparkle-suite-demo-smoke` for stable demo checks, logged-in workspace checks, Help & Resources checks, and Nic-Nac UI checks.
- Prefer stable demo URL: `https://sparkle-suite-demo.vercel.app`.
- Use reviewer-smoke/synthetic accounts for smoke testing, not Louis's personal Chrome account.
- Provider access gates must stop and notify Louis when Supabase, Stripe, Vercel, or Chrome authentication is required.

## Goal Mode Setup

- [ ] **Step 1: Start or confirm Goal Mode**

Set the Goal Mode objective to:

```text
Implement Sparkle Suite referral automation end to end: code generation, referral capture, Stripe webhook reward automation, rep-facing display, Help & Resources guidance, tests, deployment, and demo smoke verification.
```

Expected: Goal Mode remains active until code is merged or otherwise accepted, deployed, smoke tested, and provider setup is complete.

- [ ] **Step 2: Use subagent-driven development**

Recommended execution style:

```text
Use superpowers:subagent-driven-development. Dispatch focused subagents for independent audits and implementation slices, then review each result before merging into the main branch.
```

Expected: subagents produce scoped findings or patches, and the primary agent remains responsible for final integration, tests, deployment, and provider gates.

## File Structure

- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\<timestamp>_ss_referral_paid_months.sql`
  - Adds durable invoice/month ledger for referral rewards.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\sparkle-suite-referrals.ts`
  - Own-code generation and referral code lookup helpers.
- Create: `C:\Users\louis\sparkle-suite-repo\lib\services\sparkle-suite-referral-rewards.ts`
  - Referral relationship creation, paid-month counting, and Stripe credit issuance.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\self-serve\signup.ts`
  - Accepts optional referral code and gives every new rep their own code.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\start\StartSparkleSuiteForm.tsx`
  - Reads `?ref=` and carries referral code through email signup, Google signup, and checkout.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\auth\callback\route.ts`
  - Preserves referral code through OAuth callback.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\create-checkout\route.ts`
  - Resolves referral code and adds referral metadata to Checkout and subscription data.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\webhook\route.ts`
  - Creates pending referrals after paid checkout and counts paid months on invoice events.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\account-billing.ts`
  - Returns rep referral code, share link, and referral status counts.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
  - Adds account/billing referral summary types.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Displays the Referral Program card in Account/Billing.
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
  - Styles the referral card and responsive copy controls.
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\help-resources.ts`
  - Adds the "Share your referral code" workflow.
- Test: `C:\Users\louis\sparkle-suite-repo\tests\self-serve-signup-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\auth-callback-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\stripe-create-checkout-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\stripe-webhook-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\services\account-billing.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\self-serve-start-page.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\help-resources.test.ts`

## Subagent Map

- [ ] **Subagent A: Stripe/webhook audit**

Brief:

```text
Audit app/api/stripe/create-checkout/route.ts, app/api/stripe/webhook/route.ts, and existing Stripe tests. Identify the smallest safe path to carry referral metadata from /start through Checkout and issue one Stripe customer-balance credit after the third paid subscription invoice. Do not edit files.
```

Expected output: findings on metadata fields, webhook events, idempotency keys, and missing tests.

- [ ] **Subagent B: Supabase schema/RLS audit**

Brief:

```text
Audit existing reps, subscriptions, and rep_referrals schema patterns. Recommend the migration shape for paid-month referral ledger with RLS policies that allow reps to read their own referral rows and admins to manage all rows. Do not edit files.
```

Expected output: migration recommendations and RLS policy names.

- [ ] **Subagent C: Account/Billing UI audit**

Brief:

```text
Audit account billing service, DashboardPlaceholder account section, and Help & Resources data. Recommend where a rep should find their referral code and which copy/status fields should be shown. Do not edit files.
```

Expected output: exact UI placement and tests to add.

## Task 1: Repository And Safety Audit

**Files:**
- Read: `C:\Users\louis\sparkle-suite\AGENTS.md`
- Read: `C:\Users\louis\sparkle-suite\LIVE_EXTENSION_SAFETY.md`
- Read: `C:\Users\louis\sparkle-suite-repo\package.json`
- Read: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\create-checkout\route.ts`
- Read: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\webhook\route.ts`

- [ ] **Step 1: Confirm active repo**

Run:

```powershell
Get-Location
git status --short
```

Expected: current directory is `C:\Users\louis\sparkle-suite-repo`; no code commands are run from the binder.

- [ ] **Step 2: Search referral surfaces**

Run:

```powershell
rg -n "referral|referrer|create-checkout|checkout.session.completed|invoice.payment" app lib tests supabase
```

Expected: current referral/pricing surfaces are mapped before editing.

- [ ] **Step 3: Record dirty worktree**

Run:

```powershell
git status --short
```

Expected: note unrelated dirty files and avoid reverting user changes.

## Task 2: Supabase Referral Ledger Migration

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\supabase\migrations\<timestamp>_ss_referral_paid_months.sql`

- [ ] **Step 1: Create migration with Supabase CLI**

Run:

```powershell
supabase migration new ss_referral_paid_months
```

Expected: a timestamped migration file is created under `supabase\migrations`.

- [ ] **Step 2: Write migration**

Use this SQL shape:

```sql
create table if not exists public.rep_referral_paid_months (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.rep_referrals(id) on delete cascade,
  referred_rep_id uuid not null references public.reps(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  stripe_customer_id text,
  amount_paid_cents integer not null default 0,
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists rep_referral_paid_months_referral_idx
  on public.rep_referral_paid_months(referral_id);

create index if not exists rep_referral_paid_months_referred_rep_idx
  on public.rep_referral_paid_months(referred_rep_id);

create index if not exists rep_referral_paid_months_subscription_idx
  on public.rep_referral_paid_months(stripe_subscription_id);

alter table public.rep_referral_paid_months enable row level security;

create policy "Rep referral paid months are readable by referrer"
  on public.rep_referral_paid_months
  for select
  using (
    exists (
      select 1
      from public.rep_referrals rr
      join public.reps r on r.id = rr.referrer_rep_id
      where rr.id = rep_referral_paid_months.referral_id
        and r.user_id = auth.uid()
    )
  );

create policy "Rep referral paid months are readable by referred rep"
  on public.rep_referral_paid_months
  for select
  using (
    exists (
      select 1
      from public.reps r
      where r.id = rep_referral_paid_months.referred_rep_id
        and r.user_id = auth.uid()
    )
  );

create policy "Admins can manage rep referral paid months"
  on public.rep_referral_paid_months
  for all
  using (public.is_admin())
  with check (public.is_admin());
```

Expected: invoice IDs are unique so each paid invoice is counted once.

- [ ] **Step 3: Provider access gate**

Run:

```powershell
supabase migration list
```

Expected: if CLI is not linked or says unauthorized, stop and ask Louis to authenticate Supabase or approve browser/connector access.

- [ ] **Step 4: Apply migration**

Run after Supabase auth is available:

```powershell
supabase db push
supabase migration list
```

Expected: remote database includes the new migration.

## Task 3: Referral Code Services

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\sparkle-suite-referrals.ts`
- Create: `C:\Users\louis\sparkle-suite-repo\lib\services\sparkle-suite-referral-rewards.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\stripe-webhook-route.test.ts`

- [ ] **Step 1: Write failing code-generation test**

Add expectations equivalent to:

```ts
expect(generatedCode).toMatch(/^SS-[A-Z0-9]{6}$/)
expect(generatedCode).not.toBe(existingSyncCode)
```

Expected: test fails until `generateUniqueSparkleSuiteReferralCode` exists or returns the right format.

- [ ] **Step 2: Implement unique referral code generation**

Add a helper with this contract:

```ts
export async function generateUniqueSparkleSuiteReferralCode(
  supabase: { from(table: string): any },
  random = Math.random,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `SS-${makeReferralSuffix(random)}`
    const { data, error } = await supabase
      .from('reps')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()

    if (error) throw error
    if (!data) return code
  }

  throw new Error('Unable to generate a unique Sparkle Suite referral code.')
}
```

Expected: code is public-safe, unique, and separate from live queue sync code.

- [ ] **Step 3: Implement reward service**

Add `sparkle-suite-referral-rewards.ts` with these exported functions:

```ts
export async function createPendingReferralForPaidCheckout(input: {
  supabase: SupabaseAdminClient
  referredRepId: string
  referralCode?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  // Resolve code, reject missing/self-referral, insert pending rep_referrals row once.
}

export async function processReferralPaidSubscriptionInvoice(input: {
  supabase: SupabaseAdminClient
  stripe: Stripe
  invoice: Stripe.Invoice
}) {
  // Resolve referred subscription, insert invoice ledger row, count 3 paid months,
  // and issue one idempotent customer balance credit to the referrer.
}
```

Expected: self-referrals are ignored, duplicate invoices are skipped, and missing migration is reported without breaking webhooks.

## Task 4: Referral Capture In Signup And OAuth

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\self-serve\signup.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\start\StartSparkleSuiteForm.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\auth\callback\route.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\self-serve-signup-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\auth-callback-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\self-serve-start-page.test.ts`

- [ ] **Step 1: Write failing signup test**

Expected test behavior:

```ts
expect(repInsert).toHaveBeenCalledWith(
  expect.objectContaining({
    referral_code: expect.stringMatching(/^SS-[A-Z0-9]{6}$/),
  }),
)
expect(setupSessionInsert).toHaveBeenCalledWith(
  expect.objectContaining({
    answers: expect.objectContaining({ referralCode: 'SS-K7M4Q9' }),
  }),
)
```

- [ ] **Step 2: Accept optional referral code in signup**

Implementation contract:

```ts
const normalizedReferralCode = input.referralCode?.trim().toUpperCase() || null
const ownReferralCode = await generateUniqueSparkleSuiteReferralCode(admin)
```

Expected: new rep receives an own code, and the referring code is stored for checkout resolution.

- [ ] **Step 3: Carry `?ref=` through start page**

Implementation contract:

```ts
const referralCode = searchParams.get('ref')?.trim().toUpperCase() ?? ''
```

Expected: `/start?ref=SS-K7M4Q9` pre-fills or invisibly carries the referral code into signup and checkout.

- [ ] **Step 4: Preserve referral through Google/OAuth**

Implementation contract:

```ts
if (referralCode) {
  redirectTo.searchParams.set('ref', referralCode)
}
```

Expected: OAuth-created reps still retain the referral code.

## Task 5: Stripe Checkout And Webhook Automation

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\create-checkout\route.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\api\stripe\webhook\route.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\stripe-create-checkout-route.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\stripe-webhook-route.test.ts`

- [ ] **Step 1: Write failing checkout metadata test**

Expected test behavior:

```ts
expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
  expect.objectContaining({
    metadata: expect.objectContaining({
      referrer_rep_id: 'rep-referrer',
      referral_code_used: 'SS-K7M4Q9',
    }),
    subscription_data: expect.objectContaining({
      metadata: expect.objectContaining({
        referrer_rep_id: 'rep-referrer',
        referral_code_used: 'SS-K7M4Q9',
      }),
    }),
  }),
)
```

- [ ] **Step 2: Resolve referral before Checkout Session creation**

Implementation contract:

```ts
const referralContext = await resolveCheckoutReferralContext({
  supabase: admin,
  setupSessionId,
  referralCode: body.referralCode,
  currentRepId: rep.id,
})
```

Expected: valid non-self referral codes become Stripe metadata; invalid/self-referral codes do not block checkout.

- [ ] **Step 3: Write failing webhook reward test**

Expected test behavior:

```ts
expect(stripe.customers.createBalanceTransaction).toHaveBeenCalledWith(
  'cus_referrer',
  expect.objectContaining({
    amount: -4999,
    currency: 'usd',
    description: expect.stringContaining('Sparkle Suite referral credit'),
  }),
  expect.objectContaining({
    idempotencyKey: 'sparkle-suite-referral-credit-referral-1',
  }),
)
```

- [ ] **Step 4: Create pending referral on paid checkout**

Implementation contract:

```ts
await createPendingReferralForPaidCheckout({
  supabase: admin,
  referredRepId: rep.id,
  referralCode: session.metadata?.referral_code_used,
  stripeCustomerId,
  stripeSubscriptionId,
})
```

Expected: paid checkout creates one pending referral relationship.

- [ ] **Step 5: Count paid subscription invoices**

Implementation contract:

```ts
if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
  await processReferralPaidSubscriptionInvoice({ supabase: admin, stripe, invoice })
}
```

Expected: build fee does not count; paid subscription invoices count once; reward triggers after 3 counted months.

## Task 6: Account/Billing Referral Display

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\account-billing.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\services\account-billing.test.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Write failing account service test**

Expected test behavior:

```ts
expect(result.referral).toEqual(
  expect.objectContaining({
    code: 'SS-K7M4Q9',
    shareUrl: expect.stringContaining('/start?ref=SS-K7M4Q9'),
    pendingCount: 1,
    earnedCount: 1,
    creditedCount: 1,
  }),
)
```

- [ ] **Step 2: Add referral summary type**

Implementation contract:

```ts
export type AccountBillingReferralSummary = {
  code: string
  shareUrl: string
  pendingCount: number
  earnedCount: number
  creditedCount: number
}
```

Expected: Account/Billing returns a typed referral summary.

- [ ] **Step 3: Self-heal older reps with missing code**

Implementation contract:

```ts
if (!rep.referral_code) {
  const referralCode = await generateUniqueSparkleSuiteReferralCode(admin)
  await admin.from('reps').update({ referral_code: referralCode }).eq('id', rep.id)
}
```

Expected: legacy reps get a code the first time Account/Billing loads.

- [ ] **Step 4: Add Referral Program card**

UI placement: Account section, directly below the existing Account/Billing card.

Expected visible fields:

```text
Referral program
Your code
Your referral link
Copy code
Copy link
Pending
Earned
Credited
```

Expected: buttons copy the code/link, and layout remains stable at desktop and mobile widths.

## Task 7: Help & Resources Workflow

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\help-resources.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\help-resources.test.ts`

- [ ] **Step 1: Write failing Help & Resources test**

Expected test behavior:

```ts
expect(customersAndAccount.workflows.map((workflow) => workflow.title)).toContain(
  'Share your referral code',
)
```

- [ ] **Step 2: Add workflow**

Recommended copy:

```text
Share your referral code
Open Account, copy your referral link, and send it to another rep. When they keep a paid Sparkle Suite subscription active for 3 paid months, your next subscription invoice gets a one-month credit.
```

Expected: reps can find the referral instructions without asking support.

## Task 8: Focused Tests And Build

**Files:**
- Test files listed in File Structure.

- [ ] **Step 1: Run focused referral tests**

Run:

```powershell
npm exec vitest run tests/self-serve-signup-route.test.ts tests/auth-callback-route.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/services/account-billing.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/self-serve-start-page.test.ts tests/help-resources.test.ts
```

Expected: all focused referral tests pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 3: Run TypeScript check when useful**

Run:

```powershell
npx tsc --noEmit --pretty false --incremental false
```

Expected: referral code has no TypeScript errors. If unrelated existing test-type issues remain, document exact files and why they are unrelated.

## Task 9: Deploy And Smoke Test

**Files:**
- No code edits unless smoke finds a bug.

- [ ] **Step 1: Deploy preview**

Run:

```powershell
npx vercel --yes
```

Expected: Vercel returns a preview URL.

- [ ] **Step 2: Alias stable demo**

Run:

```powershell
npx vercel alias set <preview-url> sparkle-suite-demo.vercel.app
```

Expected: `https://sparkle-suite-demo.vercel.app` points to the preview.

- [ ] **Step 3: Run reviewer-smoke browser checks**

Use `sparkle-suite-demo-smoke` and a synthetic reviewer-smoke session.

Required checks:

```text
/start?ref=SS-K7M4Q9 shows/carries referral code
Dashboard Account section shows Referral program card
Referral card shows SS-... code and share link
Copy code and Copy link buttons are enabled
Help & Resources contains Share your referral code under Customers & Account
```

Expected: all smoke checks pass on the stable demo URL.

## Task 10: Provider Activation Gates

**Files:**
- Remote Supabase project
- Stripe Dashboard or Stripe API
- Vercel project settings if env vars are missing

- [ ] **Step 1: Supabase migration gate**

If this command fails with auth/link errors:

```powershell
supabase migration list
```

Notify Louis:

```text
I need Supabase access now so I can link the CLI and apply the referral paid-month ledger migration. Please log in to Supabase for this Codex environment or enable the Supabase connector.
```

Expected after access: `supabase db push` applies the migration.

- [ ] **Step 2: Stripe configuration gate**

Verify Stripe webhook endpoint receives:

```text
checkout.session.completed
invoice.payment_succeeded
invoice.paid
```

Expected: live/test Stripe events reach `app/api/stripe/webhook/route.ts`.

- [ ] **Step 3: Stripe credit behavior gate**

Use Stripe test mode or dashboard event replay to confirm:

```text
Third paid subscription invoice for referred rep creates one negative customer balance transaction on the referrer customer.
```

Expected: idempotency prevents duplicate credits.

## Task 11: Commit And Handoff

**Files:**
- All modified code, tests, and migration files.

- [ ] **Step 1: Review diff**

Run:

```powershell
git diff --stat
git diff -- app lib tests supabase
```

Expected: diff only includes referral feature work and any already-approved adjacent fixes.

- [ ] **Step 2: Commit after verification**

Run:

```powershell
git add app lib tests supabase
git commit -m "feat: add Sparkle Suite referral automation"
```

Expected: commit includes code, tests, and migration.

- [ ] **Step 3: Final report**

Final response must include:

```text
Implementation status
Focused tests run
Build result
Preview URL
Stable demo URL
Smoke account/session used
Supabase migration status
Stripe provider status
Known unrelated issues
```

Expected: Goal Mode is marked complete only after implementation, deployment, smoke testing, and provider activation are complete or explicitly accepted as deferred.

## Verification Commands

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/self-serve-signup-route.test.ts tests/auth-callback-route.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-webhook-route.test.ts tests/services/account-billing.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/self-serve-start-page.test.ts tests/help-resources.test.ts
npm run build
npx tsc --noEmit --pretty false --incremental false
```

Deploy and smoke:

```powershell
npx vercel --yes
npx vercel alias set <preview-url> sparkle-suite-demo.vercel.app
```

Supabase provider activation:

```powershell
supabase migration list
supabase db push
supabase migration list
```

## Self-Review

Spec coverage:
- Public rep referral code is covered by Tasks 3, 4, and 6.
- Referral capture from `/start`, email signup, OAuth signup, and checkout is covered by Tasks 4 and 5.
- Three paid subscription month reward automation is covered by Tasks 2, 3, and 5.
- One reward per referred rep and duplicate invoice protection are covered by Tasks 2 and 5.
- Stripe credit instead of cash payout is covered by Task 5.
- Referrer cancellation forfeiture belongs in `processReferralPaidSubscriptionInvoice` from Task 3.
- Rep-facing display is covered by Task 6.
- Help & Resources display is covered by Task 7.
- Demo deployment and smoke testing are covered by Task 9.
- Supabase and Stripe provider gates are covered by Task 10.

Placeholder scan:
- No TBD/TODO placeholders.
- Provider gates name exact commands and expected next actions.

Type consistency:
- Referral summary uses `code`, `shareUrl`, `pendingCount`, `earnedCount`, and `creditedCount` consistently.
- Stripe metadata uses `referrer_rep_id` and `referral_code_used` consistently.
- Database ledger uses `rep_referral_paid_months` consistently.

