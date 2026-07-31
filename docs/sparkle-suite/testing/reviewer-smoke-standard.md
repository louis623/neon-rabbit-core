# Sparkle Suite Reviewer Smoke Standard

Customer-facing Sparkle Suite work is not ready for Louis review until Louis can
walk the full customer path with safe reviewer data.

Sparkle Suite has one live review surface:
`https://www.yoursparklesuite.com`. Reviewer/demo mode means safe test data and
token-gated behavior on that live site, not a separate deployment environment.

## Required Standard

Every signup, checkout, onboarding, customer-site, Nic-Nac, Live queue, Trade
board, email, SMS, and dashboard workflow must include:

- the exact live `www.yoursparklesuite.com` path after release
- safe reviewer/test data
- no need for Louis to use personal information
- no live charges or live customer/provider side effects
- a reset or reseed path for repeated testing
- clear visual labeling when review mode is active
- documented steps from first page to final expected state
- tests proving production review mode requires the explicit long review token

## Reviewer Mode Rules

Reviewer mode must be gated by environment and token. It may run in local
development for pre-release checks. On `www.yoursparklesuite.com`, it may run
only when a long `SPARKLE_REVIEWER_SMOKE_TOKEN` is configured and supplied
through the `review` query parameter. Production reviewer mode must stay
blocked without that matching token.

Reviewer mode should use one reusable QA persona instead of disposable accounts:

- display name: `Britt Test Rep`
- email: configured by `SPARKLE_REVIEWER_SMOKE_EMAIL`
- password: configured by `SPARKLE_REVIEWER_SMOKE_PASSWORD`

The default flow should reset the QA persona and open Stripe Checkout directly.
Do not add an extra customer-facing page whose only purpose is to make Louis
press another button before checkout or setup.

## Required Handoff

When handing a customer-facing feature to Louis, include:

- exact live `www.yoursparklesuite.com` URL
- reviewer URL with token omitted from public notes unless Louis supplied it
- exact click path
- what is real vs simulated
- reset instructions
- verification commands run

For event-calendar work, run `npm run smoke:calendar` locally before release
and against the live production target after release. This smoke must verify the public
Finder live-shows endpoint and every advertised customer-site calendar path, so
the workspace can never promote a calendar link that the customer-facing site
cannot resolve.

## Nic-Nac-First Workspace Smoke

1. Open `https://www.yoursparklesuite.com/start` and enter reviewer smoke mode.
2. Open the workspace preview.
3. Confirm the primary nav shows `Nic-Nac`, `Trade Board`, `Calendar`,
   `Jewelry Library`, and `More`.
4. On mobile width, tap `Add a piece` and verify the Nic-Nac chat opens and
   starts the add-listing flow automatically.
5. On mobile width, close chat and confirm the floating `N` remains available
   to reopen it without covering the `More` tab.
6. On desktop width, confirm the chat remains persistent and the home surface
   still shows compact Today/Trade/Calendar glance modules.
7. Confirm the workspace does not show the old public-site header, Secret Rep ID
   card, right-side legacy chat rail, top `Preview site` action, or `Public Site`
   preview card.
8. Open the rep profile menu and confirm it contains a `Log out` action. Do not
   use Louis's protected admin/demo account for this smoke.
9. Confirm the Trade Board and Active Board jewelry thumbnail treatments remain
   present, and on mobile width confirm `Recent conversations` remains available
   in the first workspace flow without relying on a Public Site preview.

If any item is missing, say so plainly before calling the work ready.
