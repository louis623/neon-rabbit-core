# Neon Rabbit — Plugins, Skills & Standing Rules

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Pre-loaded every session via Claude Project
📁 UPLOAD TO PROJECT: Yes — needed every session
🏷 PROJECT: Neon Rabbit (all projects)
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any change to plugins, skills, standing rules, or project-to-tool mapping

**Version:** 3.8 | **Last Updated:** April 14, 2026 | **Principles:** KISS. Future-Forward. One-Man + AI.

---

## Standing Rules

These rules govern everything Neon Rabbit builds — every project, every session, every product.

**Rule 1 — Future-Forward Development**
Everything built must be designed for 2028 and beyond. No recreating 2010-era patterns. Modern design, modern architecture, AI-native features, progressive enhancement, accessibility-first, mobile-first, automation-heavy. Every product should showcase what's possible with AI-assisted development.

**Rule 2 — KISS Principle**
Keep it simple. One codebase per product. No unnecessary layers. No over-engineering. Plugins and skills must reduce complexity, not add it. If a tool doesn't directly improve output quality or save time, it doesn't get installed.

**Rule 3 — One-Man + AI Partnership**
Louis makes decisions, tests, and steers. Claude builds, researches, and deploys. The plugin/skill stack exists to make this partnership punch above its weight — producing products that look and feel like they came from a well-funded team.

**Rule 4 — Two-System Validation**
For any significant build: Claude builds, Codex validates. Prompt Codex adversarially: "What will break? What edge cases aren't handled? What assumptions is this code making?" New architecture gets reviewed. Iterations don't.

**Rule 5 — Max 5–7 Active Skills**
Don't install more than 5–7 skills at once. At 8–10+ skills, Claude degrades — more verbose, conflicting instructions, wasted context. Install SEO and specialized skills only when actively working on those tasks, not always-on.

**Rule 6 — Scope Lock**
No new projects beyond the current 8-project registry. New ideas go to the Ideas Backlog. This prevents scope creep from stealing time from income-generating work.

**Rule 7 — Small Bites Build Strategy**
One focused task per Claude Code session. Test and confirm it works before moving on. Never stack multiple unknowns in one session. This mirrors the gate strategy at the macro level — applied at the micro level within each gate. Monolithic build sessions produce messy, unreliable results. Focused single-task sessions land clean.

**Rule 8 — Research Prompt Format**
Every research prompt sent to an external AI tool (Gemini, NotebookLM, etc.) must include an instruction to output results as a clean Markdown document with proper headers, tables, and code blocks — formatted to save directly as a .md file without editing. Claude must append this instruction automatically when drafting any research prompt for Louis. This applies to ALL research across ALL projects.

**Rule 9 — Session Close File Generation**
Before closing any session, Claude must check if any SOPs, specs, or standing rules were changed by decisions made during the session. If yes, generate the updated versioned Markdown files DURING session close — do not defer. Session close is three parts: (1) Open Brain captures, (2) generate and present any affected document updates for download, (3) restart prompt for next session.

**Rule 10 — Context Length Monitoring**
Claude must proactively flag when a session reaches approximately 70–75% of practical context capacity. Recommend wrapping up so there's room for a proper session close. Better to close clean and start fresh than push through and lose quality or skip the close-out process.

**Rule 11 — Session Close Restart Prompt**
Every session close must end with a ready-to-paste prompt that Louis can use to start the next session. The prompt tells the next Claude instance what was in progress, what to pull from Open Brain, what files to expect, and what the next actions are. Claude writes this for itself — Claude knows how to talk to Claude better than Louis does.

**Rule 12 — Master Plan Incremental Updates**
Master plans must be updated incrementally as research is analyzed or decisions are made — never batched until a decision round or deferred to "next session." When a research piece is analyzed and produces new Open Decisions, new Research Gaps, new plan sections, or changes to existing sections, those updates go into the master plan THAT SESSION via a minor version bump (e.g., v1.2 → v1.3). The decision round at the end of a research sprint is for LOCKING decisions and resolving open items — not for first-time entry of information discovered sessions ago. The master plan is the single source of truth and must reflect current reality at all times. Open Brain carries detailed analysis; the master plan carries structured decisions, questions, and plan changes. Every session that analyzes research must generate an updated master plan file as part of session close.

**Rule 13 — Always Ask Before Moving On**
Before moving to the next topic or question in any Q&A or planning session, Claude must ask Louis if he is ready to move on. Louis may have follow-up thoughts, clarifications, or additions based on Claude's response. Never assume a topic is closed just because Claude has responded. This applies across ALL sessions and ALL projects.

**Rule 14 — Concise Communication**
Be concise. No filler. Get straight to the point. Be straightforward. Don't pad responses with unnecessary preamble, summaries of what was just said, or verbose explanations when a short answer will do. This applies to ALL sessions and ALL projects.

**Rule 15 — Never Declare Done Without Louis**
Claude must never declare a topic "locked," "fully locked," "done," or "resolved" on its own. Claude may ask "Want to move on?" or "Are you ready to move on?" but the decision to close a topic belongs to Louis. Do not rush transitions or assume a topic is finished just because Claude has responded. Wait for Louis to explicitly say he's ready. This applies across ALL sessions and ALL projects.

**Rule 16 — Claude Code Prompt Format**
Claude Code prompts are clean task descriptions only. No CLI flags, no `/ultraplan`, no `--dangerously-skip-permissions` baked into the prompt text. The prompt is just the task. At the bottom of every Claude Code prompt, Claude adds an EXECUTION section that tells Louis: (1) which mode to use — `/ultraplan` for Medium+ tasks, standard for Quick tasks, (2) whether to use `--dangerously-skip-permissions` (yes for overnight/autonomous runs, no for tasks involving dangerous or destructive operations), (3) the exact step-by-step launch sequence. Louis never guesses which flags to use — Claude specifies them per prompt based on the task. Every prompt begins with: "Work on main branch only at [project path] — do not create worktrees, new branches, or temporary directories unless Louis explicitly requests one." Every prompt ends with: regenerate CODEBASE_SNAPSHOT.md, commit/push, output to terminal.

**Supersedes:** Old Rule 16 (Ultraplan Workflow Session Blocker) — resolved in Session #22 on April 11, 2026. Ultraplan is now standard practice for Medium+ tasks.

**Rule 17 — No UI Without Design Approval**
Every task that produces visible UI must have Louis approve the design direction BEFORE Claude Code builds it. This means: (1) Design mockups or visual direction presented to Louis first, (2) Louis says "yes, build that" or "no, change this," (3) THEN Claude Code executes. No more building UI and marking it complete without Louis seeing and approving the design. Applies to all projects — HQ dashboard, Sparkle Suite, Rabbit Hole, client sites, any Louis-facing or customer-facing interface.

**Triggered by:** HQ dashboard built functional but visually rejected by Louis on first sight (April 13, 2026). Standing Rule 1 ("2028 not 2010") and Frontend Design skill were not applied to the original build.

**Rule 18 — Nothing COMPLETE Without Louis Verification**
Commits pushed and builds passing are NOT verification. Nothing gets marked COMPLETE or MILESTONE in Open Brain until Louis has personally seen it running and approves the output. Verification means: Louis logs in, sees the thing, and says it's good. Not "code compiles" or "migration ran clean." This applies to all projects — HQ, Sparkle Suite, Rabbit Hole, everything.

**Triggered by:** Build Tracker tab marked "MILESTONE COMPLETE" and "LIVE" in Open Brain across multiple captures without Louis ever logging into the dashboard or seeing the output (April 13, 2026).

**Rule 19 — Restart Prompt WHERE ARE WE Block**
Every restart prompt must start with a 3-line situation report BEFORE any task lists or Open Brain search instructions:

```
PROJECT: [which project — HQ / Sparkle Suite / Rabbit Hole]
CONTEXT: [one sentence — what we just finished and why this session matters]
GOAL: [one sentence — what we're trying to accomplish this session]
```

Restart prompts must be written for LOUIS first, Claude second. Plain English situation report before any task numbers or technical details.

**Triggered by:** Louis was directed into an SS Phase 0 session without realizing it — thought he was continuing HQ work (April 13, 2026). Task lists flew before Louis had context on which track he was in or why.

**Rule 20 — Simplicity-First Code Standard**
Build with the bare minimum code that makes it work. useState over URL routing. Plain CSS over animation libraries. Simple functions over complex patterns. No framework features "just in case." Add complexity ONLY when a real, demonstrated need arises and Louis approves it.

This is Rule 2 (KISS) made concrete as a code review criterion. If Claude Code produces complex solutions for simple problems, that's a bug — not a feature.

The test: "Can this be done with useState instead?" If yes, use useState. "Does this need a library?" If it works without one, skip it. "Is this pattern necessary for ONE user?" If not, don't build it.

Every Claude Code prompt must include this constraint: *"Build with the bare minimum code that makes it work. Use useState over URL routing. Use plain CSS over animation libraries. Use simple functions over complex patterns. No framework features 'just in case.' Add complexity ONLY when a real, demonstrated need arises. If a feature works with 5 lines, do not build it with 50. Functionality > fanciness."*

**Triggered by:** ProjectTabs click handler bug that took 6–7 Claude Code attempts to fix (April 13, 2026). Root cause was unnecessary URL-state routing machinery (~80 lines) for a single-user dashboard. Fix was replacing it all with useState — 2 lines.

---

## Plugins vs. Skills — Quick Reference

**Plugins** connect Claude to external services (Supabase, Vercel, GitHub). They give Claude **hands** — the ability to take action in those tools.

**Skills** teach Claude how to work better. They give Claude **brains** — design philosophy, security checklists, debugging discipline, performance patterns.

Together: plugins give Claude hands, skills give Claude brains. Both follow KISS — install only what directly improves your output.

---

## Plugins

### Tier 1 — Install Immediately

| Plugin | Source | Install Command |
|---|---|---|
| Supabase | Official Anthropic marketplace | `/plugin install supabase@claude-plugins-official` |
| Vercel | Official Anthropic marketplace | `/plugin install vercel@claude-plugins-official` |
| GitHub | Official Anthropic marketplace | `/plugin install github@claude-plugins-official` |
| Context7 | Official Anthropic marketplace | `/plugin install context7@claude-plugins-official` |

**Supabase** — Direct Supabase access: run SQL, manage tables, create migrations, check logs, deploy Edge Functions, generate types. Both Rabbit Hole and the unified dashboard run on Supabase (neon-rabbit-core). Claude can create tables and manage auth directly.

**Vercel** — Deploy projects, manage env vars, tail function logs, manage domains. All Neon Rabbit products are on Vercel. Claude can build AND deploy without Louis stepping in.

**GitHub** — Commit, push, create PRs, manage issues, search repos. Combined with Vercel: Claude can build → commit → deploy autonomously.

**Context7** — Live docs lookup. Pulls version-specific docs and code examples from source repos into context. Supabase, Capacitor, and React update frequently — Context7 ensures Claude writes against current APIs, not stale training data.

---

### Tier 2 — Install When Needed

| Plugin | What It Does | When |
|---|---|---|
| Playwright | Browser automation, E2E testing, screenshots. | Testing phases. Automated QA instead of manual clicking. |
| Code Review | Structured review agents for bugs, types, security. | Second opinion on Claude's code. Codex alternative. |
| Feature Dev | Structured feature workflow with sub-agents. | Large features (auth system, dashboard build). |
| Stripe | Webhooks, payment testing, subscription management. | When payments are added to any product. |

---

## Skills

### Tier 1 — Install Immediately (Always Active)

| Skill | Source | Install Command |
|---|---|---|
| Frontend Design | Anthropic official — 277,000+ installs | `/plugin install frontend-design@claude-plugins-official` |
| React Best Practices | Vercel Engineering — 150K+ weekly installs | `npx skills add vercel-labs/agent-skills` |
| Systematic Debugging | Community (well-vetted) | Search `/plugin discover` or awesome-claude-skills GitHub repo |
| OWASP Security | Community (well-vetted) | Search `/plugin discover` or awesome-claude-skills GitHub repo |
| Simplify | Anthropic official | `/plugin install simplify@claude-plugins-official` |

**Frontend Design** — Breaks Claude out of generic "AI slop" design. Forces a bold conceptual direction before writing code. Distinctive typography, purposeful colors, intentional animations. The single most impactful skill. Applies to ALL projects with a frontend. Aligns directly with the "2028 not 2010" standing rule.

**React Best Practices** — 68 performance rules organized by impact: eliminating request waterfalls, reducing bundle size, optimizing rendering, data fetching, re-renders. Also bundles Web Design Guidelines (100+ accessibility rules) and Composition Patterns. Applies to ALL React code across ALL projects.

**Systematic Debugging** — Forces structured 4-step debug protocol: (1) reproduce with smallest test case, (2) formulate one hypothesis, (3) test only that hypothesis, (4) observe and iterate. Critical for autonomous sessions — prevents Claude from thrashing randomly when hitting bugs.

**OWASP Security** — OWASP Top 10 (2025), ASVS 5.0, secure patterns for 20+ languages, 2026-current agent-specific attack vectors (prompt injection, MCP data exfiltration, privilege escalation). Applies to all code with auth, user data, APIs, or client-facing functionality.

**Simplify** — Code clarity agent. Reviews and refines recently modified code. Reduces complexity, improves readability while preserving functionality. Keeps the codebase clean during autonomous sessions. Aligns with KISS principle.

---

### Tier 2 — Install When Use Case Arrives

| Skill | What It Does | When To Install |
|---|---|---|
| Claude SEO | Full SEO suite: 19 sub-skills, 12 subagents. Technical SEO, E-E-A-T, Schema.org, local SEO, GEO for AI search, structured data generation. MIT licensed. | When actively working on Roberts Photo Studio SEO, Sparkle Suite post-launch SEO. Install for SEO sessions, remove when done (per 5–7 skill max rule). |
| Web Design Guidelines (Vercel) | 100+ accessibility/UX rules. ARIA, focus states, touch targets, semantic HTML, keyboard nav. | Bundled with Vercel agent-skills install. Especially important before App Store submissions. |
| Composition Patterns (Vercel) | Compound components, clean APIs, state management. | Bundled with Vercel agent-skills. Most useful when building shared component libraries. |
| Webapp Testing | Playwright-based testing toolkit. Claude clicks through apps, fills forms, screenshots. | Testing phases. Pairs with Playwright plugin. |
| Brand Voice | Teaches Claude Neon Rabbit's brand writing style, tone, forbidden words. | When Neon Rabbit brand voice is formalized and needs consistency across client sites. |

---

### Skills to Skip

- **Superpowers** — structured multi-agent workflow. Powerful but adds process overhead a solo operator doesn't need in a focused sprint.
- **Marketing/SEO suites (generic)** — Claude SEO covers this better with specific sub-skills.
- **Multi-LLM orchestration** — Codex review protocol already covers the second-opinion use case.
- **Anything under ~1,000 GitHub stars** — Snyk audit found 36% of community skills had security issues. Stick to official and well-vetted.
- **Session tracking / usage monitoring** — doesn't ship product. Nice to have later.

---

## How the Full Stack Works Together

Complete pipeline when Claude builds any Neon Rabbit product:

1. **Context7** pulls current docs so Claude writes against the latest APIs.
2. **OWASP Security** ensures auth, data handling, and endpoints follow security best practices.
3. **Supabase plugin** lets Claude create tables, manage data, and configure auth directly.
4. **React Best Practices** ensures the frontend is performant — no waterfalls, no bloat.
5. **Frontend Design** makes the UI distinctive, modern, and 2028-quality.
6. **Systematic Debugging** kicks in if something breaks — structured investigation, not random guessing.
7. **Simplify** cleans up the code for maintainability and KISS compliance.
8. **GitHub plugin** commits and pushes the code.
9. **Vercel plugin** deploys the finished build.
10. **Open Brain** auto-captures the session summary → dashboard updates automatically.

All of this runs autonomously while Louis is at work. He comes home to finished output, tests on his phone, and steers the next session.

---

## Project-Specific Tool Mapping

| Project | Plugins Used | Skills Active |
|---|---|---|
| Sparkle Suite | Supabase, Vercel, GitHub, Context7 | Frontend Design, React Best Practices, Systematic Debugging, OWASP, Simplify |
| Rabbit Hole | Supabase, Vercel, GitHub, Context7 | Frontend Design, React Best Practices, Systematic Debugging, OWASP, Simplify |
| Neon Rabbit HQ | Supabase, Vercel, GitHub, Context7 | Frontend Design, React Best Practices, OWASP, Simplify |
| Roberts Photo Studio | Vercel, GitHub | Frontend Design, Claude SEO (swap in for SEO work), OWASP |
| Quilting Portfolio | Vercel, GitHub | Frontend Design |
| VA Compensation | None (Cowork project) | None (research/docs, not code) |
| Personal Finances | None (Cowork project) | None (spreadsheets/docs) |
| Healthcare Tracking | Supabase (if dashboard page) | None |

---

## Installation Checklist

One-time setup. ~20 minutes total.

**Plugins — run in Claude Code Desktop:**
```
/plugin install supabase@claude-plugins-official
/plugin install vercel@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install context7@claude-plugins-official
```
Connect each plugin to your accounts when prompted.

**Skills — run in Claude Code Desktop:**
```
/plugin install frontend-design@claude-plugins-official
/plugin install simplify@claude-plugins-official
npx skills add vercel-labs/agent-skills   ← run in terminal
```
Search `/plugin discover` for: `systematic-debugging`, `owasp-security`

**Verify:**
Run `/plugin` and check the Installed tab. All 4 plugins and 5 skills should be listed.
