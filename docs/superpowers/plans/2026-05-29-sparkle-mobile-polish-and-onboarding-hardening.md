# Sparkle Mobile Polish And Onboarding Hardening Plan

> **For Louis:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Turn the May 29 landing/onboarding audit into batched implementation work that makes Sparkle Suite feel credible, premium, and mobile-first across the public landing page, self-serve account start, checkout/onboarding, legal pages, and Amethyst customer-facing previews.

**Production guardrail:** Do not deploy, push, promote, or change production routing. The post-launch/root landing remains local-only. Do not stage or commit without explicit Louis approval.

**Major UI Changes To Expect**

- Remove or hide buyer-facing broken Nic-Nac error states, issue/debug badges, and floating controls during checkout/onboarding purchase mode.
- Add a mobile-first landing header with one clear primary action, cleaner proof chips, a trust band, and a short "what happens after checkout" path.
- Change product mockup buttons/links that are not real actions into inert preview labels, or route only the true conversion CTAs to `/start`.
- Reframe `/start` as a premium account-start step with clearer no-card-yet/no-customer-actions reassurance.
- Split terms acceptance from optional/account email/update consent so legal agreement happens in the checkout review flow.
- Move unpaid Account/Billing into a focused checkout-review state before empty admin/billing history surfaces.
- Add polished fallback identity/maintenance behavior so Amethyst customer pages never expose `Show Name`, `Rep Name`, or raw placeholders.
- Tighten mobile tap targets, ticker clipping, checklist actions, Help & Resources first-start density, and legal-page return flow.

## Tasks

- [x] 1. Restore local route reliability before UI QA.
  - Files: `package.json`, `package-lock.json`, `lib/services/server-image-quality.ts`, affected tests.
  - Add `sharp` as an explicit runtime dependency if lockfile already expects it, or isolate the server image-quality import behind a safe optional server-only load if installation is not viable.
  - Add/adjust a focused test proving image-quality routes/modules do not crash when public/customer routes are loaded locally.
  - Verify: `npm exec vitest run tests/amethyst-homepage-template.test.ts tests/amethyst-trade-template.test.ts tests/amethyst-join-template.test.ts`, then load `http://localhost:3000/?angle=2` and one `/api/amethyst/*` route without a framework overlay.
  - QC: inspect for accidental client import of server-only image code.

- [x] 2. Polish the post-launch landing first impression for mobile and credibility.
  - Files: `app/_components/sparkle-suite-public-landing.tsx`, `app/globals.css`, `lib/sparkle-suite/public-landing-content.ts`, `tests/sparkle-suite-public-landing.test.ts`.
  - Add/modify tests for CTA labels/targets, trust-band copy, checkout path copy, and inert product-preview controls.
  - Implement mobile header: logo, one primary `/start` CTA, compact secondary navigation/treatment.
  - Rename scroll CTAs to literal labels such as `See pricing`; reserve `Start Sparkle Suite`/`Get Sparkle Suite` for `/start`.
  - Convert fake mockup actions into preview labels or controlled non-primary demo affordances.
  - Add early trust band: Stripe checkout, no customer texts/emails from checkout, cancel anytime, independent tool for reps.
  - Add concise "after checkout" sequence near pricing: create account, review plan/terms, pay in Stripe, unlock setup checklist, finish with Nic-Nac.
  - Verify desktop and `390x844` mobile with Browser screenshots, no horizontal overflow, no tiny first-viewport nav fragments.
  - QC: check palette balance, type scale, and that first mobile viewport has one obvious primary action.

- [x] 3. Reframe `/start` as a high-trust account-start step.
  - Files: `app/start/page.tsx`, `app/start/StartSparkleSuiteForm.tsx`, `app/start/start.module.css`, `tests/self-serve-start-page.test.ts`, `tests/self-serve-signup-route.test.ts`.
  - Add/modify tests for no-card-yet copy, no live customer/provider actions copy, Stripe review-before-payment copy, and separate operational updates vs terms agreement.
  - Keep terms acceptance in the checkout review flow; avoid making `/start` imply legal acceptance before the buyer can review terms.
  - Improve first mobile screen: reassurance, premium framing, tighter form entrance, larger checkbox/tap targets.
  - Verify `/start` at desktop and `390x844`; no horizontal overflow and form fields remain comfortable.
  - QC: confirm copy feels confident, not apologetic or prototype-like.

- [x] 4. Make purchase-mode Nic-Nac/Account screens feel finished.
  - Files: `app/nic-nac/components/DashboardPlaceholder.tsx`, `app/nic-nac/components/DashboardPlaceholder.module.css`, `app/nic-nac/_client.tsx`, `tests/nic-nac-dashboard-placeholder.test.ts`, `tests/nic-nac-paid-route-boundary.test.ts`, related account/billing tests if needed.
  - Add/modify tests that onboarding purchase mode does not render assistant-load errors, issue/debug badges, or floating controls over checkout content.
  - Put the Account/Billing checkout-review card first for unpaid onboarding; move empty `Subscription: Not set`, `No card on file`, and empty billing history below or hide until after checkout.
  - Add enough bottom padding/docking so any remaining mobile controls do not cover payment actions.
  - Verify `/nic-nac?section=account&onboarding=self-serve-started` on mobile and desktop.
  - QC: no buyer-facing words like `Couldn't load your conversation`, `Issue`, or debug-style badges in purchase mode.

- [x] 5. Turn setup/help into guided post-checkout onboarding.
  - Files: `app/nic-nac/components/DashboardPlaceholder.tsx`, `app/nic-nac/components/DashboardPlaceholder.module.css`, `tests/nic-nac-dashboard-placeholder.test.ts`.
  - Add/modify tests for locked/post-checkout setup states and progressive Help & Resources display.
  - Setup Checklist rows should show status, real action, disabled action, or clear post-checkout lock state instead of depending on `Ask Nic-Nac` when Nic-Nac may be unavailable.
  - Help & Resources should show a curated first-start `Choose your look` step with 3-4 recommended options before the full skin gallery.
  - Verify setup checklist and help/resources at mobile and desktop.
  - QC: first-start onboarding should read like a guided product, not an internal configuration browser.

- [x] 6. Polish legal-page mobile framing.
  - Files: `app/_components/SparkleLegalPage.tsx`, `app/terms-and-conditions/page.tsx`, `app/privacy-policy/page.tsx`, `tests/prelaunch/terms-and-conditions-page.test.ts`.
  - Add/modify tests for Sparkle Suite-first legal header, operator/developer truth, and `Back to checkout`/return label behavior.
  - Add a short plain-English summary above the legal body while preserving Neon Rabbit Digital Services as the legal operator.
  - Increase mobile tap targets for return/legal/footer controls.
  - Verify terms and privacy on mobile.
  - QC: legal should feel branded and calm, not like the buyer fell into a raw document.

- [x] 7. Harden Amethyst customer-facing mobile previews and fallback identity.
  - Files: `lib/amethyst/preview-rep.ts`, `public/amethyst/*.html`, `public/amethyst/*.jsx`, Amethyst template/API files, `tests/amethyst-*.test.ts`.
  - Add/modify tests proving no public-ready state emits `Show Name`, `Rep Name`, or raw placeholder labels when data/API health is degraded.
  - Use one polished demo identity for local previews, or show a branded maintenance/minimum-profile state.
  - Improve mobile nav tap targets, ticker clipping/accessibility, Trade scanning/filter affordances, and Unsubscribe checkbox/toggle rows.
  - Verify: `npm run qa:amethyst`, plus Browser mobile checks for Home, Trade, Join, and Unsubscribe.
  - QC: customer pages must look configured even when backing data is unavailable.

- [x] 8. Final cross-flow reinspection and report.
  - Re-run focused tests for all touched areas and `npx tsc --noEmit --pretty false` if changes touch shared TS contracts.
  - Browser inspect at `390x844` and desktop for:
    - `/?angle=2`
    - `/start`
    - `/nic-nac?section=account&onboarding=self-serve-started`
    - `/nic-nac?section=setup-checklist&onboarding=self-serve-started`
    - `/nic-nac?section=help-resources&onboarding=self-serve-started`
    - `/terms-and-conditions`
    - `/privacy-policy`
    - `/amethyst/Homepage.html`
    - `/amethyst/Trade.html`
    - `/amethyst/Join.html`
    - `/amethyst/Unsubscribe.html`
  - Update `docs/sparkle-suite/landing-page/mobile-polish-audit-2026-05-29.md` with resolved/open statuses.
  - Provide Louis a concise final report with completed fixes, screenshots/inspection notes, remaining risks, and any changes that need his product judgment.

## Sub-Agent Batching

- Batch A: route reliability/dependency blocker.
- Batch B: landing page polish.
- Batch C: `/start` copy, consent, and mobile form polish.
- Batch D: Nic-Nac purchase-mode account/setup/help surfaces.
- Batch E: legal pages.
- Batch F: Amethyst customer mobile/fallback polish.
- Batch G: final QA/reinspection.

Each implementation batch should get a fresh worker agent with an exact file/task scope. After each batch, run a spec-compliance review agent and a code-quality review agent before moving to the next batch. Avoid parallel workers on shared files such as `app/globals.css` and `DashboardPlaceholder.module.css`.

## Definition Of Done

- No Next.js framework overlays or missing-module crashes during local route QA.
- No buyer-facing debug badges, issue counters, raw assistant errors, or placeholder identity leaks.
- Mobile first viewport has one clear primary action and no wrapped desktop nav fragments.
- Public/customer routes have no horizontal overflow at `390x844`.
- Primary tap targets have at least a 44px hit area where practical.
- Checkout flow clearly explains account start, plan review, terms, Stripe handoff, renewal/cancel policy, and post-checkout unlock.
- Product mockups no longer look like dead interactive controls.
- Tests and Browser inspection cover both desktop and mobile for the audited flow.
