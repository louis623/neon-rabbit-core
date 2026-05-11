# Sparkle Suite — KB Module: Core Decisions & Architecture

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any decision that changes strategy, architecture, or scope

**Version:** 1.8 | **Derived from:** SS_KB_Core_v1.7 | **Last Updated:** April 9, 2026
**Status:** WORKING — updated with Session #18 decisions (Gap 21 resolved, Gap 23 resolved, universal cancellation policy, Forever tier eliminated, trade flow updates)

**COMPANION MODULES:**
- SS_KB_SiteSpec_v1.0.md — Full site template spec (all 4 pages + design system)
- SS_KB_OpenItems_v1.8.md — Open questions, research sprint, gap analysis, parking lot
- SS_KB_Clients_v1.0.md — Client roster, status, grandfathered policy
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation policy
- SS_KB_TradeBoard_v1.0.md — Trade board concept, flows, jewelry database, AI photo enhancement

---

## What Is Sparkle Suite

Sparkle Suite is an automated website and tools platform built specifically for Bomb Party jewelry representatives. It gives independent BP reps a professional web presence — branded websites with live show automation — replacing the scattered links and social-media-only approach most reps rely on.

**Core value prop:** A rep gets a fully branded, mobile-first website with live show features (calendar, reveal queue, event countdown) for a monthly subscription. Zero technical knowledge required. Neon Rabbit builds it, hosts it, maintains it, and provides the automation tools. The rep just shows up and sells jewelry.

**Two-sided platform:** Rep side (priority) + future customer/collector side.

**Business scope:** Neon Rabbit serves exactly TWO revenue-generating products — Sparkle Suite and The Rabbit Hole. No freelance web dev, no outside projects. Hard boundary. (Session #3)

---

## History & Current State

**Origin:** Louis's sister Lindsey (Mile High Fizz) asked him to build her a website. That first build revealed the opportunity — every BP rep has the same problem, and the solution is repeatable.

**The Readdy Era:** All current client sites built on Readdy.ai. Cookie-cutter workflow: copy sterile template → Builder Dashboard → branding prompts → SEO/GEO checklist. Readdy downgraded to $20/mo maintenance tier. Not used for new builds — new clients wait for the platform.

**Grandfathered clients:** Lindsey, Kara, Bri, Heather, Brittany stay on Readdy.ai indefinitely. No migration planned. Readdy = Plan B fallback. Migration only happens if a compelling reason arises. (Session #12 — B4 resolved)

**What's Built and Working:**
- Client websites on Readdy (5 clients)
- Builder Dashboard v1.5.0 (SparkledSuite_Dashboard.html — standalone HTML, localStorage)
- Calendar Guide v1.0 (SparkleSuite_CalendarGuide.html — client-facing)
- yoursparklesuite.com — Next.js scaffold on Vercel (scaffold only, no functional features)
- GitHub Vault — /vault in sparkle-suite repo (7 Markdown files for agents)
- SEO/GEO Standard — NR_PostLaunch_SEO_GEO_Checklist_v1.0.md

**What's NOT Built Yet:**
Rep portal, Thumper (chatbot), native calendar, trade board, jewelry database, SMS/email automation, audience management, multi-stream support, the platform itself.

---

## Platform Architecture — Decided

**Single deployment:** Both standard and custom domain sites live within yoursparklesuite.com. Custom domains forward to each rep's location within the deployment. No separate servers per rep.

**Option A only:** All sites use the standard template. No custom layouts. No Option B. Sherman tank philosophy — volume over customization. (Session #3)

**Tech stack:** Next.js on Vercel, Supabase (neon-rabbit-core), GitHub (louis623/sparkle-suite, main branch only). Cal.com dropped — native intake form replaces it. (Session #5)

**Data isolation:** RLS enforced everywhere. Reps see only their own data.

**Vercel domain limits:** Pro plan supports 100,000 domains per project. 100 reps = 0.1% of limit. Architecture validated. (Session #9)

---

## Business Model & Pricing

**Single-tier model:** One product, all features. Payment frequency tiers only — no feature gating. Old Sparkle/Pro/Elite model scrapped. (Session #2)

**Payment frequencies:** Monthly, Quarterly, Annual. Forever tier eliminated — violates KISS principle, too much legal complexity for the revenue benefit. (Session #18)

**Current grandfathered rates:** First 5 clients locked forever. Rates never raised, all upgrades included, will be charged for add-ons (business cards, extra changes).

**Cost pass-through:** SMS costs NOT absorbed by NR. Rep pays for all their own texts via wallet. Email IS included in platform subscription (absorbed by NR via Resend — negligible at scale). Pricing cannot be fully locked until platform subscription amount is decided.

**Start fee:** Exists (amount TBD — needs research). Required before build begins. Includes rep photography kit cost (see below).

**Launch fee:** Exists (amount TBD). Required before site goes live.

**Cancellation/refund — Universal Policy (Session #18, replaces Session #9):**
- Rep can cancel at any point, for any reason
- Service continues through the end of the current calendar month
- At 11:59 PM on the last day of that month, the plan cancels
- NR issues a full refund for any unused time beyond that month
- No questions asked, no hoops to jump through
- Monthly: Cancel mid-month, service runs to end of month, no refund needed (paid for that month)
- Quarterly: Cancel in month 2, service runs to end of month 2, NR refunds month 3
- Annual: Cancel in month 4, service runs to end of month 4, NR refunds months 5–12
- Values basis: Louis does not want reps feeling trapped or put into hardship. Trust and fairness over revenue lock-in.
- Site goes offline at end of cancellation month. Rep's personal content exportable on request. NR-owned code/design/templates remain NR property.

**Cancellation build requirements (L6 + Visa/Mastercard):**
- Self-service cancellation button in rep dashboard (FTC Click-to-Cancel compliant)
- Cancellation must be as easy as signup (ROSCA, Florida § 501.165)
- Automated pro-rata refund calculation and processing via Stripe
- Automated renewal reminder email 30 days before annual renewal (Florida § 501.165)
- Automated renewal reminder 7–30 days before charge for plans billing 6+ months (Visa/Mastercard mandate)
- Login/usage logging from day one for chargeback defense (Visa CE 3.0)
- Clear cancellation terms at checkout clickwrap

---

## Three Payment/Agreement Gates — Decided

Three hard gates govern every new client. No exceptions. No manual overrides. All automated hooks.

- **Gate 1:** User agreement signed (SignWell) — required before any work starts
- **Gate 2:** Start work fee received (Stripe) — required before any work starts
- **Gate 3:** Launch fee received (Stripe) — required before site goes live

Gates 1 and 2 are parallel — both required before build trigger fires. Gate 3 holds deployment until launch fee clears. (Session #11)

**Gate 1 click-wrap audit trail requirement (Session #17 — L1):** The click-wrap at Gate 1 must generate an audit trail capturing the rep's IP address, timestamp, and document hash of the version signed. This must be built into the onboarding flow — not just a checkbox.

---

## Domain Ownership Policy — Decided

- **NR purchases domain → NR owns it.** Non-negotiable. Explicit clause in user agreement. Rep does not get domain on cancellation or exit.
- **Rep brings own domain → rep keeps it.** NR will work with it during service, rep retains it on exit.
- NR does NOT proactively offer "bring your own domain" during sales meetings. If rep already has one, they'll bring it up.
- Rep's personal content (photos, copy): exportable on request at exit.
- NR code/design/templates: always NR property regardless of exit reason. (Session #11)

---

## Rep Portal / Dashboard — Decided

The rep-facing dashboard is primarily a **read-only view layer**. Thumper is the primary interaction model. Dashboard = visualization; Thumper = action. No duplicate capability between the two.

Portal views include: show calendar, trade board listings, audience/customer list, site analytics, basic P&L summary, SMS wallet balance + billing tracker. All read-only. All actions done through Thumper.

---

## Thumper — Chatbot as Primary Interface — Decided

**The chatbot is named Thumper** (internally at Neon Rabbit). JARVIS reference is retired. Rep-facing: each rep names their own chatbot instance (string field in Supabase profile, set during onboarding, changeable via Thumper anytime). (Session #11)

**Text-first, voice deferred:** Voice-first is NOT required at launch. Text interface only at launch. Voice deferred to post-launch roadmap. Reps who want voice input are recommended Wispr Flow (voice-to-text app) as a companion tool — no SS integration required. Wispr Flow affiliate partnership is a future opportunity. (Session #14)

**Agent architecture — locked (Session #15):**
- Brain: Claude API. Haiku 4.5 default, Sonnet 4.6 escalation. Prompt caching from day one.
- Hands: 15–25 defined tools via Vercel AI SDK streamText with tool-calling, running as Next.js API route
- Voice: Concise, warm, plain language responses. No walls of text. No tech jargon.
- Memory: Rep notes table in Supabase — simple text notes, no vector search at launch. LAUNCH FEATURE.
- Security: Supabase RLS token-based isolation per rep
- Error handling: Three-tier graceful failure — retry / explain / auto-escalation ticket to Louis

**Self-service tech support:** Thumper handles all routine platform setup for reps — extension installs, trade board config, show prep, general how-to. Louis cannot scale to 100 reps manually. Thumper is the front line for everything except escalations. (Session #16)

**Thumper scope lock (Session #13):** Locked to 10 allowed domains. Off-topic requests get a warm redirect. Log all interactions from day one.

**Thumper on trade board (Session #17 — L5):** Thumper must remain a logic executor only on the trade board. Must never independently generate trade valuations, assess trade fairness, or state "this is a good trade for you." Every trade board action reflects rep-configured rules or explicit rep approval — not AI independent judgment. This is the Section 230 protection boundary.

**Thumper AI notice (Session #17 — L3):** Thumper must identify itself as an NR automated assistant — not a BP corporate representative and not an appraiser or valuation tool. This notice must appear in Thumper's context on trade board interactions.

**Thumper live show notification mechanism (Session #18 — Gap 23):**
- Trade requests arrive as real-time messages in the Thumper conversation on the rep's laptop/PC with full trade details
- Push notification to phone via PWA as backup alert
- Rep interacts through Thumper — can ask follow-up questions about their board before approving/denying
- TikTok/Facebook Live chat is the rep-to-customer communication channel — no Thumper relay needed
- No customer-to-Thumper communication channel. No live status page for customers. No automated MSRP checking.

**Recommended show setup (Session #18):**
- Phone: camera + TikTok/Facebook Live stream + audience chat
- Laptop or PC: Thumper open in browser + Wispr Flow for voice-to-text input
- Thumper show experience optimized for desktop-width browsers
- Tablet acceptable as second device but not the optimized target
- Phone-only reps are NOT the target customer — set expectations during onboarding that a second device is needed for full value

---

## SMS / Email Automation — Decided

**Providers:** Telnyx (SMS, $0.007/msg NR cost), Resend (email, included in subscription). (Session #12)

**SMS billing model:** Rep pre-loads wallet via Stripe. NR charges $0.009/msg ($0.007 Telnyx + $0.002 NR margin). Auto-deducts per send. No wallet = no texts sent. (Session #12)

**SMS automation types:**
- 1 automated pre-show reminder per show (show calendar triggered)
- 3 manual texts/week rep-composed cap (Thumper enforces)
- 3 manual emails/week cap (Thumper enforces)
- AI content screening on all manual messages before send (TCPA/CAN-SPAM compliance check)

**A2P 10DLC registration — PLATFORM LAUNCH REQUIREMENT (Session #17 — L4):**
NR must register as Campaign Service Provider (CSP) with The Campaign Registry (TCR) before any rep sends a single SMS through the platform. Since February 2025, unregistered traffic is blocked by carriers. This is a non-negotiable platform launch checklist item.

---

## Legal Framework — Research Complete (Sessions #17–#18)

All legal sprints L1–L6 research complete. All decisions made. Attorney session agenda finalized with 8 items. Attorney drafts final language from this foundation.

### Key Legal Decisions and Build Requirements

**Service Agreement (L1):**
- Liability cap: 12 months of fees paid preceding the claim
- Consequential damages waiver: explicitly exclude lost profits and business interruption (ALL CAPS)
- Florida auto-renewal statute (Fla. Stat. § 501.165): annual plans require 30–60 day advance notice before cancellation deadline; cancellation must be as easy as signup
- Thumper AI disclaimer: four-part structure — as-is, human-in-the-loop, rep responsible for Thumper actions as their authorized agent, NR not liable for hallucinations
- Venue: "state or federal courts located in Duval County, Florida" — exact language preserves federal removal rights
- Start fee clause: "earned upon payment" — non-refundable, covers initial setup

**FTC Income Claims (L2):**
- "Means and instrumentalities" doctrine: primary FTC risk. Platform tools that enable deceptive income claims create NR liability even without writing the claims.
- Rep warrants all content complies with FTC rules and BP policies — in ToS
- Rep indemnifies NR against FTC/third-party claims from their recruitment content
- BP Income Disclosure Statement must be linked on every "Join My Team" page — build requirement for page template
- Prohibited language for Thumper content screening: "financial freedom," "passive income," "quit your 9-to-5," "unlimited income potential," "luxury lifestyle"
- BP Policy Section 7.1: UNVERIFIED — must confirm against actual BP rep agreement before attorney session

**Trademark (L3):**
- Nominative fair use confirmed: using "Bomb Party" in plain text is legally defensible
- No logos, no trade dress — ever. Applies to SS main site and all rep sites.
- Database photos must always come from reps — never scraped from BP website
- Thumper must synthesize in its own words — never regurgitate BP marketing copy verbatim
- Do not ingest BP proprietary training manuals into Thumper's knowledge base
- "Social Sparkle Suite" name conflict: Louis searched Google, confirmed non-issue
- Authorized vendor outreach to BP Compliance: future consideration, not day-one

**Non-Affiliation Disclaimer — Three-Part Framework (L3 — build requirement):**
Must appear on SS main site footer, all rep site footers, and in Thumper's opening context on trade board:
1. Platform disclaimer: SS is not affiliated with, endorsed by, or sponsored by Ring Bomb Party LLC. Use of "Bomb Party" trademark is for descriptive identification only — nominative fair use.
2. Warranty disclaimer: Software provided as-is. NR not liable for disciplinary actions or loss of income from rep's use of this tool. Use may be subject to rep's BP independent representative agreement.
3. Thumper AI notice: Automated assistant developed by NR. Not an official BP representative. Verify responses against official BP policy documents.

**ToS + Privacy Policy (L4):**
- Anthropic API: does not use data for training by default — state this explicitly in privacy policy
- Photoroom API: excluded from model improvement pipelines — state explicitly
- DPAs required with all vendors at build time: Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog
- FIPA breach notification: 30-day window, 500+ persons triggers FL Department of Legal Affairs notification, up to $500,000 penalty — build one-page incident response protocol at launch
- Mandatory individual arbitration clause in ToS
- PostHog technical flags for Claude Code:
  - Disable IP capture
  - Use ph-no-capture class on all sensitive inputs (rep notes, billing fields)
  - Session replay must mask all text inputs by default
  - Only link user IDs after login

**Opt-In Forms — Build Requirement (L4):**
All subscriber opt-in forms must use unchecked boxes — consent must be an affirmative action. Pre-checked boxes are non-compliant under TCPA. Marketing consent must be separate from transactional consent. Enforce at UI level.

**Trade Board Liability (L5):**
- Section 230 protection confirmed — NR qualifies as interactive computer service
- Mere facilitator status confirmed — design is correct. Never add fulfillment, payment processing, or commission-taking to the trade board.
- Clickwrap required at both trade board interaction points (build requirement):
  - Point of listing: rep certifies ownership and MSRP accuracy
  - Point of request: customer acknowledges as-is, no NR warranty, trade at own risk
- IRS barter exchange classification: needs attorney opinion before launch — add to attorney session agenda
- Brand separation on trade board UI: every listing must show "Offered by [Rep Name], an Independent Bomb Party Representative"

**Cancellation Policy (L6 — Session #18):**
- Universal cancellation policy decided — see Business Model & Pricing section above
- ROSCA compliance: clear disclosure, express consent, simple cancellation — all satisfied
- FTC Click-to-Cancel: self-service online cancellation — satisfied
- Visa/Mastercard 7-day rule: renewal reminder 7–30 days before charge for 6+ month billing — build requirement
- Visa CE 3.0: login/usage logging from day one for chargeback defense — build requirement
- Forever/Lifetime tier eliminated — KISS principle

### Attorney Session Agenda (Final — 8 Items)

| # | Item | Source | Notes |
|---|------|--------|-------|
| 1 | Service agreement framework | L1 | 9-section structure, Florida-specific clauses |
| 2 | FTC rep warranty + indemnification language | L2 | "Means and instrumentalities" exposure |
| 3 | BP Policy Section 7.1 verification | L2/L3 | Does BP prohibit third-party tools for recruitment? |
| 4 | Non-affiliation disclaimer language | L3 | Three-part framework ready for refinement |
| 5 | ToS + Privacy Policy drafting | L4 | Section frameworks captured in Open Brain |
| 6 | Trade board disclaimer clauses | L5 | Four clauses ready for refinement |
| 7 | IRS barter exchange classification opinion | L5 | Does trade board = barter exchange? |
| 8 | Annual cancellation policy language review | L6 | Universal pro-rata refund policy — attorney confirms compliance |

---

## Trade Board — Decided (Sessions #16, #18)

**Three-table data model:**
- `collections` — ever-growing table. Name + year makes each unique. Retired collections stay permanently. BP releases many collections constantly.
- `jewelry_designs` — one row per unique BP design. Master catalog. Item number from BP box if it exists; NR assigns tracking number if not.
- `trade_listings` — one row per rep listing. Many listings → one design.

**MSRP:** Single field, BP's stated value only. No competing "market value" field.

**Rarity:** Unicorn and diamond boolean tags only at launch. No scoring system until volume data exists.

**Filtering — hard requirement (not nice-to-have):** Collection, jewelry type, material, MSRP range, rarity tags, size. Extensible by design.

**Customer trade request form (Session #18 — Gap 21):**
- Three elements only: customer name, description of the item they just got revealed (text field), submit button
- No MSRP input field. No photo upload. No collection dropdowns.
- Intentionally simple — customer enters what they know from the show
- Rep is the value gatekeeper, not the platform

**Live show trade flow (updated Session #18):**
1. Customer browses trade board, picks piece, clicks "I want this"
2. Customer enters their name and a description of the item they want to trade, hits submit
3. The requested piece disappears from the trade board temporarily (not a visible "pending" status — just gone from customer view)
4. Thumper notifies rep on their laptop/PC with full trade details
5. Rep knows from the show what was revealed and roughly what it's worth — no automated MSRP check needed
6. If good match: rep tells Thumper to approve → piece gone permanently
7. If not a good match: rep addresses it on the live stream directly ("pick another one, that's off on MSRP") — no formal deny notification needed. Customer hears it live, picks again.
8. If rep wants to formally deny via Thumper: piece reappears on the board
9. Post-show: Thumper walks rep through batch processing of new pieces

**Value rule:** Customer's revealed item must be equal or greater MSRP to the piece they're requesting. No automated MSRP tolerance checking — rep enforces manually based on show knowledge. Reps learn to guide customers toward equal-or-greater value picks during shows. The show itself is the training ground for customers. (Session #18)

**Trades only at launch** — no buying off the board, no trade-ups with cash.

**Dedup strategy:** Item number match first → attribute fallback → rep confirms candidate. Rep always confirms, not fully automated.

---

## Lindsey Prototype — Decided (Session #16)

Prototype MUST include Thumper. Trade board without Thumper is just a webpage with a form.

**Scope:** Trade board + Thumper + customer-facing trade request form + real-time notifications.

**Pre-build blockers:** Gap 20 (item numbers — ask Lindsey) and Gap 22 (Thumper tool schemas — Opus session). Gaps 21 and 23 resolved in Session #18.

**Validation goal:** If Lindsey can run a live show and manage trades through Thumper without needing Louis, concept is validated.

---

## SEO/GEO — Research Complete (Session #16)

Gap 15 research complete. No architecture-breaking findings. Key implementation items for build phase:

- Localized content wrappers on Pages 3 & 4 (rep name + city injected)
- Independent canonical tags per custom domain
- Schema upgrades needed: LocalBusiness, VirtualLocation, Event (OnlineEventAttendanceMode), ProfessionalService
- Dynamic sitemaps and robots.txt per hostname (host header detection in Next.js)
- ISR for homepage/About, SSG for Pages 3 & 4, SSR for dashboard only
- Markdown for Agents: WASM engine (@kreuzberg/html-to-markdown-wasm), Content-Signal header
- B2B content hub for yoursparklesuite.com: parking lot, not launch requirement

---

## AI Photo Enhancement — Partial (Session #14)

**Vendor:** Photoroom primary, Claid.ai backup.

**Two-layer QA:**
- Layer 1: Thumper pre-flight check — evaluates photo for minimum viability before Photoroom
- Layer 2: Backend QA inspector — evaluates Photoroom output before database entry (details TBD)

**Photography kit:** DUCLUS 12"x12" lightbox ordered ($29.99). Test pending — not yet completed.

**Database photo rule (Session #17 — L3):** Photos in the jewelry database must always come from rep submissions. Never scraped from BP website. This is both a legal requirement and the existing design.

---

## Rep Onboarding Pipeline — Decided (Session #11)

Landing page Thumper intake → scheduling (Cal.com) → pre-meeting intel agent → Google Meet (Gemini transcribed) → post-meeting agent → agreement + payment gates → agentic build.

Five open build items: branding menu, intel agent scope, Gemini transcript hook, check-in cadence.

---

## Build Sequence — Decided (Session #11)

**Thumper + dashboard first.** These are the platform's nervous system. Parallel tracks:
- Track A: Site template (Next.js pages, design system, static content)
- Track B: Supabase schema (rep profiles, calendar, trade board data model)
- Track C: Thumper (Claude API integration) — starts when schema stable
- Formal build sequence session required before Claude Code work begins.

---

## Strategic Principles — Locked (Session #4)

1. **Under-promise/over-deliver / radio silence:** No announcements, no hype, no feature previews. Build in silence.
2. **No public roadmaps:** Apple model. Feature drops as surprises.
3. **No timeframes to clients:** "It gets done when it gets done." Never attach a date to a deliverable.

---

## Service Scope — What SS Does and Does Not Do

**YES — Core product:** Branded rep website (Option A), all automations, Thumper, jewelry database, FAQ/knowledge base, site analytics, QR code, branding assets handoff.

**YES — Add-ons:** Business cards (agentic pipeline, pricing TBD), rep photography kit (baked into start fee).

**NO — Dropped/Out of scope:** Social media images/graphics, logo design, flyers, any graphic design beyond sites and cards, training/education tools for team leads, custom site layouts, non-BP website builds.

---

## Competitive Landscape & Market Context

**What reps currently use:** Linktree/bio links (most common), Facebook Pages, TikTok, Instagram, nothing.

**Sparkle Suite's advantages:** Only product purpose-built for BP reps, show automation, SEO/GEO discoverability, trade board (most demanded), 24/7 jewelry store model, Thumper chatbot, BP jewelry database (unique data asset, network effect), AI-enhanced photos.

**Competitive posture:** "Don Draper effect: I don't think about you at all." No competitor monitoring.

**BP product context:** Standard jewelry (nickel-free, brass, triple-plated), sterling (.925), gold vermeil (.925 with 12K plating), unicorns (rare/sought-after), diamonds (actual diamond pieces — rarest reveal).

---

## BP Rep Budget Reality

**Big Three (recurring):** Inventory, shipping, time. **Small stuff:** Business cards, promo materials, personal package touches. **Tools:** Most reps spend near zero (Linktree, phone, TikTok = free).

**Commission:** ~30–40% of sales. Lindsey ~$4K profit (timeframe unclear — verify after cost modeling complete).

**Pricing implications:** TIME savings is the real ROI pitch. Value must be obvious and immediate.

---

## Scaling Plan

**Pace:** One new client per week to start. Reassess after processes refined. Gut feel on when to accelerate.

**How it works:** Agents and automations do the vast majority. Louis = QA, design review, client meetings, process improvement. Human touchpoints are the bottleneck.

---

## Marketing & Go-to-Market

**Zero active marketing.** No social media, no paid ads, no content marketing. Product markets itself through customer experience. Referral is the only channel — informal, not a program.

**Waitlist:** Thumper on landing page captures prospective rep info. Automated email sequence keeps warm. First come first served at launch.

**If wrong:** Readjust later from real knowledge of what resonates.

**Rep-facing landing page:** Informational, not salesy. Demo video + intake form. Product has already been sold by word of mouth before the rep visits.

---

## Bomb Party Intelligence System

**Four channels:** BP website monitoring, BP press releases, BP email/newsletter, BP social (official only).

**Explicitly out:** Competitor monitoring, rep community rumors, BP business health speculation.

**Timing:** Manual now. Automated monitoring agent comes when HQ dashboard is live.

---

## Relationship to Other NR Projects

- **Neon Rabbit HQ:** SS has a module inside HQ (Customer Board, Financials, BP Intelligence, Lifecycle Workflow). Separate applications, shared Supabase.
- **The Rabbit Hole:** No direct dependency. Development parked until SS is operational.
- **neonrabbit.net:** Minimal brand page on Readdy with redirects to NR projects. Content rewrite, not new build.
- **mybostonpassportphotos.com:** Family client, maintenance only, not SS.
- **Shared infrastructure:** Supabase neon-rabbit-core (us-east-1, ref bqhzfkgkjyuhlsozpylf), Vercel, GitHub louis623/sparkle-suite.

---

## Bomb Party Glossary

| Term | Definition |
|------|-----------|
| Reveal | Moment a jewelry piece is shown during a live show |
| Unicorn | Rare/sought-after piece (not a diamond) |
| Diamond | Actual diamond piece — rarest reveal |
| Batting Order | Queue order for reveals during a live show |
| Downline | A rep recruited by another rep |
| Upline | The rep who recruited you |
| Sterling Collection | .925 sterling silver jewelry line |
| Gold Vermeil | .925 sterling silver with 12K gold plating |
| Trade Fodder | Pieces revealed without a customer attached, available for trading |
| Replacement Form | Form at bombparty.com for defective/damaged piece replacement |
| Collection | A themed group of jewelry released by BP (monthly, seasonal, specialty, limited). Each collection is distinct by name + year. |

---

## Session Log (Condensed)

| Date | Session | Key Outcomes |
|------|---------|-------------|
| April 7, 2026 | Planning #1 | KB v1.0, Cross-Reference Analysis, 15 Q&A topics, Standing Rules v3.3 |
| April 7, 2026 | Planning #2 | Chatbot as primary interface, single-tier pricing, jewelry database, trade board spec |
| April 7, 2026 | Planning #3 | Option B eliminated, business scope locked, Readdy stays at $20/mo |
| April 7, 2026 | Planning #4 | Strategic principles locked, social media branding dropped, pre-built inventory model |
| April 7, 2026 | Planning #5 | 7 topics to parking lot, Cal.com dropped, chatbot naming resolved, 2 topics remain |
| April 7, 2026 | Planning #6 | Homepage fully specced, chatbot expanded to site customization interface |
| April 7, 2026 | Planning #7 | About + Join Team pages specced, page map corrected to 4 pages |
| April 8, 2026 | Planning #8 | U&D/FAQ page specced, OQ-27 complete, OQ-28 flagged as research sprint |
| April 8, 2026 | Gap Analysis #9 | 19 gaps identified, 6 resolved, KB segmentation strategy implemented |
| April 8, 2026 | Gap Analysis #10 | KB split into 5 modules, all modules generated |
| April 8, 2026 | Gap Analysis #11 | Categories 2–5 complete, Thumper named, onboarding workflow decided, three gates locked, domain policy locked, launch standard set, waitlist decided |
| April 9, 2026 | Gap Analysis #12 | B4 resolved (Readdy stay), Gap 19 deferred, Gap 1 resolved (Telnyx + Resend, SMS wallet $0.009/msg), SMS automation model locked, PM dashboard decided |
| April 9, 2026 | Gap Analysis #13 | SMS billing correction confirmed, Gap 5 resolved (Thumper API cost — Haiku 4.5/Sonnet 4.6), Thumper scope lock, Gap 7 resolved (AI-gen + Canva Pro), Gap 11 resolved (TAM 20K–50K) |
| April 9, 2026 | Gap Analysis #14 | Gap 4 partially resolved (Photoroom primary, Claid backup, QA two-layer), DUCLUS ordered, Gap 6 voice deferred (text-first, Wispr Flow) |
| April 9, 2026 | Gap Analysis #15 | Gap 6 FULLY RESOLVED — Thumper agent architecture locked (6 components, Vercel AI SDK, rep notes table launch feature, personality locked) |
| April 9, 2026 | Gap Analysis #16 | Gap 15 research complete (SEO/GEO). Gap 16 design complete (three-table model, dedup, trade flow, filtering). MSRP single field. Rarity tags only. Trades only. Lindsey prototype scoped. Gaps 20–23 added. Standing Rule 15 added. |
| April 9, 2026 | Gap Analysis #17 | Legal sprints L1–L5 research complete. Key build requirements added (A2P 10DLC, clickwrap at listing+request, PostHog flags, opt-in form unchecked boxes, photo sourcing rule, non-affiliation disclaimers). Attorney session agenda compiled. Heather all 4 open items resolved. |
| April 9, 2026 | Gap Analysis #18 | Gap 21 resolved (simple trade request form). Gap 23 resolved (Thumper notification + show setup). L6 research complete. Universal cancellation policy. Forever tier eliminated. Trade flow updated (temporary disappearance, no automated MSRP check). All legal sprints L1–L6 complete. |
