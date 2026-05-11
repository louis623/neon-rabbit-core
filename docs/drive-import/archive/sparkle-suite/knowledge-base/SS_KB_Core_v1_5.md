# Sparkle Suite — KB Module: Core Decisions & Architecture

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any decision that changes strategy, architecture, or scope

**Version:** 1.5 | **Derived from:** SS_KB_Core_v1.4 | **Last Updated:** April 9, 2026
**Status:** WORKING — updated with Session #15 decisions (Thumper agent architecture fully resolved, memory system decided as launch feature, personality locked as concise/warm/plain language)

**COMPANION MODULES:**
- SS_KB_SiteSpec_v1.0.md — Full site template spec (all 4 pages + design system)
- SS_KB_OpenItems_v1.5.md — Open questions, research sprint, gap analysis, parking lot
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

**Payment frequencies:** Monthly, Quarterly, Annual, (Forever — TBD, needs brainstorming session).

**Current grandfathered rates:** First 5 clients locked forever. Rates never raised, all upgrades included, will be charged for add-ons (business cards, extra changes).

**Cost pass-through:** SMS costs NOT absorbed by NR. Rep pays for all their own texts via wallet. Email IS included in platform subscription (absorbed by NR via Resend — negligible at scale). Pricing cannot be fully locked until platform subscription amount is decided.

**Start fee:** Exists (amount TBD — needs research). Required before build begins. Includes rep photography kit cost (see below).

**Launch fee:** Exists (amount TBD). Required before site goes live.

**Cancellation/refund:**
- Monthly: No refund. Service through end of billing cycle.
- Quarterly: No refund for current quarter. Service through end of quarter.
- Annual + Forever: Research sprint needed (L6) — not yet decided.
- Site goes offline at end of paid period. Rep's personal content exportable on request. NR-owned code/design/templates remain NR property.

---

## Three Payment/Agreement Gates — Decided

Three hard gates govern every new client. No exceptions. No manual overrides. All automated hooks.

- **Gate 1:** User agreement signed (SignWell) — required before any work starts
- **Gate 2:** Start work fee received (Stripe) — required before any work starts
- **Gate 3:** Launch fee received (Stripe) — required before site goes live

Gates 1 and 2 are parallel — both required before build trigger fires. Gate 3 holds deployment until launch fee clears. (Session #11)

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

**Personality:** Warm, friendly, BUT concise. No walls of text. No over-explaining. No tech jargon. Plain English, layman's terms. If further explanation is needed, keep it short and simple. Warm but efficient. (Session #15)

**Manages:** Calendar events, trade board listings, site update requests, audience messages, support tickets, site customization (banner, ticker, hero images, text, streaming buttons), team roster management, onboarding setup flow.

**Chatbot initial setup phase:** When site is first created, Thumper walks rep through onboarding setup flow — page by page, section by section. Zero learning curve.

**Capability boundaries:** Defined during Thumper build phase — cannot define before built. When request hits a guardrail or needs human judgment → auto-flags to Neon Rabbit.

**Custom request handling:** Thumper handles out-of-scope requests professionally and firmly. Redirects to available options (branding menu, business cards). Escalates to Louis if rep pushes back. Final answer is always no — Sherman tank philosophy.

---

## Thumper Agent Architecture — Decided (Session #15)

Six-component architecture designed and locked during dedicated Opus session.

**1. Brain (Understanding):** Claude API via Anthropic. System prompt is Thumper's "employee handbook" — identical for all reps. Rep-specific data (name, site URL, shows, listings) pulled from Supabase and attached alongside the system prompt each conversation. Haiku 4.5 default, Sonnet 4.6 for complex tasks.

**2. Hands (Actions):** A defined toolbox of 15–25 specific actions Thumper can take. Examples: add_calendar_event, create_trade_listing, update_banner_text, send_sms, get_my_shows. Claude picks the right tool based on what the rep asks, fills in the details, runs it. Thumper can ONLY use tools that have been defined — can't go rogue. Each tool is a small piece of code that talks to Supabase.

**3. Voice (Responding):** Claude takes tool results and responds in natural, concise, friendly language. No tech jargon. No walls of text. Warm but efficient.

**4. Memory (Rep Notes Table):** One Supabase table — timestamp, rep ID, short text note. Thumper writes a brief summary of anything worth remembering at the end of each conversation (preferences, personal context, recurring patterns, issues resolved). Next conversation, recent notes are pulled and included so Thumper "remembers" the rep over time. KISS approach: no embeddings, no vector search at launch. Just plain text notes in chronological order. Near-zero additional cost. **This is a LAUNCH FEATURE.**

**5. Security (Rep Isolation):** Supabase Row Level Security. Rep logs in, gets a secure token. Every Thumper request carries that token. Database only returns that rep's data. Admin role for Louis sees across all reps. No token = no access.

**6. Error Handling (Graceful Failure):** Three tiers:
- Temporary failures → "Try again in a sec." Auto-retry.
- Bad input from rep → Plain-language explanation of what to fix.
- Real system failures → Friendly message + auto-generated support ticket to Louis via NR HQ dashboard.
- Thumper never shows tech errors, never goes silent, never pretends something worked when it didn't.

**Orchestration:** Vercel AI SDK (streamText with tool-calling) running as a Next.js API route inside the yoursparklesuite.com deployment. No separate server. No Vapi. No custom framework. The SDK handles streaming, tool execution, and message management natively. Everything runs in the same place the website already lives.

**Conversation context:** Full conversation transcript sent to Claude with each message. Oldest messages dropped when transcript gets too long. System prompt and rep profile info never dropped. Between sessions = fresh conversation. Persistent memory handled by the rep notes table, not conversation history.

**Multi-step workflows:** Claude handles naturally via conversation. Example — trade listing submission: Thumper asks for photo, then MSRP, then trade preferences, one at a time. Nothing saved until all pieces collected. Rep can bail midway with no half-finished records. If rep provides everything at once, Thumper grabs it all in one shot. Photo QA pre-flight check runs inline during the conversation flow.

---

## Thumper Scope Lock — Decided (Session #13)

Thumper is locked to allowed domains only. Enforced via system prompt instruction. Claude enforces natively — no separate keyword filter layer needed. Off-topic requests receive a warm redirect.

**Allowed domains:**
1. Sparkle Suite — platform features, how-tos, rep dashboard, site management
2. Neon Rabbit — services, support, business cards, billing
3. Bomb Party — products, collections, show structure, comp plan basics, rep operations, jewelry terminology
4. Live streaming — show setup, reveal flow, Live Reveal Queue, scheduling
5. Jewelry direct sales — selling strategies, customer communication, pricing, inventory
6. Trade board — listings, reservations, inquiries, deduplication
7. SMS and email — composing, scheduling, compliance reminders, cap management
8. Calendar and show management
9. Customer opt-in and subscriber management
10. Basic BP rep business operations

**Redirect script (out-of-scope):** "That's outside what I'm built for — I'm your Sparkle Suite assistant. Is there something I can help you with for your shows or your site?"

**Monitoring:** Log all Thumper interactions from day one. Reassess 60–90 days post-launch. General assistant mode as a paid add-on is a parking lot item pending usage data.

**Open build item:** Full Thumper system prompt draft — dedicated design session with Claude before build spec written (~30–45 min).

---

## Thumper API Cost Model — Decided (Session #13)

**Confirmed pricing (April 2026):**
- Haiku 4.5: $1.00 input / $5.00 output per million tokens
- Sonnet 4.6: $3.00 input / $15.00 output per million tokens
- Prompt caching: ~80–90% savings on repeated system prompt input

**Monthly NR cost per rep (high-usage model):**

| Activity Level | Interactions/mo | NR Cost/mo |
|---|---|---|
| Moderate | ~800 | ~$1.80 |
| Heavy | ~2,000 | ~$4.50 |
| Power user | ~4,000 | ~$8.50 |
| Chatbot abuser | ~8,000+ | ~$18–25+ |

**At scale:**
- 100 reps (heavy avg): ~$450/mo
- 500 reps (heavy avg): ~$2,250/mo

Cost is manageable at all realistic scales. Scope lock and usage logging are the primary cost controls.

---

## AI Photo Enhancement — Decided (Session #14)

**Primary vendor: Photoroom API**
- Background removal, AI relighting, centering/padding in a single API call
- Sub-second latency — critical for mobile-first trade board submissions
- Jewelry-specific relighting mode addresses bad lighting from rep phone photos
- Pricing: ~$0.10/image (Plus plan, 1K/mo); ~$0.01/image (Partner Plan, volume)
- REST API + SDKs, low integration complexity
- KISS-compliant: one vendor, one integration

**Backup vendor: Claid.ai**
- Chained operations (BG removal + upscale + lighting in one call)
- Material-aware "Light AI" — preserves gold/platinum/diamond color accuracy
- Swap-in if Photoroom quality or pricing becomes a problem

**Two-layer photo QA system (decided in principle — details TBD at build):**
- Layer 1 — Thumper pre-flight: Evaluates submitted photo for minimum viability before sending to Photoroom. Kicks back with coaching if photo doesn't meet the bar. Goal: prevent garbage-in/garbage-out. Rep gets educated, not just rejected. Bar = "good enough for the AI to work with" — not perfect.
- Layer 2 — Backend QA inspector: Evaluates Photoroom output before it enters the database. Bad output gets flagged, not auto-approved. Details (confidence scoring, separate vision model, custom tool) require dedicated research/design session.
- QA is NOT on the rep. NR's job is to make their life easier.

**Rep Photography Kit (IN PROGRESS — Session #14):**
- DUCLUS 12"x12" lightbox ordered for testing — $29.99, CRI 95+, 120 LEDs, 8 backdrops
- Arriving Saturday April 12, 2026
- Louis tests with real BP jewelry before standardizing
- If quality passes: bake cost into start fee, determine fulfillment method (manual Amazon order per signup vs. automated trigger)
- Bulk pricing via Amazon Business or direct manufacturer to be evaluated as volume grows
- Goal: reduce pre-flight rejections by improving photo quality at the source

**Five open questions (resolve at pre-build vendor commitment):**
1. Hallmark preservation — do upscaling APIs preserve tiny hallmark text?
2. Video ingestion — BP reveals captured on video; frame extraction + enhancement may be needed
3. Data residency — do vendors use uploaded images to train their models? (NeuroViz confirmed no; Photoroom/Claid TBD)
4. SynthID/watermarking — Google Vertex AI embeds SynthID; implications for database copyright
5. Adobe Firefly rate limits — 4 RPM default may bottleneck high-volume bursts

---

## Rep Onboarding Workflow — Decided (Session #11)

Full agentic pipeline. Human touchpoints: intake meeting + QA check-ins only.

1. **Landing page intake** — Thumper (external, no login required) handles intake conversation. Collects: name, phone, email, show URLs, Linktree, current website, what they're looking for.
2. **Scheduling** — Thumper books Google Meet from Louis's live calendar availability. Louis gets notified.
3. **Pre-meeting intel** — Agent scrubs rep's social media, show URLs, public info. Compiles: branding signals, show flow, typical show days/hours. Output ready in NR HQ dashboard before meeting.
4. **Google Meet** — Louis presents product, pricing, branding menu. Rep picks fonts/colors/template options from menu. Gemini transcribes entire meeting.
5. **Post-meeting (if yes)** — Agent processes transcript → builds site plan with branding selections. Sends service agreement (SignWell) + start work fee link (Stripe).
6. **Gates fire** — Agreement signed + start fee received = build trigger. Launch fee received = go live trigger.
7. **Build phase** — Agentic build. Client check-ins + Louis QA check-ins throughout. Hero section: agent first, human loop fallback.

**Open build items within workflow:**
- Branding menu design (font/color/template options — what are the actual choices?)
- Pre-meeting intel agent scope definition
- Gemini transcript hook method (Drive vs email vs webhook — TBD)
- Service agreement template (L1 legal research sprint)
- Check-in cadence and format

---

## Waitlist — Decided (Session #11)

Thumper on the landing page collects prospective rep info before platform is ready. Automated email sequence keeps waitlist warm with progress updates as launch approaches. First come first served when platform goes live. Waitlist entries stored in Supabase.

---

## Launch Standard — Decided (Session #11)

All automations must be live before onboarding client #6. No partial launches. Ship complete or don't ship. Continuous improvement post-launch is expected and ongoing — but the baseline at launch must include every core feature.

---

## Trade Board — Decided

**Two types:** Rep trade board (priority) + future customer master trade board (after rep trade board is built).

**What it is:** Listing and reservation system only. NR never handles money or shipping. Reps/customers negotiate offline. NR stays completely out of transactions.

**Rep trade board flow:** Rep adds piece to trade board (photo, description, MSRP, trade preferences). Other reps/customers can browse and express interest (reserve). Rep decides whether to proceed. All transactions happen offline.

**Strategic asset:** Every piece flowing through any rep's trade board gets cataloged into the Bomb Party jewelry database. This dataset doesn't exist publicly anywhere.

**24/7 jewelry store model:** Trade board works while the rep sleeps. Dead show time becomes productive.

**Homepage placement:** Trade board lives on homepage near Live Queue (in-show experience section). Layout to be finalized in optimization pass.

**Trade board automation + AI:** Heavy research sprint needed before building. Scope: AI-assisted listing, photo enhancement integration, reservation flow automation, deduplication logic.

---

## Bomb Party Jewelry Database — Decided

Byproduct of the trade board — every listing feeds the catalog. Four use cases:
1. Rep upload shortcut — auto-populate from existing catalog entries
2. Browsable collection reference
3. Cross-rep trade facilitation
4. Future customer portal search

**Strategic value:** Compounds over time, network effect (every rep makes it more valuable), increasingly hard to replicate. NR becomes the go-to source for BP jewelry data.

**Technical:** Unique piece identification and deduplication needed — no BP SKU system exists. Research/design session item (Gap 16 — not yet done).

---

## Live Reveal Queue Co-Pilot — Decided

**Current state:** Chrome extension scrapes BP rep dashboard live order list. Currently broken for all except Mile High Fizz. Rebuild in progress.

**Rebuild plan:** Bulletproof Chrome extension, Chrome Web Store publication, easy on/off toggle, non-technical user design.

**Timing:** Parallel workstream during dashboard build phase. Not a launch blocker. (Session #11)

**Critical limitation:** Chrome extensions don't work on mobile/phone-only reps. Long-term solution = BP API access (server-side data pull). Blocked until demonstrated value position achieved.

---

## Native Calendar System — Decided

Google Calendar + Apps Script dropped completely. Native calendar lives entirely in Supabase. Managed through Thumper (primary) and viewable in portal calendar view.

How it works: Rep tells Thumper to add show → Thumper creates event with date, time, promo codes, collections, notes → website dynamically shows next 2-3 upcoming events from Supabase directly.

"Add to Calendar" export button: one-way push to rep's personal calendar (Google, Apple, etc.) — convenience only, not a dependency.

---

## SMS/Email Automation — Locked (Session #12, confirmed Session #13)

**⚠️ BILLING CORRECTION (Session #13):** A $0.020/msg entry was logged prematurely during Session #12 brainstorming. That entry is INVALID. The correct locked rate is $0.009/msg as shown below.

**Providers:**
- SMS: Telnyx ($0.007/msg all-in including carrier fees)
- Email: Resend (included in platform subscription, ~$20–90/mo flat for whole platform)

**SMS billing model:**
- NR pays Telnyx: $0.007/text
- Rep pays NR: $0.009/text ($0.007 cost + $0.002 NR margin)
- Rep pre-loads wallet via Stripe before any texts can be sent
- Every text auto-deducts $0.009 from wallet
- No wallet balance = no texts sent (hard stop)
- Wallet auto-recharges when balance hits low threshold (TBD during build)
- Email fully included in platform subscription — never charged to rep separately

**Rep dashboard — SMS billing tracker (build requirement):**
- Current wallet balance (always visible, prominent)
- Messages sent this month (running count)
- Total SMS spent this month (running dollar amount)
- Reference cost table (locked Session #13):

| Texts sent | Cost to rep |
|---|---|
| 25 texts | $0.23 |
| 50 texts | $0.45 |
| 100 texts | $0.90 |
| 200 texts | $1.80 |
| 500 texts | $4.50 |
| 1,000 texts | $9.00 |

- Wallet reload history
- All real-time, plain language — no "segments" or "credits" jargon

**Automated messages (show-triggered, no rep action required):**
- 1 SMS per scheduled show (pre-show reminder, timing TBD — 15 or 30 min out)
- 1 email per scheduled show (same trigger)
- Sent to all subscribers automatically from show calendar
- Pre-approved templates — bypass content screening

**Manual messages (rep-composed via Thumper):**
- 3 SMS per week maximum (rep's choice of use)
- 3 emails per week maximum (same)
- Thumper enforces cap — notifies rep when cap hit, holds until weekly reset
- All manual messages screened by AI agent before sending (TCPA/CAN-SPAM + FTC compliance check)
- Failed screening: Thumper notifies rep, explains issue, suggests fix — does not send

**Removed from MVP:** Diamond/unicorn reveal blast (eliminated for simplicity).

**Customer opt-in:** Simple form on rep's site. Fields: first name, last name, email (required), phone/SMS (optional). Customer chooses SMS, email, or both. Data → Supabase → rep's customer list.

**Compliance:** TCPA/CAN-SPAM research complete. NR carries legal liability for rep messages. Requirements documented in SS_KB_Legal module.

**Competitive position:** Shout and Project Broadcast charge $0.04–$0.05/msg. SS charges $0.009 — fraction of the competition.

---

## Hero Image Strategy — Decided (Session #13)

Curated stock photo memberships (Haute Stock, Styled Stock Society) do not fit the Bomb Party aesthetic — too high-end and serious. BP rep sites need bubbly, celebratory, glitter, jewelry reveal, girls-night energy.

**Direction:**
- Primary: AI-generated hero images (Midjourney, Adobe Firefly, or similar) — generated on demand to match rep branding and BP aesthetic
- Secondary: Canva Pro stock library — casual, fun, celebratory
- No dedicated stock photo membership subscription needed at launch

**Video hero sections:** On the radar. Autoplay, no-sound looping lifestyle video may outperform static images for BP energy. Evaluate during site template build phase.

**Known pain point:** Hero image sourcing is a manual time sink. Finding an image that fits the vibe AND renders well at the correct resolution is a consistent challenge. Agentic generation with human review loop is the likely build solution.

---

## Total Addressable Market — Validated (Session #13)

**Source:** Bomb Party Income Disclosure Statement (May 2024–June 2025)

**Key findings:**
- 39.9% of all reps earned any commission during the period; 60.1% earned nothing (dormant)
- Active threshold: $600 personal commissionable volume per rolling 6-month period
- Anyone meeting the active threshold is running real show operations = core SS target

**TAM estimate:**

| Segment | Est. Size | SS Relevance |
|---|---|---|
| Total enrolled reps | Unknown — est. 50K–150K+ | Low — mostly dormant |
| Active show-running reps (Topaz+) | Est. 20K–50K | High — core TAM |
| Serious reps (Tanzanite+, ~19% of paid) | Subset of above | Highest — ideal customer |

**Revenue model validation:**
- 5% penetration of 20K active reps at $29–$49/mo = $29K–$49K ARR
- 10% penetration = $58K–$98K ARR (income replacement territory)
- Business model validated for solo operator income goals.

---

## Business Card Pipeline — Decided (Session #11)

**Current state:** Louis designs manually in Canva. Sends proof sample. Rep approves → 1,000 cards ~$125 (NR cost ~$105).

**Vision:** Agent generates card design from rep's site branding (hero image front, branding + info + QR code + discount code line back). Third-party print vendor handles printing and shipping. NR never touches physical product.

**Reorder flow:** Rep confirms address + pays invoice → trigger fires → reprints and ships automatically.

**Research sprint:** Print vendor API options (MOO, Printful, Canva Print, Vistaprint) + AI card design tools. Goal: lower per-unit cost, faster turnaround, fully automated.

---

## ToS / Privacy Policy — Decided (Session #11)

Best-practices boilerplate generated at build time. Attorney review deferred to consolidated legal consult when revenue supports it. Must cover: data collection, Stripe payment processing, Supabase data storage, customer opt-in handling, trade board listing-only disclaimer, cancellation terms.

**All legal items = research sprints.** No legal language written without a Gemini research sprint first. See SS_KB_Legal module and SS_KB_OpenItems_v1.5 legal sprint queue.

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

**Build sequence:** Thumper + dashboard first. These are the platform's nervous system. Parallel tracks:
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
| April 9, 2026 | Gap Analysis #12 | B4 resolved (Readdy stay), Gap 19 deferred (pre-launch), Gap 1 resolved (Telnyx + Resend, SMS wallet model $0.009/msg, $0.002 NR margin), SMS automation model locked, PM dashboard decided |
| April 9, 2026 | Gap Analysis #13 | SMS billing correction ($0.009 confirmed, $0.020 entry invalidated), SMS cost reference chart added, Gap 5 resolved (Thumper API cost model — Haiku 4.5 default/Sonnet 4.6 escalation), Thumper scope lock decided (10 allowed domains), Gap 7 resolved (AI-gen + Canva Pro, no subscription), Gap 11 resolved (TAM 20K–50K active reps, business model validated), hero image strategy locked, video hero sections flagged |
| April 9, 2026 | Gap Analysis #14 | Gap 4 partially resolved (Photoroom primary, Claid backup, two-layer QA system in principle), rep photography kit ordered (DUCLUS, Saturday test), Gap 6 voice deferred (text-first, Wispr Flow recommendation), Gap 6 Thumper agent architecture flagged as open — dedicated Opus session needed |
| April 9, 2026 | Gap Analysis #15 | Gap 6 FULLY RESOLVED — Thumper agent architecture locked (6 components: brain, hands, voice, memory, security, error handling). Orchestration: Vercel AI SDK. Rep notes table decided as launch feature. Thumper personality locked (concise, warm, plain language). |
