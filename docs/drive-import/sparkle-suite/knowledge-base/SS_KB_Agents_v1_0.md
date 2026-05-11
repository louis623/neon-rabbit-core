# Sparkle Suite — KB Module: Agentic Architecture

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context), Claude Code (agent build specs)
🔄 UPDATE TRIGGER: Any decision about agent design, memory model, tool definitions, or onboarding pipeline architecture

**Version:** 1.0 | **Created:** April 9, 2026
**Status:** DESIGN PHILOSOPHY LOCKED — Agent architecture, memory model, and pipeline roles decided. Detailed agent specs (system prompts, tool definitions, guardrails) require dedicated Opus design sessions before build.

**COMPANION MODULES:**
- SS_KB_Core_v1.8.md — Platform architecture, Thumper spec, business model
- SS_KB_OpenItems_v1.8.md — Open gaps, parking lot
- SS_Master_Build_Plan_v1.1.md — Build phases, timeline, dependencies

---

## Design Philosophy — Agents Over Automations

**Default rule:** Use agents for anything that produces variable output or could fail in unpredictable ways. Reserve automations ONLY for truly binary operations.

**Why agents over automations:**
- Automations are dumb pipes — one broken node brings the whole chain down. Louis has direct experience with this fragility.
- An agent knows the goal and can self-correct. An automation just passes data from step to step blindly.
- A "sophisticated automation" with 15+ chained steps, error handling at every junction, retry logic per node, and fallback paths is the COMPLEX solution. An agent with one goal, guardrails, and three-tier error handling is the SIMPLER solution. KISS favors agents.
- Louis's time is the most expensive resource. Every hour debugging broken automations is an hour not spent on revenue-generating work. Agents protect that time.
- For onboarding tasks that run once per new client, API token cost is negligible compared to debugging time saved.

**When automations ARE appropriate:**
- Truly binary operations (payment yes/no, email sent/not sent)
- Zero variability in output
- No reasoning or judgment involved
- Failure modes are simple and predictable

**Realistic expectation:** Agents handle ~85–90% of situations cleanly. The remaining 10–15% escalates to Louis, but as judgment calls ("which hero image fits better?") not plumbing debugging ("which webhook timed out?"). Agents need a breaking-in period — Louis watches, catches mistakes, tightens prompts. After that, trust is earned and they run with less supervision.

---

## Three-Layer Agent Memory Model

All Sparkle Suite agents are designed with three distinct memory layers from day one, even if some layers start empty.

### Layer 1 — System Prompt (Permanent Instructions)

The agent's job description. Defines who it is, what it does, what tools it has, what its guardrails are. Only changes when we deliberately update it.

Example: "You are the Builder agent. Your job is to assemble rep sites from structured branding data. You have access to these tools: [list]. You must check your own output before declaring success. If you can't fix a problem after two attempts, escalate to Louis with a clear error report."

### Layer 2 — Run Context (Per-Run Data)

The specific data for this execution. Loaded fresh each run. Discarded after the run completes.

Example: "This rep is Kara Weeks. Business name: Sprinkled in Diamonds. Brand colors: teal and gold. Streaming platform: TikTok. Team name: Fizz City. Template choice: Template 3. Hero image: assigned. Join Team page: active."

### Layer 3 — Operational Memory (Lessons Learned — Grows Over Time)

What the agent learned from its own previous runs. This is the plastic memory layer — gets BETTER with each execution. The agent queries its own history before each run and applies accumulated lessons.

Example: "Louis prefers bios written in third person. Dark hero images work better with the glassmorphism overlay. Reps with teams always want the Join Team page visible from day one. The TikTok embed sometimes fails to loop — always verify loop behavior after embedding."

---

## How Agent Memory Connects to Existing Infrastructure

Neon Rabbit already has a multi-layer memory system. Agents plug into it — they don't need a separate one.

| Layer | What It Provides to Agents | Source |
|-------|---------------------------|--------|
| Layer 3 — Open Brain | Company context: decisions, session history, business rules | Supabase (neon-rabbit-core) via MCP or direct query |
| Layer 4 — GitHub Vault | Job description context: project state, client data, stack info, structured specs | /vault in sparkle-suite repo (7 Markdown files) |
| NEW — agent_runs table | Personal experience: what the agent did, what broke, what it learned, what Louis flagged | Supabase (neon-rabbit-core) — new table |

### agent_runs Table Schema (Concept)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agent_name | text | Scout / Scribe / Builder / Wordsmith |
| run_timestamp | timestamptz | When the run started |
| client_id | uuid (FK) | Which rep this run was for (nullable — some runs aren't client-specific) |
| input_summary | text | What the agent was given to work with |
| output_summary | text | What the agent produced |
| self_corrections | text[] | Array of issues the agent caught and fixed itself |
| escalations | text[] | Array of issues the agent couldn't fix and escalated |
| louis_feedback | text | What Louis flagged during QA review (populated after Louis reviews) |
| lessons_extracted | text[] | Plain text lessons derived from this run — pulled into next run's context |
| status | text | completed / escalated / failed |
| created_at | timestamptz | Row creation timestamp |

**How it works:** Each run writes a row. Before the next run, the agent queries: "Give me my last 10 lessons_extracted." Those lessons get injected into the system prompt alongside the permanent instructions and run context. Run 50 is smarter than run 1 without any model retraining.

---

## Agent Roster — Onboarding Pipeline

### 1. Scout (Pre-Meeting Intel)

**Type:** 🤖 Agent (requires reasoning across unstructured data)

**Job:** Research a prospective rep before Louis's discovery call. Produce an intel brief.

**Inputs:** Rep's name, social media handles, any info captured from intake form.

**Outputs:** Intel brief document containing: streaming history (platforms, frequency, audience size), team size and structure, content style/personality, brand aesthetic from existing social presence, potential red flags (phone-only setup, very small audience, inconsistent streaming).

**Why it's an agent, not an automation:** Requires searching across multiple platforms, making judgments about what's relevant, and synthesizing findings into a useful narrative. No deterministic pipeline can do this.

**Memory needs:** Over time, Scout learns what Louis actually finds useful in intel briefs and stops including noise.

**Error handling:** If a social platform is inaccessible or the rep has minimal online presence, Scout notes what it couldn't find rather than failing silently.

---

### 2. Scribe (Post-Meeting Processing)

**Type:** 🤖 Agent (requires interpretation of unstructured conversation)

**Job:** Turn a raw meeting transcript into a structured rep profile and branding spec.

**Inputs:** Gemini transcript of the discovery call.

**Outputs:** Structured rep profile containing: business name, brand vibe/aesthetic, color preferences, streaming platforms + schedule, team info (name, size, members), personal story highlights for About page, hero image direction, any special requests or concerns Louis noted.

**Why it's an agent, not an automation:** Unstructured conversation → structured data requires interpretation. Louis doesn't speak in form fields — he has a natural conversation, and the agent needs to extract the relevant pieces.

**Memory needs:** Learns which transcript cues map to which profile fields. Learns Louis's conversational patterns (e.g., "she seems like a teal and gold kind of person" → brand colors: teal and gold).

**Error handling:** If transcript is unclear on a field, Scribe flags it as "needs confirmation" rather than guessing.

---

### 3. Builder (Site Assembly + Self-QA)

**Type:** 🤖 Agent (requires self-evaluation and error recovery)

**Job:** Assemble a complete rep site from structured branding data. Verify its own output. Fix problems. Escalate only what it can't resolve.

**Inputs:** Structured rep profile (from Scribe), template choice, hero images, copy (from Wordsmith).

**Outputs:** A working 4-page rep site deployed on the rep's custom domain within the yoursparklesuite.com deployment.

**Build steps:**
1. Create rep profile in Supabase
2. Populate all template variables from profile data
3. Assign hero images to all 4 pages
4. Inject copy into all customizable sections
5. Configure custom domain routing
6. Set up Thumper instance with rep-specific context
7. Configure announcement banner and ticker (default state)
8. Generate QR code from domain
9. **Self-QA pass:** Verify all 4 pages render, all links work, all template variables populated, domain resolves, TikTok embed loops, hero animations work, footer disclaimers display, streaming buttons link correctly
10. Log results to agent_runs table

**Why it's an agent, not an automation:** The self-QA step is the critical difference. An automation would blindly execute steps 1–8 and declare success. The Builder agent checks its own work and can catch and fix issues before Louis ever sees them.

**Memory needs:** Learns which steps fail most often, which template/image combinations cause rendering issues, which QA checks Louis flags most. Over time, prevention improves and QA catches increase.

**Error handling (three-tier — same pattern as Thumper):**
1. Retry — temporary failure (API timeout, transient error). Try again.
2. Self-diagnose and fix — output doesn't look right (missing hero image, broken link). Attempt correction.
3. Escalate — can't fix after two attempts. Auto-generate ticket to Louis via NR HQ with: what failed, what was attempted, where the build stopped, what needs manual intervention.

**Overnight candidate:** This is the primary candidate for autonomous overnight runs. With self-QA and three-tier error handling, it can run while Louis sleeps. Louis does a confirmation review in the morning — checking vibe and polish, not every link.

---

### 4. Wordsmith (Creative Copy)

**Type:** 🤖 Agent (requires creative reasoning)

**Job:** Write all personalized copy for a rep's site based on branding interview data.

**Inputs:** Structured rep profile (from Scribe), branding preferences, personal story notes.

**Outputs:** Complete copy package: homepage tagline, hero overlay text, About page three bio cards (origin story, personal life, business experience), Join Team FAQ personalized answers (if applicable), any custom section text.

**Why it's an agent, not an automation:** Creative writing from structured data is not a template fill — it requires voice matching, personality capture, and brand-appropriate language. NR writes all initial copy as part of the service.

**Memory needs:** Learns Louis's preferred copy style, which taglines get approved vs. revised, which bio structures land best. Louis's QA feedback on copy directly feeds the next run.

**Error handling:** If branding data is insufficient for a section (e.g., rep didn't share personal story details), Wordsmith flags the section as "needs more info from rep" rather than generating generic filler.

---

## Automations (Binary Operations Only)

These are NOT agents. They are simple event-driven triggers with no reasoning required.

| Automation | Trigger | Action | Failure Mode |
|-----------|---------|--------|--------------|
| SignWell agreement delivery | Gate 1 initiated | Send agreement to rep via SignWell API | If delivery fails, retry 3x then alert Louis |
| Stripe payment webhooks | Payment confirmed | Update Supabase (subscription status, gate cleared, wallet loaded) | Stripe handles retries natively; webhook failure → Stripe dashboard shows failed events |
| Photography kit order | Gate 2 cleared | Trigger Amazon order (or fulfillment vendor) for DUCLUS lightbox | If order fails, alert Louis — manual fallback |
| QR code generation | Site build complete | Generate QR code from rep's custom domain URL | Trivial — if it fails, retry. No variability. |
| Pre-show SMS reminder | Calendar event approaching | Send automated SMS to subscriber list via Telnyx at configured time | If Telnyx send fails, retry. If wallet empty, Thumper alerts rep. |
| BP change notification | BP Intelligence detects change | Push site updates to all rep sites + send notification email to all reps | If push fails for a specific rep, log and retry. Never silently skip. |

---

## Agent Infrastructure — Shared Plumbing

All four agents run through the same infrastructure Thumper uses. No separate agent frameworks needed.

**Execution layer:** Vercel AI SDK with tool-calling, running as Next.js API routes inside the yoursparklesuite.com deployment. Same plumbing as Thumper — different system prompts, different tools, different jobs.

**Model selection:**
- Scout: Sonnet 4.6 (research + synthesis)
- Scribe: Sonnet 4.6 (transcript interpretation)
- Builder: Sonnet 4.6 with Haiku 4.5 for simple subtasks (template population, QR generation)
- Wordsmith: Sonnet 4.6 (creative writing quality matters)

**Cost model:** These agents run once per new rep onboarding. At one new rep per week, total agent cost is negligible — a few dollars per onboarding across all four agents combined. Not a pricing concern.

**Security:** All agents operate under the same Supabase RLS policies as Thumper. Admin-level access for agent operations, scoped to the specific rep being onboarded.

---

## Client Lifecycle — Full Workflow (End to End)

### Phase 1 — Discovery (Passive)
- **Actor:** Rep + Thumper (landing page)
- Rep hears about SS through word of mouth
- Visits yoursparklesuite.com landing page
- Thumper answers questions, captures rep info (name, email, social handles, team size)
- If platform isn't ready: waitlist + automated email sequence keeps warm
- If platform is live: moves to intake

### Phase 2 — Pre-Meeting Intel (Scout Agent)
- **Actor:** Scout (autonomous)
- Triggered automatically when rep submits intake form
- Researches rep's streaming presence, team size, engagement across platforms
- Produces intel brief → stored in Supabase, surfaced to Louis before the call

### Phase 3 — Discovery Call (Louis)
- **Actor:** Louis (human)
- Google Meet discovery call with the rep
- Gemini transcribes automatically
- Louis covers: brand vibe, team situation, streaming setup (phone + laptop?), current pain points
- Not a sales call — product sold by word of mouth. This is a fit check and branding intake.
- Yellow flag: phone-only reps. Set expectations about two-device setup during this call.

### Phase 4 — Post-Meeting Processing (Scribe Agent)
- **Actor:** Scribe (autonomous)
- Takes Gemini transcript, extracts structured rep profile
- Populates: business name, brand preferences, team info, streaming platforms, personal story highlights
- Flags any missing/unclear fields as "needs confirmation"
- Prepares SignWell agreement and Stripe payment link

### Phase 5 — Agreement + Payment (Rep Action + Automations)
- **Actor:** Rep + Stripe/SignWell automations
- Rep receives and signs service agreement via SignWell
- Clickwrap captures IP, timestamp, document hash (audit trail) — Gate 1
- Rep pays start work fee via Stripe — Gate 2
- Both gates must clear. Parallel — order doesn't matter.
- Stripe webhook fires → Supabase updates → build trigger armed
- Start fee is "earned upon payment," non-refundable

### Phase 6 — Copy Generation (Wordsmith Agent)
- **Actor:** Wordsmith (autonomous)
- Takes structured rep profile from Scribe
- Writes all personalized copy: tagline, hero text, three About page bios, Join Team FAQ answers
- Flags sections with insufficient data as "needs more info"
- Output feeds into Builder

### Phase 7 — Site Build (Builder Agent)
- **Actor:** Builder (autonomous — primary overnight candidate)
- Takes rep profile + template choice + hero images + copy from Wordsmith
- Assembles all 4 pages, configures domain, sets up Thumper instance, generates QR code
- Self-QA pass: verifies pages render, links work, variables populate, domain resolves
- Three-tier error handling: retry → self-fix → escalate
- Logs everything to agent_runs table
- Photography kit order triggers (automation)

### Phase 8 — Louis QA Review (Louis)
- **Actor:** Louis (human)
- Reviews built site on phone and desktop
- Builder already caught technical issues — Louis checks vibe, polish, brand fit
- Small fixes via surgical Claude Code prompts
- As Builder's operational memory grows, this step gets faster — fewer issues to catch

### Phase 9 — Launch Gate (Rep Action + Automation)
- **Actor:** Rep + Stripe automation
- Rep receives launch fee invoice — Gate 3
- Rep pays → Stripe webhook fires → deployment unlocked
- Site goes live on custom domain
- Rep receives credentials, onboarding guide, Thumper introduction

### Phase 10 — Rep Onboarding (Thumper + Louis)
- **Actor:** Thumper (primary) + Louis (backup)
- Thumper walks rep through: dashboard, trade board, banner/ticker, calendar, Chrome extension install, show workflow (phone + laptop + Wispr Flow)
- Louis does a live onboarding call if needed — goal is Thumper handles 90%
- Rep's first show with SS features is the real test

### Phase 11 — Ongoing Operations (Thumper + Agents + Automations)
- **Actor:** Thumper (daily) + automated systems
- Rep manages everything through Thumper
- Pre-show SMS reminders fire automatically
- BP Intelligence catches changes → auto-push site updates → email reps
- Thumper error handling: retry → explain → auto-escalate ticket to Louis via NR HQ
- Subscription auto-renews; renewal reminders sent per legal requirements
- Louis monitors via NR HQ dashboard (Platform Health tab)

---

## Open Design Items (Phase 8 Pre-Build)

These require dedicated Opus design sessions before agents are built.

| Item | Type | Notes |
|------|------|-------|
| Scout system prompt | 🎯 CLAUDE CHAT (Opus) | Full prompt with scope, tools, output format, memory query pattern |
| Scribe system prompt | 🎯 CLAUDE CHAT (Opus) | Transcript parsing rules, field extraction, "needs confirmation" flagging |
| Builder system prompt | 🎯 CLAUDE CHAT (Opus) | Build steps, self-QA checklist, error handling rules, escalation format |
| Wordsmith system prompt | 🎯 CLAUDE CHAT (Opus) | Copy style guide, brand voice rules, section-by-section requirements |
| agent_runs table schema | Design session | Finalize columns, indexes, RLS policies |
| Agent tool definitions | Design session per agent | What tools each agent has access to (Supabase queries, API calls, file operations) |
| Gemini transcript hook | Research needed | How does the transcript get from Google Meet to Scribe? API? Manual upload? |
| Pre-meeting intel sources | Research needed | Which platforms can Scout programmatically access? TikTok API limitations? |
| Branding menu design | Design session | Menu of options rep selects from during onboarding — template choice, color direction |

---

*This document captures the agentic architecture philosophy, memory model, agent roster, and client lifecycle for Sparkle Suite. It is the reference for all agent design sessions in Phase 8 of the Master Build Plan. Update when agent specs are designed or when the philosophy evolves.*
