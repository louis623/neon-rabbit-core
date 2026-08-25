# Sparkle Finder Silver Trial Stripe Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Sparkle Finder so every new customer account starts a tracked 45-day Silver trial, expired-trial users are prompted on login/day 46 to pay $4.99/month, and paid Silver access is provisioned from Stripe subscription state.

**Architecture:** Keep the 45-day free trial app-owned in Supabase, not a Stripe trial, so customers are not asked for a card until they choose to continue Silver. Supabase stores membership state, Stripe Checkout creates the monthly subscription, Stripe webhooks are the source of truth for paid access, and the account/Silver surfaces read effective membership state to prompt expired users.

**Tech Stack:** Next.js App Router, Supabase Auth + Postgres/RLS, Stripe Billing + Checkout Sessions + Customer Portal, Vitest route/unit tests, existing Sparkle Finder account-service and billing modules.

---

## Current Baseline

- `supabase/migrations/20260531223743_sparkle_finder_accounts.sql` already creates `sparkle_finder_memberships` and an `auth.users` trigger that inserts `access_state = 'silver_trial'`, `silver_source = 'trial'`, `trial_started_at = now()`, and `trial_ends_at = now() + interval '45 days'`.
- `lib/sparkle-finder/membership.ts` already computes expired trials as effective `free`.
- `components/account/SilverStatusPanel.tsx` already shows an upgrade prompt for free users and trials with 7 or fewer days left.
- `app/billing/checkout/route.ts`, `app/billing/portal/route.ts`, and `app/api/stripe/webhook/route.ts` already exist.
- `lib/sparkle-finder/billing.ts` already maps Checkout completion, subscription updates/deletions, and paid invoices to membership updates.
- Missing or incomplete: reliable metadata persistence at signup, explicit post-login day-46 routing, stronger expired-Silver gating, webhook event coverage/idempotency, customer/subscription duplication guards, production Stripe/Supabase env setup, and end-to-end verification.

## File Map

- Modify `supabase/migrations/YYYYMMDDHHMMSS_sparkle_finder_trial_signup_hardening.sql`: add migration to harden signup-created rows, metadata persistence, and backfill missing membership rows.
- Modify `app/auth/sign-up/actions.ts`: ensure password and magic-link signup metadata names align with the trigger.
- Modify `components/account/SignupForm.tsx` and `app/auth/sign-up/page.tsx`: remove "paid path is being connected" copy once billing is wired.
- Create `app/auth/post-login/route.ts`: server-side post-login router that redirects expired trial/free users to account billing prompt.
- Modify `components/account/SignInForm.tsx`, `app/api/auth/callback/route.ts`, and `app/auth/confirm/route.ts`: route successful sign-ins through `/auth/post-login`.
- Modify `components/account/SilverStatusPanel.tsx`: make day-46 copy direct and action-oriented.
- Modify `app/(hub)/silver/page.tsx` and Silver action denial copy if needed: show the same upgrade prompt when a user hits Silver-only tools after expiration.
- Modify `lib/sparkle-finder/billing.ts`: add duplicate subscription guard helpers, robust webhook mapping, and portal/checkout state helpers.
- Modify `app/billing/checkout/route.ts`: reuse existing Stripe customers, avoid duplicate active subscriptions, and set clear success/cancel destinations.
- Modify `app/api/stripe/webhook/route.ts`: add idempotency and handle key subscription lifecycle events.
- Add or update tests in `tests/sparkle-finder/membership.test.ts`, `tests/sparkle-finder/billing.test.ts`, `tests/sparkle-finder/auth-routes.test.ts`, and `tests/sparkle-finder/routes.test.ts`.
- Update docs/env notes in `docs/deployments/sparkle-finder-silver-auth-env-vars.md` if present or create it if the existing file lacks Stripe webhook/price details.

---

## Task 1: Lock the Membership Rules in Tests

**Files:**
- Modify: `tests/sparkle-finder/membership.test.ts`
- Modify: `tests/sparkle-finder/trial-notifications.test.ts`

- [ ] Add tests that define exact trial boundary behavior:
  - Day 1 through the exact `trial_ends_at` timestamp grants `silver_trial`.
  - Any instant after `trial_ends_at` returns effective `free`.
  - Expired trial keeps `trialEndsAt` in the returned result so UI can explain why the prompt appears.
  - Paid Stripe Silver overrides an expired trial.

Suggested test cases:

```ts
it("keeps Silver trial active through the exact trial end instant", () => {
  expect(
    getSilverAccessState({
      accessState: "silver_trial",
      trialEndsAt: "2026-07-23T12:00:00.000Z",
      now: "2026-07-23T12:00:00.000Z",
    }),
  ).toMatchObject({
    effectiveState: "silver_trial",
    hasSilverAccess: true,
    isTrialActive: true,
    isTrialExpired: false,
  });
});

it("prompts as Free immediately after the trial end instant", () => {
  expect(
    getSilverAccessState({
      accessState: "silver_trial",
      trialEndsAt: "2026-07-23T12:00:00.000Z",
      now: "2026-07-23T12:00:00.001Z",
    }),
  ).toMatchObject({
    effectiveState: "free",
    hasSilverAccess: false,
    isTrialActive: false,
    isTrialExpired: true,
    trialEndsAt: "2026-07-23T12:00:00.000Z",
  });
});
```

- [ ] Run: `npm exec vitest run tests/sparkle-finder/membership.test.ts tests/sparkle-finder/trial-notifications.test.ts`
- [ ] Expected: tests pass for existing membership logic or reveal the boundary adjustment needed.

---

## Task 2: Harden Supabase Trial Creation

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_sparkle_finder_trial_signup_hardening.sql`
- Test/verify with Supabase migration dry run or local DB push when credentials are available.

- [ ] Add a migration that updates `private.create_sparkle_finder_account_rows()` so new accounts persist signup metadata already collected in the form:
  - `display_name`
  - `phone`
  - `state`
  - `privacy_acknowledged`
  - promotional email/SMS opt-ins

Core SQL shape:

```sql
create or replace function private.create_sparkle_finder_account_rows()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  initial_email text := coalesce(new.email, '');
  email_display_name text := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  metadata_display_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  metadata_phone text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  metadata_state text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'state', '')), '');
  privacy_acknowledged boolean := coalesce((new.raw_user_meta_data ->> 'privacy_acknowledged')::boolean, false);
  promo_email boolean := coalesce((new.raw_user_meta_data ->> 'promotional_email_opt_in')::boolean, false);
  promo_sms boolean := coalesce((new.raw_user_meta_data ->> 'promotional_sms_opt_in')::boolean, false);
begin
  insert into public.sparkle_finder_profiles (user_id, display_name, email, phone_e164, state)
  values (new.id, coalesce(metadata_display_name, email_display_name, 'Sparkle Finder'), initial_email, metadata_phone, metadata_state)
  on conflict (user_id) do nothing;

  insert into public.sparkle_finder_memberships (
    user_id, access_state, silver_source, trial_started_at, trial_ends_at, silver_started_at, silver_ends_at
  )
  values (new.id, 'silver_trial', 'trial', now(), now() + interval '45 days', now(), now() + interval '45 days')
  on conflict (user_id) do nothing;

  insert into public.sparkle_finder_communication_consents (
    user_id,
    promotional_email_opt_in,
    promotional_email_consented_at,
    promotional_sms_opt_in,
    promotional_sms_consented_at,
    privacy_acknowledged_at
  )
  values (
    new.id,
    promo_email,
    case when promo_email then now() else null end,
    promo_sms,
    case when promo_sms then now() else null end,
    case when privacy_acknowledged then now() else null end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
```

- [ ] Add a backfill statement for existing authenticated users missing membership rows:

```sql
insert into public.sparkle_finder_memberships (
  user_id, access_state, silver_source, trial_started_at, trial_ends_at, silver_started_at, silver_ends_at
)
select id, 'silver_trial', 'trial', created_at, created_at + interval '45 days', created_at, created_at + interval '45 days'
from auth.users
where not exists (
  select 1
  from public.sparkle_finder_memberships m
  where m.user_id = auth.users.id
);
```

- [ ] Run: `supabase migration list`
- [ ] Run when ready against the intended Supabase project: `supabase db push`

---

## Task 3: Add a Post-Login Day-46 Router

**Files:**
- Create: `app/auth/post-login/route.ts`
- Modify: `components/account/SignInForm.tsx`
- Modify: `app/api/auth/callback/route.ts`
- Modify: `app/auth/confirm/route.ts`
- Test: `tests/sparkle-finder/auth-routes.test.ts`

- [ ] Add tests that mock `getCurrentSparkleFinderAccount()`:
  - authenticated expired trial redirects to `/account?message=silver_trial_ended`.
  - authenticated active trial redirects to safe `next`.
  - authenticated paid Silver redirects to safe `next`.
  - anonymous redirects to `/auth/sign-in?next=...`.

- [ ] Implement `app/auth/post-login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = safeSparkleFinderNextPath(requestUrl.searchParams.get("next"));
  const accountState = await getCurrentSparkleFinderAccount();

  if (accountState.status !== "authenticated") {
    const signInUrl = new URL("/auth/sign-in", requestUrl.origin);
    signInUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(signInUrl);
  }

  if (accountState.membership?.isTrialExpired && accountState.membership.effectiveState === "free") {
    return NextResponse.redirect(new URL("/account?message=silver_trial_ended", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
```

- [ ] Update password sign-in success in `SignInForm.tsx`:

```ts
window.location.assign(`/auth/post-login?next=${encodeURIComponent(safeNextPath)}`);
```

- [ ] Update OAuth and email confirmation next paths to pass through `/auth/post-login`.
- [ ] Run: `npm exec vitest run tests/sparkle-finder/auth-routes.test.ts`

---

## Task 4: Make the Day-46 Account Prompt Clear and Actionable

**Files:**
- Modify: `components/account/SilverStatusPanel.tsx`
- Test: `tests/sparkle-finder/routes.test.ts` or `tests/sparkle-finder/auth-routes.test.ts`

- [ ] Add render tests for an expired trial account:
  - shows “Your 45-day Silver trial has ended.”
  - shows “Continue Silver for $4.99/month.”
  - shows active POST form to `/billing/checkout` when billing env is configured.
  - shows disabled fallback when billing env is missing.

- [ ] Update the expired-trial notice copy:

```tsx
{membership?.isTrialExpired ? (
  <div className="grid gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-4">
    <h3 className="text-base font-bold text-[var(--sparkle-plum-deep)]">
      Your 45-day Silver trial has ended.
    </h3>
    <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
      Free access is still available. Continue Silver for $4.99/month to keep wishlist, collection, and Silver tools.
    </p>
  </div>
) : null}
```

- [ ] Keep the current `/billing/checkout` form, but make the button bright pink to match the landing CTA.
- [ ] Run: `npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts`

---

## Task 5: Strengthen Stripe Checkout and Subscription Guards

**Files:**
- Modify: `lib/sparkle-finder/billing.ts`
- Modify: `app/billing/checkout/route.ts`
- Test: `tests/sparkle-finder/billing.test.ts`

- [ ] Add tests proving checkout:
  - reuses existing `stripe_customer_id`.
  - redirects paid Silver users to billing portal/account instead of creating a second subscription.
  - creates `mode: "subscription"` Checkout Sessions with the configured monthly Price.
  - does not set Stripe `trial_period_days` because Sparkle Finder owns the free 45-day trial before payment collection.

- [ ] Update checkout route to refuse duplicate active paid subscriptions:

```ts
if (membership?.access_state === "silver_paid" && membership.stripe_customer_id) {
  const url = new URL("/account", billingEnv.siteUrl);
  url.searchParams.set("message", "silver_already_active");
  return NextResponse.redirect(url, 303);
}
```

- [ ] Keep Checkout Session shape:
  - `mode: "subscription"`
  - `customer`
  - `client_reference_id: data.user.id`
  - `line_items: [{ price: billingEnv.silverPriceId, quantity: 1 }]`
  - metadata on both session and subscription.

- [ ] Run: `npm exec vitest run tests/sparkle-finder/billing.test.ts`

---

## Task 6: Expand Webhook Coverage and Make Updates Idempotent

**Files:**
- Modify: `lib/sparkle-finder/billing.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Optional create: `supabase/migrations/YYYYMMDDHHMMSS_sparkle_finder_stripe_event_log.sql`
- Test: `tests/sparkle-finder/billing.test.ts`

- [ ] Add a `sparkle_finder_stripe_events` table if we want durable idempotency:

```sql
create table public.sparkle_finder_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
```

- [ ] In the webhook route, insert the event id before applying updates; if it already exists, return `{ received: true, duplicate: true }`.
- [ ] Handle at least these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.paused`
  - `customer.subscription.resumed`
  - `invoice.paid`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

- [ ] Keep `invoice.payment_failed` from immediately downgrading; Stripe Billing retries/dunning may recover payment.
- [ ] Add tests for duplicate events and subscription `paused`/`resumed`.
- [ ] Run: `npm exec vitest run tests/sparkle-finder/billing.test.ts`

---

## Task 7: Ensure Silver Feature Gates Route Expired Trials to Billing

**Files:**
- Modify: `app/(hub)/silver/page.tsx`
- Modify if needed: `components/silver/SilverCollectorSpace.tsx`
- Modify: `app/(hub)/silver/actions.ts`
- Test: `tests/sparkle-finder/routes.test.ts`, `tests/sparkle-finder/entitlements.test.ts`

- [ ] Add render tests proving expired trial users see an upgrade prompt instead of editable Silver collection/profile tools.
- [ ] Keep action-level protection already returning `silver_required`, but update denied copy to point users to `/account?message=silver_trial_ended`.
- [ ] Add a reusable billing CTA component only if duplication appears between account page and Silver page.
- [ ] Run: `npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/entitlements.test.ts`

---

## Task 8: Configure Stripe and Environment Variables

**Files:**
- Modify or create: `docs/deployments/sparkle-finder-silver-auth-env-vars.md`
- No app code unless env names change.

- [ ] In Stripe Dashboard, create a Sparkle Finder Silver recurring monthly Price:
  - Product: `Sparkle Finder Silver`
  - Amount: `$4.99`
  - Interval: monthly
  - Copy the live/test `price_...` id into `STRIPE_SILVER_PRICE_ID`.

- [ ] Configure env vars in local, preview, and production:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_SILVER_PRICE_ID`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] Register webhook endpoint:
  - URL: `${NEXT_PUBLIC_SITE_URL}/api/stripe/webhook`
  - Events listed in Task 6.

- [ ] Enable Stripe Customer Portal for subscription cancellation/payment method updates.
- [ ] Confirm Stripe Checkout duplicate-subscription protection settings if we want Stripe-side backup.

Stripe references:
- Billing + Checkout is the recommended pairing for subscriptions.
- Stripe subscription webhooks are needed because subscription state changes asynchronously.
- Stripe Customer Portal is the hosted UI for subscription and billing management.

---

## Task 9: End-to-End Verification

**Files:**
- Test only unless failures are found.

- [ ] Run unit/route tests:

```powershell
npm run test
```

- [ ] Run build:

```powershell
npm run build
```

- [ ] Run local browser smoke:

```powershell
npm run smoke:sparkle-finder
```

- [ ] Manual sandbox verification:
  - Create a new Supabase user.
  - Confirm `sparkle_finder_memberships.trial_started_at` is set.
  - Confirm `trial_ends_at = trial_started_at + 45 days`.
  - Override one test user to an expired trial.
  - Sign in as that user.
  - Confirm `/auth/post-login` sends them to `/account?message=silver_trial_ended`.
  - Click checkout.
  - Complete Stripe test Checkout.
  - Confirm webhook sets `access_state = 'silver_paid'`, `silver_source = 'stripe'`, and Stripe ids.
  - Cancel subscription through portal.
  - Confirm webhook preserves access until period end or downgrades to Free when ended.

---

## Important Implementation Decisions

- Do not create a Stripe trial subscription at signup. The public copy says users start with a free 45-day Silver trial and only then choose whether to pay; that means no card collection at signup.
- Treat Stripe webhooks as the source of truth for paid Silver access. Checkout success URLs are user navigation only, not provisioning proof.
- Keep Supabase service-role writes confined to billing/webhook server code.
- Keep Free access available after trial expiration; only Silver tools are gated.
- Prompt on day 46 through post-login routing and account/Silver page UI, not through a destructive database downgrade job.

## External Setup Checklist

- Supabase migrations applied to the real Sparkle Finder project.
- Stripe monthly Price created for `$4.99/month`.
- Stripe webhook endpoint configured for the deployed app.
- Vercel/local env vars set for Stripe and Supabase service-role writes.
- Customer Portal enabled in Stripe.
