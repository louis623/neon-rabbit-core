# Sparkle Suite Reviewer Smoke Standard

Customer-facing Sparkle Suite work is not ready for Louis review until Louis can
walk the full customer path with safe reviewer data.

## Required Standard

Every signup, checkout, onboarding, customer-site, Nic-Nac, Live queue, Trade
board, email, SMS, and dashboard workflow must include:

- a Vercel preview URL or explicit local URL
- safe reviewer/test data
- no need for Louis to use personal information
- no live charges or live customer/provider side effects
- a reset or reseed path for repeated testing
- clear visual labeling when review mode is active
- documented steps from first page to final expected state
- tests proving production review mode requires the explicit long review token

## Reviewer Mode Rules

Reviewer mode must be gated by environment and token. It may run in local
development or Vercel preview. It may also run on the stable demo alias when a
long `SPARKLE_REVIEWER_SMOKE_TOKEN` is configured and supplied through the
`review` query parameter. Production reviewer mode must stay blocked without
that matching token.

Reviewer mode should use one reusable QA persona instead of disposable accounts:

- display name: `Britt Test Rep`
- email: configured by `SPARKLE_REVIEWER_SMOKE_EMAIL`
- password: configured by `SPARKLE_REVIEWER_SMOKE_PASSWORD`

The default flow should reset the QA persona and open Stripe Checkout directly.
Do not add an extra customer-facing page whose only purpose is to make Louis
press another button before checkout or setup.

## Required Handoff

When handing a customer-facing feature to Louis, include:

- preview URL
- reviewer URL with token omitted from public notes unless Louis supplied it
- exact click path
- what is real vs simulated
- reset instructions
- verification commands run

For event-calendar work, run `npm run smoke:calendar` against the intended local
or preview target before reviewer handoff. This smoke must verify the public
Finder live-shows endpoint and every advertised customer-site calendar path, so
the workspace can never promote a calendar link that the customer-facing site
cannot resolve.

If any item is missing, say so plainly before calling the work ready.
