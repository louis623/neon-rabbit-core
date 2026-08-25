# Sparkle Finder V1 Build Implementation Plan

> Superseded on 2026-06-13 for shop/affiliate scope. Current Sparkle Finder beta launch excludes shop, affiliate strip, paid links, product recommendation surfaces, live prices, copied reviews, ratings, and retailer imagery. Use `/photo-setup` for plain non-affiliate photo setup guidance.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sparkle Finder V1 as a secured customer discovery hub that closely matches the locked homepage concept image and can be smoke-tested by Louis after the agent/controller passes local build, route, and visual checks.

**Architecture:** Sparkle Finder should become a standalone Next.js/React/TypeScript app in this repo. Build it with fixture-backed service adapters first so the locked UI can be implemented quickly, then replace or extend those adapters with Supabase/read-through Sparkle Suite data integration. Keep canonical rep, calendar, trade-board/dance-floor, and jewelry library data owned by Sparkle Suite core; Sparkle Finder owns customer account, Silver profile, collection, watchlist, and customer-side Nic-Nac usage data.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Supabase SSR/client libraries, Vitest, Playwright, next/font with `Playfair Display` and `DM Sans`, and `lucide-react` for interface icons.

---

## Locked Target

The build target is the approved concept stored at:

- `docs/design/assets/sparkle-finder-locked-homepage-concept.png`
- `docs/design/2026-05-29-homepage-mockup-direction.md`

Final implementation should preserve:

- `SF` circular seal logo direction
- `Sparkle Finder by Sparkle Suite` brand lock
- warm Sparkle Suite palette, not Amethyst
- editorial discovery hub layout
- top navigation for Library, Live Shows, Rep Boards, Diamonds & Unicorns, Shop, and Account
- `Today across Sparkle Suite` agenda panel
- discovery cards for Master Live Calendar, Rep Trade Boards / Dance Floors, Master Jewelry Library, and Diamonds & Unicorns Library
- integrated `Silver Collector Space`
- Silver customer profile preview
- collection preview grid with `Owned`, `Wishlist`, and `Highlighted` states
- Nic-Nac `find this for me` module
- secondary affiliate/shop row for collector supplies and livestream gear

Generated mockup copy is not automatically production copy. Final copy must avoid buy/sell language, customer-to-customer trading promises, official Bomb Party partnership claims, and unlimited AI claims.

## Build Strategy

Use a three-session cap, with Session 1 delivering a visually credible app fast and Sessions 2-3 replacing mock behavior with real workflows.

Recommended execution mode:

- Use a fresh worktree or branch for the build session.
- Use subagent-driven-development with one implementation subagent per task group.
- The controller supervises, reviews, and keeps the locked image open as the visual target.
- Do not dispatch multiple implementation subagents to edit the same worktree at the same time.
- After each task group, run the task-specific tests, then a spec-compliance review, then a code-quality review.
- Commit after every task group that passes tests and review.

## Session Targets

### Session 1: Visual Foundation And Fixture-Backed Hub

Target outcome: a local Next.js app that visually matches the locked concept closely enough for design review, with fixture data powering every visible module.

Recommended batches:

1. Scaffold app/tooling.
2. Brand system and locked design shell.
3. Fixture data and typed service adapters.
4. Home/discovery hub page.
5. Desktop/mobile visual smoke tests.

Session 1 exit criteria:

- `npm run build` passes.
- `npm run test` passes.
- Playwright smoke opens the homepage at desktop and mobile sizes.
- Screenshot shows the locked layout: nav, hero, agenda panel, discovery cards, Silver Collector Space, profile preview, collection preview, Nic-Nac module, and affiliate row.
- The app contains no public copy that says buy/sell, marketplace, customer-to-customer trade, official Bomb Party partner, or unlimited AI.

### Session 2: Auth, Route Gating, And Discovery Data

Target outcome: customers can move from public landing into a secured hub, and the hub has working routes/search/filter behavior for reps, calendar, boards, library, and Diamonds & Unicorns.

Recommended batches:

1. Supabase/auth shell and local auth fallback.
2. Public versus logged-in route boundaries.
3. Rep directory and live calendar routes.
4. Aggregated rep board/dance-floor browser.
5. Master jewelry library and Diamonds & Unicorns routes.
6. Data integration adapter boundary.

Session 2 exit criteria:

- Public visitors see the landing/teaser.
- Useful hub routes redirect to sign-in or show the sign-in wall when unauthenticated.
- Authenticated fixture/local users can enter the hub.
- Manual search and filters work on fixture data.
- Known rep/show/library/board links route to the right screens.
- No customer-to-customer trade action exists.

### Session 3: Silver Collector Space, Nic-Nac Assist, Revenue Hooks, And Final QA

Target outcome: Silver value is functional enough to test, Nic-Nac assist has a bounded customer-facing workflow, and the app is ready for Louis smoke testing.

Recommended batches:

1. Silver entitlement model.
2. Customer profile and collection features.
3. Watchlist/saved searches and alerts scaffolding.
4. Nic-Nac `find this for me` workflow.
5. Affiliate/shop layer.
6. Final visual polish, accessibility pass, and smoke report.

Session 3 exit criteria:

- Silver users can view/edit a customer profile.
- Silver users can add existing library records to collection/watchlist states.
- Collection preview and profile preview update from application state.
- `Nic-Nac, find this for me` produces bounded match results from rep board/dance-floor and show fixture data or configured service data.
- Non-Silver users can browse normally but are prompted to upgrade for Silver profile/collection/Nic-Nac assist.
- Smoke report and screenshots are ready for Louis.

## File Map For Future Build

Create these app files during Session 1:

- `package.json`: app scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `postcss.config.mjs`: Tailwind v4 PostCSS config.
- `eslint.config.mjs`: Next/TypeScript lint config.
- `app/layout.tsx`: root layout, metadata, font loading.
- `app/globals.css`: Sparkle Finder brand tokens and global layout rules.
- `app/page.tsx`: public landing and locked homepage shell.
- `app/(hub)/layout.tsx`: authenticated hub layout shell.
- `app/(hub)/dashboard/page.tsx`: main discovery hub route.
- `app/(hub)/library/page.tsx`: master jewelry library route.
- `app/(hub)/library/[itemId]/page.tsx`: jewelry detail route with Nic-Nac entry point.
- `app/(hub)/diamonds-unicorns/page.tsx`: Diamonds & Unicorns filtered library route.
- `app/(hub)/live-shows/page.tsx`: master live calendar route.
- `app/(hub)/rep-boards/page.tsx`: aggregated rep board/dance-floor route.
- `app/(hub)/shop/page.tsx`: affiliate/shop route.
- `app/(hub)/silver/page.tsx`: Silver membership value and profile/collection entry route.
- `app/auth/sign-in/page.tsx`: sign-in route.
- `components/brand/SparkleFinderLogo.tsx`: reusable `SF` circular seal.
- `components/layout/SparkleFinderNav.tsx`: top navigation.
- `components/home/HeroAndAgenda.tsx`: hero and `Today across Sparkle Suite` panel.
- `components/home/DiscoveryCards.tsx`: live calendar, boards, library, Diamonds & Unicorns cards.
- `components/silver/SilverCollectorSpace.tsx`: Silver profile, collection, and Nic-Nac area.
- `components/library/LibrarySearch.tsx`: search/filter UI.
- `components/library/JewelryCard.tsx`: library item card.
- `components/live/LiveShowAgenda.tsx`: live show list.
- `components/boards/RepBoardGrid.tsx`: rep board/dance-floor browser.
- `components/shop/AffiliateStrip.tsx`: secondary shop row.
- `lib/fixtures/sparkle-finder-fixtures.ts`: deterministic fixture data.
- `lib/sparkle-finder/types.ts`: shared TypeScript types.
- `lib/sparkle-finder/service.ts`: fixture-backed service adapter contract.
- `lib/sparkle-finder/search.ts`: search/filter/matching helpers.
- `lib/sparkle-finder/entitlements.ts`: Free versus Silver permission helpers.
- `lib/sparkle-finder/copy-guardrails.ts`: disallowed-copy scanner.
- `tests/sparkle-finder/search.test.ts`: search/filter tests.
- `tests/sparkle-finder/entitlements.test.ts`: Free/Silver permission tests.
- `tests/sparkle-finder/copy-guardrails.test.ts`: copy guardrail tests.
- `tests/sparkle-finder/routes.test.ts`: route metadata and fixture route tests for the hub routes listed in this file.
- `tests/smoke/sparkle-finder-home.spec.ts`: Playwright visual smoke.
- `scripts/smoke-sparkle-finder.ts`: combined local smoke runner.
- `verification/sparkle-finder/`: screenshot and smoke-report output directory.

## Data Model For V1

Use these domain types in `lib/sparkle-finder/types.ts`:

- `RepSummary`: `id`, `businessName`, `displayName`, `avatarUrl`, `state`, `siteUrl`, `nextLiveShowId`.
- `LiveShow`: `id`, `repId`, `startsAt`, `durationMinutes`, `title`, `status`, `showUrl`.
- `JewelryItem`: `id`, `name`, `collectionName`, `jewelryType`, `imageUrl`, `bpLabel`, `itemNumber`, `knownRepListingIds`.
- `RepBoardListing`: `id`, `repId`, `jewelryItemId`, `status`, `listedAt`, `boardUrl`.
- `CustomerAccount`: `id`, `displayName`, `email`, `state`, `tier`.
- `SilverProfile`: `customerId`, `photoUrl`, `tiktokHandle`, `bio`, `visibility`.
- `CollectionItem`: `id`, `customerId`, `jewelryItemId`, `state`, `note`, `isHighlighted`.
- `NicNacFindRequest`: `customerId`, `jewelryItemId`, `createdAt`, `status`.
- `NicNacFindResult`: `requestId`, `repId`, `listingId`, `liveShowId`, `matchType`, `confidenceLabel`.

Use these string unions:

- `CustomerTier`: `free` or `silver`.
- `JewelryType`: `ring`, `earrings`, `necklace`, `bracelet`, `other`.
- `BombPartyLabel`: `diamond`, `unicorn`, or `standard`.
- `CollectionItemState`: `owned`, `wishlist`, or `private_note_only`.
- `ListingStatus`: `available`, `pending`, `unavailable`.
- `MatchType`: `exact_item`, `same_collection_type`, or `near_match`.

## Copy And Product Guardrails

The implementation must preserve these rules:

- Say `Rep Trade Boards / Dance Floors`, not a customer marketplace.
- Do not use buy/sell copy.
- Do not create customer-to-customer trade actions.
- Do not imply Sparkle Finder is officially affiliated with Bomb Party.
- Use `Diamonds & Unicorns Library` only for Bomb Party-provided labels; do not create rarity scores.
- Use `Silver Membership`, not Plus.
- Describe Nic-Nac as bounded assist, not unlimited AI.
- Use `Browse for free. Let Nic-Nac hunt for you with Silver.` as the core Silver value line where useful.

## Task Plan

### Task 1: Scaffold The Standalone App

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `.gitignore`

- [ ] Create the Next.js app structure directly in this repo.
- [ ] Match `neon-rabbit-core` dependency family unless the implementation session has a reason to pin newer patch versions.
- [ ] Install `lucide-react` for navigation and module icons.
- [ ] Add scripts: `dev`, `build`, `lint`, `test`, `smoke:sparkle-finder`.
- [ ] Load `Playfair Display` and `DM Sans` through `next/font/google`.
- [ ] Add a starter homepage that proves the app boots.
- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Commit with `chore: scaffold sparkle finder app`.

### Task 2: Implement Brand Tokens And Logo

**Files:**

- Modify: `app/globals.css`
- Create: `components/brand/SparkleFinderLogo.tsx`
- Create: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/copy-guardrails.test.ts`

- [ ] Add Sparkle Finder CSS tokens based on the Sparkle Suite design kit: warm background, paper surfaces, plum ink, blush accents, rose-pink borders, restrained shadows, and soft but not excessive radius.
- [ ] Build the `SF` circular seal as real HTML/CSS text, not an image-only logo.
- [ ] Build the top navigation with stable dimensions and accessible labels.
- [ ] Add copy guardrail test coverage for banned words and phrases.
- [ ] Run `npm run test -- tests/sparkle-finder/copy-guardrails.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add sparkle finder brand shell`.

### Task 3: Add Fixture Data And Service Adapters

**Files:**

- Create: `lib/fixtures/sparkle-finder-fixtures.ts`
- Create: `lib/sparkle-finder/types.ts`
- Create: `lib/sparkle-finder/service.ts`
- Create: `lib/sparkle-finder/search.ts`
- Test: `tests/sparkle-finder/search.test.ts`

- [ ] Define the V1 domain types from this plan.
- [ ] Create fixture reps, shows, jewelry items, board listings, a free customer, and a Silver customer.
- [ ] Include at least two diamond items and two unicorn items using Bomb Party labels.
- [ ] Implement fixture service functions for reps, live shows, board listings, jewelry items, Diamonds & Unicorns filtering, and matching a jewelry item to rep board listings.
- [ ] Implement search/filter helpers for collection, jewelry type, text search, Bomb Party label, and next-show context.
- [ ] Test exact match, same collection/type fallback, Diamonds & Unicorns filtering, and no-result behavior.
- [ ] Run `npm run test -- tests/sparkle-finder/search.test.ts`.
- [ ] Commit with `feat: add sparkle finder fixture data`.

### Task 4: Build Locked Homepage Shell

**Files:**

- Modify: `app/page.tsx`
- Create: `components/home/HeroAndAgenda.tsx`
- Create: `components/home/DiscoveryCards.tsx`
- Create: `components/live/LiveShowAgenda.tsx`
- Create: `components/shop/AffiliateStrip.tsx`

- [ ] Build the homepage first viewport to match the locked concept.
- [ ] Keep the hero and agenda in one strong first-viewport composition.
- [ ] Add discovery cards for live calendar, rep boards/dance floors, library, and Diamonds & Unicorns.
- [ ] Add the secondary affiliate strip with collector essentials and livestream gear.
- [ ] Replace generated mockup wording with approved v1 wording.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: build sparkle finder homepage shell`.

### Task 5: Build Silver Collector Space

**Files:**

- Create: `components/silver/SilverCollectorSpace.tsx`
- Create: `lib/sparkle-finder/entitlements.ts`
- Test: `tests/sparkle-finder/entitlements.test.ts`
- Modify: `app/page.tsx`

- [ ] Implement Free versus Silver entitlement helpers.
- [ ] Build the Silver Collector Space from fixture data.
- [ ] Show profile preview: avatar fallback, display name, state, TikTok handle, collection count, and wishlist/watchlist count.
- [ ] Show collection preview grid with owned, wishlist, and highlighted states.
- [ ] Add the Nic-Nac `find this for me` module as a bounded call-to-action.
- [ ] Test that Free users cannot use Silver-only profile/collection actions and Silver users can.
- [ ] Run `npm run test -- tests/sparkle-finder/entitlements.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add silver collector space`.

### Task 6: Add Core Hub Routes

**Files:**

- Create: `app/(hub)/layout.tsx`
- Create: `app/(hub)/dashboard/page.tsx`
- Create: `app/(hub)/library/page.tsx`
- Create: `app/(hub)/library/[itemId]/page.tsx`
- Create: `app/(hub)/diamonds-unicorns/page.tsx`
- Create: `app/(hub)/live-shows/page.tsx`
- Create: `app/(hub)/rep-boards/page.tsx`
- Create: `app/(hub)/shop/page.tsx`
- Create: `components/library/LibrarySearch.tsx`
- Create: `components/library/JewelryCard.tsx`
- Create: `components/boards/RepBoardGrid.tsx`

- [ ] Add hub layout using the same nav and brand shell.
- [ ] Build route pages from the same fixture-backed service adapter.
- [ ] Add library search/filter UI.
- [ ] Add Diamonds & Unicorns filtered route using Bomb Party labels only.
- [ ] Add rep board/dance-floor browser without any customer trade actions.
- [ ] Add item detail route with known rep availability and Nic-Nac CTA.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add sparkle finder discovery routes`.

### Task 7: Add Auth Boundary And Account States

**Files:**

- Create: `app/auth/sign-in/page.tsx`
- Create: `lib/sparkle-finder/auth.ts`
- Modify: `app/(hub)/layout.tsx`
- Modify: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/entitlements.test.ts`

- [ ] Add a local-dev auth adapter that can represent anonymous, free, and Silver users without needing production credentials.
- [ ] Add Supabase client/server auth boundary only after the local adapter is working.
- [ ] Gate useful hub routes behind a sign-in wall.
- [ ] Keep the public homepage visible.
- [ ] Show account/tier state in the nav.
- [ ] Test anonymous, free, and Silver account states.
- [ ] Run `npm run test -- tests/sparkle-finder/entitlements.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add sparkle finder auth boundary`.

### Task 8: Add Silver Profile And Collection Flows

**Files:**

- Create: `app/(hub)/silver/page.tsx`
- Create: `components/silver/ProfileEditor.tsx`
- Create: `components/silver/CollectionManager.tsx`
- Create: `lib/sparkle-finder/customer-state.ts`
- Test: `tests/sparkle-finder/entitlements.test.ts`

- [ ] Build Silver profile viewing/editing against local fixture/customer state.
- [ ] Build add-to-collection and add-to-watchlist actions for existing library records.
- [ ] Preserve states: `owned`, `wishlist`, `private_note_only`, plus `isHighlighted`.
- [ ] Keep uncataloged submission behind a disabled or explanatory future path unless separately approved.
- [ ] Test Free cannot save profile/collection state and Silver can.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add silver profile and collection flows`.

### Task 9: Add Nic-Nac Find-This-For-Me Flow

**Files:**

- Create: `components/nic-nac/FindThisForMe.tsx`
- Create: `lib/sparkle-finder/nic-nac.ts`
- Test: `tests/sparkle-finder/nic-nac-find.test.ts`
- Modify: `app/(hub)/library/[itemId]/page.tsx`
- Modify: `components/silver/SilverCollectorSpace.tsx`

- [ ] Implement a bounded fixture-backed Nic-Nac match flow.
- [ ] Return exact item matches first.
- [ ] Return same collection/type matches second.
- [ ] Include rep, board listing, rep site link, and next-show context.
- [ ] For Free users, show a Silver upgrade prompt instead of running the search.
- [ ] Do not add open-ended chat.
- [ ] Test exact match, fallback match, no match, and Free/Silver behavior.
- [ ] Run `npm run test -- tests/sparkle-finder/nic-nac-find.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit with `feat: add nic-nac find this for me flow`.

### Task 10: Add Smoke And Visual QA

**Files:**

- Create: `tests/smoke/sparkle-finder-home.spec.ts`
- Create: `scripts/smoke-sparkle-finder.ts`
- Create: `verification/sparkle-finder/.gitkeep`
- Modify: `package.json`

- [ ] Install `@playwright/test` as a dev dependency.
- [ ] Add smoke script that runs build, starts local server, opens desktop and mobile routes, and writes screenshots under `verification/sparkle-finder/`.
- [ ] Smoke desktop viewport: `1440x900`.
- [ ] Smoke mobile viewport: `390x844`.
- [ ] Assert visible text for `Sparkle Finder`, `Today across Sparkle Suite`, `Master Live Calendar`, `Rep Trade Boards / Dance Floors`, `Diamonds & Unicorns`, `Silver Collector Space`, and `Nic-Nac, find this for me`.
- [ ] Assert the page does not contain banned copy.
- [ ] Assert primary sections do not overlap by checking bounding boxes for nav, hero, agenda, discovery cards, Silver Collector Space, and affiliate strip.
- [ ] Run `npm run smoke:sparkle-finder`.
- [ ] Commit with `test: add sparkle finder smoke coverage`.

### Task 11: Final Polish And Louis Handoff

**Files:**

- Modify: files touched by visual polish only.
- Create: `verification/sparkle-finder/smoke-report.md`

- [ ] Compare the rendered desktop screenshot to the locked concept image.
- [ ] Adjust spacing, type scale, card widths, and responsive behavior until the page clearly matches the locked direction.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run smoke:sparkle-finder`.
- [ ] Write a smoke report with the local URL, commands run, pass/fail summary, screenshots, and known limitations.
- [ ] Commit with `chore: prepare sparkle finder smoke handoff`.

## Sub-Agent Workstream Guide

Use these subagent roles during the future build session:

- Controller: owns the plan, dispatches tasks, reviews outputs, runs final smoke, and decides when Louis should test.
- Scaffold subagent: Task 1.
- Brand/UI shell subagent: Tasks 2, 4, and 5.
- Data/service subagent: Task 3.
- Discovery route subagent: Task 6.
- Auth/account subagent: Task 7.
- Silver/Nic-Nac subagent: Tasks 8 and 9.
- QA/smoke subagent: Tasks 10 and 11.

Review sequence for every task:

1. Implementation subagent completes the task and runs listed tests.
2. Spec-compliance reviewer checks the task against this plan and the locked design doc.
3. Code-quality reviewer checks maintainability, accessibility, test coverage, and scope control.
4. Controller accepts only after both reviews pass.
5. Controller commits or verifies the task commit, then moves to the next task.

## Smoke-Test Checklist Before Louis Tests

The controller should not hand this to Louis until all items pass:

- Local app starts without console errors.
- Production build passes.
- Unit tests pass.
- Playwright desktop smoke passes.
- Playwright mobile smoke passes.
- Homepage is recognizably close to the locked image.
- No section text overlaps at desktop or mobile viewport.
- Nav stays usable on mobile.
- The `SF` seal renders crisply.
- The `Today across Sparkle Suite` panel is visible in the first viewport on desktop.
- Discovery cards use approved v1 language.
- Silver Collector Space contains profile preview, collection preview, and Nic-Nac module.
- Free/Silver gating behaves as expected.
- Diamonds & Unicorns uses only Bomb Party labels.
- No customer-to-customer trading UI exists.
- No buy/sell marketplace copy exists.
- Smoke screenshots and report are written under `verification/sparkle-finder/`.

## Louis Handoff Format

When the build session reaches handoff, final response should include:

- local URL
- latest commit hash
- commands run
- smoke result summary
- screenshot paths
- known limitations
- direct note that Louis can now smoke test

## New Session Start Prompt

Use this prompt when starting the build in a fresh session:

```text
We are ready to build Sparkle Finder V1. Do not redesign the product. Use the locked visual target at docs/design/assets/sparkle-finder-locked-homepage-concept.png and execute docs/superpowers/plans/2026-05-29-sparkle-finder-v1-build.md. Use subagent-driven development, one implementation task at a time, with spec-compliance and code-quality review after each task. Build in up to three major sessions: Session 1 visual fixture-backed hub, Session 2 auth and discovery routes, Session 3 Silver/Nic-Nac/polish/smoke. Stop only if blocked by credentials or a decision that cannot safely be assumed. Do not build customer-to-customer trading or buy/sell marketplace behavior.
```

## Planned Deferrals

Do not build these in the 1-3 session V1 unless Louis explicitly reopens scope:

- customer-to-customer trading
- buy/sell marketplace
- message board/social feed
- official Bomb Party integration claims
- rarity scoring beyond Bomb Party diamond/unicorn labels
- annual Silver plan
- Gold/Diamond memberships
- open-ended Nic-Nac chat
- SMS alerts before email alert behavior is proven
- full marketplace-style payments, escrow, shipping, or dispute mediation

## Self-Review Notes

Spec coverage:

- Locked logo/design/layout target is covered by Tasks 2, 4, 5, 10, and 11.
- Free secured discovery hub is covered by Tasks 4, 6, and 7.
- Rep directory/calendar/boards/library/Diamonds & Unicorns are covered by Tasks 3 and 6.
- Silver profile/collection/Nic-Nac value is covered by Tasks 5, 8, and 9.
- Smoke testing and Louis handoff are covered by Tasks 10 and 11.

Intentional sequencing:

- Build the visual app with fixtures first.
- Add auth/data boundaries second.
- Add Silver/Nic-Nac depth third.
- Keep final polish and smoke as a distinct gate before Louis tests.
