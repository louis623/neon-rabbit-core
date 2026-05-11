# Neon Rabbit — Memory Library & Infrastructure Build Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Neon Rabbit (all projects)
👤 WHO USES IT: Louis (primary reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any task completed, new task added, or scope change

**Version:** 1.0 | **Created:** April 15, 2026 | **Status:** ACTIVE — Ready to execute. Priority #1 across all NR projects.

**Source session:** Session #28 (April 15, 2026) — SS cleanup + Memory Library architecture

---

## What This Plan Builds

A unified system where Claude Chat reads AND writes to multiple Supabase data layers during conversations, and the NR HQ dashboard displays everything live. This eliminates Claude Code prompts for status updates, prevents gaps and to-dos from getting lost, and makes the dashboard a true real-time command center.

**The five data layers:**

| Layer | Table(s) | Status | Purpose |
|-------|----------|--------|---------|
| Open Brain | thoughts | ✅ Working (read + write) | Everything — context, decisions, history, ideas. The complete record. |
| Build Tracker | construction_phases, construction_tasks, construction_gates, build_action_log | ✅ Working (read only) → adding writes | Construction work. Phases, tasks, gates, action cards. |
| Open Items | open_items | 🔨 Build this plan | Gaps, research, to-dos, deferred decisions, grey area items. Everything actionable that's not a build task. |
| Clients | clients | 🔨 Build this plan | Client profiles, contact info, project status, notes. |
| Financials | TBD | ⏳ Parked — needs Opus session | Revenue, expenses, MRR, Stripe + Bluevine API data. |

**After this ships:**
- Claude Chat updates Build Tracker, Open Items, and Clients directly during conversations
- No more Claude Code prompts for status updates at session close
- Open items never get lost — visible on HQ dashboard permanently
- Client info stays current without touching code
- Each dashboard section has its own activity/history log
- Session close becomes: Open Brain captures + direct Supabase writes

---

## Execution Sequence

Seven tasks, run in order. Each is one focused session (Rule 7 — small bites). Some can double up if context allows.

---

### Task 1 — GitHub Repo Rename

**What:** Rename `louis623/sparkle-suite` → `louis623/neon-rabbit-core`

**Why:** The repo contains NR-wide infrastructure (Edge Functions, migrations, Supabase config) plus Sparkle Suite application code. The name should reflect that it's the core infrastructure repo, not just one product. Future-proofs for employees, sale, or clarity.

**Who:** Louis (GitHub Settings) + Claude Code (file updates)

**Steps:**

1. **Louis — GitHub rename (2 minutes):**
   - Go to github.com/louis623/sparkle-suite → Settings
   - Change repository name to `neon-rabbit-core`
   - Confirm

2. **Louis — Local folder rename (2 minutes):**
   - Close any open terminals/editors referencing the folder
   - Rename `C:\Users\louis\sparkle-suite` → `C:\Users\louis\neon-rabbit-core`
   - Open terminal in new folder
   - Run: `git remote set-url origin https://github.com/louis623/neon-rabbit-core.git`
   - Verify: `git remote -v` should show new URL

3. **Claude Code — Update repo references (Standard, Quick):**
   - Update CLAUDE.md at repo root: repo name, any path references
   - Update any hardcoded path references in codebase
   - Check supabase/config.toml (should be fine — uses project ref, not repo name)
   - Regenerate CODEBASE_SNAPSHOT.md, commit, push

4. **Louis — Vercel check (2 minutes):**
   - Go to Vercel dashboard → sparkle-suite project → Settings → Git
   - Verify GitHub integration shows `neon-rabbit-core` (should auto-redirect)
   - If disconnected: reconnect to the renamed repo

5. **Claude Code — Update neon-rabbit-hq references (Standard, Quick):**
   - Check neon-rabbit-hq CLAUDE.md for sparkle-suite references → update
   - Regenerate CODEBASE_SNAPSHOT.md, commit, push

6. **Claude Chat — Memory + doc updates:**
   - Update Claude memory with new repo path
   - Flag L1 files for version bump (Standing Rules, SOP) — done in Task 6

**RULE:** Never create a new repo called `sparkle-suite` on the louis623 GitHub account. That would break all redirects permanently.

**Migration naming convention going forward:**
- NR-wide migrations: `xxx_nr_description.sql` (e.g., `010_nr_open_items.sql`)
- SS-specific migrations: `xxx_ss_description.sql`

---

### Task 2 — Supabase Migration: New Tables

**Repo:** neon-rabbit-core (after rename)
**Mode:** Standard — straightforward migration, no design decisions
**Overnight:** Yes
**Depends on:** Task 1 (repo rename complete so paths are correct)

**What this creates:**

**Table: `open_items`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, default gen_random_uuid()) | |
| project | text (default 'neon_rabbit') | Which project this relates to |
| title | text (not null) | Short description |
| description | text | Full context |
| category | enum: gap, legal, decision, research, grey_area, task | What kind of item |
| status | enum: open, deferred, in_progress, resolved | Current state |
| priority | enum: low, medium, high | Urgency |
| blocking_phase | text (nullable) | Which build phase this affects, if any |
| source_session | text (nullable) | Which session created this |
| resolution | text (nullable) | How it was resolved (filled on resolve) |
| created_at | timestamptz (default now()) | |
| updated_at | timestamptz (default now()) | Auto-update via trigger |
| resolved_at | timestamptz (nullable) | Set when resolved |

**Table: `clients`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, default gen_random_uuid()) | |
| name | text (not null) | Full name |
| code | text (unique, not null) | Client code (e.g., MHF-7342) |
| status | enum: active, paused, churned, prospect | Current relationship |
| phone | text | |
| email | text | |
| website | text | |
| socials | jsonb | Array of {platform, url} — up to 4 |
| time_zone | text | e.g., 'America/Denver' |
| monthly_rate | integer | In cents |
| team | text (nullable) | Team/group name |
| upline | text (nullable) | Who referred them |
| project_status | text | Freeform description of where they are |
| notes | text (nullable) | Latest context — updated by Claude Chat |
| onboarding_date | date (nullable) | When they joined |
| created_at | timestamptz (default now()) | |
| updated_at | timestamptz (default now()) | Auto-update via trigger |

**RLS:** Service_role full access, anon key SELECT only. Same pattern as construction tables.

**Seed data:** Populate clients table with all 6 current clients (Lindsey, Brittany, Bri, Heather, Kara, Desie) using data from Open Brain and existing Client Directory component.

**Seed data:** Populate open_items with known open items: Gap 4 (DUCLUS lightbox), all deferred gaps (10, 12, 13, 14, 19), all grey area items (pricing, start fee, launch fee, photography kit pricing, SMS threshold, branding menu), and pending external items (BP Section 7.1 verification, attorney session, A2P 10DLC registration).

---

### Task 3 — MCP Write Tools

**Repo:** neon-rabbit-core — `supabase/functions/nr-hq-mcp/index.ts`
**Mode:** Ultraplan — 12 new tool handlers, input validation, error handling
**Overnight:** Yes
**Depends on:** Task 2 (tables must exist)

**Add to existing nr-hq-mcp Edge Function (same auth: service_role + MCP_ACCESS_KEY):**

**Build Tracker writes (4 tools):**

| Tool | Params | What it does |
|------|--------|-------------|
| update_task_status | task_key, project, status, completion_session?, completion_date?, notes? | Sets task status. Auto-sets completion_date to now() if status=complete and no date provided. |
| update_phase_status | phase_key, project, status | Sets phase status. Recalculates total_tasks and completed_tasks from actual task counts. |
| update_gate_status | phase_key, project, status | Sets gate status (locked/testing/passed/failed). |
| update_action_cards | project, previous, current, next | Deactivates old active cards, inserts 3 new cards with correct positions. |

**Open Items CRUD (4 tools):**

| Tool | Params | What it does |
|------|--------|-------------|
| create_open_item | project, title, description, category, status?, priority?, blocking_phase?, source_session? | Inserts new open item. Returns the row. |
| update_open_item | id, any updatable field | Partial update. Sets updated_at automatically. |
| resolve_open_item | id, resolution | Sets status=resolved, resolution text, resolved_at=now(). |
| get_open_items | status?, category?, project?, priority? | List with optional filters. Default: shows open + deferred + in_progress. |

**Clients CRUD (4 tools):**

| Tool | Params | What it does |
|------|--------|-------------|
| create_client | name, code, status, phone?, email?, website?, socials?, time_zone?, monthly_rate?, team?, upline?, project_status?, notes?, onboarding_date? | Inserts new client. Returns the row. |
| update_client | id or code, any updatable field | Partial update by id or code. Sets updated_at automatically. |
| get_clients | status? | List all clients, optional status filter. |
| get_client | code | Single client by code (e.g., 'MHF-7342'). |

**Post-deploy (Louis, 2 minutes):** Reload the NR HQ connector in Claude.ai Settings → Feature Preview → Connectors. Click the NR HQ connector, disconnect, reconnect. Then test in a fresh chat — new tools should appear.

---

### Task 4 — HQ Dashboard: Live Data Wiring

**Repo:** neon-rabbit-hq
**Mode:** Ultraplan — multiple components, data fetching, new patterns
**Overnight:** Yes, IF Louis approves "follow existing NR HQ design patterns" (Rule 17)
**Depends on:** Task 3 (MCP tools deployed, tables populated)

**Design direction for Claude Code:** Follow existing NR HQ design patterns exactly. Dark mode, NRCard with hover glow, sub-tab pill selectors, collapsible sections, click-to-copy. Desktop-first. No new design concepts — match what's already there.

**Three changes:**

**1. Client Directory → live Supabase data**
- Rewire existing ClientDirectory component (Operations > Clients) to fetch from `clients` table
- Same expandable card design Louis already approved
- No visual changes — just swap hardcoded arrays for Supabase queries
- Contact info, socials, status dots, click-to-copy all stay the same

**2. Open Items panel → Build Tracker section**
- New component at top of Build Tracker view (above phase list)
- Shows open, deferred, and in_progress items grouped by category
- Each item: title, priority indicator, status dot (green=open, yellow=deferred, blue=in_progress), blocking phase if applicable
- Collapsible detail for description
- Count badge on Build Tracker tab showing total open items
- Resolved items hidden by default, accessible via "Show Resolved" toggle
- NRCard styling, collapsible pattern

**3. Activity logs → per-section history**
- **Build Tracker** → "History" sub-tab pill. Recent task completions, phase changes, gate results. Query construction tables ordered by updated_at desc. Each entry: timestamp, what changed, session reference.
- **Operations > Clients** → activity visible within each client's expandable section. Recent changes to that client's record.
- **Open Items** → resolved items serve as history when "Show Resolved" is toggled on. Each shows resolution text and resolved date.
- All history views: reverse chronological, scrollable, NRCard styling, 50 items max

---

### Task 5 — Seed Open Items via Claude Chat

**Who:** Claude Chat (me) — NOT Claude Code
**Mode:** Conversational — I use the new MCP write tools to populate the open_items table
**Depends on:** Task 3 (MCP write tools deployed)

After the MCP tools are live, I populate the open_items table with all known items from Open Brain and the master plan. Full item list documented in Task 2 seed data section. This task ensures nothing from the old Markdown tracking system gets lost in the transition.

---

### Task 6 — L1 File Updates

**Who:** Claude Chat — generate updated files during session close
**Mode:** Conversational — file generation, no Claude Code
**Depends on:** Task 1 (repo rename complete)

**L1_NR_Plugins_Skills_Standing_Rules → v3.9:**
- Rule 16: Update Claude Code prompt header path from `C:\Users\louis\sparkle-suite` to `C:\Users\louis\neon-rabbit-core`
- Add note about migration naming convention (nr_ prefix vs ss_ prefix)
- Add reference to Memory Library automatic behavior (Claude Chat writes to Build Tracker, Open Items, Clients during sessions)
- Update repo list: `louis623/neon-rabbit-core` replaces `louis623/sparkle-suite`

**L1_NR_Document_System_SOP → v1.8:**
- Layer 5 (GitHub): update repo name to neon-rabbit-core
- Layer 6 (Supabase): add open_items and clients tables to MCP endpoint documentation
- Update data flow diagram to show Claude Chat writing to Build Tracker + Open Items + Clients
- Session close protocol: remove "generate Build Tracker update prompt" step, replace with "Claude updates Supabase directly"
- Add Memory Library layer descriptions

---

### Task 7 — SS Master Plan Cleanup (Reference Spec Conversion)

**Who:** Claude Chat — generate updated file
**Mode:** Conversational — file generation, no Claude Code
**Depends on:** Tasks 1–4 complete (so the new system is live and tracking status)

Strip the SS_Master_Build_Plan of all living status tracking to make it a pure reference spec:

- Remove completion notes from task tables (commit hashes, session numbers, verification counts)
- Remove strikethroughs from overnight candidate list
- Remove "Phase 0 build status" block
- Keep task descriptions, specs, dependencies, test gate checklists — that's the plan
- Keep Legal Foundation, Parking Lot, Deferred Items, Grey Area — those are structural
- Clean pre-build blockers table — keep as historical context but remove status detail

Result: a document that only changes when the PLAN changes, not when STATUS changes. Version bump to v2.1.

---

## Future Work (Not In This Plan)

These items are acknowledged but separate from the Memory Library build. They resume after this plan is complete.

**Financials Architecture (Opus Session):**
- Design the financials table structure
- Stripe API integration: webhook data, subscription tracking, MRR calculations
- Bluevine API integration: bank balances, transaction history
- Refresh cadence: daily overnight cron vs. webhook-driven
- What the Financial tab on HQ actually displays
- This is HQ Phase 2B — needs its own dedicated session

**SS Test Gate 0 + Phase 1/2 Prompts:**
- Tabled from Session #28 — resume after Memory Library Task 3 is complete so we can use write tools immediately when updating build status

**NR HQ MCP Session 3:**
- Remaining read tools: briefing, project, ideas
- Depends on financials architecture being designed first

**VA Compensation Workflow Redesign:**
- Dedicated design session — not blocking anything

---

## Execution Timeline

| Task | Est. Time | Can Overnight? | Depends On |
|------|-----------|---------------|------------|
| 1 — Repo rename | 30 min (Louis manual + 2 Quick Claude Code) | No — needs Louis | Nothing |
| 2 — Migration | Standard, 20 min | Yes | Task 1 |
| 3 — MCP write tools | Ultraplan, 60–90 min | Yes | Task 2 |
| 4 — Dashboard wiring | Ultraplan, 60–90 min | Yes (if design approved) | Task 3 |
| 5 — Seed open items | 15 min conversational | N/A — Claude Chat | Task 3 |
| 6 — L1 file updates | 20 min conversational | N/A — Claude Chat | Task 1 |
| 7 — Master plan cleanup | 30 min conversational | N/A — Claude Chat | Task 4 |

**Fastest path:** Task 1 (this session or next) → Tasks 2+3 overnight → Task 4 overnight → Tasks 5+6+7 next conversation. Fully operational in 2 days.

**Conservative path:** One task per session. Fully operational in ~4 sessions.

---

*This plan is the single reference for the NR Memory Library and infrastructure build. Execute in order, one task at a time. Once Task 3 ships, this plan itself becomes partially obsolete — status updates go directly to the Build Tracker instead of updating this Markdown file.*
