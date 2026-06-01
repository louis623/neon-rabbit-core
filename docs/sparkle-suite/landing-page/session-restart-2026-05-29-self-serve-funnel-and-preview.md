# Sparkle Suite Session Handoff - 2026-05-29

Use this to restart the next Sparkle Suite post-launch landing and self-serve funnel session in `C:\Users\louis\neon-rabbit-core`.

## First Instruction For The Next Session

Do not start implementation automatically. Read Open Brain, Neon Rabbit HQ, this handoff, and repo status first. Then make the local post-launch landing preview visible at `http://localhost:3000/?angle=2` in the in-app browser and wait for Louis's instructions.

If `localhost:3000` is not running, start the local dev server with `npm run dev`, then open `http://localhost:3000/?angle=2`. Do not deploy, push, commit, stage, or keep editing until Louis asks.

## Current Production Truth

- Live production is still the approved prelaunch page: `https://www.yoursparklesuite.com/prelaunch`.
- Root production redirects to `/prelaunch`.
- Correct production deployment: `dpl_7bS32RV4ofLYu4dMFkDuCAZWbvEz`.
- The post-launch/root landing page is local-only. Do not deploy, push, or promote it without explicit Louis approval.

## Launch Path Decision

Louis clarified the intended post-launch path:

- Keep production prelaunch-only while demos and hardening continue.
- Run multiple demos first to iron out bugs in onboarding, payment, setup, and Nic-Nac-assisted configuration.
- Process existing waitlist clients when the flow is ready.
- After the waitlist is handled, move to a public post-launch homepage where new reps can self-serve.
- Final self-serve path should feel like a real buyer/customer journey, not an internal test harness.

## What Was Built This Session

- Added the post-launch self-serve account-start path at `/start`.
- Added self-serve signup support and the initial account-to-checkout flow.
- Added payment gating so unpaid reps see only the safe starter workspace sections: Setup Checklist, Help & Resources, and Account.
- Added guarded Stripe checkout support for Sparkle Suite subscriptions.
- Added local Stripe test-buyer mode for smoke testing checkout at Stripe's minimum 50-cent amount.
- Added deterministic Stripe return sync so a successful Checkout Session can unlock the local account even if webhooks lag.
- Added terms-and-conditions reading flow with same-tab back navigation and return-to-account behavior.
- Polished `/start` branding and fixed form overflow.
- Tightened the Account/Billing pre-checkout card so it now explains:
  - due today
  - monthly renewal
  - cancel policy
  - what unlocks after checkout
  - terms review
  - stronger consent language before Stripe
- Hid `Manage billing and cancel` during first checkout so the first-start flow does not look confused.
- Account billing summary now reports whether checkout is standard or local test-buyer mode, so the billing review card can show 50-cent test language when the dev server is started with `SPARKLE_STRIPE_TEST_BUYER_MODE=true`.

## Important Product / Copy Decisions

- Remove `self-serve` as visible marketing/start-page language where it feels internal.
- The user-facing flow should say what the buyer is doing in plain English: create account, review plan, accept terms, continue to secure Stripe checkout, finish setup with Nic-Nac.
- The billing step should not feel light or amateur. It needs visible charges, renewal, cancellation policy, and what unlocks after payment.
- Checkout alone must not imply live provider actions. No customer texts, emails, calendar changes, or provider messages happen from checkout alone.
- Stripe test mode only until Louis explicitly approves anything real.
- The post-launch experience should eventually let Louis go through the same feeling a lead/new customer will feel.

## Verification

Focused tests passed:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/services/account-billing.test.ts
```

Result: 2 files / 48 tests passed.

Typecheck was run:

```powershell
npx tsc --noEmit --pretty false
```

Current result is still blocked only by the known missing `sharp` dependency/type declarations in image-processing services/tests.

Browser verification on `http://localhost:3000/nic-nac?section=account&onboarding=self-serve-started` confirmed:

- checkout review panel renders
- due today / renewal / cancel policy / unlocks are visible
- terms link is visible
- checkout button is disabled until agreement is checked
- checking agreement enables checkout
- agreement was reset unchecked after verification
- no relevant console warnings/errors from the verified page
- current running dev server showed standard launch pricing; test-buyer copy will show when the server reports `checkoutMode: test_buyer`.

## Current Local Repo State

Branch: `codex/sparkle-cross-phase-hardening`.

The branch is still dirty and ahead of origin. There are many intentional local landing, prelaunch, onboarding, Stripe, Nic-Nac, and test changes from this local post-launch/self-serve buildout.

Known guarded untracked item:

- `docs/sparkle-suite/marketing/`

Do not touch it unless Louis explicitly asks.

## Current HQ State

HQ build summary checked 2026-05-29:

- Project: `sparkle_suite`
- Phases: 14 total, 9 complete, 3 in progress, 2 not started
- Tasks: 121 total, 74 complete, 20 in progress, 27 not started
- Gates: 12 total, 4 passed, 8 locked
- Rollup drift: none
- Action cards:
  - Previous: `Prelaunch Production Cleaned And Deployed`
  - Current: `Continue Post-Launch Landing Preview`
  - Next: `Fine Tune Homepage With Louis`

Relevant HQ action item updated:

- `Post-launch Sparkle Suite should become self-serve after demos and waitlist processing`

## Guardrails For The Next Session

- Do not start implementation automatically.
- No staging, commits, pushes, deploys, or production promotions without explicit Louis approval.
- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not attach `+19044383050`.
- Do not touch `docs/sparkle-suite/marketing/` unless Louis explicitly asks.
- Rep-facing assistant name is `Nic-Nac`.
- Single italic `S` seal only; never `SS`.
- Sparkle Suite first, not generic SaaS.

## Fresh Restart Prompt

```text
PROJECT:
Sparkle Suite / post-launch public landing homepage and self-serve funnel.

CONTINUE IN:
C:\Users\louis\neon-rabbit-core

BRANCH:
codex/sparkle-cross-phase-hardening

STARTUP BEHAVIOR:
Do not begin implementation automatically.

First read Open Brain, Neon Rabbit HQ, and these handoffs:
- docs/sparkle-suite/landing-page/session-restart-2026-05-28-public-landing-and-prelaunch.md
- docs/sparkle-suite/landing-page/session-restart-2026-05-29-self-serve-funnel-and-preview.md

Then check repo state:
git status --short --branch

After that, make the local post-launch landing preview visible in the in-app browser:
http://localhost:3000/?angle=2

If localhost:3000 is not running, start the local dev server with:
npm run dev

Then open:
http://localhost:3000/?angle=2

After the preview is visible, briefly summarize current state and wait for Louis's instructions.

CURRENT HQ ACTION CARD:
Continue Post-Launch Landing Preview.

CURRENT PRODUCTION TRUTH:
The live production site is still the approved prelaunch page:
https://www.yoursparklesuite.com/prelaunch

Root production redirects to /prelaunch.

Correct production deployment:
dpl_7bS32RV4ofLYu4dMFkDuCAZWbvEz

The post-launch/root landing page is local-only. Do not deploy it, push it, or promote it without explicit Louis approval.

CURRENT LOCAL WORK:
The local root landing page has the in-progress post-launch Sparkle Suite homepage with CSS 3D product-forward hero, real Sparkle Suite workspace/product surfaces, trade board / dance floor proof, floating cards for live reveal queue, calendar, SMS/email notifications, Nic-Nac, and a customer-facing 3D section below the workspace hero.

The local self-serve funnel now includes:
- /start account creation path
- terms-gated checkout handoff
- local Stripe test-buyer mode support at Stripe minimum 50 cents when SPARKLE_STRIPE_TEST_BUYER_MODE=true
- deterministic Stripe return sync by checkout session id
- unpaid workspace gating
- terms-and-conditions read/back flow
- Account/Billing review card that lists due today, renewal, cancel policy, unlocks, terms, and agreement before Stripe

NEXT WORK:
Continue smoke testing with Louis from the visible local landing preview. Likely focus areas:
- lead path from landing page to /start
- account/start copy and fit
- Stripe test-buyer flow once the dev server is running in test-buyer mode
- post-checkout unlock into Nic-Nac/account setup
- CSS 3D hero polish
- truthful product surfaces
- customer-facing 3D section
- copy rhythm
- mobile fit
- making sure nothing feels fake, scattered, confusing, or misleading

IMPORTANT COPY / BRAND DECISIONS:
- Sparkle Suite first, not generic SaaS.
- Single italic S seal only, never SS.
- Fonts: Playfair Display and DM Sans.
- Palette: blush, warm white, accent pink, plum-brown.
- Do not use fake jewelry or misleading invented product screens.
- Avoid generic/internal language like backend, launch flow, modules, and self-serve where it feels internal.
- Do not call the customer-facing site Jane's Amethyst skin.
- Jane is only a demo account, not public-facing copy.
- Amethyst is one customization option.
- Use unisex pronouns: their, not her/him.
- Subtle Bomb Party lingo is okay where useful: trade board / dance floor, dancers.
- Nic-Nac should be positioned as the live-show AI assistant easy button.

GUARDRAILS:
- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch chrome-extension/content.js.
- Do not touch supabase/functions/live-queue-sync.
- Do not attach +19044383050.
- Do not touch docs/sparkle-suite/marketing unless Louis explicitly asks.
- Do not stage, commit, push, deploy, or implement until Louis gives the next instruction.
- Rep-facing assistant name is Nic-Nac.

KNOWN LOCAL STATE:
Branch is ahead of origin.
There are uncommitted local landing/prelaunch/self-serve/Stripe/Nic-Nac changes.
Known guarded untracked item:
docs/sparkle-suite/marketing/
```
