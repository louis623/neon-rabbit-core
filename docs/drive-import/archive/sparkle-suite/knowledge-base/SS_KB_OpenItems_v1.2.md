# Sparkle Suite — KB Module: Open Items

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Every gap analysis or research session that resolves or adds items

**Version:** 1.2 | **Derived from:** SS_KB_OpenItems_v1.1 | **Last Updated:** April 9, 2026
**Status:** Gap Analysis Session #12 complete. Gap 1 fully resolved. B4 resolved. Gap 19 deferred to pre-launch. 7 research gaps remaining. 4 deferred.

**COMPANION MODULES:**
- SS_KB_Core_v1.2.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec (all 4 pages)
- SS_KB_Clients_v1.0.md — Client roster and status
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation

---

## Gap Analysis Status

**Total knowledge gaps identified:** 19 (Category 1) + process/legal/risk/pain gaps (Categories 2–5)
**Resolved Sessions #9–12:** 8 closed + 4 deferred
**Remaining research sprints:** 7 open + 6 legal sprints
**Categories 2–5:** COMPLETE as of Session #11

### Resolved Gaps (Sessions #9–12)
1. ~~Vercel custom domain limits~~ → CLOSED. Pro plan supports 100,000 domains.
2. ~~TCPA/CAN-SPAM compliance~~ → RESEARCHED, parked for legal review.
3. ~~Footer disclaimer language~~ → RESEARCHED, parked for legal review.
4. ~~Monthly + quarterly cancellation policy~~ → LOCKED. No refund, service through end of period.
5. ~~neonrabbit.net treatment~~ → DECIDED. Minimal brand page on Readdy with redirects.
6. ~~"Powered by" link destination~~ → CLOSED. Points to yoursparklesuite.com rep-facing homepage.
7. ~~B1 Build sequence philosophy~~ → RESOLVED. Thumper + dashboard first. Formal build sequence session before Claude Code.
8. ~~B3 First-rep onboarding workflow~~ → RESOLVED. Full pipeline decided.
9. ~~B4 Grandfathered client migration~~ → RESOLVED. Stay on Readdy indefinitely. No migration planned.
10. ~~F1 + Gap 6 Chatbot quality risk~~ → MERGED into combined research sprint.
11. ~~F3 Chrome extension rebuild~~ → RESOLVED. Parallel workstream during dashboard build.
12. ~~F8 Payment before launch~~ → RESOLVED. Three hard gates.
13. ~~L4 ToS / Privacy Policy~~ → RESOLVED. Best-practices boilerplate at build, attorney review later.
14. ~~P1 Feature readiness script~~ → RESOLVED. Launch standard solves it.
15. ~~P2 Custom request rejection~~ → RESOLVED. Thumper script + Louis escalation fallback.
16. ~~P4 Rep exit / offboarding~~ → RESOLVED. Domain ownership policy locked.
17. ~~P8 Referral pipeline before ready~~ → RESOLVED. Waitlist via Thumper on landing page.
18. ~~Gap 1 SMS/Email provider + billing~~ → RESOLVED. Telnyx + Resend. Wallet model locked. (See SMS Billing section below.)
19. ~~Gap 19 Infrastructure cost modeling~~ → DEFERRED to pre-launch. Build first, model real numbers.

### Deferred Gaps
| # | Gap | Deferred Until |
|---|-----|---------------|
| 10 | BP community trade board examples | After rep trade board is built and understood |
| 12 | Lindsey revenue data | After Gap 19 (cost modeling) + Gap 11 (TAM) complete |
| 14 | Thumper capability boundaries | During Thumper build phase — can't define until built |
| 19 | Infrastructure cost modeling | Pre-launch — build first, model real numbers |

### 7 Remaining Research Sprints

| # | Gap | Method | Status |
|---|-----|--------|--------|
| 4 | AI photo enhancement vendor | Gemini deep research | OPEN |
| 5 | Thumper API cost modeling | Live web research (Claude) | OPEN |
| 6 | Voice interface / Thumper (merged F1) | Gemini deep research | OPEN |
| 7 | Stock photo subscription | Live web research (Claude) | OPEN |
| 11 | BP TAM hard numbers | Live web research (Claude) | OPEN |
| 15 | SEO/GEO multi-tenant sub-sites (OQ-28) | Gemini deep research | OPEN |
| 16 | Jewelry database deduplication | Design session with Claude | OPEN |

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

**Note:** All Gemini research sprint prompts for Gaps 4, 6, 15, and L1–L6 still need to be written. Next session priority.

---

## SMS Billing Model — LOCKED (Session #12)

**Simple version:** Rep pays for their own texts. NR makes a small margin per message.

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
- Current wallet balance (always visible)
- Messages sent this month (running count)
- Total SMS spent this month (running dollar amount)
- Reference cost table: 100 texts = $0.90 / 500 texts = $4.50 / 1,000 texts = $9.00 / 5,000 texts = $45.00
- Wallet reload history
- All real-time, plain language — no "segments" or "credits" jargon

**Future:** Build smarter budgeting tools and plan suggestions based on real usage data post-launch.

**Competitive position:** Shout and Project Broadcast charge $0.04–$0.05/msg. SS charges $0.009 — fraction of the competition.

---

## SMS Automation Model — LOCKED (Session #12)

**Automated (show-triggered, no rep action):**
- 1 SMS per scheduled show (pre-show reminder, timing TBD — 15 or 30 min out)
- 1 email per scheduled show (same trigger)
- Sent to all subscribers automatically from show calendar

**Manual allowance (rep-composed):**
- 3 SMS per week (rep's choice — promotions, announcements, etc.)
- 3 emails per week (same)
- Thumper enforces cap. When cap hit, Thumper notifies rep and holds until next week resets.

**Content screening:**
- All manual messages screened by AI agent before sending
- Checks: TCPA/CAN-SPAM violations, prohibited content, spam triggers, FTC compliance
- Automated show reminders are pre-approved templates — no screening needed
- Failed screening: Thumper notifies rep, explains issue, suggests fix. Does not send.

**Removed from MVP:** Diamond/unicorn reveal blast (eliminated for simplicity).

---

## Key Decisions Made Sessions #11–12

### Onboarding Workflow (B3) — Full Pipeline
1. Landing page intake — Thumper (external, no login) handles conversation instead of static form.
2. Scheduling — Thumper books Google Meet from Louis's live availability. Louis gets notified.
3. Pre-meeting intel — Agent scrubs social media, show URLs, public info. Output ready in NR HQ dashboard before meeting.
4. Google Meet — Louis presents product, pricing, branding menu. Gemini transcribes.
5. Post-meeting (if yes) — Agent processes transcript → builds site plan. Sends agreement (SignWell) + start fee link (Stripe).
6. Gates fire — Agreement signed + start fee paid = build trigger. Launch fee paid = go live trigger.
7. Build phase — Agentic build with client check-ins + Louis QA check-ins.

**Open build items within workflow:**
- Branding menu design (font/color/template options)
- Pre-meeting intel agent scope definition
- Gemini transcript hook method (Drive vs email vs webhook)
- Service agreement template (legal consult scope)
- Check-in cadence and format

### Three Payment/Agreement Gates (F8)
- Gate 1: User agreement signed (SignWell) — before any work starts
- Gate 2: Start work fee received (Stripe) — before any work starts
- Gate 3: Launch fee received (Stripe) — before site goes live
- All automated hooks. No manual overrides. No exceptions.

### Domain Ownership Policy (P4)
- NR purchases domain → NR owns it. Non-negotiable. Explicit in user agreement.
- Rep brings own domain → rep keeps it on exit.
- NR does NOT proactively offer "bring your own domain" in sales meetings.
- Rep's personal content: exportable on request at exit.
- NR code/design/templates: always NR property.

### Thumper (Chatbot) — Locked Decisions
- Internal name: Thumper. JARVIS reference retired everywhere.
- Rep-facing: each rep names their own instance (Supabase profile string field).
- Voice is the goal. Text fallback if voice quality bar not met at launch.
- Voice + capability = combined research sprint (Gap 6 + F1).

### Launch Standard
- All automations live before onboarding client #6.
- No partial launches. Ship complete or don't ship.

### Waitlist
- Thumper on landing page captures prospective rep info.
- Automated email sequence keeps warm.
- First come first served at launch. Entries stored in Supabase.

### Grandfathered Clients — Readdy Migration (B4)
- All 5 current clients stay on Readdy.ai indefinitely.
- $20/mo covers all 5 sites with maintenance tokens.
- Readdy = Plan B fallback. No migration unless compelling reason arises.

### Business Card Pipeline (Gap 13)
- Vision: Agent generates design from rep's branding. Third-party print vendor handles fulfillment.
- Research sprint: print vendor API options + AI card design tools.
- Reorder flow: rep confirms address + pays → trigger → reprint + ship.

### PM Dashboard (New — Session #12)
- Build dedicated Sparkle Suite project management dashboard.
- PC-optimized. Features: master checklist, workflow maps, site/concept maps, expense tracker.
- Expense tracker seeds with known costs, updates as research sprints complete.
- Build next session or dedicated session after Gemini research sprints are written.

---

## What's Grey — Needs Research or Decisions

- Platform subscription pricing (monthly/quarterly/annual/forever amounts)
- Start fee amount
- Launch fee amount
- Custom work pricing
- AI photo enhancement provider (Gap 4)
- Thumper API cost modeling (Gap 5)
- Voice interface implementation (Gap 6)
- Thumper capability boundaries (Gap 14 — deferred)
- Branding menu details (exact font/color/template options)
- SEO/GEO for sub-sites (Gap 15 / OQ-28)
- Stock photo subscription (Gap 7)
- Business card vendor + AI design tool (Gap 13)
- Annual + forever cancellation/refund policy (L6 research sprint)
- TAM hard numbers (Gap 11)
- Service agreement (L1 research sprint)
- Piece deduplication logic (Gap 16)
- Markdown for Agents native implementation (sub-topic of OQ-28)
- Gemini transcript hook method for onboarding pipeline
- Pre-meeting intel agent scope
- Check-in cadence during build phase
- Wallet auto-recharge threshold amount (TBD during build)

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
