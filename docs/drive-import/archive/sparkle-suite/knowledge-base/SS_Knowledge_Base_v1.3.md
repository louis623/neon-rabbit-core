# Sparkle Suite — Knowledge Base & Strategic Starting Point

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No — working reference, not always-needed
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any strategic planning session that changes direction, scope, or priorities

**Version:** 1.3 | **Created:** April 7, 2026 | **Last Updated:** April 7, 2026 | **Status:** WORKING DRAFT — Building toward SS_Master_Plan_v1.0

---

## Purpose of This Document

This is the single starting reference for the Sparkle Suite strategic planning series. It captures everything we know — what's been built, what's been decided, what's been dreamed up, and what's still undefined. The goal is to give every future session a clean foundation to research and build from. This document will evolve into SS_Master_Plan_v1.0.md once all Q&A topics are covered and decisions are locked.

**Relationship to other documents:**
- **SS_Knowledge_Base (this file)** — Living reference, evolves each session
- **SS_Cross_Reference_Analysis.md** — Gap analysis between this file and the Master System Outline (generated Session #1)
- **SS_Master_System_Outline.md** — Legacy operational document (March 2026), still valid for pipeline and workflow reference
- **HQ_Master_Plan_v1.2.md** — Separate document for Neon Rabbit HQ. Sparkle Suite has a MODULE inside HQ but its own separate master plan.
- **SS_TradeBoard_Benefits_Report_v1.0.docx** — Trade board value proposition report for Lindsey review (generated Session #3)
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
9. [Chatbot as Primary Interface — Decided](#9-chatbot-as-primary-interface--decided)
10. [Trade Board — Decided](#10-trade-board--decided)
11. [Bomb Party Jewelry Database — Decided](#11-bomb-party-jewelry-database--decided)
12. [Live Reveal Queue Co-Pilot — Decided](#12-live-reveal-queue-co-pilot--decided)
13. [Native Calendar System — Decided](#13-native-calendar-system--decided)
14. [SMS/Email Automation — Decided](#14-smsemail-automation--decided)
15. [SEO/GEO Lifecycle — Decided](#15-seogeo-lifecycle--decided)
16. [Build Philosophy & Operational Principles — Decided](#16-build-philosophy--operational-principles--decided)
17. [The Grand Vision — Everything Discussed](#17-the-grand-vision--everything-discussed)
18. [What's Solid vs What's Grey](#18-whats-solid-vs-whats-grey)
19. [Known Problems & Pain Points](#19-known-problems--pain-points)
20. [Competitive Landscape & Market Context](#20-competitive-landscape--market-context)
21. [Relationship to Other Neon Rabbit Projects](#21-relationship-to-other-neon-rabbit-projects)
22. [Parking Lot — Ideas to Revisit Later](#22-parking-lot--ideas-to-revisit-later)
23. [Open Questions — The Research Agenda](#23-open-questions--the-research-agenda)
24. [Q&A Session Tracker](#24-qa-session-tracker)
25. [Session Log](#25-session-log)

---

## 1. What Is Sparkle Suite

Sparkle Suite is an automated website and tools platform built specifically for Bomb Party jewelry representatives. It gives independent Bomb Party reps a professional web presence — branded websites with live show automation — replacing the scattered links and social-media-only approach that most reps rely on, especially after TikTok's disruption of off-platform traffic.

The core value proposition: a rep gets a fully branded, mobile-first website with live show features (calendar sync, reveal queue, event countdown) for a monthly subscription, with zero technical knowledge required. Neon Rabbit builds it, hosts it, maintains it, and provides the automation tools. The rep just shows up and sells jewelry.

Sparkle Suite is Neon Rabbit's primary revenue-generating product and the most mature project in the portfolio. It is a TWO-SIDED PLATFORM: one side serves reps (websites, tools, automations), the other will eventually serve customers/collectors (community, trade, collections). The rep side is the priority.

**Business scope:** Neon Rabbit serves exactly TWO revenue-generating products — Sparkle Suite and The Rabbit Hole. No freelance web development, no outside projects. This is a hard boundary. (Decided Session #3)

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

Readdy has been downgraded from ~$80/mo to ~$20/mo (maintenance tier). Readdy stays at $20/mo for maintenance updates on existing Readdy-built sites. Not used for new builds — new clients wait for the platform. (Clarified Session #3)

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
- Chatbot / primary conversational interface
- Native calendar (replacing Google Calendar/Apps Script)
- Trade board (either type)
- Bomb Party jewelry database
- SMS/email show reminders and audience communication
- News blast tool
- Site update portal
- Audience/contact management
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
| 2 | Bri (Brianna Williams) | Bri's Glowtique | brisglowtique.com | ⚠️ Live but NOT officially launched | $39/mo | Launched early at her request. Owes launch fee. Needs: bigger changes, calendar training, official launch email with credentials/guide. Also sells Sensi + beauty products (affiliate) — stays on Readdy for non-BP content, can convert BP business to standard Option A on platform when ready. |
| 3 | Heather Daugherty | The Bling Kitchen | theblingkitchen.com | ✅ Live | TBD (look up) | Full SEO/GEO gold standard complete. Also does cooking show on TikTok — stays on Readdy for non-BP content, can convert BP business to standard Option A on platform when ready. "In the Pantry" recipe section. Source of 2 waitlist referrals. Follow up re: branding package. |
| 4 | Brittany Osborne | Brittwith Bling | (TBD) | ✅ Completed & operational | $39/mo | Fully paid. Needs backend SEO + polish. Has pipeline of referrals waiting. Chrome extension was broken on her site (caused browser refresh loop). Has severe IT anxiety — design for non-technical users. |
| 5 | Lindsey Chapman | Mile High Fizz | milehighfizz.com | ✅ Completed & operational | Free (sister) | First SS site ever built — the origin story. Running older startTime pattern. Needs backend SEO + polish. BP dashboard access available for testing automations. Louis logs in from his computer to run her Chrome extension. Does everything from her phone. Currently reviewing SS_TradeBoard_Benefits_Report_v1.0.docx for feedback. |

### Non-Bomb-Party Client
| 6 | Desie Roberts | Roberts Photo Studio | mybostonpassportphotos.com | ✅ Live | Pro bono | Family client (father-in-law). Boston, MA passport photos. Smart Calendar + AI agent. HIGH PRIORITY for local/geo SEO — goal is #1 Boston ranking. Stays as maintenance item — not a Sparkle Suite client. |

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
- **Readdy.ai** — AI-powered site builder (~$20/mo maintenance tier, down from ~$80). Stays active for maintenance of existing Readdy-built sites. Not for new builds.
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

### Pricing Model — Single Tier, Payment Frequency (Decided April 7, 2026)

**OLD TIER SYSTEM SCRAPPED.** Sparkle / Sparkle Pro / Elite tiers are retired. The chatbot-as-primary-interface decision means every rep needs the full feature set — there's no sensible way to gate features without building multiple UIs.

**NEW MODEL: One product. One feature set. Every rep gets everything.**
- Full portal with chatbot (voice-enabled)
- All automations (calendar, reveal queue, SMS/email)
- Trade board access
- Jewelry database access (search, browse, auto-populate)
- Site analytics
- FAQ / knowledge base
- Everything Sparkle Suite offers

**Payment frequency tiers (same product, different commitment):**

| Payment | Discount | Notes |
|---------|----------|-------|
| Monthly | None (base rate) | Lowest commitment, easiest entry |
| Quarterly | Modest discount | Shows commitment |
| Annual | Significant discount | Predictable revenue, meaningful savings |
| Forever (tentative) | Biggest value | Lifetime deal — needs careful pricing. Not set in stone. |

**Pricing philosophy:**
- Make it as AFFORDABLE as possible — the play is volume, not high margins
- Word of mouth does the marketing — make it so good and so fair that reps sell it for us
- A waitlist is a feature, not a problem — creates demand and exclusivity
- Grow sustainably, hire help as volume demands
- Sherman tank philosophy: more running Shermans (standard sites) is more money than fewer custom Panzers

**Start fee / deposit:** Still applies — gives new clients skin in the game. Amount TBD.

**What determines the actual price:** Must know costs first — hosting at scale, SMS/email provider, AI photo enhancement, chatbot API, infrastructure. Pricing locks AFTER research sprints answer the cost questions.

**Cancellation policy:**
- Monthly and quarterly: service cancels 7 days after the new billing cycle if unpaid
- Annual: refund policy for unused time TBD — needs research (SaaS best practices, legal requirements)
- Forever: cancellation/refund policy TBD

**Custom work pricing:** Reps who want non-BP sites (cooking shows, beauty affiliates, etc.) can discuss that as a completely separate project and separate invoice — entirely outside Sparkle Suite's scope. (Decided Session #3)

### Grandfathered Clients
First 5 clients locked at their current rates. This doesn't change under the new model.

### Add-Ons (Still Valid)
- Social and Print Kit: $125 (+ optional $125 for 1,000 printed business cards with QR code)
- Extra pages: $25/page one-time
- Extra support hours: $75/hour

---

## 7. Platform Architecture — Decided

### URL Structure (Decided April 7, 2026)
- **yoursparklesuite.com** — The dedicated Sparkle Suite product site
  - **Rep Homepage** — Where reps learn about services, sign up, and log into their dashboard
  - **Customer Homepage** — Where Bomb Party customers/collectors access community features (future)
- **neonrabbit.net** — Neon Rabbit brand site only. May be taken down or reduced to minimal brand page (links to Sparkle Suite and Rabbit Hole only) once yoursparklesuite.com is live. No services page, no contact form that invites general web dev requests. (Updated Session #3)
- **neonrabbit.net/sparklesuite** — Temporary landing page with Cal.com embed. Being replaced by yoursparklesuite.com.

### Option A Only — Standard Sites (Decided/Updated April 7, 2026)

**~~Option B (custom/standalone) has been ELIMINATED.~~** All Sparkle Suite sites are Option A — standard template, standard features, no custom work. This is the Sherman tank philosophy: volume over customization. Every site is the same under the hood, different branding on top. (Decided Session #3)

**Option A — Standard (The Only Option)**
- Rep's site lives within yoursparklesuite.com
- Rep gets their own custom domain (e.g., sprinkledindiamonds.com)
- Domain forwards/routes to their specific page/section within yoursparklesuite.com
- Standard template, standard features, standard branding variations
- Cookie-cutter approach — same structure, different branding
- For: ALL Bomb Party reps. No exceptions, no custom layouts.

**For existing multi-brand clients (Heather, Bri):**
- Their existing Readdy sites stay on Readdy for non-BP content (~$20/mo maintenance covers this)
- Their Bomb Party business can convert to a standard Option A site on the platform when ready
- If they want a separate non-BP site built, that's a completely separate conversation and separate invoice — outside Sparkle Suite's scope entirely

**Implication:** Vercel hosts ONE application with many custom domains pointing to it. Not separate deployments. Simpler, cheaper, easier to maintain.

### Data Isolation (Decided April 7, 2026)
- Each rep sees ONLY their own dashboard, automations, data, customers, trade board, calendar, analytics
- Reps cannot see each other's sites, data, or dashboards
- ONE EXCEPTION: Rep-to-rep trade board visibility for inter-rep trading (limited to trade board context only)
- Supabase RLS enforces isolation at the database level

### Branding Approach (Decided April 7, 2026)
- Branding (colors, images, copy, logo) is handled by NEON RABBIT during onboarding
- Sites should feel tailored/personal even though they're cookie-cutter under the hood
- Limits on number of images and customization options — enough to feel "theirs" without creating busy work
- WORKFLOW: Agent builds foundation and gets branding close → human (Louis or future project lead) tweaks as needed
- System must make it EASY to adjust copywriting and branding — approach TBD (prompt-based? form-based? agent-assisted with human approval?)

### Demo/Showcase Site
- Build a demonstration model site for the sales funnel
- Lives on the yoursparklesuite.com rep-facing landing page
- Shows prospective reps what the full product looks like
- Sales tool, not a live client site

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

When a rep logs into yoursparklesuite.com, their portal provides two layers: a **view layer** (read-only displays of their data) and a **conversational interface** (the chatbot handles most actions). See Section 9 for the chatbot architecture.

### Feature Areas (View Layer)

1. **Calendar View** — See upcoming shows, past shows, event details. Chatbot handles creating/editing/deleting events.

2. **Trade Board View** — See listed pieces, reservations, trade/purchase requests. Chatbot handles adding items, confirming trades, managing listings.

3. **Audience / Customer List** — See subscriber list (name, email, phone, SMS/email preference). Chatbot handles sending messages, broadcasts.

4. **Site Analytics** — View website performance data (traffic, engagement, relevant metrics).

5. **Automation Status** — See what's running, what's on/off. Chatbot handles toggling and configuration.

6. **FAQ / Knowledge Base / How-To** — Self-service resource section. Ever-growing — new content added as issues are encountered.

7. **Help/Support History** — See past tickets and requests. Chatbot creates new tickets.

8. **Site Update History** — See past site change requests and their status. Chatbot submits new requests.

### Design Principles
- **Chatbot-first** — Most actions go through the chatbot, not through forms and menus
- **View layer is simple** — Read-only displays are dramatically easier to build than full CRUD interfaces
- **Extensible** — Portal must be modular with room to grow. New views and chatbot capabilities added as new pain points are identified.
- **Non-technical users** — Reps have IT anxiety (Brittany is the norm, not the exception). Everything must be plug-and-play. The chatbot makes this possible — reps just talk to it.
- **One place** — The portal is the rep's single place to manage everything. No going to Google Calendar, no emailing Louis, no social media DMs.

---

## 9. Chatbot as Primary Interface — Decided

### Core Decision (April 7, 2026)
The rep portal chatbot is NOT just a help feature sitting in the corner. It IS the primary interaction model for the entire portal. This is a CORE ARCHITECTURE DECISION.

### How It Works
The dashboard is a **view layer + conversational interface**. Reps SEE their data through simple read-only views. They CHANGE their data by talking to the chatbot.

### What the Chatbot Can Do
- Create, edit, delete calendar events ("Add a show Saturday at 7pm, promo code SPARKLE20")
- Manage trade board listings (rep feeds images and details, chatbot handles the rest)
- Send audience notifications ("Send a reminder about tonight's show")
- Submit site update requests ("Here's a new image, replace the banner on my site")
- Update embeds ("Here's a new TikTok video, swap out the old one")
- Answer FAQ and how-to questions from the knowledge base
- Create help/support tickets behind the scenes
- Upload and process images, data, and files
- Any portal action that would otherwise require navigating forms and menus

### Voice Interface
- **Voice-to-text input** — Reps can TALK to the chatbot (like Wispr Flow AI). Hit a couple buttons and speak.
- **Text-to-speech output** — Chatbot can talk back verbally
- **Live show use case** — Rep can manage trade board, send notifications, update calendar DURING a show with minimal interruption. No stopping to type or navigate menus.
- **Text input still available** — For reps who prefer typing
- **Research needed:** Web Speech API (free, browser-native) vs cloud TTS/STT services (better quality, cost)

### Chatbot Personality
- Gets a NAME — a persona/nickname to make it feel personal (think JARVIS from Iron Man)
- Builds brand attachment — reps feel like they have a digital assistant
- Name TBD — should be on-brand for Sparkle Suite

### File & Image Handling
- Chatbot accepts image uploads, file attachments, data
- Rep can send photos, TikTok links, branding assets directly through the chat
- Chatbot processes and routes them to the right place

### Architectural Implications
1. **Drastically reduced UI complexity** — fewer forms, fewer CRUD interfaces to build
2. **Lower learning curve** — non-technical reps just talk to it
3. **Faster to build** — read-only views are much simpler than full interactive forms
4. **Absorbs the AI show assistant concept** — the voice-enabled chatbot IS the show assistant, grounded in real capabilities
5. **THE premium differentiator** — this is what makes the product worth paying for

### Boundaries — Design Needed
What can the chatbot do autonomously vs what gets escalated to Neon Rabbit? This is a design decision for the build phase.

---

## 10. Trade Board — Decided

### Function: Listing and Reservation System
The trade board is NOT a transaction platform. Neon Rabbit never handles money or shipping. The trade board connects buyers/traders and tracks the interaction. Actual exchange is handled entirely by the rep outside the platform.

### Two Types of Trade Boards

**Type 1 — Rep Trade Board (Priority)**
Per-rep, most demanded feature. Solves live show time problem.

**Trade Flow:**
1. During a show, a piece gets revealed but the customer doesn't want it → piece goes on trade board
2. Reps also reveal pieces as "trade fodder" during slow moments → goes on trade board
3. Customer goes to rep's website, opens the trade board
4. Browses available pieces, finds one they like
5. Clicks on it → enters their name, describes what they're offering to trade (or hits "Buy Now" for a purchase)
6. Piece gets RESERVED/FLAGGED — no other customer can claim it (first come, first serve lock)
7. Rep gets notified with full details: customer name, what they want, what they're offering
8. Rep confirms or releases the reservation if something falls through (item opens back up)
9. Trade/purchase facilitated AFTER the show by the rep — this is the key time-saver
10. The customer's rejected piece gets added to the trade board as a new item

**Customer interaction details:**
- Comment section / text field when reserving a piece for trade
- Customer describes the piece they're swapping (especially if just revealed)
- System captures: what was revealed, what was traded for, who was involved — clean record for the rep
- "Buy Now" option notifies the rep — no money flows through Sparkle Suite

**Display requirements:**
- Photo(s) of jewelry + photo of description/reveal box
- Piece description (materials, type, Bomb Party "MSRP")
- Categories and value tiers
- Rows of cards, new row auto-added when full
- Must look PROFESSIONAL — not sloppy phone photos
- Unicorns, diamonds, and higher-end pieces highlighted prominently

**Rep workflow for adding items (via chatbot):**
- Rep talks to chatbot or uploads through chat interface
- Sends photo(s) — jewelry photo + description/reveal box photo
- Chatbot checks jewelry database first — if piece already cataloged, auto-populates from existing record
- If new piece, AI auto-enhances photo to catalog quality (third-party service — see Section 14.5)
- Chatbot processes and lists item on trade board
- As automated as possible — minimal rep effort

**Additional capabilities:**
- Reps can facilitate trades WITH EACH OTHER (rep-to-rep) — only cross-rep visibility allowed
- Customers can PURCHASE pieces outright (not just trade)
- AI could potentially OCR the reveal box photo to auto-fill listing details
- Purchase facilitation automation — brainstorm needed on what's possible without handling money

**Architecture:** Data in Supabase. Rep manages through chatbot. Customer-facing view embeds on rep's website.

**Type 2 — Master Customer Trade Board (Shelved)**
Platform-wide, lives in the customer-facing side of yoursparklesuite.com. Customers trade pieces they've already bought with each other. Reps can browse for arbitrage. Much bigger scope — needs own planning phase. Part of the broader customer community vision. Architecture must support this later even though we're not building it now.

### Business Model Evolution — The 24/7 Jewelry Store (Session #3 Insight)

The trade board enables a fundamental shift in how reps run their business:

**Traditional model:** Rep runs a live show, reveals jewelry, hopes customers like what they get. If nobody wants a piece during the show, it sits in a box.

**Sparkle Suite model:** The live show is the entertainment and engagement engine — it brings people in. The trade board is where the real business happens — a curated, professional storefront that's open 24/7. Reps can:
- Buy their own inventory and stock their trade board like a jewelry store
- Balance reveal stock (keeps shows fun) with trade board stock (builds inventory)
- Use dead show time productively — every reveal during slow moments feeds the storefront
- Reach a market far bigger than whoever happens to be watching the live show at that moment

**Nothing is wasted.** A piece that sat unwanted during a Tuesday night show with 12 viewers can get found and reserved by a collector three states away on Saturday morning.

**The sales pitch:** "Your competitors run live shows and hope for the best. Your site is a 24/7 jewelry store with a live entertainment experience built in. Your trade board works while you sleep."

This reinforces the volume play — every rep using the trade board adds to the master jewelry database, making the platform more valuable for all reps and customers. Network effect compounds.

### Research Needed
- How do value tiers work in practice in the Bomb Party community? (Need rep Q&A — Lindsey feedback pending)
- How are trades facilitated after the show? (Shipping? Local pickup?)
- What existing trade board examples are out there? What do they do well/poorly?
- Can AI read the description from the reveal box photo automatically (OCR/vision)?
- Revenue model — does NR charge for trades? Commission? Included in subscription?
- Purchase facilitation automation possibilities

---

## 11. Bomb Party Jewelry Database — Decided

### Core Concept (April 7, 2026)
Every piece of jewelry that flows through ANY rep's trade board gets cataloged into a master database. This is a data play that builds itself as a byproduct of normal trade board usage.

### The Jewelry Library IS the Database (Resolved Session #3)
The "jewelry library" feature listed in the old tier system is NOT a separate product. It IS the jewelry database, accessed in different ways. The term "jewelry library" was just another name for browsing and searching this same database.

### Four Use Cases (Decided Session #3)

**Use Case 1 — Rep Upload Shortcut**
When a rep lists a piece on their trade board, they search the database first. If another rep has already cataloged that piece, click it and everything auto-populates — enhanced photo, description, MSRP. No re-uploading, no re-typing. If the piece doesn't exist, the rep enters it fresh and becomes the first contributor. Network effect: the bigger the database, the faster it is to use.

**Use Case 2 — Browsable Collection Reference**
Reps can search and browse the database to explore collections, check values, see what's out there. Not tied to active trading — just a reference and research tool.

**Use Case 3 — Cross-Rep Trade Facilitation**
A customer wants a specific piece the rep doesn't have. Rep searches the database, finds another rep who has it listed. Can steer the customer toward that rep or facilitate a rep-to-rep trade. Customer service feature that costs reps nothing but builds community and drives business between reps.

**Use Case 4 — Customer Portal Search (Future)**
When the customer side of yoursparklesuite.com launches, customers can search the entire database to find pieces they want for their collection. They see which reps have them available and reach out directly. Lead generation engine for reps — drives business TO them without them lifting a finger.

### Data Captured Per Piece
- AI-enhanced catalog photo (the cleaned-up version)
- Full description from the reveal box
- Bomb Party MSRP
- Any other identifiable attributes

### Why This Matters
1. **Bomb Party does NOT publicly disclose this information.** Nobody has a comprehensive catalog. This database would be UNIQUE.
2. **Grows organically** — every trade board listing from every rep adds to it. More reps = faster growth.
3. **Identifies rarity and values** — the more data, the better understanding of what's common vs rare. Keeps Bomb Party honest on MSRPs and rarity claims.
4. **Customer trade board benefit** — when the customer portal launches, customers search the existing database instead of re-uploading.
5. **Rep benefit** — if a piece is already cataloged by another rep, the current rep just searches and selects it. Skips the full upload/photo/description process.
6. **Intelligence value** — data on what pieces exist, how often they appear, what they trade for. Neon Rabbit becomes the go-to source for Bomb Party jewelry data.
7. **Competitive moat** — compounds over time, increasingly hard to replicate.

### Technical Considerations
- Unique piece identification and deduplication
- Same piece appearing across multiple reps' trade boards (one database entry, multiple listings)
- Search and matching for reps to find existing catalog entries
- Data model design — research/build phase item

---

## 12. Live Reveal Queue Co-Pilot — Decided

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

## 13. Native Calendar System — Decided

### Decision (April 7, 2026)
- Google Calendar and Apps Script are being DROPPED COMPLETELY
- No Google Calendar integration offered
- Native calendar lives entirely in Supabase
- Managed through the chatbot (primary) and viewable in the portal calendar view

### How It Works
- Rep tells the chatbot to add a show (or uses the calendar view if one is built)
- Chatbot creates the event: date, time, promo codes, special collections, notes
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

## 14. SMS/Email Automation — Decided

### Design Decisions (April 7, 2026)

**Provider:** Not selected. Needs research sprint (Twilio, Resend, alternatives).

**Three message types:**

1. **Automated pre-show reminders** — Go out 15 or 30 minutes before show starts. Tied to native calendar. Fully automated once rep sets the switch on their calendar event.

2. **Templates** — Pre-built message templates for common purposes (promotions, updates). Available but optional.

3. **Custom messages** — Rep composes via chatbot. Short messages, updates, news, announcements. Can include an optional image. Free-form, rep-initiated.

**Customer opt-in:**
- Simple signup form on the rep's website
- Customer enters: first name, last name, contact info
- Customer chooses: SMS, email, or BOTH (not forced into one)
- Creates the rep's clean lead/customer list in their dashboard
- Must be simple — minimal friction

**Compliance:**
- TCPA (SMS) and CAN-SPAM (email) compliance must be fully researched before building
- Opt-in requirements, opt-out mechanics, consent documentation, commercial message rules, penalties
- CANNOT build this feature without compliance research first

**Cost model:**
- Neon Rabbit does NOT absorb SMS/email costs
- Costs built into pricing based on provider's cost structure
- Pricing cannot be fully locked until provider is selected and costs are known

### AI Photo Enhancement
- Prefer third-party service over building our own
- Louis mentioned Pomelli (Google AI Studios / Google Labs) as a known option
- Must be affordable enough to build into pricing
- Must integrate into the workflow easily (upload → enhance → catalog quality)
- Research needed: Pomelli, Photoroom, Remove.bg, Claid.ai, Picsart API, others
- Test with actual Bomb Party jewelry photos before committing
- Check if any service also does OCR on reveal box descriptions (two birds, one stone)

---

## 15. SEO/GEO Lifecycle — Decided

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
All SEO/GEO work done in bite-sized pieces. Individual tasks, not monolithic passes.

### Prompt Library
Tested, proven SEO/GEO prompts stored in the Sparkle Suite hub. Accessible by both Louis and agents.

### SEO/GEO for Sub-Sites — Open Question (Added Session #3)
How does SEO and GEO work for individual rep sites within a multi-tenant yoursparklesuite.com deployment? Do sub-sites/subpages of a single domain get their own SEO juice? This is a technical question that likely needs research.

---

## 16. Build Philosophy & Operational Principles — Decided

### Louis's Role in Builds
- **Design review** — Making sure design meets client expectations
- **QA / quality control** — Checking the website for issues
- **NOT:** Heavy building, fine-tuning, fixing. Maximum automation of build process.

### Bite-Size Everything
Standard workflow for ALL Sparkle Suite operations. One focused task at a time.

### Non-Technical User Design
Reps are NOT technical. Brittany's IT anxiety is the norm. Everything must be designed for people intimidated by technology. The chatbot-first interface is the solution.

### Prompt Library
Tested, proven prompts accessible by both humans and agents in the Sparkle Suite hub backend.

### Platform Rollout
Scaffolding → model sites → first 3-4 real builds (fine-tuning) → repeatable workflow by site 5+.

### Agent Planning
Last phase of planning series. Need full scope understanding before designing agent architecture.

### Sherman Tank Philosophy (Added Session #3)
Volume over customization. Every site is the same. More running Shermans is more money. Don't get distracted by custom work — that doesn't scale for a one-man + AI operation.

---

## 17. The Grand Vision — Everything Discussed

### Rep-Side Features
1. ✅ Branded website (exists on Readdy)
2. ✅ Show calendar (exists, being rebuilt as native)
3. ✅ Live Reveal Queue (exists, being rebuilt as Chrome extension)
4. ✅ Chatbot as primary portal interface (DECIDED — voice-enabled, core architecture)
5. 🔲 Rep trade board (detailed concept, needs technical spec)
6. ✅ Bomb Party jewelry database (concept decided, four use cases defined, builds via trade board usage)
7. 🔲 SMS show reminders (concept defined, needs provider research)
8. 🔲 Email show reminders (concept defined, needs provider research)
9. 🔲 News blast tool (via chatbot — rep sends broadcasts through conversational interface)
10. 🔲 Audience/contact management (view in portal, manage via chatbot)
11. 🔲 Rep portal with dashboard views (simplified — view layer + chatbot)
12. 🔲 FAQ / knowledge base (concept defined)
13. 🔲 Site analytics (concept defined)
14. 🔲 AI photo enhancement for trade board (third-party preferred, research needed)
15. 🔲 Prompt library (concept defined)
16. 🔲 Demo/showcase site for sales funnel

### Customer/Collector-Side Features (Shelved — Architect For Later)
17. 🔲 Master customer trade board
18. 🔲 Collection showcase
19. 🔲 Buy/sell/trade marketplace
20. 🔲 Reputation/rating system
21. 🔲 Community social feed

### Platform-Wide
22. 🔲 AI backbone (image enhancement, site updates, show assistance via chatbot)
23. 🔲 Neon Rabbit-native platform (move off Readdy)
24. 🔲 Stripe integration (automated billing)
25. 🔲 Newsletter

### Scale & Growth
26. 🔲 100+ clients target
27. 🔲 Niche replication (other direct-sales companies)
28. 🔲 Dedicated project lead hire
29. 🔲 Bomb Party API access
30. 🔲 Rep streaming support service (human-staffed)

---

## 18. What's Solid vs What's Grey

### SOLID — Proven, Working, or Decided
- Core value proposition validated — clients are paying
- Cookie-cutter model is the right approach — Option A only, no custom work
- Lease/ownership model locked
- SEO/GEO gold standard established
- Client roster is real with waitlist and referral pipeline
- Tech stack confirmed
- Platform architecture decided (unified yoursparklesuite.com, Option A only)
- Chatbot as primary portal interface (core architecture decision)
- Single-tier pricing model (payment frequency tiers, not feature tiers)
- Trade board concept defined (two types, priority on rep trade board)
- Trade board = listing and reservation system (not a transaction platform)
- Trade board enables 24/7 jewelry store business model evolution
- Bomb Party jewelry database as byproduct of trade board — four use cases defined
- Jewelry library = jewelry database (same thing, resolved)
- Three core automations defined (calendar, reveal queue, SMS/email)
- Native calendar replacing Google Calendar (decided)
- Build philosophy locked (Louis = design + QA, bite-size everything)
- Testing strategy decided (sandbox first)
- Data isolation strict (RLS enforced, reps see only their own data)
- Branding handled by NR (agent + human-in-the-loop)
- Voice interface for chatbot (decided, implementation research needed)
- SMS/email costs not absorbed by NR (built into pricing)
- AI photo enhancement: third-party preferred
- Business scope locked: two products only (Sparkle Suite + Rabbit Hole)
- Readdy stays at $20/mo for maintenance of existing sites
- Sherman tank philosophy: volume over customization

### GREY — Needs Research, Design, or Decisions
- Site hosting at scale (can Vercel handle 100+ custom domains?)
- Actual monthly/quarterly/annual pricing numbers
- Start fee amount
- Custom work pricing (for non-BP requests — outside SS scope)
- SMS/email provider selection
- TCPA/CAN-SPAM compliance requirements
- AI photo enhancement provider selection
- Chatbot technical implementation (which model, cost per query)
- Voice interface implementation (Web Speech API vs cloud)
- Chatbot personality/name
- Chatbot capability boundaries (autonomous vs escalate)
- Branding adjustment tooling design
- Go-to-market strategy
- Scaling plan (5 → 100 clients)
- Agent architecture
- Newsletter content/tooling
- Bomb Party intelligence system
- Niche replication viability
- Trade board value tier system
- Annual cancellation/refund policy
- Cookie cutter site template spec (what pages, sections, content on every rep site)
- SEO/GEO for sub-sites within multi-tenant deployment
- neonrabbit.net treatment (take down, minimal brand page, or redirect)

---

## 19. Known Problems & Pain Points

### Operational
1. Everything is manual — site builds, updates, billing, support
2. Readdy dependency — sites live on third-party infrastructure (staying for maintenance only)
3. Google Calendar dependency — being eliminated
4. No monitoring — no way to know if a site goes down or automation breaks
5. Support is ad hoc — no ticket system, no SLAs

### Product
6. Live Reveal Queue is broken — rebuild in progress
7. No trade board — most demanded feature
8. Sites are static brochure-ware with a calendar
9. Chrome extension doesn't work for phone-only reps

### Business
10. 5 clients, not 100 — path to scale is being planned
11. No marketing engine — word-of-mouth only
12. Bri owes launch fee — launched early, broke standard workflow

---

## 20. Competitive Landscape & Market Context

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
- 24/7 jewelry store model — trade board works while the rep sleeps
- Voice-enabled chatbot as personal AI assistant — unprecedented in this market
- Bomb Party jewelry database — unique data asset nobody else has, four use cases, network effect
- AI-enhanced photos — professional catalog quality from phone photos

### Bomb Party Product Context
- Standard jewelry: Nickel-free, brass, triple-plated
- New sterling collection: .925 sterling silver
- New gold vermeil: .925 sterling silver with 12K gold plating
- Unicorns: Rare/sought-after pieces (not diamonds)
- Diamonds: Actual diamond pieces — rarest reveal
- Replacement form at bombparty.com

---

## 21. Relationship to Other Neon Rabbit Projects

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

### neonrabbit.net
May be taken down or reduced to minimal brand page once yoursparklesuite.com is live. No services page, no contact form. Just links to the two products if kept. Treatment TBD. (Updated Session #3)

### mybostonpassportphotos.com (Desie/Roberts Photo Studio)
Family client, already built, maintenance item only. Not part of Sparkle Suite. Not a precedent for general web dev work.

### Shared Infrastructure
- Supabase: neon-rabbit-core (us-east-1, ref bqhzfkgkjyuhlsozpylf)
- HQ table: sparkle_clients (avoids open_brain collision)
- All projects share Vercel account, GitHub org, deployment pipeline

---

## 22. Parking Lot — Ideas to Revisit Later

Ideas that aren't scrapped but aren't ready to be built or promised. They need more information, more user feedback, or more research before they can be planned. They are NOT committed features — they're possibilities being tracked.

| Idea | Why It's Parked | Revisit When |
|------|----------------|-------------|
| AI Show Assistant (standalone) | Absorbed by chatbot concept — voice-enabled chatbot during shows IS the assistant. | Revisit if new pain points surface from active users that the chatbot can't address. |
| Multi-streaming support | Mentioned but never defined — what would this actually do? | When reps articulate specific multi-streaming pain points |
| Forever/Lifetime payment tier | Needs careful pricing to avoid cost exposure as third-party costs change over time | After all cost research is complete and monthly pricing is locked |
| Rep streaming support service (human-staffed) | Future add-on, requires hiring | When volume justifies dedicated staff |

**Removed from Parking Lot (Session #3):**
- ~~Jewelry library (as standalone feature)~~ — RESOLVED: jewelry library IS the trade board database, same data, four use cases defined. Not a separate feature.

---

## 23. Open Questions — The Research Agenda

### Covered in Q&A (Decisions Made — See Sections 7-16)
- ~~Platform URL structure~~ → Decided
- ~~Site architecture (A vs B)~~ → Option A ONLY, Option B eliminated (Session #3)
- ~~Trade board concept~~ → Two types defined, listing/reservation system
- ~~Trade board technical spec~~ → Flow defined, jewelry database concept added
- ~~Rep portal features~~ → Chatbot-first architecture decided
- ~~Calendar system~~ → Native Supabase, drop Google
- ~~SEO/GEO approach~~ → Three-phase lifecycle
- ~~Build philosophy~~ → Louis = design + QA only
- ~~Agent planning timing~~ → Last phase
- ~~Readdy future~~ → Phase out for new builds, keep $20/mo for maintenance
- ~~Pricing direction~~ → Single tier, payment frequency model
- ~~SMS/Email design~~ → Three message types, opt-in, compliance research needed
- ~~Site hosting approach~~ → Single deployment, custom domains, research scalability
- ~~Multi-tenant implementation~~ → RLS isolation, NR-handled branding, demo site
- ~~AI photo enhancement~~ → Third-party preferred, research options
- ~~AI show assistant~~ → Parked / absorbed by chatbot
- ~~Chat/Sales AI~~ → Evolved into chatbot-as-primary-interface decision
- ~~Tier feature reconciliation~~ → ELIMINATED (no tiers)
- ~~Jewelry library~~ → RESOLVED: same as trade board database, four use cases (Session #3)
- ~~Option B premium pricing~~ → ELIMINATED: Option B scrapped entirely (Session #3)

### NOT Yet Covered (Remaining Q&A Topics)

**Product Definition:**
- OQ-9: Newsletter — content strategy, cadence, tooling
- OQ-10: Bomb Party intelligence system — what to monitor, how, frequency

**Business & Growth:**
- OQ-11: Scaling plan — 5 to 100 clients (infrastructure, support, build process, revenue projections)
- OQ-12: Marketing & go-to-market strategy beyond Fizz City network
- OQ-13: Total addressable market — how many active BP reps exist?
- OQ-14: What do BP reps spend money on? Budget reality?
- OQ-15: What does BP's own rep support ecosystem look like?
- OQ-16: Timeline/trigger for hiring a dedicated project lead
- OQ-19: Niche replication — viable? What other companies?

**External:**
- OQ-20: Approaching BP for API access — proposal strategy, demonstrated value
- OQ-21: Existing trade board examples in the BP community — research needed

**Design:**
- OQ-24: Service agreement updates for new pricing model
- OQ-25: Demo/showcase site design for sales funnel
- OQ-26: Chatbot name/personality

**New from Session #3:**
- OQ-27: Cookie cutter site template spec — what pages exist, what's on each page, where automations surface, what's customizable vs locked, how navigation works, mobile layout (absorbs former OQ-22 + OQ-23)
- OQ-28: SEO/GEO for sub-sites within multi-tenant yoursparklesuite.com deployment — do sub-sites get their own SEO juice? How does GEO work? Likely needs research.

### Research Sprint Items (Need External Research, Not Just Q&A)
- SMS/email provider comparison (Twilio, Resend, alternatives)
- TCPA compliance requirements
- CAN-SPAM compliance requirements
- Vercel custom domain limits and pricing at scale
- AI photo enhancement service comparison (Pomelli, Photoroom, Claid.ai, etc.)
- Chatbot API cost modeling (Claude API Sonnet, per-query costs at scale)
- Voice interface options (Web Speech API vs cloud TTS/STT)
- Trade board value tiers in the Bomb Party community (rep Q&A needed — Lindsey review pending)
- SaaS cancellation/refund best practices and legal requirements
- Existing trade board examples in the BP community
- Total addressable market research (active BP rep count)
- BP rep spending habits and budget reality
- BP's own rep support ecosystem
- Niche replication research (other direct-sales companies)
- Infrastructure cost modeling for final pricing
- SEO/GEO implications of multi-tenant sub-site architecture

---

## 24. Q&A Session Tracker

| Topic | Status | Session |
|-------|--------|---------|
| Site architecture (hybrid A+B) | ✅ Decided → SUPERSEDED: Option A only | Session #1 → #3 |
| Testing strategy (sandbox first) | ✅ Decided | Session #1 |
| Trade board concept (two types) | ✅ Brain dump captured | Session #1 |
| Rep portal features (8 areas) | ✅ Brain dump captured | Session #1 |
| Rep portal automations (calendar, reveal, SMS) | ✅ Brain dump captured | Session #1 |
| Live Reveal Queue Chrome extension | ✅ Status captured, rebuild today | Session #1 |
| Native calendar (drop Google) | ✅ Decided | Session #1 |
| Landing page / URL structure | ✅ Decided | Session #1 |
| Readdy migration plan | ✅ Decided + clarified ($20/mo maintenance) | Session #1 → #3 |
| Pricing clarification | ✅ Decided → SUPERSEDED by single-tier | Session #1 → #2 |
| Agent planning approach | ✅ Decided (last phase) | Session #1 |
| SEO/GEO lifecycle | ✅ Decided (3-phase) | Session #1 |
| Prompt library concept | ✅ Decided | Session #1 |
| Build philosophy | ✅ Decided | Session #1 |
| Platform rollout strategy | ✅ Decided | Session #1 |
| SMS/Email technical design | ✅ Design decided, provider needs research | Session #2 |
| Site hosting solution | ✅ Unified architecture, scalability needs research | Session #2 |
| Multi-tenant implementation | ✅ RLS isolation, branding approach decided | Session #2 |
| Trade board technical spec | ✅ Flow defined, jewelry database concept added | Session #2 |
| AI photo enhancement | ✅ Third-party preferred, research needed | Session #2 |
| AI show assistant | ✅ Parked → absorbed by chatbot | Session #2 |
| Chat/Sales AI → Chatbot primary interface | ✅ MAJOR DECISION | Session #2 |
| Pricing model restructure | ✅ Single tier, payment frequency | Session #2 |
| Tier feature reconciliation | ✅ ELIMINATED (no tiers) | Session #2 |
| Jewelry library | ✅ RESOLVED: = trade board database, 4 use cases | Session #3 |
| Option B elimination | ✅ SCRAPPED: Option A only, Sherman tank philosophy | Session #3 |
| Business scope lock | ✅ Two products only: SS + Rabbit Hole | Session #3 |
| Newsletter | ❌ Not yet covered | — |
| Bomb Party intelligence | ❌ Not yet covered | — |
| Scaling plan (5→100) | ❌ Not yet covered | — |
| Marketing/go-to-market | ❌ Not yet covered | — |
| TAM / market size | ❌ Not yet covered | — |
| BP rep budget reality | ❌ Not yet covered | — |
| BP rep support ecosystem | ❌ Not yet covered | — |
| Hiring trigger | ❌ Not yet covered | — |
| Niche replication | ❌ Not yet covered | — |
| BP API approach strategy | ❌ Not yet covered | — |
| Existing trade board research | ❌ Not yet covered | — |
| Service agreement updates | ❌ Not yet covered | — |
| Demo/showcase site design | ❌ Not yet covered | — |
| Chatbot name/personality | ❌ Not yet covered | — |
| Cookie cutter site template spec | ❌ Not yet covered (NEW — absorbs OQ-22+23) | — |
| SEO/GEO for sub-sites | ❌ Not yet covered (NEW) | — |

---

## 25. Session Log

| Date | Session | Key Outcomes |
|------|---------|-------------|
| April 7, 2026 | Planning Session #1 | KB v1.0 created, Cross-Reference Analysis created, all 6 contradictions resolved, Q&A brain dump began (15 topics covered). Standing Rules v3.3 generated (Rule 13 added). Chrome extension rebuild flagged as active build task. |
| April 7, 2026 | Planning Session #2 | KB v1.2 generated. 7 more Q&A topics covered (22 total). TWO MAJOR DECISIONS: (1) Chatbot as primary portal interface — voice-enabled, absorbs AI show assistant concept. (2) Single-tier pricing — old Sparkle/Pro/Elite tiers scrapped, one product with payment frequency tiers. Also: Bomb Party jewelry database concept, trade board as listing/reservation system, unified hosting architecture (both A+B in same deployment), parking lot system created. |
| April 7, 2026 | Planning Session #3 | KB v1.3 generated. 1 Q&A topic covered (23 total). THREE EXECUTIVE DECISIONS: (1) Option B eliminated — all sites Option A only, Sherman tank philosophy. (2) Business scope locked — two products only (SS + Rabbit Hole), no outside web dev. (3) Readdy stays at $20/mo for existing site maintenance. OQ-8 (Jewelry Library) resolved — same as trade board database, four use cases defined. Trade board "24/7 jewelry store" business model insight captured. SS_TradeBoard_Benefits_Report_v1.0.docx generated for Lindsey review. 2 new Q&A topics added (cookie cutter template spec, SEO/GEO for sub-sites). OQ-17 eliminated. 16 topics remain. |

---

## Appendix A — Key Documents Reference

| Document | Location | Status |
|----------|----------|--------|
| SS_Knowledge_Base_v1.3.md (this file) | Google Drive /Neon Rabbit/ | Living reference ✅ |
| SS_Cross_Reference_Analysis.md | Google Drive /Neon Rabbit/ | Reference ✅ |
| SS_Master_System_Outline.md | Google Drive /Neon Rabbit/ | Legacy operational doc — still valid for pipeline reference |
| SS_TradeBoard_Benefits_Report_v1.0.docx | Google Drive /Neon Rabbit/ | For Lindsey review — CONFIDENTIAL |
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
