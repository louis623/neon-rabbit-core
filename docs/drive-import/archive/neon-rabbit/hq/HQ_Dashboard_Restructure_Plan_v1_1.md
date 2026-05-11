# NR HQ Dashboard Restructure Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when working on HQ restructure tasks
📁 UPLOAD TO PROJECT: No (upload per session when HQ restructure is on the agenda)
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any restructure task completed or scope change

**Version:** 1.1 | **Created:** April 14, 2026 | **Last Updated:** April 14, 2026 | **Status:** IN PROGRESS — Tasks 1–4 COMPLETE. Tasks 5–7 pending.

---

## Overview

Seven changes to simplify and strengthen the NR HQ dashboard. Each is a separate Claude Code session per Rule 7 (Small Bites).

---

## Top Nav — Before and After

**Before:**
```
Pulse | Financial | Operations | Sales | Maintenance | PA | Queue | Ideas | Build Tracker
```

**After (current state):**
```
Pulse | Financial | Operations | Sales | Queue | Ideas | Build Tracker | Prompts | Tools
```

Two tabs removed (PA, Maintenance), two added (Prompts, Tools). Removed tabs became sub-tabs under their parent categories.

---

## Changes

### 1. Tools Tab (NEW — top-level) ✅ COMPLETE

**Commits:** 4784680 (tab + CLI reference), b5bc501 (Section 7 model switching update)
**Verified by Louis:** Yes

Position: far right of top nav bar. Contains sub-tabs for tool references.

**Sub-tabs:**
- **CLI** — Combined Claude Code + Codex CLI cheat sheet. Organized by task (what you're trying to do), side-by-side commands. 7 collapsible sections, click-to-copy. Most-used operations at top. Section 7 includes model check/switch commands for both tools.
- *(Future sub-tabs added as new tools are adopted)*

---

### 2. PA Tab → Build Tracker Sub-Tab ✅ COMPLETE

**Commit:** 35ca37f
**Verified by Louis:** Yes

PA removed from top-level nav. VA Compensation is third project pill in Build Tracker alongside Sparkle Suite and NR HQ. BuildTrackerView bypasses Supabase construction data fetch for VA Compensation and renders existing PAView instead. 5 files changed, +43/-6. No new abstractions.

---

### 3. Maintenance Tab → Operations Sub-Tab ✅ COMPLETE

**Commit:** d01bdfa
**Verified by Louis:** Yes

Maintenance removed from top-level nav. Operations now has two-pill sub-tab selector (Overview / Maintenance) matching ToolsView pattern. OperationsView converted to client component with useState sub-tab.

---

### 4. Client Directory → Operations Sub-Tab (NEW) ✅ COMPLETE

**Commit:** 9570b69
**Verified by Louis:** Yes

Third sub-tab pill in Operations (Overview / Maintenance / Clients). Six client rows hardcoded with colored status dots (green/yellow), client codes, placeholder phone/email, project status descriptions. Read-only, no Supabase wiring yet.

**Known clients seeded:**
- Lindsey — Mile High Fizz (MHF-7342) — 🟢 Active
- Brittany (BWB-5819) — 🟢 Active
- Bri — Bri's Glowtique (BGL-2463) — 🟡 Paused
- Heather — The Bling Kitchen (TBK-9157) — 🟢 Active
- Kara — Sprinkled in Diamonds (SID-6284) — 🟢 Active
- Desie Roberts — Roberts Photo Studio — 🟢 Maintenance only

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

### 6. VA Compensation Workflow Redesign

**Status:** ⏳ FUTURE SESSION

VA Compensation currently renders the old PAView component inside Build Tracker. Needs a dedicated session to:
- Redesign the view to make sense as a Build Tracker project
- Figure out how to wire automatic updates — via conversation captures, Open Brain integration, or other automated means
- Currently no construction_phases/tasks/gates data in Supabase for VA Compensation

**Complexity:** Medium — needs design + architecture discussion before build.

---

### 7. Client Directory Supabase Wiring + Auto-Update Pipeline

**Status:** ⏳ FUTURE SESSION — part of Claude Chat ↔ Supabase architecture

Three layers:
1. **Supabase table** — Create `clients` table in neon-rabbit-core (name, code, phone, email, status, project_status). Straightforward.
2. **Wire component** — Replace hardcoded client array in ClientDirectory.tsx with Supabase query. Straightforward.
3. **Auto-update pipeline** — How does client status flow from Claude Chat sessions into Supabase automatically? This is part of the larger Claude Chat ↔ Supabase read/write architecture. Design alongside the Supabase access session. NOT a standalone quick task — needs Opus architecture session.

**Complexity:** Layer 1+2 are Quick. Layer 3 is Opus-level architecture.

---

## Build Sequence

| # | Task | Depends On | Complexity | Status |
|---|------|-----------|-----------|--------|
| 1 | Tools tab (CLI sub-tab) | Nothing | Medium | ✅ Complete (4784680, b5bc501) |
| 2 | PA → Build Tracker sub-tab | Nothing | Small | ✅ Complete (35ca37f) |
| 3 | Maintenance → Operations sub-tab | Nothing | Small | ✅ Complete (d01bdfa) |
| 4 | Client Directory (Operations sub-tab) | Task 3 | Medium | ✅ Complete (9570b69) |
| 5 | Prompts tab | Content session | Medium | ⏳ Needs content session |
| 6 | VA Compensation workflow redesign | Nothing | Medium | ⏳ Future session |
| 7 | Client Directory Supabase wiring | Claude Chat ↔ Supabase architecture | Medium-Large | ⏳ Future session |

---

## Additional Completed This Session

- **CLAUDE.md** created for neon-rabbit-hq repo. Claude Code now reads project-specific rules (NR branding, simplicity-first, useState for tabs, lessons learned) automatically at session start. Not a restructure task but a permanent foundation improvement.

- **Standing Rules v3.8** generated with four new rules (17–20). Uploaded to Claude Project.

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
