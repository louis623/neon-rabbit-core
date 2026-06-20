# Sparkle Finder Hardening And Habit Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Sparkle Finder's social/favorites/Nic-Nac foundation, then add a stronger daily collector habit loop across Library, Favorites, Collectors, Showcase, Live Shows, and Silver.

**Architecture:** Execute in two rails: first close launch/security/data consistency gaps, then layer product-retention UX on top of trusted persisted state. Keep Sparkle Finder's auth boundary independent, keep social features one-way and safety-bounded, and do not add customer-to-customer trading, DMs, marketplace, escrow, fulfillment, or paid-link shop flows.

**Tech Stack:** Next.js App Router, React 19, Supabase Postgres/RLS, Vercel AI SDK, Anthropic, Vitest, Playwright smoke tests, Browser/IAB rendered QA.

---

## Execution Rules

- Work in `C:\Users\louis\sparkle-finder-repo`, branch `codex-sparkle-finder-v1`.
- Keep `C:\Users\louis\sparkle-finder` as binder/planning only.
- Do not touch `C:\Users\louis\sparkle-finder-repo\supabase\.temp\`.
- Do not commit, push, deploy, or apply Supabase migrations unless Louis explicitly asks in that execution turn.
- Run `git status --short` before work and after each phase.
- Use subagents with disjoint ownership. No two workers should edit the same file set at the same time.
- Use TDD where practical: write/adjust focused tests before implementation, verify failing behavior when feasible, then implement and rerun.

---

## Phase 0: Preflight And Worktree Safety

**Owner:** Main agent

**Files:** None expected unless creating execution notes.

- [ ] Confirm current branch and dirty state.
  - Run: `git status --short`
  - Run: `git branch --show-current`
  - Expected: branch is `codex-sparkle-finder-v1`; expected social/favorites changes may be present; `supabase/.temp/` remains untouched.
- [ ] Read the latest audit context.
  - Review this plan.
  - Review recent audit findings in chat or binder if copied there.
- [ ] Decide execution mode with Louis.
  - Recommended: subagent-driven implementation with phase gates.
  - Alternative: inline execution by phase.

---

## Phase 1: Data Readback And Persistence Hardening

**Goal:** Ensure real Supabase writes for favorites/follows are read back into the UI, not only written then hidden behind fixtures.

**Recommended subagent:** Worker A, data services.

**Files:**
- Modify: `lib/sparkle-finder/favorite-reps-service.ts`
- Modify: `lib/sparkle-finder/collector-social-service.ts`
- Modify: `app/(hub)/favorites/page.tsx`
- Modify: `app/(hub)/silver/page.tsx`
- Modify: `app/(hub)/collectors/page.tsx`
- Test: `tests/sparkle-finder/favorite-reps-service.test.ts`
- Test: `tests/sparkle-finder/collector-social-service.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/smoke/sparkle-finder-social-favorites.spec.ts`

Steps:
- [ ] Add tests proving persisted favorite rows map into `FavoriteRepCard` with notes only for Silver.
- [ ] Add tests proving fixture fallback still works when Supabase is unavailable or local preview mode is active.
- [ ] Add tests proving persisted collector follows affect `isFollowedByViewer`, follower counts, and block suppression.
- [ ] Create Supabase read helpers that accept an injected client for tests and use fixture fallback only when configured.
- [ ] Update `/favorites` and `/silver` to use persisted favorite reads for real signed-in users.
- [ ] Update `/collectors` to combine persisted follows/blocks with public profile reads for real signed-in users.
- [ ] Rerun focused tests:
  - `npm exec vitest run tests/sparkle-finder/favorite-reps-service.test.ts tests/sparkle-finder/collector-social-service.test.ts tests/sparkle-finder/routes.test.ts`

Acceptance:
- A saved favorite/follow appears after revalidation in route-level tests.
- Free users cannot read Silver favorite notes.
- Local preview still renders fixture-backed data.

---

## Phase 2: Entitlement And Auth Boundary Hardening

**Goal:** Make every customer-facing action match Sparkle Finder membership boundaries.

**Recommended subagent:** Worker B, auth/entitlements.

**Files:**
- Modify: `app/api/finder/nic-nac/route.ts`
- Modify: `lib/sparkle-finder/entitlements.ts` only if shared helper needs extension
- Modify: `app/(hub)/favorites/actions.ts`
- Modify: `app/(hub)/collectors/actions.ts`
- Modify: `app/showcase/actions.ts`
- Test: `tests/sparkle-finder/finder-nic-nac-curator.test.ts`
- Test: `tests/sparkle-finder/auth-routes.test.ts`
- Test: `tests/sparkle-finder/showcase-actions.test.ts`
- Test: `tests/sparkle-finder/collector-social-actions.test.ts`

Steps:
- [ ] Add route/action tests for Free, anonymous, and Silver access on Nic-Nac.
- [ ] Enforce `getSparkleFinderAccountEntitlements(accountState).canUseNicNacFindRequests` in `app/api/finder/nic-nac/route.ts`.
- [ ] Confirm favorites behavior:
  - Free can save compact favorite reps within intended limits.
  - Silver can save notes/reminder metadata.
  - Anonymous cannot save.
- [ ] Confirm collector follows are available to signed-in accounts only and remain one-way.
- [ ] Add server-side checks that Showcase social actions honor collector block relationships.
- [ ] Rerun focused tests:
  - `npm exec vitest run tests/sparkle-finder/auth-routes.test.ts tests/sparkle-finder/collector-social-actions.test.ts tests/sparkle-finder/showcase-actions.test.ts tests/sparkle-finder/finder-nic-nac-curator.test.ts`

Acceptance:
- Free Nic-Nac API requests receive a non-streaming `403`.
- Silver Nic-Nac requests still stream.
- Blocking suppresses collector and Showcase social interactions consistently.

---

## Phase 3: Supabase Migration And RLS Hardening

**Goal:** Make migrations safe to apply and close RLS gaps before production.

**Recommended subagent:** Worker C, Supabase/RLS.

**Files:**
- Modify: `supabase/migrations/20260617_sparkle_finder_social_favorites.sql`
- Create or modify: a follow-up migration if changing already-created migration is not acceptable at execution time
- Test: `tests/sparkle-finder/collector-social-actions.test.ts`
- Test: `tests/sparkle-finder/showcase-service.test.ts` or new `tests/sparkle-finder/social-rls-schema.test.ts`

Steps:
- [ ] Add text/schema tests for migration idempotency:
  - trigger drops before trigger creates
  - helper functions are `security definer`
  - report table has no customer select grant
- [ ] Add a shared blocked-relationship DB helper or documented SQL pattern used by collector and Showcase policies.
- [ ] Tighten Showcase follow/comment/report policies to respect blocks in both directions.
- [ ] Decide whether public profile select requires both `showcase_visibility = 'public'` and `profile_visibility = 'sparkle_finder'`.
- [ ] Add indexes for common access patterns:
  - favorite reps by `user_id`
  - favorite rep details by `user_id`
  - collector follows by `follower_user_id`
  - collector follows by `followed_user_id`
  - collector blocks by both user columns
  - social reports by `reporter_user_id`, `target_type`, `target_id`
- [ ] Rerun migration text tests.

Acceptance:
- Migration is rerunnable or follow-up migration is safely additive.
- RLS policies prevent blocked users from following/commenting/reporting across both collector and Showcase systems.
- New indexes match known query paths.

---

## Phase 4: Trusted URL And External Link Safety

**Goal:** Prevent customer-controlled hidden form URLs from becoming unsafe external links.

**Recommended subagent:** Worker B or D, security/product boundary.

**Files:**
- Modify: `lib/sparkle-finder/favorite-reps-state.ts`
- Modify: `lib/sparkle-finder/route-hrefs.ts`
- Modify: `components/favorites/FavoriteRepHeartButton.tsx` only if hidden fields are removed or reduced
- Test: `tests/sparkle-finder/favorite-reps-server-actions.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`

Steps:
- [ ] Add tests rejecting or nulling `javascript:`, `data:`, non-http protocols, and unapproved hosts.
- [ ] Prefer deriving rep URLs from trusted rep IDs in server actions.
- [ ] If URL persistence remains necessary, allow only `https://` URLs from approved Sparkle Suite/Finder hostnames.
- [ ] Ensure local fixture URLs still map to local routes for smoke tests.
- [ ] Rerun focused tests:
  - `npm exec vitest run tests/sparkle-finder/favorite-reps-server-actions.test.ts tests/sparkle-finder/routes.test.ts`

Acceptance:
- Unsafe hidden form URLs cannot be stored or rendered.
- Rep links remain functional for trusted Suite/Finder paths.

---

## Phase 5: Today In Your Hunt Dashboard

**Goal:** Create the core habit loop: one screen that tells a member what changed and what to do next.

**Recommended subagent:** Worker D, UX dashboard.

**Files:**
- Create: `lib/sparkle-finder/today-hunt-service.ts`
- Create: `components/home/TodayInYourHunt.tsx`
- Modify: `components/home/AuthenticatedHomePage.tsx`
- Modify: `components/silver/SilverCollectorSpace.tsx` only if duplicated content should be reduced
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: `tests/smoke/sparkle-finder-home.spec.ts`

Dashboard sections:
- Favorite reps live soon
- Wishlist or looking-for pieces with rep board leads
- Followed collector updates
- Showcase completion tasks
- Nic-Nac primary CTA: “Ask Nic-Nac what changed”

Steps:
- [ ] Add route tests for authenticated Free and Silver home content.
- [ ] Build a pure service that returns a compact ordered list of “hunt tasks” from customer state, favorite reps, live shows, collector follows, and Showcase completion state.
- [ ] Add `TodayInYourHunt` with stable card/row dimensions, icon buttons, and direct links.
- [ ] Place it near the top of signed-in home.
- [ ] Make empty state useful:
  - “Favorite 3 reps”
  - “Add a wishlist piece”
  - “Follow public Showcases”
- [ ] Rerun route and smoke tests.

Acceptance:
- Signed-in home has a clear next-action loop.
- The component does not introduce marketplace/trading/DM copy.
- Mobile first viewport shows at least one meaningful next action.

---

## Phase 6: Mobile Navigation And App Shell Polish

**Goal:** Make the main app actions thumb-accessible and reduce friction on mobile.

**Recommended subagent:** Worker E, navigation/responsive UX.

**Files:**
- Modify: `components/layout/SparkleFinderNav.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: `tests/smoke/sparkle-finder-home.spec.ts`
- Smoke: `tests/smoke/sparkle-finder-social-favorites.spec.ts`

Steps:
- [ ] Add tests asserting primary mobile nav labels/links exist.
- [ ] Add sticky mobile bottom nav for:
  - Library
  - Live
  - Favorites
  - Nic-Nac / Showcase
  - Collectors
- [ ] Keep account/sign-out/legal in the existing menu/header.
- [ ] Add active-state styling without relying on client-side path hooks if a server-friendly pattern already exists.
- [ ] Verify no overlap with footer or page controls on mobile.

Acceptance:
- Mobile users can reach the core loop in one tap.
- No text overlap or clipped nav labels at 390px width.

---

## Phase 7: One-Tap Library Save Actions

**Goal:** Turn browsing into collection state quickly.

**Recommended subagent:** Worker F, Library/Silver actions.

**Files:**
- Modify: `components/library/JewelryCard.tsx`
- Modify: `app/(hub)/library/page.tsx`
- Modify: `app/(hub)/library/[itemId]/page.tsx`
- Reuse or modify: `app/(hub)/silver/actions.ts`
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: `tests/smoke/sparkle-finder-home.spec.ts`

Actions:
- Own this
- Wishlist / Hunt this
- Ask Nic-Nac
- View rep leads

Steps:
- [ ] Add route tests proving card actions render for Silver and upgrade cues render for non-Silver.
- [ ] Wire compact forms to existing Silver save actions when safe.
- [ ] Keep anonymous users routed to sign-in/trial.
- [ ] Keep grid cards stable with fixed action-row dimensions.
- [ ] Add empty-state links from no-results to “Ask Nic-Nac” and broader filters.

Acceptance:
- A member can move from library browse to saved owned/wishlist state without opening advanced Silver controls.
- Non-Silver sees clear upgrade/sign-in cues.

---

## Phase 8: Showcase Creation Flow Promotion

**Goal:** Make Showcase building feel core, not advanced.

**Recommended subagent:** Worker G, Showcase/Silver UX.

**Files:**
- Modify: `app/(hub)/silver/page.tsx`
- Modify: `components/showcase/ShowcaseManager.tsx`
- Possibly create: `components/showcase/ShowcaseQuickStart.tsx`
- Test: `tests/sparkle-finder/showcase-routes.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: `tests/smoke/sparkle-finder-showcase.spec.ts`

Steps:
- [ ] Add route tests for quick actions: add owned piece, add wishlist piece, submit missing piece.
- [ ] Move simple quick-start controls above the advanced details block.
- [ ] Keep profile editor and full manager in advanced controls.
- [ ] Add working anchor ids for any deep links used by CTAs.
- [ ] Remove or use unused local variables currently warned by lint in `ShowcaseManager.tsx`.

Acceptance:
- `/silver` first screen communicates “build your Showcase” clearly.
- Deep links land on real sections.
- Lint warnings in touched Showcase files are gone.

---

## Phase 9: CTA, Share, Reminder, And Empty-State Cleanup

**Goal:** Remove passive promises and make every CTA either do the thing or say exactly what it does.

**Recommended subagent:** Worker H, CTA/empty-state QA.

**Files:**
- Modify: `components/library/LibrarySearch.tsx`
- Modify: `components/showcase/SparkleShowcaseProfile.tsx`
- Modify: `components/showcase/RevealSpotlight.tsx`
- Modify: `components/live/LiveShowAgenda.tsx`
- Modify: `components/favorites/FavoriteRepsPanel.tsx`
- Modify: `components/social/CollectorSocialPanel.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: all smoke specs

Steps:
- [ ] Inventory all links/buttons with labels: Ask, Share, Reminder, Build, Add, Follow, Save.
- [ ] Add tests for key hrefs and visible labels.
- [ ] Make share actions use a safe copy/share client component or relabel as “Open share page” if copy/share is deferred.
- [ ] Make “Set reminder” either persist reminder intent or relabel as “Open live show.”
- [ ] Make `/silver?nic-nac=...` and anchors either consumed or replaced with working links.
- [ ] Upgrade empty states with two contextual actions each.

Acceptance:
- No CTA implies behavior that does not exist.
- Empty states create a next session instead of stopping the flow.

---

## Phase 10: Followed Collector Activity And Suggestions

**Goal:** Add social energy without DMs, friend requests, or trading.

**Recommended subagent:** Worker I, bounded social activity.

**Files:**
- Create: `lib/sparkle-finder/collector-activity-service.ts`
- Create: `components/social/CollectorActivityFeed.tsx`
- Modify: `app/(hub)/collectors/page.tsx`
- Modify: `components/showcase/SparkleShowcaseProfile.tsx` if adding recent reveals module
- Test: `tests/sparkle-finder/collector-social-service.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`
- Smoke: `tests/smoke/sparkle-finder-social-favorites.spec.ts`

Activity types:
- New public reveal from followed collector
- New Showcase Collection from followed collector
- Suggested collector with similar collection tags
- Public comment count summary, not a DM/message feed

Steps:
- [ ] Add service tests with blocked/private collector suppression.
- [ ] Build a read-only activity feed from safe public data.
- [ ] Add suggestions based on shared collection/type/label interests.
- [ ] Use copy guardrails on all visible text.

Acceptance:
- The page feels alive while staying one-way and public-showcase bounded.
- Blocked/private users do not appear.

---

## Phase 11: Nic-Nac Unification And Durable Actions

**Goal:** Make Nic-Nac feel like one consistent product brain.

**Recommended subagent:** Worker J, Nic-Nac integration.

**Files:**
- Modify: `components/nic-nac/FinderNicNacWorkspace.tsx`
- Modify: `components/nic-nac/FinderNicNacChatbot.tsx` or replace with shared shell
- Modify: `lib/sparkle-finder/nic-nac/tools.ts`
- Modify: `lib/sparkle-finder/nic-nac/prompt-builder.ts`
- Test: `tests/sparkle-finder/finder-nic-nac-curator.test.ts`
- Test: `tests/sparkle-finder/finder-nic-nac-prompt.test.ts`
- Smoke: relevant smoke specs

Steps:
- [ ] Add tests proving social/favorites tools return real persisted state where available.
- [ ] Replace scripted detail chatbot responses with the same bounded Nic-Nac shell where feasible.
- [ ] Make quick prompts create durable intents when supported:
  - saved hunt
  - favorite rep review
  - Showcase draft
  - missing-piece intake
- [ ] Keep all model prompts inside guardrails.

Acceptance:
- Nic-Nac behavior is consistent across Silver and item detail.
- Free accounts cannot call Silver-only model endpoints.

---

## Phase 12: QA, Accessibility, And Deployment Readiness

**Goal:** Prove the hardened build is ready before commit/deploy.

**Owner:** Main agent plus optional verification subagent.

Commands:
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run smoke:sparkle-finder`
- `git diff --check`
- Browser/IAB rendered QA for desktop and mobile

Required Browser flows:
- Anonymous landing to sign-up/sign-in
- Silver home with Today panel
- Silver Library card save to wishlist
- Favorites save/readback
- Collectors follow/readback/block suppression
- Showcase quick-start and public Showcase view
- Nic-Nac Free blocked, Silver allowed

Additional QA:
- Copy guardrails return no violations.
- No framework overlay.
- No relevant console errors.
- No clipped mobile nav.
- No customer-to-customer trading, DMs, marketplace, escrow, fulfillment, or affiliate shop resurfacing.
- Confirm no local server remains running after smoke.

Deployment gate:
- Migration committed and reviewed.
- Migration applied only after Louis explicitly approves.
- Supabase RLS smoke query run against intended environment.
- Vercel env verified.
- Paid Silver checkout flag intentionally configured.
- Dev alias smoke verified only if Louis asks to deploy.

---

## Suggested Subagent Split

- Worker A: favorites/follows persisted readback.
- Worker B: auth/entitlement/server-action hardening.
- Worker C: Supabase migration/RLS/index hardening.
- Worker D: Today dashboard and habit loop.
- Worker E: mobile nav and responsive shell.
- Worker F: Library one-tap save actions.
- Worker G: Showcase quick-start promotion.
- Worker H: CTA/share/reminder/empty-state cleanup.
- Worker I: collector activity and suggestions.
- Worker J: Nic-Nac unification and durable actions.
- Main agent: integration review, conflict resolution, final QA, and deployment readiness checklist.

---

## Recommended Build Order

1. Phase 1 through Phase 4 first. Do not build addictive/social layers on untrusted persistence or incomplete auth/RLS boundaries.
2. Phase 5 and Phase 6 next. These unlock the daily loop and mobile habit path.
3. Phase 7 through Phase 10 next. These make the product feel alive and easier to use.
4. Phase 11 after persistence and entitlement fixes are stable.
5. Phase 12 last, with fresh verification after all integration work.

---

## Definition Of Done

- Real persisted favorites/follows/blocks are visible in the app after save.
- Nic-Nac is Silver-gated at UI and API levels.
- Blocks suppress all relevant collector and Showcase interactions.
- Unsafe rep URLs cannot be stored or rendered.
- Migrations are safe, indexed, and ready for controlled application.
- Signed-in users get a clear “Today in your hunt” loop.
- Mobile users have thumb-accessible core navigation.
- Library cards allow quick save/hunt actions.
- Showcase creation is prominent and simple.
- Social activity remains one-way, public, and moderation-safe.
- Full tests, lint, build, smoke, Browser QA, and diff hygiene pass.

