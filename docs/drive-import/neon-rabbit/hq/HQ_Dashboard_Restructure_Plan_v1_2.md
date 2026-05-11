# NR HQ Dashboard Restructure Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when working on HQ restructure tasks
📁 UPLOAD TO PROJECT: No (upload per session when HQ restructure is on the agenda)
🏷 PROJECT: Neon Rabbit HQ
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any restructure task completed or scope change

**Version:** 1.2 | **Created:** April 14, 2026 | **Last Updated:** April 14, 2026 | **Status:** IN PROGRESS — Tasks 1–5 COMPLETE, Queue removed. Tasks 6–7 pending.

---

## Overview

Simplify and strengthen the NR HQ dashboard. Each change is a separate Claude Code session per Rule 7 (Small Bites).

---

## Top Nav — Before and After

**Original (pre-restructure):**
```
Pulse | Financial | Operations | Sales | Maintenance | PA | Queue | Ideas | Build Tracker
```

**After (current state):**
```
Pulse | Financial | Operations | Sales | Ideas | Build Tracker | Tools
```

Four tabs removed (PA, Maintenance, Queue, Prompts concept). One added (Tools with two sub-tabs). Removed tabs either became sub-tabs under parent categories or were eliminated as redundant. Prompts was originally planned as a top-level tab but was moved to a Tools sub-tab before build — never existed as a top-level tab.

**Net result:** 9 tabs → 7 tabs.

---

## Changes

### 1. Tools Tab (NEW — top-level) ✅ COMPLETE

**Commits:** 4784680 (tab + CLI reference), b5bc501 (Section 7 model switching update)
**Verified by Louis:** Yes

Position: far right of top nav bar. Contains sub-tabs for tool references.

**Sub-tabs:**
- **CLI** — Combined Claude Code + Codex CLI cheat sheet. Organized by task (what you're trying to do), side-by-side commands. 7 collapsible sections, click-to-copy. Most-used operations at top. Section 7 includes model check/switch commands for both tools.
- **Prompts** — Standing prompt templates. Collapsible sections with dropdown arrows. Click-to-copy on full prompt text. Green "Copied" / red "Failed" with 1.2s auto-reset. First prompt: Session Close (full 4-part protocol with forced stops and verification checklists). New prompts added only after proven through repeated use — no speculative entries.

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

**Commits:** 9570b69 (initial build), + contact info population, + expandable details
**Verified by Louis:** Yes (all iterations)

Third sub-tab pill in Operations (Overview / Maintenance / Clients). Six client rows with:
- **Top row:** Client name, colored status dot (green/yellow), client code (click-to-copy), phone (click-to-copy), email (click-to-copy)
- **Expandable detail section** (dropdown arrow per client): Website URL (clickable, opens new tab), social media links (up to 4, clickable), time zone, monthly rate, team/upline
- Fields with no data are hidden — no empty rows or placeholders

**Known clients seeded:**
- Lindsey Chapman — Mile High Fizz (MHF-7342) — 🟢 Active
- Brittany Osborne (BWB-5819) — 🟢 Active
- Brianna Williams — Bri's Glowtique (BGL-2463) — 🟡 Paused
- Heather Daugherty — The Bling Kitchen (TBK-9157) — 🟢 Active
- Kara Weeks — Sprinkled in Diamonds (SID-6284) — 🟢 Active
- Desie Roberts — Roberts Photo Studio — 🟢 Maintenance only

**Data accuracy note:** Some detail data (socials, team info) may contain errors. Full line-by-line audit is a to-do item. Heather's Facebook VIP Group URL may be duplicated from Bri's — needs verification.

---

### 5. Prompts → Tools Sub-Tab ✅ COMPLETE

**Status:** ✅ COMPLETE (as sub-tab under Tools, NOT as top-level tab)

Originally planned as a top-level tab. Decision changed during content session — prompts moved under Tools as a second sub-tab (CLI | Prompts). Rationale: only one prompt exists right now; a top-level tab for one item is overkill. Sub-tab keeps it accessible and extensible.

**Current prompts:**
- **Session Close** — Full 4-part protocol (Open Brain captures, file generation, Claude Code Build Tracker update prompt, restart prompt). Forced stops between parts. Verification checklists at each step. Click-to-copy.

**Philosophy:** Prompts earn their way in through repeated use. No speculative brainstorming. When a prompt is being pasted over and over, it goes on the wall.

---

### 6. Queue Tab — REMOVED ✅ COMPLETE

Queue removed from top-level navigation entirely. QueueView component deleted. Queue was redundant — Build Tracker covers all task tracking and sequencing. PulseView stat grid updated (Queue card replaced with Ideas count). DailyBrief updated to read top priority from first active project instead of queue.

---

### 7. VA Compensation Workflow Redesign

**Status:** ⏳ FUTURE SESSION

VA Compensation currently renders the old PAView component inside Build Tracker. Needs a dedicated session to:
- Redesign the view to make sense as a Build Tracker project
- Figure out how to wire automatic updates — via conversation captures, Open Brain integration, or other automated means
- Currently no construction_phases/tasks/gates data in Supabase for VA Compensation

**Complexity:** Medium — needs design + architecture discussion before build.

---

### 8. Client Directory Supabase Wiring + Auto-Update Pipeline

**Status:** ⏳ FUTURE SESSION — part of Claude Chat ↔ Supabase architecture

Three layers:
1. **Supabase table** — Create `clients` table in neon-rabbit-core (name, code, phone, email, status, project_status, website, socials, timezone, rate, team). Straightforward.
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
| 4 | Client Directory (Operations sub-tab) | Task 3 | Medium | ✅ Complete (9570b69 + enhancements) |
| 5 | Prompts → Tools sub-tab | Content session | Medium | ✅ Complete (sub-tab under Tools) |
| 6 | Queue tab removal | Nothing | Small | ✅ Complete |
| 7 | VA Compensation workflow redesign | Nothing | Medium | ⏳ Future session |
| 8 | Client Directory Supabase wiring | Claude Chat ↔ Supabase architecture | Medium-Large | ⏳ Future session |

---

## Additional Completed During Restructure Sessions

- **CLAUDE.md** created for neon-rabbit-hq repo. Claude Code now reads project-specific rules (NR branding, simplicity-first, useState for tabs, lessons learned) automatically at session start.
- **Standing Rules v3.8** generated with four new rules (17–20). Uploaded to Claude Project.
- **NR HQ MCP Edge Function** deployed — Claude Chat now has live read access to build tracking data from Supabase (5 tools).
- **Session Open Protocol** updated to 4 pulls (added get_build_summary via NR HQ MCP).
- **Document System SOP v1.7** generated with MCP endpoint documentation.

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
