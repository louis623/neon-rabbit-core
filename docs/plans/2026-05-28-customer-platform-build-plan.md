# Sparkle Suite Customer Platform Build Plan

> **For agentic workers:** This is a product build roadmap, not a code-level implementation plan yet. Before writing production code, convert the relevant phase into a task-by-task implementation plan with exact files, tests, and commands.

**Goal:** Build the customer/collector side of Sparkle Suite from public lead capture through Free account onboarding, Plus conversion, collection management, rep-first wishlist matching, limited Nic-Nac access, and future-safe trade-board integration.

**Architecture:** Use this repo as the standalone customer-side product workspace. Preserve Sparkle Suite's public brand system from `C:\Users\louis\sparkle-suite-marketing\brand` and integrate with Sparkle Suite's existing jewelry database, rep trade boards, rep profiles, and live event/calendar data instead of duplicating those systems. Customer-only data should live in customer-specific tables/services, while canonical jewelry and rep listing data remain owned by Sparkle Suite core.

**Tech Stack Direction:** Next.js/React + TypeScript to match Sparkle Suite patterns, Supabase/Postgres for accounts and customer product data, Stripe for Plus subscription billing, existing Sparkle Suite styling tokens/brand rules, and a limited customer-facing Nic-Nac layer for onboarding, collection help, photo guidance, and feature navigation.

---

## Brand And Product Guardrails

- Match the current Sparkle Suite public brand direction:
  - warm, polished, plain-English, soft, premium without fake luxury
  - `Playfair Display` for display headings
  - `DM Sans` for UI/body
  - blush/warm-white/pink/plum palette from the production design kit
- Do not create fake product screens or invented Sparkle Suite capabilities in public marketing.
- Do not use buy/sell language in v1.
- Keep the customer side rep-positive: customer activity should send attention back to reps first.
- Treat Bomb Party as an unaffiliated third-party ecosystem. Avoid visual or copy choices that imply official BP partnership.

## Target Customer Journey

### Stage 1: Lead Lands On Customer Landing Page

Purpose:

- explain the collector value without making it feel like generic SaaS
- collect interest from customers who want collection tracking, wishlist matching, and safer trading
- route rep prospects back to the rep-facing Sparkle Suite path

Core sections:

- hero: collector-focused but Sparkle Suite branded
- value strip: `Build your collection`, `Track your wishlist`, `Find rep board matches`, `Trade with clearer rules`
- Free vs Plus comparison
- master library preview
- rep-first matching explanation
- trust/safety promise
- opt-in form / create Free account CTA

Primary CTA:

- `Create Free Account`

Secondary CTA:

- `Explore What Plus Adds`

Data captured:

- first name
- email
- optional phone with separate SMS consent
- TikTok handle/link optional
- state optional during lead stage, required later for higher-trust actions

### Stage 2: Free Account Creation

Free account intent:

- grow the customer network
- build wishlist demand data
- let customers participate without friction
- make the master library useful immediately

Free onboarding steps:

1. Create login.
2. Confirm email.
3. Create profile snapshot:
   - display name
   - state
   - optional profile photo
   - optional TikTok handle/link
   - favorite jewelry type or collection interests
4. Start collection from existing master library records.
5. Start wishlist from existing master library records.
6. Browse master Sparkle Suite rep live calendar.
7. See limited rep-first matches from wishlist to rep boards.

Free permissions:

- browse master jewelry library
- add existing library pieces to collection
- add existing library pieces to wishlist
- browse upcoming Sparkle Suite rep lives
- browse basic rep-first matches
- view own profile and collection

Free restrictions:

- cannot submit uncataloged jewelry to the master database
- cannot upload new canonical jewelry photos
- cannot customize themes beyond default profile
- cannot highlight collections
- cannot use advanced alerts
- cannot access trading unless later explicitly allowed

### Stage 3: Plus Conversion

Plus account intent:

- monetize serious collectors
- create a more accountable customer tier
- protect the master jewelry database from low-quality public submissions
- unlock richer collection/profile behavior
- unlock more useful Nic-Nac guidance

Plus conversion triggers:

- customer wants to submit a piece that is not in the library
- customer wants advanced wishlist alerts
- customer wants to save/follow reps and shows
- customer wants profile themes/customization
- customer wants to highlight a collection
- customer wants richer collection photos
- customer wants trading eligibility or stronger trade status
- customer uses customer-side Nic-Nac beyond the free limit

Plus onboarding data:

- verified email
- verified phone if SMS alerts or trading are enabled
- state required
- shipping state/region for trade context, not full address at profile stage
- agreement to trade rules and photo submission standards
- acknowledgement that Sparkle Suite is not guaranteeing trades or handling payments/shipping in v1

Plus permissions:

- everything in Free
- profile colors/themes within Sparkle Suite brand-safe options
- highlighted collections
- collection photo albums
- submit uncataloged pieces through Nic-Nac photo workflow
- save/follow reps
- save shows
- receive alerts when wishlist pieces match rep board/show context
- advanced wishlist and matching controls
- limited customer-facing Nic-Nac help
- possible trading eligibility or higher-trust trade status

### Stage 4: Customer-Facing Nic-Nac

Nic-Nac should be limited and practical on the customer side.

Free Nic-Nac:

- orientation help
- how to add existing library pieces to collection
- how to build a wishlist
- explain Free vs Plus
- explain trade rules
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

### Stage 5: Rep-First Matching

Matching priority:

1. Customer wishlist to active rep trade boards/dance floors.
2. Show the matching rep and next live event/show.
3. Let Plus customers follow/save/receive alerts.
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

Notification strategy:

- Free: in-app/manual browse first
- Plus: email alerts first
- SMS alerts only with explicit consent and cost controls

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

### Stage 7: Customer Collection

Collection item states:

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

### Stage 8: Customer Trade Board

V1 trade stance:

- no buy/sell
- no cash
- no trade-ups
- no platform escrow
- same collection + same jewelry type
- year does not matter where collection identity remains equivalent

Trade eligibility recommendation:

- Free accounts can browse customer trade listings and the jewelry database.
- Plus accounts are required to list items for customer-to-customer trade.
- Plus accounts are required to initiate customer-to-customer trade proposals.

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
- define Free/Plus feature matrix
- define Plus price hypothesis
- define customer terms/privacy additions
- define no-buy/sell/no-escrow disclaimer

Exit criteria:

- approved feature matrix
- approved account journey
- approved trust boundary
- approved data ownership map

### Phase 1: Public Landing And Free Signup

- build customer landing page in Sparkle Suite brand
- add Free account signup
- collect profile snapshot
- implement basic customer dashboard shell
- add library browse entry point
- add master calendar browse entry point

Exit criteria:

- lead can become a Free customer
- Free customer can create profile and reach dashboard
- copy stays inside Sparkle Suite brand guardrails

### Phase 2: Master Library And Collection/Wishlist

- connect to master jewelry library read model
- build search/filter UI
- add existing jewelry to collection
- add existing jewelry to wishlist
- create profile collection view

Exit criteria:

- Free customer can build collection and wishlist using existing library items
- no customer can create canonical jewelry records yet

### Phase 3: Rep-First Matching And Calendar Links

- match wishlist to active rep board listings
- show rep and next show context
- let Free customers browse matches
- let Plus customers save/follow reps and shows after Plus exists
- define notification consent model

Exit criteria:

- customer wishlist can surface rep board matches
- match detail routes customer attention back to the rep and next show

### Phase 4: Plus Subscription And Premium Profile

- add Stripe Plus subscription
- add Plus onboarding data requirements
- add profile theme options within Sparkle Suite brand
- add highlighted collections
- add collection photo albums
- add saved reps/shows
- add advanced matching settings

Exit criteria:

- Free customer can upgrade to Plus
- Plus entitlements unlock and revoke cleanly
- Plus user can personalize profile without breaking brand guardrails

### Phase 5: Customer Nic-Nac

- add limited customer-side Nic-Nac
- create Free and Plus usage boundaries
- support library search help, collection help, wishlist help
- support Plus photo guidance and uncataloged submission
- log customer-side Nic-Nac actions separately from rep-side Nic-Nac

Exit criteria:

- Nic-Nac helps customers without becoming an unrestricted chat surface
- Plus user can start an uncataloged jewelry submission through guided flow

### Phase 6: Customer-Submitted Jewelry Review

- add Plus-only uncataloged piece submission
- add photo quality checks
- add operator review queue
- add approve/reject/merge workflow
- protect canonical library from direct public writes

Exit criteria:

- Plus submissions can become approved library candidates only after review
- bad photos and duplicates can be rejected or merged

### Phase 7: Customer Trade Board Design And First Build

- finalize shipping/privacy/dispute workflow
- build Plus-gated trade listing flow
- enforce same collection + same jewelry type
- add customer-to-customer match discovery
- add rating/reporting
- add trade status record

Exit criteria:

- approved customer trade can be listed and matched under v1 rules
- Free users can browse customer trade listings but cannot list or initiate customer-to-customer trades
- no buy/sell or payment processing exists
- moderation/reporting path exists before public launch

### Phase 8: Affiliates/Shop Layer

- add optional shop/affiliate area
- start with light boxes, display stands, photo gear, shipping supplies, storage
- disclose affiliate relationships
- explore custom Sparkle Suite merch later

Exit criteria:

- shop is clearly optional
- affiliate links are disclosed
- no confusion with jewelry buy/sell marketplace

## Immediate Next Decisions

1. Is trading Plus-only for v1, or can Free accounts browse trade listings while Plus can list/initiate?
2. What is the Plus pricing hypothesis?
3. Should the customer app share the same Supabase project as Sparkle Suite core from day one, or start with a separate project and read through APIs?
4. What URL path/domain should the customer side use?
5. What customer-side name do we use publicly: Sparkle Suite Customer, Sparkle Suite Collectors, Sparkle Suite Plus, or something else?

## First Build Recommendation

Build the first usable slice in this order:

1. Customer landing page.
2. Free account creation.
3. Profile snapshot.
4. Master library browsing.
5. Collection and wishlist from existing records.
6. Rep-first wishlist matching with next-show context.
7. Plus upgrade and Plus profile features.
8. Customer Nic-Nac for collection help and Plus photo submissions.

Do not build the customer trade board until trust, shipping, dispute, and privacy workflow decisions are written down and approved.
