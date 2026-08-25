# Sparkle Finder Collection and Showcase Value Plan

**Date:** August 22, 2026  
**Status:** Proposed for Louis's review  
**Goal:** Make a collector's real collection easier to build, more visually impressive, genuinely shareable, and socially discoverable without adding customer-to-customer trading, DMs, buying, selling, or marketplace behavior.

## Product outcome

The Collection tab should feel like a personal jewelry showroom, not a database. A customer should be able to:

1. Build a real public Sparkle Showcase from their persisted collection.
2. Choose and feature a Hero Piece in a more visual collection experience.
3. Tell reveal stories and organize pieces into Showcase Collections.
4. Share a whole Showcase, a Showcase Collection, or one Reveal Spotlight cleanly from a phone.
5. Discover public collectors and see a small, safe set of fresh highlights from followed Showcases.

The existing foundation is substantial: collection persistence, public/private piece fields, Showcase handles, Showcase Collections, Reveal Spotlights, follows, comments, reports, blocks, Hero Piece, Wishlist, and the lazy Bling Vault mosaic already exist. The implementation should connect and polish these capabilities rather than replace them.

## Non-negotiable boundaries

- Keep Sparkle Finder simple, mobile-first, and app-ready.
- Keep the Amethyst customer theme and the approved A/B/C app layout.
- Keep customer auth isolated to Sparkle Finder.
- Preserve all existing collection, Showcase, Nic-Nac, Reps, Dance Floor, and persistence plumbing.
- Public visibility must always be explicit. Private pieces, private notes, private profiles, and blocked relationships must never appear publicly.
- Social behavior remains one-way follows, public Showcase comments, reports, and blocks. No DMs, friend requests, customer trades, selling, buying, checkout, or marketplace behavior.
- Use `Dance Floor`, `dancers`, and `dancer leads` in visible copy.
- Retain stable IDs, routes, APIs, and database contracts unless an additive migration is required.

## Change 1: Connect real customer collections to public Sparkle Showcases

### Why this comes first

The current public Showcase routes are composed from fixture data. Persisted owner collection saves exist, but a real customer's saved public pieces are not yet the authoritative source for `/showcase/[handle]`. The flashy and social improvements will not be real until this gap is closed.

### Implementation

- Add an authenticated owner read model for Showcase readiness: handle, tagline, profile visibility, Showcase visibility, public-piece count, missing-story count, and share URL.
- Add a persisted public Showcase read service that loads only:
  - a public Sparkle Finder profile with a valid handle;
  - public collection pieces that are not private-note-only;
  - public Showcase Collections and their public pieces;
  - permitted comments and follow counts;
  - no data across an active block relationship.
- Convert the public Showcase, Reveal Spotlight, and Showcase Collection routes from fixture-only synchronous reads to persisted async reads, while retaining fixture fallback only for local preview and tests.
- Add a simple owner setup card in Collection/Manage Collection:
  - `Keep private` or `Make my Showcase public`;
  - choose/confirm handle;
  - add a short tagline;
  - preview the public Showcase;
  - copy/open the public link.
- Make empty and incomplete states clear: no public pieces, handle unavailable, Showcase private, or Showcase not ready.

### Likely files

- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/showcase-actions.ts`
- `app/showcase/[handle]/page.tsx`
- `app/showcase/[handle]/pieces/[pieceId]/page.tsx`
- `app/showcase/[handle]/showcase-collections/[collectionSlug]/page.tsx`
- `app/(hub)/silver/page.tsx`
- `app/(hub)/silver/actions.ts`
- `components/showcase/ShowcaseManager.tsx`
- Supabase migration only if the current public RPC/read boundary cannot safely express the persisted view.

### Acceptance gate

- A real Silver demo account can publish one piece and see that exact piece at its public URL.
- Making the piece or Showcase private removes it from anonymous reads immediately.
- Another signed-in customer who is blocked cannot reach or interact with the Showcase through social reads.
- Fixture customers never leak into production real-account results.

## Change 2: Turn Collection into a visual personal showroom

### Implementation

- Keep the current mobile app canvas and section order, but strengthen the visual hierarchy:
  - customer identity and meaningful stats;
  - large Hero Piece;
  - compact Wishlist rail;
  - richer Bling Vault mosaic.
- Add an explicit `Make Hero Piece` control rather than relying only on automatic ordering.
- Persist exactly one selected Hero Piece per customer. Prefer an additive nullable `hero_collection_item_id` profile field rather than changing collection IDs or overloading multiple `is_highlighted` records.
- Prefer a customer's approved personal photo, then the canonical jewelry image, then the existing jewelry fallback.
- Make mosaic tiles tappable and useful without becoming busy:
  - piece name;
  - Owned/Wishlist status;
  - Diamond/Unicorn cue;
  - Found by Sparkle Finder cue where applicable.
- Add compact filters for `All`, `Owned`, `Wishlist`, `Diamonds`, `Unicorns`, and `Found by Sparkle Finder` while preserving bounded lazy loading.
- Add polished starter, sparse-collection, missing-photo, and large-collection states.

### Likely files

- `components/home/HomepageBlingVault.tsx`
- `components/home/HeroPieceSpotlight.tsx`
- `components/home/WishlistRail.tsx`
- `components/home/BlingVaultMosaic.tsx`
- `components/home/BlingVaultTile.tsx`
- `lib/sparkle-finder/homepage-bling-vault.ts`
- `app/(hub)/silver/actions.ts`
- one additive Supabase migration for the durable Hero Piece selection.

### Acceptance gate

- Hero Piece, Wishlist, and mosaic remain in that order at 390px and desktop widths.
- A customer can select a Hero Piece and still see it after signing out and back in.
- Filters work without loading the entire collection into the initial page payload.
- A collection of hundreds of pieces remains responsive and has no horizontal overflow.

## Change 3: Make stories and Showcase Collections easy to create

### Implementation

- Replace the current owner-side placeholder for `Add to Showcase Collection` with the real persisted workflow.
- Add simple Showcase Collection management:
  - create;
  - rename;
  - add a short description;
  - choose public/private;
  - add or remove pieces;
  - reorder collections and select a cover piece if supported without excessive schema complexity.
- Replace the dense per-record management stack with a phone-first piece editor sheet/page containing:
  - status;
  - public/private visibility;
  - reveal story;
  - personal photo;
  - Rarest of Reveals toggle;
  - Showcase Collection assignment;
  - Hero Piece control.
- Let Nic-Nac help draft a reveal story from customer-provided facts, but require explicit review and save. Nic-Nac must not invent the story or claim it saved before the persistence result succeeds.
- Make public Showcase Collections highly visual with a cover image and a small preview mosaic.

### Likely files

- `components/showcase/ShowcaseManager.tsx`
- `components/showcase/ShowcaseCollectionRail.tsx`
- `components/showcase/ShowcasePieceGrid.tsx`
- new focused owner editor/collection-manager components under `components/showcase/`
- `app/(hub)/silver/actions.ts`
- `app/showcase/actions.ts`
- `lib/sparkle-finder/showcase-service.ts`
- `lib/sparkle-finder/nic-nac/tools.ts`

### Acceptance gate

- A customer can create a Showcase Collection, add two persisted public pieces, and see the collection on the public Showcase.
- Private collections and private pieces never appear in public previews, counts, metadata, or URLs.
- Story edits and assignments survive refresh and reauthentication.
- The owner workflow is comfortable at phone width and does not require editing every field at once.

## Change 4: Add real phone-friendly sharing and rich previews

### Implementation

- Replace same-page `Share` links with a reusable share control:
  - use the Web Share API when available;
  - fall back to copying the canonical URL;
  - show a clear success/error state;
  - never share a private URL as if it were public.
- Support sharing at three levels:
  - entire Sparkle Showcase;
  - one Showcase Collection;
  - one Reveal Spotlight.
- Add route-specific metadata and branded Open Graph images using only public data:
  - collector name and tagline;
  - public Hero Piece or collection cover;
  - public piece name and collection for a Reveal Spotlight;
  - Sparkle Finder branding and safe fallback art when no public image exists.
- Add canonical URLs and sensible public descriptions without exposing private notes or account details.
- Add owner preview checks so customers can see what the shared page will look like before copying it.

### Likely files

- new `components/showcase/ShareShowcaseButton.tsx`
- public Showcase route metadata functions
- route-level `opengraph-image.tsx` files or a shared approved image generator
- `components/showcase/SparkleShowcaseProfile.tsx`
- `components/showcase/RevealSpotlight.tsx`
- Showcase Collection public page components.

### Acceptance gate

- Sharing works on iPhone/Android-capable browsers and has a tested clipboard fallback.
- Facebook/text-message link previews display the intended public collector or piece information.
- Private content cannot be recovered from page source, metadata, Open Graph images, or cached public responses.
- Shared links open correctly for logged-out visitors at `yoursparklefinder.com`.

## Change 5: Add a bounded followed-Showcase discovery loop

### Implementation

- Improve collector directory cards with a small public visual preview, public-piece count, rare-reveal count, and a direct Showcase link.
- Add a compact `Followed Showcases` section rather than an endless social feed. It should show a bounded set of recent public highlights from collectors the customer follows.
- Derive highlights from existing public collection-piece updates where possible. If a database helper is needed, add a bounded authenticated RPC that:
  - uses `auth.uid()`;
  - includes followed public collectors only;
  - excludes private content and blocks in either direction;
  - returns a strict field allowlist and a small limit;
  - orders by a stable public update/reveal timestamp.
- Keep existing comments, reports, blocks, and one-way follows. Surface them more naturally from the public Showcase and Reveal Spotlight.
- Add empty states that encourage discovering public collectors without fabricating activity or showing demo accounts.
- Optionally let Nic-Nac summarize a bounded set of returned highlights, but only from tool results and without turning into open-ended social chat.

### Likely files

- `app/(hub)/collectors/page.tsx`
- `components/social/CollectorSocialPanel.tsx`
- new followed-Showcase highlight components under `components/social/`
- `lib/sparkle-finder/collector-social-service.ts`
- `lib/sparkle-finder/nic-nac/tools.ts`
- additive RPC migration if the existing public collector RPC is insufficient.

### Acceptance gate

- A customer follows a public collector and sees a bounded public highlight after refresh.
- Unfollowing removes that collector from the module.
- Blocking in either direction suppresses the collector, their highlights, and interaction controls.
- Private pieces, demo/reviewer accounts, and stale fixture activity never appear in production.

## Recommended delivery order

Deliver these as five independently verified releases:

1. **Real public Showcase data and privacy boundary.** This is the prerequisite and highest-risk backend work.
2. **Visual Collection showroom and durable Hero Piece.** This creates the immediate “flashy” value inside the signed-in app.
3. **Stories and Showcase Collections owner workflow.** This gives the public pages personality and depth.
4. **Sharing and rich previews.** This makes the collection useful outside the app.
5. **Followed Showcases and collector discovery.** This creates the safe recurring social loop after public data is trustworthy.

Each release should be committed, pushed, deployed to `yoursparklefinder.com`, and smoke-tested before starting the next release. Do not combine all five into one large deployment.

## Verification required for every release

- Write focused tests first for the new service/action/UI behavior.
- Run focused collection, Showcase, social, route, Nic-Nac, privacy, and copy tests as applicable.
- Run full `npm run test`, `npm run lint`, and `npm run build`.
- Run the Sparkle Finder Playwright smoke and add authenticated demo-account coverage for the changed flow.
- Verify 390px phone and desktop layouts, keyboard access, accessibility labels, loading/empty/error states, and no horizontal overflow.
- Verify the production custom domain, Vercel Ready state, and recent production error logs.
- For migrations: test RLS as anonymous, the owner, another customer, and blocked users; apply additively; verify remote migration history; never expose service-role credentials to the browser.

## Explicitly deferred

- Customer-to-customer trading or dancer exchange workflows.
- DMs, friend requests, group chat, or an endless activity feed.
- Reactions/likes unless comments and one-way follows prove insufficient after real customer use.
- Public display of private notes, acquisition details, or non-public collection totals.
- Major navigation changes before the five releases are observed with real beta customers.

