# Neon Rabbit — Document & Knowledge System SOP
**Version:** 1.4 | **Created:** April 5, 2026 | **Last Updated:** April 5, 2026 | **Status:** LOCKED

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/Project Files/`
**🔍 HOW CLAUDE ACCESSES IT:** Pre-loaded every session via Claude Project
**📁 UPLOAD TO PROJECT:** Yes — needed every session
**🏷 PROJECT:** Neon Rabbit (all projects)
**👤 WHO USES IT:** Louis (reference), Claude (loaded every session), Claude Code (standing rules)
**🔄 UPDATE TRIGGER:** Any change to the layer system, file workflow, header standard, flagging behavior, or Co-work protocol

---

## The Core Principle

Every piece of information has exactly one home. Nothing lives in two places except Project Files, which live in Google Drive as master AND are uploaded to the Claude project. The tier a file belongs to is determined by how often it's needed and who or what needs to read it.

---

## Mandatory Markdown File Header Standard

Every Markdown file created for Neon Rabbit — without exception — must include this header block immediately after the title:

```
📍 WHERE THIS FILE LIVES:   [Exact path — e.g. Google Drive /Neon Rabbit/SOPs/]
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
**What lives here:** The 5 (max) Markdown files Claude needs pre-loaded every session without being asked. Always-needed specs, standing rules, locked architecture.

**Who reads it:** Claude automatically (every session), Louis (via project interface)

**Limit:** 5 files maximum. Exceeding this wastes context window.

**Format:** Markdown (.md) only. No PDFs, no Word docs.

**Workflow:** Claude generates → download → save to Google Drive `/Project Files/` → upload to Claude project via `+` → Google Drive. Google Drive is always the master copy.

**Current authorized files:**
| File | Status |
|---|---|
| `NR_Document_System_SOP.md` | ✅ Live |
| `NR_Dashboard_Architecture.md` | ⏳ Create when dashboard is locked |
| `Sparkle_Suite_System_Spec.md` | ⏳ Create next |
| `Rabbit_Hole_Architecture.md` | ⏳ Create when Phase 2 locked |
| `NR_Standing_Rules.md` | ⏳ Create next |

---

### Layer 2 — Google Drive `/Neon Rabbit/`
**What lives here:** Occasional SOPs, client reference docs, official business and legal documents. Also the master copy for all Layer 1 Markdown files.

**Who reads it:** Claude on demand via Google Drive connector, Louis anytime

**Folder structure:**
```
/Neon Rabbit/
├── Project Files/          ← Layer 1 masters (uploaded to Claude project)
├── SOPs/                   ← Occasional reference, Claude searches when relevant
│   └── Archive/            ← Deprecated SOPs, never deleted
├── Client Files/           ← One subfolder per client
│   ├── Kara — Sprinkled in Diamonds/
│   ├── Bri — Glowtique/
│   ├── Bling Kitchen/
│   └── Pipeline/
├── Human Only/             ← Claude enters only if explicitly asked
│   ├── Legal & Business/
│   ├── Finances/
│   ├── Personal Notes/
│   └── Job Search/
└── To Do — Archive Review/ ← Legacy files pending review and archival
```

**Format:** Markdown for all operational docs. PDF/Word acceptable in Human Only and Legal only.

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

### Layer 7 — Human Only (Google Drive subfolder)
**What lives here:** Documents for human reading only. Claude enters only when explicitly asked.

**Format:** Any — Word, PDF, spreadsheets acceptable here.

---

## How the Layers Connect (Data Flow)

```
Louis talks to Claude
    → Decisions captured to Open Brain (Layer 3)
    → Locked specs → Google Drive (Layer 2) → Claude Project (Layer 1)

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

## File Pre-Marking System

Before any Co-work conversion task runs, all files in Google Drive must be pre-marked with one of two designations:

**CONVERT** — File will become a Markdown file in the operational system. Gets the full header standard applied. Moves into the appropriate operational folder.

**HUMAN** — File stays as-is for human consumption only. Gets renamed per the naming convention below. Moves to Human Only or flattened in To Do — Archive Review.

This pre-marking step makes Co-work's conversion job unambiguous — no guesswork, no wrong moves.

---

## Human File Naming Convention

Files designated HUMAN must be renamed using this prefix system so Claude can search them via the Drive connector without folder navigation:

```
[CATEGORY]_[Subject]_[DateIfRelevant]

Category prefixes:
VA_        → VA claims, nexus letters, DBQs, medical records
FINANCE_   → Tax docs, bank statements, Stripe exports
LEGAL_     → Business licenses, contracts, agreements
JOB_       → Resumes, applications, interview notes
NR_        → Neon Rabbit business docs (non-operational)
PERSONAL_  → Personal notes, non-business items

Examples:
VA_GAD_NexusLetter_Feb2025
VA_BackStrain_DBQ_2026
LEGAL_BusinessLicense_2025
FINANCE_TaxReturn_2025
JOB_Resume_TechOps_v2
NR_MeetingRecording_Apr2026
```

**Why this matters:** Claude can search `VA_` and retrieve every VA document instantly. No folder navigation required. Flat file structure + consistent prefixes = fast retrieval.

---

## Co-work Protocol (Lessons Learned)

These rules apply every time Co-work is used for file or folder operations:

**Before firing any Co-work prompt:**
1. Claude verifies the target folder actually exists in Google Drive using the Drive connector
2. If the target folder cannot be confirmed, Claude flags it before the prompt is written
3. Never assume a folder exists based on conversation context alone

**After Co-work signals completion:**
1. Louis comes back to Claude and says "please verify Co-work's work"
2. Claude checks Drive via connector — not just that items exist, but that they exist in the correct location
3. Co-work's checklist = attempted actions, NOT confirmed results
4. Claude is the confirmation layer — always

**Task structure:**
- One job per Co-work task — never combine folder creation + file moves + conversions in one prompt
- Verify each task before firing the next
- If a task goes wrong, start a new task — never continue a failed one

---

## Markdown File Creation Triggers

| Trigger | Example |
|---|---|
| System or architecture built and deployed | Schema goes live → create architecture spec |
| SOP used with a client or run more than once | Onboarding checklist used → lock as SOP |
| Claude Code completes a phase | Phase 2A ships → update phase spec |
| Decision made that Claude Code will reference repeatedly | New standing rule → update NR_Standing_Rules.md |
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
[Scope]_[Description]_[Type].md

Scope prefixes: NR (Neon Rabbit), SS (Sparkle Suite), RH (Rabbit Hole)

Examples:
NR_Document_System_SOP.md
SS_System_Spec.md
RH_Phase2_Architecture.md
NR_Standing_Rules.md
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
| Always-needed spec (locked, every session) | 1 | Claude Project (master in Google Drive /Project Files/) |
| Occasional SOP or process doc | 2 | Google Drive /SOPs/ |
| Client reference doc | 2 | Google Drive /Client Files/[ClientName]/ |
| Official business/legal document | 2 | Google Drive /Human Only/Legal & Business/ |
| Decision, idea, session log | 3 | Open Brain (Claude session or Rabbit Hole app) |
| Agent context and operational SOPs | 4 | GitHub Vault (sparkle-suite repo) |
| Source code and architecture snapshots | 5 | GitHub repos (main branch) |
| Client records, financials, project status | 6 | Supabase (neon-rabbit-core) |
| Human-only docs (flat, searchable) | 7 | Google Drive /Human Only/ — named with category prefix |
| Still being planned or brainstormed | Nowhere yet | Open Brain when decided |

---

*This SOP is the master reference for the entire Neon Rabbit documentation and memory system. Update it when the system changes. Do not update it for things still in planning.*
