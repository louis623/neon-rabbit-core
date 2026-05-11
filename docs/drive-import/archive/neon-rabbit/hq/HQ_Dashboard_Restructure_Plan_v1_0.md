# NR HQ Dashboard Restructure Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when working on HQ restructure tasks
📁 UPLOAD TO PROJECT: No (upload per session when HQ restructure is on the agenda)
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any restructure task completed or scope change

**Version:** 1.0 | **Created:** April 14, 2026 | **Status:** IN PROGRESS — Task 1 (Tools tab) building

---

## Overview

Four changes to simplify and strengthen the NR HQ dashboard. Each is a separate Claude Code session per Rule 7 (Small Bites).

---

## Top Nav — Before and After

**Before:**
```
Pulse | Financial | Operations | Sales | Maintenance | PA | Queue | Ideas | Build Tracker | Tools
```

**After:**
```
Pulse | Financial | Operations | Sales | Queue | Ideas | Build Tracker | Prompts | Tools
```

Two tabs removed (PA, Maintenance), one added (Prompts). Top bar is cleaner. Removed tabs become sub-tabs under their parent categories.

---

## Changes

### 1. Tools Tab (NEW — top-level)

**Status:** 🔧 BUILDING (April 14, 2026 — ultraplan running)

Position: far right of top nav bar. Contains sub-tabs for tool references.

**Sub-tabs:**
- **CLI** — Combined Claude Code + Codex CLI cheat sheet. Organized by task (what you're trying to do), side-by-side commands. Collapsible sections, click-to-copy. Most-used operations at top.
- *(Future sub-tabs added as new tools are adopted)*

---

### 2. PA Tab → Build Tracker Sub-Tab

**Status:** ⏳ NOT STARTED

Move VA Compensation out of top-level nav. It becomes a project sub-tab under Build Tracker, alongside Sparkle Suite and NR HQ.

**What changes:**
- PA tab removed from top nav bar
- Build Tracker gains a third project pill: "VA Compensation"
- VA Compensation tracked with its own phases, tasks, and status — same as SS and HQ
- Existing PA data (if any) migrates to Build Tracker structure

**Complexity:** Small — tab removal + sub-tab addition + possible data migration.

---

### 3. Maintenance Tab → Operations Sub-Tab

**Status:** ⏳ NOT STARTED

Maintenance is operational work. It belongs under Operations, not as its own top-level tab.

**What changes:**
- Maintenance tab removed from top nav bar
- Operations gains sub-tabs (if it doesn't already have them)
- First Operations sub-tab: existing Operations content (or "Overview")
- Second Operations sub-tab: "Maintenance" — same content, new home

**Complexity:** Small — tab move + sub-tab structure added to Operations.

---

### 4. Client Directory → Operations Sub-Tab (NEW)

**Status:** ⏳ NOT STARTED

New sub-tab under Operations. Simple client database for quick reference.

**What it shows per client:**
- Status indicator: 🟢 Green (complete/active) | 🟡 Yellow (in progress) | 🔴 Red (needs attention)
- Client name
- Phone number
- Email address
- Brief project status (fully complete, being worked on, in workflow, maintenance only, etc.)

**Data source:** Could be a new Supabase table (clients reference) or hardcoded initially and wired to Supabase later. Decision made at build time — keep it simple per Rule 20.

**Known clients to seed:**
- Lindsey — Mile High Fizz (MHF-7342)
- Brittany (BWB-5819)
- Bri — Bri's Glowtique (BGL-2463) — status TBD
- Heather — The Bling Kitchen (TBK-9157)
- Kara — Sprinkled in Diamonds (SID-6284)
- Desie Roberts — Roberts Photo Studio — maintenance only

**Complexity:** Medium — new component, client data structure, status indicators.

---

### 5. Prompts Tab (NEW — top-level)

**Status:** ⏳ NEEDS CONTENT SESSION FIRST

Position: second from right in top nav (before Tools). Template library for most-used prompt formats.

**Requires a dedicated session to define templates BEFORE building the tab.** The content session identifies which prompts to templatize, what the fill-in-the-blank fields are, and how they're organized.

**Candidate templates (to be refined in content session):**
- Session close prompt
- Session restart prompt
- Claude Code build prompt (standard)
- Claude Code build prompt (ultraplan)
- Codex adversarial review prompt
- Research prompt (Gemini/NotebookLM)
- Claude Code verification prompt
- Build Tracker update prompt

**Sub-tabs:** TBD — might be one flat list, might be categorized (Session Management, Build, Research, etc.). Decided during content session.

**Complexity:** Medium for the build, but content must come first.

---

## Build Sequence

| # | Task | Depends On | Complexity | Status |
|---|------|-----------|-----------|--------|
| 1 | Tools tab (CLI sub-tab) | Nothing | Medium | 🔧 Building |
| 2 | PA → Build Tracker sub-tab | Nothing | Small | ⏳ Not started |
| 3 | Maintenance → Operations sub-tab | Nothing | Small | ⏳ Not started |
| 4 | Client Directory (Operations sub-tab) | Task 3 (Operations has sub-tabs) | Medium | ⏳ Not started |
| 5 | Prompts tab | Content session | Medium | ⏳ Needs content session |

Tasks 2 and 3 can run in parallel or same session since both are small tab moves. Task 4 depends on Task 3 (Operations needs sub-tab structure first). Task 5 is blocked on a content session with Louis.

---

## Design Rules (All Tasks)

- Match existing NR HQ branding: dark background, neon pink/cyan/purple accents
- Use existing NRCard component for content containers
- Sub-tab pills: same style as ProjectTabs (pink active state, glow effect)
- useState for all tab/toggle state — no URL routing
- Click-to-copy on any commands or prompts
- Collapsible sections where content is long
- Desktop-first, TV-ready text sizing
- Rule 20: bare minimum code, functionality > fanciness

---

*This plan tracks the HQ dashboard restructure only. Update as tasks complete. Do not use for status tracking — that lives in Supabase via Build Tracker.*
