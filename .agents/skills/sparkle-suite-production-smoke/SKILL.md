---
name: sparkle-suite-production-smoke
description: "Use whenever working on Sparkle Suite releases, Vercel production deploys, live-domain checks, logged-in workspace checks, required setup checks, Help & Resources checks, Nic-Nac UI checks, or smoke testing where a clean browser would hit sign-in. Guides Codex to verify the exact yoursparklesuite.com production deployment with safe reviewer-smoke sessions instead of Louis's personal account."
---

# Sparkle Suite Production Smoke

## Purpose

Verify the real Sparkle Suite production deployment and logged-in UI without
relying on Louis's personal account, cookies, saved passwords, or manual help.
Sparkle Suite has one live review surface. "Demo" refers to safe reviewer data
or reviewer mode on the live site; it is not a separate environment or domain.

## Production Review Target

- Canonical live URL: `https://www.yoursparklesuite.com`
- Apex URL: `https://yoursparklesuite.com`
- All approved work flows to this single live surface.
- Both domains must resolve to the exact intended Vercel production deployment.
- Raw Vercel deployment URLs and `sparkle-suite-demo.vercel.app` are
  provenance evidence only, not Louis-facing review targets.
- Do not report a release complete until the affected live-domain path is
  verified after the deployment settles.

## Chrome Flow

When logged-in UI matters, use the Chrome plugin if available or explicitly enabled by Louis.

1. Open `https://www.yoursparklesuite.com/start`.
2. Prefer the built-in `Reviewer smoke mode` controls.
3. Use `Open setup preview` for required setup, Help & Resources from setup, final setup, and Nic-Nac setup checks.
4. Use the dashboard/workspace reviewer path when checking the post-setup Sparkle Suite Workspace.
5. Do not use Louis's personal account.
6. Do not inspect Chrome cookies, local storage, saved passwords, profiles, or session stores.
7. Do not touch Chrome Web Store settings or local live extension code.
8. Leave a useful reviewer tab open as a handoff when Louis should inspect the exact state.

## Account Rule

Do not ask Louis for a password just to smoke test Sparkle Suite. The reviewer-smoke path should create and sign into the synthetic demo account from the app flow itself. If reviewer-smoke controls are missing or disabled, report that as the blocker and do not fall back to Louis's personal account unless he explicitly asks.

### Louis admin/demo invariant

When Louis explicitly asks to verify or repair his Google-auth account,
`louis@neonrabbit.net` is the original Sparkle Suite admin/demo workspace. It is
not a disposable signup account and must not be used to exercise checkout.

Expected production state:

- rep status: `active`
- required setup status: `dashboard_unlocked`
- entitlement: `$0` internal demo
- Stripe mode: non-live
- post-auth destination: Sparkle Suite Workspace, normally `/nic-nac`

If this account reaches Stripe or reports `checkout_required`, treat that as an
account-state incident. Before any live checkout action, inspect the rep,
required-setup session, entitlement/subscription, and pricing reservation
together. Release any accidental reservation and restore the established
internal-demo contract with an identity-guarded, audited repair. Do not create
a live charge or delete Stripe evidence.

## Required Checks

For logged-in smoke verification, check the relevant real UI state, not just source or unauthenticated HTML.

- Required setup: Nic-Nac setup screen loads and Help & Resources is available from setup.
- Help & Resources: workflow sections are scannable/collapsible, with clear expand indicators.
- Workspace: Nic-Nac is integrated as expected for the section under review.
- Production aliases: `www.yoursparklesuite.com` and `yoursparklesuite.com`
  serve the exact intended production deployment.
- Production custom domain: after a production restore or alias change, verify
  `https://www.yoursparklesuite.com` does not refresh away from the landing
  page, then verify the relevant post-auth destination. Root HTML or a brief
  landing-page flash is not sufficient.

## Reporting

In final updates, state:

- the exact live-domain paths verified
- the production deployment id/commit provenance
- whether Chrome reviewer-smoke was used
- what account/session type was used, without exposing or storing secrets
- any parts not visually verified because authentication or reviewer-smoke was unavailable
