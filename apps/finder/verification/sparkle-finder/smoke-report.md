# Sparkle Finder V1 Smoke Report

Date: 2026-05-30
Branch: codex-sparkle-finder-v1
Local smoke URL: http://127.0.0.1:4310

> Superseded on 2026-06-13 for shop/affiliate expectations. The current product removes the affiliate row/shop surface and uses `/photo-setup` for plain non-affiliate setup guidance.

## Summary

Sparkle Finder V1 was ready for local smoke-test handoff after automated desktop, mobile, auth-preview, gated-route, and item-detail smoke checks. The current product renders the locked homepage direction with the SF seal, Sparkle Finder brand lock, top navigation, hero/discovery composition, today agenda, Silver Collector Space, bounded Nic-Nac module, and plain photo setup guidance without an affiliate row.

## Commands Run

- `npm run test`
- `npm run test -- tests/sparkle-finder/routes.test.ts tests/sparkle-finder/entitlements.test.ts tests/sparkle-finder/copy-guardrails.test.ts`
- `npm run lint`
- `npm run build`
- `npm run smoke:sparkle-finder`

## Smoke Results

- Production build: pass
- Targeted route, entitlement, and copy tests: pass, 3 files / 32 tests
- Full unit tests: pass, 5 files / 44 tests
- Lint: pass
- Playwright smoke: pass, 5 tests
- Desktop viewport: pass at 1440x900
- Mobile viewport: pass at 390x844
- Homepage primary local click paths: pass
- Auth preview paths: pass for Guest/public reset, Free preview dashboard access, Free-to-Silver gating, and Silver preview access
- Library item detail / Nic-Nac path: pass for `jewel-rainbow-crown-ring` into local `/rep-boards?listing=rainbow-crown`
- Required visible copy checks: pass
- Copy guardrail checks: pass
- No-overlap bounding-box checks: pass
- Rendered user-facing HTML: pass, no `sparklesuite.example` links on homepage or smoke-covered hub routes

## Screenshot Outputs

- `verification/sparkle-finder/sparkle-finder-home-desktop.png`
- `verification/sparkle-finder/sparkle-finder-home-mobile.png`

## Notes From This Pass

- Sign-in now offers Guest/public, Free preview, and Silver preview paths.
- Local preview redirects preserve safe local `localhost`, `127.0.0.1`, or `[::1]` hosts and fall back safely for untrusted hosts.
- Anonymous preview returns to the public homepage and resets the local preview cookie.
- Rep-board and item-detail controls render local `/rep-boards` query URLs instead of placeholder external example domains.
- The dynamic library item route now awaits Next.js route params before rendering the item detail page.

## Product Guardrails

- No customer-to-customer trading UI.
- No buy/sell marketplace behavior.
- No message board or social feed.
- No Amethyst branding.
- No official Bomb Party partnership implication.
- Diamonds and unicorns are treated as Bomb Party labels only.
- No annual Silver plan.
- Nic-Nac is bounded to fixture-backed find-this-for-me matching, not open-ended chat.

## Known Limitations

- Auth is a local-dev cookie preview for anonymous, Free, and Silver states.
- Discovery, Silver collection, and Nic-Nac matching are fixture-backed for V1 smoke testing.
- Fixture metadata may retain canonical example fields, but route links and buttons rendered to users use local app routes or safe query URLs.
- Screenshots are generated artifacts and intentionally ignored by git, while this report and `.gitkeep` keep the verification folder in source.
