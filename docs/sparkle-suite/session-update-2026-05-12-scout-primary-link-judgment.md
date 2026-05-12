# Sparkle Suite Session Update - 2026-05-12

## What moved

- Continued Phase 8 task `8.5`.
- Upgraded Scout from raw outbound-link capture into a first-pass judgment about which public link most likely matters first.

## Scout primary-link judgment

- Captured public evidence now includes:
  - `primaryOutboundLink`
  - `primaryOutboundLinkReason`
- Scout now prefers a direct brand or shop link over a generic link hub when both are visible publicly.
- When only a generic link hub is visible, Scout marks that hub as the current likely customer path instead of pretending it found a stronger destination.
- Operator UI now calls this out directly as `Likely primary customer link`.
- Deterministic Scout synthesis now uses the primary link when forming follow-up questions about the current public call-to-action path.

## Why this matters

- Before this slice, Scout could show several public links but left Louis to guess which one was the real customer action.
- Now Scout makes a lightweight but useful call:
  - direct shop/site link probably matters first
  - generic hub is a fallback when no stronger public destination is visible
- This is still heuristic, but it is a practical step toward better pre-call judgment instead of just more raw evidence.

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
