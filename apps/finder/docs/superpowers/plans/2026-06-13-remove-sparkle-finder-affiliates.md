# Remove Sparkle Finder Affiliates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove affiliate monetization and shop positioning from Sparkle Finder while preserving helpful non-paid light-box setup guidance for Silver members and Showcase Studio.

**Architecture:** Delete the public shop and affiliate disclosure surfaces, remove affiliate data/types/services/components, and replace shop references with trust-first Showcase Studio photo setup guidance. Legal, smoke tests, and docs should describe third-party links as optional external resources, not revenue surfaces.

**Tech Stack:** Next.js App Router, React/TSX, Vitest route tests, Playwright smoke tests, static docs.

---

## Current State

- Active implementation repo: `C:\Users\louis\sparkle-finder-repo`
- Branch: `codex-sparkle-finder-v1`
- Git status at plan time: clean except expected `supabase/.temp/`
- Binder note location: `C:\Users\louis\sparkle-finder\docs\superpowers\plans\2026-06-13-remove-sparkle-finder-affiliates.md`

## Product Decision

Sparkle Finder should not have an affiliate shop for now. The light-box recommendation should become plain, helpful setup guidance:

> This is the photo box Sparkle Suite reps use, but you do not need this exact one. Any clean, well-lit light box that shows the jewelry clearly can work.

The Amazon link may remain only as a normal external resource link, not a paid link, not a sponsored link, and not part of a shop.

## Files To Remove Or Retire

- Delete route: `C:\Users\louis\sparkle-finder-repo\app\shop\page.tsx`
- Delete route: `C:\Users\louis\sparkle-finder-repo\app\affiliate-disclosure\page.tsx`
- Delete component: `C:\Users\louis\sparkle-finder-repo\components\shop\AffiliateStrip.tsx`
- Delete copy module if no longer referenced: `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\affiliate-copy.ts`
- Retire docs folder content or move to archived notes: `C:\Users\louis\sparkle-finder-repo\docs\affiliate\`

## Files To Modify

- `C:\Users\louis\sparkle-finder-repo\components\layout\SparkleFinderNav.tsx`
  Remove `Shop` from desktop and mobile navigation.
- `C:\Users\louis\sparkle-finder-repo\components\layout\SparkleFinderFooter.tsx`
  Remove `Affiliate Disclosure` footer link.
- `C:\Users\louis\sparkle-finder-repo\components\home\AuthenticatedHomePage.tsx`
  Remove `AffiliateStrip` import, `getAffiliateShopItems`, and the strip render.
- `C:\Users\louis\sparkle-finder-repo\components\home\PublicLandingFeatureCards.tsx`
  Replace `Collector & Rep Essentials` card with a product-native feature, likely `Showcase Studio` or `Photo-ready uploads`.
- `C:\Users\louis\sparkle-finder-repo\lib\fixtures\sparkle-finder-fixtures.ts`
  Remove affiliate shop fixtures and affiliate product recommendation fixtures.
- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\service.ts`
  Remove `getAffiliateShopItems()` and `getAffiliateProductRecommendations()`.
- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\types.ts`
  Remove `AffiliateShopItem` and `AffiliateProductRecommendation`.
- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\showcase-studio.ts`
  Replace `lightBoxHelpHref = "/shop#collector-photo"` with a new setup-guide route or a neutral in-app anchor.
- `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\legal-content.ts`
  Remove affiliate/shop privacy and terms sections; keep generic third-party links/product guidance language.
- `C:\Users\louis\sparkle-finder-repo\README.md`
  Remove affiliate/shop layer from product direction and Start Here docs.
- `C:\Users\louis\sparkle-finder-repo\public\sparkle-finder-smoke-test.html`
  Remove manual shop/affiliate smoke steps.
- `C:\Users\louis\sparkle-finder-repo\app\globals.css`
  Remove unused `.sparkle-shop*` styles after the route/component deletion.

## Task 1: Lock The Desired Behavior In Tests

- [ ] Update `tests\sparkle-finder\routes.test.ts` so footer/nav/home assertions expect no `/shop` or `/affiliate-disclosure` links.
- [ ] Remove route render cases for `ShopPage` and `AffiliateDisclosurePage`.
- [ ] Replace shop tests with one focused assertion that the public landing promotes Showcase Studio or photo-ready uploads without affiliate language.
- [ ] Update `tests\sparkle-finder\showcase-studio.test.ts` so photo rejection help points to the new non-shop guidance destination.
- [ ] Update `tests\smoke\sparkle-finder-home.spec.ts` so smoke checks no longer require the shop card or `/shop`.
- [ ] Keep copy guardrails that prevent arbitrary `amzn.to` affiliate URLs, but revise allowed-copy examples to remove Amazon Associate language.

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/showcase-studio.test.ts tests/sparkle-finder/copy-guardrails.test.ts
```

Expected before implementation: failures showing the remaining shop/affiliate assumptions.

## Task 2: Remove Affiliate Routes, Components, Data, And Styles

- [ ] Delete `app\shop\page.tsx`.
- [ ] Delete `app\affiliate-disclosure\page.tsx`.
- [ ] Delete `components\shop\AffiliateStrip.tsx`.
- [ ] Delete `lib\sparkle-finder\affiliate-copy.ts`.
- [ ] Remove affiliate fixtures from `lib\fixtures\sparkle-finder-fixtures.ts`.
- [ ] Remove affiliate service exports from `lib\sparkle-finder\service.ts`.
- [ ] Remove affiliate types from `lib\sparkle-finder\types.ts`.
- [ ] Remove `.sparkle-shop*` CSS from `app\globals.css`.

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected after implementation: route tests pass without deleted imports.

## Task 3: Replace Shop With Photo Setup Guidance

- [ ] Choose the route name during implementation. Recommended: `/photo-setup` if public, or a section inside `/silver` if it should feel member-focused.
- [ ] Add copy that says the light box is optional and any clean, well-lit photo box can work.
- [ ] Include the regular Amazon product link only if Louis still wants it visible.
- [ ] Use `rel="noopener noreferrer"` and `target="_blank"` for the Amazon link.
- [ ] Do not use `rel="sponsored"`, "paid link", "affiliate", "commission", or Amazon Associate disclosure copy.
- [ ] Update `lib\sparkle-finder\showcase-studio.ts` to point photo rejection help to the new guidance.

Suggested customer-facing copy:

```text
Sparkle Suite reps use this compact photo box for jewelry photos, but you do not need this exact one. Any clean, well-lit light box that shows the label evidence and jewelry clearly can work.
```

## Task 4: Update Legal, Docs, And Smoke Assets

- [ ] In `lib\sparkle-finder\legal-content.ts`, remove affiliate/shop sections from privacy and terms.
- [ ] Add or retain generic third-party language: Sparkle Finder may link to external retailer resources for convenience, but does not sell, ship, warrant, or guarantee those products.
- [ ] Update `README.md` to remove affiliate/shop as a revenue layer.
- [ ] Move `docs\affiliate\` to an archive location or remove it from the active repo if Louis wants a hard cleanup.
- [ ] Update `docs\context\open-brain-findings.md` and `docs\decisions\current-assumptions.md` to record the new decision.
- [ ] Update `public\sparkle-finder-smoke-test.html` to remove shop manual tests and add a light-box/photo-setup check.

## Task 5: Verify The Whole Site

- [ ] Run focused tests.
- [ ] Run full tests.
- [ ] Run production build.
- [ ] Start local preview at `http://127.0.0.1:4310/`.
- [ ] Smoke public home, signed-in hub, Silver, Showcase Studio photo rejection guidance, legal pages, and `/shop` no longer being part of the navigation.
- [ ] Confirm repo status only includes expected implementation changes plus pre-existing `supabase/.temp/`.

Commands:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/showcase-studio.test.ts tests/sparkle-finder/copy-guardrails.test.ts
npm run test
npm run build
```

## Deployment Plan

Only after Louis asks to ship:

- [ ] Commit with a message like `refactor: remove Sparkle Finder affiliate shop`.
- [ ] Push `codex-sparkle-finder-v1`.
- [ ] Deploy with Vercel.
- [ ] Smoke the deployed `/`, `/silver`, `/privacy-policy`, `/terms-and-conditions`, and the new photo setup guidance.
- [ ] Confirm `/shop` and `/affiliate-disclosure` are not promoted anywhere. Decide whether they should return 404 or redirect to the new guidance.

## Open Decision

One product decision remains before implementation:

- Should the plain Amazon light-box link live on a public `/photo-setup` page, or only inside signed-in Silver/Showcase Studio guidance?

Recommendation: put the polished guidance inside Silver/Showcase Studio first, and add a small public `/photo-setup` route only if we need an easy support link for rejected photo uploads.
