---
name: neon-rabbit-hq
description: "Use this skill whenever working on Neon Rabbit HQ — the internal Build Tracker, its Supabase schema layer, the nr-hq-mcp Edge Function, and the HQ dashboard UI. Treat HQ as one unit spanning two repos (neon-rabbit-core and neon-rabbit-hq) plus Supabase project bqhzfkgkjyuhlsozpylf. Triggers: any work in C:\\Users\\louis\\neon-rabbit-core or C:\\Users\\louis\\neon-rabbit-hq; any mention of 'NR HQ', 'Neon Rabbit HQ', 'HQ dashboard', 'Build Tracker', 'Open Items panel', 'action cards'; any reference to tables construction_phases, construction_tasks, construction_gates, build_action_log, open_items, neon_rabbit_clients, financial_snapshots; any reference to MCP tools get_build_summary, get_phases, get_tasks, get_gates, get_open_items, get_action_cards, update_task_status, update_phase_status, update_gate_status, update_action_cards, create_open_item, update_open_item, resolve_open_item, create_client, update_client, get_client, get_clients. Do NOT trigger on bare mentions of 'tasks' or 'phases' without HQ context — those words are too generic alone. This skill encodes standing rules (Rules 16, 17, 18, 20), the audit-before-build pre-flight pattern, design conventions (dark mode, NRCard, pill selectors), verification paths (npm run dev for UI, smoke-test.sh for the Edge Function), and commit conventions specific to HQ work. Read this skill before touching anything in the HQ surface area — generic React/Supabase advice will miss conventions that exist for painful reasons."
---

# Neon Rabbit HQ — Build Tracker, Edge Function, Dashboard

HQ is the internal command center: the Build Tracker that sequences every Neon Rabbit project, the Open Items governance layer, the canonical client DB, and the MCP bridge that lets Codex Chat read and write HQ state mid-conversation. Dashboard UI, Supabase schema, and the `nr-hq-mcp` Edge Function are **one unit** — a change in any layer usually touches the others.

---

## 1. Repos and Paths

Two repos, one brain:

| Repo | Path | Contains |
|---|---|---|
| `neon-rabbit-core` | `C:\Users\louis\neon-rabbit-core` | Supabase migrations, Edge Functions (`nr-hq-mcp`, `daily-financial-sync`, `open-brain-mcp`), Stripe, chrome extension, shared libs |
| `neon-rabbit-hq` | `C:\Users\louis\neon-rabbit-hq` | The HQ dashboard UI (Next.js 16 / React 19) |

Rules:
- **Main branch only** on both repos. Do not create worktrees or feature branches unless Louis explicitly asks.
- `CODEBASE_SNAPSHOT.md` in each repo is the current-state document — the authoritative index of what exists right now. **Read it first** when orienting at the start of a task. Do not duplicate its contents into plans; reference it.

---

## 2. Data Surface

Live Supabase project: **`bqhzfkgkjyuhlsozpylf`** (us-east-1).

### Tables

| Table | Purpose |
|---|---|
| `construction_phases` | Build Tracker phase headers (Phase 0, 1, 2A, 2B, 3…) |
| `construction_tasks` | Per-phase tasks with status and completion_date |
| `construction_gates` | Phase-exit quality gates, keyed by `gate_key` |
| `build_action_log` | Audit log — every status change appends a row |
| `open_items` | Governance layer: gaps, legal, grey_area, research, decisions, tasks |
| `neon_rabbit_clients` | Canonical client database. Cron-owned columns: `payment_status`, `stripe_customer_id`, `current_plan`, `next_charge_date`, `lifetime_revenue` |
| `financial_snapshots` | Cron-owned. Written by `daily-financial-sync` Edge Function |

`clients_build_pipeline` is **Sparkle Suite pipeline tracking**, not HQ. Do not confuse the two.

### Edge Function

`nr-hq-mcp` at `supabase/functions/nr-hq-mcp/` exposes **17 MCP tools** (5 read + 12 write) over Hono with an `x-brain-key` auth gate. The write tools use a `SUPABASE_SERVICE_ROLE_KEY` client; the reads use anon. Smoke test at `supabase/functions/nr-hq-mcp/smoke-test.sh` — 14 curl calls, no jq dependency, reads `MCP_ACCESS_KEY` from env.

The MCP tools are callable from **both Codex Chat and Codex** (the connector is reachable from inside Code's execution context). When resolving an open_item or marking a task complete mid-task, call the MCP tool directly rather than handing control back to Louis.

### Audit-Before-Build Rule

**Any task targeting an existing table must query live schema before writing code.** Build plans and task specs have twice (Tasks 2 and 3) assumed columns that did not exist on the live table — each miss burned a round-trip.

Pre-flight pattern:
1. Query live schema for the target table(s).
2. List existing components / functions the task will edit.
3. Confirm any libraries the task references are actually installed.
4. **Stop. Report findings. Wait for Louis confirmation before writing code.**

If the live reality differs from the task spec, surface the gap instead of silently conforming the code to either side.

---

## 3. Conventions

These are the rules HQ work bends to. They exist because ignoring them has cost real time.

### Standing Rules

- **Rule 16 — Prompt header format.** Branch guardrail first, clean task description in the middle, EXECUTION block last. No exceptions for HQ tasks.
- **Rule 17 — No UI without approval.** Do not ship a new component, layout, or visual change without Louis approving the design first. Describe or sketch the proposed UI and wait.
- **Rule 18 — Nothing is COMPLETE until Louis browser-verifies.** A compile without errors is not verification. A passing smoke test is not verification. A Vercel or Supabase auto-deploy is not verification. Code-complete ≠ Louis-verified.
- **Rule 20 — Simplicity-first.** `useState` over URL-based routing. Plain CSS over animation libraries. Plain functions over clever abstractions. No framework features added "just in case." If 5 lines work, do not write 50. Premature flexibility is the bug.

### Design Patterns (dashboard)

- **Dark mode by default.**
- **`NRCard`** wrapper with hover glow — the house card primitive.
- **Pill selectors** for sub-tabs. Not tabs, not radio groups, not segmented controls. Pills.
- **Collapsible sections** for long lists and reference content.
- **Click-to-copy** on titles, UUIDs, and any command string. Copy affordance is implicit — the whole text is the button.
- **Desktop-first.** Mobile is not in scope.

### Commits

- Subject line: `feat(scope): short description (Task reference)` — e.g. `feat(memory-library): rename client tables, add open_items (Task 2)`.
- Body lists the concrete changes and any **deliberate omissions** (e.g. "did not backfill a CREATE migration for `neon_rabbit_clients` because inferred columns would likely be wrong-shape").
- **Regenerate `CODEBASE_SNAPSHOT.md` as the final step** before committing. The snapshot is how future sessions orient — leaving it stale costs cycles.

### Session Close

- Desktop app: say **"close session"** — this is the phrase Louis uses to end a Desktop conversation cleanly.
- `/exit` is a CLI-only command. Do not suggest it to Louis.

---

## 4. Verification Paths

Pick the path that matches the layer being changed. Many HQ tasks touch more than one.

### Dashboard changes (`neon-rabbit-hq`)
1. `npm run dev` in `C:\Users\louis\neon-rabbit-hq`
2. Walk the affected screen in the browser — golden path and one edge case.
3. Hand to Louis for Rule 18 verification with a short list of what to click.

### Edge Function changes (`nr-hq-mcp` or any other function in `neon-rabbit-core`)
1. Edit the function.
2. Run `supabase/functions/nr-hq-mcp/smoke-test.sh` locally against the deployed endpoint. All 14 must PASS.
3. `supabase functions deploy <name>` to project `bqhzfkgkjyuhlsozpylf`.
4. For MCP tool surface changes: tell Louis to reload the HQ connector in Codex.ai Settings (disconnect + reconnect) to pick up the new tool list.
5. Fire one real MCP call from a fresh chat to confirm the end-to-end path.

### Migration changes
1. Write the migration under `supabase/migrations/NNN_description.sql`.
2. Never rely on `supabase db reset` for HQ — production has drift the migrations history does not capture, and a reset would destroy live data.
3. Regenerate `CODEBASE_SNAPSHOT.md` to reflect the new schema state.

### Both layers touched
Run dashboard verification **and** smoke test, in that order, before handing to Louis.

---

## Companion Documents

- `CODEBASE_SNAPSHOT.md` (in each repo) — authoritative current-state index. Read before starting.
- `AGENTS.md` — the Next.js 16 breaking-change notice; read `node_modules/next/dist/docs/` before writing Next.js code.
- `L1_NR_Plugins_Skills_Standing_Rules` — the standing rules referenced above live here in full.
- `NR_Skill_NeonRabbitHQ_v1.0.md` (Google Drive `/Neon Rabbit/`) — the spec documenting this skill.
