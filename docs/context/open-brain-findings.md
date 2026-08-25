# Open Brain Findings

Initial pull date: 2026-05-28

> Historical terminology note (2026-08-22): early Open Brain excerpts below preserve the words used in the source research. Active customer and rep vocabulary now uses `Dance Floor` for the feature and `dancers` for its inventory. Those archival excerpts are not approved product copy.

## 2026-08-25 Sparkle Suite Compatibility Addendum

Sparkle Finder now consumes Sparkle Suite compatibility release `f3de6c15` through versioned public read contracts for catalog and availability plus a separate authenticated, idempotent Showcase Studio continuation contract. Suite remains canonical for designs and exact variants, reps, shows, pending-adjusted dancer availability, and Showcase Studio resolution/continuation. Finder uses those facts for customer discovery and collection workflows without writing to Suite Dance Floor inventory or sharing Finder customer auth with Suite.

Completed through Finder Release 3:

- Release 1 (`0c54a32`) replaced first-page assumptions with bounded `schemaVersion: 2` cursor pagination, exact totals/facets, exact batch hydration, and exact-`designId` variant preservation.
- Release 2 (`93107f6`) separated distinct rep leads from the sum of physical dancers available. Suite supplies net positive quantities after pending requests; Finder excludes zero, removed, and malformed rows and does not subtract pending quantities itself.
- Release 3 (`b8ecf57`, with smoke follow-up `0613800`) activated a phone-first Showcase Studio on `/silver`. Two full-aspect phone photos are validated and privately persisted; Suite receives persisted evidence identities rather than base64 images. Ambiguous results preserve exact candidates and require explicit selection with no automatic first-candidate choice.
- Studio ownership and replay safety are enforced with signed-in owner verification, narrowly scoped service-role writes, stable account-scoped submission IDs, deterministic private objects, staged monotonic states, and terminal conflict rejection. Migration `20260825143000_sparkle_finder_showcase_studio_recovery.sql` is applied and remote migration history is current.

Verification record:

- Release 3 deployment `dpl_34Hs61FVJmuLi4E6pMcX8zZCJSvc` reached `READY` and the production custom domain was verified.
- Lint, production build, `56` Vitest files / `756` tests, the read-only strict Suite contract gate, `20` required Sparkle Finder smoke checks with `2` expected optional skips, the Nic-Nac mission guard, and visual checks at 320px, 390px, tablet, and desktop passed.
- Positive production Studio mutation/replay remains deliberately deferred until Louis designates a demo account and data. No arbitrary production customer records or uploads should be created to manufacture that evidence.
- Release 4 contract-fixture and checker hardening is still in progress and is not part of this completion record.

Key lessons:

- Cross-product compatibility is safest when the product that owns the data also owns totals, eligibility, pending consumption, exact variant resolution, and replay behavior.
- Customer evidence should be stored once behind the owning product's auth boundary and referenced by exact server-verified identities; copying base64 images across product APIs enlarges payloads and weakens recovery guarantees.
- Same-item-number candidates are not interchangeable. Stone, material, canonical photo, description, and customer confirmation must remain attached to exact `designId` values.

## 2026-08-22 Sparkle Finder Launch-Quality Addendum

Sparkle Finder moved from a feature-complete collection concept to a launch-quality, phone-first customer product. The work preserved the existing Finder account, collection, Nic-Nac, Reps, Library, and Sparkle Suite integration capabilities while improving the customer-facing collection and social experience. It did not introduce buying, selling, customer-to-customer trading, checkout, or marketplace behavior.

Completed product work:

- The Collection experience now supports a durable Hero Piece, personal photos and reveal stories, Showcase Collections, public/private Showcase controls, clear owned/Wishlist/rarity filters, and a bounded lazy-loading mosaic.
- Public Showcases, individual piece spotlights, and Showcase Collection pages are shareable and have route-specific canonical/social metadata. Followed Showcases gives collectors a bounded, privacy-aware discovery feed.
- Owner controls, success/error feedback, empty states, and mobile layouts were polished so a Silver customer can manage a Showcase comfortably from a phone.
- Customer-facing and Nic-Nac vocabulary now uses `Dance Floor` and `dancers`. Legacy board/listing terms stay only in compatibility routes, fields, APIs, tools, and database identifiers.
- The production customer domain is `https://yoursparklefinder.com`. The stable Vercel production alias permanently redirects to the matching path and query on the custom domain; preview deployments stay available for private verification.

Key decisions:

- Keep Sparkle Finder a collection, discovery, and rep-finding product. Public social features are deliberately one-way and safety-bounded; no marketplace strategy has been reopened.
- Public Showcases must fail closed. A page is reachable only when the profile, Showcase, piece, collection, and viewer relationship are all public and permitted. Private notes, account email, acquisition details, and other owner-only fields never appear in public selects or serialized responses.
- `Rarest Reveal` means a rare piece the collector owns. Rare Wishlist or ISO pieces should be presented as pieces the collector is hunting, not as owned reveals.
- The Hero Piece is chosen durably from owned items and can drive social/share presentation even if it falls outside the first visible collection page.
- Use bounded, stable reads: exact route lookups, keyset pagination, capped pieces/collections/comments, batched dependent reads, per-request caching, and database-backed exact totals. This keeps a growing Showcase surface responsive without loosening privacy.
- Supabase compromised-password protection is a required baseline setting. Intentional owner-scoped or bounded `SECURITY DEFINER` RPCs remain documented and should be re-audited whenever they change.

Verification record:

- Applied additive migrations `20260822210000_sparkle_finder_showcase_public_read_hardening.sql`, `20260822220000_sparkle_finder_owned_rarest_reveals.sql`, and `20260822230000_sparkle_finder_bounded_showcase_reads.sql`; remote migration history is current.
- Completed the five independently deployed hardening releases in commits `2bf00cc`, `61ddb23`, `1b2643b`, `d522c19`, and `383cbf7`; canonical-domain protection shipped in `885e26d`.
- Final verification passed lint, production build, `52` Vitest files / `640` tests, `19` required browser smoke checks with `2` expected optional skips, mobile/desktop visual review, live route/domain checks, and a recent Vercel error-log check with no runtime errors.

Key lessons:

- A public collection page needs the same privacy rigor as an account page. RLS alone is insufficient when a service-role read path exists; keep service reads allowlisted and independently fail closed.
- Verify both directions of a social block, and verify comment author as well as viewer and owner. A block rule that protects only the main page can still leak interaction data through a child surface.
- Exact public totals and the true Hero Piece should not be inferred from a bounded grid. Keep summary data and first-page rendering intentionally separate.
- Treat the approved mobile app preview as the acceptance reference. A responsive desktop expansion should add room, not restore a different wide-dashboard information architecture.
- Smoke tests, visual checks, migration parity, and live domain checks catch different classes of regressions; launch confidence comes from using all of them.
- Do not create or mutate arbitrary production customer data just to make a test pass. Use Louis's designated demo account/data for authenticated production exercises.

Remaining evidence work:

- When designated demo data is available, complete the signed-in production pass: Google OAuth return, Hero Piece save, Showcase publish/unpublish, story/photo and Showcase Collection saves, follow/comment/block behavior, and a real public share preview.
- The August 22 read-only audit found no production collection rows, so a positive live public Showcase metadata/share check remains intentionally deferred rather than fabricated.

## High-Signal Retrieved Thoughts

### Two-Sided Ecosystem Vision

Open Brain repeatedly frames Sparkle Suite as a two-sided ecosystem:

- rep side: branded websites, show calendar, live queue, rep trade board, SMS/email audience tools, site update portal, AI show assistant, multi-streaming support
- customer/collector side: master trade board, collection showcase, buy/sell/trade marketplace, rep revenue share, reputation system, community social feed
- platform-wide layer: AI backbone, image enhancement, site updates, show assistance, reminders

Source: Open Brain result captured 2026-03-31, type `idea`, topics `ecosystem`, `AI integration`, `Bomb Party`.

### Phase 4 Customer Ecosystem

Open Brain explicitly labels the customer/collector ecosystem as a Phase 4 planning concern:

- master trade board
- jewelry library
- reputation and rating system
- community feed
- buy/sell/trade marketplace with revenue share
- required planning for revenue share, dispute handling, and scam protection

Source: Open Brain result captured 2026-03-31, type `task`, topics `Customer ecosystem`, `Marketplace development`, `Revenue sharing`.

### Customer Platform Was Shelved, Not Rejected

An April 7 decision says the rep-side trade board is the priority, but the customer platform must be architecturally planned for. The customer platform is described as more than a trade board:

- customers show off jewelry collections
- customers buy, sell, and trade Bomb Party jewelry with each other
- customers engage as a community

Source: Open Brain result captured 2026-04-07, type `decision`, topics `Trade Board Priority`, `Customer Platform`, `Architecture Planning`.

### Two Trade Board Types

Open Brain distinguishes two separate board types:

1. Rep trade board: per-rep, managed in the Sparkle Suite hub, displayed on the rep customer site.
2. Master customer trade board: platform-wide, customer-facing, where customers trade pieces they already bought with each other.

The master customer board is explicitly described as a much bigger scope that needs its own full planning phase.

Source: Open Brain result captured 2026-04-07, type `task`, topics `Trade Board`, `Trade Facilitation`, `Scope Planning`.

### Jewelry Database as Customer-Side Foundation

The database vision matters directly to the customer side. Every rep-side listing contributes to a master Bomb Party jewelry database. The future customer portal benefit is that customers can search existing cataloged pieces instead of re-uploading everything.

Source: Open Brain result captured 2026-04-07, type `idea`, topics `Trade Board`, `Jewelry Database`, `Automations`.

### Customer Portal Search Use Case

A separate Open Brain decision defines the jewelry library as the trade board database and gives four use cases. The fourth is future customer portal search:

- customers search the full database
- customers find pieces they want for their collection
- customers see which reps have pieces available
- reps receive lead generation without extra effort

Source: Open Brain result captured 2026-04-07, type `observation`, topics `database`, `jewelry`, `trade`.

### Current Rep Trade Board Rules

The current rep-side trade board MVP has locked rules that should not be accidentally carried into the customer marketplace without review:

- item-for-item only
- no pay-the-difference
- no credit path
- same collection and same jewelry type
- Birthday pieces can trade across months if still Birthday and same jewelry type
- MSRP is reference-only, not the trade validity basis

Source: Open Brain result captured 2026-05-05, type `observation`, topics `trade rules`, `Sparkle Suite`, `Bomb Party`.

### Compliance and Customer Data Baseline

Several Open Brain entries show the current rep-side customer audience system now has real opt-in, unsubscribe, STOP handling, and consent-state work. This matters because the customer-side product will almost certainly need a stronger identity, consent, retention, and messaging model than the rep-side signup form.

Sources:

- 2026-05-06 Phase 5.6 opt-in and unsubscribe plumbing
- 2026-05-06 Phase 6.10 customer roster work
- 2026-05-25 SMS/email smoke test evidence

## Initial Read

The customer product should not be treated as just "make the rep board bigger." The existing notes point to a separate product surface with social identity, collection ownership, trust, community, search, and marketplace safety problems.

## 2026-07-03 Collector Profile Stats and Supabase Cleanup Addendum

Louis clarified that the homepage collector profile card should motivate collection building and the hunt for meaningful pieces, not show weak vanity totals. `Saved` was rejected as meaningless because it only blended owned, wishlist, and featured pieces. `Featured` was also considered weak for the homepage because featured pieces are already a subset of owned pieces.

Current profile stat direction:

- Keep `Owned`.
- Keep `Wishlist`.
- Add `Diamonds`.
- Add `Unicorns`.
- Add `Found by Sparkle Finder`.
- Do not bring back `Saved` on the homepage collector profile card.
- Do not use `Featured` as a homepage stat; featured/showcase status can remain deeper management/display behavior.

Implementation completed:

- Homepage collector profile card now shows `Owned`, `Wishlist`, `Diamonds`, `Unicorns`, and `Found by Sparkle Finder`.
- `Found by Sparkle Finder` is backed by durable acquisition tracking on `sparkle_finder_collection_items`, not a fuzzy inferred count.
- Acquisition sources now include `manual`, `wishlist`, `sparkle_finder_lead`, `nic_nac_request`, and `unknown`.
- The Finder-assisted count only includes owned items whose acquisition source is `sparkle_finder_lead` or `nic_nac_request`.
- Wishlist saves default to `wishlist`; normal owned saves default to `manual`.
- Nic-Nac save/read tools, Silver collection actions, persisted homepage Bling Vault data, fixtures, and tests were updated around this model.

Deployment and verification:

- Stats implementation commit: `786df5f feat: update collector profile stats`.
- Deployment: `dpl_GX6Dzj8DAM61ERf59JHbFTRwUKcf`, aliased at `https://sparkle-finder-dev.vercel.app`.
- Verification included lint, focused acquisition/profile tests, full Vitest suite, local production build, Sparkle Finder smoke, remote Supabase schema checks, Vercel inspect, and live route checks.

Supabase cleanup completed after the stats deployment:

- The live migration history table was out of sync with reality. Some migrations were present in the live database but not recorded; several additive repo migrations were genuinely missing.
- Already-live migrations were marked as applied with `supabase migration repair`.
- Missing additive migrations were applied with `supabase db push --yes --include-all`.
- The old short migration filename `20260613_sparkle_showcase_social_collections.sql` was normalized to `20260613000000_sparkle_showcase_social_collections.sql`, and the remote history row was repaired to match.
- `supabase/.temp` is now ignored so the repo can stay locally linked to Supabase without dirtying git.
- Final proof: `supabase db push --yes` reports `Remote database is up to date.`

Key lessons:

- For customer-facing profile stats, use emotionally meaningful collection/hunt signals, not broad admin counters.
- "Found by Sparkle Finder" must be provenance-backed at save time; do not infer it from a piece merely existing in a collection.
- Apply database history repair as bookkeeping only after verifying live artifacts. Do not replay old migrations blindly.
- Keep Supabase project-link metadata ignored, otherwise cleanup creates recurring local dirty files or loses the linked project after temp cleanup.
- When a migration filename uses a nonstandard short timestamp, normalize it before relying on `supabase db push` as the future no-op check.

## 2026-07-04 Mobile App Direction, Account Gate, And App Shell Addendum

Louis reset the Sparkle Finder experience around one simple customer promise:

> Find the pieces you love. Build your collection with Sparkle Finder.

The prior signed-in homepage was too much like a wide web dashboard. Internal terms such as `Nic-Nac Home` and vague actions such as "Save the pieces I love" made it difficult to understand what to do first. The active product reference is the July 3 A/B/C mobile-app preview, not the older locked homepage concept.

Current signed-in flow:

- A is the simple Amethyst opening home: the primary action is `Find a Piece`, with clear paths to the collection and library.
- C is the guided finding experience behind that primary action. It surfaces the next useful customer choice and puts Nic-Nac in the supporting/help role rather than making Nic-Nac a destination customers must decipher.
- B is the Bling Vault/collection layer: profile cue, `Owned`, `Wishlist`, `Diamonds`, `Unicorns`, `Found by Sparkle Finder`, Hero Piece, Wishlist, and the lazy-loading collection mosaic.
- Primary navigation is `Home`, `Find`, `Collection`, `Reps`, and `Me`; the Library remains reachable through customer tasks instead of competing as a top-level conceptual mode.
- The Reps tab is list-first, searchable, and ordered by aggregate favorite count, with compact profile treatment, state, next-show timing, View Rep links, Dance Floor links when available, and favorite-rep controls.

Important implementation boundary:

- This is a simplification and reorganization, not a feature removal project. Existing Finder persistence, Nic-Nac capabilities and routes, collection/Wishlist behavior, Reps, Library, Live Shows, Dance Floor, Favorites, Collectors, Silver Studio, auth/account, legal flows, and backend automations remain available.
- Sparkle Finder remains a normal browser-based web app. App Store and Google Play distribution are future delivery channels for the same product experience, not replacements for the website.
- The Sparkle Suite Amethyst customer-facing skin is the visual direction for both the public gate and signed-in app shell.

Public access and account behavior completed:

- Logged-out `/` is now a concise Amethyst account gate rather than a product-tour homepage. It presents the promise above, `Free or Silver account required.`, `Create free account`, and `Sign in`.
- Customers must create or sign into a Free or Silver account before accessing product surfaces; signed-in users retain the app experience.
- Signed-in desktop navigation and the mobile `Me`/Account path expose an intentional `Sign out` control. Sign-out links have prefetch disabled after smoke testing showed that prefetching a GET sign-out route could clear preview authentication before a customer clicked it.

The Bling Vault correction completed after visual review:

- Section 3 initially retained the obsolete wide `max-w-[112rem]` dashboard shape, which broke the A/B/C app flow even though the rest of the home was updated.
- The section now shares the same app canvas as A and C: `max-w-[34rem]` on mobile and `lg:max-w-[56rem]` on desktop. Hero Piece, Wishlist, and mosaic stack in a single app flow; compact collection-stat panels replace the five-column dashboard row.
- Regression coverage explicitly blocks the old `max-w-[112rem]` and `xl:grid-cols` Bling Vault pattern from returning.

Verification and deployment record:

- Signed-in UI alignment, Reps directory refinement, account gate, sign-out control, and Bling Vault correction were each checked with focused tests, lint, full test suite, production build, Sparkle Finder smoke suite, desktop/mobile visual review, Vercel readiness inspection, and live route checks appropriate to the change.
- The current runtime app-layout correction is commit `521589b`, deployed as `dpl_3Dox4Dp6qvNx173ddcYoGGQi1nmy` and aliased at `https://sparkle-finder-dev.vercel.app`.

Key lessons:

- Treat the approved mobile preview as the visual acceptance reference. A feature-complete page can still be wrong when a later section changes the product from an app flow back into a web dashboard.
- Customer-facing labels should state the customer's goal or next action. Preserve product names such as Nic-Nac, but do not make customers learn those names before they can start.
- Keep one responsive app canvas across all signed-in home sections. A desktop breakpoint may add breathing room, but it should not create a different information architecture from the mobile app.
- Verify authenticated and logged-out states separately. Visual testing that only sees one auth state can hide a missing sign-out affordance or an incorrect public landing.
- For sign-out endpoints implemented as GET routes, disable framework link prefetch and smoke-test the rendered navigation; otherwise a visible link can unintentionally change authentication state.

## 2026-06-13 Shop Removal Addendum

Louis decided Sparkle Finder should not carry a shop or paid-link storefront for now. The shop route, disclosure route, paid-link copy, Amazon program disclosure, product recommendation fixtures, and active shop docs should be removed from the current product surface.

Current direction:

- Sparkle Finder should feel like a polished discovery, Showcase, and rep-finding product, not a click-monetized storefront.
- Showcase Studio can still include helpful photo setup guidance for Silver members.
- The photo box Louis uses can be shared as a plain external resource link, without tracking tags, paid-link wording, sponsored rel attributes, or commission disclosure copy.
- Copy should clearly say people do not need that exact photo box; any clean, well-lit light box that shows label evidence and jewelry clearly can work.

## 2026-05-31 Session Addendum

Sparkle Finder moved from planning into a live, deployable customer discovery hub. The earlier shop-readiness direction from this session is superseded by the June 13, 2026 shop removal decision above.

Built and verified:

- Next.js Sparkle Finder app on the custom domain `https://yoursparklefinder.com`.
- Route, copy guardrail, disclosure/trust wording, build, and smoke-test coverage.

Key decisions:

- Sparkle Finder remains a discovery hub, not a jewelry marketplace.
- Sparkle Finder/Sparkle Suite must not imply official Bomb Party affiliation.
- The earlier shop monetization plan is no longer active.

Next-session posture:

- Stand by for Louis's direction.
- Likely next work is polishing Sparkle Finder public content, Silver, Showcase, library, or photo setup flows.

## 2026-06-01 Session Addendum

Sparkle Finder moved from domain readiness into a real Silver account, auth, consent, and billing buildout. Any shop-positioning notes from this session are superseded by the June 13, 2026 shop removal decision above.

Product and planning decisions captured:

- The old standalone `Diamonds & Unicorns Library` card should be retired from the homepage card grid. Diamond/unicorn discovery belongs inside the Master Jewelry Library through filters and search.
- Keep Sparkle Finder as a discovery hub and recommendation surface, not a jewelry marketplace and not an official Bomb Party property.

Silver account decisions captured:

- One account per person. Do not create separate customer and rep accounts.
- New signups start as Silver by default for a 45-day trial, then downgrade to Free if they do not pay or qualify through active Sparkle Suite rep access.
- Paid Silver target price is `$4.99/month`.
- Active Sparkle Suite reps receive included Silver access because driving reps into Sparkle Finder should create more show traffic and customer discovery.
- Rep data should connect automatically from Sparkle Suite into Sparkle Finder; a billing credit/code can comp Silver billing, but it should not be the data-link mechanism.
- A rep profile should still be the same unified profile/account experience, with normal Silver features plus visible rep identity such as a marker/badge.
- Louis's own account should be treated like a normal customer/rep account with Silver access only, not hidden special powers or workarounds.
- Phone number collection is allowed for account identity, recovery, verification, trial abuse prevention, and security notices. It must not imply SMS marketing consent.
- Promotional email and promotional SMS consent remain separate optional opt-ins; SMS marketing stays unchecked by default.
- Sparkle Finder does not sell customer personal information.

Built locally on branch `codex-sparkle-finder-v1`:

- Membership model and tests for `silver_trial`, `silver_paid`, `silver_rep_included`, and `free`.
- Supabase account schema/RLS migration for profiles, memberships, communication consent, and collection items.
- Supabase SSR auth helpers, auth confirmation route, sign-up/sign-in pages, and production blocking for preview auth.
- Account page with Silver status, trial countdown, billing CTA, phone/privacy copy, and consent controls.
- Stripe paid Silver scaffolding for Checkout, Billing Portal, and webhook-driven membership updates.
- Sparkle Suite rep-included Silver adapter and visible rep identity component.
- Supabase-backed Silver profile and collection persistence guarded by real Silver access state.
- Trial notification milestone helper and copy scaffolding, without live email/SMS sending.
- Smoke tests for signup/account privacy copy, 45-day Silver trial copy, shop card presence, and anonymous hub gating.
- Rollout readiness docs:
  - `docs/deployments/sparkle-finder-silver-auth-env-vars.md`
  - `docs/handoffs/2026-06-01-sparkle-finder-silver-auth-rollout.md`

Verification before rollout docs:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke:sparkle-finder`

Production rollout status:

- Silver auth/billing was not deployed to production in this session.
- Supabase is not linked locally; `supabase migration list --linked` failed because no project ref is configured.
- The linked Vercel project `sparkle-finder-dev` currently has no environment variables configured.
- Stripe live product/price/webhook values and Supabase production URL/publishable key/service role key still need Louis setup or confirmation.
- Supabase Auth email templates still need dashboard setup for the SSR `token_hash` confirmation flow.
- Next production launch step is credential/configuration work, then migration, Vercel env setup, deploy, and live route inspection.

Guardrails for future agents:

- Do not reintroduce shop, paid-link, product-selection, live-price, copied-review, rating, or retailer-image surfaces unless Louis explicitly reopens that strategy.
- Do not imply official Bomb Party affiliation.
- Do not introduce customer-to-customer trading, buy/sell, or marketplace copy during the current Sparkle Finder phase.
- Treat the untracked `public/sparkle-finder-smoke-test.html` helper as intentionally left alone unless Louis says otherwise.
