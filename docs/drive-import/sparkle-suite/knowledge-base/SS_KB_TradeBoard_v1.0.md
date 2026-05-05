# Sparkle Suite — Trade Board Knowledge Base Module

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to Claude chat when trade board work is on the agenda
📁 UPLOAD TO PROJECT: No — session upload only
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any trade board decision, architecture change, or competitive intel update

**Version:** 1.1 | **Created:** April 8, 2026 | **Last Updated:** May 5, 2026 | **Status:** ACTIVE — Scope Clarified

**Parent Document:** SS_Knowledge_Base_v1.9.md (archived). This is Module 6 of the SS KB segmentation system.

---

## What This Document Covers

Everything related to the Sparkle Suite trade board: the concept, technical spec, user flows, competitive intel, the Bomb Party jewelry database strategy, AI photo enhancement, and all open questions. This is the single source of truth for trade board planning and build work.

---

## The Trade Board Concept

The trade board is the single most demanded feature from Bomb Party reps. It solves a major pain point: during live shows, when a customer doesn't love their reveal, the rep currently has to manually show trade options one by one. This eats show time. For busy reps like Brittany (300 viewers, 8–10 hour streams), reclaiming that time is massive.

The trade board is a **listing and reservation system for one-for-one trades — NOT a transaction platform**. Neon Rabbit never handles money or shipping. The trade board connects and tracks. The actual exchange is handled entirely by the rep outside the platform.

### Current Matching Rules (Locked May 5, 2026)

- Trade board is **item-for-item only**
- No customer pay-the-difference flow when the target piece is "worth more"
- No store-credit flow when the target piece is "worth less"
- Trades must stay within the **same collection** for now
- Trades must stay within the **same jewelry type** for now
- Example: a May Birthday ring can trade for a February Birthday ring because both are Birthday collection and both are rings
- Diamonds and unicorns can still be traded, but they should be treated as rare edge inventory rather than the normal case
- Bomb Party MSRP can be displayed for reference, but it is **not** the basis for deciding whether a trade is acceptable

### Business Model Note

The broader Sparkle Suite vision may still grow into larger marketplace behavior later, but the current rep phone-call clarification tightened the MVP trade board back down to its simplest useful form: customers browse, ask for a swap, and the rep decides yes or no under the locked matching rules above.

---

## Trade Flow — How It Works

### Pieces Get Listed

1. During a show, a piece gets revealed but the customer doesn't want it → goes on the trade board
2. Reps also reveal pieces as "trade fodder" during slow moments (no customer attached) → goes on the trade board
3. Reps can also add trade fodder or intentionally held inventory that is available for swap under the same rules

### Rep Workflow — Adding Items (Chatbot-First)

1. Rep talks to the chatbot (voice or text) — describes the piece, uploads photo(s)
2. At minimum: one good jewelry photo + one photo of the description/reveal box
3. AI auto-enhances the jewelry photo to catalog quality
4. Chatbot extracts description from the reveal box photo (OCR/vision — research needed)
5. Item gets listed on the trade board with enhanced photo + extracted description
6. If the piece already exists in the jewelry database (cataloged by any rep), rep searches and selects it instead of going through the full upload process — network effect shortcut

### Customer Interaction

1. Customer goes to the rep's website, opens the trade board
2. Customer browses available pieces by category and filters
3. Customer finds a piece they want
4. Customer clicks on it → enters their name and describes what they're offering to trade
5. Piece gets RESERVED/FLAGGED — no other customer can claim it (first come, first serve lock)
6. Rep gets notified: "This customer wants to trade [their piece description] for [this listed piece]"
7. Rep confirms or releases the reservation if it falls through (item opens back up)
8. Actual exchange handled entirely by the rep outside the platform

### Data Captured Per Transaction

- What was revealed
- What was traded for
- Customer involved
- Date and show context
- Clean record for the rep when show ends

---

## Trade Board Display

### Categories (Based on Bomb Party Product Lines)

Categories reflect actual Bomb Party product tiers. Validated by competitive intel from Allison's Virtual Board (see Competitive Intel section below):

- Rings
- Original Necklace
- Birthday Necklace
- Original Earring
- Birthday Earring
- Birthday Bracelet
- Elevated

### Filters

- Collection
- Jewelry type
- Size where applicable (especially rings)
- Material or line if that helps browsing later
- Rarity tags can exist, but diamonds/unicorns should be treated as uncommon inventory, not the main organizational model

### Display Requirements

- Each piece: AI-enhanced photo + full description from reveal box + collection + jewelry type + Bomb Party MSRP
- Layout: rows of cards, new row auto-added when current row fills up
- Clean, organized, not cluttered
- Must look professional — not sloppy phone photos
- Mobile-first design
- MSRP is display/reference only, not a trade-parity engine

---

## Chatbot Integration — The Primary Interface

Per the Session #2 major architecture decision: the chatbot IS the primary interaction model for the entire rep portal. The trade board is no exception.

### Rep-Side Chatbot Actions for Trade Board

- "Add this piece to my trade board" → chatbot walks through upload flow
- "Remove [piece] from my board" → chatbot confirms and removes
- Search the jewelry database: "Do we have this piece already?" → chatbot searches, auto-populates if found
- "Show me my pending reservations" → chatbot lists active reservations
- "Confirm the trade with [customer name]" → chatbot marks complete
- "Release [piece] back to available" → chatbot re-opens listing

### Mid-Show Voice Workflow

During a live show, rep hits a couple buttons, talks to the chatbot while still on camera:
- "Add this to my trade board — [describes piece and customer situation]"
- Takes seconds, captures data on both sides (rep and customer)
- Minimal interruption to the show
- Voice-to-text input + text-to-speech output = feels like a real assistant

### Brainstorm — Identifying Customer Trade Pieces Mid-Show

Pain point: when a customer wants to trade a piece they just received, the rep needs to quickly identify and record WHICH piece the customer is trading away. Potential solution: rep tells chatbot mid-show the item description and customer name. Takes seconds, captures data on both sides, clean record when show ends. Flesh out during build phase — not a commitment yet.

---

## The Bomb Party Jewelry Database — Strategic Asset

Every piece of jewelry that flows through ANY rep's trade board gets cataloged into a master database. This is the single most important strategic asset Sparkle Suite will build.

### Data Captured Per Piece

- AI-enhanced catalog photo (the cleaned-up version)
- Full description from the reveal box
- Bomb Party MSRP
- Any other identifiable attributes (materials, collection, etc.)

### Why This Matters

1. **Bomb Party does NOT publicly disclose this information.** Nobody has a comprehensive catalog of their jewelry. This database is UNIQUE.
2. **Grows organically** — every trade board listing adds to it. More reps = faster growth.
3. **Identifies collection/type patterns and rarity clues** — the more data, the better we understand what exists and what shows up often.
4. **Intelligence value** — data on what pieces exist, how often they appear, and how reps organize swaps. Bomb Party intelligence nobody else has.
5. **Competitive moat** — compounds over time, increasingly hard to replicate.
6. **Transparency play** — keeps BP honest on MSRPs and rarity.

### Four Use Cases (OQ-8 — RESOLVED)

The "jewelry library" is NOT a separate feature. It IS the Bomb Party jewelry database. Same data, different access patterns:

1. **Rep Upload Shortcut** — When listing a piece, rep searches the database first. If it already exists (cataloged by any rep), click to auto-populate photo, description, collection, jewelry type, and MSRP. Network effect: the bigger the database, the faster it is to use.

2. **Browsable Collection Reference** — Reps search and browse the database to explore collections, confirm matching eligibility, and learn what's out there. A reference/research tool, not tied to active trading.

3. **Cross-Rep Trade Facilitation** — Customer wants a specific piece. Rep searches the database, finds another rep who has it listed. Can steer the customer or facilitate a rep-to-rep trade. Lead generation that costs reps nothing but builds community.

4. **Customer Portal Search (Phase 4)** — When the customer side launches, customers search the full database to find pieces for their collection. See which reps have it available, reach out directly. Lead generation engine for reps.

**Parking lot update:** "Jewelry library (as standalone feature)" REMOVED from parking lot — it's now defined as a use case of the trade board database.

---

## AI Photo Enhancement

### Direction

Prefer third-party service over building our own. Build only if no good third-party exists or costs are prohibitive at scale.

### Requirements

1. Cost affordable enough to offload into tier pricing
2. Integrates into existing workflow: rep uploads photo → AI enhances → catalog-quality image goes on trade board
3. Reliable and maintained by someone else
4. Bonus: can also do OCR on the reveal box description photo (two birds, one stone)

### Known Options to Research

- Pomelli (possibly Google AI Studios / Google Labs) — mentioned as jewelry/product photo enhancement app
- Photoroom
- Remove.bg
- Claid.ai
- Picsart API

### Research Checklist (Gap 4)

- [ ] Pomelli / Google AI Studios — API availability, cost per image, integration feasibility, quality for jewelry photos
- [ ] Other product photo enhancement APIs — compare cost per image, API ease, output quality for small jewelry items
- [ ] Can any option also do OCR on reveal box description photo?
- [ ] Test with actual Bomb Party jewelry photos before committing
- [ ] Volume pricing at scale: 100 reps × multiple listings per week

### Cost Model

Enhancement costs built into tier pricing — not absorbed by Neon Rabbit. Must know per-image costs before finalizing tier pricing.

---

## Competitive Intel

### Allison's Virtual Board (foreverfizzingit.com/virtualboard)

**Source:** Lindsey (Louis's sister) shared the link — April 8, 2026
**Rep:** Allison ("Forever Fizzing It")
**Build:** Custom Next.js app built by her husband. Cloudinary image hosting. Single-rep, one-off build — not a platform.
**Tagline:** "Powered by Allison's Husband"

#### Feature Map

**Jewelry Browsing:**
- 7 categories: Rings, Original Necklace, Birthday Necklace, Original Earring, Birthday Earring, Birthday Bracelet, Elevated
- Sub-filters by size within categories (e.g., Rings: Kids/5, 6, 7, 8, 9, 10/11)
- Inquiry-based flow: "Tap circle to select items for inquiry"
- Hero image via Cloudinary CDN
- Mobile bottom nav: Home, Browse, Cart, Trades, Loyalty

**Trade System:**
- Equal-value swaps
- Trades is a core nav item alongside browsing

**Loyalty Program ("Most Valuable Fizzer / MVF"):**
- Earn: 1 point per OG/Birthday item purchased, 2 points per Elevated item
- Redeem tiers: 10pts = free shipping coupon, 15pts = revealed OG/Birthday, 30pts = revealed Elevated or unrevealed OG, 60pts = unrevealed Elevated
- Dedicated points redemption flow/page

**Cart:**
- Cart icon in nav — implies checkout or inquiry basket functionality

**External Presence:**
- Carrd.co landing page as main "website"
- TikTok profile link

#### What to Adopt from This Example

- **Category structure** — OG/Birthday/Elevated tier system reflects actual BP product lines. Our database schema should mirror this.
- **Size-based sub-filters** — practical, customers know what size they need. Direct mapping to our filter system.
- **Inquiry-based flow** — "tap to select for inquiry" aligns perfectly with our chatbot-first approach. Instead of a cart, customer selects pieces and the chatbot handles the conversation.

#### What to Skip or Do Differently

- **Loyalty program** — Interesting concept but adds significant complexity. Each rep would need to manage point balances. PARKING LOT — not MVP.
- **Cart/checkout** — We've already decided NR never handles money. No buy-now flow in the current trade-board scope.
- **One-off custom build** — This is exactly the problem Sparkle Suite solves. Allison needed a developer (her husband). Our reps get this out of the box.

#### Where Sparkle Suite Already Wins

- **Proprietary jewelry database** — every piece flowing through any rep's board feeds the master catalog. Allison's board is isolated data with no network effect.
- **Chatbot-first UX** — customer doesn't need to learn a UI, they just talk. Especially powerful mid-show for reps.
- **Platform scalability** — serves every rep, not a single custom build per rep.
- **AI photo enhancement** — professional catalog quality vs. whatever photos the rep uploads raw.

---

## Matching Logic — Current Truth vs Remaining Unknowns

### Confirmed Now

- MSRP is not the comparison engine
- Same collection is required for now
- Same jewelry type is required for now
- Birthday-to-birthday across different months is allowed
- No pay-difference and no credit paths in the current scope
- Diamonds and unicorns remain allowed on the board, but expect them to be rare

### Still Unknown

- Exact taxonomy to use for every collection family beyond the examples already given
- Whether some premium lines should be isolated even more tightly later
- Whether size should become a hard gate in the customer-facing request flow or stay as browse/filter context
- How reps want to handle edge cases like mislabeled customer requests or ambiguous piece descriptions

---

## Open Questions and Research Items

### From Gap Analysis (Cross-Referenced with SS_KB_OpenItems)

| Gap # | Topic | Status |
|-------|-------|--------|
| Gap 4 | AI photo enhancement vendor selection | OPEN — research checklist above |
| Gap 10 | BP community trade board examples | PARTIALLY RESOLVED — Allison's board captured. Louis to look up additional examples mentioned in Session #5 |
| Gap 16 | Piece deduplication logic for jewelry database | OPEN — how to handle same piece across multiple reps' boards. One database entry linked to multiple listings? |

### Trade Board Specific Open Questions

- How exactly is the trade facilitated after the show? (Shipping? Local pickup? Through Bomb Party?)
- Can AI automatically read the description from the reveal box photo? (OCR/vision capability)
- Does this need its own agent or automation layer?
- Revenue model: trade board access is included in the single-tier subscription — no per-trade fees. Confirmed by Session #2 single-tier pricing decision.
- Exact same-collection/same-type taxonomy for all product lines: still needs to be enumerated cleanly as the database grows
- Data model design for the jewelry database: unique piece identification, deduplication, search/matching logic

### Parking Lot Items (Trade Board Related)

- **Loyalty program** — Interesting from competitive intel (Allison's MVF program). Adds complexity. Not MVP. Revisit after trade board is live and stable.
- **Customer-side marketplace** — Phase 4 scope. Master trade board, collection showcase, buy/sell/trade with rep revenue share, reputation system. Requires own planning phase.

---

## Session History (Trade Board Specific)

| Session | Date | Key Outcomes |
|---------|------|-------------|
| SS Planning #2 | April 7, 2026 | OQ-4: Trade board = listing and reservation only. NR never handles money. Jewelry database as byproduct — competitive moat. AI photo enhancement direction set (prefer third-party). |
| SS Planning #2 | April 7, 2026 | MAJOR: Chatbot as primary portal interface. Trade board managed through chatbot, not CRUD forms. Voice interface critical for mid-show use. |
| SS Planning #2 | April 7, 2026 | MAJOR: Single-tier pricing. All reps get trade board — no feature gating. |
| SS Planning #3+ | April 7, 2026 | OQ-8: Jewelry library = trade board database (4 use cases defined). Removed from parking lot as standalone feature. |
| SS Planning #5 | April 7, 2026 | OQ-21: Existing trade board research confirmed as research sprint item. Known example of data-entry style board that's popular despite being manual. |
| SS Planning #5 | April 7, 2026 | Brainstorm: mid-show pain point of identifying customer trade pieces. Chatbot voice solution proposed. |
| SS Planning #5 | April 7, 2026 | Insight: trade board as primary sales channel for some reps. 24/7 jewelry storefront model. |
| KB Gap Analysis #10 | April 8, 2026 | Gap 10 (BP community trade board examples) flagged. Gap 16 (piece deduplication) flagged. |
| This Session | April 8, 2026 | Allison's Virtual Board competitive intel captured. Category structure, size filters, and inquiry-based flow validated as patterns to adopt. Loyalty program → parking lot. |
| Phone call scope clarification | May 5, 2026 | Trade board narrowed to one-for-one swaps only. No pay-the-difference flow. No credit flow. Matching basis is same collection + same jewelry type. MSRP remains display/reference only, not the comparison engine. |
| Phone call rarity clarification | May 5, 2026 | Diamonds and unicorns remain tradable, but they are expected to be rare inventory on real trade boards, especially diamonds. Do not over-design the shell or MVP flow around those cases. |

---

## Build Dependencies

Before the trade board can be built, these must be in place:

1. **Rep portal auth** — reps need to be logged in to manage their board
2. **Chatbot infrastructure** — the primary interface for adding/managing listings
3. **Supabase schema** — trade board tables, jewelry database tables, reservation system
4. **AI photo enhancement vendor selected** — can't list pieces without enhanced photos
5. **UI/UX design system** — established before any UI code (Standing Rule: UI/UX Pro Max before code)
6. **Image storage solution** — where enhanced photos live (Supabase Storage, Cloudinary, or similar)

---

## Architecture Notes

- Trade board lives within the yoursparklesuite.com deployment — same as all rep sites
- Each rep's trade board is a view of their own listings from the shared jewelry database
- Data isolation via Supabase RLS — reps see only their own listings for management
- Exception: rep-to-rep trade board visibility (cross-rep search is a feature, not a bug)
- Customer-facing trade board is public per rep site — no auth required to browse
- Reservation requires customer to enter name/details (lightweight, no account creation for MVP)

---

*This document is Module 6 of the Sparkle Suite Knowledge Base segmentation. Upload alongside SS_KB_Core_v1.0.md for trade board planning sessions. For gap analysis work, also upload SS_KB_OpenItems_v1.0.md.*
