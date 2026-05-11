# Sparkle Suite — Master Build Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No (upload per session when build work is on the agenda)
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (primary reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Plan structure changes only — new phases, restructured dependencies, new legal requirements, scope changes, items moving in/out of parking lot. Do NOT update for task completion, commit hashes, gate results, or session refs — Build Tracker (Supabase construction_phases / construction_tasks / construction_gates), Open Brain, and open_items own all live status.

**Version:** 3.2 | **Created:** April 9, 2026 | **Last Updated:** April 21, 2026 | **Status:** ACTIVE

**v3.2 CHANGES (April 21, 2026):**
1. **PHASE 1 TASK 1.0 — SPIKE COMPLETE.** Vertical-slice spike shipped April 20, 2026 (commit 8c8ea32). 7/7 deliverables, 7/7 red-team attacks pass, prompt caching verified, HITL verified end-to-end. Live at `/spike`. Full findings: `SS_Phase1_Spike_Findings_v1.0.md` in repo root. Task 1.0 added as first row in Phase 1 table.
2. **PHASE 1 TASK 1.1 — SCOPE LOCKED.** Task 1.1 description rewritten from a one-line "API route" stub into a scoped route-hardening task: promote `/spike` → `/thumper`, real system prompt, UI surface (per Claude Design mockups), Guardian+Enforcer structural hooks, zero new tools. Spike's two tools (`list_my_trade_board`, `remove_listing`) carry over. Full detail in the Task 1.1 notes cell.
3. **GUARDIAN & ENFORCER AGENTS — PARKING LOT ADDITIONS.** Two new post-launch agent layers documented: Guardians (defensive/health/maintenance, 7 agents) and Enforcers (offensive/security/fraud-detection, 5 agents). Both parked for post-SS-launch. Task 1.1 includes structural plumbing (5 new audit tables + health endpoint) so retrofit is cheap. Full catalog in Parking Lot → Agent Layers.
4. **DASHBOARD PHILOSOPHY NOTE — PHASE 6.** Phase 6 description and the Dual Interface core business rule both reconciled with April 20/21 decision: rep dashboard shows STATUS, Thumper handles ACTIONS, minimal fallback buttons for when Thumper is on the fritz. Removes the "both are equal, not read-only" framing from v3.1.
5. **DEPLOYMENT MODEL DECISION — LOCKED.** Push-to-main auto-deploy. No feature flag. No dev branch. Reps don't know `/thumper` exists until launch. Documented in Phase 1 overview.
6. **POST-LAUNCH PARKING — CROSS-REFERENCES ADDED.** Guardian and Enforcer agent layers explicitly cross-referenced from Phase 1 Task 1.1 so the "structural hooks" obligation is visible in context, not just in the parking lot.

**v3.1 CHANGES (April 19, 2026):** (1) PRICING: Monthly-only forever — annual and quarterly removed from all pricing references. (2) SPEC-CODE ALIGNMENT: Task 0.4 description corrected to reflect shipped reality after Gate 0 verification surfaced drift: metadata contract uses `rep_id` (NOT `rep_user_id`), `stripe_events` table PK is `id` (NOT `event_id`). (3) TEST IDENTITY CONVENTION: `testrep@neonrabbit.net` = scaffolded sandbox for downstream UI/query tests (Task 0.6); `gatetest@neonrabbit.net` = on-demand clean identity for webhook-path gate verification tests. (4) LEGAL L6: Visa/MC 7-day reminder rule marked NO LONGER APPLICABLE (monthly-only removes the 6+ month trigger). (5) PHASE 6.14 + PHASE 8: Pricing UI simplified to single tier. (6) PRE-LAUNCH DECISION #4: reframed from "pricing tiers" to "monthly price point" — the question now is what dollar amount, not what structure. Companion specs bumped alongside: SS_Supabase_Schema v1.1 (10 drift fixes incl. INTEGER cents + new stripe_events §17 + testrep seed identity).

**v3.0 CHANGE:** Status tracking stripped. This document is now a pure reference spec — the "what and why" of Sparkle Suite. Phase progress, task completion, gate results, commit hashes, and session refs all live in Build Tracker (Supabase) via the NR HQ dashboard. Pull `get_build_summary(project='sparkle_suite')` for current state. Resolved Gap Analysis Record, Pre-Build Blockers, "Build Tracker tab" build description, and per-task completion narratives all removed — their substance is either embedded in phase descriptions (architectural decisions) or lives in Build Tracker / Open Brain (status, history).

**COMPANION SPECS (upload alongside this plan for build work):**
- SS_Supabase_Schema_v1_1.md — 17-table schema specification (source of truth for Phase 0 schema, reflects shipped reality as of April 19)
- SS_Service_Layer_Spec_v1_0.md — Shared service layer: 12 functions, 3 trade-board Postgres RPCs (wallet RPCs TBD — open_item eb89bf3e)

---

## How to Read This Plan

This plan is organized into **phases** that follow a dependency chain. Each phase lists what it builds, what it depends on, what can run in parallel, time estimates, and test gates that must pass before moving on.

**Time estimate key:**
- ⚡ Quick — Under 30 minutes. Single Claude Code session. Regular Sonnet is fine.
- 🔧 Medium — 30–90 minutes. One focused Claude Code session.
- 🏗 Large — 2–4 hours across multiple sessions. May span a day.
- 🏢 Multi-day — Multiple sessions over several days.
- 🌙 Overnight — Can run autonomously while Louis sleeps or works.
- 👤 Louis only — Requires Louis's direct action (no Claude Code).

**Execution mode key:**
- 🧠 ULTRAPLAN — Use `/ultraplan` in Claude Code. Best for: multi-file changes, multi-system integration, complex architecture, anything where planning before execution matters.
- ⚙️ STANDARD — Regular Claude Code session (Sonnet). Best for: small isolated fixes, single-file changes, simple wiring tasks.
- 🎯 CLAUDE CHAT — Design and planning work done in conversation with Claude (Opus). Best for: system prompts, architecture decisions, creative direction, schema design. Produces specs that feed into Claude Code sessions.

**Default rule:** If a task is 🔧 Medium or larger AND involves code, it should use 🧠 ULTRAPLAN unless there's a specific reason not to.

**Parallel track indicators:**
- 🔴 SEQUENTIAL — Must wait for prior phase to complete
- 🟢 PARALLEL — Can run alongside other marked phases
- 🟡 PARTIAL — Some tasks parallel, some sequential (details in phase)

**Codex pre-validation workflow (for all 🧠 ULTRAPLAN tasks):**
1. Run `/ultraplan` → get the implementation plan back
2. Copy the plan into Codex with this prompt: *"Here's an implementation plan for [X]. What will break? What edge cases aren't handled? What assumptions is this plan making? What's missing?"*
3. Codex flags issues
4. Feed flags back into the Claude Code session before execution begins
5. Claude Code builds from the pre-validated plan

This shifts validation LEFT — catching bad assumptions at the plan stage instead of the code stage. Especially valuable for overnight runs where Louis can't intervene.

**Adversarial review standard for money-moving code:** Three rounds of Codex adversarial review before Claude Code builds any feature that touches money (payments, wallet operations, billing). Each round finds real blockers the previous round missed.

---

## Critical Path

The critical path is the shortest sequence of dependent work items from today to launch. Everything not on this path can run in parallel without delaying launch.

```
Phase 0: Supabase Schema + Auth + Stripe
         ↓
    ┌────┴────┐
    ↓         ↓
Phase 1     Phase 2
Thumper     Site Template    ← PARALLEL
Core        (4 pages)
    ↓         ↓
    └────┬────┘
         ↓
Phase 3: Trade Board + Jewelry DB
         ↓
Phase 4: Calendar + Automation
         ↓
Phase LP: Lindsey Prototype Validation
         ↓
Phase 5: SMS/Email Automation
         ↓
Phase 6: Rep Dashboard (full dual-interface)
         ↓
Phase 7: AI Photo Enhancement Pipeline
         ↓
Phase 8: Onboarding Pipeline + Landing Page
         ↓
Phase 9: SEO/GEO Layer
         ↓
Phase 10: Live Reveal Queue Chrome Extension (independent — can run any time)
         ↓
Phase 11: Integration Testing + Polish
         ↓
PL: Pre-Launch Checklist
         ↓
🚀 LAUNCH
```

**Lindsey Prototype** is the critical validation gate. It pulls from Phases 0, 1, 2 (partial), and 3. If Lindsey can run a live show and manage trades through Thumper without needing Louis, the concept is validated. If she struggles, we learn where the friction is before building the rest.

---

## Core Business Rules

These are platform-wide rules that constrain every feature. Built into the architecture, not tacked on.

**Trade request model:** ONE REQUEST PER PIECE AT A TIME. First-come first-served. Piece disappears completely from board when pending. Reappears if rejected. No second customer can request a piece while one request is pending. Enforced atomically via `rpc_submit_trade_request`.

**Trade type:** One-for-one trades only. No purchases. No cash transactions at launch. Rep is value gatekeeper — accepts or rejects based on whether the offered piece is fair value.

**Development sandbox:** All testing runs on the permanent test rep sandbox account (`testrep@neonrabbit.net`). Lindsey's live site is NEVER touched during development. Lindsey validates by reviewing the test rep site. Real migration via clean onboarding flow after validation passes.

**Brand separation:** Every rep listing displays "Offered by [Rep Name], an Independent Bomb Party Representative." Non-affiliation three-part disclaimer in footer of every page (independent rep, not affiliated with BP corporate, platform built by Neon Rabbit LLC).

**Rep dashboard philosophy (locked April 20/21, 2026):** The rep dashboard is a STATUS layer — reps log in to SEE what's happening (listings, shows, subscribers, wallet balance, billing, analytics). Thumper is the ACTION layer — reps DO things (add a listing, send a blast, cancel a show, edit site content) by talking to Thumper. The dashboard ships with a small set of minimal fallback buttons for core actions so reps aren't locked out of their business when Thumper is on the fritz — but the fallbacks are NOT a feature-complete mirror of Thumper. Status displays and fallback buttons both still call the shared service layer underneath. The rep's mental model: "I want to SEE something → dashboard. I want to DO something → Thumper."

---

## Phase 0 — Foundation: Supabase Schema + Auth + Stripe

**What this builds:** The entire data layer that every other phase depends on. Rep accounts, authentication, RLS policies, all core tables, Stripe subscription/wallet integration.

**Depends on:** Trade board tool schemas (inform table design)

**Parallel tracks:** 🔴 SEQUENTIAL — everything else waits for this

**Estimated time:** 🏗 Large — 3–4 Claude Code sessions over 1–2 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 0.1 | Design complete Supabase schema (all tables, relationships, enums, indexes) | 🔧 Medium | No — needs Louis review | Source of truth: SS_Supabase_Schema_v1_0.md. 16 tables, all enums, RLS policies, Realtime config, seed data, tool cross-reference. |
| 0.1b | Design shared service layer for trade board operations | 🔧 Medium | No — needs Louis review | Source of truth: SS_Service_Layer_Spec_v1_0.md. 4 service files (trade-board, trade-requests, trade-fulfillment, jewelry-database) + types + errors. 12 functions covering all 10 Thumper tools + customer submission + fulfillment queue helper. 3 Postgres RPC functions for atomic operations. Two-layer security (RLS + service validation). |
| 0.2 | Create all tables + RLS policies in Supabase | 🔧 Medium | 🌙 Yes | Includes 3 RPC functions (rpc_submit_trade_request, rpc_approve_trade, rpc_reject_trade), 4 Realtime tables. Partial unique index for one-request-per-piece. GIN index for full-text search. |
| 0.3 | Supabase Auth setup (rep login) | ⚡ Quick | 🌙 Yes | Email/password auth. Three Supabase client utilities: browser, server, admin. Admin policy uses self-referencing subquery (NOT auth.jwt()) to avoid RLS recursion. Credentials in 1Password. |
| 0.4 | Stripe integration — subscription billing | 🔧 Medium | 🌙 Yes | Stripe client library (lazy init, Zod config validation), customer creation (idempotent getOrCreate), Checkout Session API, webhook handler with idempotency via `stripe_events` table (PK is `id`, storing the Stripe event ID directly), portal session, subscription status, pro-rata refund with state machine (refund_operations table). All non-webhook routes derive repId from cookies. Webhook reads `session.metadata.rep_id` to wire new subscriptions to the correct rep — metadata key is `rep_id`, NOT `rep_user_id`. |
| 0.5 | Stripe integration — SMS wallet | 🧠 ULTRAPLAN | 🌙 Yes | Money-safety complexity — requires 3 rounds of Codex adversarial review before build. INTEGER cents (not DECIMAL) with fail-loud pre-validation. Enum split: adjustment → credit/debit, plus auto_recharge. sms_wallet lock fields (auto_recharge_pending + attempt_id). Partial unique index on stripe_payment_intent_id. 3 RPCs (deduct_wallet_balance, credit_wallet, release_wallet_recharge_lock) — SECURITY DEFINER, service_role-only grants. Atomic deduction (9 cents). Auto-recharge via after() with 30-minute stale lock recovery. Wallet load route (card-only checkout, minimum from DB). Real balance_transaction.fee (NULL if unavailable). |
| 0.6 | Seed data for test rep sandbox | ⚡ Quick | 🌙 Yes | Permanent test rep account. Idempotent seed script. Data across 10 tables: reps, site_settings, sms_wallet, subscriptions, onboarding_status, collections, jewelry_designs (real BP item numbers), trade_listings, calendar_events, rep_notes. |

### Test Gate 0

Before moving to Phase 1:
- [ ] All tables exist with correct relationships
- [ ] RLS policies verified — rep can only see own data, admin sees all
- [ ] Auth flow works — can create rep account + log in
- [ ] Stripe webhook fires on test subscription → Supabase record updates
- [ ] SMS wallet balance can be loaded and deducted via test transaction
- [ ] Test rep seed data is in place and queryable

---

## Phase 1 — Thumper Core Engine

**What this builds:** The chatbot conversation engine — Claude API integration, streaming responses, basic tool-calling infrastructure, conversation UI, rep notes memory.

**Depends on:** Phase 0 complete (Thumper needs tables to act on)

**Parallel tracks:** 🟢 PARALLEL with Phase 2 (site template) — different codebases, same deployment

**Estimated time:** 🏗 Large — 3–5 Claude Code sessions over 2–3 days

**Deployment model (locked April 21, 2026):** push-to-main auto-deploy to production. No feature flag. No dev branch. Reps don't know `/thumper` exists until launch — the URL isn't discoverable, no dashboard page links to it. Spike work shipped to production at `/spike` with no issue under this model.

**Guardian + Enforcer structural hooks (locked April 21, 2026):** Task 1.1 adds the database tables and one endpoint that future Guardian and Enforcer agents will read. Agents themselves are post-launch work (see Parking Lot → Agent Layers). Hooks are cheap to build now, expensive to retrofit.

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 1.0 | Vertical-slice spike at `/spike` (architecture validation) | 🏗 Large | 🌙 Yes (autonomous build) | **COMPLETE April 20, 2026** (commit 8c8ea32). End-to-end spike: `/api/thumper/spike` route, two tools (`list_my_trade_board`, `remove_listing`), full tool-calling loop, prompt caching, HITL approve/reject with `approval_events` replay ledger, 7-attack red-team suite, cost benchmark infrastructure. Validated: useChat approval state mutates on assistant message (transport accepts full messages array), ownership probe requires admin client (one exception), 4096 token cache floor works on Haiku 4.5, atomic persistence pattern. Findings doc: `SS_Phase1_Spike_Findings_v1.0.md` in repo root. Informs Task 1.1 scope. |
| 1.1 | Promote spike to production `/thumper` route (route hardening, 0 new tools) | 🔧 Medium | 🌙 Yes | **SCOPE LOCKED April 21, 2026.** No new tool surface — `list_my_trade_board` + `remove_listing` carry over from spike. What ships: (1) `/spike` → `/thumper` route promotion (delete spike route + harness on ship), (2) Real Thumper system prompt (~4500 tokens, replaces TEST_PAD placeholder — encodes three-tier escalation from tool inventory), (3) Production UI surface per approved Claude Design mockups — desktop right-column (Gemini-in-Drive pattern), mobile floating bubble → expanded modal, globally available across dashboard pages, (4) `probeConversationOwner` helper (admin-client ownership check wrapped in one named helper), (5) Abort-mode regression tests (tab-close, network-drop, server-kill), (6) Attack #5 live verify (poisoned rep_notes red-team with real model loop), (7) `x-thumper-run-id` correlation header on response for benchmark matching, (8) **GUARDIAN structural hooks:** `thumper_incidents` table, `/api/thumper/health` endpoint, `tool_executions` telemetry table, (9) **ENFORCER structural hooks:** `auth_events` table, tool-call audit log, `trade_action_audit` table, `sms_email_blast_audit` table schema (no tool using it yet — schema only). Review pipeline: Chat self-review → Codex adversarial review round 1 → apply findings → Codex round 2 → apply → Louis fires. Rule 17 (no UI without design approval) governs — Claude Design mockup approval gates Code prompt writing. |
| 1.2 | Thumper system prompt — refinement pass | 🔧 Medium | No — needs Louis review | Opus session in Claude Chat. Task 1.1 ships a first-draft system prompt. Task 1.2 refines: persona tuning, scope lock (10 allowed domains) verification, warm redirect script tightening, trade board AI notice review, non-affiliation disclaimer verification, content screening rule tuning, personality calibration (concise/warm/plain language). Only fires after 1.1 ships and real rep-ish conversations expose prompt weaknesses. |
| 1.3 | Thumper conversation UI (desktop-optimized) | 🔧 Medium | 🌙 Yes | Desktop-width browser optimized. Text input + streaming response display. Message history within session. Persistent chat field. Camera button (opens lightbox webcam as default, device camera as fallback) + gallery/upload button (multi-select for bulk). Camera source detection via MediaDevices API — lightbox USB webcam is default, "Switch to device camera" as fallback link. Camera source stored in rep profile. Clean, minimal — not a full dashboard. |
| 1.4 | Thumper tool infrastructure | ⚡ Quick | 🌙 Yes | Vercel AI SDK tool-calling framework. Tool registration pattern. Error handling (three-tier: retry / explain / auto-escalation ticket). |
| 1.5 | Thumper trade board tools | 🔧 Medium | 🌙 Yes | Implement 10 tools. All call the shared service layer (Task 0.1b). Tools: (1) add_listing — flexible input (item number OR label photo OR both), single + batch mode, three entry points, canonical photo fallback, (2) get_my_board — rep's board with filters/sorting/summary stats, (3) remove_listing — soft-remove with pending request auto-cancel warning, (4) get_trade_requests — incoming request inbox with MSRP match flagging, (5) approve_trade — creates trade_fulfillment record, auto-cancels other pending requests for same listing, (6) reject_trade — piece reappears on board, (7) search_jewelry_database — full catalog search with is_on_my_board flag and aggregate stats only (no rep identification), (8) update_listing — partial update of trade prefs/photo/notes, (9) get_trade_history — completed/denied/cancelled with summary analytics, (10) update_fulfillment_status — 3-status pipeline (approved → shipped → completed) with add_to_board option on completion. |
| 1.6 | Thumper calendar tools | ⚡ Quick | 🌙 Yes | add_calendar_event, update_event, cancel_event, get_my_shows, get_upcoming_shows. |
| 1.7 | Thumper site customization tools | ⚡ Quick | 🌙 Yes | update_banner_text, update_ticker_text, toggle_banner, toggle_ticker, update_tagline, swap_hero_image. |
| 1.8 | Thumper SMS/email tools | ⚡ Quick | 🌙 Yes — after Phase 5 | send_sms, compose_email, get_wallet_balance, get_send_history. Stubs until Phase 5 wires providers. |
| 1.9 | Thumper memory — rep notes table | ⚡ Quick | 🌙 Yes | End-of-conversation summary write. Next conversation loads recent notes. Simple chronological text — no vector search at launch. |
| 1.10 | Thumper model routing | ⚡ Quick | 🌙 Yes | Haiku 4.5 default. Sonnet 4.6 escalation for: content screening, complex scheduling, onboarding flows. Classification logic. |

### Test Gate 1

Before moving to Phase 3 (trade board):
- [ ] Can send a message to Thumper and receive a streaming response
- [ ] Thumper stays in scope — off-topic requests get warm redirect
- [ ] At least one tool works end-to-end (e.g., add_calendar_event creates a row in Supabase)
- [ ] Thumper memory works — notes saved at end of conversation, loaded at start of next
- [ ] Three-tier error handling works — bad input gets a friendly explanation, not a crash
- [ ] Thumper identifies itself correctly (NR assistant, not BP, not an appraiser)
- [ ] Content screening catches at least one prohibited phrase ("financial freedom")

---

## Phase 2 — Site Template (4 Pages + Design System)

**What this builds:** The rep-facing website — all 4 pages, global header/footer, design system, template styling, custom domain routing.

**Depends on:** Phase 0 complete (site pulls rep data from Supabase)

**Parallel tracks:** 🟢 PARALLEL with Phase 1 (Thumper) — different concerns, same deployment

**Estimated time:** 🏢 Multi-day — 5–8 Claude Code sessions over 3–5 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 2.1 | Design system — templates, fonts, colors, button/card standards | 🔧 Medium | No — needs Louis review | Opus session in Claude Chat. Define 4–5 launch templates. Gradient buttons, neon glow cards, hover/tap animations. Must look 2028, not 2010. Frontend Design skill REQUIRED. |
| 2.2 | Global header — banner + ticker + nav | 🔧 Medium | 🌙 Yes | Sticky. Dismissible banner, scrolling ticker, black header bar. Data from Supabase (rep controls via Thumper). |
| 2.3 | Global footer — brand + links + disclaimers | ⚡ Quick | 🌙 Yes | Three columns + bottom bar. Non-affiliation disclaimer (three-part framework from L3). "Powered by" link to yoursparklesuite.com. |
| 2.4 | Homepage — hero + all sections | 🏗 Large | Partial | Hero with animation, streaming buttons. "What is a Bomb Party?" card + TikTok embed. "Never Miss a Show!" signup form (unchecked consent boxes). Trade board placement (layout TBD). |
| 2.5 | About page — bio cards + media | 🔧 Medium | 🌙 Yes | Three alternating bio cards (text/image layout). "Follow the Journey" media section. NR-written copy per rep. |
| 2.6 | Join Team page — grid + benefits + FAQ | 🔧 Medium | 🌙 Yes | Team member grid (scaling cards). Six locked benefit cards. Six locked FAQ questions with customizable answers. Final CTA. Hidden from nav if rep opts out. |
| 2.7 | Unicorns & Diamonds / FAQ page | 🏗 Large | Partial | Three value tier cards (all locked). 36 FAQ questions across 5 accordion categories. All locked template copy with dynamic rep data swaps. Push-update architecture (NR updates once → all sites update). |
| 2.8 | Custom domain routing | 🔧 Medium | 🌙 Yes | Host-based detection in Next.js. Custom domains forward to rep's location within deployment. Dynamic data loading per hostname. |
| 2.9 | Responsive / mobile-first pass | 🔧 Medium | No — needs Louis phone testing | Every page tested on mobile. Cards stack vertically. Hamburger menu. Touch targets. Scrollable pill filters. |
| 2.10 | Template variable system | ⚡ Quick | 🌙 Yes | Rep name, business name, team name, shop link, streaming links, social handles — all pulled from Supabase profile and injected into template copy automatically. |

### Test Gate 2

Before Lindsey prototype:
- [ ] All 4 pages render correctly on desktop and mobile
- [ ] Template variable swaps work — rep name, business name, links all populate correctly
- [ ] Hero image animations work (zoom, pan)
- [ ] Header banner and ticker can be toggled on/off via Supabase data
- [ ] Footer disclaimers display correctly
- [ ] TikTok embed loops without showing competitor suggestions
- [ ] "Never Miss a Show!" form submits to Supabase
- [ ] Custom domain routing resolves correctly
- [ ] At least one template skin looks polished and professional (Louis approval)

---

## Phase 3 — Trade Board + Jewelry Database

**What this builds:** The trade board (most demanded feature), jewelry database (proprietary data asset), customer trade request form, live show trade flow, filtering system.

**Depends on:** Phase 0 complete (tables exist), Phase 1 partial (Thumper tools for trade board)

**Parallel tracks:** 🟡 PARTIAL — filtering UI can parallel with Thumper tool wiring

**Estimated time:** 🏗 Large — 4–6 Claude Code sessions over 2–3 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 3.1 | Trade board listing display | 🔧 Medium | 🌙 Yes | Grid/list view of rep's available pieces. Each listing shows: photo, collection, type, material, MSRP, rarity tags. Brand separation label per listing. |
| 3.2 | Filtering system | 🔧 Medium | 🌙 Yes | Collection (scrollable/searchable), jewelry type, material, MSRP range, rarity tags (unicorn, diamond), size. Mobile: horizontal pill bars for primary filters, expandable panel for secondary. Extensible by design. |
| 3.3 | Customer trade request form | ⚡ Quick | 🌙 Yes | Three elements: customer name, description of their revealed item, submit button. No MSRP field. No photo upload. Intentionally simple. |
| 3.4 | Trade request submission flow | 🔧 Medium | 🌙 Yes | On submit: requested piece disappears from board COMPLETELY (not visible with label — gone). Uses rpc_submit_trade_request for atomic insert + status change. "I Want This" button only renders when listing status is "available". Supabase Realtime broadcasts status change so other viewers see piece disappear instantly. Clickwrap at point of request. |
| 3.5 | Thumper trade notification + approve/deny | 🔧 Medium | 🌙 Yes | Real-time notification in Thumper conversation. Rep can ask follow-up questions about their board. Approve = piece gone permanently. Deny = piece reappears. Quick-action buttons. |
| 3.6 | Clickwrap at point of listing | ⚡ Quick | 🌙 Yes | Rep certifies ownership and MSRP accuracy before listing. Cannot proceed without checking. |
| 3.7 | "Add a piece" flow via Thumper | 🔧 Medium | 🌙 Yes | Three entry points: (1) type item number, (2) upload label photo (OCR extracts item number), (3) both. System resolves what it can, only asks for missing info. If design found + collection populated → list immediately with canonical photo. If found + collection missing → ask for collection. If not found → request full label info + piece photo. Batch mode: upload multiple labels, system sorts into ready/need-collection/need-full-info buckets. Camera button in Thumper UI for lightbox webcam capture. Dashboard equivalent: "Add to Board" (single) + "Bulk Add" (multi drag-and-drop) forms. |
| 3.8 | Dedup matching logic | ⚡ Quick | 🌙 Yes | BP item numbers are structured: two-letter type prefix (RG/NK/ER/ST/BR) + 5 digits. Simple exact match on item_number field. No fuzzy matching needed. Rep always confirms — not fully automated. Collection NOT on label — Thumper asks rep when missing. |
| 3.9 | Post-show batch processing | ⚡ Quick | 🌙 Yes | Thumper walks rep through pending items after show ends. "You have 3 new pieces to catalog and 2 trades to finalize." |
| 3.10 | Trade fulfillment work queue | 🔧 Medium | 🌙 Yes | Post-approval pipeline. Approved trades land in work queue with 3-status progression: approved → shipped → completed. Rep moves trades through with status buttons. On "Complete Trade," Thumper offers to add received piece to board via add_listing. Completed trades move to permanent trade history. Thumper nudges: 3+ days at approved, 5+ days at shipped. One-way shipping only — rep ships board piece to customer, rep already has customer's revealed piece. |

### Test Gate 3

Before Lindsey prototype validation:
- [ ] Trade board displays listings with all fields and filters working
- [ ] Customer can submit a trade request and the piece disappears
- [ ] Thumper receives trade notification with full details
- [ ] Rep can approve (piece gone) or deny (piece reappears) via Thumper
- [ ] Clickwrap works at both listing and request points
- [ ] "Add a piece" flow creates correct records in all three tables
- [ ] Dedup check finds existing designs when they exist
- [ ] Filtering works on mobile (pill bars, expandable panel)
- [ ] Brand separation labels display on every listing

---

## Phase 4 — Event Calendar

**What this builds:** The native calendar system that replaces Google Calendar dependency. Thumper-managed, powers homepage show cards and pre-show reminders.

**Depends on:** Phase 0 (tables), Phase 1 partial (Thumper calendar tools)

**Parallel tracks:** 🟢 PARALLEL with Phase 3 — independent feature

**Estimated time:** 🔧 Medium — 2 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 4.1 | Calendar CRUD via Thumper | ⚡ Quick | 🌙 Yes | Tools already defined in Phase 1.6. Wire to Supabase: create, update, cancel events. Event data: name, date/time, streaming platform, special message, discount codes, featured collections. |
| 4.2 | Homepage show cards (next two events) | 🔧 Medium | 🌙 Yes | Pull next two upcoming events. Display in viewer's local timezone. Discount codes in ALL CAPS bubbles (tap to copy). Featured collection links. Streaming buttons. "Add to Calendar" one-way export. Dynamic: new show slides in, furthest drops off. Cancelled show = next two backfill. |
| 4.3 | Pre-show SMS reminder trigger | ⚡ Quick | After Phase 5 | Calendar event triggers automated SMS to subscriber list at configurable time before show. Stubs until Phase 5 wires Telnyx. |

### Test Gate 4

- [ ] Can create/update/cancel events via Thumper
- [ ] Homepage shows exactly the next two upcoming events
- [ ] Event times display in viewer's local timezone (not rep's)
- [ ] Discount codes copy to clipboard on tap
- [ ] "Add to Calendar" generates correct .ics download
- [ ] Dynamic behavior: adding an impromptu show updates the display

---

## Phase LP — Lindsey Prototype Validation

**What this builds:** Nothing new — this is a TEST GATE using Phases 0, 1, 2 (partial), 3, and 4.

**Depends on:** Test Gates 0, 1, 3, and 4 passing. Phase 2 needs at least homepage + header/footer working.

**Parallel tracks:** 🔴 SEQUENTIAL — this is a decision gate

**Estimated time:** 👤 Louis + Lindsey — 1–2 live shows worth of testing

**Testing approach:** All testing runs on the permanent test rep sandbox account. Louis acts as the rep. Lindsey's live Readdy.ai site is NEVER touched during development. Lindsey validates by reviewing the test rep site and confirming "this is what my site should look like." Real migration to Lindsey's account happens via clean onboarding flow after validation passes.

### Prototype Scope

- Trade board page with full filtering
- Thumper as rep-facing interface (add pieces, receive trade notifications, approve/reject)
- Customer-facing "I want this" trade request form
- Real-time trade notifications through Thumper during live shows
- Homepage with show cards (calendar)
- Global header/footer with disclaimers
- Thumper memory (notes persist between conversations)

### What's NOT in the Prototype

- Full dashboard (Thumper replaces admin panel)
- AI photo enhancement (reps upload directly)
- Deduplication (database starts empty)
- Multi-rep features
- Full library view
- Voice interface
- SMS/email automation
- Onboarding pipeline

### Validation Criteria

- [ ] Louis (as test rep) can add a piece to the trade board via Thumper without help
- [ ] During a simulated show, a customer can submit a trade request and Louis sees it in Thumper
- [ ] Louis can approve/deny trades without breaking flow
- [ ] Thumper stays in scope — no confusing responses, no hallucinated trade info
- [ ] Post-show batch processing works — Thumper walks through remaining items
- [ ] The two-device setup works (phone for stream, laptop for Thumper + Wispr Flow)
- [ ] Lindsey reviews the test rep site and confirms it matches her expectations
- [ ] Lindsey's feedback: what's confusing, what's missing, what's broken

### Decision After Prototype

| Result | Action |
|--------|--------|
| ✅ Validated — Lindsey runs shows smoothly | Proceed to Phases 5–11. Build the rest. |
| ⚠️ Friction — specific issues identified | Fix issues, re-test. Do NOT proceed until validated. |
| ❌ Concept problem — fundamental UX failure | Pause. Redesign session. Reassess before investing more build time. |

---

## Phase 5 — SMS/Email Automation

**What this builds:** Full messaging system — Telnyx SMS, Resend email, wallet billing, content screening, send caps, customer opt-in.

**Depends on:** Phase LP validation (don't build messaging for a product that isn't validated), Phase 0 (wallet tables), Phase 1 (Thumper tools)

**Parallel tracks:** 🟢 PARALLEL with Phase 6 (dashboard) — independent systems

**Estimated time:** 🏗 Large — 3–4 Claude Code sessions over 2 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 5.1 | Telnyx SMS integration | 🔧 Medium | 🌙 Yes | Send SMS via Telnyx API. $0.009/msg deduction from wallet per send. Hard stop if wallet empty. |
| 5.2 | Resend email integration | ⚡ Quick | 🌙 Yes | Email via Resend. Included in subscription — no wallet deduction. |
| 5.3 | Wallet deduction + balance enforcement | 🔧 Medium | 🌙 Yes | Atomic deduction via deduct_wallet_balance RPC (Phase 0.5). Block sends when balance insufficient. |
| 5.4 | Content screening (FTC-prohibited phrases) | 🔧 Medium | 🌙 Yes | Thumper screens drafted SMS/email before send. Prohibited phrases list from Legal Sprint L2. Block + explain to rep. |
| 5.5 | Send cap enforcement | ⚡ Quick | 🌙 Yes | 1 automated pre-show reminder per show. 3 manual texts/week. 3 manual emails/week. Thumper enforces — "You've hit your weekly text limit." |
| 5.6 | Customer opt-in forms (TCPA compliant) | ⚡ Quick | 🌙 Yes | Unchecked boxes. Marketing consent separate from transactional. STOP keyword handling. Data → Supabase → rep's customer list. |
| 5.7 | Pre-show SMS reminder (wire to calendar) | ⚡ Quick | 🌙 Yes | Connect calendar trigger (Phase 4.3 stub) to actual Telnyx send. Configurable timing. |

### Test Gate 5

- [ ] SMS sends and deducts from wallet correctly
- [ ] Wallet blocks sends when empty — no negative balance
- [ ] Content screening catches prohibited phrases before send
- [ ] Send caps enforce correctly — Thumper blocks excess sends with friendly message
- [ ] Email sends via Resend (no wallet deduction)
- [ ] Opt-in form works with unchecked boxes
- [ ] Pre-show reminder fires at correct time before scheduled show
- [ ] STOP keyword unsubscribes customer

---

## Phase 6 — Rep Dashboard

**What this builds:** The rep's full dashboard — trade board status view, jewelry library, trade fulfillment queue, messages/notifications, calendar, analytics, account management. Per locked design philosophy (April 20/21, 2026): dashboard is a STATUS layer (see what's happening), Thumper is the ACTION layer (do things). Phase 6 pages ship with minimal fallback buttons for core actions (enough to keep reps unblocked when Thumper is on the fritz) but NOT a feature-complete mirror of Thumper's capabilities. Status displays and fallback buttons both still call the shared service layer. Per-page STATUS/fallback-button split deferred to Phase 2 mapping session (tracked in open_item b509b615).

**Depends on:** Phase LP validation, Phases 3–5 producing data to display

**Parallel tracks:** 🟢 PARALLEL with Phase 5 — reads and writes data via shared service layer

**Estimated time:** 🏗 Large — 4–6 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 6.1 | Dashboard layout + navigation + information architecture | 🔧 Medium | No — needs Louis review | Desktop-first. Trade board is DEFAULT LANDING PAGE (home screen on login). Nav structure: Trade Board (home), Jewelry Library, Calendar, Messages, Site Settings, Help & Resources, Account. Thumper persistent chat field accessible from every page. Frontend Design skill REQUIRED. |
| 6.2 | Trade board home view (full management) | 🔧 Medium | 🌙 Yes | NOT read-only — full management controls. Summary bar (total pieces, total MSRP, pending request badge). Listing grid with photos, details, quick-action buttons (edit, remove, view requests). Filter bar: collection, type, material, MSRP range. Sort toggle. "Add to Board" button (single + bulk). All actions call shared service layer. |
| 6.3 | Trade request inbox (slide-out panel or tab) | 🔧 Medium | 🌙 Yes | Within trade board view — rep never leaves board context. Pending requests with customer name, description, MSRP comparison. Prominent Approve and Deny buttons per request. Notification badge count. |
| 6.4 | Trade fulfillment work queue | 🔧 Medium | 🌙 Yes | Approved trades pipeline. Each card shows: customer, piece traded, date approved, current status. Status progression buttons: "Mark Shipped" (with tracking field), "Complete Trade" (with "Add received piece to board?" checkbox). Completed trades move to trade history. |
| 6.5 | Trade history view | ⚡ Quick | 🌙 Yes | Searchable record of completed/denied/cancelled trades. Filters: date range, customer, collection, status. Summary stats header. Expandable rows for full details. |
| 6.6 | Jewelry Library (browse/search all designs) | 🔧 Medium | 🌙 Yes | Full searchable catalog of all known BP designs across platform. Browse by collection, type, material, MSRP, stone. "Add to My Board" button per design (calls add_listing with known item_number). Aggregate stats only — no individual rep identification. is_on_my_board flag grays out already-listed pieces. |
| 6.7 | Help & Resources library | 🔧 Medium | Partial — content needs writing | How-to guides, Thumper tips, trade board best practices, show setup (phone + laptop + lightbox/camera), platform tutorials, FAQ. Searchable by topic. Thumper links to articles when answering rep questions. NR-written, push-update model. |
| 6.8 | Messages / Notifications section | 🔧 Medium | 🌙 Yes | Three purposes: (1) Monthly report + newsletter delivery, (2) Rep-to-NR communication channel (backup to Thumper), (3) NR-to-rep announcements. Read/unread tracking. Notification badge in nav. |
| 6.9 | Show calendar view | ⚡ Quick | 🌙 Yes | Visual calendar of upcoming/past shows. Read-only — actions via Thumper. |
| 6.10 | Audience/customer list | ⚡ Quick | 🌙 Yes | Subscriber list with opt-in status. Read-only. |
| 6.11 | SMS wallet balance + billing tracker | ⚡ Quick | 🌙 Yes | Current balance (prominent). Messages sent this month. Running dollar amount. Reference cost table. Reload history. |
| 6.12 | Site analytics (PostHog integration) | 🔧 Medium | 🌙 Yes | PostHog embed or custom charts. Page views, visitor count, popular pages, traffic sources, mobile vs desktop. PostHog flags: disable IP capture, ph-no-capture on sensitive inputs, mask session replay text inputs, link user IDs after login only. Data feeds into monthly report. |
| 6.13 | Site settings | ⚡ Quick | 🌙 Yes | Template, branding, banner/ticker toggles, profile info. Updates via shared service layer (same as Thumper site customization tools). |
| 6.14 | Account / billing | ⚡ Quick | 🌙 Yes | Subscription status (single tier: Monthly — cancel anytime), payment method, billing history. No plan tier selector — pricing is monthly-only forever per April 19, 2026 pricing decision. Self-service cancellation button (Click-to-Cancel compliant). |

### Test Gate 6

- [ ] Dashboard loads with trade board as home screen — first thing rep sees on login
- [ ] All trade board actions work from dashboard: add listing, remove, edit, approve trade, deny trade
- [ ] Dashboard actions produce identical results to Thumper actions (shared service layer)
- [ ] Jewelry Library shows designs with accurate aggregate stats and "Add to My Board" works
- [ ] Trade fulfillment queue shows approved trades and status progression works
- [ ] Messages section displays test notification with read/unread tracking
- [ ] Thumper is accessible from every dashboard page
- [ ] PostHog tracking fires correctly with privacy flags in place
- [ ] Mobile dashboard is usable (not necessarily optimized — desktop-first)
- [ ] Camera button works on mobile (opens device camera) and desktop (opens lightbox webcam if connected)

---

## Phase 7 — AI Photo Enhancement Pipeline

**What this builds:** The two-layer photo quality system — Thumper pre-flight check + Photoroom API processing + backend QA inspector.

**Depends on:** Phase 1 (Thumper), Phase 3 (jewelry database to store results), photography kit decision (informs onboarding flow)

**Parallel tracks:** 🟢 PARALLEL with Phases 5–6 — independent system

**Estimated time:** 🔧 Medium — 2–3 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 7.1 | Thumper pre-flight check (Layer 1) | 🔧 Medium | 🌙 Yes | Evaluate submitted photo for minimum viability before Photoroom. Check: lighting, subject visibility, resolution, blur. Kick back with coaching if not good enough. Helpful tone, not robotic rejection. |
| 7.2 | Photoroom API integration | 🔧 Medium | 🌙 Yes | Background removal. Relighting for bad lighting. REST API. Sub-1-second latency. Handle complex shapes (chains, transparent stones). Claid as backup vendor. |
| 7.3 | Backend QA inspector (Layer 2) | 🔧 Medium | Needs design session first | Evaluate Photoroom output before database entry. Confidence scoring, flagging system. Low-quality outputs held, not auto-approved. Details TBD — needs dedicated design session. |
| 7.4 | Photography kit standardization | 👤 Louis only | Ongoing | Three-tier kit model: (1) lightbox only (rep has own camera), (2) lightbox + NR-recommended USB webcam, (3) fallback to phone camera. Thumper screens camera quality during onboarding via vision evaluation of test photo. Affects Phase 8 onboarding. |

### Test Gate 7

- [ ] Pre-flight check correctly rejects obviously bad photos with helpful feedback
- [ ] Pre-flight check passes acceptable photos through to Photoroom
- [ ] Photoroom returns enhanced images with clean background removal
- [ ] QA inspector catches low-quality Photoroom outputs before database entry
- [ ] End-to-end: rep submits photo via Thumper → pre-flight → Photoroom → QA → database entry
- [ ] Photography kit decision made

---

## Phase 8 — Onboarding Pipeline + Landing Page

**What this builds:** The full rep onboarding flow from first contact to live site. Plus the rep-facing landing page at yoursparklesuite.com. This phase deploys four autonomous agents (Scout, Scribe, Builder, Wordsmith) plus binary automations for payment gates and fulfillment.

**REFERENCE:** Full agent architecture, memory model, and design philosophy documented in SS_KB_Agents_v1.0.md. Upload that file alongside this plan for any Phase 8 work.

**Pre-build requirement:** Each agent needs a dedicated Opus design session for its system prompt, tool definitions, and guardrails BEFORE Claude Code builds it.

**Depends on:** Phases 1–7 all working (onboarding triggers the entire platform)

**Parallel tracks:** 🟡 PARTIAL — landing page can start earlier (Phase 2 timeframe)

**Estimated time:** 🏢 Multi-day — 6–8 Claude Code sessions over 4–5 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 8.1 | Rep-facing landing page (yoursparklesuite.com) | 🔧 Medium | 🌙 Yes | Unified page: landing page + login/signup integrated. Informational, not salesy. Branding/colors/copywriting carried over from existing neonrabbit.net/sparklesuite page. Login wired to Phase 0 Supabase Auth. Demo video placeholder. Intake form. Waitlist Thumper. Can start as early as Phase 2. Customer-facing home page is PARKED post-launch. |
| 8.2 | Waitlist system | ⚡ Quick | 🌙 Yes | Thumper on landing page captures prospective rep info. Supabase storage. Automated email sequence keeps warm. First come first served at launch. |
| 8.3 | Intake form + Thumper pre-qualification | 🔧 Medium | 🌙 Yes | Rep submits interest. Thumper asks qualifying questions. Data captured to Supabase. |
| 8.4 | Scout agent — design session | 🔧 Medium | No — 🎯 CLAUDE CHAT (Opus) | System prompt, tool definitions, output format, memory query pattern. See SS_KB_Agents_v1.0 for spec. |
| 8.5 | Scout agent — build | 🔧 Medium | 🌙 Yes | Pre-meeting intel research agent. Runs autonomously when intake form submitted. |
| 8.6 | Google Meet + Gemini transcript hook | 🔧 Medium | Needs research | Gemini transcribes discovery call. Transcript feeds Scribe agent. Integration approach TBD. |
| 8.7 | Scribe agent — design session | 🔧 Medium | No — 🎯 CLAUDE CHAT (Opus) | Transcript parsing rules, field extraction, "needs confirmation" flagging. |
| 8.8 | Scribe agent — build | 🔧 Medium | 🌙 Yes | Post-meeting processing agent. Transcript → structured rep profile. |
| 8.9 | Gate 1 — SignWell agreement with clickwrap audit trail (automation) | 🔧 Medium | 🌙 Yes | IP address, timestamp, document hash captured. Binary automation — not an agent. |
| 8.10 | Gate 2 — Start work fee via Stripe (automation) | ⚡ Quick | 🌙 Yes | Stripe payment link or checkout. Webhook fires → unlocks build. Binary automation. |
| 8.11 | Wordsmith agent — design session | 🔧 Medium | No — 🎯 CLAUDE CHAT (Opus) | Copy style guide, brand voice rules, section-by-section requirements. |
| 8.12 | Wordsmith agent — build | 🔧 Medium | 🌙 Yes | Creative copy generation agent. Produces all personalized site copy from branding data. |
| 8.13 | Builder agent — design session | 🔧 Medium | No — 🎯 CLAUDE CHAT (Opus) | Build steps, self-QA checklist, error handling rules, escalation format. Most complex agent. |
| 8.14 | Builder agent — build | 🏗 Large | 🌙 Yes — primary overnight candidate | Site assembly agent with self-QA. Three-tier error handling. Logs to agent_runs table. |
| 8.15 | agent_runs table (Supabase) | ⚡ Quick | 🌙 Yes | Operational memory table. All four agents log their runs here. Lessons extracted feed into next run's context. |
| 8.16 | Gate 3 — Launch fee via Stripe (automation) | ⚡ Quick | 🌙 Yes | Holds deployment until launch fee clears. Site goes live only after payment confirmed. Binary automation. |
| 8.17 | QR code auto-generation (automation) | ⚡ Quick | 🌙 Yes | Generated automatically during site spin-up. Links to rep's custom domain. Binary automation. |
| 8.18 | Photography kit fulfillment (automation) | ⚡ Quick | 🌙 Yes | Order triggered after Gate 2 clears. Three-tier model: lightbox only (all reps) or lightbox + webcam (if rep needs camera — determined during Thumper onboarding camera screening). Binary automation. |
| 8.19 | Thumper camera setup + quality screening (onboarding step) | ⚡ Quick | 🌙 Yes | During onboarding, Thumper helps rep configure lightbox webcam as default camera. Evaluates test photo via vision. If camera passes: green light. If fails: recommends NR webcam add-on. Stores camera source preference in rep profile. |
| 8.20 | Branding menu | 🔧 Medium | Needs design session | Menu of options rep selects from during onboarding. Template choice, color preferences, hero image direction. Details TBD. |

### Test Gate 8

- [ ] Landing page loads at yoursparklesuite.com with intake form and Thumper
- [ ] Waitlist captures data correctly
- [ ] Scout produces useful intel brief from rep's social handles
- [ ] Scribe extracts structured profile from a test transcript
- [ ] Wordsmith generates quality copy from a test profile
- [ ] Builder assembles a working site and passes its own self-QA
- [ ] Builder's three-tier error handling works (test with deliberately bad input)
- [ ] All four agents log to agent_runs table correctly
- [ ] Full pipeline test: intake → Scout → meeting → Scribe → Wordsmith → Gates → Builder → site live
- [ ] Gate 1 clickwrap generates proper audit trail (IP, timestamp, hash)
- [ ] Gate 2 payment webhook triggers build correctly
- [ ] Gate 3 payment webhook releases site deployment
- [ ] QR code generates and links to correct domain

---

## Phase 9 — SEO/GEO Layer

**What this builds:** Search engine optimization and AI search visibility across all rep sites.

**Depends on:** Phase 2 (site template complete), Phase 8 (custom domain routing working)

**Parallel tracks:** 🟢 PARALLEL with Phase 8 later tasks — SEO is applied on top of working sites

**Estimated time:** 🔧 Medium — 2–3 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 9.1 | Dynamic sitemaps per hostname | ⚡ Quick | 🌙 Yes | Next.js host header detection. Unique sitemap.xml per custom domain. |
| 9.2 | Dynamic robots.txt per hostname | ⚡ Quick | 🌙 Yes | Per-domain robots.txt. |
| 9.3 | Schema markup (structured data) | 🔧 Medium | 🌙 Yes | LocalBusiness (areaServed, geo), VirtualLocation, Event (OnlineEventAttendanceMode), ProfessionalService (brand). Dynamic per rep from Supabase profile. |
| 9.4 | Localized content wrappers (Pages 3 & 4) | ⚡ Quick | 🌙 Yes | Rep name + city injected into otherwise identical pages. Provides domain uniqueness for crawlers. |
| 9.5 | Canonical tags per custom domain | ⚡ Quick | 🌙 Yes | Independent canonical tags. No cross-domain canonical issues. |
| 9.6 | ISR/SSG/SSR rendering strategy | 🔧 Medium | 🌙 Yes | ISR for homepage/About (trade board/calendar freshness). SSG for Pages 3 & 4 (locked content). SSR for dashboard only (not indexed). |
| 9.7 | Markdown for Agents | 🔧 Medium | 🌙 Yes | WASM engine (@kreuzberg/html-to-markdown-wasm). Edge Runtime compatible. Content-Signal header: ai-train=no, search=yes, ai-input=yes. llms.txt per custom domain. |
| 9.8 | BP IDS link on Join Team pages | ⚡ Quick | 🌙 Yes | Bomb Party Income Disclosure Statement linked inline on every Join Team page. Build requirement from Legal Sprint L2. |

### Test Gate 9

- [ ] Each custom domain serves its own sitemap.xml and robots.txt
- [ ] Schema markup validates via Google's Rich Results Test
- [ ] Localized wrappers make Pages 3 & 4 unique per rep
- [ ] ISR revalidation works — trade board changes reflected within configured interval
- [ ] llms.txt serves correct per-domain content
- [ ] BP IDS link appears on Join Team page

---

## Phase 10 — Live Reveal Queue Chrome Extension

**What this builds:** Rebuilt Chrome extension for the Live Reveal Queue — published to Chrome Web Store.

**Depends on:** Nothing — fully independent. Can run parallel with any phase.

**Parallel tracks:** 🟢 PARALLEL — independent workstream

**Estimated time:** 🔧 Medium — 1–2 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 10.1 | Chrome extension rebuild | 🔧 Medium | 🌙 Yes | Bulletproof scraping. No browser refresh issues. No data loop. No observer infinite loop. Background sync only. Easy on/off toggle. |
| 10.2 | Chrome Web Store publication | ⚡ Quick | No — requires manual submission | Clean download, auto-installs. Eliminates sideloading friction for non-technical reps. |
| 10.3 | Deploy to all current clients | ⚡ Quick | 🌙 Yes | Test on Lindsey first. Then deploy to remaining clients. |

### Test Gate 10

- [ ] Extension scrapes BP dashboard correctly (inverted list, first unchecked = current reveal)
- [ ] No browser refresh loop
- [ ] No data loop (rep name not in queue)
- [ ] No observer infinite loop / browser crash
- [ ] Easy toggle on/off
- [ ] Chrome Web Store listing live
- [ ] Works on Lindsey's dashboard
- [ ] Works on Brittany's dashboard

---

## Phase 11 — Integration Testing + Polish

**What this builds:** Nothing new — this is the full end-to-end testing phase. Everything working together as a complete platform.

**Depends on:** All prior phases complete

**Parallel tracks:** 🔴 SEQUENTIAL — final validation

**Estimated time:** 🏢 Multi-day — 2–3 days of testing and fixes

### Test Scenarios

| # | Scenario | What It Tests |
|---|----------|---------------|
| 11.1 | New rep onboarding — full pipeline | Landing page → intake → meeting → agreement → payment → site build → launch |
| 11.2 | Rep daily workflow — between shows | Add pieces to trade board, update calendar, compose SMS, check dashboard |
| 11.3 | Live show — full flow | Pre-show reminder fires, Live Queue updates, customers browse trade board, submit trade requests, Thumper notifies rep, rep approves/denies mid-show, approved trades enter fulfillment queue |
| 11.4 | Post-show workflow | Thumper batch processing, catalog new pieces (single + bulk via lightbox camera), review fulfillment queue, ship board pieces, complete trades, add received pieces to board |
| 11.5 | Dashboard — full dual-interface test | All trade board operations work from dashboard AND Thumper identically. Add listing, remove, edit, approve, deny, fulfillment status updates. Jewelry Library search + add to board. Messages section. Same results from both interfaces (shared service layer). |
| 11.6 | Cancellation flow | Rep cancels subscription, pro-rata refund calculated, site goes offline at month end |
| 11.7 | Multi-rep isolation | Two test reps — verify RLS prevents data leakage between reps |
| 11.8 | Error recovery | What happens when Thumper API is down? When Stripe webhook fails? When Photoroom is slow? |
| 11.9 | Mobile testing | All pages + trade board + signup forms on phone. Louis tests on his actual phone. |
| 11.10 | Non-technical user test | Brittany-level user test. Can someone with IT anxiety navigate the site and understand what they're seeing? |

### Test Gate 11

- [ ] All scenarios pass without critical failures
- [ ] No data leakage between reps (RLS verification)
- [ ] Error handling graceful across all failure modes
- [ ] Mobile experience acceptable (not perfect — desktop-first, but usable)
- [ ] Louis is satisfied with overall polish and professionalism
- [ ] Performance acceptable — pages load fast, Thumper responds quickly

---

## Legal Foundation

All legal research is complete (6 sprints). No language has been drafted — an attorney session is needed before launch. This section captures the key findings and build requirements that came from legal research so they don't get lost.

### Legal Sprints — Summary of Completed Research

| Sprint | Topic | Key Findings |
|--------|-------|-------------|
| L1 | Service agreement framework | Florida auto-renewal statute (Fla. Stat. § 501.165) requires 30–60 day advance notice for annual renewals. 12-month liability cap is industry standard. TCPA burden shifts to rep via indemnification. Thumper AI four-part disclaimer required (as-is, human-in-the-loop, rep responsible, NR not liable for hallucinations). Duval County, Florida venue clause. Start fee is "earned upon payment" — non-refundable. |
| L2 | FTC income claim compliance | "Means and instrumentalities" doctrine is primary FTC risk — NR provides the tool reps use to recruit. Rep warrants FTC + BP compliance. BP Income Disclosure Statement (IDS) link required on every Join Team page (Task 9.8). Prohibited language list for Thumper content screening. BP Policy Section 7.1 still unverified — needs attorney review. |
| L3 | BP trademark usage | Nominative fair use confirmed defensible. No BP logos or trade dress ever. Database photos must come from reps only — never scraped from BP. Non-affiliation three-part disclaimer on every page: (1) independent rep, (2) not affiliated with BP corporate, (3) platform built by Neon Rabbit LLC. |
| L4 | ToS + Privacy Policy | A2P 10DLC registration required before SMS launch (Pre-Launch #1). PostHog privacy flags: disable IP capture, ph-no-capture on sensitive inputs, mask session replay text inputs. Opt-in forms require unchecked boxes enforced at UI level. DPAs needed with all vendors (Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog). Clickwrap enforceability (~70% success) — always use clickwrap, never browsewrap. |
| L5 | Trade board liability | Section 230 protection confirmed — NR is a mere facilitator, not a party to trades. Clickwrap required at both listing and request points in trade board UI (Tasks 3.4, 3.6). IRS barter exchange classification needs attorney opinion before launch. |
| L6 | Cancellation/refund policy | Universal pro-rata refund for unused months, cancel at end of current month, cancel anytime. Forever tier evaluated and ELIMINATED — creates permanent liability, variable AI costs, inactivity risk. Monthly-only pricing (April 19, 2026 decision) means Visa/Mastercard 7-day reminder rule NO LONGER APPLIES — that rule only triggers on 6+ month billing cycles. Visa CE 3.0 chargeback defense requires logging IP addresses, device IDs, usage timestamps from day one. |

### Build Requirements from Legal Research

These are concrete items that must be built into the platform — not just attorney review items:

| Requirement | Source | Where It's Built |
|-------------|--------|-------------------|
| Unchecked opt-in boxes on all forms | L4 | Phase 2.4 (homepage), Phase 5.6 (opt-in forms) |
| Clickwrap at trade listing AND request points | L5 | Phase 3.4, Phase 3.6 |
| BP IDS link on Join Team pages | L2 | Phase 9.8 |
| Non-affiliation three-part disclaimer on every page | L3 | Phase 2.3 (footer) |
| PostHog privacy flags (disable IP, mask inputs) | L4 | Phase 6.12 |
| Thumper content screening for prohibited phrases | L2 | Phase 5.4 |
| Self-service cancellation button (Click-to-Cancel) | L6 | Phase 6.14 |
| Gate 1 clickwrap audit trail (IP, timestamp, hash) | L1 | Phase 8.9 |
| Log IP addresses + device IDs from day one (CE 3.0 defense) | L6 | Phase 0 / PostHog setup |
| STOP keyword handling for SMS | L4 | Phase 5.6 |

### Attorney Session Agenda (8 Items)

Schedule when revenue supports it. All research complete — attorney drafts from the frameworks captured above.

1. **Service agreement framework** (L1) — Full agreement draft from the 9-section structure. Florida auto-renewal compliance, liability cap, TCPA indemnification, Thumper AI disclaimer, venue clause.
2. **FTC rep warranty + indemnification language** (L2) — Specific clause language for rep warranties re: FTC compliance and income claims.
3. **BP Policy Section 7.1 verification** (L2/L3) — Pull actual BP rep agreement, confirm third-party tools are not prohibited. If prohibited, assess risk and mitigation.
4. **Non-affiliation disclaimer language** (L3) — Final three-part disclaimer wording for footer and all brand-adjacent pages.
5. **ToS + Privacy Policy drafting** (L4) — Full documents from the L4 framework. ROSCA compliance, Click-to-Cancel, data handling, AI disclosure.
6. **Trade board disclaimer clauses** (L5) — Mere facilitator language, no warranty on trade fairness, no appraisal endorsement.
7. **IRS barter exchange classification opinion** (L5) — Are peer-to-peer jewelry trades reportable barter transactions? Does NR have 1099-B obligations?
8. **Cancellation policy language review** (L6) — Pro-rata refund policy (monthly billing), billing descriptor review. Annual renewal notice language no longer applicable (monthly-only pricing).

---

## Pre-Launch Checklist (Non-Build Items)

These items are NOT code — they're administrative, legal, and operational tasks that must be complete before going live with paying clients. Status of these items is tracked in `open_items` (NR HQ Open Items panel), not here.

| # | Item | Owner | Blocking Launch? |
|---|------|-------|-----------------|
| 1 | A2P 10DLC registration (TCR) | Louis | YES — carriers block unregistered SMS |
| 2 | Attorney session (8 agenda items — see Legal Foundation section) | Louis | YES — need service agreement + disclaimers before taking money |
| 3 | BP Policy Section 7.1 verification | Louis | YES — pull actual BP rep agreement, check if third-party tools prohibited |
| 4 | Platform subscription pricing decision | Louis + Claude | YES — can't charge without a price |
| 5 | Start fee amount | Louis | YES — need amount for Gate 2 |
| 6 | Launch fee amount | Louis | YES — need amount for Gate 3 |
| 7 | DPAs with vendors | Louis | Recommended — Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog |
| 8 | Incident response protocol (FIPA) | Claude | Recommended — one-page protocol for breach notification |
| 9 | Photography kit standardization | Louis | No — only affects onboarding flow. Three-tier model: lightbox for all, camera flexible. |
| 10 | Business card vendor research | Louis + Claude | No — add-on, not core product |
| 11 | Existing client SEO/GEO retrofit | Claude Code | No — existing Readdy sites, not new platform |
| 12 | Bri's outstanding launch fee | Louis | No — grandfathered client, separate from platform |
| 13 | Kara business card package | Louis | No — client deliverable, not platform |
| 14 | Heather business card follow-up | Louis | No — client deliverable, not platform |

---

## Deferred Research Items

These gaps were identified during the gap analysis arc but explicitly deferred because they don't block the current build. They become relevant at the phases noted below. Tracked individually in `open_items`.

| Topic | Deferred Until | Why Deferred |
|-------|---------------|--------------|
| BP community trade board examples | After Phase 3 (rep trade board built) | Need working product to compare against. Revisit to see how BP's own trade system differs and where SS adds value. |
| Lindsey revenue data | Pre-launch pricing session | TAM resolved (20K–50K active BP reps, revenue model validated at 5–10% penetration). Revisit Lindsey's actual numbers when pricing decisions happen. |
| Business card pipeline | Post-launch | Research sprint needed for vendor, design, pricing. Not blocking anything — add-on product. |
| Thumper capability boundaries | During Phase 1.2 (system prompt) | Test in context of real build. Will surface naturally during system prompt design session — what can Thumper do, what should it refuse, where are the edges? |
| Infrastructure cost modeling | Pre-launch | Build first, model real numbers. Includes Vercel, Supabase, Claude API, Telnyx, Resend, Photoroom, PostHog. Estimate once real usage patterns are visible from prototype testing. |

---

## Grey Area Items (Need Discussion Before Deciding)

These items are acknowledged but need a decision session before they can be built. They don't block anything currently in progress.

- **Platform pricing** (monthly price point) — Louis decision session needed. Monthly-only pricing locked April 19, 2026 — question is what dollar amount, not structure. Informed by TAM data (20K–50K reps, 5–10% penetration target) and Thumper API cost modeling.
- **Start work fee and launch fee amounts** — Louis decision session needed. Affects Gates 2 and 3 in Phase 8.
- **Photography kit pricing tiers** — Lightbox-only vs. lightbox+camera impact on start fee. Needs DUCLUS test results.
- **SMS wallet auto-recharge threshold** — Default set to $5.00, adjustable per rep. Confirm or adjust.
- **Branding menu design** (Phase 8.20) — What template/color/hero options reps select from during onboarding. Design session item.

---

## Parking Lot (Future — Not Blocking)

These items are acknowledged but explicitly deferred to post-launch or later phases. They do not affect current build planning. Items move out of here only when Louis decides to activate them.

### Trade Board Ecosystem (Post-Launch)

- **Unified trade board ecosystem** — Three layers: (1) rep show boards (v1 — building now), (2) non-show marketplace (platform-wide persistent trade board across all reps), (3) social/team layer (rep-to-rep messaging, team board visibility, inventory coordination). All post-launch.
- **Cross-rep trade economics and logistics design session** — Who pays shipping? Revenue splits? Trust/reputation system? Dispute resolution?
- **Sparkle Suite Credits** — Internal credit economy for cross-rep marketplace. Reps buy credits via Stripe, earn credits by cross-listing inventory, spend credits to acquire pieces from other reps, cash out via Stripe. Solves financial friction in cross-rep trades. NOT a stablecoin — standard platform credits pegged to USD. New NR revenue stream via transaction fees.
- **Customer master trade board** (cross-rep browsing — after rep boards working)
- **Rep-to-rep social features and team coordination**

### Trade Board Features (Post-Launch)

- **Monthly Trade Intelligence Report** — Automated monthly report for each rep: trade activity summary, collection insights (hot vs. dead weight), design-level trends, customer patterns (repeat customers, peak times), site analytics (PostHog data), Thumper-generated actionable recommendations. Combined with NR platform newsletter into single dashboard delivery. Within 7 days of month end. Automated generation + human QA before publishing. Delivered via Messages/Notifications section on dashboard, NOT email.
- **Visual similarity matching** for jewelry dedup (Phase 2 when database is large enough)
- **Trade-ups with cash difference** (after basic trades validated)
- **Buying off the trade board** (no cash transactions at launch)
- **Rarity scoring algorithm** (needs volume data — post-launch from accumulated trades)

### Platform Features (Post-Launch)

- **Customer-facing home page for yoursparklesuite.com** — Post-launch. Needs dedicated design session. Build platform so it can integrate with customer-facing side later.
- **B2B content hub** for yoursparklesuite.com (post-launch SEO play)
- **Jewelry database as customer-facing catalog** (P3 priority — future phase)
- **Thumper voice interface** (post-launch, Wispr Flow recommended for now)
- **Vector search for Thumper memory** (simple notes table at launch, upgrade later)
- **Thumper lightweight show mode / floating widget** (UX design during Thumper build phase)
- **Wispr Flow affiliate partnership** (future revenue opportunity)
- **Business cards** (research sprint when ready, not blocking)
- **Seedance 2.0 + Claude Code hero video workflow** (research and test)
- **Thumper as live streaming expert** — Deep knowledge of TikTok Live, Facebook Live, streaming hardware/software, show best practices. Affiliate revenue opportunity for hardware recommendations. System prompt content for Phase 1.2.
- **Fully automated lightbox camera** — Motion detection + image classification to auto-detect new items in lightbox without button press. Post-launch after basic camera button workflow validated.

### Agent Layers (Post-Launch — Structural Hooks Ship in Phase 1 Task 1.1)

Two complementary autonomous agent layers for the Neon Rabbit machine. Both parked for post-SS-launch. Both live inside Neon Rabbit HQ (not new top-level projects — Rule 6 scope lock). Both share the same tiered escalation philosophy (silent auto-fix → alert Louis+Claude → user-facing response) and feed the same unified morning CEO report.

Task 1.1 ships the database tables and health endpoint these agents will read. Agents themselves are not built until after Sparkle Suite launches to paying reps. Full architectural decisions captured in Open Brain: `DECISION LOCKED — Guardian Agents` (April 21, 2026) and `DECISION LOCKED — Enforcer Agents` (April 21, 2026).

**Guardians — defensive / health / maintenance (7 agents planned):**
- **Thumper Guardian** — watches Thumper health (API reachability, tool success rates, error patterns, cost drift); triages and auto-fixes transient failures; first Guardian to build (gates onboarding rep #2).
- **Infrastructure Guardian** — Vercel deploys, Supabase health, Edge Functions, DB connection pool, migration status.
- **Billing Guardian** — Stripe webhooks, failed payments, SMS wallet balances, auto-recharge behavior.
- **Client Site Guardian** — per-rep deployed SS site health, broken images, cert renewals.
- **Integration Guardian** — Telnyx, Resend, SignWell, Cal.com, Live Queue Chrome extension, Stripe, Plaid.
- **Cost Guardian** — Anthropic spend, Supabase bandwidth, Vercel invocations, Telnyx SMS spend, drift from baseline.
- **Security Guardian** — auth failures, RLS integrity, suspicious access patterns.

**Enforcers — offensive / security / fraud-detection (5 agents planned):**
- **Trade Board Enforcer** — fake listings, sock-puppet trade requests, price manipulation, wash trades between colluding reps.
- **Account Security Enforcer** — credential stuffing, account takeover patterns, password spray.
- **Prompt Injection Enforcer** — monitors Thumper conversations at scale for injection attempts and tool-abuse.
- **Abuse Detection Enforcer** — SMS blast abuse, email abuse, content policy violations, TCPA/CAN-SPAM compliance.
- **Platform Integrity Enforcer** — billing fraud, chargeback patterns, subscription abuse.

**Key difference:** Guardians fix known-recoverable entropy (mostly Category 1 autonomous action per Rule 32). Enforcers respond to adversarial humans where false positives have real cost (mostly Category 3 — default to ALERT not ACTION; autonomous action only on high-confidence confirmed threats).

**Structural hooks Task 1.1 ships (cheap now, expensive to retrofit):**

| Hook | Purpose | Consumer |
|------|---------|----------|
| `thumper_incidents` table | Structured error log (timestamp, error_type, rep_id, conversation_id, severity, details JSON, resolved_status) | Thumper Guardian |
| `/api/thumper/health` endpoint | JSON health check (API reachable, DB reachable, recent error rate) | Thumper Guardian, Infrastructure Guardian |
| `tool_executions` table | Per-tool-call telemetry (tool_name, rep_id, conversation_id, success/fail, duration_ms) | Thumper Guardian, Prompt Injection Enforcer |
| `auth_events` table | Every login, logout, login_fail, password_reset, account_create with IP, user_agent, outcome | Account Security Enforcer, Security Guardian |
| `trade_action_audit` table | Every trade board mutation with before/after state hash | Trade Board Enforcer |
| `sms_email_blast_audit` table (schema only) | Blast content hash, recipient count, cost — tools don't ship in 1.1, schema exists for later | Abuse Detection Enforcer |

**When agents get built:** After SS launches. Thumper Guardian first (gates onboarding rep #2). Other agents as need becomes concrete — don't build speculatively. Likely deployment target: Anthropic Managed Agents (TOOL AWARENESS April 8, 2026), evaluated during design session.

---

## Open Placeholders

Active items waiting on external input. Listed here for plan-level visibility; tracked individually in `open_items`.

| Placeholder | Where It Slots In | Waiting On | Impact If Answer Changes |
|-------------|-------------------|-----------|------------------------|
| DUCLUS lightbox + photography kit | Phase 7.4 (photography kit standardization) | Webcam testing follows lightbox validation | If lightbox PASS: standardize, test webcam options, determine three-tier pricing. If FAIL: find alternative. Expanded scope: lightbox + camera + Thumper screening + start fee impact. Does not block prototype. |
| Platform monthly price point | Pre-Launch Checklist #4 | Louis decision session | Monthly-only pricing locked April 19, 2026. Only the dollar amount is still open. Affects Stripe configuration (Phase 0.4) but doesn't change architecture. |
| Start/launch fee amounts | Pre-Launch Checklist #5–6 | Louis decision session | Affects Gate 2 and Gate 3 amounts but doesn't change gate logic. |

---

## Parallel Execution Map

This shows what can run simultaneously across multiple Claude Code sessions. Louis can fire multiple sessions and let them run while he's at work or sleeping.

### Wave 1 (Phase 0 work)
```
Session A: Phase 0.2 — Create all Supabase tables + RLS
Session B: Phase 0.4 — Stripe subscription integration
```
Both are infrastructure. No conflicts.

### Wave 2 (After Phase 0 complete)
```
Session A: Phase 1.1–1.4 — Thumper core engine + tools infrastructure
Session B: Phase 2.1–2.3 — Design system + global header/footer
Session C: Phase 10.1 — Chrome extension rebuild (fully independent)
```
Three parallel tracks. Thumper and site template are independent. Chrome extension has zero dependencies.

### Wave 3 (After Thumper core works)
```
Session A: Phase 1.5–1.9 — Thumper trade board + calendar + SMS tools
Session B: Phase 2.4–2.7 — Site pages (Homepage, About, Join Team, U&D/FAQ)
Session C: Phase 4.1–4.2 — Calendar feature
```
Three parallel tracks. All depend on Phase 0 data but not on each other.

### Wave 4 (After site pages + Thumper tools working)
```
Session A: Phase 3.1–3.6 — Trade board UI + trade request flow
Session B: Phase 2.8–2.9 — Custom domain routing + mobile pass
Session C: Phase 8.1 — Landing page (early start — independent)
```

### Wave 5 (After Lindsey prototype validated)
```
Session A: Phase 5.1–5.6 — SMS/email automation
Session B: Phase 6.1–6.7 — Rep dashboard
Session C: Phase 7.1–7.3 — AI photo enhancement
Session D: Phase 9.1–9.7 — SEO/GEO layer
```
Maximum parallelism. Four independent workstreams.

### Wave 6 (Final)
```
Session A: Phase 8.2–8.20 — Full onboarding pipeline
Session B: Phase 11 — Integration testing
```

---

## Overnight / While-at-Work Candidates

These tasks can run autonomously via Claude Code while Louis is away. They don't require design decisions or Louis's review — just execution from a clear spec. Build Tracker filters this list live; this is the structural reference.

**Strong overnight candidates:**
- Phase 1.1 — Thumper API route setup
- Phase 2.2–2.3 — Global header/footer (spec is locked)
- Phase 2.7 — U&D/FAQ page (all content locked — just build it)
- Phase 3.1 — Trade board listing display
- Phase 5.1 — Telnyx SMS integration
- Phase 9.1–9.5 — SEO/GEO technical tasks

**Requires Louis before running:**
- Phase 2.1 — Design system (creative direction)
- Phase 1.2 — Thumper system prompt (personality/tone review)
- Phase 2.9 — Mobile responsive pass (phone testing)
- Phase 8.12 — Branding menu (design session)

---

## Thumper API Cost Model (Reference)

Confirmed pricing as of April 2026:

| Model | Input | Output |
|-------|-------|--------|
| Haiku 4.5 (default) | $1.00/M tokens | $5.00/M tokens |
| Sonnet 4.6 (escalation) | $3.00/M tokens | $15.00/M tokens |

Prompt caching: up to 90% savings on repeated system prompt input. Batch API: 50% discount for async workloads.

| Rep Usage Level | Est. Monthly Cost |
|----------------|-------------------|
| Moderate (~800 interactions/mo) | ~$1.80 |
| Heavy (~2,000 interactions/mo) | ~$4.50 |
| Power user (~4,000 interactions/mo) | ~$8.50 |
| Chatbot abuser (8,000+/mo) | ~$18–25+ |

At scale: 100 heavy reps ≈ $450/mo, 500 heavy reps ≈ $2,250/mo. General chatbot abuse is the primary cost risk — scope lock to allowed domains mitigates this.

---

## Time Estimate Summary

Rough planning reference. Real progress lives in Build Tracker.

| Phase | Est. Sessions | Est. Calendar Days | Can Parallel With |
|-------|--------------|-------------------|-------------------|
| Phase 0: Foundation | 3–4 | 1–2 | — |
| Phase 1: Thumper Core | 3–5 | 2–3 | Phase 2 |
| Phase 2: Site Template | 5–8 | 3–5 | Phase 1, 10 |
| Phase 3: Trade Board | 4–6 | 2–3 | Phase 4 (partial) |
| Phase 4: Calendar | 2 | 1 | Phase 3 |
| Phase LP: Prototype | 0 (testing only) | 2–3 (live show schedule) | — |
| Phase 5: SMS/Email | 3–4 | 2 | Phase 6, 7 |
| Phase 6: Dashboard | 4–6 | 2–3 | Phase 5, 7, 9 |
| Phase 7: Photo Enhancement | 2–3 | 1–2 | Phase 5, 6, 9 |
| Phase 8: Onboarding | 6–8 | 4–5 | Phase 9 (partial) |
| Phase 9: SEO/GEO | 2–3 | 1–2 | Phase 8 |
| Phase 10: Chrome Extension | 1–2 | 1 | Anything |
| Phase 11: Integration | — | 2–3 | — |
| **TOTAL** | **~38–58 sessions** | **~22–34 calendar days** | |

**With aggressive parallelism (3+ concurrent sessions):** ~20–25 calendar days from Phase 0 start to launch readiness.

**With conservative approach (1–2 sessions/day):** ~30–40 calendar days.

**Prototype validated in:** ~8–12 calendar days from Phase 0 start (Phases 0, 1, 2 partial, 3, 4 → LP).

---

## Document Versioning

This is a reference spec. It does NOT bump for status changes — those live in Build Tracker, Open Brain, and `open_items`. It bumps only when the PLAN itself changes:

- **Minor (v3.0 → v3.1):** Task added/removed within an existing phase, dependency shifted, time estimate adjusted, item moved between Parking Lot / Deferred / Grey Area / Pre-Launch
- **Major (v3.x → v4.0):** Phase restructured, critical path changed, scope significantly altered, new core business rule added

Updates happen during session close per Standing Rule 12 — never deferred when a real plan change occurs.

---

*This plan is the single source of truth for the Sparkle Suite platform's architecture, scope, and dependencies. Phase progress, task status, gate results, and historical session details are NOT here — they live in Build Tracker (Supabase construction tables, queryable via NR HQ MCP), `open_items` (governance tracker), and Open Brain (decision history). Update this plan when the plan structurally changes. Do not update for status, completions, or session history.*
