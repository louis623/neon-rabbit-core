# Sparkle Suite Pricing and Referrals Design - 2026-05-19

## Purpose

Define the approved launch pricing, Stripe checkout behavior, and referral-code model for Sparkle Suite before live Stripe prices are created or production checkout is enabled.

This spec does not approve live Stripe price creation by itself. Live provider actions still require the normal launch-path approval gate.

## Approved Pricing

Every rep pays a non-refundable one-time `Sparkle Suite build fee` of `$49.99`.

Founding rep pricing:

- Applies to the first 20 reps who successfully start a paid subscription.
- Monthly subscription price is `$49.99/month`.
- Founder monthly rate lasts for the rep's first 12 paid service months.
- After 12 paid service months, the subscription increases to `$74.99/month`.

Standard pricing:

- Applies to rep 21 onward.
- Monthly subscription price is `$74.99/month` from the start.

Not allowed:

- No free trials.
- No `$1` first month.
- No checkout language that hides or softens the build fee.

## Stripe Checkout Shape

The first checkout should itemize the one-time build fee and the monthly subscription in the same Stripe Checkout Session.

Founder first checkout:

- Line item 1: `Sparkle Suite build fee` - `$49.99`, one-time, non-refundable.
- Line item 2: `Sparkle Suite Founding Rep Monthly` - `$49.99/month`.
- First invoice total before taxes or Stripe-calculated extras: `$99.98`.

Standard first checkout:

- Line item 1: `Sparkle Suite build fee` - `$49.99`, one-time, non-refundable.
- Line item 2: `Sparkle Suite Standard Monthly` - `$74.99/month`.
- First invoice total before taxes or Stripe-calculated extras: `$124.98`.

Accounting requirement:

- The Stripe invoice must show the build fee and monthly subscription as separate line items.
- The build fee item name must be plain: `Sparkle Suite build fee`.
- Metadata should identify whether checkout used founder or standard pricing.

## Founder Cohort Rule

The "first 20 reps" means the first 20 reps who successfully start a paid subscription, not waitlist submissions, intake forms, demo accounts, or people who only open checkout.

Implementation should count successful paid subscription starts from trusted subscription state, not from form submissions.

Recommended metadata:

- `pricing_tier`: `founder` or `standard`
- `founder_sequence`: integer 1-20 when founder pricing is granted
- `build_fee_charged`: `true`
- `founder_rate_months`: `12` for founder subscriptions

## Twelve-Month Founder Increase

Founder subscriptions should automatically move from `$49.99/month` to `$74.99/month` after 12 paid service months.

Recommended Stripe implementation:

- Create a Stripe Subscription Schedule after the founder subscription is created.
- Phase 1 uses the founder monthly price for 12 monthly iterations.
- Phase 2 uses the standard monthly price indefinitely.

This avoids manual follow-up and matches the approved phrase "first 12 months of paid service."

## Referral Program

Each rep gets one public referral code.

Referral reward:

- If Rep A refers Rep B, Rep A earns one free month only once Rep B reaches 3 paid subscription months.
- The build fee does not count toward the 3-month service mark.
- The reward is one billing credit toward Rep A's next subscription invoice, not cash.
- One reward per referred rep.
- If Rep A cancels before the reward triggers, the reward is forfeited.
- Self-referrals are not allowed.

Credit amount:

- Credit should match the referrer's current monthly subscription rate at the time the reward is issued.
- Founder-rate referrer: `$49.99` credit.
- Standard-rate referrer: `$74.99` credit.

## Referral Code Model

Do not use the live queue Chrome extension sync code as the referral code.

Reason:

- The live queue `sync_code` is operational infrastructure used by the Chrome extension and Supabase `live_queue` table.
- Referral codes are public growth/accounting identifiers reps may share with prospects.
- Keeping these separate avoids exposing operational sync codes and keeps future support issues cleaner.

Recommended model:

- Add `referral_code` to the `reps` table.
- Generate a random, unique, public-safe code for every rep.
- Suggested format: `SS-` plus 6-8 uppercase letters/numbers, excluding confusing characters.
- Keep a unique database index on `reps.referral_code`.
- Store any submitted referring code on intake/onboarding records.
- When the new rep becomes paid, resolve that code to a referrer rep id and store the referral relationship in a dedicated referral tracking table.

Example codes:

- `SS-K7M4Q9`
- `SS-R2P8TX`

## Referral Capture Points

Referral code should be accepted in these places:

- Public Sparkle Suite inquiry or intake form.
- Onboarding form.
- Checkout-start flow if a rep skips the earlier form.

Referral code should be displayed in these places:

- Rep account area in Sparkle Suite.
- Internal operator view.
- Headquarters client/rep record once HQ display is wired.

The core database should be the source of truth. HQ should display or mirror the value rather than invent a separate referral code.

## Required Data Additions

Core Sparkle Suite database:

- `reps.referral_code`
- `reps.founder_sequence` or equivalent durable founder-cohort assignment field
- `reps.pricing_tier` or equivalent durable pricing assignment field
- Referral tracking table with:
  - referrer rep id
  - referred rep id
  - referral code used
  - status
  - paid service month count or eligibility timestamp
  - credit issued timestamp
  - Stripe credit/customer metadata when applied

Stripe environment:

- one-time build fee price id
- founder monthly price id
- standard monthly price id

The current `STRIPE_PRICE_MONTHLY` shape is not enough for this model because checkout needs at least one one-time price plus two monthly price options.

## Testing Requirements

Pricing tests should prove:

- Founder checkout includes two line items: build fee and founder monthly subscription.
- Standard checkout includes two line items: build fee and standard monthly subscription.
- Non-monthly plan requests remain rejected unless explicitly added later.
- Founder eligibility counts paid subscription starts only.
- Founder pricing stops at 20 paid subscriptions.
- Founder subscription metadata marks the 12-month increase plan.
- Checkout response does not expose raw Stripe secrets.

Referral tests should prove:

- Referral codes are generated uniquely and separately from live queue sync codes.
- A valid referral code resolves to the referring rep.
- Invalid or self-referral codes are rejected or ignored with a non-secret operator-visible reason.
- Referral reward eligibility triggers only after 3 paid subscription months.
- Each referred rep can generate at most one reward.

## Open Implementation Notes

Implementation should not modify `chrome-extension/content.js` or `supabase/functions/live-queue-sync`.

Implementation may need a later HQ-facing display update, but the first source-of-truth work belongs in `neon-rabbit-core` because the `reps`, subscriptions, checkout, and intake flows live there.

Live Stripe price creation remains a provider action and should happen only after this spec is implemented enough to support the right price ids safely.
