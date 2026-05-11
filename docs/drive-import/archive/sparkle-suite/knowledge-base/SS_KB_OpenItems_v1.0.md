# Sparkle Suite — KB Module: Open Items

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Every gap analysis or research session that resolves or adds items

**Version:** 1.0 | **Derived from:** SS_Knowledge_Base_v1.9 (Sections 19, 35–37) | **Last Updated:** April 8, 2026
**Status:** Gap Analysis Session #9 complete. 13 gaps remaining. Categories 2–5 not yet presented.

**COMPANION MODULES:**
- SS_KB_Core_v1.0.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec (all 4 pages)
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Gap Analysis Status

**Total knowledge gaps identified:** 19
**Resolved in Session #9:** 6
**Remaining:** 13
**Categories 2–5:** NOT YET PRESENTED (build process/workflow/order, legal risks, failure points, pain points to get ahead of)

### Resolved Gaps (Session #9)
1. ~~Vercel custom domain limits~~ → CLOSED. Pro plan supports 100,000 domains per project. 100 reps = 0.1% of limit. Architecture validated.
2. ~~TCPA/CAN-SPAM compliance~~ → RESEARCHED, PARKED for legal review. Full requirements documented in SS_KB_Legal module. NR carries liability.
3. ~~Footer disclaimer language~~ → RESEARCHED, PARKED for legal review. Research-informed text drafted in SS_KB_Legal module.
4. ~~Monthly + quarterly cancellation policy~~ → LOCKED. No refund. Service through end of paid period.
5. ~~neonrabbit.net treatment~~ → DECIDED. Minimal brand page on Readdy with redirects to NR projects.
6. ~~"Powered by" link destination~~ → CLOSED. Points to rep-facing homepage of yoursparklesuite.com.

### 13 Remaining Knowledge Gaps

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1 | SMS/Email provider selection | OPEN | Research sprint: Twilio, Resend, alternatives. Pricing cannot finalize until selected. |
| 4 | AI photo enhancement vendor | OPEN | Research sprint: Pomelli, Photoroom, Claid.ai, Picsart API. Test with real BP jewelry photos. OCR bonus. |
| 5 | Chatbot API cost modeling | OPEN | Claude API Sonnet per-query costs at scale. Need to model for pricing. |
| 6 | Voice interface implementation | OPEN | Web Speech API vs cloud TTS/STT. Research sprint. |
| 7 | Stock photo subscription | OPEN | Quality lifestyle/aesthetic imagery, affordable, commercial license. Research sprint. |
| 10 | BP trade board examples | OPEN | Louis needs to look up the DIY trade board rep/tool. One known example in BP community. |
| 11 | BP TAM hard numbers | OPEN | FTC filings, income disclosures, active rep count, growth trajectory. Research sprint. |
| 12 | Lindsey revenue data | OPEN | ~$4K profit — timeframe unclear. Need to ask Lindsey's permission to use her dashboard data. |
| 13 | Business card pipeline | OPEN | Design and pricing TBD. Agentic workflow. |
| 14 | Chatbot capability boundaries | OPEN | What chatbot handles autonomously vs what escalates to NR. Need definition. |
| 15 | SEO/GEO multi-tenant (OQ-28) | OPEN | Full research sprint — 3 layers: multi-tenant rep sites, rep-facing landing page, future customer side. Includes Markdown for Agents / AI-readable content serving as sub-topic. |
| 16 | Jewelry database deduplication | OPEN | No BP SKU system exists. Need to design identification/matching approach. |
| 19 | Infrastructure cost modeling | OPEN | Hosting, SMS/email, AI photo, chatbot API, domain routing. Need for final pricing. |

---

## What's Grey — Needs Research or Decisions

- Actual monthly/quarterly/annual/forever pricing numbers
- Start fee amount
- Custom work pricing
- SMS/email provider selection (Gap 1)
- AI photo enhancement provider (Gap 4)
- Chatbot API cost modeling (Gap 5)
- Voice interface implementation (Gap 6)
- Chatbot capability boundaries (Gap 14)
- Branding menu details (exact options)
- Go-to-market readjustment triggers
- SEO/GEO for sub-sites (Gap 15 / OQ-28)
- Stock photo subscription (Gap 7)
- Business card pipeline (Gap 13)
- Trade board value tier system
- Annual + forever cancellation/refund policy (brainstorming session needed)
- TAM hard numbers (Gap 11)
- Service agreement (parking lot — draft when system exists)
- Piece deduplication logic (Gap 16)
- Infrastructure cost modeling (Gap 19)
- Markdown for Agents native implementation (folded into OQ-28)

---

## Research Sprint Items

Items that require external research — Gemini prompt, web research, or Louis manual lookup:

| Item | Method | Status |
|------|--------|--------|
| SMS/email provider comparison (Twilio, Resend, alternatives) | Gemini deep research | OPEN |
| ~~TCPA/CAN-SPAM compliance~~ | Web research | RESOLVED Session #9 |
| ~~Vercel custom domain limits~~ | Web research | RESOLVED Session #9 |
| AI photo enhancement service comparison | Gemini deep research | OPEN |
| Chatbot API cost modeling (Claude Sonnet at scale) | Web research / Anthropic docs | OPEN |
| Voice interface options (Web Speech API vs cloud TTS/STT) | Gemini deep research | OPEN |
| Existing trade board examples in BP community | Louis manual lookup | OPEN |
| TAM research (active BP rep count, BP financials/disclosures) | Web research / FTC filings | OPEN |
| BP rep spending habits (Lindsey dashboard data) | Ask Lindsey permission | OPEN |
| Infrastructure cost modeling for final pricing | Spreadsheet model + research | OPEN |
| Stock photo subscription (quality, affordable, commercial license) | Web research | OPEN |
| SEO/GEO for multi-tenant sub-sites (OQ-28) — 3 layers | Gemini deep research | OPEN |
| Markdown for Agents / AI-readable content serving | Sub-topic of OQ-28 | OPEN |
| Piece deduplication logic for jewelry database | Design session | OPEN |
| ~~Legal disclaimer language~~ | Web research | RESOLVED Session #9, parked for legal review |
| Business card pipeline design and agentic workflow | Design session | OPEN |
| Annual/forever cancellation policy | Brainstorming session | OPEN |

---

## Q&A Session Tracker

**Q&A SERIES IS COMPLETE** as of Session #8 (April 8, 2026). All 37 topics resolved.

**Remaining before SS_Master_Plan_v1.0.md:**
1. Research sprint: OQ-28 SEO/GEO for sub-sites (3 layers)
2. Any research gaps identified during plan compilation
3. Layout optimization review pass (trade board integration, mobile flow, section ordering) — deferred until after all research
4. Compile everything into SS_Master_Plan_v1.0.md

### Full Q&A Topic Status (Condensed)
All topics resolved as of Session #5-8. Key resolutions:
- Option A only (Option B eliminated Session #3)
- Single-tier pricing, payment frequency model (Session #2)
- Chatbot as primary interface (Session #2)
- Chatbot naming: rep-named string field (Session #5)
- Trade board = listing/reservation only (Session #2)
- Jewelry library = trade board database (Session #3)
- Cal.com dropped, native intake form (Session #5)
- Demo = video walkthrough (Session #5)
- All 4 cookie cutter site pages specced (Sessions #6-8)
- OQ-28 flagged as research sprint (Session #8)

---

## Parking Lot — Ideas to Revisit Later

| Idea | Status | Notes |
|------|--------|-------|
| Template swapping | PARKING LOT | Seasonal/holiday themes, paid on demand. Architecture supports it naturally (template = config value in Supabase). Revenue opportunity. Post-launch. |
| Hiring trigger | PARKING LOT | Prerequisites: revenue supports it + Louis feels the pain. Can't plan until operations create real pressure. |
| Niche replication | PARKING LOT | Theoretically replicable to other direct-sales companies. Depends on SS running smoothly, staffing, desire. |
| BP API approach | PARKING LOT | Build first, approach from strength. More clients = harder for BP to say no. Revisit when client count makes the ask a no-brainer. |
| Service agreement | PARKING LOT | Draft when system exists. Covers new pricing model and all features. |
| Annual/Forever cancellation policy | NEEDS BRAINSTORMING | Monthly + quarterly LOCKED. Annual: pro-rated refund? 90-day window? Forever: does it even exist? |
| Newsletter | PARKING LOT | Monthly, clients only, AI-drafted, same email provider as SS. No architecture decisions made. |
| Niche replication (other MLM/DS companies) | PARKING LOT | Pure "someday, maybe." Depends on SS success, staffing. |
| Rep streaming support service (human-staffed) | PARKING LOT | Future idea — not defined |
| Bomb Party API access | PARKING LOT | Server-side data pull eliminates Chrome extension entirely. Build first. |
| Master customer trade board | PARKING LOT | Future customer/collector-facing feature. Architect for later. |
| Collection showcase | PARKING LOT | Customer-facing future feature |
| Community social feed | PARKING LOT | Customer-facing future feature |

---

## Known Problems & Pain Points

### Operational
1. Everything is manual — site builds, updates, billing, support
2. Readdy dependency — sites live on third-party infrastructure (staying for maintenance only)
3. Google Calendar dependency — being eliminated (native calendar in progress)
4. No monitoring — no way to know if a site goes down or automation breaks
5. Support is ad hoc — no ticket system, no SLAs

### Product
6. Live Reveal Queue is broken — rebuild in progress
7. No trade board — most demanded feature
8. Sites are static brochure-ware with a calendar
9. Chrome extension doesn't work for phone-only reps

### Business
10. 5 clients, not 100 — path to scale is planned (one per week)
11. No marketing engine — word-of-mouth only (by design)
12. Bri owes launch fee — launched early, broke standard workflow
13. Social media branding promised to 3 clients needs to be walked back (discounted business cards as makeup)
