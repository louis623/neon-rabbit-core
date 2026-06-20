# Trade Request Confirmation State Must Survive Board Refresh

Date: 2026-06-18

## Context

Louis tested the customer Trade Board request flow after reveal screenshots were added. He filled out the form, uploaded a screenshot, submitted the request, and the sheet flashed away without showing a success confirmation. He also did not see the request arrive in the expected inbox from that manual test.

## Root Cause

The backend screenshot/request path was not the primary issue. The customer UI was clearing its own request sheet state after submit.

The Trade Board removes submitted listings from the visible board. That changes `availableSamples`. The demo/tweak-panel request-sheet effect depended on `availableSamples`, so the post-submit board refresh retriggered the effect while `demoSheet` was still `closed`. That cleared `requesting`, `success`, and `requestError`, hiding both success confirmations and errors.

## Fix Pattern

Customer success/error state should not be reset by mutable board listing data. Keep demo controls keyed to the actual demo control state, and read latest listing data through a ref only when the demo sheet explicitly opens.

Implemented in `1635ce1 fix: keep trade request confirmation visible`:

- `public/amethyst/trade.jsx`
  - Added `availableSamplesRef`.
  - Updated the demo-sheet effect to depend on `t.demoSheet`, not `availableSamples`.
  - Preserved tuning-panel demo behavior while keeping live submit success/error visible.
- `tests/amethyst-trade-template.test.ts`
  - Added regression coverage that success and error sheets stay visible after board refreshes.

## Verification Pattern

For future Trade Board request changes, smoke both sides:

- Backend evidence path:
  - public/preview target resolves to the intended rep,
  - request row is created,
  - listing moves to `pending_trade`,
  - optional screenshot persists metadata and storage object,
  - rep-scoped inbox query sees the pending request.
- Rendered customer path:
  - customer submits from the public page,
  - `Request sent.` appears,
  - confirmation remains visible after board refresh,
  - no console errors.

Pressure smoke should include multiple submissions with and without screenshots.

## Gotchas

- Sparkle Suite public slugs allow only lowercase letters and digits. Hyphenated synthetic slugs are invalid and can cause route/API smoke to test fallback inventory instead of the intended rep board.
- `/amethyst/Trade.html` can initially render sample inventory before hydration. Always verify `/api/amethyst/trade-board` returns the intended synthetic listing before trusting a public-page smoke.
- The Browser plugin may block some local/stable URLs with `ERR_BLOCKED_BY_CLIENT`. Try Browser first when the skill requires it; if blocked by the automation layer, cached/headless Playwright is an acceptable rendered-verification fallback.
