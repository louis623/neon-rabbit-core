# Sparkle Suite Landing Page Closeout - 2026-05-28

Use this to restart the next Sparkle Suite landing-page session in `C:\Users\louis\neon-rabbit-core`.

## First Instruction For The Next Session

Do not start implementation automatically. Read Open Brain, Neon Rabbit HQ, this handoff, and repo status first. Then make the local post-launch landing preview visible at `http://localhost:3000/?angle=2` in the in-app browser and wait for Louis's instructions.

If `localhost:3000` is not running, start the local dev server with `npm run dev`, then open `http://localhost:3000/?angle=2`. Do not deploy, push, commit, or keep editing until Louis asks.

## Bottom Line

The live prelaunch site at `https://www.yoursparklesuite.com/prelaunch` has been cleaned up, smoke-checked, and redeployed to production. The post-launch/root Sparkle Suite landing page is still local-only and should be reviewed next from the local preview.

## Production State

- Live prelaunch URL: `https://www.yoursparklesuite.com/prelaunch`
- Root production URL: `https://www.yoursparklesuite.com/` redirects to `/prelaunch`.
- Correct production deployment: `dpl_7bS32RV4ofLYu4dMFkDuCAZWbvEz`
- Correct production deployment URL: `https://sparkle-suite-bah5klw9q-louis-2849s-projects.vercel.app`
- A first deployment from local HEAD, `dpl_32C81e1sDnrt7CHgJPHGfsYfA9sg`, accidentally included the local post-launch root landing page. That was caught during smoke testing and corrected immediately by redeploying from `origin/codex/sparkle-cross-phase-hardening` plus only the approved prelaunch changes.
- The local post-launch/root landing page is not approved for production. Do not deploy it without explicit Louis approval.

## What Changed On The Live Prelaunch Site

- Removed unauthorized/internal copy that Louis did not approve:
  - `Self-Serve Launch Flow`
  - `Get Launch Access`
  - `Built to sell first, train after purchase.`
  - `The new handoff`
  - backend/self-serve/setup-flow framing
- Restored the approved public prelaunch direction:
  - `Sparkle Suite - Coming Soon`
  - `A better customer experience starts with a better rep setup.`
  - `Join the Waitlist`
  - `Be first in line when Sparkle Suite opens.`
  - `Thank you, friend. We've got you.`
  - `We're building this carefully.`
- Removed the short TikTok-style preview section.
- Removed the `V1 preview` label and decorative right-side numbers from the hero/cards.
- Added the pricing section to `/prelaunch#pricing`.
- Kept the prelaunch waitlist flow intact with required email consent and optional SMS consent unchecked by default.

## Current Prelaunch Pricing

Prelaunch currently shows all three pieces so reps can see the founder-price advantage:

- Sparkle Suite build fee: `$49.99`
- Founding rep monthly: `$49.99/month` for the first 20 paid reps
- Standard monthly: `$74.99/month`

The post-launch/root landing pricing is simpler and currently shows the build fee plus the standard monthly rate only.

## Local Post-Launch Landing Work

The root landing page at local `http://localhost:3000/?angle=2` now has the in-progress post-launch homepage direction:

- Beacons-inspired, product-forward CSS 3D hero.
- Sparkle Suite branding from the approved public/waitlist direction.
- Single italic `S` seal only; never `SS`.
- Playfair Display and DM Sans.
- Blush, warm white, accent pink, and plum-brown palette.
- Real Sparkle Suite workspace/product surfaces, not invented fake jewelry.
- Main hero screen uses an active-looking Sparkle Suite workspace/trade board.
- Floating hero cards currently cover:
  - live reveal queue
  - live event calendar
  - SMS/email messages and notifications
  - Nic-Nac easy button
- Hero title was corrected to `A better customer experience starts with a better rep setup.` and the pink slash/strike was removed.
- Scroll behavior was fixed by removing the landing wrapper overflow trap.
- A customer-facing 3D section was added below the rep-workspace hero. It shows the customer side of the product, with Amethyst used only as a visual skin option rather than the name of the product or account.

## Copy And Product Decisions

- Do not call the customer-facing site `Jane's Amethyst skin`.
- Jane is only a demo account and should not be public-facing copy.
- Amethyst is one customization option for the customer-facing site.
- Use unisex pronouns. Prefer `their`; avoid `her` and `him`.
- Subtle Bomb Party lingo is allowed where it helps reps recognize the product:
  - trade board / dance floor
  - dancers
- Do not overuse `Bomb Party` in the hero. The public voice should still be Sparkle Suite first.
- Nic-Nac should be positioned harder as the live-show AI assistant easy button:
  - helps reps update their site
  - helps reps update the dance floor/trade board
  - helps reps update calendars/show details
  - helps reps with practical next steps
- Avoid generic SaaS/internal words such as `backend`, `launch flow`, and `modules`.
- The page should feel polished, useful, and real, not like invented SaaS filler.

## Important Verification

Prelaunch production deploy verification:

- Vercel remote build passed for corrected deployment `dpl_7bS32RV4ofLYu4dMFkDuCAZWbvEz`.
- Live `/prelaunch` showed approved hero, pricing, and waitlist form.
- Live `/prelaunch` did not show `V1 preview`, self-serve/backend copy, decorative card-number classes, or the removed TikTok-style preview section.
- Browser smoke on live `/prelaunch`: no console warnings/errors and no horizontal overflow.
- `https://www.yoursparklesuite.com/` resolves to `/prelaunch` with status 200 after redirects.
- No real production waitlist form submission was performed because that could trigger live lead/email-provider behavior.

Local safe tests that passed before deploy:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-page.test.ts tests/prelaunch/prelaunch-waitlist-service.test.ts tests/prelaunch/prelaunch-waitlist-route.test.ts tests/prelaunch/prelaunch-waitlist-email.test.ts
```

Result: 4 files / 18 tests passed.

Earlier post-launch/root landing verification passed:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Browser smoke at `http://localhost:3000/?angle=2` passed earlier with no console warnings/errors and no horizontal overflow.

## Current Local Repo State At Closeout

Branch: `codex/sparkle-cross-phase-hardening`

Latest local commit before this handoff: `48c55ae feat: show Sparkle workspace trade board in hero`

Branch status before this handoff: ahead of origin by 11 commits.

Known local changes at closeout:

- `app/_components/sparkle-suite-public-landing.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/prelaunch/_components/PrelaunchAudience.tsx`
- `app/prelaunch/_components/PrelaunchBenefits.tsx`
- `app/prelaunch/_components/PrelaunchHero.tsx`
- `app/prelaunch/_components/PrelaunchWaitlistForm.tsx`
- `app/prelaunch/page.tsx`
- `lib/prelaunch/content.ts`
- `lib/sparkle-suite/public-landing-content.ts`
- `tests/prelaunch/prelaunch-page.test.ts`
- `tests/sparkle-suite-public-landing.test.ts`
- Deleted: `app/prelaunch/_components/PrelaunchVideoSection.tsx`
- Added locally: `app/prelaunch/_components/PrelaunchPricing.tsx`
- Added by this closeout: `docs/sparkle-suite/landing-page/session-restart-2026-05-28-public-landing-and-prelaunch.md`

Known guarded untracked item:

- `docs/sparkle-suite/marketing/`

Do not touch `docs/sparkle-suite/marketing/` unless Louis explicitly asks.

## Open Brain Context Checked

Open Brain currently has a useful May 27 capture for this post-launch landing work:

- Sparkle Suite public landing page handoff, 2026-05-27

Open Brain also contains older, contradictory May 11 public-site memories around rejected/approved prelaunch copy. Treat the current live production state, this handoff, and Louis's latest instructions as the source of truth for the May 28 prelaunch cleanup.

Open Brain captures added during this closeout:

- `SESSION CLOSE - Sparkle Suite public landing/prelaunch closeout - 2026-05-28`
- `DECISION - Sparkle Suite post-launch landing remains local-only after 2026-05-28 closeout`
- `ACTIVE TASK - Next Sparkle Suite session after 2026-05-28 closeout`

## Neon Rabbit HQ State Checked

HQ build summary checked on 2026-05-28:

- Project: `sparkle_suite`
- Phases: 14 total, 9 complete, 3 in progress, 2 not started
- Tasks: 121 total, 74 complete, 20 in progress, 27 not started
- Gates: 12 total, 4 passed, 8 locked
- Rollup drift: none reported

HQ action cards before this closeout:

- Previous: `Landing Hero Product Proof Built`
- Current: `Review Local Sparkle Landing Preview`
- Next: `Fine Tune Landing Page With Louis`

HQ action cards after this closeout:

- Previous: `Prelaunch Production Cleaned And Deployed`
- Current: `Continue Post-Launch Landing Preview`
- Next: `Fine Tune Homepage With Louis`

## Guardrails For The Next Session

- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not attach `+19044383050`.
- Do not touch `docs/sparkle-suite/marketing/` unless Louis explicitly asks.
- Rep-facing assistant name is `Nic-Nac`.
- Public landing page work is local unless Louis explicitly approves deploy/push.

## Fresh Restart Prompt

```text
PROJECT:
Sparkle Suite / post-launch public landing homepage.

CONTINUE IN:
C:\Users\louis\neon-rabbit-core

BRANCH:
codex/sparkle-cross-phase-hardening

IMPORTANT STARTUP BEHAVIOR:
Do not begin implementation automatically. First read Open Brain, Neon Rabbit HQ, and this handoff:
docs/sparkle-suite/landing-page/session-restart-2026-05-28-public-landing-and-prelaunch.md

Then check repo state:
git status --short --branch

Open the local post-launch landing preview in the in-app browser:
http://localhost:3000/?angle=2

If localhost:3000 is not running, start the local dev server with:
npm run dev

After the preview is visible, briefly summarize current state and wait for Louis's instructions.

CURRENT TRUTH:
- Live production remains the prelaunch site at https://www.yoursparklesuite.com/prelaunch.
- Root production redirects to /prelaunch.
- Correct production deployment is dpl_7bS32RV4ofLYu4dMFkDuCAZWbvEz.
- The post-launch/root landing page is local-only and should not be deployed or pushed without explicit approval.
- Known guarded untracked item: docs/sparkle-suite/marketing/. Do not touch it.

WHAT TO REVIEW NEXT:
Continue fine tuning the local post-launch homepage/root landing page with Louis, starting from the visible preview. Likely areas: CSS 3D hero polish, customer-facing 3D section, section rhythm, copy, mobile fit, and final proof that all shown product surfaces are truthful.

GUARDRAILS:
- No live SMS/email/SignWell/Stripe/calendar/provider actions without explicit approval.
- Stripe test mode only.
- Do not touch chrome-extension/content.js.
- Do not touch supabase/functions/live-queue-sync.
- Do not attach +19044383050.
- Do not touch docs/sparkle-suite/marketing unless Louis explicitly asks.
- Rep-facing assistant name is Nic-Nac.
```
