# Neon Rabbit — Memory System Map
**Version:** 1.0 | **Created:** April 19, 2026 | **Last Updated:** April 19, 2026 | **Status:** LOCKED

📍 **WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
🔍 **HOW CLAUDE ACCESSES IT:** Pre-loaded every session via Claude Project
📁 **UPLOAD TO PROJECT:** Yes — needed every session
🏷 **PROJECT:** Neon Rabbit (all projects)
👤 **WHO USES IT:** Louis (reference + gap hunting), Claude (decision aid for where captures go)
🔄 **UPDATE TRIGGER:** New layer added, new tag prefix added, new MCP tool affecting memory, new cross-layer flow, Rule 29 review changes capture taxonomy

---

## Purpose

Single source of truth for Neon Rabbit's memory, tracking, and storage architecture. Shows every layer, every tag namespace, who writes where, and how the layers connect. Used by Louis to audit the system for gaps and by Claude to decide where captures belong.

The 7-layer architecture itself is documented in full in `L1_NR_Document_System_SOP_v1.9.md`. This file is the memory/tracking-focused companion: it zooms in on the layers where state lives, decisions flow, and tag namespaces operate.

---

## The Three Active Memory/Tracking Layers (zoomed-in view)

Most day-to-day memory work touches three layers. Understanding these three is 80% of understanding the system.

### 1. Open Brain (Layer 3)
**What it is:** Shared memory database. Supabase `thoughts` table with pgvector embeddings. Written to by Claude Chat (primary) and The Rabbit Hole app (secondary). Read via MCP tools (`search_thoughts`, `list_thoughts`, `capture_thought`, `thought_stats`).

**Key property:** PASSIVE. Only surfaces when searched. If nobody searches for it, it's invisible.

**Two namespaces share this database:**
- **Louis's namespace** — decisions, session logs, ideas, active tasks, person notes
- **Claude's namespace** — engineering learning loop (Rule 29)

### 2. Open Items Tracker (Layer 6 — Supabase `open_items` table)
**What it is:** Active governance tracker. Written via NR HQ MCP (`create_open_item`, `update_open_item`, `resolve_open_item`, `get_open_items`).

**Key property:** ACTIVE. Surfaces on HQ dashboard and at session opens via `get_open_items`. Visible without anyone thinking to search.

**Categories:** `gap`, `legal`, `decision`, `research`, `grey_area`, `task`

### 3. Build Tracker (Layer 6 — Supabase `construction_phases` / `construction_tasks` / `construction_gates` / `build_action_log`)
**What it is:** Live build state per project. Phases, tasks, gates, and audit log of every state change. Written via NR HQ MCP by both Claude Chat (`actor='chat'`) and Claude Code (`actor='claude_code'` default).

**Key property:** STRUCTURED + ACTIVE. Queryable, dashboard-surfaced, audit-trailed.

---

## System Map (ASCII)

```
                    ┌─────────────────────────────────────────┐
                    │             LOUIS (CEO)                 │
                    │   decisions, vision, verification       │
                    └────────────────┬────────────────────────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
                      ▼              ▼              ▼
              ┌──────────────┐ ┌──────────┐ ┌──────────────┐
              │ CLAUDE CHAT  │ │ CLAUDE   │ │ RABBIT HOLE  │
              │ (planning,   │ │ CODE     │ │ APP          │
              │  architect,  │ │ (build)  │ │ (mobile      │
              │  coordinator)│ │          │ │  capture)    │
              └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                     │              │              │
     ┌───────────────┼──────────────┼──────────────┤
     │               │              │              │
     ▼               ▼              ▼              ▼
┌─────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────────┐
│ LAYER 1 │  │   LAYER 3    │  │ LAYER 5 │  │   LAYER 6    │
│ Claude  │  │  OPEN BRAIN  │  │ GitHub  │  │  Supabase    │
│ Project │  │  (shared     │  │ repos   │  │  structured  │
│ files   │  │   memory)    │  │         │  │  data        │
│         │  │              │  │         │  │              │
│ L1 docs │  │ Louis's tags │  │ code +  │  │ open_items   │
│ (master │  │ + Claude's   │  │ snaps   │  │ Build Tracker│
│  specs) │  │ CLAUDE— tags │  │         │  │ clients      │
└─────────┘  └──────────────┘  └─────────┘  └──────┬───────┘
     ▲               ▲              ▲              │
     │               │              │              │
     │               │              │              ▼
     │               │              │       ┌──────────────┐
     │               │              │       │   HQ         │
     │               │              │       │   DASHBOARD  │
     │               │              │       │ (Louis-only  │
     │               │              │       │  view layer) │
     │               │              │       └──────────────┘
     │               │              │
┌────┴───────────────┴──────────────┴────┐
│        LAYER 2: GOOGLE DRIVE           │
│          /Neon Rabbit/                 │
│   (master copies of all L1 + L2 .md)   │
└────────────────────────────────────────┘

     ┌──────────────────────────────────────┐
     │  LAYER 4: GITHUB VAULT               │
     │  (agentic memory, neon-rabbit-core)  │
     │  read by autonomous agents           │
     └──────────────────────────────────────┘

     ┌──────────────────────────────────────┐
     │  LAYER 7: HUMAN ONLY                 │
     │  (outside /Neon Rabbit/)             │
     │  legal, finances, VA, personal       │
     └──────────────────────────────────────┘
```

---

## Tag Reference — Open Brain (Layer 3)

Open Brain is a shared database. Two namespaces write to it. They never overlap because the prefix tags disambiguate them.

### Louis's Namespace

| Prefix | Purpose | Written By | Surfaced How |
|---|---|---|---|
| `SESSION CLOSE —` | End-of-session snapshot with tasks done, decisions made, next steps | Claude Chat (for Louis) at session close | Session-open pull #1 (`search_thoughts` query="SESSION CLOSE", threshold 0.35) |
| `ACTIVE TASK —` | In-flight work items with status, last step, next step, blockers | Claude Chat (for Louis) | Session-open pull #2 (`search_thoughts` query="ACTIVE TASK", threshold 0.35) |
| `MILESTONE —` | Major completion event worth remembering long-term | Claude Chat (for Louis) after Louis-verified completion (Rule 18) | Manual search, session-open sweeps |
| `DECISION —` | Architectural or strategic decision locked | Claude Chat (for Louis) | Manual search when revisiting a topic |
| `PERSON NOTE —` | Facts about people (clients, family, contacts) | Claude Chat (for Louis) | Filtered list by person, manual search |
| `FILE SHIPPED —` | Markdown file generated and delivered to Louis | Claude Chat at session close | Manual search, audit sweeps |
| `TOOL AWARENESS —` | New Anthropic tooling noted per Rule 24 | Claude Chat when Louis mentions a new tool | Session-open awareness check (also in Standing Rules file) |
| `CO-WORK PROMPT —` | Finalized Co-work prompt with status (READY / FIRED / VERIFIED) | Claude Chat | Manual search when firing or verifying prompts |
| `RESEARCH FINDINGS SUMMARY —` | Analysis output from a Gemini/NotebookLM research prompt | Claude Chat after Louis uploads research results | Manual search during decision rounds |

### Claude's Namespace (Rule 29)

| Prefix | Purpose | Written By | Surfaced How |
|---|---|---|---|
| `CLAUDE LESSON —` | Something went wrong. What, why, what Claude would do differently. | Claude Chat (for Claude's own learning) | Scoped 5th pull at session open — filtered by domain |
| `CLAUDE PATTERN —` | Something worked well. Pattern + when to use again. | Claude Chat | Scoped 5th pull |
| `CLAUDE DRIFT —` | Caught drifting from a rule or best practice | Claude Chat | Scoped 5th pull |
| `CLAUDE HEURISTIC —` | Decision rule formed from multiple observations (3+ pattern sightings) | Claude Chat | Scoped 5th pull |
| `CLAUDE ANTI-PATTERN —` | Something that seemed like it should work and didn't | Claude Chat | Scoped 5th pull |
| `RULE REVISION —` | Trigger moment for a Standing Rule needing adjustment (Rule 30) | Claude Chat | Reviewed at session close for rule bumps |

### Domain Tags for `CLAUDE —` Captures

Every `CLAUDE —` capture is tagged with ONE domain for the scoped 5th pull at session open:

- `prompt writing`
- `verification`
- `session management`
- `clarifying questions`
- `spec/code alignment`
- `architecture`
- `design sessions`
- `file management`
- `communication`

### Capture Format for `CLAUDE —` Entries

```
[PREFIX] — [domain] — [short description] — [date]

WHAT HAPPENED / WHAT WORKED: ...
WHY IT HAPPENED: (LESSON / DRIFT / ANTI-PATTERN only)
WHAT I'D DO DIFFERENTLY / WHEN TO USE AGAIN: ...
CONNECTS TO: (related Standing Rules, other captures, project context)
```

---

## Tag Reference — Open Items Tracker (Layer 6)

`open_items` table. Each row has a category that determines its type.

| Category | Purpose | Examples |
|---|---|---|
| `gap` | Known missing piece of infrastructure, knowledge, or capability | Open Brain backup strategy, missing test coverage, undocumented process |
| `legal` | Legal/compliance work item | Terms of service review, business entity registration, licensing |
| `decision` | Pending decision that needs to be made | Phase placement for a feature, architecture choice, vendor selection |
| `research` | Research task that needs to happen before a decision or build | BP back office field audit, competitive analysis, tech feasibility study |
| `grey_area` | Ambiguous item — could be scope, could be feature, could be neither | Edge case feature requests, ambiguous client asks, unclear requirements |
| `task` | Concrete work item that needs to be done | Dashboard tab addition, migration, documentation update, refactor |

**Status values:** `open`, `deferred`, `in_progress`, `resolved`
**Priority values:** `low`, `medium`, `high`
**Project values:** `sparkle_suite`, `neon_rabbit_hq`, `rabbit_hole`, `neon_rabbit` (cross-project)

**Resolution protocol:** Never delete. Always `resolve_open_item` with a resolution string. For duplicates: resolution starts with `"DUPLICATE — superseded by id [UUID]"` per key learning in userMemories.

---

## Tag Reference — Build Tracker (Layer 6)

Live build state. Not prefixed tags — structured status values.

### Tables

| Table | Purpose | Status Values |
|---|---|---|
| `construction_phases` | Top-level phases per project | `not_started`, `in_progress`, `testing`, `complete` |
| `construction_tasks` | Tasks within phases | `not_started`, `in_progress`, `testing`, `complete` |
| `construction_gates` | Test gates between phases | `not_started`, `in_progress`, `passed`, `failed` |
| `build_action_log` | Unified log: active action cards + audit rows | `entry_kind`: `card_snapshot` or `audit` |

### Actor Convention (CRITICAL)

Status-change write tools accept `actor` param. Claude Chat MUST pass `actor='chat'`. Claude Code defaults to `actor='claude_code'`. Audit rows label changes with the actor.

### Audit Log Access

Audit rows (`entry_kind='audit'` in `build_action_log`) are NOT exposed via anon Supabase. Readable ONLY via `get_recent_audit_log` MCP tool (service-role gated).

---

## Cross-Layer Capture Decision Tree

When a new piece of information comes in, where does it go? This is the tree Claude walks.

```
Is it a Louis-facing decision, session log, idea, or note?
├── YES → Does it need to surface without being searched for?
│   ├── YES (active, must not be forgotten) → open_items (category by type) + Open Brain ACTIVE TASK cross-ref
│   └── NO (archival, searchable memory is fine) → Open Brain only (choose tag by type)
│
└── NO — Is it a Claude learning moment (Rule 29)?
    ├── YES → Open Brain with CLAUDE — prefix + domain tag
    └── NO — Is it a rule trigger (Rule 30)?
        ├── YES → Open Brain as RULE REVISION — (applied at next session close)
        └── NO — Is it a build status change?
            ├── YES → Build Tracker via MCP (actor='chat')
            └── NO → Probably belongs in a Markdown file (spec, SOP, L1 doc)
```

### The Big Rule (April 19, 2026 lesson)

**Parked feature requests, client pain points, competitive observations, and "this would be cool someday" ideas go to `open_items` FIRST, Open Brain as companion.** Open Brain alone is passive — only surfaces when searched. `open_items` is active — surfaces on dashboard and at session opens. Anything with a future needs both layers. Captured in `CLAUDE LESSON — architecture` on April 19, 2026.

---

## Layer Write Matrix

Who writes to what?

| Writer | Layer 1 | Layer 2 | Layer 3 (OB) | Layer 4 | Layer 5 | Layer 6 (SB) | Layer 7 |
|---|---|---|---|---|---|---|---|
| Louis | ✅ (uploads) | ✅ (drops files) | ⚠️ via RH app | ❌ | ❌ | ⚠️ (dashboard actions) | ✅ |
| Claude Chat | ✅ (generates) | ✅ (generates) | ✅ (primary) | ❌ | ❌ | ✅ (actor='chat') | ❌ |
| Claude Code | ❌ | ❌ | ❌ | ✅ | ✅ (primary) | ✅ (actor='claude_code') | ❌ |
| Rabbit Hole app | ❌ | ❌ | ✅ (Save to Brain) | ❌ | ❌ | ❌ | ❌ |
| Daily cron | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (financial_snapshots) | ❌ |
| Future agents | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ✅ | ❌ |

---

## Session Open Protocol (memory-relevant pulls)

From SOP v1.9 — the five pulls that hydrate memory at session start:

1. **`search_thoughts` query="SESSION CLOSE"** — threshold 0.35 — most recent session close for context
2. **`search_thoughts` query="ACTIVE TASK"** — threshold 0.35 — in-flight work items
3. **`list_thoughts` days=2 limit=30-50** — recent captures regardless of tag
4. **`get_build_summary()`** — live build state via NR HQ MCP
5. **Scoped `CLAUDE —` pull** — threshold 0.4, limit 5, max 2 domains per session — Rule 29 learning loop retrieval

---

## Known Gaps (tracked as open_items)

As of April 19, 2026:

| Gap | open_item UUID | Priority | Status |
|---|---|---|---|
| Open Brain backup strategy | (see open_items) | Low | Post-SS |
| open_items retention/archival policy | (see open_items) | Low | Post-SS |
| Build Tracker ↔ open_items cross-reference (blocking_phase as FK) | (see open_items) | Medium | **Pre-Phase 2** |
| CLAUDE — capture surfacing mechanism for Louis | (see open_items) | Low | Tied to Rule 29 review |
| Open Brain search/filter on HQ dashboard | (see open_items) | Low | Post-SS |
| Memory System Map tab on HQ dashboard | (see open_items) | Low | Post-SS |

---

## Version History

- **v1.0 — April 19, 2026:** Initial creation. Covers all 7 layers, both Open Brain namespaces, `open_items` schema, Build Tracker structure, capture decision tree, layer write matrix, session open protocol, known gaps. Triggered by Louis's request during Phase 2 mapping session to have a single-source visual/reference for the memory architecture.

---

*This file is the memory architecture reference. When it changes, `L1_NR_Document_System_SOP.md` likely also needs a bump. Keep them consistent.*
