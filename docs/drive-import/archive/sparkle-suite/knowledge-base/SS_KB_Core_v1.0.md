# Sparkle Suite — KB Module: Core Decisions & Architecture

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any decision that changes strategy, architecture, or scope

**Version:** 1.0 | **Derived from:** SS_Knowledge_Base_v1.9 | **Last Updated:** April 8, 2026
**Status:** WORKING — segmented for context efficiency

**COMPANION MODULES:**
- SS_KB_SiteSpec_v1.0.md — Full site template spec (all 4 pages + design system)
- SS_KB_OpenItems_v1.0.md — Open questions, research sprint, gap analysis, parking lot
- SS_KB_Clients_v1.0.md — Client roster, status, grandfathered policy
- SS_KB_Legal_v1.0.md — TCPA/CAN-SPAM, disclaimers, cancellation policy

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

**What's Built and Working:**
- Client websites on Readdy (5 clients)
- Builder Dashboard v1.5.0 (SparkledSuite_Dashboard.html — standalone HTML, localStorage)
- Calendar Guide v1.0 (SparkleSuite_CalendarGuide.html — client-facing)
- yoursparklesuite.com — Next.js scaffold on Vercel (scaffold only, no functional features)
- GitHub Vault — /vault in sparkle-suite repo (7 Markdown files for agents)
- SEO/GEO Standard — NR_PostLaunch_SEO_GEO_Checklist_v1.0.md

**What's NOT Built Yet:**
Rep portal, chatbot, native calendar, trade board, jewelry database, SMS/email automation, audience management, multi-stream support, the platform itself.

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

**Payment frequencies:** Monthly, Quarterly, Annual, (Forever — TBD, needs brainstorming session).

**Current grandfathered rates:** First 5 clients locked forever. Rates never raised, all upgrades included, will be charged for add-ons (business cards, extra changes).

**Cost pass-through:** SMS/email costs NOT absorbed by NR. Built into pricing based on provider cost structure. Pricing cannot be fully locked until provider and costs are known.

**Start fee:** Exists (amount TBD — needs research).

**Cancellation/refund:**
- Monthly: No refund. Service through end of billing cycle.
- Quarterly: No refund for current quarter. Service through end of quarter.
- Annual + Forever: Need brainstorming session — not yet decided.
- Site goes offline at end of paid period. Rep's personal content exportable on request. NR-owned code/design/templates remain NR property.

---

## Rep Portal / Dashboard — Decided

The rep-facing dashboard is primarily a **read-only view layer**. The chatbot is the primary interaction model. Dashboard = visualization; chatbot = action. No duplicate capability between the two.

Portal views include: show calendar, trade board listings, audience/customer list, site analytics, basic P&L summary. All read-only. All actions done through chatbot.

---

## Chatbot as Primary Interface — Decided

**The chatbot IS the rep portal.** Voice in, voice out. JARVIS (Iron Man) is the personality inspiration. Rep-named — each rep names their own chatbot (string field in profile, default name at signup, rep changes via chatbot anytime). (Session #5)

**Manages:** Calendar events, trade board listings, site update requests, audience messages, support tickets, site customization (banner, ticker, hero images, text, streaming buttons), team roster management.

**Chatbot initial setup phase:** When site is first created, chatbot walks rep through onboarding setup flow — page by page, section by section. Zero learning curve.

**Capability boundaries:** When request hits a guardrail or needs human judgment → auto-flags to Neon Rabbit.

**Technical implementation:** Claude API / Sonnet. Persistent. Voice text-to-speech output. Exact cost modeling TBD (research sprint item).

---

## Trade Board — Decided

**Two types:** Rep trade board (priority) + future customer master trade board.

**What it is:** Listing and reservation system only. NR never handles money or shipping. Reps/customers negotiate offline. NR stays completely out of transactions.

**Rep trade board flow:** Rep adds piece to trade board (photo, description, MSRP, trade preferences). Other reps/customers can browse and express interest (reserve). Rep decides whether to proceed. All transactions happen offline.

**Strategic asset:** Every piece flowing through any rep's trade board gets cataloged into the Bomb Party jewelry database. This dataset doesn't exist publicly anywhere.

**24/7 jewelry store model:** Trade board works while the rep sleeps. Dead show time becomes productive.

**Homepage placement:** Trade board lives on homepage near Live Queue (in-show experience section). Layout to be finalized in optimization pass.

---

## Bomb Party Jewelry Database — Decided

Byproduct of the trade board — every listing feeds the catalog. Four use cases:
1. Rep upload shortcut — auto-populate from existing catalog entries
2. Browsable collection reference
3. Cross-rep trade facilitation
4. Future customer portal search

**Strategic value:** Compounds over time, network effect (every rep makes it more valuable), increasingly hard to replicate. NR becomes the go-to source for BP jewelry data.

**Technical:** Unique piece identification and deduplication needed — no BP SKU system exists. Research/build phase item.

---

## Live Reveal Queue Co-Pilot — Decided

**Current state:** Chrome extension scrapes BP rep dashboard live order list. Currently broken for all except Mile High Fizz (refresh loop bug on Britt with Bling). Rebuild in progress.

**Rebuild plan:** Bulletproof Chrome extension, Chrome Web Store publication, easy on/off toggle, non-technical user design.

**Critical limitation:** Chrome extensions don't work on mobile/phone-only reps. Long-term solution = BP API access (server-side data pull). Blocked until demonstrated value position achieved.

---

## Native Calendar System — Decided

Google Calendar + Apps Script dropped completely. Native calendar lives entirely in Supabase. Managed through chatbot (primary) and viewable in portal calendar view.

How it works: Rep tells chatbot to add show → chatbot creates event with date, time, promo codes, collections, notes → website dynamically shows next 2-3 upcoming events from Supabase directly.

"Add to Calendar" export button: one-way push to rep's personal calendar (Google, Apple, etc.) — convenience only, not a dependency.

---

## SMS/Email Automation — Decided

**Three message types:**
1. Automated pre-show reminders — 15 or 30 min before show. Fully automated.
2. Templates — pre-built for common purposes.
3. Custom broadcasts — rep composes via chatbot. Free-form.

**Customer opt-in:** Simple form on rep's site. Fields: first name, last name, email (required), phone/SMS (optional). Customer chooses SMS, email, or both. Data → Supabase → rep's customer list.

**Compliance:** TCPA/CAN-SPAM research complete. NR carries legal liability for rep messages. Requirements documented in SS_KB_Legal module. Parked for legal review.

**Provider:** Not selected. Research sprint needed (Twilio, Resend, alternatives).

**AI Photo Enhancement:** Third-party preferred. Options to research: Pomelli, Photoroom, Claid.ai, Picsart API. Needs testing with actual BP jewelry photos. OCR on reveal box descriptions = bonus. Research sprint item.

---

## SEO/GEO Lifecycle — Decided

**Three phases:**
1. Pre-Launch — all SEO/GEO boxes checked before site goes live
2. Post-Launch — initial optimization pass (Bling Kitchen gold standard)
3. Ongoing Maintenance — agents assess each site on schedule, surface recommendations, execute once approved

**SEO/GEO for sub-sites (OQ-28):** Full research sprint needed — expanded to three layers: multi-tenant rep sites, rep-facing yoursparklesuite.com landing page, future customer side. Includes Markdown for Agents / AI-readable content serving as sub-topic. Louis leaning toward native Next.js implementation over Cloudflare proxy.

---

## Build Philosophy & Operational Principles — Decided

**Louis's role:** Design review, QA, process improvement, client meetings. NOT heavy building, fine-tuning, fixing, graphic design.

**Bite-size everything:** One focused task per Claude Code session. Test and confirm before moving on.

**Non-technical user design:** Brittany's IT anxiety is the norm. Everything must work for people intimidated by technology.

**Functionality over aesthetics:** Sites should be professional with personality, but FUNCTIONALITY sells. Don't get stuck in design rabbit holes.

**Sherman tank philosophy:** Volume over customization. Every site is the same. More running Shermans = more money.

**Platform rollout:** Scaffold → model sites → first 3-4 real builds → repeatable workflow by site 5+.

---

## Strategic Principles — Locked (Session #4)

1. **Under-promise/over-deliver / radio silence:** No announcements, no hype, no feature previews. Build in silence.
2. **No public roadmaps:** Apple model. Feature drops as surprises.
3. **No timeframes to clients:** "It gets done when it gets done." Never attach a date to a deliverable.

---

## Service Scope — What SS Does and Does Not Do

**YES — Core product:** Branded rep website (Option A), all automations, chatbot, jewelry database, FAQ/knowledge base, site analytics, QR code, branding assets handoff.

**YES — Add-ons:** Business cards (menu of designs, agentic pipeline, pricing TBD).

**NO — Dropped/Out of scope:** Social media images/graphics, logo design, flyers, any graphic design beyond sites and cards, training/education tools for team leads, custom site layouts, non-BP website builds.

---

## Competitive Landscape & Market Context

**What reps currently use:** Linktree/bio links (most common), Facebook Pages, TikTok, Instagram, nothing.

**Sparkle Suite's advantages:** Only product purpose-built for BP reps, show automation, SEO/GEO discoverability, trade board (most demanded), 24/7 jewelry store model, voice-enabled chatbot (unprecedented), BP jewelry database (unique data asset, network effect), AI-enhanced photos.

**Competitive posture:** "Don Draper effect: I don't think about you at all." No competitor monitoring.

**BP product context:** Standard jewelry (nickel-free, brass, triple-plated), sterling (.925), gold vermeil (.925 with 12K plating), unicorns (rare/sought-after), diamonds (actual diamond pieces — rarest reveal).

---

## Total Addressable Market

Louis's gut estimate: 1,500-2,000+ active reps minimum. Conservative. 100 clients = less than 7% market penetration at conservative estimate. Research needed: BP financials, income disclosures, active vs total rep count.

---

## BP Rep Budget Reality

**Big Three (recurring):** Inventory, shipping, time. **Small stuff:** Business cards, promo materials, personal package touches. **Tools:** Most reps spend near zero (Linktree, phone, TikTok = free).

**Commission:** ~30-40% of sales. Lindsey ~$4K profit (timeframe unclear — need to verify).

**Pricing implications:** TIME savings is the real ROI pitch. Value must be obvious and immediate.

---

## Scaling Plan

**Pace:** One new client per week to start. Reassess after processes refined. Gut feel on when to accelerate.

**How it works:** Agents and automations do the vast majority. Louis = QA, design review, client meetings, process improvement. Human touchpoints are the bottleneck.

---

## Marketing & Go-to-Market

**Zero active marketing.** No social media, no paid ads, no content marketing. Product markets itself through customer experience. Referral is the only channel — informal, not a program.

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
