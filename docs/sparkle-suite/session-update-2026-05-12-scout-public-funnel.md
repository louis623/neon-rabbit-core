# Sparkle Suite Session Update - 2026-05-12

## What moved

- Continued Phase 8 task `8.5`.
- Added a public-funnel read to Scout output so captured evidence turns into a clearer pre-call judgment.

## Scout public funnel read

- Scout output now includes `publicFunnel`.
- The funnel read currently classifies the visible public customer path as:
  - `direct_site_first`
  - `hub_first`
  - `unclear`
- Direct brand or shop links produce a `direct_site_first` read.
- Generic link hubs without a stronger visible destination produce a `hub_first` read.
- Missing or failed link evidence produces an `unclear` read.
- Operator UI now shows this as `Public funnel read`, including primary public links and anything Louis should confirm.
- `agent_runs.metadata` now records `public_funnel_shape`.

## Why this matters

- Scout was already capturing likely outbound links and identifying a likely primary customer link.
- This slice turns those details into a one-glance operator summary of the public customer path.
- It helps Louis see whether the rep appears to send customers straight to a specific action, through a generic hub, or into an unclear path.

## Verification

- Focused Scout regression passed:
  - `tests/prelaunch/prelaunch-scout.test.ts`
  - `tests/prelaunch/prelaunch-intake-review-page.test.ts`
- Broader prelaunch + brand regression passed:
  - `tests/prelaunch`
  - `tests/sparkle-suite-master-brand-system.test.ts`
- TypeScript passed:
  - `npx tsc --noEmit --pretty false`
- Production build passed:
  - `npm run build`
- Existing residual warning still remains:
  - Turbopack NFT warning through `app/amethyst/[...asset]/route.ts`

## Still not true yet

- This is still not deep multi-source external research.
- This is still not a full public-funnel audit.
- Task `8.5` should remain `in_progress` until Scout can gather richer evidence and make stronger cross-source judgments with the same no-overclaim posture.
