# Neon Rabbit HQ — Dashboard Master Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to chat when needed (Layer 2 reference)
📁 UPLOAD TO PROJECT: No — Layer 2 file. Upload to chat when actively working on dashboard.
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any change to dashboard vision, module specs, navigation model, agentic layer, or design decisions. Regenerate every session something changes.

**Version:** 1.1 | **Created:** April 6, 2026 | **Status:** IN PROGRESS — Sections 4 and 5 pending
**Supersedes:** HQ_Unified_Dashboard_Spec_v2.0.md (April 2, 2026) — retired, absorbed into this document

---

## Status Tracker

| Section | Status |
|---|---|
| 1 — Core Vision & Purpose | ✅ Complete |
| 2 — Daily Routine & Session Brief System | ✅ Complete |
| 3 — Modular Project Structure | ✅ Complete |
| 4 — Agentic Layer | ⏳ Pending — next session |
| 5 — Infrastructure & Modularity | ⏳ Pending — next session |
| Automation Architecture | ✅ Absorbed from Spec v2.0 |
| Database Schema | ✅ Absorbed from Spec v2.0 + Phase 2A actuals |
| Master Plan — Open Decisions | 🔄 Ongoing |

---

## Product Vision

Neon Rabbit HQ is Louis's personal CEO command center. It is not a reporting tool, not a data entry interface, and not a tool for clients or contractors. It is the single place where the entire state of Neon Rabbit is visible, navigable, and actionable at any moment.

The dashboard is built for 2028–2030. Every architecture decision must hold up in an AI-accelerated world where the tool landscape, agent capabilities, and software interaction patterns look fundamentally different than today. It should feel like a tool from 2028 that happens to exist now.

The dashboard treats agents like employees, projects like living organisms, and the CEO's time like the scarcest resource in the operation. Everything is automatic. Nothing requires Louis to enter data.

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
Open Brain is the central memory for all Claude sessions. A Supabase Edge Function monitors the Open Brain thoughts table. When it detects a thought matching the pattern `STATUS UPDATE — [Project]: [details]`, it parses the project name, status, and next action, then writes to the dashboard's projects table.

**Result:** Any Claude session (Code, Co-work, Chat) that captures a status update to Open Brain automatically updates the dashboard. No extra step for Louis.

### Layer 2 — Claude Session Auto-Summaries
A standing instruction lives in `CLAUDE.md` in the repo and Co-work project settings:

> "At the end of every session, capture a status update to Open Brain: STATUS UPDATE — [Project]: [What was done]. Next action: [What's next]. Status: [on track / needs attention / blocked]."

**Result:** Every Claude Code build session and every Co-work research session automatically reports its results to the dashboard.

### Layer 3 — Supabase Real-Time Sync
The dashboard frontend uses Supabase real-time subscriptions. When the Edge Function writes an update to the projects table, the dashboard refreshes live — no manual reload needed.

**Result:** Louis opens the dashboard and it already shows the latest state. If a Claude session finishes while the dashboard is open, the update appears in real time.

### Layer 4 — Auto-Calculated Stats
- **Sparkle Suite MRR:** Calculated from client records in Supabase (count × monthly rate). Louis adds a client once at signup; math stays current forever.
- **Rabbit Hole sprint progress:** Session summaries include which sprint phase was completed. Dashboard counts completed phases and shows visual progress.
- **Financial tracking:** Totals, trends, and projections auto-calculate from Stripe and Plaid feeds (Phase 2B).
- **Agent throughput:** Task completion rates and activity logs auto-calculated from agent output layer.

### Layer 5 — Daily Brief (Auto-Generated)
When Louis opens the dashboard in the morning, the morning brief populates automatically:
- **Yesterday's Activity:** Auto-generated from the previous day's Open Brain captures.
- **Today's Objectives:** Highest-priority queue items, pulled from task queue logic.
- **Alerts:** Blocked projects, projects with no activity in 7+ days, approaching deadlines, maintenance flags.
- **Agent Overnight Summary:** What agents completed while Louis was offline.

**How it works:** A Supabase Edge Function runs on a schedule (6AM EST daily). It queries Open Brain for yesterday's status updates, queries the task queue, checks for stale projects, checks agent logs, and compiles the brief. Stored in a `briefs` table and displayed as the morning brief panel.

### Layer 6 — External API Feeds (Phase 2B)
- **Stripe:** Live MRR, revenue, new customers, churn
- **Plaid:** Personal checking, business checking balances
- **Automated health checks:** Domain expiration, SSL status, Vercel uptime
- **Bomb Party intelligence:** Platform change monitoring (approach TBD)

**Note:** Phase 2B requires a dedicated Opus architecture session before any Claude Code work begins.

---

## Daily Session Brief System

### Philosophy
The dashboard has a built-in morning brief (session open) and evening brief (session close) for every day. These are not working sessions — they are daily operational rhythm. Even on light days, the structure is there. Working sessions (planning, building, research) are separate and unlimited in number.

### Morning Brief — Session Open

| Section | Content | Source |
|---|---|---|
| Project Status | Current status of Sparkle Suite and Rabbit Hole — phase, active, blocked | Supabase + OB |
| Accomplishments | What was done yesterday and over the past week | Agent logs / OB |
| Objectives | What to accomplish today and this week | Queue logic + OB |
| Financial Outlook | Current balances + MRR + forward projection | Stripe, Plaid |
| Lessons Learned | New SOPs, standing rules, key decisions — reiterated daily | Supabase / OB |
| Correspondence | Important emails and communications flagged | Gmail agent |
| Maintenance Alerts | Anything broken, expiring, or flagged | Automated health checks |
| New Client Tracking | Every new Sparkle Suite client tracked until fully onboarded | Supabase |
| Agent Status | What each agent is working on, where in workflow, issues flagged | Agent layer |

### Evening Brief — Session Close

Same structure as morning brief with emphasis shifted:
- **Accomplishments** = what got done today specifically
- **Outlook** = what is planned for tomorrow and the coming week/weekend
- All other sections (financials, maintenance, agents, correspondence) = closing snapshot

### Design Note
The brief is upgradable. Sections will be added as the operation grows. Build it modular so sections can be added, reordered, or expanded without rebuilding the component.

---

## Navigation Structure

### Top-Level Tabs (Current — Phase 2A)

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

### Navigation Model at Scale
As projects grow and modules are added, the nav must scale without becoming cluttered. Structure TBD (sidebar vs top nav vs hybrid — Section 5 pending) but must support:
- Top-level project switching (Sparkle Suite / Rabbit Hole / Neon Rabbit overall)
- Zoom in/out within a project
- Query/search across everything
- Agent panel access from anywhere
- Quick Stats persistent across all views

### Quick Stats Bar
Persistent across all views. Shows at a glance:
- Sparkle Suite: X clients • $X MRR • X pending
- Rabbit Hole: Current phase • build status
- Finances: Balances • MRR • net
- Agents: X active • X idle • X flagged

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

---

## Sparkle Suite Module Spec

### Customer Board
Visual board showing all active clients with status indicators. Click into any client for full detail.

**Per-client tracking:**
- Build and maintenance cycle status
- Automation health (tools working?)
- Website health and uptime
- Branding needs (business cards, graphics, etc.)
- Trade board status
- SEO/GEO status and last update date
- Open requests and communications
- Onboarding status (new clients in morning brief until stable)

**Current clients:** Kara (Sprinkled in Diamonds), Bri (Bri's Glowtique), Heather (The Bling Kitchen), Brittany (Brittwith Bling), Lindsey (Mile High Fizz), Desie (Roberts Photo Studio)

### Lifecycle Workflow Map
Visual flow map from first touchpoint to cancellation. Every process, every handoff, every touchpoint mapped as a navigable diagram. Covers:
- First inquiry / meeting request
- Discovery and proposal
- Onboarding
- Active build
- Launch
- Ongoing maintenance
- Renewal / expansion
- Cancellation / offboarding

### Project Financials
Internal P&L for Sparkle Suite. Separate from overall Neon Rabbit view. MRR per client, churn tracking, revenue trend. Auto-calculated from Supabase client records.

### Bomb Party Intelligence
Monitoring layer for Bomb Party platform changes. Automatically surfaces significant changes that affect Sparkle Suite products. Always-on, proactive. Approach TBD (scraping, RSS, agent monitoring). Evolves as the BP platform evolves.

### Future — Staff Mirror View
When Sparkle Suite gets a dedicated project lead (3–6 month horizon), they receive a scoped dashboard view — same data, restricted to their section only. Built modularly so this is an add-on, not a rebuild.

---

## Rabbit Hole Module Spec

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
Stay-ahead-of-the-curve intelligence feed for the Rabbit Hole domain. Monitors: mobile app landscape, agent protocols, feed reader market, crypto payment landscape, app store policy changes. Format TBD. Surfaces relevant signals automatically — not reactively from external hunting.

---

## Agent Monitoring Layer

### Philosophy
Agents are employees. The dashboard manages them the way a CEO manages staff — aware of what they're doing, able to check in, able to identify problems, able to reassign or retask. Not micromanaging. Just visibility.

### Agent Panel — Surface View
- **Name and role** — what this agent is responsible for
- **Current task** — what it's working on right now
- **Workflow position** — where it is in its assigned process (visual map)
- **Status** — active / idle / blocked / error
- **Issue flag** — if something went wrong, surfaces here immediately

### Agent Panel — Drill-Down View
Click any agent to see:
- Full activity log for the day
- Workflow map with current position highlighted
- Task history and completion record
- Error log if applicable
- Direct query interface (format TBD — Section 4 pending)

### Metrics (Emerge Over Time)
- Over-tasked vs under-tasked indicators
- Workflow efficiency and task completion rate
- Reassignment and retasking history
- Comparison across agents

### Agents Planned (Not Yet Built)
| Agent | Role |
|---|---|
| Gmail agent | Email processing, triage, flagging for Louis |
| Sparkle Suite research agent | Bomb Party platform monitoring, industry signals |
| Rabbit Hole research agent | Mobile app landscape, agent protocol, feed reader market signals |
| Others | TBD as workflows are designed |

---

## Database Schema

### Live Tables (Phase 2A — neon-rabbit-core)

| Table | Key Fields | Notes |
|---|---|---|
| `projects` | id, name, tier, status, next_action, scope, tool, category, updated_at, history, clients, milestones | 8 rows seeded |
| `financial_snapshots` | date, mrr, expenses, balances, net | Daily append rows — time-series |
| `expenses` | id, name, amount, category, recurring | 8 rows seeded |
| `sparkle_clients` | id, name, domain, status, monthly_rate, launched_at, notes | 4 rows seeded. Named sparkle_clients (not clients) to avoid OB collision |
| `queue_items` | id, project_id, description, status, tool, prompt_text, created_at | 3 rows seeded |
| `ideas` | id, title, notes, created_at | 6 rows seeded |
| `maintenance_items` | id, type, name, status, due_date, notes | 11 rows seeded |
| `pa_items` | id, type, name, status, details, updated_at | 10 rows seeded |

### Tables to Add (Phase 2B/3)

| Table | Purpose | Phase |
|---|---|---|
| `briefs` | Daily brief storage (morning/evening) | 2B |
| `agent_sessions` | Agent activity tracking | 2C/3 |
| `agent_tasks` | Per-task log for each agent | 2C/3 |
| `documents` | Data Storage Center (text content, Markdown) | 3 |
| `intelligence_items` | Research layer signals per project | 3 |

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

---

## Build Sequence

### Completed
- **Phase 1** ✅ — Static scaffold, 8 tabs, hardcoded data, deployed
- **Phase 2A** ✅ — 8 Supabase tables, Auth, RLS, dashboard reading from Supabase, CODEBASE_SNAPSHOT updated

### Upcoming
| Phase | Scope | Prerequisite |
|---|---|---|
| **2B** | Stripe + Plaid APIs, daily 6AM cron, auto-populated financials | Opus architecture session |
| **2C** | Gmail agent, Open Brain → dashboard Edge Function pipeline | Dedicated agent architecture session (standing rule) |
| **3** | Customer Board, Lifecycle Workflow Map, Agent Monitoring Panel, Research Intelligence Layer, Data Storage Center | Sparkle Suite scoping session + Rabbit Hole scoping session + Sections 4 & 5 complete |

### Sessions Required Before Phase 3 Build
1. ⏳ Complete Sections 4 and 5 of planning Q&A → generate HQ_Master_Plan_v1.2
2. ⏳ Sparkle Suite scoping session (~45 min) → update master plan
3. ⏳ Rabbit Hole dashboard scoping session (~30 min) → update master plan
4. ⏳ Phase 2B architecture session (Opus) → Stripe + Plaid decisions
5. ⏳ Claude Code — Phase 2B build

---

## Open Decisions

| # | Decision Needed | Blocked By | Resolves When |
|---|---|---|---|
| OD-1 | Agent task model — continuous background vs dispatched vs both | Section 4 Q&A | Next session |
| OD-2 | Research layer format — scheduled agent report, dedicated tab, or other | Section 4 Q&A | Next session |
| OD-3 | Agent query interface — chat vs command/status panel | Section 4 Q&A | Next session |
| OD-4 | Top-level navigation structure at scale — sidebar vs top nav vs hybrid | Section 5 Q&A | Next session |
| OD-5 | How pre-revenue vs live project modules differ visually | Section 5 Q&A | Next session |
| OD-6 | Bomb Party intelligence — scraping vs RSS vs agent monitoring | Sparkle Suite scoping session | TBD |
| OD-7 | Data Storage Center architecture — Supabase documents table + Storage buckets | Dedicated planning session | Phase 3 |
| OD-8 | Morning brief objectives section — agent-populated or Louis-set | Phase 2B/C planning | TBD |
| OD-9 | Staff mirror view — technical approach for scoped access | Future planning session | When team grows |
| OD-10 | Open Brain → dashboard Edge Function — build in Phase 2B or 2C? | Phase 2B architecture session | TBD |

---

## Research Gaps

| # | Gap | Action |
|---|---|---|
| RG-1 | Best-in-class CEO dashboard patterns for solo operators | Optional Gemini research |
| RG-2 | Modular dashboard architecture patterns | Optional Gemini research |
| RG-3 | Bomb Party platform monitoring — signals, scraping approach | Sparkle Suite scoping session |

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

---

*This master plan is the single source of truth for the Neon Rabbit HQ Dashboard. HQ_Unified_Dashboard_Spec_v2.0 is retired — this document supersedes it. Update and regenerate every session. Never let it fall behind reality.*
