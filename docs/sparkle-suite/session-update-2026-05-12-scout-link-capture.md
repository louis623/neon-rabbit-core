# Sparkle Suite Session Update - 2026-05-12

## What moved

- Continued Phase 8 task `8.5`.
- Extended Scout from title-and-description capture into richer public-profile evidence by capturing likely outbound customer links from supported social profile HTML.

## Scout link capture

- Captured public profile evidence now includes `outboundLinks` when Scout can detect likely off-platform customer-facing links in returned HTML.
- Scout excludes the source platform URL itself so the captured links stay focused on likely customer actions instead of generic profile navigation.
- Operator UI now shows those links under captured public evidence as `Possible customer links`.
- Deterministic Scout synthesis now uses those links when present so the follow-up questions can point at a real call-to-action decision instead of only abstract profile language.

## Why this matters

- Before this slice, Scout could say that the public profile looked active, but it could not surface where the profile appeared to send customers next.
- Now Louis can see a first-pass picture of the rep's likely public action path:
  - profile language
  - source-by-source fetch status
  - likely outbound customer links
- This is still lightweight evidence capture, but it is more useful for discovery-call prep and launch-flow diagnosis than title/description alone.

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
- This is still not a comprehensive crawl of all rep public surfaces.
- Task `8.5` should remain `in_progress` until Scout can gather richer multi-source evidence and turn it into stronger autonomous pre-call guidance.
