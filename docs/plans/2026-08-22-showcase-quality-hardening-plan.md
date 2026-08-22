# Sparkle Finder Showcase Quality Hardening Plan

**Date:** August 22, 2026  
**Status:** Approved direction; implementation not yet started  
**Goal:** Finish the collection and social-Showcase release to launch quality by closing the public-data privacy gap, repairing broken paths, improving phone-first owner controls, tightening copy and empty states, and making public Showcases resilient as usage grows.

## Outcome

After this plan is complete:

- private collection notes remain private at both the application and database layers;
- every public, private, unavailable, and preview Showcase path has a clear branded result;
- `Rarest Reveal` means an exceptional piece the collector owns, while rare Wishlist and ISO pieces are presented as finds they are hunting;
- Silver customers can comfortably manage a Showcase from a phone, including photos, collection membership, and destructive actions;
- customer copy describes benefits and next actions instead of implementation details;
- empty, loading, success, and failure states are explicit and recoverable;
- public Showcase reads remain bounded, block-aware, and responsive as collections and audiences grow;
- every release is independently tested, committed, pushed, deployed to `yoursparklefinder.com`, and smoke-tested before the next release begins.

## Non-negotiable boundaries

- Keep the July 3 A/B/C mobile app direction and Sparkle Suite Amethyst theme.
- Keep Sparkle Finder's auth boundary separate from Sparkle Suite and other products.
- Preserve existing stable database tables, route paths, API contracts, IDs, Nic-Nac tools, and integration identifiers unless an additive migration is required.
- Keep all collection, Showcase, comments, follows, reports, blocks, sharing, Nic-Nac, Reps, and Dance Floor capabilities.
- Do not add DMs, customer-to-customer trading, buying, selling, offers, checkout, or marketplace behavior.
- Keep `Dance Floor` and `dancers` as the approved visible trade vocabulary.
- Never use a customer account for mutating smoke tests unless Louis has explicitly designated it as the demo/smoke account.
- Production fixture fallback remains disabled.

## Release 1: Close the public-data privacy boundary

This release ships first and separately because it is the only must-fix item before customers publish Showcases.

### 1.1 Add an additive RLS and grants migration

Create a new migration; do not edit or replay historical migrations.

The migration should:

1. Drop and recreate the raw public collection-item SELECT policy so a piece is publicly eligible only when all conditions are true:
   - the owner profile has `profile_visibility = 'sparkle_finder'`;
   - the owner has `showcase_visibility = 'public'`;
   - the item has `visibility = 'public'`;
   - the collection-item `state` is not `private_note_only`;
   - the `showcase_status` is not `private_note_only`.
2. Limit the raw public collection-item policy to `anon`. Authenticated customers should read their own rows through the existing owner policy; public Showcase pages should continue through the server-owned, allowlisted public read service.
3. Revoke the historical table-wide authenticated SELECT grant on `sparkle_finder_collection_items`, then regrant only the columns required by authenticated owner workflows. Keeping the public policy off the authenticated role prevents the owner's `note` privilege from becoming a way to read another collector's public-row note.
4. Recreate public Showcase Collection and join policies with the same profile, Showcase, collection, piece-visibility, and private-only checks.
5. Recreate public comment read/insert target checks so a piece comment cannot remain reachable after its target piece or profile becomes private/private-note-only.
6. Recheck follow and report policies against public profile visibility and either-direction blocks. Keep writes authenticated and owner/viewer scoped.
7. Replace repeated `auth.uid()` calls in touched policies with `(select auth.uid())` and confirm indexes exist for every RLS join/filter column used by the new policies.
8. Revoke `EXECUTE` on `public.rls_auto_enable()` from `PUBLIC`, `anon`, and `authenticated`; retain only the role that needs the event-trigger helper.

Likely files:

- new `supabase/migrations/20260822xxxxxx_sparkle_finder_showcase_public_read_hardening.sql`
- `tests/sparkle-finder/showcase-social-boundaries.test.ts`
- a focused SQL/RLS verification script or test fixture under the existing test structure

### 1.2 Keep application reads allowlisted and fail closed

- Keep `note`, acquisition details, email, consent fields, and other private account fields out of public service selects and return types.
- Make the public service reject rows that fail the same profile, visibility, state, and status checks even when it is using an admin/service client that bypasses RLS.
- Ensure public metadata and Open Graph generation use the same service result, not a broader query.
- Add a regression guard that fails if `note` is added to the public piece column list or serialized public Showcase shape.

Likely files:

- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/showcase-types.ts`
- `lib/sparkle-finder/showcase-metadata.ts`
- `tests/sparkle-finder/showcase-service.test.ts`
- `tests/sparkle-finder/showcase-metadata.test.ts`

### 1.3 Privacy acceptance matrix

Test the migration and service as:

| Viewer | Owner/piece state | Expected result |
|---|---|---|
| Anonymous | Public profile + public Showcase + public owned piece | Safe display fields only |
| Anonymous | Private profile or private Showcase | No rows / Not Found |
| Anonymous | Public `private_note_only` piece | No row |
| Signed-in owner | Own private piece and note | Owner can read and edit it |
| Signed-in other customer | Another collector's public piece | Public page works; raw private note cannot be selected |
| Either-direction blocked customer | Otherwise-public Showcase | No Showcase, piece, comment, follow, or interaction result |

Before deployment, repeat the live count-only check for public pieces, public pieces with notes, and contradictory visibility/status rows. After the migration, verify those counts and direct role behavior again.

### Release 1 gate

- Focused policy/service/privacy tests pass.
- `supabase db push --yes` applies only the intended additive migration and then reports the remote database is current.
- Anonymous, owner, unrelated authenticated, and blocked-user probes match the matrix.
- Full lint, tests, build, and smoke pass.
- Commit, push, deploy, verify Vercel Ready, alias to `https://yoursparklefinder.com`, and inspect recent production errors before Release 2.

## Release 2: Repair broken routes and make Showcase meaning accurate

### 2.1 Fix preview and unavailable states

- Show the owner `Preview` action only when the Showcase is actually public, or add a separately authenticated owner-preview mode that cannot be shared or indexed. The simpler initial implementation is to hide the public link and show `Publish your Showcase to preview the public page.`
- Add a branded `app/not-found.tsx` that explains that a Showcase may be private, unavailable, or mistyped and offers safe paths back to Sparkle Finder, Collectors, and sign-in.
- Ensure public Showcase routes use `noindex` for unavailable/private results and never echo a private handle, profile, or piece into metadata.
- Repair the `celeste-stacks` fixture mismatch: either provide a complete local public Showcase fixture for every directory fixture that exposes `View Showcase`, or suppress the link when no fixture Showcase exists. Production must continue to use persisted data only.

Likely files:

- `components/showcase/ShowcaseOwnerPanel.tsx`
- new `app/not-found.tsx`
- `app/showcase/[handle]/page.tsx`
- `app/showcase/[handle]/pieces/[pieceId]/page.tsx`
- `app/showcase/[handle]/showcase-collections/[collectionSlug]/page.tsx`
- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/collector-social-service.ts`
- Showcase route, owner-panel, collector, and smoke tests

### 2.2 Correct `Rarest Reveal` semantics

Use this invariant throughout UI, counts, services, fixtures, metadata, and Nic-Nac:

> A Rarest Reveal is an owned piece that is a Diamond, Unicorn, or an owner-selected exceptional reveal.

- Require `showcaseStatus === 'owned'` before a piece can enter `rarestReveals` or increment the public rare-reveal count.
- Disable or hide the `Mark as a Rarest Reveal` checkbox for Wishlist, ISO, and private-note-only statuses.
- Validate the invariant inside the server action, not only in the component.
- If an owned piece is changed to Wishlist/ISO/private-note-only, stop displaying it as a Rarest Reveal. Preserve historical intent only if doing so cannot leak or mislabel it.
- Present Diamond/Unicorn Wishlist and ISO pieces under ordinary public pieces with a customer-friendly cue such as `Rare find I'm hunting`, not under `The Rarest of Reveals`.
- Update fixture data so preview counts and stories demonstrate the approved meaning.

Likely files:

- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/collector-social-service.ts`
- `components/showcase/RarestReveals.tsx`
- `components/showcase/ShowcaseBadges.tsx`
- `components/showcase/ShowcaseOwnerPanel.tsx`
- `app/(hub)/silver/showcase-owner-actions.ts`
- `lib/sparkle-finder/nic-nac/tools.ts`
- fixture, service, owner-action, Nic-Nac, and copy tests

### Release 2 gate

- Private-owner preview never lands on a generic 404.
- Missing/private links render the branded unavailable state without leaking data.
- Every visible rare count is owned-only.
- A Wishlist Diamond/Unicorn remains discoverable but is clearly described as something the customer is hunting.
- Route, metadata, fixture, owner-action, Nic-Nac, full-suite, build, and browser smoke checks pass before commit/push/deploy.

## Release 3: Make Showcase management excellent on a phone

### 3.1 Repair the handle control

- Put the editable handle in a full-width field.
- Move `yoursparklefinder.com/showcase/` to a short helper/example line below or above the field rather than an unbreakable inline prefix.
- Keep lowercase/slug validation, character limits, uniqueness feedback, and a readable final URL preview.
- Test at 320px, 390px, and desktop widths with long valid handles and browser text zoom.

### 3.2 Make destructive actions safe and understandable

- Replace one-tap `Remove collection` with an accessible confirmation dialog or two-step confirmation.
- Name the collection in the prompt and clearly say that the pieces remain in the customer's Bling Vault.
- Disable repeat submission while pending and return visible success/failure text through the existing action-state pattern.

### 3.3 Complete personal-photo management

- Show the current personal photo or canonical fallback before the upload control.
- Let the owner replace or explicitly remove their personal photo.
- Validate ownership, MIME type, size, and storage path inside the server action.
- Remove only the owner-controlled personal photo; never alter the catalog image.
- Give uploads/removals pending, success, error, and retry states.

### 3.4 Make Showcase Collection membership visible

- Pass current collection membership into the piece editor.
- Show checked/selected membership instead of a context-free `Choose a collection` menu.
- Allow add/remove without guessing which collection already contains the piece.
- Keep all assignment actions owner-scoped and validate both the collection and piece belong to the signed-in owner.

### 3.5 Improve editor discoverability and accessibility

- Add a visible chevron and `aria-expanded` behavior to each piece editor summary while retaining the native `<details>` semantics.
- Keep touch targets at least 44px, visible focus states, real labels, and live status announcements.
- Ensure the opened editor scrolls into a comfortable phone position and does not introduce horizontal overflow.

Likely files:

- `components/showcase/ShowcaseOwnerPanel.tsx`
- focused new owner components under `components/showcase/` if splitting keeps the panel readable
- `app/(hub)/silver/showcase-owner-actions.ts`
- `app/(hub)/silver/actions.ts`
- `lib/sparkle-finder/showcase-actions.ts`
- owner-panel, action, persistence, upload, accessibility, and smoke tests

### Release 3 gate

- A designated demo owner can publish/unpublish, edit a handle, upload/remove a personal photo, create/delete a Showcase Collection, and add/remove a piece at 390px without ambiguity or overflow.
- Destructive actions require confirmation and explain their effect.
- Refresh and reauthentication preserve the correct result.
- No server action trusts a client-supplied owner ID.
- Full verification and production deployment complete before Release 4.

## Release 4: Polish customer copy, empty states, and action feedback

### 4.1 Replace implementation-focused copy

Use natural customer-benefit wording, then run the existing terminology guardrails again. Proposed direction:

| Current copy | Direction |
|---|---|
| `Find public Sparkle Showcase profiles, follow one-way shortcuts...` | `Discover public Sparkle Showcases, follow collectors you love, and keep your safety controls close.` |
| `A small, newest-first look...` | `See the newest public pieces shared by collectors you follow.` |
| `return to it from this compact view` | `Their newest public pieces will appear here.` |
| `Your collection, loaded as you scroll.` | `Your collection, all in one place.` |
| `focused Nic-Nac requests` | `personalized help from Nic-Nac` |

Copy review scope includes UI, auth, metadata, social descriptions, empty/error/success states, accessibility labels, Nic-Nac prompts/tool responses, and customer-facing tests.

### 4.2 Consolidate public Showcase empty states

- Do not render empty headings and grids for Rarest Reveals, Showcase Collections, or public pieces.
- If the public Showcase contains no eligible pieces, show one warm, honest state such as `This Showcase is ready for its first public piece.`
- If only one section has content, let that section carry the page without empty neighboring modules.
- Keep owner-only setup guidance in the Silver management surface, not on the anonymous public page.

### 4.3 Make actions resilient and communicative

- Change `makeHeroPiece` from silent returns to a typed action result with authenticated/authorized validation and explicit success/failure messaging.
- Give Hero Piece controls a pending state, disable repeat submission, and announce the result.
- Change Bling Vault page loading to a discriminated success/error result or throw a handled error; never turn a backend failure into an apparently empty collection.
- Use `try/catch/finally` or the existing action-state/transition pattern so loading cannot remain stuck after failure or a superseded request.
- Add a visible retry action that preserves the selected filter.
- Ensure stale filter responses cannot overwrite the latest request and that aborted/superseded requests clear pending state correctly.

### 4.4 Remove visible scrollbar chrome without harming scrolling

- Add a reusable, tested scrollbar-hiding utility for the Wishlist and filter rails.
- Preserve touch, wheel/trackpad, keyboard, snap, focus visibility, and desktop grid behavior.
- Verify Windows Chrome, phone-width Chrome emulation, and 200% zoom.

Likely files:

- `app/(hub)/collectors/page.tsx`
- `components/social/FollowedShowcases.tsx`
- `components/home/BlingVaultMosaic.tsx`
- `components/home/WishlistRail.tsx`
- `components/showcase/RarestReveals.tsx`
- `components/showcase/ShowcaseCollectionRail.tsx`
- `components/showcase/ShowcasePieceGrid.tsx`
- `app/actions/hero-piece.ts`
- `app/actions/bling-vault.ts`
- Hero Piece components and auth pages
- shared CSS only if the scrollbar utility does not already exist
- copy, action, empty-state, error-state, and rendered smoke tests

### Release 4 gate

- New, sparse, and large collections all have clear customer-facing states.
- Hero and Bling Vault failures are visible and recoverable.
- No loading state can remain stuck after an exception or superseded request.
- No banned Dance Floor terminology is reintroduced.
- 320px/390px, desktop, keyboard, focus, and zoom checks pass before deployment.

## Release 5: Bound public reads and close the remaining social safety gap

### 5.1 Remove unbounded and N+1 Showcase reads

- Keep initial public piece, Showcase Collection, and comment payloads bounded.
- Use cursor/keyset pagination for deeper public piece/comment loads; do not introduce deep OFFSET pagination.
- Replace follower/following row downloads used only for counts with bounded count queries. Query the viewer's follow relationship separately.
- Fetch Showcase Collection joins for all visible collections in one batch rather than one query per collection.
- Fetch comment-author public profiles in one batched query rather than one query per author.
- Batch or memoize catalog lookups and use per-request `React.cache()` only where it cannot cross user/privacy boundaries.
- Run independent safe reads concurrently, but do not start public child reads until the profile and block boundary has passed.
- Minimize fields serialized across server/client boundaries.
- Add/verify composite or partial indexes only after checking the real query predicates and `EXPLAIN` output.

Initial caps should be conservative and explicit, for example:

- 24 public pieces on the first Showcase page;
- 12 public Showcase Collections;
- 20 most recent permitted comments;
- existing bounded six-visible/twelve-maximum followed highlights.

Exact limits should be constants with tests, not scattered magic numbers.

### 5.2 Respect blocks between the viewer and comment authors

- In addition to owner-related blocks, load the signed-in viewer's relevant block relationships before returning comments.
- Suppress comments and interaction controls when the viewer has blocked the author or the author has blocked the viewer.
- Keep anonymous behavior unchanged except for owner-related blocks and deleted/private target filtering.
- Apply the same rule to Reveal Spotlight and Showcase Collection pages.

Likely files:

- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/collector-social-service.ts`
- public Showcase route components/actions
- optional additive query/index migration if measurement shows it is needed
- service, block-boundary, pagination, query-count, and large-fixture tests

### Release 5 gate

- Large-fixture tests prove bounded initial payloads and stable ordering.
- Query-count tests or instrumented fakes prove collection joins and author profiles are batched.
- A blocked commenter is absent for the affected viewer on every public Showcase route.
- First-page metadata and share previews still use the correct public Hero/cover data.
- Full release verification and production deployment pass.

## Final launch-readiness pass

After all five releases:

1. Enable Supabase leaked-password protection in the Auth dashboard and record the setting. This is configuration work, not an application-code migration.
2. Run Supabase security and performance advisors again. Triage expected SECURITY DEFINER functions separately from actionable privilege/RLS warnings; do not treat every advisor warning as a vulnerability.
3. Confirm there are no public rows containing private-only state/status and no way for `anon` or an unrelated authenticated customer to select `note`.
4. Run one signed-in production pass with Louis's designated demo account and intentionally exercise:
   - Hero Piece save;
   - Showcase publish and unpublish;
   - public/private piece changes;
   - reveal-story save;
   - personal-photo upload and removal;
   - Showcase Collection creation, assignment, removal, and deletion confirmation;
   - public Showcase, Reveal Spotlight, collection, follow, comment, block, and share controls.
5. Verify the same results logged out, as an unrelated signed-in viewer, and across an either-direction block.
6. Check live metadata/Open Graph URLs, Google Auth return behavior, Vercel production logs, recent errors, and canonical-domain routing.
7. Repeat the complete customer-copy terminology scan and visually review 320px, 390px, tablet, and desktop screenshots.

## Required verification for every implementation release

- Focused tests are written or updated before relying on a manual smoke.
- `npm run lint`
- focused Vitest files for the changed boundary
- full `npm run test`
- `npm run build`
- `git diff --check`
- `npm run smoke:sparkle-finder`
- rendered phone and desktop checks for changed states
- keyboard/focus/labels/live-region check for changed controls
- Supabase role/migration verification when SQL changes
- Vercel deployment reaches `READY`
- custom-domain route checks at `https://yoursparklefinder.com`
- recent production error-log check

## Commit and deployment sequence

Use one scoped commit and deployment per release:

1. `fix: harden public Showcase privacy boundaries`
2. `fix: repair Showcase routes and rare-reveal meaning`
3. `feat: polish mobile Showcase management`
4. `fix: refine collection copy states and feedback`
5. `perf: bound public Showcase social reads`

Do not begin the next release until the current deployment is live on the custom domain and its release gate passes. If a release fails after deployment, roll back the application deployment while preserving additive database compatibility, diagnose, and redeploy a forward fix rather than rewriting applied migration history.

## Explicitly deferred

- New social-network features, DMs, reactions, friend requests, or an endless feed.
- Customer-to-customer buying, selling, trading, offers, or marketplace behavior.
- Major navigation or brand redesign.
- Public acquisition-source details or private collection notes.
- Schema rewrites when an additive policy, index, or helper can safely solve the problem.

