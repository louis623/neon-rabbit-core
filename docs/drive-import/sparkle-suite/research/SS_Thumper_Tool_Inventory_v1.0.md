# Sparkle Suite — Thumper Tool Inventory

📍 **WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
🔍 **HOW CLAUDE ACCESSES IT:** Drive connector on demand; uploaded to chat sessions when Phase 1 work is active
📁 **UPLOAD TO PROJECT:** No — feature spec, not always-needed reference
🏷 **PROJECT:** Sparkle Suite (Phase 1 — Thumper Core Engine)
👤 **WHO USES IT:** Louis (reference), Claude Chat (input for prompt writing), Claude Code (input for build prompts)
🔄 **UPDATE TRIGGER:** Tool added/removed/renamed; HITL designation changed; new tool category added; Phase 1 implementation surfaces tool design changes

**Inventory Date:** April 19, 2026
**Inventory Status:** STRUCTURE LOCKED — DETAILS REFINE DURING PHASE 1 EXECUTION
**Total Tools:** 31
**Domains:** 10
**HITL Tools (need `needsApproval: true`):** 6
**Phase Scope:** Phase 1 — Thumper Core Engine (rep-internal only)

---

## Executive Summary

Thumper has 31 tools spanning 10 functional domains. All tools are NATIVE (defined in AI SDK with Zod schemas). No MCP integration in Phase 1.

6 tools require Human-in-the-Loop (HITL) confirmation via `needsApproval: true`:
- Money-moving: `send_sms_blast`, `send_email_blast`
- Customer-facing commitments: `approve_trade`, `reject_trade`
- Destructive (with soft-delete safety net): `delete_listing`
- Cancellation messaging trigger: `cancel_show`

All other tools are non-HITL — Thumper executes them based on rep request without confirmation gate.

---

## Inventory by Domain

### A. Trade Board (9 tools)

The highest-priority tool family — the trade board is the rep's most-used surface during live shows and the lead-in to the Lindsey Prototype Validation phase.

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `add_listing` | Add a piece to the rep's trade board | No | Multi-step capture handled in conversation (photo → SKU → MSRP → tolerance), single tool call at end |
| `list_my_trade_board` | Show rep their current listings | No | Read-only, RLS-scoped to rep |
| `update_listing` | Modify a listing (price, tolerance, photo, status) | No | RLS-scoped |
| `delete_listing` | Soft-delete a listing (writes `deleted_at` timestamp) | **Yes** | Thumper asks "Are you sure?" before firing. Recovery window TBD (7 vs 30 days). |
| `restore_listing` | Restore a soft-deleted listing within recovery window | No | Non-destructive |
| `get_trade_requests` | Show pending trade requests on rep's listings | No | Read-only |
| `approve_trade` | Approve a customer's trade request | **Yes** | Customer-facing commitment |
| `reject_trade` | Reject a customer's trade request | **Yes** | Customer-facing |
| `search_jewelry_database` | Look up product by SKU, name, collection | No | Read-only, supports `add_listing` flow |

### B. Calendar / Show Management (4 tools)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `add_show` | Schedule a new show | No | Generates auto-SMS/email reminders downstream |
| `list_my_shows` | Get upcoming shows | No | Read-only |
| `update_show` | Reschedule, update show details | No | If subscribers already notified, may flag |
| `cancel_show` | Cancel a scheduled show | **Yes** | Triggers cancellation messaging — confirm |

### C. SMS / Email — Bulk Only (3 tools)

**LOCKED OUT OF PHASE 1:** Customer 1:1 messaging (separate liability decision — Louis April 19, 2026).

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `send_sms_blast` | Send manual SMS to subscribers | **Yes** | Money: Telnyx wallet draw. Cap-enforced 3/wk. Content-screened pre-send. |
| `send_email_blast` | Send manual email to subscribers | **Yes** | Cap-enforced 3/wk. Content-screened. |
| `get_subscribers` | Show subscriber list | No | Read-only, RLS-scoped |

**See open_item `9989fbd9` for blocking decision: scripted templates vs free-compose with screening (blocks Phase 5).**

### D. Site / Dashboard Customization (3 tools)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `update_banner_text` | Change site banner text | No | |
| `update_streaming_links` | Update TikTok / streaming platform links | No | |
| `update_site_setting` | Generic site setting updates (about, contact, etc.) | No | Non-destructive |

### E. Memory / Context (2 tools)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `write_rep_note` | Save a short note about something worth remembering | No | Internal — auto-fires at end of conversations |
| `read_recent_rep_notes` | Pull recent notes at conversation start | No | Internal — fires at session start |

### F. Knowledge Base (1 tool)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `search_knowledge_base` | Hybrid search over jewelry / BP / SS knowledge | No | Vector + FTS with RRF, pgvector |

### G. Escalation / Support (1 tool)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `create_support_ticket` | Escalate to Louis when Thumper can't help | No | Auto-fires on tier (c) errors, also user-invokable |

### H. Profile / Billing (3 tools)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `get_my_profile` | Rep's own profile, contact, business info | No | Read-only |
| `update_my_profile` | Update rep profile fields | No | Self-service, non-destructive |
| `get_my_billing_status` | Stripe subscription, SMS wallet balance, billing history | No | Read-only |

### I. Troubleshooting (4 tools)

**Design principle:** Tools return STATUS SNAPSHOTS, not deep diagnostics. Thumper is positioned as a tier-identifier and escalator, not a deep-debugger.

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `check_chrome_extension_status` | Live Queue extension version, install status, last activity | No | Surface-level health only |
| `check_calendar_sync_status` | BP show schedule sync status | No | Surface-level health only |
| `check_messaging_status` | Telnyx wallet balance, cap usage, recent send history | No | Consolidated from earlier `check_messaging_caps` proposal |
| `check_site_status` | Site live, last deploy timestamp, error indicators | No | Surface-level health only |

**Note:** `run_diagnostic` was considered as a composite tool but dropped — Thumper calls underlying tools in parallel when needed, per AI SDK parallel tool call capability. Subagent pattern available as upgrade path if 31 tools become unwieldy in practice.

### J. Analytics (1 tool)

| Tool | Description | HITL? | Notes |
|---|---|---|---|
| `get_my_analytics` | Site analytics + SEO/GEO status, default 30 days, configurable range | No | Returns clean rep-readable summary, not raw data dumps |

**Related parked feature (NOT a Thumper tool):** Monthly automated analytics email — separate scheduled-job architecture (Vercel Cron or Supabase Edge Function). Lives outside Thumper. Likely Phase 5 or its own analytics phase.

---

## Three-Tier Escalation Principle (System Prompt Driver)

Thumper's system prompt MUST position Thumper as a tier-identifier and escalator, NOT a deep debugger:

- **Tier (a) — Rep doesn't know how:** Thumper walks them through it (uses `search_knowledge_base` + how-to guidance)
- **Tier (b) — Something light is misconfigured:** Thumper guides the fix (uses troubleshooting tools + targeted instruction)
- **Tier (c) — Something is actually broken:** Thumper escalates via `create_support_ticket` FAST. Errs on the side of escalating rather than letting a rep grind on a real problem.

Per Louis: *"You don't want reps getting too far in the weeds with troubleshooting stuff. They should be able to do some light troubleshooting with Thumper, but if something is really broken and it's more than just that they don't know how to use it, we need that to be escalated."*

---

## Key Design Decisions Locked

1. **Soft delete with "Are you sure?" confirmation** for destructive listing operations
2. **Site customization tools belong in Phase 1** with Thumper (Thumper IS the interface — reps tell Thumper what they want)
3. **Customer 1:1 messaging EXCLUDED from Phase 1** entirely (liability surface too large)
4. **Troubleshooting tools return status snapshots only** (not deep diagnostics)
5. **`run_diagnostic` dropped** in favor of parallel tool calls
6. **`check_messaging_caps` consolidated** into `check_messaging_status` under troubleshooting
7. **Monthly analytics email is separate scheduled-job architecture**, NOT a Thumper tool

---

## Pending Decisions (Don't Block Phase 1 Task 1.0 Spike)

| Decision | Tracked As | When Needed |
|---|---|---|
| Soft-delete recovery window (7 vs 30 days) | open_item (TBD this session) | Phase 1 spec detail |
| Bulk SMS/Email model: scripted templates vs free-compose with screening | open_item `9989fbd9` | Before Phase 5 build |
| Embeddings vendor: OpenAI vs Voyage vs open-source | Captured in DECISION LOCKED architecture note | Before knowledge base build |

---

## Architecture Constraints from Codex Review (April 19, 2026)

When tool implementations are written:

- **Authorization gates outside the model:** Every write tool's `execute()` function must enforce RLS + role checks BEFORE any action. Don't trust the model to only call tools appropriately. Primary prompt injection defense.
- **All tools defined in separate typed files** (not inline) — preserves maintainability at 31-tool scale.
- **HITL via `needsApproval: true`** is a TWO-CALL FLOW, not a magical pause. App state must handle the request → response cycle.
- **All cost modeling uses Anthropic actual current pricing**, NOT inherited estimates from research artifacts.

---

## Tool Count vs. AI SDK Capability

Per Vercel AI SDK research, the SDK handles 10-30 tools well with subagent pattern available as upgrade path if needed. At 31 tools, we are at the upper edge of the comfortable range — well-within capability, but worth monitoring during Phase 1 execution. If model confusion emerges in practice, the subagent pattern is the correct upgrade path (NOT preemptively adopted).

---

*This inventory is the input to Phase 1 Task 1.0 (vertical-slice spike) and Phase 1 Tasks 1.1-1.10 (production build). Tool details may refine as implementation surfaces design changes.*
