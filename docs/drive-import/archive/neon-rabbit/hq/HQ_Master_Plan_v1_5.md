# Neon Rabbit HQ — Dashboard Master Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to chat when needed (Layer 2 reference)
📁 UPLOAD TO PROJECT: No — Layer 2 file. Upload to chat when actively working on dashboard.
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any change to dashboard vision, module specs, navigation model, agentic layer, or design decisions. Regenerate every session something changes.

**Version:** 1.5 | **Created:** April 6, 2026 | **Last Updated:** April 13, 2026 | **Status:** ALL SECTIONS COMPLETE — PHASE 2B FULLY DEPLOYED
**Supersedes:** HQ_Master_Plan_v1.4.md (retired), all prior versions

---

## Status Tracker

| Section | Status |
|---|---|
| 1 — Core Vision & Purpose | ✅ Complete |
| 2 — Daily Routine & Session Brief System | ✅ Complete |
| 3 — Modular Project Structure | ✅ Complete |
| 4 — Agentic Layer | ✅ Complete |
| 5 — Infrastructure & Modularity | ✅ Complete |
| Automation Architecture | ✅ Absorbed from Spec v2.0 |
| Database Schema | ✅ Absorbed from Spec v2.0 + Phase 2A actuals + Phase 2B design |
| Sparkle Suite Module Spec | ✅ Complete — expanded April 10, 2026 |
| Rabbit Hole Module Spec | ⏸ Placeholder — parked until SS is built and running |
| Phase 2B Architecture | ✅ Complete — Fully deployed April 13, 2026 |
| Master Plan — Open Decisions | 🔄 Ongoing |

---

## Product Vision

Neon Rabbit HQ is Louis's personal CEO command center. It is not a reporting tool, not a data entry interface, and not a tool for clients or contractors. It is the single place where the entire state of Neon Rabbit is visible, navigable, and actionable at any moment.

The dashboard is built for 2028–2030. Every architecture decision must hold up in an AI-accelerated world where the tool landscape, agent capabilities, and software interaction patterns look fundamentally different than today. It should feel like a tool from 2028 that happens to exist now.

The dashboard treats agents like employees, projects like living organisms, and the CEO's time like the scarcest resource in the operation. Everything is automatic. Nothing requires Louis to enter data.

The dashboard has three access layers — all accessing the same underlying data:
1. **Visual navigation** — browse, zoom, drill down through the UI
2. **Conversational query** — ask the built-in chatbot anything from anywhere
3. **Voice output** — listen to briefs and responses read aloud

---

## Core Design Principles

### 1. Zero Manual Data Entry
Louis never manually populates the dashboard. Every field, metric, and status comes from a source automatically — Stripe, Plaid, Supabase, agent outputs, automated checks, Open Brain. If an integration is not yet built, the field stays empty or shows a placeholder. Louis goes to the source directly until the integration exists. This rule has no exceptions.

### 2. Visual First
The dashboard communicates through visuals — workflow diagrams, system maps, dependency charts, status boards, progress flows. Text is supporting information, not the primary medium. If something can be shown as a map or a diagram, it is shown that way. Lists and tables are a last resort.

### 3. Google Maps Navigation Model
Every project and every section of the dashboard follows the same zoom model:
- **Zoom out** — see the whole project or the whole operation at 30,000 feet. Phase status, health indicators, key metrics. No detail.
- **Zoom in** — drill down to a specific phase, task, client, workflow step, or agent. Full detail on demand.
- **Query within** — search and filter inside any level to find specific things without navigating manually.

This model is consistent across all projects. Same structure, different data. Lego blocks of different sizes and colors, assembled the same way.

### 4. Drill-Down / Click to Expand
The surface of every view is an overview. Detail lives one click deeper. Nothing is buried, nothing is overwhelming. You see what you need to act; you click to understand.

### 5. Responsive-First, Desktop-Primary
The dashboard is designed for desktop browsers first — wide layouts, multi-column grids, expanded charts, side-by-side panels, full breathing room. On mobile, everything collapses cleanly — stacked cards, simplified nav, readable data. Both experiences are intentional and optimized. Neither is an afterthought.

**Note:** An earlier spec (v2.0, April 2) defined this as phone-first. That decision was superseded on April 6. Desktop-primary is the authoritative direction.

### 6. Built for 2028–2030
- Agentic layer is first-class, not an afterthought
- Modular by default — new modules addable without rebuilding the shell
- Research intelligence layer for each project — domain signals surfaced automatically
- Future staff mirror views — dashboard scales when the team grows
- Every feature reduces friction, never adds it

### 7. Modular Architecture
Every project is a module. Every agent is a panel. Every feature is a component that can be added, removed, or expanded without touching the rest of the dashboard. When Sparkle Suite gets a project lead, they get a scoped mirror view. When a new project starts, a new module slot opens. The shell never changes — what lives inside it grows.

### 8. Actionable at Every Level
Every view surfaces the next action. Every project card shows what happens next. Every agent panel shows what that agent is doing right now. The dashboard never leaves Louis asking "okay, so what do I do?"

### 9. Fully Extensible — Four Axes of Modularity
The dashboard is not closed-ended. It is extensible in four directions:
1. **New projects** — add a new project module with standard template scaffolding
2. **New subjects** — add entirely new top-level categories beyond the current set
3. **New data sources** — connect new information feeds to existing modules
4. **New fields** — add metrics, sections, or panels within any existing module

Extensions can be added via UI affordances (add buttons within sections) or via the built-in chatbot. The current layout is a starting point, not a final form.

### 10. Direct Links to Source (Added April 12, 2026)
Every card, panel, or data section that references an external source gets a clickable title or icon that opens the source directly. BlueVine card → BlueVine login. Stripe card → Stripe dashboard. Client card → their live site. Supabase data → Supabase dashboard. Domain/SSL items → the registrar. Vercel projects → Vercel dashboard. This applies dashboard-wide to all current and future modules. Eliminates bookmark hunting — if you can see the data, you can reach the source in one click.

---

## The Six Functions

The dashboard is six things in one unified interface:

| Function | What It Does |
|---|---|
| **Information Center** | Morning and evening briefs, project overviews, status at a glance, lessons learned |
| **Financial Center** | Balances, MRR, expenses, P&L, per-project financials, projections |
| **Operations Center** | Build pipeline, agent status, sprint tracking, platform health |
| **To-Do / Triage Center** | Queue tab, priority management, what needs to happen next |
| **Learning Center** | System workflow diagrams, process maps, visual guides to how things work |
| **Data Storage Center** | Documents, files, reference material (Supabase long-term replacement for Google Drive) |

---

## Automation Architecture

The dashboard's core innovation is that it stays current with near-zero manual effort. Six layers work together to keep data fresh automatically.

### Layer 1 — Open Brain as Data Bus
Open Brain is the central memory for all Claude sessions. A Supabase Edge Function monitors the Open Brain thoughts table via a Postgres trigger. When it detects a thought matching the pattern `STATUS UPDATE — [Project]: [details]`, it parses the project name, status, and next action, then writes to the dashboard's projects table.

**Implementation (Phase 2B):** Postgres trigger on INSERT to `open_brain` table → fires `open-brain-status-updater` Edge Function → pattern match → update `projects` table. Event-driven, near real-time. Not a scheduled scan.

**Result:** Any Claude session (Code, Co-work, Chat) that captures a status update to Open Brain automatically updates the dashboard. No extra step for Louis.

### Layer 2 — Claude Session Auto-Summaries
A standing instruction lives in `CLAUDE.md` in the repo and Co-work project settings:

> "At the end of every session, capture a status update to Open Brain: STATUS UPDATE — [Project]: [What was done]. Next action: [What's next]. Status: [on track / needs attention / blocked]."

**Result:** Every Claude Code build session and every Co-work research session automatically reports its results to the dashboard.

### Layer 3 — Supabase Real-Time Sync
The dashboard frontend uses Supabase real-time subscriptions. When the Edge Function writes an update to the projects table, the dashboard refreshes live — no manual reload needed.

**Result:** Louis opens the dashboard and it already shows the latest state. If a Claude session finishes while the dashboard is open, the update appears in real time.

### Layer 4 — Auto-Calculated Stats
- **Sparkle Suite MRR:** Calculated from active Stripe subscriptions via daily cron (Phase 2B). Normalized to monthly equivalent for quarterly/annual plans.
- **Rabbit Hole sprint progress:** Session summaries include which sprint phase was completed. Dashboard counts completed phases and shows visual progress.
- **Financial tracking:** Totals, trends, and projections auto-calculate from Stripe and Plaid feeds (Phase 2B).
- **Agent throughput:** Task completion rates and activity logs auto-calculated from agent output layer.

### Layer 5 — Daily Briefs (Auto-Generated — Phase 2B)
Two briefs generated daily — morning and evening — by the daily cron Edge Function.

**Morning brief (6 AM EST):** Generated as the final step of the daily financial sync cron. Assembles sections from freshly-written financial data + existing Supabase tables.

**Evening brief (9 PM EST):** Separate pg_cron trigger, same Edge Function in evening mode. Closing snapshot of the day.

**Phase 2B sections (4 at launch):**
1. **Financial Pulse** — BlueVine balance, Stripe balance, MRR, yesterday's revenue, failed payments
2. **Client Status** — per-client payment health, any past_due flags
3. **Maintenance Flags** — anything due or overdue from maintenance_items
4. **Queue** — top 3 priority items from queue_items

**Future sections (added as data sources come online):**
- Phase 2C → Correspondence (Gmail agent)
- Phase 3 → Agent Status, Intelligence Signals, Accomplishments, Objectives, New Client Tracking

The brief is modular — each section is an independent component that plugs in when its data source goes live. JSONB storage means no schema migration to add sections.

**Philosophy:** "Start how we want to finish." Both briefs run from day one even with minimal data. The structure and habits compound over time.

### Layer 6 — External API Feeds (Phase 2B — Architecture Locked)

#### Stripe Integration
**7 API calls per daily cron run:**
1. `GET /v1/balance` — Stripe account balance (available + pending)
2. `GET /v1/subscriptions?status=active` — all active subscriptions → MRR calculation
3. `GET /v1/subscriptions?status=past_due` — failed payment detection
4. `GET /v1/invoices` (yesterday's date range) — daily billing activity
5. `GET /v1/charges` (yesterday's date range) — one-time charges (wallet loads, fees)
6. `GET /v1/balance_transactions` (yesterday's date range) — Stripe fees itemized
7. `GET /v1/customers` — full customer list, maps to sparkle_clients

**No webhooks in Phase 2B.** Webhooks are SS Phase 0.4 (real-time subscription events for the SS platform). HQ dashboard is a daily financial snapshot, not real-time event processing.

**MRR calculation:** Sum active subscription amounts, normalize quarterly (÷3) and annual (÷12) to monthly equivalent. Current: $39 MRR (Brittany active). May 2026: $156 MRR (Kara, Bri, Heather activate). Lindsey = free (sister, no Stripe subscription).

**Writes to:** `financial_snapshots` (daily metrics row), `sparkle_clients` (payment status, plan, next charge date, LTV)

#### Plaid Integration
**BlueVine business checking only.** Personal banking removed from dashboard scope (April 12 decision).

**One-time setup:** Plaid Link UI in dashboard settings → Louis authenticates with BlueVine → permanent access_token stored as Edge Function secret.

**2 API calls per daily cron run:**
1. `GET /accounts/balance/get` — current + available balance
2. `GET /transactions/sync` — incremental transaction sync (cursor-based)

**Writes to:** `financial_snapshots` (balance fields), `bank_transactions` (90-day rolling history, auto-purge older)

**Dashboard UX:** BlueVine balance card with expandable chevron → scrollable list of last 25 transactions. Each row: date, merchant name, amount (green for deposits, red for debits). "BlueVine" title is a clickable link to BlueVine login.

#### Other External Feeds (Future)
- **Automated health checks:** Domain expiration, SSL status, Vercel uptime — Phase 3
- **Bomb Party intelligence:** Domain 5 agent for public web monitoring — Phase 3 (see NR_Intelligence_System_Plan_v1.0.md)

---

## Phase 2B — Cron Architecture (Locked April 12, 2026)

### Daily Financial Sync — Edge Function

**Where:** Supabase Edge Function (`daily-financial-sync`)
**Triggered by:** pg_cron
**Schedule:** 6:00 AM EST (11:00 UTC) for morning run, 9:00 PM EST (02:00 UTC) for evening run
**Runtime:** Deno (TypeScript)

**Execution flow (morning — 6 AM):**
```
STEP 1 — Stripe API calls (5 calls)
  → GET /v1/balance
  → GET /v1/subscriptions?status=active
  → GET /v1/subscriptions?status=past_due
  → GET /v1/invoices (yesterday)
  → GET /v1/balance_transactions (yesterday)

STEP 2 — Calculate Stripe metrics
  → MRR from active subscriptions (normalize quarterly/annual)
  → Daily revenue from invoices
  → Daily Stripe fees from balance_transactions
  → Failed payment count from past_due subscriptions

STEP 3 — Plaid API calls (2 calls)
  → GET /accounts/balance/get (BlueVine)
  → GET /transactions/sync (cursor-based incremental)

STEP 4 — Write to Supabase
  → INSERT one row into financial_snapshots
  → UPSERT new transactions into bank_transactions
  → UPDATE sparkle_clients with payment status from Stripe

STEP 5 — Generate morning brief
  → Query financial_snapshots (latest row)
  → Query sparkle_clients (payment status)
  → Query maintenance_items (due/overdue)
  → Query queue_items (top 3)
  → Assemble sections array
  → INSERT into briefs table (type: 'morning')

STEP 6 — Cleanup
  → DELETE from bank_transactions WHERE date < 90 days ago

STEP 7 — Done. Exit.
```

**Evening run (9 PM):** Same function, triggered with `type=evening` parameter. Queries current state of all tables, generates evening brief. Does NOT re-run Stripe/Plaid calls — uses existing daily data. Only writes to `briefs` table.

### Open Brain Status Updater — Edge Function

**Where:** Supabase Edge Function (`open-brain-status-updater`)
**Triggered by:** Postgres trigger on INSERT to `open_brain` table
**Purpose:** Detects `STATUS UPDATE — [Project]: [details]` pattern in new thoughts, parses project name/status/next action, updates `projects` table
**Execution:** Event-driven, near real-time. Not scheduled.

### Secrets Management

Four secrets stored via Supabase CLI (`supabase secrets set`):
- `STRIPE_SECRET_KEY` — Stripe API key
- `PLAID_CLIENT_ID` — Plaid client ID
- `PLAID_SECRET` — Plaid secret key
- `PLAID_ACCESS_TOKEN` — permanent token from Plaid Link setup

Never in code, never in env files, never in the repo.

### Error Handling

If any API call fails during the cron:
1. Log the error with which step failed
2. Continue with remaining steps (Plaid failure doesn't block Stripe data)
3. Write partial data to financial_snapshots with `sync_status` field: `complete`, `partial_stripe_fail`, `partial_plaid_fail`
4. Dashboard shows a small warning indicator if the latest snapshot is partial

---

## Daily Session Brief System

### Philosophy
The dashboard has a built-in morning brief (session open) and evening brief (session close) for every day. These are not working sessions — they are daily operational rhythm. Even on light days, the structure is there. Working sessions (planning, building, research) are separate and unlimited in number. Start how we want to finish — both briefs run from day one even with minimal data.

### Morning Brief — Session Open

**Phase 2B sections (4 at launch):**

| Section | Content | Source |
|---|---|---|
| Financial Pulse | BlueVine balance, Stripe balance, MRR, yesterday's revenue, failed payments | financial_snapshots (latest row) |
| Client Status | Per-client payment health, past_due flags | sparkle_clients |
| Maintenance Flags | Due or overdue items | maintenance_items |
| Queue | Top 3 priority items | queue_items |

**Future sections (added as data sources come online):**

| Section | Content | Source | Added In |
|---|---|---|---|
| Correspondence | Important emails flagged | Gmail agent | Phase 2C |
| Agent Status | What each agent is working on | Agent layer | Phase 3 |
| Intelligence Signals | Research findings above threshold | Intelligence system | Phase 3 |
| Accomplishments | What was done yesterday/this week | Agent logs / OB | Phase 3 |
| Objectives | What to accomplish today | Queue logic + OB | Phase 3 |
| Lessons Learned | New SOPs, standing rules, key decisions | Supabase / OB | Phase 3 |
| New Client Tracking | New clients tracked until onboarded | Supabase | Phase 3 |

### Evening Brief — Session Close

Same structure as morning brief with emphasis shifted:
- **Financial Pulse** = closing snapshot (same data, current values)
- **Client Status** = any changes during the day
- **Maintenance Flags** = closing check
- **Queue** = what's still pending
- All future sections (accomplishments, outlook) = closing state

### Voice Briefing
The built-in chatbot can read the morning and evening briefs aloud using text-to-speech. This allows Louis to consume the brief passively — listening while getting ready for the day rather than sitting down to read. Voice is an output feature (chatbot speaks), not necessarily requiring voice input (typing is fine).

### Design Note
The brief is upgradable. Sections will be added as the operation grows. Build it modular so sections can be added, reordered, or expanded without rebuilding the component. JSONB storage ensures no schema migration needed.

---

## Navigation Structure

### Hybrid Model — Top Nav + Left Sidebar

**Top navigation bar** — main category switcher. High-level subjects (Pulse, Financial, Operations, Projects, Agents, etc.). These are the "rooms" of the dashboard. Always visible, consistent across all views.

**Left sidebar / tree** — within each room, controls what's shown. Allows drill-down into sub-sections, switching between projects, filtering views. Gives depth without cluttering the top bar. Collapsible for full-width content when not needed.

**Chatbot** — persistent chat field in the top-right corner. Always accessible regardless of current view. Small context/response area that doesn't take over the screen. See Built-In Chatbot section for full spec.

### Mobile Adaptation
Top nav + sidebar must collapse cleanly on mobile. Likely patterns: bottom tab bar for main categories, hamburger or slide-out for sidebar tree, chatbot as floating button. Exact mobile pattern determined during build phase — the requirement is that it feels natural and intuitive on both form factors.

### Current Tabs (Phase 2A Baseline)

| Tab | Function |
|---|---|
| Pulse | Morning/evening brief, balance cards, project cards at a glance |
| Financial | MRR, expenses, net income, P&L chart, account balances |
| Operations | Build pipeline, agent monitoring, sprint status, platform health |
| Sales | Client funnel, pipeline, growth milestones |
| Maintenance | Domains, SSL, subscriptions, security checklist |
| PA | VA compensation, healthcare, personal obligations |
| Queue | Priority queue, copy-prompt buttons for Claude Code |
| Ideas | Backlog parking lot |
| Build Tracker | Phase progress, task checklists, test gate tracking (becomes Platform Health after SS launch) |

### Navigation at Scale
As projects grow and modules are added, the nav scales through the sidebar tree — the top bar stays lean with main categories while the sidebar handles project switching, sub-sections, and depth. The system supports:
- Top-level project switching (Sparkle Suite / Rabbit Hole / Neon Rabbit overall)
- Zoom in/out within a project
- Query/search across everything (chatbot or search bar)
- Agent panel access from anywhere
- Quick Stats persistent across all views

### Quick Stats Bar
Persistent across all views. Shows at a glance:
- Sparkle Suite: X clients · $X MRR · X pending
- Rabbit Hole: Current phase · build status
- Finances: Balances · MRR · net
- Agents: X active · X idle · X flagged

---

## Built-In Chatbot

### Purpose
A conversational assistant embedded in the dashboard that serves as an "expert on the company." Louis can ask it anything from anywhere in the dashboard — project status, financial data, agent activity, historical decisions, client information, or operational questions.

### Access Point
Persistent chat field in the top-right corner of the dashboard. Always visible, always accessible regardless of which view Louis is on. Includes a small context/response area that expands as needed without taking over the screen.

### Data Access
The chatbot has access to all company data:
- Open Brain (full semantic search across all captured decisions, ideas, session logs)
- GitHub Vault (structured specs, agent SOPs)
- Supabase (all dashboard tables — projects, clients, financials, agents, queue, ideas, maintenance)
- Any other connected data sources as they come online

### Voice Output
The chatbot can respond verbally using text-to-speech. It can read the morning and evening briefs aloud, answer questions by voice, and serve as a briefing companion. This turns the dashboard from a visual-only tool into a multimodal interface — visual for browsing, text for querying, voice for passive consumption.

### Technical Approach
Implementation prioritizes simplicity, ease of maintenance, and cost efficiency. Working direction: Claude API (Sonnet for queries) with relevant context injected from Supabase/Open Brain per query. Voice TTS via browser-native Web Speech API (free, simplest) or cloud TTS if higher quality is needed. Exact implementation determined during build phase.

### Design Principles
- Answers should be fast and contextual — the chatbot knows what view Louis is currently on
- Never requires Louis to leave his current view to get an answer
- History of recent queries visible in the chat panel
- Can trigger actions (future) — not just answer questions but execute commands

---

## Modular Project Architecture

### Structure
Every project lives in the dashboard as a self-contained module. The module follows the Google Maps zoom model — overview at the surface, full detail on drill-down. Consistent structure across all projects.

### Module Template (All Projects)

| Layer | What It Shows |
|---|---|
| Overview (zoomed out) | Phase/status, health indicator (green/yellow/red), key metrics, one-line summary |
| Active Phase (zoomed in) | Current tasks, blockers, in-progress items, agent assignments |
| Full Map (all phases) | Visual map of all phases/gates, completed vs in-progress vs upcoming |
| Financials | Revenue, expenses, P&L specific to this project |
| Intelligence Feed | Domain signals, industry changes, relevant external developments |
| Communications | Flagged emails, key decisions, important external signals |

### Status Indicators (All Modules)
- 🟢 **Green** — on track, nothing needs attention
- 🟡 **Yellow** — something needs attention, not urgent
- 🔴 **Red** — active issue, blocked, or urgent action required
- ⚫ **Gray** — not started or parked

### Pre-Revenue vs Live Projects
All projects use the same module template regardless of revenue status. A pre-revenue project still has financials (costs, burn rate, investment tracking). The difference is which data fields are populated, not how the module looks. When a project starts generating revenue, the revenue fields populate automatically — no visual or structural change required.

### Adding New Projects
New projects scaffold from the module template automatically. The standard layers (overview, financials, intelligence, communications, phase tracking) are created with empty/placeholder state. The dashboard is designed to grow — new projects, new subjects, new fields are all addable without rebuilding existing modules.

---

## Sparkle Suite Module Spec

The Sparkle Suite module is the most detailed module in the dashboard. It has seven components plus a future staff mirror view. The module mirrors the Sparkle Suite platform — it does NOT maintain its own definitions of pipelines or workflows. It reads from the same Supabase data that the SS platform uses and renders it visually for Louis.

**Authoritative source for all SS pipeline/workflow definitions:** SS_Master_Build_Plan_v1.1.md (or current version). The HQ dashboard is a mirror, not a source of truth.

### 1. Customer Board

Visual grid of client cards — not a table, not a list. Each card is a client. Color-coded health indicator (green/yellow/red) visible at a glance without clicking in.

**Per-client card surface (zoom out — no click needed):**
- Client name + site domain
- Health indicator (green/yellow/red)
- Subscription tier (monthly/quarterly/annual) + renewal date
- Current lifecycle stage (one-word: onboarding / active / at-risk / cancelling)
- Last activity timestamp (last site update, last Thumper interaction, last communication)

**Per-client detail view (click to expand):**
- Site health: uptime status, last deploy date, SSL expiry, domain expiry
- Automation health: Thumper status (responding? errors?), SMS/email pipeline status, calendar sync status
- Trade board status: active listings count, pending trade requests, last trade activity date
- SEO/GEO status: last audit date, indexing status (Google/Bing), schema validation pass/fail
- Branding status: business cards (ordered/not ordered), any pending graphic requests
- Billing: current plan, payment status (current/past due/failed), lifetime revenue from this client, next charge date
- Communications: last correspondence date, any open requests or tickets, flagged items
- Onboarding tracker (new clients only): checklist of onboarding steps with completion status — visible until client reaches "stable active" status, then collapses

**At-risk flag rule:** 60 days of no client activity within Sparkle Suite services triggers automated at-risk flag. System sends check-in email and/or text to the client. 30 days was considered too soon — reps go on vacation, get busy, or put things on pause.

**Current clients:** Kara (Sprinkled in Diamonds, $39/mo), Bri (Bri's Glowtique, $39/mo), Heather (The Bling Kitchen, $39/mo), Brittany (BrittwithBling, $39/mo — active now), Lindsey (Mile High Fizz — free, sister). Desie (Roberts Photo Studio) is a separate maintenance client outside Sparkle Suite scope.

**Data sources:** sparkle_clients table (Supabase — already exists), Stripe API (billing, payment status, LTV — Phase 2B), Thumper agent logs (automation health — when Thumper is live), automated health checks (SSL, domain, uptime — Phase 3), Open Brain (correspondence flags, requests — via Edge Function pipeline).

### 2. Lifecycle Workflow Map

Visual flow diagram mirroring the exact Sparkle Suite onboarding and client lifecycle pipeline from SS_Master_Build_Plan. The HQ dashboard does NOT maintain its own lifecycle definition — it reads the status from the SS Supabase client table and renders it visually.

**18-Stage Unified Lifecycle:**

Pre-Launch / Onboarding (Phase 8 of SS Build Plan):
1. `inquiry` — Rep finds yoursparklesuite.com, engages Thumper/intake form (no Cal.com — dropped April 7)
2. `pre_meeting_intel` — Scout agent researches rep's social/streaming presence, generates intel brief for Louis in NR HQ
3. `discovery_meeting` — Google Meet, Gemini transcription
4. `post_meeting_processing` — Scribe agent processes transcript, builds rep profile draft, populates branding preferences
5. `gate_1_agreement` — SignWell service agreement with clickwrap audit trail (IP, timestamp, document hash)
6. `gate_2_start_fee` — Stripe start work fee (earned upon payment, non-refundable)
7. `build_active` — Builder + Wordsmith agents assemble site from template, QR code auto-generated
8. `checkpoint_branding` — Louis reviews branding choices
9. `build_detail` — agents implement feedback
10. `checkpoint_detail` — Louis reviews details
11. `build_finalize` — SEO/GEO, final polish, agent self-QA
12. `checkpoint_prelaunch` — Louis final inspection
13. `gate_3_launch_fee` — Stripe launch fee clears
14. `launched` — site live, Thumper activated, credentials delivered, photography kit shipped

Post-Launch:
15. `active` — ongoing service, all automations running, trade board live
16. `at_risk` — 60-day inactivity trigger, automated check-in email/text outreach
17. `cancelling` — self-service cancel initiated, service through end of current month, pro-rata refund for unused time
18. `offboarded` — site offline, content exported if requested, record archived

**Dashboard rendering:** Visual pipeline flow diagram with each client positioned at their current stage. Most clients sit at stage 15 (active). Onboarding stages (1–14) are the funnel view. Post-launch stages (15–18) are the health view. Four named agents (Scout, Scribe, Builder, Wordsmith) visible at their respective pipeline stages. Three Stripe gates explicitly shown as payment checkpoints. Automations (binary operations) vs agents (variable output) clearly distinguished. Correspondence map touchpoints align to specific stages within the pipeline.

### 3. Onboarding Pipeline Funnel View

Dedicated view showing all prospects and new clients currently moving through stages 1–14 of the lifecycle. Separate from the Customer Board, which focuses on active clients at stage 15+.

**Purpose:** Sales/intake pipeline visibility. How many leads are in progress, where each one sits, what gates are pending, what's stuck. Critical once scaling to one new client per week.

**Display:**
- Visual funnel or pipeline showing stages 1–14 (inquiry through launched)
- Each prospect/new client positioned at their current stage
- Three Stripe gates (1, 2, 3) highlighted as payment checkpoints
- Agent status per prospect — which agent (Scout, Scribe, Builder, Wordsmith) is currently working on this client, or waiting
- Time-in-stage tracking — flag prospects sitting too long at any stage
- Pending actions — what needs to happen next for each prospect (Louis action vs. agent action vs. waiting on prospect)

**Data source:** SS Supabase client table (status field). Same data as Lifecycle Workflow Map but filtered to pre-launch stages only and rendered as a funnel view optimized for intake management.

### 4. Bomb Party Intelligence

Monitoring layer for Bomb Party platform changes. Two channels — one automated, one human.

**Automated (Domain 5 intelligence agent — see NR_Intelligence_System_Plan_v1.0.md):**
- Monitors BP public website, policy pages, announcements, newsletters, official social media
- Weekly scan (Monday morning delivery via intelligence brief)
- Diffs flagged with actionability tags (ACT NOW / WATCH / AWARENESS)
- Agent CANNOT monitor the BP rep dashboard — requires login credentials NR doesn't have and shouldn't use

**Human signal (no agent):**
- BP rep dashboard/data sheet changes detected by reps using the Chrome extension
- If the Live Queue extension breaks, reps report it through Thumper immediately
- Thumper auto-escalation (three-tier error handling) generates a support ticket to Louis via NR HQ
- The extension breaking IS the alert — no separate monitoring needed
- Lindsey is the primary canary (sister, daily user, prototype tester)
- Louis adds a weekly personal reminder to log in during one of Lindsey's shows and verify extension still works
- Future: if NR establishes a relationship with BP and gets API access, this could become automated. Until then, human intelligence factor.

**SS module display:**
- Surface view: last scan date, health indicator (green/yellow/red), count of active WATCH items
- Detail view: active items by actionability tag, each with what changed, when detected, primary source link, what it means for SS
- History of past findings from Open Brain (items Louis chose to KEEP)
- Extension breakage surfaces through Thumper escalation tickets visible in Customer Board automation health section — no separate BP dashboard monitor panel needed

### 5. Automation Health Monitoring

Platform-wide systems status board. Separate from per-client health in the Customer Board — this is the infrastructure view.

**Systems monitored:**
1. Thumper — responding? error rate? escalation ticket count? model costs (Haiku/Sonnet split)?
2. Stripe webhooks — subscription payments processing? failed charges? wallet recharges firing?
3. SMS pipeline (Telnyx) — messages sending? delivery rate? wallet balances across reps?
4. Email pipeline (Resend) — emails delivering? bounce rate?
5. Chrome extension (Live Queue) — human signal only, no automated monitoring. Rep-reported via Thumper escalation.
6. Photoroom API — processing photos? error rate? pre-flight rejection rate?
7. Agentic pipeline — Scout, Scribe, Builder, Wordsmith agents completing tasks or failing?
8. Site health per rep — uptime, SSL, domain expiry (also visible in Customer Board per-client detail)
9. SEO/GEO — indexing status, schema validation (also visible in Customer Board per-client detail)

**Display:** Status board with green/yellow/red per system at the surface level. Click any system for detail: error logs, last successful run, throughput metrics. Morning brief pulls from this panel: "All systems green" or "Thumper error rate elevated — 3 escalation tickets overnight."

**Relationship to Build Tracker tab:** During construction, NR HQ shows a Build Tracker tab (phase progress, task checklists, test gates). After SS launch, that tab evolves into Platform Health / Monitoring — this Automation Health panel graduating to its permanent home.

### 6. Project Financials

Internal P&L for Sparkle Suite. All auto-calculated from Stripe + Supabase. Zero manual entry.

**Revenue streams tracked:**
1. Monthly/quarterly/annual subscription fees (per rep, via Stripe)
2. Start work fees (one-time, per new rep, Gate 2)
3. Launch fees (one-time, per new rep, Gate 3)
4. SMS wallet recharges (ongoing, per rep, via Stripe)
5. Future: business card packages, branding add-ons (not yet built)

**Cost lines tracked:**
1. Thumper API costs (Claude Haiku/Sonnet — variable per rep usage)
2. Photoroom API costs (variable per photo processed)
3. Telnyx SMS costs ($0.009/msg — offset by wallet, but NR pays Telnyx)
4. Resend email costs (included in subscription tier)
5. Supabase infrastructure (fixed-ish, scales with usage)
6. Vercel hosting (fixed tier)
7. Stripe transaction fees (% of revenue)
8. Domain costs per rep (if NR covers custom domains)
9. Photography kit costs (baked into start fee if DUCLUS passes)

**Display:**
- MRR — calculated from active Stripe subscriptions, broken down by tier (monthly/quarterly/annual)
- Per-client revenue — LTV, current plan, payment status, wallet balance
- Churn — cancellation rate, at-risk count, trending direction
- Gross margin — revenue minus variable costs (API, SMS, photos). The unit economics health check.
- One-time revenue — start fees + launch fees collected this month/quarter
- Cost breakdown — per-system cost tracking (Thumper, Photoroom, Telnyx, Stripe fees)
- Projection — at current growth rate + churn rate, where's MRR in 30/60/90 days

**Data sources:** Stripe API (revenue, payments, subscriptions, wallet — Phase 2B), Supabase sparkle_clients table (client records, status), vendor billing APIs or manual seed until integrations exist (Anthropic usage, Photoroom, Telnyx).

### 7. Thumper CEO View

Aggregate intelligence panel for Louis to monitor Thumper's performance and spot rep pain points. NOT real-time surveillance of individual conversations — aggregate insights and patterns.

**Displays:**
- Most common questions reps ask Thumper (topic clustering)
- Topics Thumper escalates most frequently (signals for system prompt improvements)
- Content screening triggers — what prohibited phrases are being caught, how often, which reps
- Tool usage patterns — which Thumper tools are used most (trade board ops vs calendar vs SMS vs site customization)
- Error rate and escalation ticket trends over time
- Rep engagement patterns — who's using Thumper heavily, who's not using it at all (early at-risk signal)
- Model routing breakdown — Haiku vs Sonnet escalation frequency and cost

**Purpose:** Improve Thumper's system prompt over time, spot rep pain points before they become support issues, identify training gaps (if reps keep asking the same question, Thumper needs a better answer or the UX needs fixing), monitor API costs per rep.

**Not included:** Individual conversation transcripts. Louis doesn't read rep conversations unless investigating a specific escalation ticket. Patterns, not surveillance.

**Relationship to Automation Health:** Automation Health shows "is Thumper working?" (system status). Thumper CEO View shows "is Thumper working WELL?" (quality and effectiveness). Complementary panels, different questions.

**Data source:** Thumper conversation logs, tool execution logs, escalation tickets, rep notes table — all in Supabase. Aggregated and visualized in the SS module.

### 8. Staff Mirror View (Future)

When Sparkle Suite gets a dedicated project lead (3–6 month horizon), they receive a scoped dashboard view — same data, restricted to their section only. Built modularly so this is an add-on, not a rebuild. No design decisions needed at this time.

---

## Rabbit Hole Module Spec

**Status:** ⏸ Placeholder — Rabbit Hole remains parked in planning stages. Louis will continue using the beta version to generate ideas. Detailed scoping deferred until Sparkle Suite is built out and running smoothly. The Rabbit Hole could change widely between now and then with planning and research.

The following high-level structure from v1.2 is retained as a starting point for the future scoping session:

### Phase / Gate Tracker
Visual representation of build gates. Current status, what's in progress, what's blocked. Uses the gate model from the Rabbit Hole master plan (Gate 1 → Gate 2 → Gate 3). Click into any gate for full detail on tasks, decisions, and progress.

### To-Do and Issues
Task tracking, bugs, blockers. Visual — not a text list. Status-coded. Linked to active gate/phase.

### Workflow and Agent Maps
Visual maps showing how the system works and where agents operate within it. Updates as agents are built and deployed.

### Important Communications
Flagged research findings, key decisions, external signals relevant to the project. Pulled automatically where possible.

### Project Financials
Pre-revenue: infrastructure cost tracking, burn rate.
Post-launch: gate purchase revenue, user counts, conversion rates by gate, MRR equivalent.

### Research / Intelligence Layer
Stay-ahead-of-the-curve intelligence feed for the Rabbit Hole domain. Monitors: mobile app landscape, agent protocols, feed reader market, crypto payment landscape, app store policy changes. Signals surface through the briefing system (see NR_Intelligence_System_Plan_v1.0.md). Relevant findings are routed to morning/evening briefs based on urgency and category.

---

## Agentic Layer

### Philosophy
Agents are employees. The dashboard manages them the way a CEO manages staff — aware of what they're doing, able to check in, able to identify problems, able to reassign or retask. Not micromanaging. Just visibility.

### Three Agent Categories

The dashboard supports three distinct types of agents, each with appropriate UI treatment:

**1. Always-On / Scheduled Agents**
A small number of agents that run continuously or on timed intervals throughout the day. Examples: Gmail inbox monitoring, Bomb Party platform watching. These are the "on-shift staff" — always running, always reporting.
- UI shows: continuous status (active / idle / monitoring), last check-in time, current monitoring scope

**2. Event-Triggered Agents**
Agents activated by hooks, workflow handoffs, or incoming signals. A new business lead arrives via email → triggers the lead intake agent → triggers downstream agents for onboarding tasks. An agent completes its work and passes output to the next agent in the chain. These are workflow-driven — they activate when something enters their lane.
- UI shows: trigger source, chain position in workflow, upstream/downstream connections

**3. Dispatched / On-Demand Agents**
Agents that Louis or another agent triggers for specific backend or specialty tasks. Research sprints, report generation, one-off analysis. Called in when needed, stop when done.
- UI shows: who triggered them, assigned task, completion status, output/deliverable

The agent monitoring panel visually distinguishes between these three modes so Louis can tell at a glance what kind of agent he's looking at and why it's running (or not running).

### Agent Access Points — Two Entry Points

**1. Agent Table / Roster**
A dedicated table listing all agents. Click into any agent for full detail view. This is the "HR file" — manages agents as a roster.

**2. Workflow Map**
Agents are visible on workflow/process maps showing where they sit in a pipeline. Click into an agent on the map for the same detail view. This gives spatial context — see WHERE in the workflow an agent is operating, not just WHAT it's doing.

Both access points lead to the same agent detail view.

### Agent Detail View
Click into any agent (from table or map) to see:
- Current tasking
- Current status (active / idle / blocked / error)
- Job history — what it's done today, this week
- Analytics — performance metrics, task completion rate
- Workflow position — visual map with current position highlighted
- Error log if applicable
- **Action panel** — give updates, new taskings, additional context, or retask

### Agent Alerting — Multi-Channel
When an agent hits trouble or cannot complete a task, it throws a flag that surfaces in MULTIPLE channels simultaneously:
- **Dashboard visual flag** — immediately visible on agent panel and Quick Stats bar
- **Email notification** — sent to Louis's inbox
- **SMS notification** — for critical issues
- **Morning/evening brief inclusion** — always appears in the daily brief

Agent issues must be impossible to miss. The alerting system is aggressive by design — Louis would rather be over-notified than have a failed agent sit silently.

### Intelligence Pipeline
Research agents (per-project) monitor their domains continuously or on schedule. The full intelligence pipeline design is documented in NR_Intelligence_System_Plan_v1.0.md. Key points:
- Two intake channels: automated weekly domain scans (Channel 1) + Louis-curated daily intake via Rabbit Hole Light (Channel 2)
- Six intelligence domains monitored
- Three-tier source trust model (Tier 1: primary sources, Tier 2: trusted interpreters, Tier 3: general signal — Louis filters manually)
- Research depth: Level 2 (verify and contextualize). Louis does strategic interpretation.
- Output: actionability-tagged items (ACT NOW / WATCH / AWARENESS) in morning brief
- Faucet philosophy: wide open initially (calibration), tuned over time
- Storage: Open Brain is the long-term archive. intelligence_items table is for pipeline staging only.

**Note:** This intelligence pipeline is a WORKING DIRECTION documented in its own plan. The modular architecture supports changing the routing without a rebuild.

### Agents Planned (Not Yet Built)
| Agent | Role | Category |
|---|---|---|
| Gmail agent | Email processing, triage, flagging for Louis | Always-on |
| Sparkle Suite research agent | Bomb Party platform monitoring, industry signals (Domain 5) | Scheduled |
| Rabbit Hole research agent | Mobile app landscape, agent protocol, feed reader market signals | Scheduled |
| Lead intake agent | New business inquiry processing and routing | Event-triggered |
| Scout | Pre-meeting intel research for prospective SS reps | Event-triggered |
| Scribe | Post-meeting transcript processing, rep profile generation | Event-triggered |
| Builder | Agentic site assembly from template with self-QA | Event-triggered |
| Wordsmith | Creative copy generation (taglines, bios, FAQ answers) | Event-triggered |
| Flagged item research agent | Overnight research on items Louis flags in Rabbit Hole Light | Scheduled |
| Domain scan agents | Weekly intelligence scans across all six domains | Scheduled |
| Others | TBD as workflows are designed | TBD |

---

## Database Schema

### Live Tables (Phase 2A — neon-rabbit-core)

| Table | Key Fields | Notes |
|---|---|---|
| `projects` | id, name, tier, status, next_action, scope, tool, category, updated_at, history, clients, milestones | 8 rows seeded |
| `financial_snapshots` | date, mrr, expenses, balances, net | Daily append rows — time-series. **Expanded in Phase 2B** (see below) |
| `expenses` | id, name, amount, category, recurring | 8 rows seeded |
| `sparkle_clients` | id, name, domain, status, monthly_rate, launched_at, notes | 4 rows seeded. Named sparkle_clients (not clients) to avoid OB collision. **Payment fields added in Phase 2B** |
| `queue_items` | id, project_id, description, status, tool, prompt_text, created_at | 3 rows seeded |
| `ideas` | id, title, notes, created_at | 6 rows seeded |
| `maintenance_items` | id, type, name, status, due_date, notes | 11 rows seeded |
| `pa_items` | id, type, name, status, details, updated_at | 10 rows seeded |

### Phase 2B Schema Changes

**`financial_snapshots` — expanded schema:**

| Field | Type | Source |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `date` | date (unique) | Cron run date |
| `stripe_balance_available` | numeric | Stripe |
| `stripe_balance_pending` | numeric | Stripe |
| `mrr` | numeric | Calculated from active subs |
| `subscription_count` | integer | Stripe |
| `daily_revenue` | numeric | Stripe invoices |
| `daily_stripe_fees` | numeric | Stripe balance_transactions |
| `daily_one_time_revenue` | numeric | Stripe charges (non-subscription) |
| `failed_payments_count` | integer | Stripe past_due subs |
| `business_checking_balance` | numeric | Plaid (BlueVine) |
| `business_checking_available` | numeric | Plaid (BlueVine) |
| `sync_status` | text | `complete` / `partial_stripe_fail` / `partial_plaid_fail` |
| `created_at` | timestamptz | DB default |

**`sparkle_clients` — payment fields added:**

| New Field | Type | Source |
|---|---|---|
| `payment_status` | text | `current` / `past_due` / `failed` / `free` |
| `stripe_customer_id` | text | Stripe customer ID |
| `current_plan` | text | Subscription interval |
| `next_charge_date` | date | Stripe |
| `lifetime_revenue` | numeric | Calculated from Stripe |

**New table: `bank_transactions`**

| Field | Type | Source |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `plaid_transaction_id` | text (unique) | Plaid |
| `date` | date | Plaid |
| `name` | text | Plaid (merchant name) |
| `amount` | numeric | Plaid |
| `category` | text[] | Plaid auto-categorization |
| `pending` | boolean | Plaid |
| `created_at` | timestamptz | DB default |

Retention: 90 days, auto-purged by daily cron. RLS: single-user lockdown.

**New table: `briefs`**

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `date` | date | One brief per type per day |
| `type` | text | `morning` or `evening` |
| `sections` | jsonb | Array of section objects |
| `generated_at` | timestamptz | When Edge Function produced it |
| `created_at` | timestamptz | DB default |

Unique constraint on (date, type). JSONB sections for modularity.

### Tables to Add (Phase 2C/3)

| Table | Purpose | Phase |
|---|---|---|
| `agent_sessions` | Agent activity tracking | 2C/3 |
| `agent_tasks` | Per-task log for each agent | 2C/3 |
| `chatbot_history` | Chatbot query/response log | 3 |
| `documents` | Data Storage Center (text content, Markdown) | 3 |
| `intelligence_items` | Intelligence pipeline staging (not long-term retention — Open Brain is the archive) | 3 |

### Infrastructure Notes
- Supabase project: `neon-rabbit-core`, us-east-1, ref `bqhzfkgkjyuhlsozpylf`
- Session pooler: `aws-1-us-east-1.pooler.supabase.com:5432`
- RLS enabled on all tables — single-user lockdown (louis@neonrabbit.net)
- pgvector enabled — available for future semantic search features
- Do NOT touch `open_brain` or embedding infrastructure tables

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Charts | Recharts |
| Database | Supabase (neon-rabbit-core) |
| Auth | Supabase Auth — email/password, louis@neonrabbit.net |
| Hosting | Vercel Hobby tier |
| Repo | louis623/neon-rabbit-hq (private, master branch) |
| Local path | C:\Users\louis\neon-rabbit-hq |
| Live URL | neon-rabbit-hq.vercel.app |
| Fonts | DM Sans (body), DM Mono (numbers), Instrument Serif (display) |
| Real-time | Supabase real-time subscriptions |
| Edge Functions | Supabase Edge Functions (Deno) |
| Cron | pg_cron (Supabase) — 6 AM EST + 9 PM EST daily |
| Chatbot LLM | Claude API (Sonnet — cost-efficient for queries) |
| Voice TTS | Browser Web Speech API (free) or cloud TTS (if quality upgrade needed) |

---

## Build Sequence

### Completed
- **Phase 1** ✅ — Static scaffold, 8 tabs, hardcoded data, deployed
- **Phase 2A** ✅ — 8 Supabase tables, Auth, RLS, dashboard reading from Supabase, CODEBASE_SNAPSHOT updated
- **Phase 2B** ✅ — Stripe + Plaid APIs, daily cron, auto-populated financials, morning/evening briefs, Open Brain → projects pipeline. Architecture locked April 12, code built April 12 (17 files, 1194 insertions, zero TS errors), infrastructure wiring completed April 13 (9 steps, zero failures). First morning sync fires 6 AM ET April 14. Plaid credentials are placeholders until BlueVine Plaid Link setup.

### Phase 2B — Details (Deployed April 13, 2026)

**Scope:** Stripe + Plaid APIs, daily cron, auto-populated financials, morning/evening briefs, Open Brain → projects pipeline

**Edge Functions (2):**
1. `daily-financial-sync` — pg_cron at 6 AM EST (morning) and 9 PM EST (evening). Stripe calls → Plaid calls → write financial_snapshots → write bank_transactions → update sparkle_clients → generate brief → cleanup.
2. `open-brain-status-updater` — Postgres trigger on open_brain INSERT. Pattern match STATUS UPDATE → update projects table. Event-driven.

**New tables (2):** bank_transactions, briefs
**Modified tables (2):** financial_snapshots (expanded), sparkle_clients (payment fields)
**Secrets (4):** STRIPE_SECRET_KEY, PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ACCESS_TOKEN
**Dashboard UI:** Expandable BlueVine transaction list, morning/evening brief on Pulse tab, direct-link-to-source on all cards
**Plaid Link:** Setup UI in dashboard settings for one-time BlueVine connection

**Infrastructure (Deployed April 13, 2026):**
- Extensions enabled: pg_cron, pg_net, pgsodium
- Migration applied: 4 new tables, 12 new columns
- Vault secrets: sync_secret + 3 Plaid placeholders
- Edge Function secrets: STRIPE_SECRET_KEY, PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ACCESS_TOKEN, OWNER_UUID
- Edge Functions: daily-financial-sync and open-brain-status-updater both ACTIVE v1
- Cron jobs: 6 AM ET morning sync, 9 PM ET evening brief (America/New_York timezone)
- OB trigger: namespaced trigger on open_brain INSERT with WHEN clause + EXCEPTION block
- Vercel env vars: 4 vars set in prod + dev
- CODEBASE_SNAPSHOT: commit b24eb7a pushed to master

### Upcoming

| Phase | Scope | Prerequisite |
|---|---|---|
| **2C** | Gmail agent, agent architecture | Dedicated agent architecture session (standing rule) |
| **3** | Customer Board, Lifecycle Workflow Map, Onboarding Funnel, Automation Health, Thumper CEO View, BP Intelligence, Project Financials, Agent Monitoring Panel, Research Intelligence Layer, Data Storage Center, Built-In Chatbot, Voice Briefing, Build Tracker tab | All sections complete ✅ |

### Sessions Required Before Phase 3 Build
1. ✅ Complete Sections 4 and 5 of planning Q&A → generate HQ_Master_Plan_v1.2
2. ✅ Sparkle Suite scoping session → generate HQ_Master_Plan_v1.3
3. ⏸ Rabbit Hole dashboard scoping session — DEFERRED until SS is built and running
4. ✅ Phase 2B architecture session (Opus) → HQ_Master_Plan_v1.4
5. ✅ Claude Code — Phase 2B build + infrastructure wiring → HQ_Master_Plan_v1.5

---

## Open Decisions

| # | Decision Needed | Blocked By | Resolves When |
|---|---|---|---|
| OD-1 | ~~Agent task model~~ | ~~Section 4 Q&A~~ | ✅ Resolved — three categories (always-on, event-triggered, dispatched) |
| OD-2 | ~~Research layer format~~ | ~~Section 4 Q&A~~ | ✅ Resolved — NR_Intelligence_System_Plan_v1.0.md documents full design |
| OD-3 | ~~Agent query interface~~ | ~~Section 4 Q&A~~ | ✅ Resolved — agent table + workflow map, both lead to detail view |
| OD-4 | ~~Top-level navigation~~ | ~~Section 5 Q&A~~ | ✅ Resolved — hybrid (top nav for categories + left sidebar for depth) |
| OD-5 | ~~Pre-revenue vs live project treatment~~ | ~~Section 5 Q&A~~ | ✅ Resolved — same template, different data populated |
| OD-6 | ~~Bomb Party intelligence approach~~ | ~~Sparkle Suite scoping session~~ | ✅ Resolved — automated Domain 5 agent for public web + human signal for dashboard/extension (April 10) |
| OD-7 | Data Storage Center architecture — Supabase documents table + Storage buckets | Dedicated planning session | Phase 3 |
| OD-8 | Morning brief objectives section — agent-populated or Louis-set | Phase 2C/3 planning | TBD |
| OD-9 | Staff mirror view — technical approach for scoped access | Future planning session | When team grows |
| OD-10 | ~~Open Brain → dashboard Edge Function — build in Phase 2B or 2C?~~ | ~~Phase 2B architecture session~~ | ✅ Resolved — build in Phase 2B. Postgres trigger on open_brain INSERT → Edge Function → pattern match → update projects table (April 12) |
| OD-11 | Chatbot implementation detail — exact API integration pattern, context injection strategy | Phase 3 planning | TBD |
| OD-12 | Voice TTS quality level — browser-native Web Speech API vs cloud TTS service | Phase 3 build/testing | TBD |
| OD-13 | Agent alerting SMS provider — Twilio, SNS, or other | Phase 2C planning | TBD |
| OD-14 | ~~Intelligence significance threshold~~ | ~~Dedicated brainstorm session~~ | ✅ Resolved — faucet philosophy: no threshold in Phase 1, tuning in Phase 2 (NR_Intelligence_System_Plan_v1.0.md) |

---

## Research Gaps

| # | Gap | Action |
|---|---|---|
| RG-1 | Best-in-class CEO dashboard patterns for solo operators | Optional Gemini research |
| RG-2 | Modular dashboard architecture patterns | Optional Gemini research |
| RG-3 | ~~Bomb Party platform monitoring — signals, scraping approach~~ | ✅ Resolved — automated for public web, human signal for dashboard (April 10) |
| RG-4 | ~~Intelligence pipeline full design~~ | ✅ Resolved — NR_Intelligence_System_Plan_v1.0.md |
| RG-5 | Chatbot context injection — optimal strategy for injecting relevant Supabase/OB data per query | Phase 3 technical spike |

---

## Key Decisions Log

| Date | Decision |
|---|---|
| Apr 2 | Phase 1 scaffold complete and deployed |
| Apr 2 | Stack locked: Next.js 14, Tailwind v4, TypeScript, Recharts, Supabase |
| Apr 2 | 8 tabs: Pulse, Financial, Operations, Sales, Maintenance, PA, Queue, Ideas |
| Apr 2 | Automation architecture: 6-layer OB → Edge Function → Supabase pipeline |
| Apr 4 | Phase 2A complete — 8 Supabase tables, Auth, RLS |
| Apr 4 | Financial snapshots = daily append rows (time-series) |
| Apr 4 | Phase 2B deferred until Opus architecture session |
| Apr 4 | Gmail agent deferred to Phase 2C with dedicated planning session |
| Apr 6 | Responsive-first, desktop-primary (supersedes phone-first from Apr 2) |
| Apr 6 | Zero manual data entry — hard rule, no exceptions (supersedes tap-to-edit from Apr 2) |
| Apr 6 | Dashboard is personal only — no external-facing layer |
| Apr 6 | Six functions: Information, Financial, Operations, To-Do, Learning, Data Storage |
| Apr 6 | Visual-first design philosophy |
| Apr 6 | Google Maps navigation model locked |
| Apr 6 | Consistent module structure across all projects |
| Apr 6 | Agent monitoring = treat agents as employees |
| Apr 6 | Built for 2028–2030 — agentic layer is first-class from day one |
| Apr 6 | HQ_Unified_Dashboard_Spec_v2.0 retired — absorbed into this document |
| Apr 6 | HQ Master Plan regenerated every session something changes |
| Apr 6 | Three agent categories: always-on/scheduled, event-triggered, dispatched on-demand |
| Apr 6 | Intelligence signals surface through briefing system |
| Apr 6 | Agent query via two access points: agent table/roster + workflow map → same detail view |
| Apr 6 | Agent alerting is multi-channel: dashboard flag + email + SMS + brief inclusion |
| Apr 6 | Navigation: hybrid — top nav for main categories + left sidebar for depth/drill-down |
| Apr 6 | Pre-revenue and live projects use identical module template |
| Apr 6 | Dashboard fully extensible in four directions: projects, subjects, data sources, fields |
| Apr 6 | Built-in chatbot — persistent top-right, full company data access, voice TTS output |
| Apr 6 | Voice briefing — chatbot reads morning/evening briefs aloud |
| Apr 8 | Intelligence System Plan v1.0 created — six domains, three-tier source model, dual-channel intake, faucet philosophy |
| Apr 9 | Construction dashboard → NR HQ Build Tracker tab (not separate app) |
| Apr 10 | Sparkle Suite module fully scoped — 7 components + staff mirror view (future) |
| Apr 10 | Customer Board: visual grid, per-client detail drill-down, 60-day at-risk rule |
| Apr 10 | Lifecycle Workflow Map: 18-stage pipeline mirroring SS_Master_Build_Plan exactly |
| Apr 10 | Onboarding Pipeline Funnel View: stages 1–14 filtered for intake management |
| Apr 10 | BP Intelligence: automated Domain 5 agent for public web + human signal for dashboard/extension |
| Apr 10 | Automation Health: platform-wide systems status board (9 systems monitored) |
| Apr 10 | Project Financials: full P&L with 5 revenue streams, 9 cost lines, MRR/churn/margin/projection |
| Apr 10 | Thumper CEO View: aggregate insights on usage patterns, escalation trends, content screening |
| Apr 10 | Rabbit Hole module scoping DEFERRED — placeholder until SS is built and running |
| Apr 10 | OD-6 resolved, OD-14 resolved, RG-3 resolved, RG-4 resolved |
| Apr 12 | Phase 2B Opus architecture session complete — all decisions locked |
| Apr 12 | Stripe integration: 7 daily API calls, no webhooks, daily snapshot model |
| Apr 12 | Personal banking REMOVED — BlueVine business checking only via Plaid |
| Apr 12 | Plaid: balances + transactions, 90-day retention, expandable card UX |
| Apr 12 | Cron: Supabase Edge Function + pg_cron (not Vercel cron) |
| Apr 12 | Briefs: morning (6 AM) + evening (9 PM), both from day one, 4 sections at launch |
| Apr 12 | OD-10 resolved: Open Brain → dashboard Edge Function built in Phase 2B |
| Apr 12 | Standing principle: direct links to source on every dashboard card |
| Apr 12 | Standing philosophy: "Start how we want to finish" |
| Apr 12 | Client rates confirmed: all four paying reps at $39/mo, Lindsey free |
| Apr 13 | Phase 2B code build complete — 17 files, 1194 insertions, zero TS errors |
| Apr 13 | Phase 2B infrastructure wiring complete — 9 steps, zero failures |
| Apr 13 | Phase 2B FULLY DEPLOYED — first morning sync fires 6 AM ET April 14 |
| Apr 13 | Standing Rules v3.7 — Claude Code prompt format rule replaces ultraplan blocker |

---

*This master plan is the single source of truth for the Neon Rabbit HQ Dashboard. All previous specs are retired. Update and regenerate every session something changes. Never let it fall behind reality.*
