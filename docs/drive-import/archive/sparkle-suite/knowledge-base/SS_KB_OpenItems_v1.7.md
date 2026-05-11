# Sparkle Suite — KB Module: Open Items

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Every gap analysis or research session that resolves or adds items

**Version:** 1.7 | **Derived from:** SS_KB_OpenItems_v1.6 | **Last Updated:** April 9, 2026
**Status:** Gap Analysis Session #17 complete. Legal sprints L1–L5 RESEARCH COMPLETE. L6 (annual + forever cancellation) carries to next session. All L1–L5 findings captured to Open Brain. Key build requirements identified. Attorney session agenda compiled.

**COMPANION MODULES:**
- SS_KB_Core_v1.7.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec (all 4 pages)
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Gap Analysis Status

**Total knowledge gaps identified:** 23 (19 original + 4 new from Session #16)
**Resolved Sessions #9–16:** 14 closed + 4 deferred + 1 partially resolved
**New gaps (Session #16):** 4 pre-build blockers for trade board prototype (Gaps 20–23)
**Remaining:** 4 new gaps + 1 legal sprint (L6)
**Categories 2–5:** COMPLETE as of Session #11

### Resolved Gaps (Sessions #9–16)
1. ~~Vercel custom domain limits~~ → CLOSED. Pro plan supports 100,000 domains.
2. ~~TCPA/CAN-SPAM compliance~~ → RESEARCHED, parked for legal review.
3. ~~Footer disclaimer language~~ → RESEARCHED, parked for legal review.
4. ~~Monthly + quarterly cancellation policy~~ → LOCKED. No refund, service through end of period.
5. ~~neonrabbit.net treatment~~ → DECIDED. Minimal brand page on Readdy with redirects.
6. ~~"Powered by" link destination~~ → CLOSED. Points to yoursparklesuite.com rep-facing homepage.
7. ~~B1 Build sequence philosophy~~ → RESOLVED. Thumper + dashboard first.
8. ~~B3 First-rep onboarding workflow~~ → RESOLVED. Full pipeline decided.
9. ~~B4 Grandfathered client migration~~ → RESOLVED. Stay on Readdy indefinitely.
10. ~~F1 + Gap 6 Chatbot quality risk / voice / agent architecture~~ → FULLY RESOLVED. Voice deferred. Thumper architecture locked (Session #15).
11. ~~F3 Chrome extension rebuild~~ → RESOLVED. Parallel workstream during dashboard build.
12. ~~F8 Payment before launch~~ → RESOLVED. Three hard gates.
13. ~~L4 ToS / Privacy Policy~~ → RESOLVED. Best-practices boilerplate at build, attorney review later.
14. ~~P1 Feature readiness script~~ → RESOLVED. Launch standard solves it.
15. ~~P2 Custom request rejection~~ → RESOLVED. Thumper script + Louis escalation fallback.
16. ~~P4 Rep exit / offboarding~~ → RESOLVED. Domain ownership policy locked.
17. ~~P8 Referral pipeline before ready~~ → RESOLVED. Waitlist via Thumper on landing page.
18. ~~Gap 1 SMS/Email provider + billing~~ → RESOLVED. Telnyx + Resend. Wallet model locked.
19. ~~Gap 19 Infrastructure cost modeling~~ → DEFERRED to pre-launch.
20. ~~Gap 5 Thumper API cost modeling~~ → RESOLVED. Haiku 4.5 default, Sonnet 4.6 escalation.
21. ~~Gap 7 Stock photo subscription~~ → RESOLVED. AI-generated + Canva Pro mix.
22. ~~Gap 11 BP TAM hard numbers~~ → RESOLVED. Active rep TAM estimated 20K–50K.
23. ~~Gap 15 SEO/GEO multi-tenant sub-sites~~ → RESEARCH COMPLETE (Session #16).
24. ~~Gap 16 Jewelry database deduplication~~ → DESIGN COMPLETE (Session #16).

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
| 4 | AI photo enhancement vendor | VENDOR SELECTED — Photoroom primary, Claid backup. Two-layer QA system decided in principle. | QA implementation details need dedicated design session. 5 pre-build open questions remain. Photography kit test pending (DUCLUS not yet tested). |

### New Gaps — Pre-Build Blockers for Trade Board Prototype (Session #16)
| # | Gap | Method | Status | Notes |
|---|-----|--------|--------|-------|
| 20 | BP item number / style name confirmation | Ask Lindsey | OPEN — BLOCKING | Do BP pieces consistently have an item number or style name on the reveal box/tag? Determines whether dedup is simple (item number match) or complex (multi-attribute fuzzy matching). |
| 21 | Customer-facing trade request form design | Quick design session | OPEN | Exact fields, UX flow, experience for the "I want this" form. |
| 22 | Thumper trade board tool definitions | Opus design session (~30–45 min) | OPEN | Specific tool schemas (parameters, return values, error handling). Must be done before Claude Code. |
| 23 | Thumper live show notification mechanism | Targeted research + design decision | OPEN | How does Thumper ping the rep mid-show? Screen real estate problem. |

**Dependencies:** Gap 20 (item number) should be answered FIRST — it affects Gaps 21 and 22. Gap 23 can be researched in parallel.

---

## Legal Research Sprint Queue

**STANDING RULE:** Every legal item gets a Gemini research sprint before any language is written. No exceptions. Attorney review in one consolidated session when revenue supports it.

| # | Item | Method | Status |
|---|------|--------|--------|
| L1 | Service agreement best practices for SaaS | Gemini deep research | ✅ RESEARCH COMPLETE — findings in Open Brain |
| L2 | FTC income claim compliance for MLM recruitment pages | Gemini deep research | ✅ RESEARCH COMPLETE — findings in Open Brain |
| L3 | Bomb Party trademark usage on a commercial platform | Gemini deep research | ✅ RESEARCH COMPLETE — findings in Open Brain |
| L4 | ToS + Privacy Policy boilerplate | Gemini deep research | ✅ RESEARCH COMPLETE — findings in Open Brain |
| L5 | Trade board listing-only platform liability disclaimer | Gemini deep research | ✅ RESEARCH COMPLETE — findings in Open Brain |
| L6 | Annual + Forever cancellation/refund policy standards | Gemini deep research | OPEN — prompt written, Gemini limit hit Session #17. Fire next session. |

### Legal Sprint Key Findings Summary (for quick reference)

**L1 — Service Agreement:**
- Florida auto-renewal statute (Fla. Stat. § 501.165): 30–60 day advance notice for annual plans; cancel as easy as signup
- Liability cap: 12 months of fees paid preceding the claim
- Consequential damages waiver: exclude lost profits + business interruption (ALL CAPS)
- TCPA burden shifts to rep via warranty + indemnification clause
- Thumper AI four-part disclaimer: as-is / human-in-the-loop / rep responsible for actions / NR not liable for hallucinations
- Venue: "state or federal courts located in Duval County, Florida" — exact language
- Gate 1 click-wrap must generate audit trail (IP, timestamp, document hash)

**L2 — FTC Income Claims:**
- "Means and instrumentalities" doctrine: primary risk. Platform tools enabling deceptive claims = NR liability.
- Rep warrants FTC + BP policy compliance in ToS
- Rep indemnifies NR against FTC/third-party claims from their content
- BP IDS link required on Join My Team page (build requirement)
- Prohibited language for Thumper screening: "financial freedom," "passive income," "quit your 9-to-5," "unlimited income potential," "luxury lifestyle"
- BP Policy Section 7.1: UNVERIFIED — confirm against actual BP rep agreement

**L3 — BP Trademark:**
- Nominative fair use confirmed: "Bomb Party" in plain text is defensible
- No logos/trade dress ever — SS main site and all rep sites
- Database photos: rep submissions only, never scraped from BP
- Thumper: synthesize in own words, never regurgitate BP copy verbatim
- Do not ingest BP proprietary materials into Thumper knowledge base
- "Social Sparkle Suite" conflict: confirmed non-issue (Louis searched, nothing found)
- Three-part non-affiliation disclaimer: build requirement for SS footer + rep site footers

**L4 — ToS + Privacy Policy:**
- A2P 10DLC: NR registers as CSP with TCR before first SMS sent — PLATFORM LAUNCH CHECKLIST
- Anthropic API: not used for training by default — state explicitly in privacy policy
- Photoroom API: excluded from model improvement — state explicitly
- DPAs with all vendors at build time: Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog
- FIPA: 30-day breach notification, 500+ persons triggers FL Dept of Legal Affairs, up to $500k penalty
- PostHog flags for Claude Code: disable IP capture, ph-no-capture on sensitive inputs, mask session replay
- Opt-in forms: unchecked boxes enforced at UI level (build requirement)
- Mandatory individual arbitration clause in ToS

**L5 — Trade Board Liability:**
- Section 230 protection confirmed — NR is interactive computer service
- Mere facilitator status confirmed — never add fulfillment, payment, or commission to trade board
- Clickwrap at both points: listing (rep certifies ownership + MSRP) and request (customer acknowledges as-is) — BUILD REQUIREMENT
- IRS barter exchange classification: attorney opinion needed before launch — NEW ATTORNEY AGENDA ITEM
- Brand separation on UI: "Offered by [Rep Name], an Independent Bomb Party Representative" on all listings
- Thumper on trade board: logic executor only, never independent valuation or trade assessment
- Four disclaimer clauses ready for attorney refinement (in Open Brain)

---

## Build Requirements from Legal Sprints (Session #17)

These items must be incorporated into the build spec:

| Requirement | Source | Where It Lives |
|-------------|--------|---------------|
| Gate 1 click-wrap audit trail (IP + timestamp + document hash) | L1 | Onboarding flow |
| A2P 10DLC registration as CSP with TCR | L4 | Platform launch checklist |
| Anthropic API non-training disclosure | L4 | Privacy policy |
| Photoroom API non-training disclosure | L4 | Privacy policy |
| DPAs with all 6 vendors | L4 | Legal/vendor setup at build |
| One-page incident response protocol (FIPA) | L4 | Operations |
| PostHog: disable IP capture | L4 | Claude Code flag |
| PostHog: ph-no-capture on sensitive inputs | L4 | Claude Code flag |
| PostHog: mask session replay text inputs | L4 | Claude Code flag |
| Opt-in forms: unchecked boxes only | L4 | UI build requirement |
| Non-affiliation disclaimer on SS main site footer | L3 | Build requirement |
| Non-affiliation disclaimer on all rep site footers | L3 | Build requirement |
| Thumper AI notice in trade board context | L3 | Thumper system prompt |
| BP IDS link required on Join My Team page template | L2 | Page template build |
| Thumper content screening list (prohibited phrases) | L2 | Thumper system prompt |
| Database photos from rep submissions only | L3 | Data pipeline design |
| Clickwrap at point of listing | L5 | Trade board UI |
| Clickwrap at point of trade request | L5 | Trade board UI |
| Brand separation on all trade board listings | L5 | Trade board UI |

---

## Attorney Session Agenda (Accumulating)

| # | Item | Source | Notes |
|---|------|--------|-------|
| 1 | Service agreement framework | L1 | 9-section structure, Florida-specific clauses |
| 2 | FTC rep warranty + indemnification language | L2 | "Means and instrumentalities" exposure |
| 3 | BP Policy Section 7.1 verification | L2/L3 | Does BP prohibit third-party tools for recruitment? |
| 4 | Non-affiliation disclaimer language | L3 | Three-part framework ready for refinement |
| 5 | ToS + Privacy Policy drafting | L4 | Section frameworks in Open Brain |
| 6 | Trade board disclaimer clauses | L5 | Four clauses ready for refinement |
| 7 | IRS barter exchange classification opinion | L5 | Does trade board = barter exchange? |
| 8 | Annual + forever cancellation policy | L6 | After L6 research complete next session |

---

## AI Photo Enhancement — Open Items (Gap 4, Session #14)

**Vendor selected:** Photoroom primary, Claid.ai backup.

**Two-layer QA system (in principle):**
- Layer 1 — Thumper pre-flight: evaluates photo for minimum viability before Photoroom
- Layer 2 — Backend QA inspector: evaluates Photoroom output before database entry. Details TBD.

**Five open questions (resolve at pre-build vendor commitment):**
1. Hallmark preservation — do upscaling APIs preserve tiny hallmark text?
2. Video ingestion — frame extraction + enhancement for BP video reveals
3. Data residency — do Photoroom/Claid use uploaded images for model training? (L4 confirms Photoroom API excluded from model improvement)
4. SynthID watermarking — Google Vertex AI embeds SynthID; implications for database
5. Adobe Firefly rate limits — 4 RPM default may bottleneck high-volume trade board bursts

**Photography kit:** DUCLUS 12"x12" lightbox ordered ($29.99, CRI 95+, 120 LEDs, 8 backdrops). Test still pending — not yet completed.

---

## What's Grey — Needs Research or Decisions

- Platform subscription pricing (monthly/quarterly/annual/forever amounts)
- Start fee amount (includes photography kit cost)
- Launch fee amount
- Custom work pricing
- Annual + forever cancellation/refund policy (L6 research sprint — next session)
- AI photo enhancement QA implementation details
- Photography kit standardization (pending lightbox test)
- Photography kit fulfillment method and bulk pricing
- Voice interface (deferred post-launch)
- Thumper capability boundaries (Gap 14 — deferred)
- Branding menu details
- Business card vendor + AI design tool (Gap 13)
- Gemini transcript hook for onboarding pipeline
- Pre-meeting intel agent scope
- Check-in cadence during build phase
- Wallet auto-recharge threshold amount
- Hero image AI generation workflow
- Video hero section feasibility (parking lot)
- Thumper full system prompt draft
- Wispr Flow affiliate partnership (future)
- Thumper tool definitions — exact list of 15–25 tools
- Thumper model routing logic (Haiku vs Sonnet classification)
- Rep notes table schema details (note length, retention, max per conversation)
- BP item number / style name consistency (Gap 20 — ask Lindsey — BLOCKING)
- Customer-facing trade request form UX (Gap 21)
- Thumper trade board tool schemas (Gap 22 — Opus session)
- Thumper live show notification mechanism (Gap 23)
- Full filterable attribute list for trade board and library
- B2B content hub for yoursparklesuite.com (parking lot)
- BP Policy Section 7.1 — verify against actual BP rep agreement
- IRS barter exchange classification (attorney opinion before launch)

---

## Parking Lot — Ideas to Revisit Later

| Idea | Status | Notes |
|------|--------|-------|
| Template swapping | PARKING LOT | Seasonal/holiday themes, paid on demand. Post-launch. |
| Hiring trigger | PARKING LOT | Prerequisites: revenue supports it + Louis feels the pain. |
| Niche replication | PARKING LOT | Theoretically replicable to other direct-sales companies. Post-SS-success. |
| BP API approach | PARKING LOT | Build first, approach from strength. |
| Newsletter | PARKING LOT | Monthly, clients only, AI-drafted. No architecture decisions made. |
| Rep streaming support service | PARKING LOT | Future idea — not defined. |
| Bomb Party API access | PARKING LOT | Server-side data pull eliminates Chrome extension. Build first. |
| Master customer trade board | PARKING LOT | After rep trade board is built. |
| Collection showcase | PARKING LOT | Customer-facing future feature. |
| Community social feed | PARKING LOT | Customer-facing future feature. |
| Smarter SMS budgeting tools | PARKING LOT | Build after launch based on real usage data. |
| General assistant mode for Thumper | PARKING LOT | Evaluate post-launch based on usage logs. Could be paid add-on. |
| Video hero sections | PARKING LOT | Evaluate during site template build. |
| Voice interface for Thumper | PARKING LOT | Post-launch roadmap. Wispr Flow is interim bridge. |
| Wispr Flow affiliate partnership | PARKING LOT | Explore when rep base is established. |
| Photography kit bulk pricing | PARKING LOT | Evaluate at volume. |
| Photography kit fulfillment automation | PARKING LOT | Design when volume justifies. |
| Thumper vector search memory | PARKING LOT | Upgrade from simple notes table. Post-launch. |
| Trade board buying (outright purchase) | PARKING LOT | Trades only at launch. |
| Trade-up with cash | PARKING LOT | Trades only at launch. |
| B2B content hub for yoursparklesuite.com | PARKING LOT | Post-launch. |
| Rarity scoring system | PARKING LOT | Needs volume data. Tags only at launch. |
| Visual similarity matching for dedup | PARKING LOT | Phase 2 when database is large enough. |
| Authorized vendor status from BP | PARKING LOT | Contact BP Compliance when SS has traction. |

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
