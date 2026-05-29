# Sparkle Suite Customer Platform Build Plan

> **For agentic workers:** This is a product build roadmap, not a code-level implementation plan yet. Before writing production code, convert the relevant phase into a task-by-task implementation plan with exact files, tests, and commands.

**Goal:** Build the customer/collector side of Sparkle Suite as a secured free discovery hub that drives customer traffic back to Sparkle Suite reps through live show discovery, aggregated rep trade board browsing, and master jewelry library browsing.

**Architecture:** Use this repo as the standalone customer-side product workspace. Preserve Sparkle Suite's public brand system from `C:\Users\louis\sparkle-suite-marketing\brand` and integrate with Sparkle Suite's existing jewelry database, rep trade boards, rep profiles, and live event/calendar data instead of duplicating those systems. Customer-only data should live in customer-specific tables/services, while canonical jewelry and rep listing data remain owned by Sparkle Suite core.

**Tech Stack Direction:** Next.js/React + TypeScript to match Sparkle Suite patterns, Supabase/Postgres for authenticated customer accounts and customer hub data, existing Sparkle Suite styling tokens/brand rules, and read-through integration with Sparkle Suite core data for reps, live events, trade boards/dance floors, and the master jewelry database.

---

## Brand And Product Guardrails

- Match the current Sparkle Suite public brand direction:
  - warm, polished, plain-English, soft, premium without fake luxury
  - `Playfair Display` for display headings
  - `DM Sans` for UI/body
  - blush/warm-white/pink/plum palette from the production design kit
- Do not create fake product screens or invented Sparkle Suite capabilities in public marketing.
- Do not use buy/sell language in v1.
- Do not build customer-to-customer trading in v1.
- Do not build a customer Plus tier in v1 unless a later decision reintroduces it.
- Keep the customer side rep-positive: customer activity should send attention back to reps first.
- Treat Bomb Party as an unaffiliated third-party ecosystem. Avoid visual or copy choices that imply official BP partnership.

## V1 Scope Pivot: Discovery Hub First

As of 2026-05-29, v1 is not a customer-to-customer trade product. It is a secured, free customer discovery hub.

Public visitors can see the landing page/teaser. Customers must create a free login to access the valuable hub areas:

- master Sparkle Suite rep live calendar
- aggregated rep trade boards / dance floors
- master jewelry library
- rep discovery paths back to rep sites and shows

Customer-to-customer trading, customer Plus, message boards, sponsored rep placement, future rep signup sales, and buy/sell marketplace behavior are parked.

The core v1 win is rep traffic. Reps should want to join Sparkle Suite because the customer hub gives them another discovery channel.

## Target Customer Journey

### Stage 1: Lead Lands On Customer Landing Page

Purpose:

- explain the customer hub value without making it feel like generic SaaS
- collect interest from customers who want one easier place to find Sparkle Suite reps, lives, boards, and jewelry library records
- route rep prospects back to the rep-facing Sparkle Suite path

Core sections:

- hero: collector-focused but Sparkle Suite branded
- value strip: `Find live shows`, `Browse rep boards`, `Explore the jewelry library`, `Discover Sparkle Suite reps`
- free account explanation
- master library preview
- rep calendar/trade board preview
- login value explanation
- opt-in form / create Free account CTA

Primary CTA:

- `Create Free Account`

Secondary CTA:

- `See How It Helps Reps`

Data captured:

- first name
- email
- optional phone with separate SMS consent
- TikTok handle/link optional
- state optional during lead stage, required later for higher-trust actions

### Stage 2: Free Account Creation

Free account intent:

- grow the customer network
- create a safer, more intentional browsing community
- capture future customer leads and preferences
- make rep calendars, rep boards, and the master library useful immediately
- provide attribution and demand signals for future rep value

Free onboarding steps:

1. Create login.
2. Confirm email.
3. Create profile snapshot:
   - display name
   - state
   - optional profile photo
   - optional TikTok handle/link
   - favorite jewelry type or collection interests
4. Browse master Sparkle Suite rep live calendar.
5. Browse aggregated rep trade boards / dance floors.
6. Browse/search the master jewelry library.
7. Open rep site/show/trade-board paths from hub cards.

Free permissions:

- browse upcoming Sparkle Suite rep lives
- browse aggregated rep trade boards / dance floors
- browse master jewelry library
- open individual rep sites and show paths
- maintain a basic profile for future personalization

Free restrictions:

- cannot initiate customer-to-customer trades
- cannot list customer-owned pieces for trade
- cannot submit uncataloged jewelry to the master database in v1
- cannot access future premium features unless a later Plus tier is reintroduced

### Stage 3: Authenticated Customer Hub

Hub intent:

- give logged-in customers one place to browse Sparkle Suite rep activity
- drive customers back to rep sites, shows, and trade boards
- create a stronger reason for reps to join Sparkle Suite
- collect future lead and demand data without building trade workflow yet

Hub modules:

- rep directory
- master live calendar
- aggregated rep trade board / dance floor browser
- master jewelry library browser
- affiliate/shop area
- customer profile/preferences
- future favorites/follows placeholder

Primary hub actions:

- view a rep's next show
- open the rep's Sparkle Suite site
- browse a rep's current trade board / dance floor
- search library records
- browse affiliate/shop recommendations
- update profile/preferences

### Stage 4: Parked Plus And Nic-Nac Ideas

Plus and customer-facing Nic-Nac are parked for v1, but the architecture should leave room for them.

Future customer-facing Nic-Nac could help with:

- orientation help
- finding reps
- understanding how the hub works
- finding relevant live shows
- browsing the jewelry library
- future collection and wishlist support

Future Plus could include:

- richer profile customization
- save/follow reps and shows
- alerts
- customer-submitted jewelry candidates
- limited customer-side Nic-Nac usage

Do not build these in the first discovery-hub slice.
- answer basic Sparkle Suite customer-feature questions

Plus Nic-Nac:

- guide uncataloged piece submission
- reject bad photos with clear coaching
- help map a customer piece to an existing library item
- suggest better search terms
- explain why a trade match is or is not valid
- help navigate profile/theme/collection highlighting
- summarize wishlist matches and upcoming rep lives

Nic-Nac restrictions:

- no pricing/value guarantees
- no legal advice
- no claim that Sparkle Suite verifies every piece
- no buy/sell facilitation in v1
- no off-platform transaction guidance beyond safe, general reminders

### Stage 5: Rep-First Discovery And Future Matching

Matching priority:

1. Customer wishlist to active rep trade boards/dance floors.
2. Show the matching rep and next live event/show.
3. Let logged-in customers open rep site/show paths.
4. If no rep match exists, surface customer-to-customer possibilities later.

Data needed from Sparkle Suite core:

- canonical jewelry designs
- active rep trade listings
- listing status
- rep profile/business name
- rep public site link
- rep live event calendar
- collection and jewelry type metadata

Match rules:

- exact jewelry design match when possible
- collection + jewelry type fallback only where design-level data is incomplete
- do not imply the rep is obligated to trade or reserve without the rep's actual board flow

Notification strategy is parked for v1. Start with authenticated browsing before alerts.

### Stage 6: Master Jewelry Library

Free library behavior:

- browse/search/filter
- add existing records to collection
- add existing records to wishlist
- view basic details and known rep availability

Plus library behavior:

- submit uncataloged piece via Nic-Nac
- upload customer photos for collection presentation
- request review for new database entry

Submission workflow:

1. Plus customer searches existing library first.
2. If no match, Nic-Nac starts a guided submission.
3. Customer uploads jewelry photo.
4. Nic-Nac checks photo quality and rejects poor photos.
5. Customer adds known details from reveal/box.
6. Submission enters review/approval state.
7. Approved submission becomes a master library candidate or canonical record according to operator rules.

Operator/admin need:

- review queue for customer-submitted pieces
- duplicate detection against item number and visual/text data
- approve/reject/merge flow
- ability to keep a customer photo private to that customer's collection instead of promoting it to canonical library photo

### Stage 7: Customer Collection And Wishlist

Collections and wishlists are parked for the first discovery-hub slice unless the first implementation has enough room to add them safely. If included, start with existing library records only.

Future collection item states:

- `owned`
- `wishlist`
- `available_to_trade`
- `private_note_only`

Free collection:

- existing library items only
- basic display
- default profile style

Plus collection:

- collection photos
- highlighted collections
- profile/theme customization
- uncataloged submission flow
- richer notes and organization later

Privacy:

- customer controls whether collection is public, followers-only, or private
- wishlist can be public or private
- state can be shown as state only, never full address

### Stage 8: Parked Customer Trade Board

Customer-to-customer trading is parked. Do not build this in v1.

Future trade stance if reactivated:

- no buy/sell
- no cash
- no trade-ups
- no platform escrow
- same collection + same jewelry type
- year does not matter where collection identity remains equivalent

Previously captured trade eligibility:

- Free accounts can browse future customer trade listings and the jewelry database.
- Plus accounts would be required to list items for customer-to-customer trade.
- Plus accounts would be required to initiate customer-to-customer trade proposals.

This is parked with the rest of customer-to-customer trading.

Trade listing requirements:

- item must be in customer's collection
- item must map to a master jewelry library record or approved customer-submitted record
- customer confirms physical possession
- customer provides a Nic-Nac-approved photo for trade listing

Trust and safety:

- visible completed trade count
- post-trade rating
- report listing/user
- internal risk flags
- pause suspicious accounts from creating new trades
- no selling, no advertising, no politics

Shipping/trade workflow needs separate design before build:

- who sees shipping address and when
- whether both sides upload tracking
- what happens if one side ships and the other does not
- whether Sparkle Suite only records/reporting or actively mediates disputes

## Required Data/Service Areas

Customer-owned data:

- customer profiles
- account tier and Plus subscription status
- profile theme settings
- collection items
- wishlist items
- customer photo assets
- customer-submitted jewelry candidates
- customer follows/saved reps/saved shows
- match notification preferences
- customer-side Nic-Nac usage limits
- trade eligibility/rating/reporting state

Shared/read-through Sparkle Suite data:

- `jewelry_designs`
- collections
- active `trade_listings`
- rep profiles/business metadata
- rep public site links
- rep live events/calendar entries

Integration rule:

- customer app can read shared Sparkle Suite data through stable APIs/views
- customer app should not directly mutate rep listings or canonical records without a review/service boundary
- customer-submitted jewelry should enter a review queue before becoming canonical

## Phase Plan

### Phase 0: Product Foundation

- finalize product name and URL strategy
- decide whether customer auth lives in new repo only or shares auth/project with Sparkle Suite core
- define secured free customer account model
- define public-vs-login feature boundary
- define customer terms/privacy additions for browsing, profile data, and affiliate links
- define affiliate disclosure stance

Exit criteria:

- approved v1 discovery hub feature matrix
- approved account journey
- approved public/login boundary
- approved data ownership map

### Phase 1: Public Landing And Free Signup

- build customer landing page in Sparkle Suite brand
- add Free account signup
- collect profile snapshot
- implement basic customer dashboard shell
- add locked/login-gated previews for calendar, boards, and library

Exit criteria:

- lead can become a Free customer
- Free customer can create profile and reach dashboard
- copy stays inside Sparkle Suite brand guardrails

### Phase 2: Master Calendar And Rep Directory

- connect to Sparkle Suite rep profile/read model
- connect to live event/calendar read model
- build rep directory
- build master live calendar
- route users back to rep sites/show links

Exit criteria:

- logged-in customer can browse Sparkle Suite reps and upcoming lives
- customer can open rep site/show paths

### Phase 3: Aggregated Rep Trade Board Browser

- connect to active rep trade board / dance floor read model
- build aggregated board browser
- filter by rep, collection, jewelry type, and status where available
- route item interest back to the rep's board/site flow

Exit criteria:

- logged-in customer can browse current rep board inventory in one place
- customer cannot initiate customer-to-customer trades
- customer interest routes back to rep-owned flows

### Phase 4: Master Jewelry Library Browse

- connect to master jewelry library read model
- build search/filter UI
- show library item detail pages
- show known rep availability where available

Exit criteria:

- logged-in customer can browse/search the master jewelry library
- no customer can create canonical jewelry records

### Phase 5: Affiliate/Shop Layer

- add optional shop/affiliate area
- include collector products
- include live-streaming tools and gear for reps
- disclose affiliate relationships
- avoid making the shop look like a jewelry buy/sell marketplace

Exit criteria:

- shop is clearly optional
- affiliate links are disclosed
- livestreaming/rep gear and collector gear are both represented

### Phase 6: Future Favorites/Matching Prep

- define saved reps/shows model
- define wishlist/future matching model
- define consent model for future alerts
- do not send alerts in this phase unless separately approved

Exit criteria:

- data model can support future matching and alerts
- v1 still works as browsing-first hub

### Phase 7: Parked Customer Plus/Nic-Nac Planning

- revisit Plus only after v1 hub proves traffic value
- define customer-facing Nic-Nac limits if needed
- define paid/usage model later

Exit criteria:

- no Plus billing is required for v1
- no customer-facing Nic-Nac is required for v1

### Phase 8: Parked Customer Trading

- keep customer-to-customer trading out of v1
- resume only after there is evidence the hub has customer activity worth extending

Exit criteria:

- no customer-to-customer trading is in the v1 build
- prior trade decisions remain archived for a later revisit

## Immediate Next Decisions

1. Is trading Plus-only for v1, or can Free accounts browse trade listings while Plus can list/initiate?
2. What is the Plus pricing hypothesis?
3. Should the customer app share the same Supabase project as Sparkle Suite core from day one, or start with a separate project and read through APIs?
4. What URL path/domain should the customer side use?
5. What customer-side name do we use publicly: Sparkle Suite Customer, Sparkle Suite Collectors, Sparkle Suite Hub, or something else?

Superseded by 2026-05-29 pivot:

- customer-to-customer trading is parked
- Plus pricing is not needed for v1
- customer-side Nic-Nac is not needed for v1

## First Build Recommendation

Build the first usable slice in this order:

1. Customer landing page.
2. Free account creation.
3. Profile snapshot.
4. Master live calendar.
5. Rep directory.
6. Aggregated rep trade board / dance floor browser.
7. Master jewelry library browsing.
8. Affiliate/shop layer.

Do not build customer-to-customer trading, Plus billing, or customer-facing Nic-Nac in v1.
