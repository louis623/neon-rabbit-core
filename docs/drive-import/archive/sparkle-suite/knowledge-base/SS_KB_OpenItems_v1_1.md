# Sparkle Suite — KB Module: Open Items

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Every gap analysis or research session that resolves or adds items

**Version:** 1.1 | **Derived from:** SS_KB_OpenItems_v1.0 | **Last Updated:** April 8, 2026
**Status:** Gap Analysis Session #11 complete. Categories 2–5 fully worked. 9 research sprints remaining. 3 deferred. B4 pending Louis answer.

**COMPANION MODULES:**
- SS_KB_Core_v1.0.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec (all 4 pages)
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Gap Analysis Status

**Total knowledge gaps identified:** 19 (Category 1) + process/legal/risk/pain gaps (Categories 2–5)
**Category 1 resolved in Sessions #9–11:** 6 closed + 3 deferred + ongoing
**Category 1 remaining research sprints:** 9
**Categories 2–5:** COMPLETE as of Session #11

### Resolved Gaps (Sessions #9–11)
1. ~~Vercel custom domain limits~~ → CLOSED. Pro plan supports 100,000 domains.
2. ~~TCPA/CAN-SPAM compliance~~ → RESEARCHED, parked for legal review.
3. ~~Footer disclaimer language~~ → RESEARCHED, parked for legal review.
4. ~~Monthly + quarterly cancellation policy~~ → LOCKED. No refund, service through end of period.
5. ~~neonrabbit.net treatment~~ → DECIDED. Minimal brand page on Readdy with redirects.
6. ~~"Powered by" link destination~~ → CLOSED. Points to yoursparklesuite.com rep-facing homepage.
7. ~~B1 Build sequence philosophy~~ → RESOLVED. Thumper + dashboard first. Formal build sequence session before Claude Code.
8. ~~B3 First-rep onboarding workflow~~ → RESOLVED. Full pipeline decided (see Onboarding Workflow section below).
9. ~~F1 + Gap 6 Chatbot quality risk~~ → MERGED. Combined research sprint: voice options + latency + jewelry vocab + fallback architecture.
10. ~~F3 Chrome extension rebuild~~ → RESOLVED. Parallel workstream during dashboard build.
11. ~~F8 Payment before launch~~ → RESOLVED. Three hard gates (see Gates section).
12. ~~L4 ToS / Privacy Policy~~ → RESOLVED. Best-practices boilerplate at build, attorney review later.
13. ~~P1 Feature readiness script~~ → RESOLVED. Launch standard solves it — all automations live before client #6.
14. ~~P2 Custom request rejection~~ → RESOLVED. Thumper script + Louis escalation fallback.
15. ~~P4 Rep exit / offboarding~~ → RESOLVED. Domain ownership policy locked (see Domain Policy section).
16. ~~P8 Referral pipeline before ready~~ → RESOLVED. Waitlist via Thumper on landing page, email sequence, first come first served.

### Deferred Gaps
| # | Gap | Deferred Until |
|---|-----|---------------|
| 10 | BP community trade board examples | After rep trade board is built and understood |
| 12 | Lindsey revenue data | After Gap 19 (cost modeling) + Gap 11 (TAM) complete |
| 14 | Thumper capability boundaries | During Thumper build phase — can't define until built |
| B4 | Grandfathered client Readdy migration | Louis has answer — capture next session |

### 9 Remaining Research Sprints

| # | Gap | Method | Status |
|---|-----|--------|--------|
| 1 | SMS/Email provider selection | Gemini deep research | OPEN |
| 4 | AI photo enhancement vendor | Gemini deep research | OPEN |
| 5 | Chatbot (Thumper) API cost modeling | Web research / Anthropic docs | OPEN |
| 6 | Voice interface / Thumper (merged F1) | Gemini deep research | OPEN |
| 7 | Stock photo subscription | Web research | OPEN |
| 11 | BP TAM hard numbers | Web research / FTC filings | OPEN |
| 15 | SEO/GEO multi-tenant sub-sites (OQ-28) | Gemini deep research | OPEN |
| 16 | Jewelry database deduplication | Design session | OPEN |
| 19 | Infrastructure cost modeling | Spreadsheet model + research | OPEN |

---

## Legal Research Sprint Queue (All Items)

**STANDING RULE:** Every legal item gets a Gemini research sprint before any language is written. No exceptions. Attorney review of all items in one consolidated session when revenue supports it.

| # | Item | Method | Status |
|---|------|--------|--------|
| L1 | Service agreement best practices for SaaS | Gemini research sprint | OPEN |
| L2 | FTC income claim compliance for MLM recruitment pages | Gemini research sprint | OPEN |
| L3 | Bomb Party trademark usage on a commercial platform | Gemini research sprint | OPEN |
| L4 | ToS + Privacy Policy boilerplate | Gemini research sprint | OPEN |
| L5 | Trade board listing-only platform liability disclaimer | Gemini research sprint | OPEN |
| L6 | Annual + Forever cancellation/refund policy standards | Gemini research sprint | OPEN |

---

## Key Decisions Made Session #11

### Onboarding Workflow (B3) — Full Pipeline
1. **Landing page intake** — Thumper (external, no login) handles conversation instead of static form. Collects: name, phone, email, show URLs, Linktree, current website, what they're looking for.
2. **Scheduling** — Thumper books Google Meet from Louis's live availability. Louis gets notified.
3. **Pre-meeting intel** — Agent scrubs social media, show URLs, public info. Compiles branding signals, show flow, typical hours. Output ready in NR HQ dashboard before meeting.
4. **Google Meet** — Louis presents product, pricing, branding menu. Gemini transcribes. Branding selections made from menu during meeting.
5. **Post-meeting (if yes)** — Agent processes transcript → builds site plan. Sends service agreement (SignWell) + start work fee link (Stripe).
6. **Gates fire** — Agreement signed + start fee paid = build trigger. Launch fee paid = go live trigger.
7. **Build phase** — Agentic build with client check-ins + Louis QA check-ins. Hero section: agent first, human loop fallback.

**Open build items within workflow:**
- Branding menu design (font/color/template options)
- Pre-meeting intel agent scope definition
- Gemini transcript hook method (Drive vs email vs webhook)
- Service agreement template (legal consult scope)
- Check-in cadence and format

### Three Payment/Agreement Gates (F8)
- **Gate 1:** User agreement signed (SignWell) — required before any work starts
- **Gate 2:** Start work fee received (Stripe) — required before any work starts
- **Gate 3:** Launch fee received (Stripe) — required before site goes live
- All automated hooks. No manual overrides. No exceptions.

### Domain Ownership Policy (P4)
- NR purchases domain → NR owns it. Non-negotiable. Explicit in user agreement.
- Rep brings own domain → rep keeps it on exit.
- NR does NOT proactively offer "bring your own domain" in sales meetings.
- Rep's personal content: exportable on request at exit.
- NR code/design/templates: always NR property.

### Thumper (Chatbot) — Session #11 Decisions
- Internal name: **Thumper**. JARVIS reference retired everywhere.
- Rep-facing: each rep names their own instance (Supabase profile string field).
- Voice is the goal. Text fallback if voice quality bar not met at launch. Switch is manual.
- Voice + Thumper capability = combined research sprint (Gap 6 + F1).

### Launch Standard
- All automations live before onboarding client #6.
- No partial launches. Ship complete or don't ship.
- Continuous improvement post-launch is expected and ongoing.

### Waitlist
- Thumper on landing page collects prospective rep info before platform is ready.
- Automated email sequence keeps waitlist warm with progress updates.
- First come first served when platform goes live.
- Waitlist entries stored in Supabase.

### Business Card Pipeline (Gap 13)
- Current: Canva manual design, ~$105 cost, ~$125 to rep, 1,000 cards.
- Vision: Agent generates design from rep's site branding. Third-party print vendor handles fulfillment. NR never touches physical product.
- Reorder flow: rep confirms address + pays invoice → trigger → reprints + ships.
- Research sprint: print vendor API options (MOO, Printful, Canva Print, Vistaprint) + AI card design tools.

---

## What's Grey — Needs Research or Decisions

- Actual monthly/quarterly/annual/forever pricing numbers
- Start fee amount
- Launch fee amount
- Custom work pricing
- SMS/email provider selection (Gap 1)
- AI photo enhancement provider (Gap 4)
- Thumper API cost modeling (Gap 5)
- Voice interface implementation (Gap 6)
- Thumper capability boundaries (Gap 14 — deferred)
- Branding menu details (exact font/color/template options)
- Go-to-market readjustment triggers
- SEO/GEO for sub-sites (Gap 15 / OQ-28)
- Stock photo subscription (Gap 7)
- Business card vendor + AI design tool (Gap 13 — research sprint)
- Annual + forever cancellation/refund policy (L6 research sprint)
- TAM hard numbers (Gap 11)
- Service agreement (L1 research sprint)
- Piece deduplication logic (Gap 16)
- Infrastructure cost modeling (Gap 19)
- Markdown for Agents native implementation (sub-topic of OQ-28)
- Gemini transcript hook method for onboarding pipeline
- Pre-meeting intel agent scope
- Check-in cadence during build phase
- B4: Grandfathered client Readdy migration path (Louis has answer)

---

## Parking Lot — Ideas to Revisit Later

| Idea | Status | Notes |
|------|--------|-------|
| Template swapping | PARKING LOT | Seasonal/holiday themes, paid on demand. Architecture supports it naturally. Revenue opportunity. Post-launch. |
| Hiring trigger | PARKING LOT | Prerequisites: revenue supports it + Louis feels the pain. |
| Niche replication | PARKING LOT | Theoretically replicable to other direct-sales companies. Post-SS-success. |
| BP API approach | PARKING LOT | Build first, approach from strength. |
| Annual/Forever cancellation policy | L6 RESEARCH SPRINT | Monthly + quarterly LOCKED. Annual/Forever needs research then brainstorming. |
| Newsletter | PARKING LOT | Monthly, clients only, AI-drafted. No architecture decisions made. |
| Rep streaming support service | PARKING LOT | Future idea — not defined. |
| Bomb Party API access | PARKING LOT | Server-side data pull eliminates Chrome extension. Build first. |
| Master customer trade board | PARKING LOT | After rep trade board is built. |
| Collection showcase | PARKING LOT | Customer-facing future feature. |
| Community social feed | PARKING LOT | Customer-facing future feature. |

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

### Business
10. 5 clients, not 100 — path to scale is planned (one per week post-launch)
11. No marketing engine — word-of-mouth only (by design)
12. Bri owes launch fee — resolved going forward via three-gate system
13. Social media branding promised to 3 clients — being walked back (discounted business cards as makeup)
