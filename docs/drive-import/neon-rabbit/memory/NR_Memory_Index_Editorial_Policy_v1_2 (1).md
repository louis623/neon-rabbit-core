# Neon Rabbit — Memory Index Editorial Policy

📍 **WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
🔍 **HOW CLAUDE ACCESSES IT:** Loaded by the Memory Index compiler at every run. Available to chat sessions on demand via Drive connector.
📁 **UPLOAD TO PROJECT:** No — compiler-facing standing instructions, not chat-facing
🏷 **PROJECT:** Neon Rabbit (all projects)
👤 **WHO USES IT:** The Memory Index compiler (Vercel API route calling Claude API, fresh-context agent), Claude (reference)
🔄 **UPDATE TRIGGER:** New page type added, source authority hierarchy changes, Standing Rule changes affecting capture taxonomy, contradiction protocol revision, post-pilot findings (~May 2026 review point)

**Version:** 1.2 | **Created:** April 22, 2026 | **Last Updated:** April 23, 2026 | **Status:** PILOT

---

## v1.2 Changes (April 23, 2026)

Realignment to Nate B. Jones's hybrid architecture (OB1 wiki compiler recipe + Substack article "Karpathy's viral AI wiki has a flaw most of the 100K people who bookmarked it haven't noticed yet," April 22, 2026). Prior versions (v1.0, v1.1) deviated from the source architecture by introducing a calendar-based corpus window (3-day). This was wrong. Nate's design reads the full database and splits compilation by page type. v1.2 corrects every deviation.

- **UPDATED Section 0 — Compiler Architecture** — added per-page-type compilation pass architecture. Compiler makes N separate Claude API calls, one per page_type enum value. Each call gets the full tagged corpus filtered by relevance to that page type. No calendar windowing. This is the core architectural fix.
- **NEW Section 0.1 — Per-Page-Type Pass Architecture** — explicit step-by-step compilation workflow per Nate's Prompt 5 (Hybrid Blueprint) and Prompt 3 (Wiki Synthesis Agent). Each pass: query full corpus → filter by relevance to page type → send to Claude with editorial policy → receive pages of that type → write to DB. Lock held across all passes.
- **UPDATED Section 6.5 — Compile Scope** — removed "~3 weeks of captures" assumption and all calendar window language. Full corpus, every compile, split by page type.
- **NEW Section 7.1 — Existing Pages Read Rule** — metadata-only read from `memory_index_pages`. Compiler NEVER reads `body_markdown` from prior compiles. Prevents hallucination-laundering feedback loop (Nate's article: "editorial decisions in wiki synthesis can bake errors into your understanding"). CEO call locked April 23.
- **REMOVED** all references to "corpus window," "3-day window," "recency window," and "MEMORY_INDEX_COMPILE_WINDOW_DAYS" env var. These do not exist in Nate's architecture and were 4.7 inventions.

---

## 0. Compiler Architecture

The Memory Index compiler is a **fresh-context agent**, not a Chat-in-session process.

**What that means in practice:**
- The compiler runs as a Vercel API route (`/api/compile-memory-index`) that calls the Claude API (Sonnet) with no prior conversation context.
- The compiler's only inputs are (a) this Editorial Policy as standing instructions, (b) the full tagged corpus from the `thoughts` table, (c) metadata-only state from the existing `memory_index_pages` table.
- The compiler does NOT have access to any session conversation. It synthesizes ONLY from Open Brain captures and this policy.
- This architecture exists specifically to prevent the heavy-context drift pattern — Chat-in-session compiling under heavy context load would inherit the exact drift the Memory Index is meant to solve.

**Trigger (pilot):**
- The compiler runs **once daily** — manually triggered at the end of the last session of each working day. Three-day pilot to measure real cost, then decide ongoing frequency.
- Migration 025 (Postgres trigger on SESSION CLOSE insert) is NOT attached during the pilot. Manual trigger only. Trigger attachment decision deferred until cost data is in hand.
- Future frequency for NR: decided after 3-day pilot based on measured cost per compile.
- Future frequency for Thumper/reps: separate decision, separate cost model. Rep compile frequency will be far lower than NR (reps don't run 10+ sessions/day).

**Why this matters for the editorial policy:**
- Every instruction in this file must be executable BY A FRESH-CONTEXT AGENT with no conversational memory. If an instruction relies on "the compiler knows X from prior conversation," it's wrong. Instructions must be self-contained.
- Where judgment is required (contradiction flagging, uncertainty handling, inference boundaries), this file must be specific enough that two independent compiler runs produce the same output from the same captures.

### 0.1 Per-Page-Type Compilation Pass Architecture

The compiler does NOT make one large API call. It makes **N separate calls, one per page_type**, each producing only pages of that type. This is Nate's architecture for handling corpus size — each pass gets the full corpus but produces a bounded output.

**The page_type enum values (7 passes):**
1. `project` — Project Pages
2. `person` — Person Pages
3. `decision` — Decision Pages
4. `rule` — Rule Pages
5. `concept` — Architectural Concept Pages
6. `open_question` — Open Question Pages
7. `index` — Index/Map Page (always last — needs metadata from all other passes)

**Per-pass workflow:**

1. **Query the full tagged corpus** from the `thoughts` table. Tagged = content starts with a known prefix (SESSION CLOSE, ACTIVE TASK, DECISION, MILESTONE, CLAUDE LESSON, CLAUDE PATTERN, CLAUDE DRIFT, CLAUDE HEURISTIC, CLAUDE ANTI-PATTERN, CLAUDE ABOUT LOUIS, PERSON NOTE, RULE REVISION, TOOL AWARENESS, FILE SHIPPED, CO-WORK PROMPT, RESEARCH FINDINGS SUMMARY).

2. **Filter by relevance to this page type.** Not every capture is relevant to every pass:
   - `project` pass: SESSION CLOSE, ACTIVE TASK, MILESTONE, DECISION captures (these reference projects)
   - `person` pass: PERSON NOTE, CLAUDE ABOUT LOUIS, SESSION CLOSE captures mentioning people
   - `decision` pass: DECISION captures (primary), SESSION CLOSE captures (context)
   - `rule` pass: CLAUDE LESSON, CLAUDE PATTERN, CLAUDE DRIFT, CLAUDE HEURISTIC, CLAUDE ANTI-PATTERN, RULE REVISION captures
   - `concept` pass: DECISION, SESSION CLOSE, ACTIVE TASK captures referencing architectural components
   - `open_question` pass: All captures — open questions can surface from any capture type
   - `index` pass: Metadata from all pages produced in passes 1-6 (NOT the full corpus again)

3. **Read existing page metadata** from `memory_index_pages` for this page_type: slug, title, last_compiled_at, last_capture_seen_at, status, connected_page_slugs, source_capture_ids. **NEVER read body_markdown** (Section 7.1).

4. **Send to Claude API** with: this Editorial Policy (the relevant page type section), the filtered corpus, the existing page metadata. System prompt instructs Claude to produce ALL pages of this type as a JSON array.

5. **Parse response.** Validate JSON schema. Each page object contains: slug, title, body_markdown, source_capture_ids, connected_page_slugs, status.

6. **Write to `memory_index_pages`** via atomic upsert (match on slug). Update last_compiled_at, last_capture_seen_at, connected_page_slugs, source_capture_ids.

7. **Log the pass** in the compile run audit row.

**The `index` pass is always last** because it synthesizes metadata from all other pages produced in the current compile. It reads the freshly-written page metadata (slugs, titles, types, statuses) — NOT body_markdown.

**Input token management per pass:**
- Each pass sends only the relevant corpus slice, not the full 484K+ tokens
- If a single pass still exceeds the model's context ceiling, the compiler logs an error with the pass name and capture count, skips that pass, and continues with remaining passes. This is a loud failure — it means that page type has grown beyond single-call capacity and needs subdivision.

**Output per pass:**
- Each pass produces pages of ONE type only. Output stays bounded because the compiler is writing project pages OR decision pages, never both in one call.

---

## 1. Memory Index Purpose Statement

The Memory Index is a synthesized layer compiled from Open Brain. Its purpose is to give Claude pre-built session context so the next instance arrives already knowing what's in flight, what was just decided, what's blocking, and what partnership context applies — instead of reconstructing all of it from raw thoughts each session. Secondary purpose: serve as cross-tool context for AI tools that don't share Open Brain access (Gemini, NotebookLM, Codex).

**The Memory Index is NOT:**
- A replacement for Open Brain (Open Brain is the source of truth; the Index is a derived view)
- A replacement for L1 documents (Standing Rules, SOP, Memory System Map remain authoritative for how the system operates)
- A chronological dump or essay — it is a briefing document

---

## 2. Page Types

### 2.1 Project Pages

**Trigger for creation (pilot):** Any project referenced in at least one SESSION CLOSE capture in the corpus. Single-capture projects still get a page — pilot deliberately errs toward over-compiling to learn actual page volume.

*Post-pilot revision candidate: add a capture-count or recency threshold if page volume turns out unmanageable.*

**Required sections:**
- **Current State** — phase, last verified milestone, in-flight work
- **Active Blockers** — open items + dependencies
- **Recent Decisions** — last 5 DECISION captures with date + one-line reasoning
- **Next Actions** — current ACTIVE TASK summary
- **Parked / Deferred** — what's intentionally not being worked on and why
- **Connected Pages** — links to Person, Decision, Rule, Architectural Concept pages
- **Source Captures** — bullet list of capture timestamps + types contributing to this page

**Example structure:**

```markdown
# Sparkle Suite

**Last Compiled:** [timestamp] | **Source captures:** [count]

## Current State
Phase 1 in progress (1/11 tasks complete). Task 1.0 spike COMPLETE April 20.
Active: Task 1.1 (Thumper API route) — Claude Design mockups APPROVED April 22, Code prompt pending.

## Active Blockers
- [[Memory Index Pilot]] (open_item cc1fdd52) — must complete before Thumper rep memory architecture finalizes
- [[Thumper Long-Session Architecture]] (open_item e24f387c) — blocking Phase 1
[...]

## Recent Decisions
- April 22: [[Two-tier Thumper knowledge architecture]] (one Supabase DB, RLS by rep_id, shared SS tier + rep tier)
- April 22: [[Wiki compiler pilot before SS implementation]]
[...]

## Connected Pages
[[Thumper]] | [[Phase 1 Build Plan]] | [[Brittany]] | [[Kara]] | [[Bri]] | [[Heather]] | [[Lindsey]] | [[Rule 17]] | [[Rule 22]]

## Source Captures
- 2026-04-22 SESSION CLOSE — Wiki Compiler / Thumper Memory Architecture
- 2026-04-22 DECISION — Two-tier knowledge architecture
[...]
```

### 2.2 Person Pages

**Trigger for creation:** Any person with 3+ captures referencing them, OR any client/family member regardless of capture count.

**Required sections:**
- **Relationship to NR** — role (family / client / collaborator / contact)
- **Active Engagements** — current projects/work involving them
- **Recent Interactions** — last 3-5 captures involving this person, dated
- **Open Commitments** — anything outstanding (invoices, deliverables, decisions awaiting them)
- **Communication / Style Notes** — only if explicitly captured (e.g., Lindsey provides feedback channel for SS pain points)
- **Connected Pages** — projects, decisions, related people

**Special handling for family members (March, Lindsey, Priscilla, Desie):**
- Mark relationship clearly at top (wife, sister, mother-in-law, father-in-law)
- Personal life context EXCLUDED unless directly relevant to NR work (per CLAUDE ABOUT LOUIS partnership boundaries — life context is for calibration, not surfacing)
- March is referenced in VAC context (her MS diagnosis is calibration context for VAC priority); does not get surfaced inappropriately on other pages

### 2.3 Decision Pages

**Trigger for creation (pilot):** Every DECISION — capture in the corpus gets its own page. Pilot deliberately over-compiles to learn which decisions actually get consulted.

*Post-pilot revision candidate: add filters for single-session/never-revisited decisions if page volume is unmanageable.*

**Required sections:**
- **The Decision** — current locked state, one paragraph
- **When Locked** — date + session context
- **Reasoning** — why this over alternatives (preserve the "why")
- **Rejected Alternatives** — what was considered and why rejected (load-bearing — prevents re-litigating)
- **Evolution** — chronological chain if decision has been revised (newer ON TOP, older preserved BELOW with timestamps)
- **What This Connects To** — projects affected, rules invoked, people who decided
- **Source Captures** — capture IDs/timestamps

### 2.4 Rule Pages

**Trigger for creation:** Every Standing Rule gets its own page. (Not driven by capture count — driven by the L1 Standing Rules file.)

**Required sections:**
- **Rule Statement** — current text from L1 Standing Rules file
- **Trigger Moment** — what mistake/insight created this rule (from "Triggered by:" line in rule)
- **Reinforcing Captures** — CLAUDE LESSON / CLAUDE PATTERN / CLAUDE DRIFT captures that confirm the rule
- **Revision History** — RULE REVISION captures + applied bumps, chronological
- **Connected Rules** — cross-references from "Connects to:" lines
- **Recent Violations / Drift** — captures within the last ~30 days flagging this rule

**Special handling:** When a CLAUDE LESSON captures a violation of this rule that hasn't been revised yet, FLAG IT in the "Recent Violations / Drift" section — this is exactly the kind of contradiction the editorial policy preserves.

### 2.5 Architectural Concept Pages

**Trigger for creation:** Named architectural components — Open Brain, Memory Index, Neon Recall, Thumper, Guardian Agents, Enforcer Agents, Build Tracker, Open Items, the 7-Layer Architecture, NR HQ MCP, etc.

**Required sections:**
- **What It Is** — one paragraph, current locked definition
- **Why It Exists** — the problem it solves
- **Key Decisions** — links to Decision pages affecting it
- **Connected Concepts** — adjacent architecture (e.g., Memory Index ↔ Open Brain, Thumper ↔ Neon Recall)
- **Status** — built / in-progress / planned / deferred
- **Source Captures**

### 2.6 Open Question Pages

**Trigger for creation:** Recurring questions that surface across multiple sessions without resolution. Single-session questions stay in raw captures or the open_items table — Open Question pages are for things that keep coming up.

**Required sections:**
- **The Question** — clearly stated
- **Why It Matters** — what depends on the answer
- **Current Working Theories** — options being considered, with pros/cons
- **What's Known / What's Not** — concrete vs unresolved
- **Linked Captures** — every capture that touches this question
- **Status** — open / leaning toward X / blocked on Y

### 2.7 Index / Map Page

**Trigger for creation:** Always exists. Single page. Regenerated on every compile (always the LAST pass — see Section 0.1).

**Required sections:**
- **Active Projects** — list with status one-liners and links
- **Current Action Cards** — previous / current / next per active project
- **Recent Decisions** — last 10 across all projects
- **Open Items** — count by category, links to high-priority items
- **Active Standing Rules** — count, link to most recently revised
- **Recent Partnership Updates** — last 3 CLAUDE ABOUT LOUIS captures
- **Most Recent Compile** — timestamp, source capture count

This is the page Claude reads FIRST at session open before drilling into specific Project or Concept pages.

### 2.7.1 Index Page Read Path — Open Integration Question

The Index/Map page is designed as "read first at session open." The current SOP v1.13 session-open protocol has 6 pulls + triage, none of which reference the Memory Index.

**This is an open integration question, not a schema question.** It will be resolved when the compiler is proven working, because the integration has to specify HOW the Index page is surfaced — read by Chat via a new pull, pre-loaded as a reference file, served by an MCP tool, etc. — which forces the sequencing call.

For now: the Editorial Policy specifies WHAT the Index page contains. The SOP v1.14 bump (future) integrates both.

---

## 3. Cross-Referencing Rules

### 3.1 When to create a link

Use `[[double bracket]]` wiki link format whenever a page references another concept that has (or should have) its own page. Specifically:

- Project pages link to all involved Person, Decision, Rule, and Concept pages
- Person pages link to Project pages they're involved in
- Decision pages link to Project pages affected and Rule pages invoked
- Rule pages link to other Rules in their "Connects to" chain
- Concept pages link to adjacent Concepts and Decisions

### 3.2 When to update an existing page

- New SESSION CLOSE capture mentioning a Project → update Project page's Current State, Recent Decisions, Source Captures
- New DECISION capture → update affected Project page Recent Decisions; update or create Decision page
- New CLAUDE LESSON capture → update affected Rule page's Recent Violations / Drift section
- New CLAUDE ABOUT LOUIS capture → if it supersedes a prior partnership capture, mark older one HISTORICAL on the partnership-context section of relevant pages
- New MILESTONE capture → update Project page Current State; consider promoting decision-of-the-day to Decision page

### 3.3 Concepts that span multiple topics

When a capture touches multiple projects or concepts, EACH affected page gets updated. Do not pick one "primary" home. Memory Index pages can and should reference the same source capture from multiple angles.

---

## 4. Contradiction Handling Protocol

**This is the most important section. Read it twice.**

### 4.1 General principle

Contradictions are SIGNAL, not noise. The Memory Index's job is to surface them, not resolve them.

### 4.2 Three contradiction types and how to handle each

**Type A: Decision evolution (newer DECISION supersedes older)**
- The newer DECISION wins for "Current State" sections
- The older DECISION is preserved in the Decision page's "Evolution" section with timestamps
- Both decisions remain visible — never delete the older one
- Format:

```markdown
## Evolution

**Current (April 22, 2026):** Wiki compiler pilot must run on real production architecture (Supabase table, not files).

**Previous (April 22, 2026 earlier):** Pilot writes to markdown files for easy diffing.

**Why changed:** Louis's "train as you fight" principle — pilot must match production shape.
```

**Type B: Rule vs Lesson contradiction (active drift signal)**
- A CLAUDE LESSON or CLAUDE DRIFT capture conflicting with a Standing Rule = LIVE drift
- Surface in BOTH the Rule page (Recent Violations / Drift section) AND the Project page where it occurred
- Use ⚠️ marker
- Do NOT auto-resolve. Flag as "Potential Rule Revision pending — see capture [ID]"
- Example:

```markdown
## Recent Violations / Drift

⚠️ **April 22, 2026** — Three same-day Rule 23 violations during VAC dashboard session. CLAUDE LESSON captures suggest Chat is failing to filter Code's Louis-asks. RULE REVISION CANDIDATE captured but not yet applied. See: [capture timestamps].
```

**Type C: Partnership capture supersession**
- Newer CLAUDE ABOUT LOUIS captures can SUPERSEDE older ones explicitly (multiple recent examples — fatigue/time-of-day correction April 22 superseded April 19 captures)
- Mark the older capture HISTORICAL — do not silently merge or delete
- Format:

```markdown
## Partnership Context

**Current (April 22, 2026):** Do NOT comment on fatigue, time of day, or "freshness" — Louis decides when he's tired.

**HISTORICAL (April 19, 2026, superseded):** Default to tighter snapshot format on Tue/Wed/Thu evenings. — Superseded by April 22 capture; Louis explicitly corrected this pattern.
```

### 4.3 When to create a dedicated Contradiction / Open Question page

If a contradiction:
- Spans 3+ captures over 2+ weeks without resolution
- Involves competing valid frameworks (not just newer-wins evolution)
- Appears repeatedly in different contexts

→ Promote to an Open Question page. Single-instance contradictions stay inline with ⚠️ flags on affected pages.

---

## 5. Editorial Standards

### 5.1 What to include

- Decisions and their reasoning
- Verified milestones (Rule 18 — Louis personally verified)
- Active blockers and dependencies
- Engineering and partnership lessons that have demonstrable behavioral implications
- Cross-project dependencies
- Open commitments to people (clients, family in client-context)

### 5.2 What to exclude

- Single-session ideation that didn't lead to a decision
- Mid-session course corrections that resolved within the same session
- Routine session-open / session-close mechanics (those live in Open Brain only)
- Personal life context unless explicitly relevant to NR work
- Emotional snapshots ("Louis seemed frustrated today") — only durable patterns, never moments
- Anything in raw `CLAUDE ABOUT LOUIS` captures that fails the "would Louis read this and find it accurate and useful, or feel profiled" test

### 5.3 Uncertainty handling

- If a source capture is qualified, speculative, or marked with hedging language ("might," "probably," "considering"), the Memory Index page must reflect that qualification — not smooth into confident prose
- Inferred connections must be labeled "INFERRED" — not stated as fact
- If the synthesizer is uncertain how to categorize something, it leaves the raw capture quoted with a "PENDING CATEGORIZATION" note rather than guessing

### 5.4 Attribution requirements

- Every claim on a Memory Index page must trace to one or more source captures
- Source Captures section at the bottom of every page lists capture timestamps + types
- Direct quotes from captures must use blockquote format with attribution
- Standing Rules referenced by number AND linked to the Rule page

### 5.5 Quote vs summarize

**Quote directly when:**
- Louis's exact wording captures something paraphrasing would lose (decisions, principles, corrections)
- A CLAUDE LESSON or DRIFT capture has scar-tissue language worth preserving exactly
- A rule is being directly cited

**Summarize when:**
- Multiple captures say the same thing — synthesize into one paragraph with attribution
- A SESSION CLOSE recaps work that's better described in the present tense

### 5.6 Tone and voice

- Briefing-document register, not essay or chat
- Short paragraphs, scannable structure
- No filler ("It's important to note that..." / "As we can see...")
- Bullet lists for enumerated items, prose for synthesis
- Present tense for current state, past tense for completed work, future/conditional for planned

---

## 6. Maintenance Rules

### 6.1 Revise vs add

- **Revise an existing page** when new captures update Current State, add Recent Decisions, or change Active Blockers
- **Add a new page** when a topic crosses the trigger threshold for a page type (3+ captures for Person, every project for Project, every DECISION for Decision during pilot, etc.)
- **Never delete a page** — even superseded concepts get marked HISTORICAL and stay accessible

### 6.2 Staleness handling

- Every page header shows "Last Compiled: [timestamp]"
- If a page hasn't been touched by a new capture in 14+ days, mark "POTENTIALLY STALE" at the top
- If a Project page has had no new SESSION CLOSE captures in 30+ days, mark "PARKED" and move to a Parked Projects index

### 6.3 Superseded information

- Never delete superseded content — mark HISTORICAL with timestamp and reason
- Move HISTORICAL content below current content on the page
- For decisions that have been reversed multiple times, preserve the full chain (this is exactly the kind of context that prevents re-litigating settled questions)

### 6.4 Index page regeneration

- Index page rebuilt on EVERY compile — always the LAST pass (Section 0.1)
- Always reflects the current state of all other pages

### 6.5 Compile Scope (pilot)

The compiler runs a **full rebuild** on every session close. All pages regenerated from the **full tagged corpus** — every tagged capture in the `thoughts` table, no calendar window, no recency filter.

**Per-page-type pass architecture (Section 0.1)** makes full-corpus compilation viable by splitting the work into N bounded calls, each producing one page type from a relevance-filtered slice of the corpus.

**Rationale:**
- Nate's architecture: "the database is always authoritative. The wiki is generated from it. If the wiki has an error, you fix the source data and regenerate."
- Full rebuild prevents drift — every page is re-derived from source every time
- Per-page-type splitting keeps each API call within model context and output limits
- `last_capture_seen_at` and `last_compiled_at` columns exist on `memory_index_pages` so incremental can be added later without schema change

**Revisit condition:** If pilot observes that the full corpus for a single page-type pass exceeds Sonnet's context ceiling (~200K tokens), subdivide that page type (e.g., split `project` into per-project calls). Not before.

---

## 7. Source Handling

- **Open Brain (raw `thoughts` table) is the source of truth.** Memory Index pages are derived. If they conflict, Open Brain wins; the Memory Index page is regenerated.
- **Memory Index pages are never edited directly by humans or other Claude sessions.** Only the compiler writes to Memory Index. If a Memory Index page has an error, the fix is to correct the underlying captures and recompile.
- **Every Memory Index page traces back to specific Open Brain captures via the Source Captures section.** No claim without attribution.
- **L1 documents (SOP, Standing Rules, Memory System Map) are above the Memory Index in authority.** The Memory Index can REFERENCE them and create Rule pages for individual Standing Rules, but it does not REPLACE or RESTATE them.

### 7.1 Existing Pages Read Rule (LOCKED — CEO call April 23, 2026)

The compiler reads **metadata only** from existing `memory_index_pages`: slug, title, page_type, last_compiled_at, last_capture_seen_at, status, connected_page_slugs, source_capture_ids.

The compiler **NEVER reads `body_markdown`** from prior compiles.

**Why:** Feeding prior compiled output back as input creates a hallucination-laundering feedback loop. A single bad synthesis becomes corroborating evidence for the next compile, entrenching the mistake. Nate's article explicitly warns: "editorial decisions in wiki synthesis can bake errors into your understanding." Full rebuild from source captures every time prevents this.

**What is NOT lost:** Open Brain raw captures contain all scar tissue, decision evolution, corrections, and learned history permanently. The compiler re-derives HISTORICAL blocks, Evolution chains, and ⚠️ drift flags FROM those raw captures every compile. Nothing functional is lost by not reading prior body_markdown.

---

## 8. Storage Structure

Memory Index lives in Supabase (decided April 22, 2026 — Louis's "train as you fight" principle: pilot writes to the same surface the production system will use).

**Table:** `memory_index_pages` (replaces the prior `wiki_pages` placeholder name to align with locked vocabulary)

**Column shape (LOCKED at v1.1 — compiler reads live schema, does not redesign):**

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid (pk) | Page identity |
| `page_type` | enum | project, person, decision, rule, concept, open_question, index |
| `slug` | text (unique) | URL-safe identifier (e.g., `sparkle_suite`, `louis`, `rule_23`) |
| `title` | text | Display title |
| `body_markdown` | text | The page content |
| `source_capture_ids` | uuid[] | References to thoughts.id |
| `last_compiled_at` | timestamptz | When this page was last regenerated |
| `last_capture_seen_at` | timestamptz | Newest capture this page reflects |
| `status` | enum | current, potentially_stale, parked, historical |
| `connected_page_slugs` | text[] | Fast cross-reference lookup |
| `created_at`, `updated_at` | timestamptz | Standard audit fields |

---

## 9. Domain-Specific Editorial Caution

Three areas need extra-conservative handling:

**Standing Rules:** These are scar tissue. Never smooth over a contradiction between a rule and a recent CLAUDE LESSON — the contradictions are often what's about to drive the next rule revision (Rule 30). Surface contradictions on the Rule page with ⚠️ markers.

**Partnership captures (CLAUDE ABOUT LOUIS):** Multiple existing examples of Louis correcting prior partnership captures (e.g., April 22 fatigue/time-of-day correction). When superseding occurs, preserve historical chain. Never silently merge. Apply the "would Louis read this and find it useful, or feel profiled" test before including any partnership content on a Person or Project page.

**Engineering decisions in flux:** When a DECISION exists but a more recent CLAUDE LESSON or RULE REVISION suggests it needs revisiting, FLAG IT — don't auto-resolve. The Memory Index surfaces tension; Louis resolves it.

---

## Version History

- **v1.2 — April 23, 2026:** Realigned to Nate B. Jones's hybrid architecture. Removed all calendar windowing (3-day window was a deviation from source design). Added Section 0.1 per-page-type compilation pass architecture. Added Section 7.1 existing pages metadata-only read rule (CEO call locked April 23). Updated Section 6.5 compile scope to full corpus with per-page-type splitting. Trigger changed from every-session-close to once-daily manual for 3-day cost pilot. Migration 025 trigger attachment deferred until cost data in hand. All references to MEMORY_INDEX_COMPILE_WINDOW_DAYS removed.
- **v1.1 — April 23, 2026:** Compiler architecture explicitly declared as fresh-context agent (Section 0). Trigger locked to every session close. Pilot page-creation thresholds opened up. Column shape locked in Section 8. Compile scope locked as full rebuild for pilot. Five Bucket 1 engineering calls folded in.
- **v1.0 — April 22, 2026:** Initial schema for Memory Index pilot. Produced via Schema Designer (Nate's OB1 prompt kit), pre-filled by Claude from Open Brain + Standing Rules v3.16 + SOP v1.12 + Memory System Map v1.1, reviewed by Louis. PILOT status.

---

*This file is the editorial policy that governs how the Memory Index compiler synthesizes pages from Open Brain. When the compiler runs (at every session close, fresh-context agent, per-page-type passes), it reads this file as standing instructions. When this file changes, the compiler's behavior changes on the next run. Keep it locked between revisions; bump the version when revising.*
