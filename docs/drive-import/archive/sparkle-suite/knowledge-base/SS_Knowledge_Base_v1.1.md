# Sparkle Suite — Knowledge Base & Strategic Starting Point

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No — working reference, not always-needed
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any strategic planning session that changes direction, scope, or priorities

**Version:** 1.1 | **Created:** April 7, 2026 | **Last Updated:** April 7, 2026 | **Status:** WORKING DRAFT — Building toward SS_Master_Plan_v1.0

---

## Purpose of This Document

This is the single starting reference for the Sparkle Suite strategic planning series. It captures everything we know — what's been built, what's been decided, what's been dreamed up, and what's still undefined. The goal is to give every future session a clean foundation to research and build from. This document will evolve into SS_Master_Plan_v1.0.md once all Q&A topics are covered and decisions are locked.

**Relationship to other documents:**
- **SS_Knowledge_Base (this file)** — Living reference, evolves each session
- **SS_Cross_Reference_Analysis.md** — Gap analysis between this file and the Master System Outline (generated Session #1)
- **SS_Master_System_Outline.md** — Legacy operational document (March 2026), still valid for pipeline and workflow reference
- **HQ_Master_Plan_v1.2.md** — Separate document for Neon Rabbit HQ. Sparkle Suite has a MODULE inside HQ but its own separate master plan.
- **SS_Master_Plan_v1.0.md** — To be created once Q&A is complete and decisions are locked

---

## Table of Contents

1. [What Is Sparkle Suite](#1-what-is-sparkle-suite)
2. [How We Got Here — History & Timeline](#2-how-we-got-here--history--timeline)
3. [Current State — What Exists Today](#3-current-state--what-exists-today)
4. [Client Roster & Status](#4-client-roster--status)
5. [Current Tech Stack & Infrastructure](#5-current-tech-stack--infrastructure)
6. [Business Model & Pricing](#6-business-model--pricing)
7. [Platform Architecture — Decided](#7-platform-architecture--decided)
8. [Rep Portal / Dashboard — Decided](#8-rep-portal--dashboard--decided)
9. [Trade Board — Decided](#9-trade-board--decided)
10. [Live Reveal Queue Co-Pilot — Decided](#10-live-reveal-queue-co-pilot--decided)
11. [Native Calendar System — Decided](#11-native-calendar-system--decided)
12. [SEO/GEO Lifecycle — Decided](#12-seogeo-lifecycle--decided)
13. [Build Philosophy & Operational Principles — Decided](#13-build-philosophy--operational-principles--decided)
14. [The Grand Vision — Everything Discussed](#14-the-grand-vision--everything-discussed)
15. [What's Solid vs What's Grey](#15-whats-solid-vs-whats-grey)
16. [Known Problems & Pain Points](#16-known-problems--pain-points)
17. [Competitive Landscape & Market Context](#17-competitive-landscape--market-context)
18. [Relationship to Other Neon Rabbit Projects](#18-relationship-to-other-neon-rabbit-projects)
19. [Open Questions — The Research Agenda](#19-open-questions--the-research-agenda)
20. [Q&A Session Tracker](#20-qa-session-tracker)
21. [Session Log](#21-session-log)

---

## 1. What Is Sparkle Suite

Sparkle Suite is an automated website and tools platform built specifically for Bomb Party jewelry representatives. It gives independent Bomb Party reps a professional web presence — branded websites with live show automation — replacing the scattered links and social-media-only approach that most reps rely on, especially after TikTok's disruption of off-platform traffic.

The core value proposition: a rep gets a fully branded, mobile-first website with live show features (calendar sync, reveal queue, event countdown) for a monthly subscription, with zero technical knowledge required. Neon Rabbit builds it, hosts it, maintains it, and provides the automation tools. The rep just shows up and sells jewelry.

Sparkle Suite is Neon Rabbit's primary revenue-generating product and the most mature project in the portfolio. It is a TWO-SIDED PLATFORM: one side serves reps (websites, tools, automations), the other will eventually serve customers/collectors (community, trade, collections). The rep side is the priority.

---

## 2. How We Got Here — History & Timeline

### Origins
Louis identified a gap in the Bomb Party rep ecosystem: reps were operating entirely through TikTok, Facebook, and scattered Linktree-style pages. When TikTok's algorithm and policy changes disrupted off-platform traffic, reps had no owned web presence to fall back on. Sparkle Suite was born to fill that gap.

The origin story: Louis's sister Lindsey (Mile High Fizz) asked him to build her a website. That first build revealed the opportunity — every Bomb Party rep has the same problem, and the solution is repeatable.

### Build Approach — The Readdy Era
All Sparkle Suite client sites to date have been built using Readdy.ai, an AI-powered site builder. The workflow is intentionally cookie-cutter:

1. Copy a sterile template in Readdy
2. Run the client through the Builder Dashboard (Steps 1-4 — branding, calendar setup, etc.)
3. Send two Readdy prompts to brand the site
4. Run a Readdy branding pass for card styling
5. Execute the post-launch SEO/GEO checklist
6. Final check-off (live data, timezone, buttons)
7. Send welcome email with portal credentials and calendar guide

This approach optimizes for speed and consistency over customization. The template is the same for every rep; what changes is the branding (colors, photos, copy, TikTok links).

Readdy has been downgraded from ~$80/mo to ~$20/mo (maintenance tier). Goal is to eliminate Readdy entirely once the NR platform can build and host client sites.

### Key Milestones
- **January 2026:** Sparkle Suite project created, initial planning
- **February 2026:** First client meetings (Heather/BlingKitchen, Brittany/BrittwithBling), service agreement template drafted
- **March 2026:** Mile High Fizz (Lindsey) live as original/prototype site. Sprinkled in Diamonds (Kara) launched as first full-workflow client. Bri's Glowtique and Bling Kitchen completing builds on Readdy. Builder Dashboard v1.5.0 shipped. Calendar Guide v1.0 created. GitHub repo + vault established. Phase 2 platform build kicked off (yoursparklesuite.com scaffolded on Vercel). Master System Outline v1.0 written.
- **April 2026:** Bling Kitchen launched with full SEO/GEO gold standard. SEO/GEO retrofit queue established. Neon Rabbit HQ planning identified Sparkle Suite module needs. Strategic planning series begun (this document).

---

## 3. Current State — What Exists Today

### What's Built and Working
1. **Client websites on Readdy.ai** — Branded rep sites with:
   - Live Event Calendar (Google Calendar synced, shows next 2 upcoming shows, discount codes in event descriptions)
   - Live Reveal Queue Co-Pilot (Chrome extension — currently broken for all except Mile High Fizz, rebuild in progress)
   - Event countdown timer
   - TikTok live ticker (announces when live)
   - Navigation to Bomb Party open party (minimized clicks)
   - Mobile-first responsive design

2. **Builder Dashboard** — SparkledSuite_Dashboard.html (v1.5.0)
   - Standalone HTML file, runs in any browser, no login/server required
   - Automates calendar sync setup for Readdy-built sites
   - Uses browser localStorage (temporary — will move to Supabase)

3. **Calendar Guide** — SparkleSuite_CalendarGuide.html (v1.0)
   - Client-facing branded HTML doc explaining Google Calendar usage
   - Delivered via welcome email; future home is the rep portal

4. **yoursparklesuite.com** — Platform scaffold
   - Next.js scaffold deployed on Vercel
   - GitHub repo: louis623/sparkle-suite (GitLab mirror for redundancy)
   - Currently a scaffold only — no functional features

5. **GitHub Vault** — /vault folder in sparkle-suite repo
   - 7 Markdown files for autonomous agent consumption (Layer 4)

6. **SEO/GEO Standard** — Established via Bling Kitchen gold standard session
   - Full checklist documented in NR_PostLaunch_SEO_GEO_Checklist_v1.0.md

### What's NOT Built Yet
- Rep portal (individual logins, self-service)
- Native calendar (replacing Google Calendar/Apps Script)
- Trade board (either type)
- SMS/email show reminders and audience communication
- News blast tool
- Jewelry library
- Site update portal
- Audience/contact management
- AI show assistant
- Multi-stream support
- The central platform itself
- Prompt library
- FAQ / knowledge base for reps

---

## 4. Client Roster & Status

### Active Clients (as of April 7, 2026)

| # | Name | Business Name | Domain | Status | Monthly Rate | Notes |
|---|------|--------------|--------|--------|-------------|-------|
| 1 | Kara Weeks | Sprinkled in Diamonds | sprinkledindiamonds.com | ✅ Fully launched | TBD (look up) | Business card + social media branding package in queue, needs invoicing. SEO/GEO retrofit needed. |
| 2 | Bri (Brianna Williams) | Bri's Glowtique | brisglowtique.com | ⚠️ Live but NOT officially launched | $39/mo | Launched early at her request. Owes launch fee. Needs: bigger changes, calendar training, official launch email with credentials/guide. Also sells Sensi + beauty products (affiliate) — multi-brand = Option B candidate. |
| 3 | Heather Daugherty | The Bling Kitchen | theblingkitchen.com | ✅ Live | TBD (look up) | Full SEO/GEO gold standard complete. Also does cooking show on TikTok — multi-brand = Option B candidate. "In the Pantry" recipe section. Source of 2 waitlist referrals. Follow up re: branding package. |
| 4 | Brittany Osborne | Brittwith Bling | (TBD) | ✅ Completed & operational | $39/mo | Fully paid. Needs backend SEO + polish. Has pipeline of referrals waiting. Chrome extension was broken on her site (caused browser refresh loop). Has severe IT anxiety — design for non-technical users. |
| 5 | Lindsey Chapman | Mile High Fizz | milehighfizz.com | ✅ Completed & operational | Free (sister) | First SS site ever built — the origin story. Running older startTime pattern. Needs backend SEO + polish. BP dashboard access available for testing automations. Louis logs in from his computer to run her Chrome extension. Does everything from her phone. |

### Non-Bomb-Party Client
| 6 | Desie Roberts | Roberts Photo Studio | mybostonpassportphotos.com | ✅ Live | Pro bono | Family client (father-in-law). Boston, MA passport photos. Smart Calendar + AI agent. HIGH PRIORITY for local/geo SEO — goal is #1 Boston ranking. |

### Grandfathered Client Policy
- First 5 clients locked at their current rates forever — rates will never be raised
- All future upgrades and new automations included at no extra charge
- WILL be charged for add-ons: business cards, extra branding, extra site changes, work beyond standard scope
- This is a permanent commitment

### Waitlist
- 2 referrals from Heather (Bling Kitchen) — not on a formal list yet. Louis told Heather they're working on backend things and will get to them ASAP.
- Brittany has indicated she'd refer multiple people once things are ready — potential significant pipeline.

### Team Hierarchy (Bomb Party — Fizz City)
```
Fizz City (umbrella team)
├── Brittany Osborne (BrittwithBling) — senior/founding rep
│   ├── Karen (Opal Sparkling Gems) — Brittany's first downline
│   │   ├── Heather Daugherty (BlingKitchen) — Karen's downline / Mara's mother
│   │   └── Mara (bootsandbling) — Karen's first downline / Heather's daughter
│   └── Lindsey Chapman (Mile High Fizz) — under Brittany directly
├── Kara Weeks (Sprinkled in Diamonds)
└── Bri (Bri's Glowtique) — Fizz City / Hustle and Heart team
    └── Mandy (Bri's upline — Bri and Brittany on same umbrella, not direct line)
```

---

## 5. Current Tech Stack & Infrastructure

### Site Building (Current — Being Phased Out)
- **Readdy.ai** — AI-powered site builder (~$20/mo maintenance tier, down from ~$80)
- **Builder Dashboard** — Standalone HTML tool for calendar sync setup (v1.5.0)
- **Google Calendar + Apps Script** — Powers the live event calendar (being eliminated)
- **DNS** — Managed via Cheapnames

### Platform (yoursparklesuite.com — Being Built)
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Hosting:** Vercel (auto-deploy on push to main)
- **Source Control:** GitHub (louis623/sparkle-suite) + GitLab mirror
- **Database:** Supabase (neon-rabbit-core, shared with other NR projects)
- **Payments:** Stripe (planned, not integrated)
- **Email:** Resend (planned)
- **Scheduling:** Cal.com (client scheduling, embedded on neonrabbit.net/sparklesuite temporarily)
- **Agreements:** SignWell

### Local Dev
- Windows-based, C:\Users\louis\sparkle-suite
- VS Code, Git, Node.js LTS, npm
- Claude Code for autonomous builds

---

## 6. Business Model & Pricing

### Ownership Model — Lease (Locked)
- Neon Rabbit retains sole ownership of all code, design files, CSS, blueprints, backend
- Client gets a non-transferable license while subscription is active
- Client owns their personal logos, photos, and written copy
- Neon Rabbit-purchased domains: NR owns exclusively
- Cancellation: site taken offline at end of paid billing cycle, no files provided

### Pricing — Current Clients (Grandfathered)
Locked at whatever they're paying. Lindsey = free. Britt and Bri = $39/mo. Heather and Kara = need to look up. Doesn't matter operationally — payments captured in Stripe.

### Pricing — New Clients (Going Forward)
Tier-based pricing with a START FEE added (skin in the game):

| Tier | Setup | Monthly | Key Features |
|------|-------|---------|-------------|
| **Sparkle** | $149 + start fee | $69 | Custom site (5 pages), SSL/hosting, 4 updates/mo, SEO, 2hr support, Live Party Auto-Sync, Live Reveal Queue |
| **Sparkle Pro** | $249 + start fee | $99 | + Rep trade board, SMS/email reminders, news blast, jewelry library, site update portal, audience management |
| **Elite** | $399 + start fee | $149 | + AI show assistant, multi-stream, chat/sales AI, advanced live queue, priority updates, 4hr support, early access, dedicated onboarding |

**Option B Premium:** Clients needing standalone/custom sites (multi-brand reps like Heather and Bri) pay a premium upgrade. Pricing model TBD.

### Add-Ons (Any Tier)
- Social and Print Kit: $125 (+ optional $125 for 1,000 printed business cards with QR code)
- Extra pages: $25/page one-time
- Extra support hours: $75/hour

### Pricing Status
- Start fee amount not yet determined
- Tier features need to be reconciled with what actually exists (many Pro/Elite features are undefined)
- Full pricing review deferred — locks when platform and features are defined

### Revenue Model (Long-Term Vision)
- Monthly subscriptions from reps (primary)
- Transaction rev-share from customer marketplace (future)
- Premium tier for AI assistant features
- Option B premium for custom/standalone sites

---

## 7. Platform Architecture — Decided

### URL Structure (Decided April 7, 2026)
- **yoursparklesuite.com** — The dedicated Sparkle Suite product site
  - **Rep Homepage** — Where reps learn about services, sign up, and log into their dashboard
  - **Customer Homepage** — Where Bomb Party customers/collectors access community features (future)
- **neonrabbit.net** — Neon Rabbit brand site only. Sparkle Suite moves off entirely.
- **neonrabbit.net/sparklesuite** — Temporary landing page with Cal.com embed. Being replaced by yoursparklesuite.com.

### Hybrid Site Architecture (Decided April 7, 2026)
Two models based on client needs:

**Option A — Multi-Tenant (Default)**
- Single Next.js application at yoursparklesuite.com
- Each rep gets a custom domain pointing to the same app
- App looks up domain, loads rep's branding and data from Supabase
- One codebase, one deployment, unlimited clients
- Template updates apply to ALL clients automatically
- For: Standard Bomb Party-only reps (majority of clients)

**Option B — Standalone/Custom (Premium)**
- Separate deployment for clients with multi-brand needs
- Full customization flexibility
- For: Reps who do more than Bomb Party (Heather = cooking show, Bri = Sensi/beauty affiliates)
- Premium charged upgrade — pricing TBD

Architecture must support BOTH models from day one.

### Testing Strategy (Decided April 7, 2026)
- Build a staging/sandbox environment FIRST
- Create mock-up test sites (not real clients)
- Prove the system works on mock-ups before touching any live sites
- Lindsey's BP dashboard available for testing automations, but her SITE is not the guinea pig
- First 3-4 real client builds on the new system will be the fine-tuning phase

### Platform Rollout Strategy
1. Set up scaffolding — build what we think will work
2. Build model/test sites
3. Fine-tune on first 3-4 real client builds
4. By site 5+, workflow should be solid and repeatable
5. Eventually migrate all existing Readdy sites to NR platform

---

## 8. Rep Portal / Dashboard — Decided

When a rep logs into yoursparklesuite.com, their dashboard provides:

### Feature Areas

1. **Automation Controls** — Control all automations (calendar, reveal queue, future automations). Turn on/off, configure settings.

2. **Site Update Requests** — Submit requests for website changes. Not a CMS — a request system. Neon Rabbit or an agent handles the actual changes.

3. **Dashboard Tools** — Access to operational tools (trade board management, calendar builder, prompt library, etc.)

4. **Audience Communication** — Messaging block for SMS and email blasts to their audience. Show updates, announcements, promotions. Includes access to their customer database (email + phone list of everyone signed up on their site).

5. **Help/Support** — Submit help tickets and support requests through the portal.

6. **FAQ / Knowledge Base / How-To** — Self-service resource section. Ever-growing — new content added as issues are encountered. The bigger, the better for reducing support load.

7. **Site Analytics** — View website performance data (traffic, engagement, relevant metrics).

8. **Chatbot** — AI chatbot for bouncing ideas, learning about features, and facilitating communication with Neon Rabbit.

### Core Automations (Detailed)

**Automation #1 — Native Calendar**
- Rep accesses calendar in their dashboard
- Pick a day → questionnaire (promo codes, special collections, notes)
- Easy to delete, copy, or make events recurring
- Website dynamically shows next 2-3 upcoming shows, always adjusting
- Source of truth is Supabase — NO Google Calendar dependency
- Optional one-way "Add to Calendar" export for rep's personal calendar

**Automation #2 — Live Reveal Board**
- Scrapes rep's Bomb Party dashboard for real-time reveal status
- Website displays: "LIVE ON AIR — currently revealing [customer]"
- Ordered list of customers waiting to be revealed
- Customers see where they are in the queue while watching the show
- Currently: Chrome extension (being rebuilt). Future: Bomb Party API direct access.

**Automation #3 — SMS/Email Alerts**
- Customers sign up on rep's website for alerts
- Calendar integration: rep sets 15 or 30 minute pre-show notification switch per event
- Automated notifications fire before shows
- Purpose: build audience for show start, drive pre-sales
- Rep can also send manual broadcasts via text box + optional image

### Design Principles
- **Extensible** — Portal must be modular with room to grow. New tools and automations added as new pain points are identified. No walls.
- **Non-technical users** — Reps have IT anxiety (Brittany is the norm, not the exception). Everything must be plug-and-play. The less they have to touch, configure, or troubleshoot, the better.
- **One place** — The portal is the rep's single place to manage everything. No going to Google Calendar, no emailing Louis, no social media DMs.

---

## 9. Trade Board — Decided

### Two Types of Trade Boards

**Type 1 — Rep Trade Board (Priority)**
Per-rep, most demanded feature. Solves live show time problem.

**How it works:**
1. During a show, a piece gets revealed but the customer doesn't want it → piece goes on trade board
2. Reps also reveal pieces as "trade fodder" during slow moments → goes on trade board
3. Customer goes to rep's website, opens the trade board
4. Browses available pieces, finds one they like
5. Clicks on it, enters name and details
6. Trade facilitated AFTER the show — this is the key time-saver
7. Rejected piece gets added to trade board as new item

**Display requirements:**
- Photo(s) of jewelry + photo of description/reveal box
- Piece description (materials, type, Bomb Party "MSRP")
- Categories and value tiers
- Rows of cards, new row auto-added when full
- Must look PROFESSIONAL — not sloppy phone photos
- Unicorns, diamonds, and higher-end pieces highlighted prominently (own row, top of board, or special treatment)

**Rep workflow for adding items:**
- Sign into dashboard in Sparkle Suite hub
- Upload photo(s) — jewelry photo + description/reveal box photo
- AI auto-enhances photo to catalog quality (build own tool or use third-party)
- Item listed on trade board with description captured
- As automated as possible — minimal rep effort

**Additional capabilities:**
- Reps can facilitate trades WITH EACH OTHER (rep-to-rep)
- Customers can PURCHASE pieces outright (not just trade) — mini storefront capability
- AI could potentially OCR the reveal box photo to auto-fill listing details

**Architecture:** Data and management lives in the hub (Supabase). Rep manages through their dashboard. Customer-facing view embeds on the rep's website. Same pattern as calendar.

**Type 2 — Master Customer Trade Board (Shelved)**
Platform-wide, lives in the customer-facing side of yoursparklesuite.com. Customers trade pieces they've already bought with each other. Reps can browse for arbitrage. Much bigger scope — needs own planning phase. Part of the broader customer community vision (social place, collection showcase, buy/sell/trade). Architecture must be designed to support this later even though we're not building it now.

### Research Needed
- How do value tiers work in practice in the Bomb Party community?
- How are trades facilitated after the show? (Shipping? Local pickup?)
- What existing trade board examples are out there? What do they do well/poorly?
- Can AI read the description from the reveal box photo automatically (OCR/vision)?
- Revenue model — does NR charge for trades? Commission? Included in subscription?
- AI photo enhancement options — build vs buy

---

## 10. Live Reveal Queue Co-Pilot — Decided

### Current State
- Chrome extension scrapes Bomb Party rep dashboard live order list
- Dashboard has customer first names + checkboxes (checked = revealed, unchecked = waiting)
- List is INVERTED: first unchecked (closest to last checked) = currently being revealed. Going up = queue order.
- Extension reads this and builds a live queue display on the rep's website

### Status by Client
- **Mile High Fizz:** Working — but Louis runs it from his computer (Lindsey is phone-only)
- **Britt with Bling:** BROKEN — caused browser refresh loop, currently turned off
- **All others:** Not deployed

### Rebuild Plan (ACTIVE — April 7, 2026)
- Rebuild as bulletproof Chrome extension in Claude Code session (today)
- Publish through Chrome Web Store (clean download, auto-install)
- Easy on/off toggle for reps
- Thoroughly test before deploying to any client
- Design for non-technical users (IT-anxious reps)

### Critical Limitation
- Chrome extensions don't work on mobile/phone-only reps
- Lindsey does everything from her phone — extension is useless without Louis running it from his computer
- This limitation only goes away with Bomb Party API access (server-side data pull)

### Long-Term Solution
- Approach Bomb Party for API access to order/reveal pages
- Server-side data pull eliminates Chrome extension entirely
- Works regardless of device (phone or computer)
- More reliable than scraping
- Requires demonstrated value position first

---

## 11. Native Calendar System — Decided

### Decision (April 7, 2026)
- Google Calendar and Apps Script are being DROPPED COMPLETELY
- No Google Calendar integration offered
- Native calendar lives entirely in Supabase
- Managed through rep's portal dashboard

### How It Works
- Rep picks a day in their dashboard calendar
- Questionnaire: promo codes, special collections being highlighted, notes
- Easy to delete, copy, or make events recurring
- Website dynamically shows next 2-3 upcoming shows
- Always adjusting based on calendar data
- Source of truth: Supabase. Website reads directly from database.

### Optional Feature
- "Add to Calendar" export button — one-way push to rep's personal calendar (Google, Apple, etc.)
- Convenience only — not a sync, not a dependency
- Rep's personal calendar is never the source of truth

### What This Eliminates
- Google Calendar dependency
- Google Apps Script middleware
- Builder Dashboard Steps 2 and 3
- All fragility from third-party calendar syncing

---

## 12. SEO/GEO Lifecycle — Decided

### Three Phases (Decided April 7, 2026)

**Phase 1 — Pre-Launch**
All SEO/GEO boxes checked before site goes live. Standard minimum defined and enforced.

**Phase 2 — Post-Launch**
Initial optimization pass (Bling Kitchen gold standard). Full checklist execution.

**Phase 3 — Ongoing Maintenance**
Regular assessment and improvement. Vision: agents (weekly or monthly cadence) assess each site, identify improvements, submit recommendations for approval, execute once approved. Keep sites ranked high and incorporate new developments, especially GEO (moving fast).

### Standard Minimum
Needs to be formally defined — the baseline every site must meet. All current sites need to be verified against this baseline.

### Workflow Principle
All SEO/GEO work done in bite-sized pieces. Individual tasks, not monolithic passes. Accuracy is better, issues are easier to identify.

### Prompt Library
Tested, proven SEO/GEO prompts stored in the Sparkle Suite hub. Accessible by both Louis and agents. Prevents recreating prompts every time. Produces consistent, standard results across all sites.

---

## 13. Build Philosophy & Operational Principles — Decided

### Louis's Role in Builds
- **Design review** — Making sure design meets client expectations
- **QA / quality control** — Checking the website for issues
- **NOT:** Heavy building, fine-tuning, fixing. Maximum automation of build process.

### Bite-Size Everything
Standard workflow principle for ALL Sparkle Suite operations. One focused task at a time. Accuracy is better bite-sized. Issues are easier to identify. This extends Standing Rule 7 to all SS operations, not just Claude Code sessions.

### Non-Technical User Design
Reps are NOT technical. Brittany's IT anxiety is the norm. Everything must be designed for people intimidated by technology. If it can't be plug-and-play, it will cause problems at scale. Less hands-on for reps = better.

### Prompt Library
Tested, proven prompts accessible by both humans and agents in the Sparkle Suite hub backend. Like the Calendar Builder HTML tool but for all operational prompts and workflows. Pick which prompt you need, copy it, use it. Prevents recreating from scratch every time. Produces consistent results at 100+ client scale.

### Platform Rollout
Scaffolding → model sites → first 3-4 real builds (fine-tuning) → repeatable workflow by site 5+.

### Agent Planning
Last phase of planning series. Need full scope understanding before designing agent architecture. Could be one agent, multiple specialized agents, mix of agents and Make.com automations, or something else. The answer depends on understanding the full picture first.

---

## 14. The Grand Vision — Everything Discussed

### Rep-Side Features
1. ✅ Branded website (exists on Readdy)
2. ✅ Show calendar (exists, being rebuilt as native)
3. ✅ Live Reveal Queue (exists, being rebuilt as Chrome extension)
4. 🔲 Rep trade board (detailed concept, needs technical spec)
5. 🔲 SMS show reminders (concept defined, needs technical design)
6. 🔲 Email show reminders (concept defined, needs technical design)
7. 🔲 News blast tool (mentioned, not specified)
8. 🔲 Jewelry library access (mentioned, not specified)
9. 🔲 Site update portal/request system (concept defined)
10. 🔲 Audience/contact management (concept defined)
11. 🔲 AI show assistant (undefined — what does it do?)
12. 🔲 Multi-streaming support (mentioned, not specified)
13. 🔲 Rep portal with dashboard (detailed concept)
14. 🔲 FAQ / knowledge base (concept defined)
15. 🔲 Chatbot (concept defined)
16. 🔲 Site analytics (concept defined)
17. 🔲 AI photo enhancement for trade board (concept defined)
18. 🔲 Prompt library (concept defined)

### Customer/Collector-Side Features (Shelved — Architect For Later)
19. 🔲 Master customer trade board
20. 🔲 Collection showcase
21. 🔲 Buy/sell/trade marketplace
22. 🔲 Reputation/rating system
23. 🔲 Community social feed

### Platform-Wide
24. 🔲 AI backbone (image enhancement, site updates, show assistance)
25. 🔲 Neon Rabbit-native platform (move off Readdy)
26. 🔲 Stripe integration (automated billing)
27. 🔲 Newsletter

### Scale & Growth
28. 🔲 100+ clients target
29. 🔲 Niche replication (other direct-sales companies)
30. 🔲 Dedicated project lead hire
31. 🔲 Bomb Party API access
32. 🔲 Rep streaming support service (human-staffed)

---

## 15. What's Solid vs What's Grey

### SOLID — Proven, Working, or Decided
- Core value proposition validated — clients are paying
- Cookie-cutter model is the right approach for standard reps
- Lease/ownership model locked
- SEO/GEO gold standard established
- Client roster is real with waitlist and referral pipeline
- Tech stack confirmed
- Platform architecture decided (hybrid A+B, yoursparklesuite.com)
- Rep portal feature set defined (8 areas)
- Trade board concept defined (two types, priority on rep trade board)
- Three core automations defined (calendar, reveal queue, SMS/email)
- Native calendar replacing Google Calendar (decided)
- Build philosophy locked (Louis = design + QA, bite-size everything)
- Testing strategy decided (sandbox first)
- Pricing direction set (tiers + start fee, existing clients grandfathered)

### GREY — Needs Research, Design, or Decisions
- Site hosting solution (where do NR platform sites actually live?)
- Multi-tenant technical implementation details
- Trade board technical spec (data model, value tiers, facilitation)
- SMS/email provider and TCPA compliance
- AI features (Pro/Elite tiers — undefined)
- Pricing specifics (start fee amount, Option B premium pricing)
- Go-to-market strategy
- Scaling plan (5 → 100 clients)
- Agent architecture
- Newsletter content/tooling
- Bomb Party intelligence system
- Niche replication viability

---

## 16. Known Problems & Pain Points

### Operational
1. Everything is manual — site builds, updates, billing, support
2. Readdy dependency — sites live on third-party infrastructure
3. Google Calendar dependency — being eliminated
4. No monitoring — no way to know if a site goes down or automation breaks
5. Support is ad hoc — no ticket system, no SLAs

### Product
6. Live Reveal Queue is broken — rebuild in progress
7. No trade board — most demanded feature
8. Sites are static brochure-ware with a calendar
9. Chrome extension doesn't work for phone-only reps

### Business
10. Pricing confusion — being resolved through tier structure
11. 5 clients, not 100 — path to scale is being planned
12. No marketing engine — word-of-mouth only
13. Bri owes launch fee — launched early, broke standard workflow

---

## 17. Competitive Landscape & Market Context

### What Bomb Party Reps Currently Use
- Linktree / bio link pages (most common, no show features)
- Facebook Pages / Groups (platform-dependent)
- TikTok (primary sales channel, algorithm-dependent)
- Instagram (secondary social)
- Nothing (many reps have no web presence)

### Sparkle Suite's Competitive Advantage
- Only product purpose-built for Bomb Party reps
- Show automation (calendar, live queue, countdown)
- SEO/GEO discoverability
- Professional branding
- Trade board (when built) — most demanded, biggest differentiator

### Bomb Party Product Context
- Standard jewelry: Nickel-free, brass, triple-plated
- New sterling collection: .925 sterling silver
- New gold vermeil: .925 sterling silver with 12K gold plating
- Unicorns: Rare/sought-after pieces (not diamonds)
- Diamonds: Actual diamond pieces — rarest reveal
- Replacement form at bombparty.com

---

## 18. Relationship to Other Neon Rabbit Projects

### Neon Rabbit HQ
Sparkle Suite has a MODULE inside HQ with:
- Customer Board (client status, health indicators)
- Full Lifecycle Workflow Map
- Project Financials (internal P&L)
- Bomb Party Intelligence monitoring
- Future mirror view for project lead

HQ is Louis's command center. Sparkle Suite is the product. Separate applications, separate planning documents, shared Supabase infrastructure.

### The Rabbit Hole
No direct dependency. Shares Supabase, Vercel, GitHub, standing rules. Rabbit Hole is PARKED for the rest of the week — Sparkle Suite is the active priority.

### Shared Infrastructure
- Supabase: neon-rabbit-core (us-east-1, ref bqhzfkgkjyuhlsozpylf)
- HQ table: sparkle_clients (avoids open_brain collision)
- All projects share Vercel account, GitHub org, deployment pipeline

---

## 19. Open Questions — The Research Agenda

### Covered in Q&A (Decisions Made — See Sections 7-13)
- ~~Platform URL structure~~ → Decided
- ~~Site architecture (A vs B)~~ → Hybrid decided
- ~~Trade board concept~~ → Two types defined
- ~~Rep portal features~~ → 8 areas defined
- ~~Calendar system~~ → Native Supabase, drop Google
- ~~SEO/GEO approach~~ → Three-phase lifecycle
- ~~Build philosophy~~ → Louis = design + QA only
- ~~Agent planning timing~~ → Last phase
- ~~Readdy future~~ → Phase out entirely
- ~~Pricing direction~~ → Tiers + start fee

### NOT Yet Covered (Remaining Q&A Topics)

**Technical Design:**
- OQ-1: SMS/Email automation — provider, TCPA compliance, cost model, opt-in/out mechanics
- OQ-2: Site hosting solution — where do NR platform sites live? Can Vercel host 100+ client domains?
- OQ-3: Multi-tenant technical implementation detail
- OQ-4: Trade board technical spec — data model, value tiers, facilitation mechanics
- OQ-5: AI photo enhancement — build vs buy

**Product Definition:**
- OQ-6: AI show assistant — what does it actually do? (Elite tier feature)
- OQ-7: Chat/sales AI — what does it do on a rep's website? (Elite tier feature)
- OQ-8: Jewelry library — what is it, who maintains it?
- OQ-9: Newsletter — content strategy, cadence, tooling, audience
- OQ-10: Bomb Party intelligence system — what to monitor, how, frequency

**Business & Growth:**
- OQ-11: Scaling plan — 5 to 100 clients (infrastructure, support, build process, revenue projections)
- OQ-12: Marketing & go-to-market strategy beyond Fizz City network
- OQ-13: Total addressable market — how many active BP reps exist?
- OQ-14: What do BP reps spend money on? Budget reality?
- OQ-15: What does BP's own rep support ecosystem look like?
- OQ-16: Timeline/trigger for hiring a dedicated project lead
- OQ-17: Option B premium pricing model
- OQ-18: Reconciling tier features with what actually exists
- OQ-19: Niche replication — viable? What other companies?

**External:**
- OQ-20: Approaching BP for API access — proposal strategy, demonstrated value
- OQ-21: Existing trade board examples in the BP community — research needed

**Design:**
- OQ-22: Customer-facing homepage design/content
- OQ-23: Rep-facing homepage design/content
- OQ-24: Service agreement updates for new pricing model

---

## 20. Q&A Session Tracker

| Topic | Status | Session |
|-------|--------|---------|
| Site architecture (hybrid A+B) | ✅ Decided | Session #1 |
| Testing strategy (sandbox first) | ✅ Decided | Session #1 |
| Trade board concept (two types) | ✅ Brain dump captured | Session #1 |
| Rep portal features (8 areas) | ✅ Brain dump captured | Session #1 |
| Rep portal automations (calendar, reveal, SMS) | ✅ Brain dump captured | Session #1 |
| Live Reveal Queue Chrome extension | ✅ Status captured, rebuild today | Session #1 |
| Native calendar (drop Google) | ✅ Decided | Session #1 |
| Landing page / URL structure | ✅ Decided | Session #1 |
| Readdy migration plan | ✅ Decided | Session #1 |
| Pricing clarification | ✅ Decided | Session #1 |
| Agent planning approach | ✅ Decided (last phase) | Session #1 |
| SEO/GEO lifecycle | ✅ Decided (3-phase) | Session #1 |
| Prompt library concept | ✅ Decided | Session #1 |
| Build philosophy | ✅ Decided | Session #1 |
| Platform rollout strategy | ✅ Decided | Session #1 |
| SMS/Email technical design | ❌ Not yet covered | — |
| Scaling plan (5→100) | ❌ Not yet covered | — |
| Marketing/go-to-market | ❌ Not yet covered | — |
| AI features definition | ❌ Not yet covered | — |
| Bomb Party intelligence | ❌ Not yet covered | — |
| Newsletter | ❌ Not yet covered | — |
| Niche replication | ❌ Not yet covered | — |
| TAM / market size | ❌ Not yet covered | — |
| BP API approach strategy | ❌ Not yet covered | — |
| Option B premium pricing | ❌ Not yet covered | — |
| Tier feature reconciliation | ❌ Not yet covered | — |
| Homepage designs | ❌ Not yet covered | — |
| Hosting solution research | ❌ Not yet covered | — |

---

## 21. Session Log

| Date | Session | Key Outcomes |
|------|---------|-------------|
| April 7, 2026 | Planning Session #1 | KB v1.0 created, Cross-Reference Analysis created, all 6 contradictions resolved, Q&A brain dump began (15 topics covered, 13+ remaining). Standing Rules v3.3 generated (Rule 13 added). Chrome extension rebuild flagged as active build task for today. |

---

## Appendix A — Key Documents Reference

| Document | Location | Status |
|----------|----------|--------|
| SS_Knowledge_Base_v1.1.md (this file) | Google Drive /Neon Rabbit/ | Living reference ✅ |
| SS_Cross_Reference_Analysis.md | Google Drive /Neon Rabbit/ | Reference ✅ |
| SS_Master_System_Outline.md | Google Drive /Neon Rabbit/ | Legacy operational doc — still valid for pipeline reference |
| NR_PostLaunch_SEO_GEO_Checklist_v1.0.md | Google Drive /Neon Rabbit/ | Working reference |
| SparkledSuite_Dashboard.html | Local / repo | Builder Dashboard v1.5.0 |
| SparkleSuite_CalendarGuide.html | Local / repo | Client-facing calendar instructions |
| GitHub Vault (/vault in sparkle-suite repo) | GitHub | 7 Markdown files for agent consumption |

## Appendix B — Bomb Party Glossary

| Term | Definition |
|------|-----------|
| Reveal | The moment a jewelry piece is shown/unwrapped during a live show |
| Unicorn | A rare/sought-after piece revealed during shows (not an actual diamond) |
| Diamond | An actual diamond piece — the rarest possible reveal |
| Batting Order | The queue order for reveals during a live show |
| Downline | A rep recruited by another rep in the MLM structure |
| Upline | The rep who recruited you |
| Sterling Collection | .925 sterling silver jewelry line |
| Gold Vermeil | .925 sterling silver with 12K gold plating |
| Trade Fodder | Pieces revealed without a customer attached, available for trading |
| Replacement Form | Form at bombparty.com for defective/damaged piece replacement |

---

*This knowledge base is the living foundation for the Sparkle Suite strategic planning series. Update every session that produces decisions. When all Q&A topics are covered and decisions are locked, this evolves into SS_Master_Plan_v1.0.md.*
