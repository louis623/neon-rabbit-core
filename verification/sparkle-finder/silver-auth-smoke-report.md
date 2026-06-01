# Sparkle Finder Silver/Auth Smoke Report

Date: 2026-06-01

## Coverage

- Homepage smoke still verifies the Sparkle Finder discovery hub on desktop and mobile.
- The new `Collector & Rep Essentials` shop card remains present, points to `/shop`, and reaches the local gated shop route.
- `/auth/sign-up` shows 45-day Silver trial copy, phone privacy copy, and leaves optional promotional SMS unchecked by default.
- `/account` prompts anonymous visitors before account controls are shown.
- A local development Silver preview account can access `/account` and `/silver`.
- Anonymous visitors are still gated from hub routes: `/dashboard`, `/library`, `/live-shows`, `/rep-boards`, `/shop`, and `/silver`.
- Silver local preview state still opens the Silver item detail path, bounded Nic-Nac copy, and local rep-board route.

## Local Caveats

- `npm run smoke:sparkle-finder` builds and starts the app with `SPARKLE_FINDER_ENABLE_PREVIEW_AUTH=true` so the production `next start` smoke can exercise the static sign-in page's development preview panel.
- The Silver item-detail smoke seeds the local preview auth cookie directly after the preview-link smoke has already verified the real Silver preview route. This keeps the dynamic item-detail route check deterministic while still testing Silver local-preview access.

## Commands

- `npm run lint` - passed.
- `npm run test` - passed: 10 files, 154 tests.
- `npm run build` - passed.
- `npm run smoke:sparkle-finder` - passed: 9 Playwright smoke tests, screenshots written to `verification/sparkle-finder/`.
