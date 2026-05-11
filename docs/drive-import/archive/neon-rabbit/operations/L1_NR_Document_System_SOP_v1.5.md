# Neon Rabbit — Document & Knowledge System SOP
**Version:** 1.5 | **Created:** April 5, 2026 | **Last Updated:** April 6, 2026 | **Status:** LOCKED

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/` (flat — no subfolders)
**🔍 HOW CLAUDE ACCESSES IT:** Pre-loaded every session via Claude Project
**📁 UPLOAD TO PROJECT:** Yes — needed every session
**🏷 PROJECT:** Neon Rabbit (all projects)
**👤 WHO USES IT:** Louis (reference), Claude (loaded every session), Claude Code (standing rules)
**🔄 UPDATE TRIGGER:** Any change to the layer system, file workflow, header standard, flagging behavior, or Co-work protocol

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
| `L1_NR_Document_System_SOP_v1.5.md` | ✅ Live |
| `L1_NR_Plugins_Skills_Standing_Rules_v3.0.md` | ✅ Live |
| `L1_NR_Dashboard_Architecture.md` | ⏳ Create when dashboard is locked |
| `L1_SS_System_Spec.md` | ⏳ Create next |
| `L1_RH_Architecture.md` | ⏳ Create when Phase 2 locked |

---

### Layer 2 — Google Drive `/Neon Rabbit/`
**What lives here:** All Neon Rabbit operational Markdown files — Layer 1 masters, SOPs, build specs, client files. Everything in one flat folder. No subfolders.

**Who reads it:** Claude on demand via Google Drive connector, Louis anytime

**Folder structure:**
```
/Neon Rabbit/          ← Single flat folder. All files sit loose inside.
```

**File naming — prefix system:**
```
L1_    → Layer 1 file — upload to Claude project (human label only)
NR_    → Neon Rabbit SOPs and system docs
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
**What lives here:** Decisions made, session logs, ideas captured, anything conversational or searchable. The working memory layer.

**Who reads it:** Claude via MCP tools (`search_thoughts`, `list_thoughts`, `capture_thought`), future agents via Supabase API

**How to write to it:**
- Claude captures directly during chat sessions (primary channel)
- The Rabbit Hole app — Save to Brain feature (secondary channel)

**Note:** Telegram bot is not active. Slack or Telegram may be revisited in the future but are not part of the current stack.

**Technical:** Supabase project `neon-rabbit-core`, us-east-1. pgvector enabled. OpenAI text-embedding-3-small halfvec(1536). Threshold 0.4 with concrete search terms works best.

---

### Layer 4 — GitHub Vault (Agentic Memory Layer)
**What lives here:** Structured Markdown files in the `sparkle-suite` repo for autonomous agent consumption. Agents read this without a live Claude session.

**Who reads it:** Claude Code, future autonomous agents, Claude via Claude Code context

**Repo:** `louis623/sparkle-suite` — main branch only

---

### Layer 5 — GitHub Repositories (Code + Snapshots)
**What lives here:** All project source code and CODEBASE_SNAPSHOT.md files generated at the end of every Claude Code session.

**Repos:** `louis623/sparkle-suite` · `louis623/neon-rabbit-hq` · `rabbit-hole`

**Rules:** Main branch only. CODEBASE_SNAPSHOT regenerated and committed at end of every Claude Code session without exception.

---

### Layer 6 — Supabase Structured Data (neon-rabbit-core)
**What lives here:** All structured operational data — client records, project status, financials, Open Brain embeddings.

**Project:** `neon-rabbit-core`, us-east-1, ref `bqhzfkgkjyuhlsozpylf`

**Rules:** pgvector enabled, RLS on all tables. No binary files — rows and structured data only.

**Migration plan:** Google Drive operational docs migrate here after Neon Rabbit HQ Phase 2A is live.

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

## How the Layers Connect (Data Flow)

```
Louis talks to Claude
    → Decisions captured to Open Brain (Layer 3)
    → Locked specs → Google Drive /Neon Rabbit/ (Layer 2) → Claude Project (Layer 1)

Rabbit Hole app
    → Save to Brain → Open Brain (Layer 3)

Claude Code builds
    → Commits code → GitHub repos (Layer 5)
    → Updates GitHub Vault (Layer 4)
    → Writes structured data → Supabase (Layer 6)
    → Regenerates CODEBASE_SNAPSHOT (Layer 5)

Agents run autonomously
    → Read GitHub Vault (Layer 4)
    → Read/write Supabase (Layer 6)

Dashboard
    → Reads Supabase (Layer 6) → Displays to Louis
```

---

## File Versioning Rule

When any Markdown file needs to be updated due to a rule change, decision, or new information:

1. Claude generates a brand new Markdown file with an incremented version number in the filename (e.g. `_v1.5.md`)
2. Louis downloads it and drops it into `/Neon Rabbit/` in Google Drive
3. The old version is deleted from Drive — the new versioned file replaces it
4. Version number lives in both the filename and inside the file header

No in-place edits. No patching individual sections. Always a clean new versioned file. Co-work is never used for file content edits — folder and file operations only.

---

## Session Open Protocol

Every session must begin with these three pulls before any work starts:

1. Search Open Brain for `"SESSION CLOSE"` — threshold 0.35
2. Search Open Brain for `"ACTIVE TASK"` — threshold 0.35
3. List thoughts from last 48 hours — limit 50

After completing all three pulls, confirm status back to Louis before touching any task:

> "✅ Session open complete. Here's where we stand: [summary]. Active tasks: [list]. Next action: [specific first step]. Anything missing or wrong?"

---

## Session Close Protocol

Every session must end with a structured capture to Open Brain before closing. Required fields:

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
L1_NR_Document_System_SOP_v1.5.md
L1_NR_Plugins_Skills_Standing_Rules_v3.0.md
SS_Master_System_Outline_v1.0.md
HQ_Unified_Dashboard_Spec_v2.0.md
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
| Decision, idea, session log | 3 | Open Brain (Claude session or Rabbit Hole app) |
| Agent context and operational SOPs | 4 | GitHub Vault (sparkle-suite repo) |
| Source code and architecture snapshots | 5 | GitHub repos (main branch) |
| Client records, financials, project status | 6 | Supabase (neon-rabbit-core) |
| Human-only docs (legal, finances, personal) | 7 | Google Drive — outside `/Neon Rabbit/` — named with category prefix |
| Still being planned or brainstormed | Nowhere yet | Open Brain when decided |

---

*This SOP is the master reference for the entire Neon Rabbit documentation and memory system. Update it when the system changes. Do not update it for things still in planning.*
