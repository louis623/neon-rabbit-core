# Neon Rabbit — Memory Index Editorial Policy

📍 **WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
🔍 **HOW CLAUDE ACCESSES IT:** Loaded by the Memory Index compiler at every run. Available to chat sessions on demand via Drive connector.
📁 **UPLOAD TO PROJECT:** No — compiler-facing standing instructions, not chat-facing
🏷 **PROJECT:** Neon Rabbit (all projects)
👤 **WHO USES IT:** The Memory Index compiler (Claude Code), Claude (reference)
🔄 **UPDATE TRIGGER:** New page type added, source authority hierarchy changes, Standing Rule changes affecting capture taxonomy, contradiction protocol revision, post-pilot findings (April 29, 2026 review point)

**Version:** 1.0 | **Created:** April 22, 2026 | **Status:** PILOT

---

## v1.0 Notes (April 22, 2026)

Initial draft — schema for the Memory Index pilot run on the existing Neon Rabbit Open Brain corpus. Schema produced via Schema Designer prompt (Nate's OB1 prompt kit) with answers pre-filled by Claude from existing Open Brain captures, Standing Rules v3.16, SOP v1.12, and Memory System Map v1.1 — Louis review and corrections applied.

This schema governs the FIRST MEMORY INDEX BUILD. Expect revisions after one week of pilot use (per cc1fdd52 — Memory Index pilot open item). Pilot findings drive v1.1.

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
**Trigger for creation:** Any project with 5+ supporting captures across SESSION CLOSE / DECISION / MILESTONE / ACTIVE TASK namespaces.

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
**Trigger for creation:** Any DECISION — capture that has either:
- (a) been revised at least once
- (b) been referenced by 3+ subsequent captures
- (c) involved multi-session deliberation

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
**Trigger for creation:** Always exists. Single page. Regenerated on every compile.

**Required sections:**
- **Active Projects** — list with status one-liners and links
- **Current Action Cards** — previous / current / next per active project
- **Recent Decisions** — last 10 across all projects
- **Open Items** — count by category, links to high-priority items
- **Active Standing Rules** — count, link to most recently revised
- **Recent Partnership Updates** — last 3 CLAUDE ABOUT LOUIS captures
- **Most Recent Compile** — timestamp, source capture range

This is the page Claude reads FIRST at session open before drilling into specific Project or Concept pages.

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
- **Add a new page** when a topic crosses the trigger threshold for a page type (3+ captures for Person, 5+ for Project, etc.)
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
- Index page rebuilt on EVERY compile — never edited incrementally
- Always reflects the current state of all other pages

---

## 7. Source Handling

- **Open Brain (raw `thoughts` table) is the source of truth.** Memory Index pages are derived. If they conflict, Open Brain wins; the Memory Index page is regenerated.
- **Memory Index pages are never edited directly by humans or other Claude sessions.** Only the compiler writes to Memory Index. If a Memory Index page has an error, the fix is to correct the underlying captures and recompile.
- **Every Memory Index page traces back to specific Open Brain captures via the Source Captures section.** No claim without attribution.
- **L1 documents (SOP, Standing Rules, Memory System Map) are above the Memory Index in authority.** The Memory Index can REFERENCE them and create Rule pages for individual Standing Rules, but it does not REPLACE or RESTATE them.

---

## 8. Storage Structure

Memory Index lives in Supabase (decided April 22, 2026 — Louis's "train as you fight" principle: pilot writes to the same surface the production system will use).

**Table:** `memory_index_pages` (replaces the prior `wiki_pages` placeholder name to align with locked vocabulary)

**Suggested columns (final shape locks during Code prompt session):**

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

Table creation is a Category 2 change per Rule 32 (new table in `neon-rabbit-core`, reversible, but affects DB shape) — Louis confirms before migration ships.

---

## 9. Domain-Specific Editorial Caution

Three areas need extra-conservative handling:

**Standing Rules:** These are scar tissue. Never smooth over a contradiction between a rule and a recent CLAUDE LESSON — the contradictions are often what's about to drive the next rule revision (Rule 30). Surface contradictions on the Rule page with ⚠️ markers.

**Partnership captures (CLAUDE ABOUT LOUIS):** Multiple existing examples of Louis correcting prior partnership captures (e.g., April 22 fatigue/time-of-day correction). When superseding occurs, preserve historical chain. Never silently merge. Apply the "would Louis read this and find it useful, or feel profiled" test before including any partnership content on a Person or Project page.

**Engineering decisions in flux:** When a DECISION exists but a more recent CLAUDE LESSON or RULE REVISION suggests it needs revisiting, FLAG IT — don't auto-resolve. The Memory Index surfaces tension; Louis resolves it.

---

## Version History

- **v1.0 — April 22, 2026:** Initial schema for Memory Index pilot. Produced via Schema Designer (Nate's OB1 prompt kit), pre-filled by Claude from Open Brain + Standing Rules v3.16 + SOP v1.12 + Memory System Map v1.1, reviewed by Louis. PILOT status — expect v1.1 after one week of pilot use (post April 29, 2026).

---

*This file is the editorial policy that governs how the Memory Index compiler synthesizes pages from Open Brain. When the compiler runs, it reads this file as standing instructions. When this file changes, the compiler's behavior changes on the next run. Keep it locked between revisions; bump the version when revising.*
