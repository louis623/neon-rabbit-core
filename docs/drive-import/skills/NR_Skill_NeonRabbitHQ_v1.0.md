Skill is live — I can see \`neon-rabbit-hq\` now appearing in the available skills list. Installed in both \`neon-rabbit-core/.claude/skills/\` and \`neon-rabbit-hq/.claude/skills/\`.

\---

\#\# DELIVERABLE 1 — Skill file locations

\- \[neon-rabbit-core/.claude/skills/neon-rabbit-hq/SKILL.md\](.claude/skills/neon-rabbit-hq/SKILL.md)  
\- \`C:\\Users\\louis\\neon-rabbit-hq\\.claude\\skills\\neon-rabbit-hq\\SKILL.md\` (mirror)

\#\#\# Final trigger keyword list

\*\*Repo paths:\*\* \`C:\\Users\\louis\\neon-rabbit-core\`, \`C:\\Users\\louis\\neon-rabbit-hq\`, \`neon-rabbit-core\`, \`neon-rabbit-hq\`

\*\*Explicit phrases:\*\* \`NR HQ\`, \`Neon Rabbit HQ\`, \`HQ dashboard\`, \`Build Tracker\`, \`Open Items panel\`, \`action cards\`

\*\*Tables:\*\* \`construction\_phases\`, \`construction\_tasks\`, \`construction\_gates\`, \`build\_action\_log\`, \`open\_items\`, \`neon\_rabbit\_clients\`, \`financial\_snapshots\`

\*\*MCP tools (17):\*\* \`get\_build\_summary\`, \`get\_phases\`, \`get\_tasks\`, \`get\_gates\`, \`get\_open\_items\`, \`get\_action\_cards\`, \`update\_task\_status\`, \`update\_phase\_status\`, \`update\_gate\_status\`, \`update\_action\_cards\`, \`create\_open\_item\`, \`update\_open\_item\`, \`resolve\_open\_item\`, \`create\_client\`, \`update\_client\`, \`get\_client\`, \`get\_clients\`

\*\*Negative triggers:\*\* bare "tasks" or "phases" without HQ context.

\#\#\# Test phrase to confirm firing

Paste this into a fresh Code session in either repo:

\> \*"I need to add a column to construction\_tasks and update nr-hq-mcp's update\_task\_status to set it. Plan the change."\*

\*\*Expected behavior if firing:\*\* skill loads, Code opens with a pre-flight (query live schema of \`construction\_tasks\` \+ read \`nr-hq-mcp/index.ts\`), references Rule 18 / audit-before-build, mentions \`smoke-test.sh\` as the verification path, and stops for Louis confirmation before writing code.

\*\*Expected behavior if NOT firing:\*\* generic React/Supabase advice, no pre-flight offered, dives straight into code, no mention of \`CODEBASE\_SNAPSHOT.md\` or smoke-test.sh.

\---

\#\# DELIVERABLE 2 — Markdown spec (copy this into Google Drive as \`NR\_Skill\_NeonRabbitHQ\_v1.0.md\`)

\`\`\`markdown  
\# Neon Rabbit — HQ Skill Specification

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/  
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed OR via Drive connector  
📁 UPLOAD TO PROJECT: No  
🏷 PROJECT: Neon Rabbit (HQ-specific tool infrastructure)  
👤 WHO USES IT: Louis (reference), Claude Chat (when auditing skill behavior), Claude Code (loads automatically via skill triggers)  
🔄 UPDATE TRIGGER: Any change to skill triggers, conventions encoded, repos covered, or version bump of the skill itself

\*\*Version:\*\* 1.0 | \*\*Created:\*\* April 17, 2026 | \*\*Status:\*\* ACTIVE

\---

\#\# 1\. Purpose

The \`neon-rabbit-hq\` skill teaches Claude Code that HQ is one logical unit — dashboard UI, Supabase schema, and the \`nr-hq-mcp\` Edge Function — and encodes the conventions that distinguish HQ work from generic React/Supabase work. It exists to eliminate repeated friction: generic advice that ignores dark mode defaults, UI shipped without Rule 17 approval, migrations written against task-spec columns that don't match live reality (Tasks 2 and 3), and sessions that mark code "done" before Louis has verified it in a browser (Rule 18). Without the skill, every HQ session starts from zero; with it, the first response already reflects the house rules.

\---

\#\# 2\. Scope

\*\*Covered:\*\*  
\- \`neon-rabbit-core\` repo — Edge Functions (\`nr-hq-mcp\`, \`daily-financial-sync\`), migrations, Supabase config, shared libs  
\- \`neon-rabbit-hq\` repo — the HQ dashboard UI  
\- Supabase project \`bqhzfkgkjyuhlsozpylf\` (us-east-1)  
\- HQ-owned tables: \`construction\_phases\`, \`construction\_tasks\`, \`construction\_gates\`, \`build\_action\_log\`, \`open\_items\`, \`neon\_rabbit\_clients\`, \`financial\_snapshots\`  
\- \`nr-hq-mcp\` Edge Function and its 17 MCP tools

\*\*Deliberately not covered:\*\*  
\- Sparkle Suite (SS) rep-facing platform code — owned by \`sparkle-live-queue\` skill and SS-specific sessions  
\- \`clients\_build\_pipeline\` table — SS build pipeline tracking, not HQ  
\- Rabbit Holes (RH) product code  
\- Per-client work, client websites, client Stripe configurations  
\- Open Brain (\`open-brain-mcp\`) — adjacent memory product, separate surface area

\---

\#\# 3\. Triggers

\#\#\# Finalized keyword list

\*\*Repo paths:\*\*  
\- \`C:\\Users\\louis\\neon-rabbit-core\`  
\- \`C:\\Users\\louis\\neon-rabbit-hq\`  
\- \`neon-rabbit-core\` (bare)  
\- \`neon-rabbit-hq\` (bare)

\*\*Explicit phrases:\*\*  
\- \`NR HQ\`  
\- \`Neon Rabbit HQ\`  
\- \`HQ dashboard\`  
\- \`Build Tracker\`  
\- \`Open Items panel\`  
\- \`action cards\`

\*\*Table names:\*\*  
\- \`construction\_phases\`, \`construction\_tasks\`, \`construction\_gates\`  
\- \`build\_action\_log\`  
\- \`open\_items\`  
\- \`neon\_rabbit\_clients\`  
\- \`financial\_snapshots\`

\*\*MCP tool names (all 17):\*\*  
\- Reads: \`get\_build\_summary\`, \`get\_phases\`, \`get\_tasks\`, \`get\_gates\`, \`get\_open\_items\`, \`get\_action\_cards\`  
\- Build Tracker writes: \`update\_task\_status\`, \`update\_phase\_status\`, \`update\_gate\_status\`, \`update\_action\_cards\`  
\- Open Items writes: \`create\_open\_item\`, \`update\_open\_item\`, \`resolve\_open\_item\`  
\- Client CRUD: \`create\_client\`, \`update\_client\`, \`get\_client\`, \`get\_clients\`

\#\#\# Should fire  
\- "Add a column to \`construction\_tasks\` and update \`update\_task\_status\`."  
\- "Build the Open Items panel for the HQ dashboard."  
\- "The Build Tracker phase progress bar isn't updating after I call \`update\_phase\_status\` — debug."  
\- "I need to add a new MCP write tool to \`nr-hq-mcp\` for archiving tasks."  
\- "In \`C:\\Users\\louis\\neon-rabbit-core\`, add a migration that renames a column on \`neon\_rabbit\_clients\`."

\#\#\# Should NOT fire  
\- "Review my React form component for accessibility." \*(generic frontend, no HQ context)\*  
\- "How do I add a new phase to my CI pipeline?" \*(bare "phase", unrelated domain)\*  
\- "List all tasks I need to finish today." \*(bare "tasks", productivity domain)\*  
\- "Write a migration to add a \`status\` column to the \`orders\` table." \*(Supabase, but not an HQ table)\*  
\- "Fix the Bomb Party scraper." \*(different product — \`sparkle-live-queue\` skill owns this)\*

\---

\#\# 4\. Conventions Encoded

| Convention | Summary | Source of truth |  
|---|---|---|  
| Rule 16 — Prompt header format | Branch guardrail, task, EXECUTION block | L1 Standing Rules |  
| Rule 17 — No UI without approval | Describe/sketch, wait for Louis sign-off before coding visuals | L1 Standing Rules |  
| Rule 18 — Browser verification required | Compile \+ smoke \+ auto-deploy ≠ complete | L1 Standing Rules |  
| Rule 20 — Simplicity-first | useState over routing, plain CSS over libs, no "just in case" features | L1 Standing Rules |  
| Main branch only (both repos) | No worktrees or feature branches unless asked | Inline in skill |  
| Audit-before-build pre-flight | Query live schema, list components, confirm libs, STOP for confirmation | Inline in skill |  
| Design: dark mode default | — | Inline in skill |  
| Design: NRCard w/ hover glow | House card primitive | Inline in skill |  
| Design: pill selectors (not tabs) | For all sub-tab navigation | Inline in skill |  
| Design: collapsible sections | Long lists and reference content | Inline in skill |  
| Design: click-to-copy on titles/UUIDs/commands | Whole text is the button | Inline in skill |  
| Design: desktop-first | Mobile out of scope | Inline in skill |  
| Commit format | \`feat(scope): description (Task N)\` \+ body lists changes and deliberate omissions | Inline in skill |  
| Regenerate CODEBASE\_SNAPSHOT.md as final commit step | — | Inline in skill |  
| Session close phrase | "close session" (Desktop) — never suggest \`/exit\` | Inline in skill |  
| MCP writes from inside Code | Self-update open\_items/tasks without handing back to chat | Inline in skill |  
| Verification: dashboard | \`npm run dev\` → browser walk → Rule 18 handoff | Inline in skill |  
| Verification: Edge Function | \`smoke-test.sh\` → deploy → fresh-chat MCP call \+ Louis reloads connector | Inline in skill |  
| Verification: migrations | Never run \`supabase db reset\` on HQ — live drift not in migration history | Inline in skill |

\---

\#\# 5\. Source of Truth Map

| Content | Source of truth | Updated when |  
|---|---|---|  
| Current repo/file structure, schema state, live table column sets | \`CODEBASE\_SNAPSHOT.md\` in each repo | At the end of every task that touches code or schema |  
| Standing Rules 16 / 17 / 18 / 20 | \`L1\_NR\_Plugins\_Skills\_Standing\_Rules\` (Google Drive) | When rules are added, retired, or renumbered |  
| Trigger keyword list for the skill | \*\*This spec\*\* \+ skill frontmatter (kept in sync) | When triggers are added, tightened, or loosened |  
| Design patterns (dark mode, NRCard, pill selectors, etc.) | Skill body | When a new house pattern is adopted or an old one retired |  
| Commit format \+ snapshot regeneration rule | Skill body | When commit conventions change |  
| Audit-before-build pre-flight pattern | Skill body | When the pre-flight steps change or new failure modes teach new steps |  
| Verification paths (dashboard / edge function / migrations) | Skill body | When a new verification tool is added or an old one is removed |  
| Supabase project ID (\`bqhzfkgkjyuhlsozpylf\`) | Skill body \+ \`CODEBASE\_SNAPSHOT.md\` | Project migration (rare) |  
| MCP tool catalog (17 tools, which are read vs. write) | \`supabase/functions/nr-hq-mcp/index.ts\` (code) \+ \`CODEBASE\_SNAPSHOT.md\` (index) | Every time a tool is added, removed, or renamed |  
| HQ scope boundaries (what is and isn't HQ) | This spec §2 | When product lines are added, split, or merged |

\---

\#\# 6\. How to Test It's Firing

\#\#\# Test prompt

Paste into a fresh Claude Code session inside either \`neon-rabbit-core\` or \`neon-rabbit-hq\`:

\> \*"I need to add a column to \`construction\_tasks\` and update \`nr-hq-mcp\`'s \`update\_task\_status\` to set it. Plan the change."\*

\#\#\# Expected behavior (skill IS firing)

1\. Code acknowledges the HQ skill has loaded, or its behavior reflects it without explicit announcement.  
2\. First move is a \*\*pre-flight\*\*: query live schema of \`construction\_tasks\`, read \`supabase/functions/nr-hq-mcp/index.ts\`, read \`CODEBASE\_SNAPSHOT.md\`.  
3\. Plan explicitly references:  
   \- The audit-before-build rule (will stop for confirmation before writing code)  
   \- Rule 18 — Louis must browser/MCP-verify before anything is "complete"  
   \- \`smoke-test.sh\` as the verification path for the Edge Function change  
   \- Regenerating \`CODEBASE\_SNAPSHOT.md\` as a final step  
4\. Plan does \*\*not\*\* proceed to write code until Louis confirms the pre-flight findings.  
5\. Commit message draft follows \`feat(scope): description (Task N)\` format.

\#\#\# Expected behavior (skill is NOT firing)

\- Generic React/Supabase advice with no HQ-specific framing.  
\- Dives straight into writing the migration and function patch with no pre-flight.  
\- No mention of \`CODEBASE\_SNAPSHOT.md\`, \`smoke-test.sh\`, Rule 18, Rule 20, or audit-before-build.  
\- Suggests conventional tab navigation, light mode, or framework-heavy patterns (contradicting Rule 20).  
\- Suggests \`/exit\` or doesn't close with "close session".

If you see the second profile, verify the skill file exists at both repo \`.claude/skills/neon-rabbit-hq/SKILL.md\` paths and that Claude Code has been restarted since the file was added.

\---

\#\# 7\. Version History

| Version | Date | Changes |  
|---|---|---|  
| 1.0 | 2026-04-17 | Initial creation — covers Edge Function \+ dashboard \+ Supabase schema layer for Neon Rabbit HQ. Installed to \`neon-rabbit-core/.claude/skills/neon-rabbit-hq/\` and mirrored to \`neon-rabbit-hq/.claude/skills/neon-rabbit-hq/\`. Encodes Rules 16/17/18/20, audit-before-build pre-flight, design conventions, commit format, and verification paths. Triggers scoped tight — bare "tasks"/"phases" excluded. |

\---

\#\# 8\. Related Documents

\- \`CODEBASE\_SNAPSHOT.md\` — current-state index, maintained at the root of each of \`neon-rabbit-core\` and \`neon-rabbit-hq\`. Always read first when orienting.  
\- \`AGENTS.md\` — Next.js 16 breaking-change notice; tells Claude to consult \`node\_modules/next/dist/docs/\` before writing Next.js code. Lives at the root of each repo.  
\- \`L1\_NR\_Plugins\_Skills\_Standing\_Rules\_v3.8.md\` (upcoming v3.9) — canonical home of Rules 16, 17, 18, 20 and the rest of the numbered rule set. Google Drive \`/Neon Rabbit/\`.  
\- \`L1\_NR\_Document\_System\_SOP\_v1.7.md\` (upcoming v1.8) — the document-system SOP this spec lives under. Google Drive \`/Neon Rabbit/\`.  
\- \`open\_items\` row \`62539c99\` — the item tracking \*\*this document\*\* (the HQ skill spec).  
\- \`open\_items\` row \`ae638f66\` — the item tracking \*\*future per-product skills\*\* (the pattern this spec establishes, extended to SS, RH, etc.).  
\`\`\`

\---

close session  
