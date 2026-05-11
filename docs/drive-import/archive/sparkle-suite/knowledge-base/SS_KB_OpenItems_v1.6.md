# Sparkle Suite — KB Module: Open Items

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Every gap analysis or research session that resolves or adds items

**Version:** 1.6 | **Derived from:** SS_KB_OpenItems_v1.5 | **Last Updated:** April 9, 2026
**Status:** Gap Analysis Session #16 complete. Gap 15 RESEARCH COMPLETE (SEO/GEO — implementation details are build-phase items). Gap 16 DESIGN COMPLETE (three-table data model, dedup strategy, live show trade flow, filtering requirements). Four new gaps (20–23) added as pre-build blockers for trade board prototype. Legal L1–L6 prompts still not written.

**COMPANION MODULES:**
- SS_KB_Core_v1.6.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec (all 4 pages)
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Gap Analysis Status

**Total knowledge gaps identified:** 23 (19 original + 4 new from Session #16)
**Resolved Sessions #9–16:** 14 closed + 4 deferred + 1 partially resolved
**New gaps (Session #16):** 4 pre-build blockers for trade board prototype (Gaps 20–23)
**Remaining:** 4 new gaps + 6 legal sprints
**Categories 2–5:** COMPLETE as of Session #11

### Resolved Gaps (Sessions #9–16)
1. ~~Vercel custom domain limits~~ → CLOSED. Pro plan supports 100,000 domains.
2. ~~TCPA/CAN-SPAM compliance~~ → RESEARCHED, parked for legal review.
3. ~~Footer disclaimer language~~ → RESEARCHED, parked for legal review.
4. ~~Monthly + quarterly cancellation policy~~ → LOCKED. No refund, service through end of period.
5. ~~neonrabbit.net treatment~~ → DECIDED. Minimal brand page on Readdy with redirects.
6. ~~"Powered by" link destination~~ → CLOSED. Points to yoursparklesuite.com rep-facing homepage.
7. ~~B1 Build sequence philosophy~~ → RESOLVED. Thumper + dashboard first. Formal build sequence session before Claude Code.
8. ~~B3 First-rep onboarding workflow~~ → RESOLVED. Full pipeline decided.
9. ~~B4 Grandfathered client migration~~ → RESOLVED. Stay on Readdy indefinitely. No migration planned.
10. ~~F1 + Gap 6 Chatbot quality risk / voice / agent architecture~~ → FULLY RESOLVED. Voice deferred to post-launch. Wispr Flow recommended. Thumper agent architecture locked (Session #15): 6-component design, Vercel AI SDK orchestration, rep notes table as launch feature, concise personality locked.
11. ~~F3 Chrome extension rebuild~~ → RESOLVED. Parallel workstream during dashboard build.
12. ~~F8 Payment before launch~~ → RESOLVED. Three hard gates.
13. ~~L4 ToS / Privacy Policy~~ → RESOLVED. Best-practices boilerplate at build, attorney review later.
14. ~~P1 Feature readiness script~~ → RESOLVED. Launch standard solves it.
15. ~~P2 Custom request rejection~~ → RESOLVED. Thumper script + Louis escalation fallback.
16. ~~P4 Rep exit / offboarding~~ → RESOLVED. Domain ownership policy locked.
17. ~~P8 Referral pipeline before ready~~ → RESOLVED. Waitlist via Thumper on landing page.
18. ~~Gap 1 SMS/Email provider + billing~~ → RESOLVED. Telnyx + Resend. Wallet model locked.
19. ~~Gap 19 Infrastructure cost modeling~~ → DEFERRED to pre-launch. Build first, model real numbers.
20. ~~Gap 5 Thumper API cost modeling~~ → RESOLVED. Haiku 4.5 default, Sonnet 4.6 escalation. Scope lock decided.
21. ~~Gap 7 Stock photo subscription~~ → RESOLVED. No subscription needed. AI-generated + Canva Pro mix.
22. ~~Gap 11 BP TAM hard numbers~~ → RESOLVED. Active rep TAM estimated 20K–50K. Business model validated.
23. ~~Gap 15 SEO/GEO multi-tenant sub-sites~~ → RESEARCH COMPLETE (Session #16). Gemini results analyzed. No architecture-breaking findings. Schema upgrades, rendering strategy, Markdown for Agents approach all captured. Implementation details are build-phase items. See SS_KB_Core_v1.6 for full findings.
24. ~~Gap 16 Jewelry database deduplication~~ → DESIGN COMPLETE (Session #16). Three-table data model (collections, jewelry_designs, trade_listings). Dedup matching strategy decided. Live show trade flow designed. MSRP single field. Rarity tags only at launch. Filtering hard requirement. Four pre-build gaps spawned (20–23). See SS_KB_Core_v1.6 for full design.

### Deferred Gaps
| # | Gap | Deferred Until |
|---|-----|---------------|
| 10 | BP community trade board examples | After rep trade board is built and understood |
| 12 | Lindsey revenue data | After Gap 19 (cost modeling) + Gap 11 (TAM) complete — Gap 11 resolved; revisit at pre-launch |
| 14 | Thumper capability boundaries | During Thumper build phase — can't define until built |
| 19 | Infrastructure cost modeling | Pre-launch — build first, model real numbers |

### Partially Resolved Gaps
| # | Gap | Status | What's Open |
|---|-----|--------|-------------|
| 4 | AI photo enhancement vendor | VENDOR SELECTED — Photoroom primary, Claid backup. Two-layer QA system decided in principle. | QA implementation details need dedicated design session. 5 pre-build open questions remain. Photography kit test Saturday April 12. |

### New Gaps — Pre-Build Blockers for Trade Board Prototype (Session #16)
| # | Gap | Method | Status | Notes |
|---|-----|--------|--------|-------|
| 20 | BP item number / style name confirmation | Ask Lindsey | OPEN — BLOCKING | Do BP pieces consistently have an item number or style name on the reveal box/tag? Determines whether dedup is simple (item number match) or complex (multi-attribute fuzzy matching). Lindsey can answer in 2 minutes. If no BP number exists, NR assigns its own tracking number. |
| 21 | Customer-facing trade request form design | Quick design session | OPEN | Exact fields, UX flow, and experience for the "I want this" form. Captures: customer name, what they're offering, their MSRP. How much detail? Photo upload? Dropdowns? |
| 22 | Thumper trade board tool definitions | Opus design session (~30–45 min) | OPEN | Specific tool schemas (parameters, return values, error handling) for: add_listing, get_trade_requests, approve_trade, reject_trade, get_my_board, etc. Must be done before Claude Code touches the prototype. |
| 23 | Thumper live show notification mechanism | Targeted research + design decision | OPEN | How does Thumper ping the rep mid-show? Screen real estate problem (BP dashboard fills the screen). Options: floating widget, PWA pop-out, browser extension panel, mobile second screen. Critical for the Lindsey prototype. |

**Dependencies:** Gap 20 (item number) should be answered FIRST — it affects Gaps 21 and 22. Gap 23 can be researched in parallel.

---

## Legal Research Sprint Queue

**STANDING RULE:** Every legal item gets a Gemini research sprint before any language is written. No exceptions. Attorney review in one consolidated session when revenue supports it.

| # | Item | Method | Status |
|---|------|--------|--------|
| L1 | Service agreement best practices for SaaS | Gemini deep research | OPEN — prompt not yet written |
| L2 | FTC income claim compliance for MLM recruitment pages | Gemini deep research | OPEN — prompt not yet written |
| L3 | Bomb Party trademark usage on a commercial platform | Gemini deep research | OPEN — prompt not yet written |
| L4 | ToS + Privacy Policy boilerplate | Gemini deep research | OPEN — prompt not yet written |
| L5 | Trade board listing-only platform liability disclaimer | Gemini deep research | OPEN — prompt not yet written |
| L6 | Annual + Forever cancellation/refund policy standards | Gemini deep research | OPEN — prompt not yet written |

---

## AI Photo Enhancement — Open Items (Gap 4, Session #14)

**Vendor selected:** Photoroom primary, Claid.ai backup. KISS-compliant — one vendor in production.

**Two-layer QA system (in principle):**
- Layer 1 — Thumper pre-flight: Evaluates photo for minimum viability before Photoroom. Kicks back with coaching if not good enough.
- Layer 2 — Backend QA inspector: Evaluates Photoroom output before database entry. Details TBD.

**Five open questions (resolve at pre-build vendor commitment):**
1. Hallmark preservation — do upscaling APIs preserve tiny hallmark text?
2. Video ingestion — frame extraction + enhancement for BP video reveals
3. Data residency — do Photoroom/Claid use uploaded images for model training? (NeuroViz confirmed no)
4. SynthID/watermarking — Google Vertex AI implications for database copyright
5. Adobe Firefly rate limits — 4 RPM default bottleneck concern

**Rep Photography Kit (IN PROGRESS):**
- DUCLUS 12"x12" lightbox ordered — $29.99, arriving Saturday April 12
- Test with real BP jewelry before standardizing
- If passes: bake into start fee, determine fulfillment method, evaluate bulk pricing
- Goal: reduce pre-flight rejections at the source

**Dedicated QA design session needed** before trade board build spec is written.

---

## SMS Billing Model — Locked (Session #12, confirmed Session #13)

**⚠️ NOTE:** Two conflicting entries were logged during Session #12. The $0.020/msg entry was a premature mid-brainstorm capture and is INVALID. The correct locked rate is $0.009/msg as shown below.

| | Cost |
|---|---|
| NR pays Telnyx (hard cost) | $0.007/text |
| Rep pays NR | $0.009/text |
| NR margin | $0.002/text |

**Wallet rules:**
- Rep pre-loads wallet via Stripe before any texts can be sent
- Every text auto-deducts $0.009 from wallet
- No wallet balance = no texts sent (hard stop)
- Wallet auto-recharges when balance hits low threshold (TBD during build)

**Email:** Fully included in monthly platform subscription. Never charged separately.

**Rep dashboard — SMS billing tracker (build requirement):**

| Texts sent | Cost to rep |
|---|---|
| 25 texts | $0.23 |
| 50 texts | $0.45 |
| 100 texts | $0.90 |
| 200 texts | $1.80 |
| 500 texts | $4.50 |
| 1,000 texts | $9.00 |

**Competitive position:** Shout and Project Broadcast charge $0.04–$0.05/msg. SS charges $0.009.

---

## SMS Automation Model — Locked (Session #12)

**Automated (show-triggered):**
- 1 SMS per scheduled show (pre-show reminder, 15 or 30 min out — TBD at build)
- 1 email per scheduled show
- Pre-approved templates — no content screening

**Manual (rep-composed via Thumper):**
- 3 SMS per week cap
- 3 emails per week cap
- AI content screening before every manual send
- Cap enforced by Thumper

**Removed from MVP:** Diamond/unicorn reveal blast.

---

## Thumper API Cost Model — Locked (Session #13)

**Model strategy:**
- Default: Haiku 4.5 for all routine interactions
- Escalate to Sonnet 4.6 for: content screening, complex scheduling, onboarding flows
- Prompt caching on system prompt from day one

**Monthly NR cost per rep:**

| Activity Level | Interactions/mo | NR Cost/mo |
|---|---|---|
| Moderate | ~800 | ~$1.80 |
| Heavy | ~2,000 | ~$4.50 |
| Power user | ~4,000 | ~$8.50 |
| Chatbot abuser | ~8,000+ | ~$18–25+ |

**Scope lock:** 10 allowed domains. System prompt enforces. Warm redirect for out-of-scope. Log all interactions from day one.

---

## Thumper Agent Architecture — Locked (Session #15)

Architecture fully designed in dedicated Opus session. Six components:

1. **Brain** — Claude API. System prompt (identical for all reps) + rep-specific data from Supabase.
2. **Hands** — 15–25 defined tools (add_calendar_event, create_trade_listing, etc.). Vercel AI SDK tool-calling. Each tool talks to Supabase. Thumper can only use defined tools.
3. **Voice** — Concise, warm, plain language responses. No tech jargon. No walls of text.
4. **Memory** — Rep notes table in Supabase (timestamp, rep ID, short text). Thumper writes summary at end of each conversation. Next conversation, notes pulled so Thumper "remembers" the rep. LAUNCH FEATURE. No vector search at launch.
5. **Security** — Supabase RLS. Secure token per rep. Database filters automatically. Admin role for Louis.
6. **Error Handling** — Three tiers: temporary (retry), bad input (explain), system failure (friendly message + auto-ticket to Louis).

**Orchestration:** Vercel AI SDK streamText with tool-calling, Next.js API route, same deployment as yoursparklesuite.com.

**Conversation context:** Full transcript per message. Oldest dropped when too long. System prompt + rep profile never dropped. Between sessions = fresh start. Persistent memory via notes table.

**Multi-step workflows:** Claude handles via natural conversation. Nothing saved until all pieces collected. Rep can bail midway safely. Photo QA pre-flight runs inline.

See SS_KB_Core_v1.6 for full architectural detail.

---

## Jewelry Database — Three-Table Data Model (Session #16)

See SS_KB_Core_v1.6 for complete data model specification. Summary:

- **`collections`** — Ever-growing table. Name + year uniquely identifies each collection. Types: recurring, seasonal, specialty. Status: active, retired.
- **`jewelry_designs`** — One row per unique BP design. IS the jewelry database. Key fields: collection_id, jewelry_type, item_number (or NR-assigned), material, bp_msrp, is_unicorn, is_diamond.
- **`trade_listings`** — One row per rep listing. Many listings → one design. IS the trade board.

**MSRP:** Single field, BP's stated value only. No competing valuation.

**Rarity:** Unicorn and diamond boolean tags only at launch. No scoring system. Broader rarity intelligence is post-launch.

**Dedup:** Item number first (if BP provides one), then collection + type + material + MSRP fallback, then fuzzy description match. Rep confirms matches via Thumper.

**Filtering:** Hard requirement. Collection, type, material, MSRP range, rarity, size. Extensible. Mobile-first pill bar UX.

---

## Live Show Trade Flow — Decided (Session #16)

Full flow: customer browses trade board → picks piece → enters MSRP → submits → Thumper pings rep → rep approves/rejects → approved pieces disappear immediately.

**Trades only at launch.** No buying, no trade-ups with cash. Equal or lesser MSRP. Rep sets tolerance. Customer self-reports MSRP. System checks. Rep verifies post-show.

See SS_KB_Core_v1.6 for full detail.

---

## Lindsey Prototype — Decided (Session #16)

Trade board prototype MUST include Thumper. Scope: trade board page + Thumper as rep interface + customer-facing reserve flow + real-time notifications. NOT included: full dashboard, AI photo enhancement, dedup logic, multi-rep features, library view, voice, SMS/email.

**Pre-build blockers:** Gaps 20–23 must be resolved first.

See SS_KB_Core_v1.6 for full prototype specification.

---

## SEO/GEO Multi-Tenant — Research Complete (Session #16)

Gap 15 / OQ-28 Gemini research received and analyzed. Key findings captured in SS_KB_Core_v1.6. Implementation details are build-phase items. No open questions blocking build.

Priority matrix: P0 = dynamic sitemaps/robots.txt + host-based routing. P1 = localized schema + llms.txt. P2 = native markdown serving + B2B content hub. P3 = central catalog indexing.

---

## Thumper Scope Lock — Locked (Session #13)

10 allowed domains. System prompt mechanism. Warm redirect script for out-of-scope. Full system prompt drafting = open build item (dedicated design session ~30–45 min).

---

## Hero Image Strategy — Locked (Session #13)

AI-generated primary (Midjourney, Adobe Firefly). Canva Pro secondary. No stock photo subscription. Video hero sections in parking lot — evaluate during site template build.

---

## BP TAM — Validated (Session #13)

Active rep TAM: 20K–50K. 5% penetration at $29–$49/mo = $29K–$49K ARR. 10% = $58K–$98K ARR. Business model validated.

---

## Key Decisions Made Sessions #11–16

### Onboarding Workflow (B3) — Full Pipeline
Seven-step agentic pipeline from landing page intake through agentic build. See SS_KB_Core_v1.6 for full detail.

### Three Payment/Agreement Gates (F8)
Gate 1: Agreement signed. Gate 2: Start fee paid. Gate 3: Launch fee paid. All automated, no exceptions.

### Domain Ownership Policy (P4)
NR-purchased domains = NR property forever. Rep-owned domains = rep keeps on exit.

### Thumper — Locked Decisions
- Internal name: Thumper. Rep-facing: rep names their own instance.
- Text-first at launch. Voice post-launch roadmap.
- Wispr Flow recommended to reps for voice-to-text input.
- Scope locked to 10 allowed domains via system prompt.
- Personality: concise, warm, plain language, no walls of text. (Session #15)
- Agent architecture: FULLY RESOLVED (Session #15). Six components locked. Vercel AI SDK orchestration. Rep notes table as launch feature.
- Self-service tech support: Thumper handles ALL routine platform setup for reps. Louis is for escalations only. (Session #16)

### Launch Standard
All automations live before client #6. No partial launches.

### Grandfathered Clients — Readdy (B4)
All 5 current clients stay on Readdy indefinitely. $20/mo maintenance. Readdy = Plan B.

### AI Photo Enhancement (Gap 4 — Session #14)
Photoroom primary, Claid backup. One vendor in production. Two-layer QA system in principle.

### Rep Photography Kit (Session #14 — IN PROGRESS)
DUCLUS lightbox ordered for testing. If passes Saturday test: bake into start fee, determine fulfillment.

### Voice Interface (Gap 6 — Session #14)
Text-first at launch. Voice deferred. Wispr Flow companion recommendation for reps.

### Thumper Agent Architecture (Gap 6 — Session #15)
Six-component architecture locked. Brain (Claude API), Hands (15–25 tools via Vercel AI SDK), Voice (concise/warm), Memory (rep notes table — launch feature), Security (Supabase RLS), Error Handling (three-tier graceful failure + auto-tickets). Orchestration via Vercel AI SDK streamText in Next.js API route.

### Jewelry Database (Gap 16 — Session #16)
Three-table data model: collections (ever-growing), jewelry_designs (one per unique design), trade_listings (one per rep listing). MSRP = BP's number only. Rarity = unicorn/diamond tags at launch. Dedup via item number or attribute matching with rep confirmation.

### Trade Board Live Show Flow (Session #16)
Trades only at launch. Customer browses → reserves → rep approves/rejects via Thumper mid-show. Approved = piece disappears. Equal or lesser MSRP with rep-configurable tolerance.

### Lindsey Prototype (Session #16)
Must include Thumper. Trade board + chatbot + customer reserve flow + real-time notifications. Pre-build blockers: Gaps 20–23.

### SEO/GEO (Gap 15 — Session #16)
Research complete. Schema upgrades needed (LocalBusiness, VirtualLocation, Event, ProfessionalService). ISR/SSG rendering confirmed. Markdown for Agents native via WASM. B2B content hub → parking lot.

---

## What's Grey — Needs Research or Decisions

- Platform subscription pricing (monthly/quarterly/annual/forever amounts)
- Start fee amount (includes photography kit cost)
- Launch fee amount
- Custom work pricing
- AI photo enhancement QA implementation (Layer 1 pre-flight criteria + Layer 2 backend inspector)
- Photography kit standardization (pending Saturday April 12 test)
- Photography kit fulfillment method (manual vs. automated trigger)
- Photography kit bulk pricing (Amazon Business or manufacturer wholesale at volume)
- Voice interface (deferred post-launch — Wispr Flow as interim recommendation)
- Thumper capability boundaries (Gap 14 — deferred to build phase)
- Branding menu details (exact font/color/template options)
- Business card vendor + AI design tool (Gap 13 — targeted research sprint)
- Annual + forever cancellation/refund policy (L6 research sprint)
- Service agreement (L1 research sprint)
- Gemini transcript hook method for onboarding pipeline
- Pre-meeting intel agent scope
- Check-in cadence during build phase
- Wallet auto-recharge threshold amount (TBD during build)
- Hero image AI generation workflow (agentic generation + human review loop — define during build)
- Video hero section feasibility (parking lot — evaluate during site template build)
- Thumper full system prompt draft (dedicated design session before build)
- Wispr Flow affiliate partnership (future opportunity — post-launch)
- Thumper tool definitions — exact list of 15–25 tools (define during build spec)
- Thumper model routing logic — how to classify requests for Haiku vs Sonnet (define during build)
- Rep notes table schema details — note length limits, retention policy, max notes per conversation (define during build)
- BP item number / style name consistency (Gap 20 — ask Lindsey)
- Customer-facing trade request form UX (Gap 21 — design session)
- Thumper trade board tool schemas (Gap 22 — Opus design session)
- Thumper live show notification mechanism (Gap 23 — research + design)
- Full filterable attribute list for trade board and library (research or Q&A with reps)
- B2B content hub for yoursparklesuite.com (parking lot — post-launch)

---

## Parking Lot — Ideas to Revisit Later

| Idea | Status | Notes |
|------|--------|-------|
| Template swapping | PARKING LOT | Seasonal/holiday themes, paid on demand. Post-launch. |
| Hiring trigger | PARKING LOT | Prerequisites: revenue supports it + Louis feels the pain. |
| Niche replication | PARKING LOT | Theoretically replicable to other direct-sales companies. Post-SS-success. |
| BP API approach | PARKING LOT | Build first, approach from strength. |
| Annual/Forever cancellation policy | L6 RESEARCH SPRINT | Monthly + quarterly LOCKED. Annual/Forever needs research. |
| Newsletter | PARKING LOT | Monthly, clients only, AI-drafted. No architecture decisions made. |
| Rep streaming support service | PARKING LOT | Future idea — not defined. |
| Bomb Party API access | PARKING LOT | Server-side data pull eliminates Chrome extension. Build first. |
| Master customer trade board | PARKING LOT | After rep trade board is built. |
| Collection showcase | PARKING LOT | Customer-facing future feature. |
| Community social feed | PARKING LOT | Customer-facing future feature. |
| Smarter SMS budgeting tools | PARKING LOT | Build after launch based on real usage data and rep feedback. |
| General assistant mode for Thumper | PARKING LOT | Evaluate post-launch based on usage logs. Could be a paid add-on tier. |
| Video hero sections | PARKING LOT | Evaluate during site template build phase. Autoplay/no-sound looping video. |
| Voice interface for Thumper | PARKING LOT | Post-launch roadmap. Wispr Flow is the interim bridge. |
| Wispr Flow affiliate partnership | PARKING LOT | Explore when rep base is established. |
| Photography kit bulk pricing | PARKING LOT | Amazon Business or manufacturer wholesale — evaluate at volume. |
| Photography kit fulfillment automation | PARKING LOT | Automated trigger per new rep signup — design when volume justifies. |
| Thumper vector search memory | PARKING LOT | Upgrade from simple notes table to embeddings/vector retrieval. Post-launch based on data. |
| Trade board buying (outright purchase) | PARKING LOT | Trades only at launch. Buying off the trade board is a future feature. (Session #16) |
| Trade-up with cash (pay the difference) | PARKING LOT | Trades only at launch. Customer pays difference for higher-value piece is future. (Session #16) |
| B2B content hub for yoursparklesuite.com | PARKING LOT | Needed for SEO ranking beyond brand terms. Not launch requirement. (Session #16) |
| Rarity scoring system | PARKING LOT | Needs volume data. Unicorn/diamond tags available at launch. Broader scoring post-launch from accumulated trade data. (Session #16) |
| Visual similarity matching for dedup | PARKING LOT | Image embedding + vector search. Phase 2 when database is large enough. Text matching handles 80%+ at launch. (Session #16) |

---

## Known Problems & Pain Points

### Operational
1. Everything is manual — site builds, updates, billing, support
2. Readdy dependency — sites live on third-party infrastructure (staying for maintenance only)
3. Google Calendar dependency — being eliminated (native calendar in progress)
4. No monitoring — no way to know if a site goes down or automation breaks
5. Support is ad hoc — no ticket system, no SLAs

### Product
6. Live Reveal Queue is broken — Chrome extension rebuild running parallel to dashboard build
7. No trade board — most demanded feature
8. Sites are static brochure-ware with a calendar
9. Chrome extension doesn't work for phone-only reps (long-term fix = BP API)
10. Hero image sourcing is a manual time sink — no agentic solution yet
11. Rep photo quality is inconsistent — photography kit + Thumper pre-flight coaching addresses this
12. Rep screen real estate during live shows — BP dashboard + Sparkle Suite compete for space (Session #16)

### Business
13. 5 clients, not 100 — path to scale is planned (one per week post-launch)
14. No marketing engine — word-of-mouth only (by design)
15. Bri owes launch fee — resolved going forward via three-gate system
16. Social media branding promised to 3 clients — being walked back (discounted business cards as makeup)
