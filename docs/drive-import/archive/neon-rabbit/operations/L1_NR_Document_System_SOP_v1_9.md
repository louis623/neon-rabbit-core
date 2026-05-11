# Neon Rabbit — Document & Knowledge System SOP
**Version:** 1.9 | **Created:** April 5, 2026 | **Last Updated:** April 19, 2026 | **Status:** LOCKED

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/` (flat — no subfolders)
**🔍 HOW CLAUDE ACCESSES IT:** Pre-loaded every session via Claude Project
**📁 UPLOAD TO PROJECT:** Yes — needed every session
**🏷 PROJECT:** Neon Rabbit (all projects)
**👤 WHO USES IT:** Louis (reference), Claude (loaded every session), Claude Code (standing rules)
**🔄 UPDATE TRIGGER:** Any change to the layer system, file workflow, header standard, flagging behavior, Co-work protocol, session protocol, or Claude's learning loop

---

## v1.9 Changes (April 19, 2026)

- **NEW:** Claude's Learning Loop section — documents the `CLAUDE —` prefix tag namespace, the 6 capture types, and the 9-domain taxonomy for Claude's engineering learning (Rule 29 of Standing Rules).
- **UPDATED:** Session Open Protocol — now five pulls instead of four. Added scoped `CLAUDE —` pull based on session domain.
- **UPDATED:** Session Close Protocol — now explicitly references RULE REVISION captures and Standing Rules bumps triggered by them.
- **NEW:** Tag Architecture Review cadence documented (~every 2-3 weeks or ~20 captures, whichever first).

---

## The Core Principle

Every piece of information has exactly one home. Nothing lives in two places except Layer 1 files, which live in Google Drive as master AND are uploaded to the Claude project. The tier a file belongs to is determined by how often it's needed and who or what needs to read it.

---

## Mandatory Markdown File Header Standard

Every Markdown file created for Neon Rabbit — without exception — must include this header block immediately after the title:

```
📍 WHERE THIS FILE LIVES:   [Exact path — e.g. Google Drive /Neon Rabbit/]
🔍 HOW CLAUDE ACCESSES IT:  [Pre-loaded / Drive connector / GitHub / MCP search]
📁 UPLOAD TO PROJECT:        [Yes / No]
🏷 PROJECT:                  [Neon Rabbit / Sparkle Suite / Rabbit Hole / All]
👤 WHO USES IT:              [Louis / Claude / Claude Code / Agents / All]
🔄 UPDATE TRIGGER:           [What event causes this file to need updating]
```

This header tells both Louis and Claude exactly what to do with the file the moment it's opened. No guessing, no asking. The file is self-documenting.

---

## The Seven-Layer Architecture

Neon Rabbit operates across seven distinct storage and memory layers. Each layer has a specific job. Nothing is duplicated across layers.

---

### Layer 1 — Claude Project Files
**What lives here:** Markdown files Claude needs pre-loaded every session without being asked. Always-needed specs, standing rules, locked architecture. Evaluate case by case — ~5 files is a guideline, not a hard platform cap.

**Who reads it:** Claude automatically (every session), Louis (via project interface)

**Format:** Markdown (.md) only. No PDFs, no Word docs.

**Workflow:** Claude generates → Louis downloads → Louis drops into Google Drive `/Neon Rabbit/` → Louis uploads to Claude project via `+` button. Google Drive is always the master copy. Claude does not search for L1 files — they are pre-loaded automatically once uploaded.

**Filename rule:** All Layer 1 files begin with `L1_` prefix. This is a human-facing label that tells Louis this file belongs in the Claude project. It is not a retrieval tag for Claude.

**Current authorized files:**
| File | Status |
|---|---|
| `L1_NR_Document_System_SOP_v1.9.md` | ✅ Live (this file) |
| `L1_NR_Plugins_Skills_Standing_Rules_v3.14.md` | ✅ Live |
| `L1_NR_Dashboard_Architecture.md` | ⏳ Create when dashboard is locked |
| `L1_SS_System_Spec.md` | ⏳ Create next |
| `L1_RH_Architecture.md` | ⏳ Create when Phase 2 locked |

---

### Layer 2 — Google Drive `/Neon Rabbit/`
**What lives here:** All Neon Rabbit operational Markdown files — Layer 1 masters, SOPs, build specs, client files, skill specs. Everything in one flat folder. No subfolders.

**Who reads it:** Claude on demand via Google Drive connector, Louis anytime

**Folder structure:**
```
/Neon Rabbit/          ← Single flat folder. All files sit loose inside.
```

**File naming — prefix system:**
```
L1_    → Layer 1 file — upload to Claude project (human label only)
NR_    → Neon Rabbit SOPs, system docs, skill specs
SS_    → Sparkle Suite build files
RH_    → Rabbit Hole build files
HQ_    → Neon Rabbit HQ build files
CLIENT_ → Client files
```

**Format:** Markdown (.md) only. No PDFs, no Word docs, no spreadsheets — ever. No exceptions inside `/Neon Rabbit/`.

**Human-only files:** Documents that cannot be Markdown (legal, finances, personal, VA, job search) live outside `/Neon Rabbit/` entirely — in a separate area of Google Drive. Claude does not access those files unless explicitly asked.

**Claude access boundary:** Claude is permitted to search and access ONLY the `/Neon Rabbit/` folder. No other folders in Google Drive without explicit permission from Louis.

---

### Layer 3 — Open Brain (Supabase + MCP)
**What lives here:** Decisions made, session logs, ideas captured, anything conversational or searchable. The working memory layer. **Shared between Louis and Claude** — Louis's personal captures AND Claude's engineering learning loop both live here (see "Claude's Learning Loop" section below).

**Who reads it:** Claude via MCP tools (`search_thoughts`, `list_thoughts`, `capture_thought`), future agents via Supabase API

**How to write to it:**
- Claude captures directly during chat sessions (primary channel)
- The Rabbit Hole app — Save to Brain feature (secondary channel)

**Technical:** Supabase project `neon-rabbit-core`, us-east-1. pgvector enabled. OpenAI text-embedding-3-small halfvec(1536). Threshold 0.4 with concrete search terms works best.

---

### Layer 4 — GitHub Vault (Agentic Memory Layer)
**What lives here:** Structured Markdown files in the `neon-rabbit-core` repo for autonomous agent consumption. Agents read this without a live Claude session.

**Who reads it:** Claude Code, future autonomous agents, Claude via Claude Code context

**Repo:** `louis623/neon-rabbit-core` — main branch only

---

### Layer 5 — GitHub Repositories (Code + Snapshots)
**What lives here:** All project source code and CODEBASE_SNAPSHOT.md files generated at the end of every Claude Code session.

**Repos:**
- `louis623/neon-rabbit-core` (formerly sparkle-suite — renamed via Memory Library Task 1)
- `louis623/neon-rabbit-hq`
- `louis623/rabbit-hole`
- `louis623/rh-reader`

**Rules:** Main branch only. CODEBASE_SNAPSHOT regenerated and committed at end of every Claude Code session without exception.

---

### Layer 6 — Supabase Structured Data (neon-rabbit-core)
**What lives here:** All structured operational data — client records, project status, financials, Open Brain embeddings, Build Tracker, governance (open items), audit log. Also serves as the backend for MCP read AND write access from Claude Chat and Claude Code.

**Project:** `neon-rabbit-core`, us-east-1, ref `bqhzfkgkjyuhlsozpylf`

**Core tables:**

| Table | Purpose | Writers |
|---|---|---|
| `thoughts` + embeddings | Open Brain — decisions, session logs, ideas, Claude's learning loop captures | Claude Chat via open-brain-mcp, Rabbit Hole app |
| `construction_phases` / `construction_tasks` / `construction_gates` | Build Tracker — phases, tasks, gates per project | Claude Chat + Claude Code via nr-hq-mcp |
| `build_action_log` | Unified build-activity log: active action card snapshots + audit rows for every state change | Claude Chat + Claude Code via nr-hq-mcp; all status-change RPCs write atomically |
| `open_items` | Governance tracker — gaps, legal, grey area, research, decisions, to-dos | Claude Chat + Claude Code via nr-hq-mcp |
| `neon_rabbit_clients` | Canonical client database — name, site, status, Stripe payment data | Memory workflows via nr-hq-mcp; daily Stripe cron writes cron-owned columns |
| `clients_build_pipeline` | SS onboarding pipeline — tracks where a client is in the build process | Agents and Thumper |
| `financial_snapshots` | Daily rollup from Stripe + Plaid | daily-financial-sync Edge Function (cron-owned) |

**MCP Endpoints:**

| Endpoint | Purpose | Access Model |
|---|---|---|
| `open-brain-mcp` | Claude's working memory (thoughts, decisions, session logs, learning loop captures) | Read + write via `capture_thought`, `search_thoughts`, `list_thoughts`, `thought_stats` |
| `nr-hq-mcp` | Build tracking, governance, clients, audit | 18 tools (6 reads + 12 writes); gated by `MCP_ACCESS_KEY` |

**CRITICAL CONVENTION — actor param:** The 4 status-change write tools accept an optional `actor` param (`'chat'` | `'claude_code'`, default `'claude_code'`). **Claude Chat MUST pass `actor='chat'` on every call** so audit rows label changes correctly.

**Trust boundary for audit data:** Audit rows (rows with `entry_kind='audit'` in `build_action_log`) are NOT exposed via anon Supabase access. Readable ONLY via the `get_recent_audit_log` MCP tool (service-role path, gated by `MCP_ACCESS_KEY`).

**After Edge Function changes:** Louis must reload the connector to pick up new tool schemas in fresh chats.

---

### Layer 7 — Human Only (Outside `/Neon Rabbit/`)
**What lives here:** Documents for human reading only — legal, finances, VA claims, job search, personal notes. Lives in a separate area of Google Drive outside the `/Neon Rabbit/` folder. Claude enters only when explicitly asked.

**Format:** Any — Word, PDF, spreadsheets acceptable here.

**Naming convention:** Files use category prefixes for searchability:
```
VA_        → VA claims, nexus letters, DBQs, medical records
FINANCE_   → Tax docs, bank statements, Stripe exports
LEGAL_     → Business licenses, contracts, agreements
JOB_       → Resumes, applications, interview notes
NR_        → Neon Rabbit business docs (non-operational)
PERSONAL_  → Personal notes, non-business items

Examples:
VA_GAD_NexusLetter_Feb2025
LEGAL_BusinessLicense_2025
FINANCE_TaxReturn_2025
JOB_Resume_TechOps_v2
```

---

## Claude's Learning Loop (NEW — v1.9)

Open Brain (Layer 3) is a shared memory for both Louis and Claude. Louis's captures and Claude's engineering learning loop live in the same database but in separate namespaces so retrieval stays clean.

**Louis's captures** use the existing tag vocabulary: `SESSION CLOSE —`, `ACTIVE TASK —`, `MILESTONE —`, `DECISION —`, `PERSON NOTE —`, `FILE SHIPPED —`, `TOOL AWARENESS —`, etc. Unchanged.

**Claude's captures** use a dedicated `CLAUDE —` prefix namespace. This is the Rule 29 learning loop.

### Capture Types (v1 — review in 2-3 weeks)

| Prefix | When to use |
|---|---|
| `CLAUDE LESSON —` | Something went wrong. What, why, what Claude would do differently. Captured in-moment. |
| `CLAUDE PATTERN —` | Something worked well. Pattern + when to use again. |
| `CLAUDE DRIFT —` | Caught drifting from a rule or best practice. Self-correction log. Separate from LESSON because drift is rule-adjacent. |
| `CLAUDE HEURISTIC —` | Decision rule formed from multiple observations. Higher-order than a single lesson. Captured when Claude sees the same pattern 3+ times. |
| `CLAUDE ANTI-PATTERN —` | Something that seemed like it should work and didn't. Reverse of PATTERN. |
| `RULE REVISION —` | Trigger moment for a Standing Rule needing adjustment (see Rule 30). |

### Domain Taxonomy (every capture tagged with one)

- `prompt writing` — prompts for Code, Cowork, Codex, Gemini
- `verification` — gate tests, verification prompts, Rule 18 compliance
- `session management` — open/close protocol, context monitoring, restart prompts
- `clarifying questions` — Rule 28 execution, scope vs implementation sorting
- `spec/code alignment` — drift, documentation, schema vs deployed reality
- `architecture` — schema design, service layers, data flow decisions
- `design sessions` — Claude Design, mapping sessions, UI design direction
- `file management` — Drive, project uploads, L1 file swaps, versioning
- `communication` — tone, conciseness, snapshot vs essay, forbidden phrases

### Capture Format

Every `CLAUDE —` capture follows this structure:

```
[PREFIX] — [domain] — [short description] — [date]

WHAT HAPPENED: (or WHAT WORKED, depending on prefix)
[Specific details. Commit hashes, session identifiers, file names where relevant.]

WHY IT HAPPENED: (LESSON / DRIFT / ANTI-PATTERN only)
[Root cause analysis.]

WHAT I'D DO DIFFERENTLY: (LESSON / DRIFT / ANTI-PATTERN)
or
WHEN TO USE AGAIN: (PATTERN / HEURISTIC)
[Actionable takeaway.]

CONNECTS TO:
[Related Standing Rules, other captures, project context.]
```

### In-Session Surfacing to Louis

When Claude captures a `CLAUDE —` entry, Claude announces it as a one-line snapshot:

> "📝 Captured CLAUDE LESSON — prompt writing: EXECUTION block drifted inside prompt. Will retrieve at next prompt-writing session."

This gives Louis a chance to correct wrong takeaways before they codify. Prevents Claude from silently learning the wrong lesson. One line, snapshot form (Standing Rule 14). No essay.

### Review Cadence

**Trigger:** ~2-3 weeks from rule introduction date OR when ~20 `CLAUDE —` captures exist, whichever comes first.

**Review checks:**
1. Are all 6 capture types being used?
2. Are any tags collapsing in practice (e.g., LESSON and DRIFT indistinguishable)?
3. Are any needed tags missing? (Candidate from initial design: `CLAUDE QUESTION` for things Claude is unsure about and wants Louis to weigh in on later.)
4. Are the 9 domain tags sufficient? Any missing domains?
5. Is the scoped 5th pull at session open retrieving useful lessons or noise?
6. Is in-session one-line snapshot surfacing the right balance of visibility vs noise?

If structure is wrong, capture as `RULE REVISION — Tag architecture` per Rule 30 and adjust Rule 29 + this SOP section at next session close.

---

## How the Layers Connect (Data Flow)

```
Louis talks to Claude Chat
    → Louis's decisions captured to Open Brain (Layer 3) — existing tags
    → Claude's learning loop captured to Open Brain (Layer 3) — CLAUDE — tags
    → Build status updates, client edits, open items CRUD → Supabase (Layer 6)
      directly via nr-hq-mcp (actor='chat' on status changes)
    → Locked specs → Google Drive /Neon Rabbit/ (Layer 2) → Claude Project (Layer 1)

Claude Chat reads operational state
    → NR HQ MCP (Layer 6) → construction_*, open_items, neon_rabbit_clients,
      build_action_log (via get_recent_audit_log for audit rows)
    → Open Brain (Layer 3) → Louis's captures + Claude's CLAUDE — captures
      via scoped 5th pull at session open

Rabbit Hole app
    → Save to Brain → Open Brain (Layer 3)

Claude Code builds
    → Commits code → GitHub repos (Layer 5)
    → Updates GitHub Vault (Layer 4)
    → Writes structured data → Supabase (Layer 6) via same nr-hq-mcp tools
      (actor defaults to 'claude_code')
    → Every state-change write emits atomic audit row to build_action_log
    → Regenerates CODEBASE_SNAPSHOT (Layer 5)

Agents run autonomously
    → Read GitHub Vault (Layer 4)
    → Read/write Supabase (Layer 6)

Dashboard
    → Reads Supabase (Layer 6) directly via anon key for card_snapshot rows
    → Reads audit log via get_recent_audit_log MCP tool (service-role gated)
    → Displays to Louis
```

---

## File Versioning Rule

When any Markdown file needs to be updated due to a rule change, decision, or new information:

1. Claude generates a brand new Markdown file with an incremented version number in the filename (e.g. `_v1.9.md`)
2. Louis downloads it and drops it into `/Neon Rabbit/` in Google Drive
3. The old version is deleted from Drive — the new versioned file replaces it
4. Version number lives in both the filename and inside the file header

No in-place edits. No patching individual sections. Always a clean new versioned file. Co-work is never used for file content edits — folder and file operations only.

---

## Session Open Protocol (UPDATED — v1.9 now FIVE pulls)

Every session must begin with these five pulls before any work starts:

**1. Search Open Brain for `"SESSION CLOSE"`** — threshold 0.35

**2. Search Open Brain for `"ACTIVE TASK"`** — threshold 0.35

**3. List thoughts from last 24-48 hours** — limit 30-50

**4. Call `get_build_summary()` via NR HQ MCP** — returns phase/task/gate counts, action cards, and drift detection for the active project(s)

**5. (NEW — Rule 29) Scoped `CLAUDE —` pull based on expected session domain(s)** — threshold 0.4, limit 5, maximum 2 domains per session.

Examples:
- Phase 2 design mapping session → pull `design sessions` + `clarifying questions` domains
- Claude Code prompt writing session → pull `prompt writing` + `verification` domains
- Architecture decision session → pull `architecture` + `spec/code alignment` domains
- Workflow/efficiency tune-up session → pull `session management` + `communication` domains

Targeted retrieval only. Working on Topic A should not surface Topic C lessons.

**Optional depending on task:**
- Call `get_open_items()` — see all active governance items (gaps, legal, grey area, tasks)
- Call `get_recent_audit_log(target_type=..., limit=10)` — recent state changes relevant to the work about to begin

Pull #4 gives Claude live build reality from Supabase in one call. Open Brain pulls (1-3 + 5) carry decisions, context, lessons learned, and concerns that structured data cannot capture.

Reference files (master plans, architecture specs, restructure plans) are still uploaded when the session needs design or architectural detail — the MCP provides status, files provide intent.

After completing all five pulls, confirm status back to Louis before touching any task:

> "✅ Session open complete. Here's where we stand: [summary]. Build status: [from MCP]. Active tasks: [list]. Relevant CLAUDE — learnings from prior sessions: [short summary if any]. Next action: [specific first step]. Anything missing or wrong?"

---

## Session Close Protocol

Every session close has THREE parts. All three are mandatory.

### Part 1 — Open Brain Capture

Structured capture to Open Brain. Required fields:

- Tasks completed this session (specific, item by item)
- Tasks still in flight — each gets its own ACTIVE TASK capture
- Every decision made, by name
- Every document touched, with status
- Every prompt written verbatim (Co-work or Claude Code)
- Next session first actions, in order

**ACTIVE TASK format:**
```
ACTIVE TASK — [Name] — [Date]:
Status: IN FLIGHT
Last step completed: [exact]
Next step: [exact]
Blocking dependencies: [any]
Prompts ready: [yes/no]
```

**PROMPT VAULT format** (for any Co-work or Claude Code prompt that is finalized):
```
CO-WORK PROMPT — [Name] — [Date]:
Status: READY TO FIRE
Target: [what it operates on]
Prompt text: [full text]
```
Status updates to FIRED then VERIFIED as it progresses.

**`CLAUDE —` captures (Rule 29):** These should be captured in-moment throughout the session, not batched at close. If any were missed during the session, capture them now before moving to Part 2.

**`RULE REVISION —` captures (Rule 30):** If any Standing Rule was identified as wrong or contradictory during the session and a trigger moment was captured, the RULE REVISION captures drive which rules get updated in Part 2.

### Part 2 — File Generation

Before closing, Claude must check: were any SOPs, specs, or standing rules changed by decisions made during this session? If yes, generate the updated versioned Markdown files NOW — do not defer to next session. Present all updated files for download before closing.

**Including RULE REVISION-driven updates:** If Part 1 captured any `RULE REVISION —` entries, the corresponding Standing Rules file gets bumped in Part 2 with the clarification or change applied. Reference the trigger moment inside the new rule's "Triggered by" line.

Common triggers: new standing rules added, session protocol changes, document system changes, architecture decisions that affect spec files, completed build phases that update project specs, RULE REVISION captures.

**Note:** Build Tracker status updates are NOT part of session close file generation. Those update live via MCP during the session.

### Part 3 — Restart Prompt

Every session close must end with a ready-to-paste prompt that Louis can use to start the next session. The prompt tells the next Claude instance:

- What was in progress when the session ended
- What to pull from Open Brain (specific search terms, including CLAUDE — domain hints for the 5th pull)
- What files to expect (uploads, research results, etc.)
- What the next actions are, in order
- Any context the next instance needs that might not be in Open Brain

Claude writes this prompt for itself — Claude knows how to talk to Claude better than Louis does.

Per Standing Rule 19, the restart prompt MUST begin with:
```
PROJECT: [which project]
CONTEXT: [one sentence — what we just finished and why this session matters]
GOAL: [one sentence — what we're trying to accomplish this session]
```

---

## Context Length Monitoring

Claude must proactively monitor conversation length during sessions. When the session reaches approximately 70–75% of practical context capacity, Claude must flag it:

> "⚠️ CONTEXT CHECK — We're getting deep into this session. I recommend we start wrapping up so we have room for a proper session close (Open Brain captures + file generation + restart prompt). Want to start the close-out process, or is there one more thing you need to get done first?"

Purpose: Prevents sessions from running so long that the close-out process gets rushed or skipped. Long sessions also degrade Claude's ability to recall early context accurately. Better to close clean and start fresh than to push through and lose quality.

---

## File Pre-Marking System

Before any Co-work conversion task runs, all files in Google Drive must be pre-marked with one of two designations and captured to Open Brain with exact filenames:

**CONVERT** — File will become a Markdown file in the operational system. Gets the full header standard applied. Placed in `/Neon Rabbit/` with correct prefix.

**HUMAN** — File stays as-is for human consumption only. Gets renamed with category prefix. Moves outside `/Neon Rabbit/` to the Human Only area of Drive.

This pre-marking step makes Co-work's conversion job unambiguous — no guesswork, no wrong moves. Pre-marking decisions must be captured to Open Brain with exact document names before any Co-work prompt is written.

---

## Co-work Protocol

These rules apply every time Co-work is used for file or folder operations:

**Before firing any Co-work prompt:**
1. Claude verifies the target location actually exists in Google Drive using the Drive connector
2. If the target cannot be confirmed, Claude flags it before the prompt is written
3. Never assume a folder or file exists based on conversation context alone

**After Co-work signals completion:**
1. Louis comes back to Claude and says "please verify Co-work's work"
2. Claude checks Drive via connector — not just that items exist, but that they exist in the correct location
3. Co-work's checklist = attempted actions, NOT confirmed results
4. Claude is the confirmation layer — always

**Task structure:**
- One job per Co-work task — never combine operations in one prompt
- Verify each task before firing the next
- If a task goes wrong, start a new task — never continue a failed one
- Co-work is never used for file content edits — folder and file move/rename operations only

---

## Markdown File Creation Triggers

| Trigger | Example |
|---|---|
| System or architecture built and deployed | Schema goes live → create architecture spec |
| SOP used with a client or run more than once | Onboarding checklist used → lock as SOP |
| Claude Code completes a phase | Phase 2A ships → update phase spec |
| Decision made that Claude Code will reference repeatedly | New standing rule → update standing rules file |
| Project moves from planning to active build | Rabbit Hole Phase 2 locked → create spec |
| New skill created for Claude Code | Skill built → companion NR_Skill_*.md spec in /Neon Rabbit/ |
| RULE REVISION captured (Rule 30) | Standing Rule trigger moment → bump Standing Rules file at session close |

**NOT a trigger:** Brainstorming, planning, ideas still in motion → Open Brain (Layer 3)

---

## File Flagging — How Claude Alerts You

```
📌 FILE FLAG
File:           filename.md
Tier/Layer:     Layer X — [name]
Project:        [which project]
Reason:         One sentence on why it belongs there
Action needed:  What Louis needs to do
```

---

## File Naming Convention (Markdown Files)

```
[Layer][Scope]_[Description]_[Version].md

Layer prefix (if Layer 1):   L1_
Scope prefixes:              NR_ / SS_ / RH_ / HQ_ / CLIENT_
Version (if applicable):     _v1.0, _v1.5, _v2.0

Examples:
L1_NR_Document_System_SOP_v1.9.md
L1_NR_Plugins_Skills_Standing_Rules_v3.14.md
SS_Master_System_Outline_v1.0.md
HQ_Unified_Dashboard_Spec_v2.0.md
NR_Skill_NeonRabbitHQ_v1.0.md
CLIENT_BlingKitchen_SEO_GEO_Report.md
```

No spaces. Underscores only.

---

## Quarterly Audit

Once per quarter, say: **"audit the project Markdown files."**

Claude will list all Layer 1 files, check against what's built, flag anything stale or missing, and generate updates as needed.

---

## Quick Reference — What Goes Where

| If it is... | Layer | Location |
|---|---|---|
| Always-needed spec (locked, every session) | 1 | Claude Project (master in Google Drive `/Neon Rabbit/` with `L1_` prefix) |
| Occasional SOP or process doc | 2 | Google Drive `/Neon Rabbit/` — `NR_` prefix |
| Build spec for a product | 2 | Google Drive `/Neon Rabbit/` — `SS_`, `RH_`, or `HQ_` prefix |
| Client reference doc | 2 | Google Drive `/Neon Rabbit/` — `CLIENT_` prefix |
| Skill spec (accompanies a Claude Code skill) | 2 | Google Drive `/Neon Rabbit/` — `NR_Skill_[ProductName]_vX.Y.md` |
| Louis's decision, idea, session log | 3 | Open Brain (Claude session or Rabbit Hole app) — existing tag vocabulary |
| Claude's engineering learning loop capture | 3 | Open Brain — `CLAUDE —` prefix namespace (Rule 29) |
| Rule revision trigger | 3 | Open Brain — `RULE REVISION —` (Rule 30) |
| Agent context and operational SOPs | 4 | GitHub Vault (neon-rabbit-core repo) |
| Source code and architecture snapshots | 5 | GitHub repos (main branch) |
| Client records, financials, project status | 6 | Supabase (neon-rabbit-core) |
| Build status (live, queryable) | 6 | Supabase via nr-hq-mcp read tools |
| Governance items (gaps, legal, grey area, to-dos) | 6 | Supabase `open_items` via nr-hq-mcp |
| Audit log (every status change) | 6 | Supabase `build_action_log` via `get_recent_audit_log` MCP tool |
| Human-only docs (legal, finances, personal) | 7 | Google Drive — outside `/Neon Rabbit/` — named with category prefix |
| Still being planned or brainstormed | Nowhere yet | Open Brain when decided |

---

*This SOP is the master reference for the entire Neon Rabbit documentation and memory system. Update it when the system changes. Do not update it for things still in planning.*
