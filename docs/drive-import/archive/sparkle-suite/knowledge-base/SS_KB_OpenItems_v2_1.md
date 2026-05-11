# Sparkle Suite — KB Module: Open Items & Gaps

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any gap resolved, new gap identified, parking lot item added/removed, or attorney agenda changed

**Version:** 2.1 | **Created:** April 8, 2026 | **Last Updated:** April 11, 2026
**Status:** ALL GAPS RESOLVED except Gap 4 (pending DUCLUS lightbox test). Gap analysis arc COMPLETE. Phase 0 IN PROGRESS — Task 0.1 (schema design) complete. Ultraplan blocker CLEARED (Session #22).

**COMPANION MODULES:**
- SS_KB_Core_v1.8.md — Platform architecture, Thumper spec, business model
- SS_KB_SiteSpec_v1.0.md — Full site template spec, all 4 pages, design system
- SS_KB_Clients_v1.0.md — Client roster, status, grandfathered policy
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation policy
- SS_KB_Agents_v1.0.md — Agentic architecture, memory model, agent roster, client lifecycle
- SS_Master_Build_Plan_v1.5.md — Build phases, timeline, dependencies
- SS_Supabase_Schema_v1.0.md — Full 16-table schema specification

---

## Knowledge Gap Tracker

### Fully Resolved Gaps

| Gap | Topic | Resolution | Session |
|-----|-------|------------|---------|
| 1 | SMS/Email provider selection | Telnyx SMS ($0.007/msg + $0.002 NR margin = $0.009 rep-facing), Resend email (included in subscription) | #12 |
| 5 | Chatbot API cost modeling | Haiku 4.5 default, Sonnet 4.6 escalation. ~$1.80–$8.50/rep/mo at heavy usage. Prompt caching from day one. | #13 |
| 6 | Voice interface / Thumper architecture | Voice deferred to post-launch. Thumper agent architecture fully locked: 6-component design, Vercel AI SDK, Next.js API route. | #14–15 |
| 7 | Stock photo for hero images | AI-generated + Canva Pro. No stock subscription. Video heroes on radar. | #13 |
| 11 | Bomb Party TAM | 20K–50K active reps. Revenue model validated at 5–10% penetration. | #13 |
| 15 | SEO/GEO multi-tenant (OQ-28) | Research complete. Localized wrappers, schema upgrades, ISR/SSG rendering, Markdown for Agents. No architecture-breaking findings. | #16 |
| 16 | Jewelry database deduplication | Three-table data model (collections, jewelry_designs, trade_listings). Dedup matching: item number first → attribute fallback → rep confirms. | #16 |
| 20 | BP item number confirmation | BP items have CONSISTENT, STRUCTURED item numbers: two-letter type prefix + 5 digits. Prefixes: RG (Ring), NK (Necklace), ER (Earrings), ST (Stack), BR (Bracelet). Dedup is SIMPLE exact match on item number. Collection is NOT on the label — Thumper asks rep when missing. | #20 |
| 21 | Customer trade request form | Simple three-element form: name, description, submit. No MSRP field. Temporary piece disappearance on submission. Rep is value gatekeeper. | #18 |
| 22 | Thumper trade board tool schemas | **RESOLVED Session #21.** Full Opus design session completed. 10 tools fully designed: add_listing (single + batch, flexible input), get_my_board, remove_listing, get_trade_requests, approve_trade (creates fulfillment record), reject_trade, search_jewelry_database, update_listing, get_trade_history, update_fulfillment_status (3-status pipeline: approved → shipped → completed). Dual interface principle: every tool has a dashboard UI equivalent via shared service layer. Trade board is one-for-one trades only, no purchases, one-way shipping. | #21 |
| 23 | Thumper live show notifications | Thumper conversation on rep's laptop/PC. Push notification as backup. TikTok chat handles rep-to-customer communication. No relay. | #18 |

### Open Gaps

None — all gaps resolved. Gap analysis arc is COMPLETE.

### Partially Resolved / Pending External Input

| Gap | Topic | Status | Next Step |
|-----|-------|--------|-----------|
| 4 | AI photo enhancement vendor + photography kit | Photoroom primary, Claid backup. QA two-layer system decided in principle. Photography kit strategy decided: lightbox standard for all reps, camera flexible (three tiers). | DUCLUS lightbox waiting on delivery (as of April 11). If pass: standardize lightbox, test USB webcam options. If fail: find alternative. Webcam quality testing follows lightbox validation. Does not block prototype. |

### Deferred Gaps (Not Blocking Build)

| Gap | Topic | Deferred Until | Reason |
|-----|-------|---------------|--------|
| 10 | BP community trade board examples | After rep trade board built | Need working product to compare against |
| 12 | Lindsey revenue data | After TAM and cost modeling complete | Gap 11 resolved; revisit when pricing decisions happen |
| 13 | Business card pipeline | Post-launch | Research sprint needed but not blocking anything |
| 14 | Thumper capability boundaries | During Thumper build phase | Test in context of real build |
| 19 | Infrastructure cost modeling | Pre-launch | Build first, model real numbers |

---

## Legal Sprints — All Complete

| Sprint | Topic | Status | Key Output |
|--------|-------|--------|------------|
| L1 | Service agreement framework | ✅ COMPLETE | Florida auto-renewal statute, 12-month liability cap, TCPA burden shift, Thumper AI disclaimer, Duval County venue |
| L2 | FTC income claim compliance | ✅ COMPLETE | "Means and instrumentalities" risk, prohibited language list, IDS link requirement, BP Section 7.1 verification needed |
| L3 | BP trademark usage | ✅ COMPLETE | Nominative fair use confirmed, no logos/trade dress, photos from reps only, non-affiliation three-part disclaimer |
| L4 | ToS + Privacy Policy | ✅ COMPLETE | A2P 10DLC registration required, PostHog flags, unchecked opt-in boxes, DPAs with all vendors |
| L5 | Trade board liability | ✅ COMPLETE | Section 230 confirmed, mere facilitator status, clickwrap at both listing and request points, IRS barter classification needs attorney opinion |
| L6 | Cancellation/refund policy | ✅ COMPLETE | Universal pro-rata refund policy, cancel anytime, service through end of month, forever tier eliminated |

---

## Attorney Session Agenda (8 Items)

Ready to schedule when revenue supports it.

1. Service agreement framework (L1)
2. FTC rep warranty + indemnification language (L2)
3. BP Policy Section 7.1 verification (L2/L3)
4. Non-affiliation disclaimer language (L3)
5. ToS + Privacy Policy drafting (L4)
6. Trade board disclaimer clauses (L5)
7. IRS barter exchange classification opinion (L5)
8. Annual cancellation policy language review (L6) — simplified, no forever tier

---

## Pre-Build Blockers (Before Phase 0)

| # | Item | Owner | Status | Impact |
|---|------|-------|--------|--------|
| 1 | Gap 20 — BP item number confirmation | Louis → Lindsey | ✅ RESOLVED (Session #20) | Item numbers ARE consistent. Dedup is simple exact match. |
| 2 | Gap 22 — Thumper trade board tool schemas | Claude (Opus) + Louis | ✅ RESOLVED (Session #21) | 10 tools fully designed. Dual interface principle locked. Shared service layer required. |
| 3 | DUCLUS lightbox test | Louis | ⏳ Waiting on delivery | Determines photography kit standardization. Does NOT block prototype — only affects onboarding pipeline (Phase 8). |
| 4 | Ultraplan workflow session | Louis | ✅ RESOLVED (Session #22) | Claude Code CLI installed, authenticated, /ultraplan tested successfully. Blocker cleared. |
| 5 | Phase 0.1 — Supabase schema design | Claude (Opus) + Louis | ✅ RESOLVED (Session #22) | SS_Supabase_Schema_v1_0.md generated. 16 tables fully specified. |

**All pre-build blockers RESOLVED. Phase 0 build is in progress.**

---

## Parking Lot (Future — Not Blocking)

These items are acknowledged but explicitly deferred. They do not affect current build planning.

**Trade Board Ecosystem (Post-Launch)**
- **Unified trade board ecosystem** — Three layers: (1) rep show boards (v1 — building now), (2) non-show marketplace (platform-wide persistent trade board across all reps), (3) social/team layer (rep-to-rep messaging, team board visibility, inventory coordination). All post-launch.
- **Cross-rep trade economics and logistics design session** — Who pays shipping? Revenue splits? Trust/reputation system? Dispute resolution?
- **Sparkle Suite Credits** — Internal credit economy for cross-rep marketplace. Reps buy credits via Stripe, earn credits by cross-listing inventory, spend credits to acquire pieces from other reps, cash out via Stripe. Solves financial friction in cross-rep trades. NOT a stablecoin — standard platform credits pegged to USD. New NR revenue stream via transaction fees.
- **Customer master trade board** (cross-rep browsing — after rep boards working)
- **Rep-to-rep social features and team coordination**

**Trade Board Features (Post-Launch)**
- **Monthly Trade Intelligence Report** — Automated monthly report for each rep: trade activity summary, collection insights (hot vs. dead weight), design-level trends, customer patterns (repeat customers, peak times), site analytics (PostHog — traffic, sources, pages, conversion funnel), Thumper-generated actionable recommendations. Combined with NR platform newsletter into single dashboard delivery. Within 7 days of month end. Automated generation + human QA before publishing. Delivered via Messages/Notifications section on dashboard, NOT email.
- **Visual similarity matching** for jewelry dedup (Phase 2 when database is large enough)
- **Trade-ups with cash difference** (after basic trades validated)
- **Buying off the trade board** (no cash transactions at launch)
- **Rarity scoring algorithm** (needs volume data — post-launch from accumulated trades)

**Platform Features (Post-Launch)**
- **Customer-facing home page for yoursparklesuite.com** — Post-launch. Needs dedicated design session. Build platform so it can integrate with customer-facing side later. Lots more to this than just a page.
- **B2B content hub** for yoursparklesuite.com (post-launch SEO play)
- **Jewelry database as customer-facing catalog** (P3 priority — future phase)
- **Thumper voice interface** (post-launch, Wispr Flow recommended for now)
- **Vector search for Thumper memory** (simple notes table at launch, upgrade later)
- **Thumper lightweight show mode / floating widget** (UX design during Thumper build phase)
- **Wispr Flow affiliate partnership** (future revenue opportunity)
- **Business cards** (research sprint when ready, not blocking)
- **Seedance 2.0 + Claude Code hero video workflow** (research and test — captured from Rabbit Hole)
- **Thumper as live streaming expert** — Deep knowledge of TikTok Live, Facebook Live, streaming hardware/software, show best practices. Affiliate revenue opportunity for hardware recommendations. System prompt content for Phase 1.2.
- **Fully automated lightbox camera** — Motion detection + image classification to auto-detect new items in lightbox without button press. Post-launch after basic camera button workflow validated.

---

## Grey Area Items (Need Discussion Before Deciding)

- **Platform pricing** (monthly/quarterly/annual amounts) — Louis decision session needed
- **Start work fee and launch fee amounts** — Louis decision session needed
- **Photography kit pricing tiers** — lightbox-only vs. lightbox+camera start fee impact — needs testing results first
- **SMS wallet auto-recharge threshold** — default set to $5.00, adjustable per rep
- **Branding menu design** (what options reps select from during onboarding) — design session item

---

*This module tracks all open questions, knowledge gaps, legal items, and deferred decisions for Sparkle Suite. Update it whenever a gap is resolved, a new gap is identified, or a parking lot item moves to active. Do not update for items still in brainstorming — those go to Open Brain first.*
