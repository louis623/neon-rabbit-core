# September 5, 2026 - Brittany hero button polish

## Current application release

- Source: `48615edfb118f3b62fbff7ead035114a168d7a5b`.
- Deployment: `dpl_GeV9T1ad1sktsRt7VUPr8y6RRvE6`, READY.
- Provenance URL: `sparkle-suite-c2pqubcyt-louis-2849s-projects.vercel.app`.
- Repo: C:/Users/louis/sparkle-suite-repo; louis623/sparkle-suite;
  allowlisted branch codex/nic-nac-trade-hardening.
- Exact deployment verified for brittwithbling.com, www.brittwithbling.com,
  www.yoursparklesuite.com, and yoursparklesuite.com after manual assignment.
- Previous deployment retained as rollback evidence:
  dpl_FZQJFd561g9dtBEv93gjxHb4PgJ9 / source 9e96887d / URL
  sparkle-suite-aaoxqluvz-louis-2849s-projects.vercel.app.
- No other customer aliases moved. The previous Mile High Fizz DNS/release
  blocker remains unchanged; do not pursue without separate direction.

## Delivered scope

Louis requested matching gold-to-blue buttons and equal top-row sizing during
Brittany's live anniversary show. Added a standalone stylesheet scoped only to
body.britt-with-bling and one stylesheet link. The three top hero buttons use
equal-width columns; the Dance Floor button spans the row. All four hero
buttons and header Shop use the same existing gold/blush/cyan brand tokens.
Mobile stacks the hero buttons at an equal width; focus-visible styling stays
clear. No link destinations, labels, extension code, lineup behavior, saved
content, forms, account data, orders, billing, or show state changed.

The existing-site preservation skill guided the isolated styling approach;
production-smoke guidance required exact-domain and deployment verification.
Three stale test assertions from the preceding approved Coming Soon release
were updated without changing application behavior.

## Verification

- Local production build and Vercel production build/TypeScript passed.
- Vitest: 58/58 across britt-with-bling-public-site and
  amethyst-homepage-template; standalone Node styling regression: 1/1.
- git diff --check passed. Tracked release source clean; unrelated untracked
  artifacts/ and test-results/ preserved and excluded by .vercelignore.
- Local and live desktop: three equal 184 x 52px hero buttons, lower button
  576 x 52px, identical computed gradient including header Shop.
- Local and live 390px viewport: all four hero buttons 320 x 52px; no
  horizontal overflow. Screenshots visually reviewed, viewport reset.
- Exact live https://brittwithbling.com/ verified with fresh Live Lineup data,
  Coming Soon ticker, hidden unused cards still absent, and unchanged links.
- https://www.yoursparklesuite.com/brittwithbling verified same button styling.
- https://www.yoursparklesuite.com/ stayed on its landing page after release;
  public /login rendered correctly. No credentials entered or forms submitted.
- In-app browser anonymous public checks, not Chrome reviewer-smoke.
  Signed-in synthetic reviewer verification remains unavailable from prior
  work; post-auth destination/workspace identity not claimed verified.
- Local test server stopped. No other processes or browser sessions changed.

## Carry-forward

Keep the previous [live-show closeout](2026-09-05-live-lineup-closeout.md) for
the mitigation limits and permanent Control Center Task List record
e453d5cc-0ac8-4d46-9dab-182a6aa723d7. Do not automatically pursue deferred work.
The next memory-only commit is not a new application deployment.
