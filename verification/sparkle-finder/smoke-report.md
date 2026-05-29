# Sparkle Finder V1 Smoke Report

Date: 2026-05-29
Branch: codex-sparkle-finder-v1
Local smoke URL: http://127.0.0.1:4310

## Summary

Sparkle Finder V1 is ready for local smoke-test handoff after the automated desktop and mobile smoke checks. The app renders the locked homepage direction with the SF seal, Sparkle Finder brand lock, top navigation, hero/discovery composition, today agenda, Silver Collector Space, bounded Nic-Nac module, and affiliate row.

## Commands Run

- `npm run test`
- `npm run lint`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npm run smoke:sparkle-finder`

## Smoke Results

- Production build: pass
- Unit tests: pass, 5 files / 36 tests
- Playwright smoke: pass, 2 viewport tests
- Desktop viewport: pass at 1440x900
- Mobile viewport: pass at 390x844
- Required visible copy checks: pass
- Copy guardrail checks: pass
- No-overlap bounding-box checks: pass

## Screenshot Outputs

- `verification/sparkle-finder/sparkle-finder-home-desktop.png`
- `verification/sparkle-finder/sparkle-finder-home-mobile.png`

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
- Rep, board, and live-show URLs point to example Sparkle Suite paths.
- Screenshots are generated artifacts and intentionally ignored by git, while this report and `.gitkeep` keep the verification folder in source.
