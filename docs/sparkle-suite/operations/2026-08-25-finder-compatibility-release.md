# Sparkle Finder compatibility release — August 25, 2026

## Outcome

Sparkle Suite remains the source of truth and now exposes the versioned,
additive contracts Sparkle Finder needs for Releases 1–4. The existing v1
interfaces remain available during Finder's migration.

Application release commit: `f3de6c15715049d7db5f913af5a5f9e02a7f23d4`

Production deployment:

- ID: `dpl_H4TuzixGEezkUFE2pnaVc5MVxzb5`
- Provenance URL: `https://sparkle-suite-oue90ghgg-louis-2849s-projects.vercel.app`
- Customer domains: `https://www.yoursparklesuite.com` and
  `https://yoursparklesuite.com`

Both customer domains were verified against the exact deployment ID above.

## Delivered contracts

- Catalog v2 has exact totals, whole-catalog facets, stable signed cursors,
  exact design-ID batch hydration, separate same-item-number variants, and
  unchanged legacy/RBP item numbers.
- Dance Floor availability v2 uses pending-adjusted physical quantity,
  separates listing leads from dancer totals, independently paginates exact
  and similar matches, and preserves the established public eligibility rules.
- Public trade requests use service-role-only, capacity-safe reservation RPCs
  with stable submission IDs and replay-safe notifications. Direct anonymous
  and authenticated inserts are no longer permitted.
- Showcase Studio v2 has deterministic exact variant candidates, exact
  design-ID confirmation, stage-aware leases/idempotency, typed results, and a
  Control Center manual-review queue. Finder photo data remains untrusted and
  temporary Finder URLs cannot become canonical Suite photos.
- Showcase Studio v1 remains deployed and protected while Finder migrates.

## Database changes

Only these additive/compatibility migrations were applied:

- `20260825017000_finder_quantity_aware_availability.sql`
- `20260825018000_sparkle_finder_catalog_v2.sql`
- `20260825019000_ss_finder_studio_intake_v2.sql`

The linked migration register matches locally and remotely through
`20260825019000`. Post-migration counts remained 49 jewelry designs, 104 trade
listings, 2 historical trade requests, 0 pending requests, and 0 Studio v2
review rows. Rollback-only reservation and Studio probes left zero test rows.

## Verification

- Focused compatibility matrix: 15 files, 160/160 tests passed.
- Earlier cross-lane combined regression run: 19 files, 182/182 tests passed.
- Official `npm test`: 225/226 passed; one unrelated stale Nic-Nac tool-registry
  expectation omits the existing `manage_customer_contact` tool.
- Full Vitest inventory: 404 files passed, 21 failed, 1 skipped; 2,819 tests
  passed, 48 unrelated stale tests failed, and 1 skipped. The failures are the
  already-tracked broad-suite drift in old brand/copy snapshots and shared
  operator-auth mocks; no compatibility test failed.
- Focused lint passed. Repository-wide lint remains noisy from pre-existing
  generated artifacts and two legacy empty-interface warnings in
  `lib/services/types.ts`.
- Local and Vercel production builds passed compilation, TypeScript, route
  collection, and static generation.
- Production query plans completed in approximately 8 ms for catalog and 10 ms
  for quantity-aware availability on current data.
- Finder's own `npm run check:suite-contract:strict` passed against the live
  canonical domain with all four capabilities supported.
- Live checks confirmed catalog schema v2 with 49 designs, tampered cursor 400,
  Studio v1/v2 unauthorized 401, operator review unauthorized 401, canonical
  customer site 200, customer Dance Floor 200, and no new deployment errors,
  warnings, or HTTP 500 logs.

## Current boundaries

- Production currently has no Finder-eligible upcoming show inventory, so the
  live strict check correctly reports zero availability. Positive net-quantity
  behavior was verified directly against the installed production functions,
  and replay behavior was verified in rolled-back transactions.
- Application rate-limit buckets are bounded but process-local. If global
  cross-region abuse protection becomes necessary, add a Vercel Firewall or
  durable distributed limiter without changing these public contracts.
- No logged-in personal/customer session was used. The affected Finder APIs
  and public Dance Floor were verified read-only; no production customer or
  reservation data was created for UI smoke.

## Finder continuation

From `C:\Users\louis\sparkle-finder-repo`, run:

```powershell
npm run check:suite-contract:strict
```

It passed at release time. Finder may continue Releases 1–4 while treating
Sparkle Suite as the canonical data and identity authority.
