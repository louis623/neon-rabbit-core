# Sparkle Suite — Master Build Plan

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No (upload per session when build work is on the agenda)
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (primary reference), Claude (session context), Claude Code (build execution)
🔄 UPDATE TRIGGER: Any phase completion, scope change, dependency shift, or test gate result

**Version:** 1.9 | **Created:** April 9, 2026 | **Last Updated:** April 15, 2026 | **Status:** ACTIVE — Phase 0 COMPLETE. All 7 tasks verified and committed. Test Gate 0 ready to run. Ready for Phase 1 + Phase 2 parallel sprint. All gaps resolved except Gap 4 (DUCLUS lightbox arrived April 12, testing in progress — does not block).

**COMPANION SPECS (upload alongside this plan for build work):**
- SS_Supabase_Schema_v1_0.md — 16-table schema specification (source of truth for Task 0.2)
- SS_Service_Layer_Spec_v1_0.md — Shared service layer: 12 functions, 3 Postgres RPCs, error handling, security (source of truth for Tasks 1.5, 3.x, 6.x)

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
- 🧠 ULTRAPLAN — Use `/ultraplan` in Claude Code. Runs Opus 4.6 in the cloud for up to 30 minutes. Best for: multi-file changes, multi-system integration, complex architecture, anything where planning before execution matters. Included in Max plan at no extra cost. Requires GitHub repo connected.
- ⚙️ STANDARD — Regular Claude Code session (Sonnet). Best for: small isolated fixes, single-file changes, simple wiring tasks, anything with a clear and narrow scope.
- 🎯 CLAUDE CHAT — Design and planning work done in conversation with Claude (Opus). Best for: system prompts, architecture decisions, creative direction, schema design. No code execution — produces specs that feed into Claude Code sessions.

**Default rule:** If a task is 🔧 Medium or larger AND involves code, it should use 🧠 ULTRAPLAN unless there's a specific reason not to. Ultraplan plans before it builds — reduces the chance of sessions going sideways, especially for overnight/autonomous runs. Quick (⚡) tasks with narrow scope can use ⚙️ STANDARD.

**Parallel track indicators:**
- 🔴 SEQUENTIAL — Must wait for prior phase to complete
- 🟢 PARALLEL — Can run alongside other marked phases
- 🟡 PARTIAL — Some tasks parallel, some sequential (details in phase)

**Standing rules for all Claude Code sessions:**
1. Every prompt starts with: *"Work on main branch only at C:\Users\louis\sparkle-suite — do not create worktrees, new branches, or temporary directories unless Louis explicitly requests one."*
2. Every prompt ends with: regenerate CODEBASE_SNAPSHOT.md, commit, push.
3. For any task marked 🧠 ULTRAPLAN: use `/ultraplan` in Claude Code (CLI or desktop app).
4. Include `--dangerously-skip-permissions` unless the prompt involves destructive operations.
5. Start a fresh Claude Code session per phase/prompt.

**Codex pre-validation workflow (for all 🧠 ULTRAPLAN tasks):**
1. Run `/ultraplan` → get the implementation plan back
2. Copy the plan into Codex with this prompt: *"Here's an implementation plan for [X]. What will break? What edge cases aren't handled? What assumptions is this plan making? What's missing?"*
3. Codex flags issues
4. Feed flags back into the Claude Code session before execution begins
5. Claude Code builds from the pre-validated plan

This shifts validation LEFT — catching bad assumptions at the plan stage (~5–10 min cost) instead of the code stage (rework cost). Especially valuable for overnight runs where Louis can't intervene.

---

## Critical Path

The critical path is the shortest sequence of dependent work items from today to launch. Everything not on this path can run in parallel without delaying launch.

```
Gap 20 ✅ → Gap 22 ✅ (tool schemas — Session #21)
                ↓
       Ultraplan workflow session
                ↓
       Phase 0: Supabase Schema + Auth
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
Phase 6: Rep Dashboard (read-only views)
         ↓
Phase 7: AI Photo Enhancement Pipeline
         ↓
Phase 8: Onboarding Pipeline + Landing Page
         ↓
Phase 9: SEO/GEO Layer
         ↓
Phase 10: Integration Testing + Polish
         ↓
Phase 11: Pre-Launch Checklist
         ↓
🚀 LAUNCH
```

**Lindsey Prototype** is the critical validation gate. It pulls from Phases 0, 1, 2 (partial), and 3. If Lindsey can run a live show and manage trades through Thumper without needing Louis, the concept is validated. If she struggles, we learn where the friction is before building the rest.

---

## Pre-Build Blockers (Resolve Before Phase 0)

These items must be resolved before any Claude Code work begins.

| # | Item | Owner | Status | Impact |
|---|------|-------|--------|--------|
| 1 | Gap 20 — BP item number confirmation | Louis → Lindsey | ✅ RESOLVED (Session #20) | Item numbers ARE consistent: two-letter type prefix + 5 digits (RG/NK/ER/ST/BR). Dedup is simple exact match. Collection not on label — Thumper asks rep when missing. |
| 2 | Gap 22 — Thumper trade board tool schemas | Claude (Opus session) | ✅ RESOLVED (Session #21) | 10 tools fully designed: add_listing (single + batch, flexible input, camera button, lightbox webcam default), get_my_board, remove_listing, get_trade_requests, approve_trade (creates fulfillment record), reject_trade, search_jewelry_database, update_listing, get_trade_history, update_fulfillment_status (3-status pipeline). Dual interface principle: every tool has a dashboard UI equivalent via shared service layer. |
| 3 | DUCLUS lightbox test | Louis | ⏳ Arrived April 12. Testing in progress. | Determines whether to standardize as rep onboarding kit. Does NOT block prototype build — only affects onboarding pipeline (Phase 8). |
| 4 | Formal build sequence session | Claude + Louis | ✅ RESOLVED | This master plan IS the build sequence session. |
| 5 | Ultraplan workflow session | Louis | ✅ RESOLVED (Session #22) | Claude Code CLI v2.1.101 installed, authenticated, /ultraplan tested successfully. Blocker cleared. All Claude Code work can now use /ultraplan for Medium+ tasks. |

**All pre-build blockers RESOLVED. Phase 0 is in progress.**

---

## Phase 0 — Foundation: Supabase Schema + Auth + Stripe

**What this builds:** The entire data layer that every other phase depends on. Rep accounts, authentication, RLS policies, all core tables, Stripe subscription/wallet integration.

**Depends on:** Gap 22 complete (trade board tool schemas inform table design)

**Parallel tracks:** 🔴 SEQUENTIAL — everything else waits for this

**Estimated time:** 🏗 Large — 3–4 Claude Code sessions over 1–2 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 0.1 | Design complete Supabase schema (all tables, relationships, enums, indexes) | 🔧 Medium | No — needs Louis review | ✅ COMPLETE (Session #22). SS_Supabase_Schema_v1_0.md generated. 16 tables, all enums, RLS policies, Realtime config, seed data, tool cross-reference. Verified against all gap analysis decisions. |
| 0.1b | Design shared service layer for trade board operations | 🔧 Medium | No — needs Louis review | ✅ COMPLETE (Session #23). SS_Service_Layer_Spec_v1_0.md generated. 4 service files (trade-board, trade-requests, trade-fulfillment, jewelry-database) + types + errors. 12 functions covering all 10 Thumper tools + customer submission + fulfillment queue helper. 3 Postgres RPC functions for atomic operations. Two-layer security (RLS + service validation). One-request-per-piece business rule locked. |
| 0.2 | Create all tables + RLS policies in Supabase | 🔧 Medium | 🌙 Yes | ✅ COMPLETE (Session #24). 16 tables, 17 enums, 42 indexes, RLS on all 16 tables, 3 RPC functions (rpc_submit_trade_request, rpc_approve_trade, rpc_reject_trade), 4 Realtime tables. Partial unique index for one-request-per-piece and GIN index for full-text search both created. Clean run in 2m 23s. Migration committed to main. |
| 0.3 | Supabase Auth setup (rep login) | ⚡ Quick | 🌙 Yes | ✅ COMPLETE (Session #24). Email/password auth. Admin account (louis@neonrabbit.net) and test rep sandbox (testrep@neonrabbit.net) created. 3 Supabase client utilities: browser (lib/supabase/client.ts), server (lib/supabase/server.ts), admin (lib/supabase/admin.ts). RLS recursion bug caught and fixed (migration 007 — admin policy used auth.jwt() instead of self-referencing subquery). Credentials stored in 1Password. |
| 0.4 | Stripe integration — subscription billing | 🔧 Medium | 🌙 Yes | ✅ COMPLETE (Session #26). Commit b6a2fa0 — 15 files, 1,157 lines. Stripe v22 (dahlia API) adaptations handled. Includes: Stripe client library (lazy init, Zod config validation), customer creation (idempotent getOrCreate), Checkout Session API, webhook handler (5 events with idempotency via stripe_events table), portal session, subscription status, pro-rata refund with state machine (refund_operations table). Auth hardening: all non-webhook routes derive repId from cookies. Migration 008_stripe_billing.sql adds stripe_events + refund_operations tables. Codex adversarial review + 22/22 automated verification checks passed. |
| 0.5 | Stripe integration — SMS wallet | ⚡ Quick → 🧠 ULTRAPLAN | 🌙 Yes | ✅ COMPLETE (Session #27). Commit 4cce843 — 7 files, +1042/-25. Upgraded from Quick to Ultraplan due to money-safety complexity. 3 rounds of Codex adversarial review before build (17 blockers found and resolved across rounds). Migration 009: DECIMAL→INTEGER cents conversion with fail-loud pre-validation, enum split (adjustment→credit/debit, auto_recharge added), sms_wallet lock fields (auto_recharge_pending + attempt_id), partial unique index on stripe_payment_intent_id. 3 new RPCs (deduct_wallet_balance, credit_wallet, release_wallet_recharge_lock) — all SECURITY DEFINER with service_role-only grants. lib/services/wallet.ts: atomic deduction (9 cents), auto-recharge via after() with 30-minute stale lock recovery. Wallet load route (card-only checkout, minimum from DB). Auto-recharge settings route (DB-only, no Stripe gate). Webhook extensions: wallet-load branch, payment_intent.succeeded/failed/canceled/requires_action handlers. Real balance_transaction.fee (NULL if unavailable). 42/42 automated verification checks passed. |
| 0.6 | Seed data for test rep sandbox | ⚡ Quick | 🌙 Yes | ✅ COMPLETE (Session #24). Permanent test rep account (testrep@neonrabbit.net) — NOT Lindsey's live site. Idempotent seed script at scripts/seed-test-rep.ts. Data across 10 tables: reps, site_settings, sms_wallet, subscriptions, onboarding_status, collections (3), jewelry_designs (5 real BP item numbers), trade_listings (3), calendar_events (2), rep_notes (1). Louis acts as rep during testing. Lindsey validates by reviewing test site — migration via clean onboarding flow after validation. |

### Test Gate 0

Before moving to Phase 1:
- [ ] All tables exist with correct relationships
- [ ] RLS policies verified — rep can only see own data, admin sees all
- [ ] Auth flow works — can create rep account + log in
- [ ] Stripe webhook fires on test subscription → Supabase record updates
- [ ] SMS wallet balance can be loaded and deducted via test transaction
- [ ] Lindsey's seed data is in place and queryable

---

## Phase 1 — Thumper Core Engine

**What this builds:** The chatbot conversation engine — Claude API integration, streaming responses, basic tool-calling infrastructure, conversation UI, rep notes memory.

**Depends on:** Phase 0 complete (Thumper needs tables to act on)

**Parallel tracks:** 🟢 PARALLEL with Phase 2 (site template) — different codebases, same deployment

**Estimated time:** 🏗 Large — 3–5 Claude Code sessions over 2–3 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 1.1 | Thumper API route (Next.js + Vercel AI SDK) | 🔧 Medium | 🌙 Yes | streamText with tool-calling. Claude API (Haiku 4.5 default). Prompt caching on system prompt from day one. |
| 1.2 | Thumper system prompt — first draft | 🔧 Medium | No — needs Louis review | Opus session in Claude Chat. Persona, scope lock (10 allowed domains), warm redirect script, trade board AI notice, non-affiliation disclaimer, content screening rules, personality (concise/warm/plain language). |
| 1.3 | Thumper conversation UI (desktop-optimized) | 🔧 Medium | 🌙 Yes | Desktop-width browser optimized. Text input + streaming response display. Message history within session. Persistent chat field. Camera button (opens lightbox webcam as default, device camera as fallback) + gallery/upload button (multi-select for bulk). Camera source detection via MediaDevices API — lightbox USB webcam is default, "Switch to device camera" as fallback link. Camera source stored in rep profile. Clean, minimal — not a full dashboard. |
| 1.4 | Thumper tool infrastructure | ⚡ Quick | 🌙 Yes | Vercel AI SDK tool-calling framework. Tool registration pattern. Error handling (three-tier: retry / explain / auto-escalation ticket). |
| 1.5 | Thumper trade board tools (from Gap 22 schemas) | 🔧 Medium | 🌙 Yes | Implement all 10 tools designed in Gap 22 Session #21. All call the shared service layer (Task 0.1b). Tools: (1) add_listing — flexible input (item number OR label photo OR both), single + batch mode, three entry points, canonical photo fallback, (2) get_my_board — rep's board with filters/sorting/summary stats, (3) remove_listing — soft-remove with pending request auto-cancel warning, (4) get_trade_requests — incoming request inbox with MSRP match flagging, (5) approve_trade — creates trade_fulfillment record, auto-cancels other pending requests for same listing, (6) reject_trade — piece reappears on board, (7) search_jewelry_database — full catalog search with is_on_my_board flag and aggregate stats only (no rep identification), (8) update_listing — partial update of trade prefs/photo/notes, (9) get_trade_history — completed/denied/cancelled with summary analytics, (10) update_fulfillment_status — 3-status pipeline (approved → shipped → completed) with add_to_board option on completion. |
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
| 2.3 | Global footer — brand + links + disclaimers | ⚡ Quick | 🌙 Yes | Three columns + bottom bar. Non-affiliation disclaimer (three-part framework). "Powered by" link to yoursparklesuite.com. |
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
- [ ] Custom domain routing resolves correctly (test with Lindsey's domain)
- [ ] At least one template skin looks polished and professional (Louis approval)

---

## Phase 3 — Trade Board + Jewelry Database

**What this builds:** The trade board (most demanded feature), jewelry database (proprietary data asset), customer trade request form, live show trade flow, filtering system.

**Depends on:** Phase 0 complete (tables exist), Phase 1 partial (Thumper tools for trade board), Gap 20 answered (item numbers), Gap 22 complete (tool schemas)

**Parallel tracks:** 🟡 PARTIAL — filtering UI can parallel with Thumper tool wiring

**Estimated time:** 🏗 Large — 4–6 Claude Code sessions over 2–3 days

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 3.1 | Trade board listing display | 🔧 Medium | 🌙 Yes | Grid/list view of rep's available pieces. Each listing shows: photo, collection, type, material, MSRP, rarity tags. Brand separation label: "Offered by [Rep Name], an Independent Bomb Party Representative." |
| 3.2 | Filtering system | 🔧 Medium | 🌙 Yes | Collection (scrollable/searchable), jewelry type, material, MSRP range, rarity tags (unicorn, diamond), size. Mobile: horizontal pill bars for primary filters, expandable panel for secondary. Extensible by design. |
| 3.3 | Customer trade request form | ⚡ Quick | 🌙 Yes | Three elements: customer name, description of their revealed item, submit button. No MSRP field. No photo upload. Intentionally simple. |
| 3.4 | Trade request submission flow | 🔧 Medium | 🌙 Yes | On submit: requested piece disappears from board COMPLETELY (not visible with label — gone). ONE REQUEST PER PIECE AT A TIME — first-come first-served. No second customer can request a piece while one request is pending. If rejected, piece reappears and another customer can try. Uses rpc_submit_trade_request for atomic insert + status change. "I Want This" button only renders when listing status is "available". Supabase Realtime broadcasts status change so other viewers see piece disappear instantly. Clickwrap at point of request. HARD RULES: one-for-one trades only, no purchases, no cash transactions. |
| 3.5 | Thumper trade notification + approve/deny | 🔧 Medium | 🌙 Yes | Real-time notification in Thumper conversation. Rep can ask follow-up questions about their board. Approve = piece gone permanently. Deny = piece reappears. Quick-action buttons. |
| 3.6 | Clickwrap at point of listing | ⚡ Quick | 🌙 Yes | Rep certifies ownership and MSRP accuracy before listing. Cannot proceed without checking. |
| 3.7 | "Add a piece" flow via Thumper | 🔧 Medium | 🌙 Yes | Three entry points: (1) type item number, (2) upload label photo (OCR extracts item number), (3) both. System resolves what it can, only asks for missing info. If design found + collection populated → list immediately with canonical photo. If found + collection missing → ask for collection. If not found → request full label info + piece photo. Batch mode: upload multiple labels, system sorts into ready/need-collection/need-full-info buckets. Camera button in Thumper UI for lightbox webcam capture. Dashboard equivalent: "Add to Board" (single) + "Bulk Add" (multi drag-and-drop) forms. |
| 3.8 | Dedup matching logic | ⚡ Quick | 🌙 Yes | Gap 20 RESOLVED: BP has item numbers (two-letter type prefix + 5 digits). Simple exact match on item_number field. No fuzzy matching needed. Rep always confirms — not fully automated. |
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

**Testing approach (Session #24 decision):** All testing runs on the permanent test rep sandbox account (testrep@neonrabbit.net). Louis acts as the rep. Lindsey's live Readdy.ai site is NEVER touched during development. Lindsey validates by reviewing the test rep site and confirming "this is what my site should look like." Real migration to Lindsey's account happens via clean onboarding flow after validation passes.

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
| 5.3 | SMS wallet billing UI | ⚡ Quick | 🌙 Yes | Wallet balance display. Load wallet via Stripe. Auto-recharge at threshold. Transaction history. |
| 5.4 | AI content screening | 🔧 Medium | 🌙 Yes | All manual messages screened before send. Prohibited phrases flagged. TCPA/CAN-SPAM compliance check. Thumper blocks non-compliant messages with explanation. |
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

**What this builds:** The rep's full dashboard — trade board home view, jewelry library, trade fulfillment queue, messages/notifications, calendar, analytics, and account management. The dashboard is a FULL INTERFACE to the same operations Thumper handles, via the shared service layer. Both are equal — not read-only.

**Depends on:** Phase LP validation, Phases 3–5 producing data to display

**Parallel tracks:** 🟢 PARALLEL with Phase 5 — reads and writes data via shared service layer

**Estimated time:** 🏗 Large — 4–6 Claude Code sessions (increased from 2-3 to account for full dual-interface scope)

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
| 6.14 | Account / billing | ⚡ Quick | 🌙 Yes | Subscription status, plan tier, payment method, billing history. Self-service cancellation button (Click-to-Cancel compliant). |

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

**Depends on:** Phase 1 (Thumper), Phase 3 (jewelry database to store results), DUCLUS lightbox test result (informs photography kit decision)

**Parallel tracks:** 🟢 PARALLEL with Phases 5–6 — independent system

**Estimated time:** 🔧 Medium — 2–3 Claude Code sessions

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 7.1 | Thumper pre-flight check (Layer 1) | 🔧 Medium | 🌙 Yes | Evaluate submitted photo for minimum viability before Photoroom. Check: lighting, subject visibility, resolution, blur. Kick back with coaching if not good enough. Helpful tone, not robotic rejection. |
| 7.2 | Photoroom API integration | 🔧 Medium | 🌙 Yes | Background removal. Relighting for bad lighting. REST API. Sub-1-second latency. Handle complex shapes (chains, transparent stones). |
| 7.3 | Backend QA inspector (Layer 2) | 🔧 Medium | Needs design session first | Evaluate Photoroom output before database entry. Confidence scoring, flagging system. Low-quality outputs held, not auto-approved. Details TBD — needs dedicated design session. |
| 7.4 | Photography kit standardization | 👤 Louis only | Ongoing — starts April 12 | EXPANDED from lightbox-only test. Three-tier kit model: (1) lightbox only (rep has own camera), (2) lightbox + NR-recommended USB webcam, (3) fallback to phone camera. DUCLUS lightbox test first. Then webcam quality testing. Then pricing impact on start fee tiers. Thumper screens camera quality during onboarding via vision evaluation of test photo. Does not block prototype — affects Phase 8 onboarding only. |

### Test Gate 7

- [ ] Pre-flight check correctly rejects obviously bad photos with helpful feedback
- [ ] Pre-flight check passes acceptable photos through to Photoroom
- [ ] Photoroom returns enhanced images with clean background removal
- [ ] QA inspector catches low-quality Photoroom outputs before database entry
- [ ] End-to-end: rep submits photo via Thumper → pre-flight → Photoroom → QA → database entry
- [ ] Photography kit decision made (DUCLUS test)

---

## Phase 8 — Onboarding Pipeline + Landing Page

**What this builds:** The full rep onboarding flow from first contact to live site. Plus the rep-facing landing page at yoursparklesuite.com. This phase deploys four autonomous agents (Scout, Scribe, Builder, Wordsmith) plus binary automations for payment gates and fulfillment.

**REFERENCE:** Full agent architecture, memory model, and design philosophy documented in SS_KB_Agents_v1.0.md. Upload that file alongside this plan for any Phase 8 work.

**Pre-build requirement:** Each agent needs a dedicated Opus design session for its system prompt, tool definitions, and guardrails BEFORE Claude Code builds it.

**Depends on:** Phases 1–7 all working (onboarding triggers the entire platform)

**Parallel tracks:** 🟡 PARTIAL — landing page can start earlier (Phase 2 timeframe)

**Estimated time:** 🏢 Multi-day — 6–8 Claude Code sessions over 4–5 days (increased from original estimate to account for agent design sessions)

### Tasks

| # | Task | Time | Can Run Overnight | Notes |
|---|------|------|-------------------|-------|
| 8.1 | Rep-facing landing page (yoursparklesuite.com) | 🔧 Medium | 🌙 Yes | Unified page: landing page + login/signup integrated (like any traditional SaaS site). Informational, not salesy. Branding/colors/copywriting carried over from existing neonrabbit.net/sparklesuite page — update content for new platform, don't redesign. Login wired to Phase 0 Supabase Auth. Demo video placeholder. Intake form. Waitlist Thumper. Can start as early as Phase 2. Customer-facing home page is PARKED post-launch (separate design session). |
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
| 9.8 | BP IDS link on Join Team pages | ⚡ Quick | 🌙 Yes | Bomb Party Income Disclosure Statement linked inline on every Join Team page. Build requirement from L2. |

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
| 10.1 | Chrome extension rebuild | 🔧 Medium | 🌙 Yes | Bulletproof scraping. No browser refresh issues (Incident 001 fix). No data loop (Incident 002). No observer infinite loop (Incident 003). Background sync only. Easy on/off toggle. |
| 10.2 | Chrome Web Store publication | ⚡ Quick | No — requires manual submission | Clean download, auto-installs. Eliminates sideloading friction for non-technical reps. |
| 10.3 | Deploy to all current clients | ⚡ Quick | 🌙 Yes | Test on Lindsey first (Louis has BP dashboard access). Then deploy to remaining clients. |

### Test Gate 10

- [ ] Extension scrapes BP dashboard correctly (inverted list, first unchecked = current reveal)
- [ ] No browser refresh loop
- [ ] No data loop (rep name not in queue)
- [ ] No observer infinite loop / browser crash
- [ ] Easy toggle on/off
- [ ] Chrome Web Store listing live
- [ ] Works on Lindsey's dashboard
- [ ] Works on Brittany's dashboard (the one that broke before)

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
| 11.5 | Cancellation flow | Rep cancels subscription, pro-rata refund calculated, site goes offline at month end |
| 11.6 | Multi-rep isolation | Two test reps — verify RLS prevents data leakage between reps |
| 11.7 | Error recovery | What happens when Thumper API is down? When Stripe webhook fails? When Photoroom is slow? |
| 11.8 | Mobile testing | All pages + trade board + signup forms on phone. Louis tests on his actual phone. |
| 11.9 | Non-technical user test | Brittany-level user test. Can someone with IT anxiety navigate the site and understand what they're seeing? |

### Test Gate 11

- [ ] All 9 scenarios pass without critical failures
- [ ] No data leakage between reps (RLS verification)
- [ ] Error handling graceful across all failure modes
- [ ] Mobile experience acceptable (not perfect — desktop-first, but usable)
- [ ] Louis is satisfied with overall polish and professionalism
- [ ] Performance acceptable — pages load fast, Thumper responds quickly

---

## Pre-Launch Checklist (Non-Build Items)

These items are NOT code — they're administrative, legal, and operational tasks that must be complete before going live with paying clients.

| # | Item | Owner | Status | Blocking Launch? |
|---|------|-------|--------|-----------------|
| 1 | A2P 10DLC registration (TCR) | Louis | Not started | YES — carriers block unregistered SMS |
| 2 | Attorney session (8 agenda items) | Louis | Agenda ready. Schedule when revenue supports. | YES — need service agreement + disclaimers before taking money |
| 3 | BP Policy Section 7.1 verification | Louis | Not verified | YES — pull actual BP rep agreement, check if third-party tools prohibited |
| 4 | Platform subscription pricing decision | Louis + Claude | Not decided | YES — can't charge without a price |
| 5 | Start fee amount | Louis | Not decided | YES — need amount for Gate 2 |
| 6 | Launch fee amount | Louis | Not decided | YES — need amount for Gate 3 |
| 7 | DPAs with vendors | Louis | Not started | Recommended — Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog |
| 8 | Incident response protocol (FIPA) | Claude | Not written | Recommended — one-page protocol for breach notification |
| 9 | Photography kit standardization | Louis | Saturday April 12 (lightbox test first) | No — only affects onboarding flow. Three-tier model: lightbox for all, camera flexible. Webcam testing follows lightbox validation. |
| 10 | Business card vendor research (Gap 13) | Louis + Claude | Not started | No — add-on, not core product |
| 11 | Existing client SEO/GEO retrofit | Claude Code | April 19 index check | No — existing Readdy sites, not new platform |
| 12 | Bri's outstanding launch fee | Louis | Owed | No — grandfathered client, separate from platform |
| 13 | Kara business card package | Louis | In queue | No — client deliverable, not platform |
| 14 | Heather business card follow-up | Louis | In queue | No — client deliverable, not platform |

---

## Parallel Execution Map

This shows what can run simultaneously across multiple Claude Code sessions. Louis can fire multiple sessions and let them run while he's at work or sleeping.

### Wave 1 (After Gap 20 + 22 resolved)
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
Session A: Phase 8.2–8.12 — Full onboarding pipeline
Session B: Phase 11 — Integration testing
```

---

## Overnight / While-at-Work Candidates

These tasks can run autonomously via Claude Code while Louis is away. They don't require design decisions or Louis's review — just execution from a clear spec.

**Best overnight candidates (most autonomous):**
- ~~Phase 0.2 — Create Supabase tables + RLS~~ ✅ COMPLETE
- ~~Phase 0.4 — Stripe webhook integration~~ ✅ COMPLETE
- ~~Phase 0.5 — Stripe SMS wallet~~ ✅ COMPLETE
- Phase 1.1 — Thumper API route setup
- Phase 2.2–2.3 — Global header/footer (spec is locked)
- Phase 2.7 — U&D/FAQ page (all content locked — just build it)
- Phase 3.1 — Trade board listing display
- Phase 5.1 — Telnyx SMS integration
- Phase 9.1–9.5 — SEO/GEO technical tasks
- Phase 10.1 — Chrome extension rebuild

**Requires Louis before running:**
- Phase 2.1 — Design system (creative direction)
- Phase 1.2 — Thumper system prompt (personality/tone review)
- Phase 2.9 — Mobile responsive pass (phone testing)
- Phase 8.12 — Branding menu (design session)

---

## Time Estimate Summary

| Phase | Est. Sessions | Est. Calendar Days | Can Parallel With |
|-------|--------------|-------------------|-------------------|
| Pre-build blockers | 0 (all resolved) | 0 | — |
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
| **TOTAL** | **~39–58 sessions** | **~23–34 calendar days** | |

**With aggressive parallelism (3+ concurrent sessions):** ~20–25 calendar days from Phase 0 start to launch readiness.

**With conservative approach (1–2 sessions/day):** ~30–40 calendar days.

**Prototype validated in:** ~8–12 calendar days from Phase 0 start (Phases 0, 1, 2 partial, 3, 4 → LP).

---

## Build Tracker — NR HQ Tab (Not a Separate App)

Build tracking lives as a new tab inside the existing Neon Rabbit HQ dashboard (neon-rabbit-hq.vercel.app). No separate app, no separate repo, no throwaway project. One dashboard, one place to look.

### Why Inside HQ

- HQ already has 8 tabs, Supabase backend, auth working — adding a tab is one Claude Code session
- A separate Vercel app for temporary tracking violates KISS
- Construction data doesn't get thrown away — it becomes the historical build record
- After launch, the tab evolves into Platform Health / Monitoring — same location, same data, different view

### What the Build Tracker Tab Shows During Construction

1. **Phase Progress** — Visual progress bar per phase. Percentage complete. Current status (not started / in progress / testing / complete).
2. **Task Checklist** — Every task from every phase. Checkbox. Assignee (Claude Code / Louis / Both). Status. Execution mode (🧠 ULTRAPLAN / ⚙️ STANDARD / 🎯 CLAUDE CHAT).
3. **Test Gates** — Each gate's checklist. Pass/fail per item. Gate status (locked / testing / passed / failed).
4. **Blockers** — Active blockers with owner and status. Gap 20, Gap 22, DUCLUS, pre-launch checklist items.
5. **Parallel Track View** — Which waves are active. What's running now. What's next.
6. **Timeline** — Simple timeline showing actual vs. estimated progress.

### What It Becomes After Launch (Platform Health Tab)

- Site uptime monitoring (are rep sites responding?)
- Thumper error rates (API failures, timeout frequency)
- Stripe webhook status (successful vs. failed events)
- Rep wallet alerts (wallets approaching zero)
- Support ticket escalation queue (auto-generated by Thumper's three-tier error handling)
- Photoroom API health (response times, failure rates)
- Telnyx SMS delivery status

### Tech Stack

- Lives inside neon-rabbit-hq repo (louis623/neon-rabbit-hq, main branch)
- New Supabase tables in neon-rabbit-core: construction_phases, construction_tasks, construction_gates
- Manual data entry initially (Louis or Claude updates task status)
- Future: Claude Code auto-updates task status after each session via CODEBASE_SNAPSHOT parsing

### Build Approach

- **Step 1:** Add Build Tracker tab to HQ with all phases/tasks/gates pre-populated from this master plan. One Claude Code session.
- **Step 2:** Wire to Supabase tables. Progress auto-calculated from task completion counts.
- **Step 3 (post-launch):** Swap construction data for monitoring data. Same tab, new purpose.

---

## Document Versioning

This plan will be updated incrementally as phases complete and decisions change. Version bumps follow the standard NR pattern:
- Minor (v1.0 → v1.1): Task added/removed, time estimate adjusted, dependency shifted
- Major (v1.x → v2.0): Phase restructured, critical path changed, scope significantly altered

Updates happen during session close per Standing Rule 12 — never deferred.

---

## Open Placeholders

These items have specific slots in the plan but are waiting on external input:

| Placeholder | Where It Slots In | Waiting On | Impact If Answer Changes |
|-------------|-------------------|-----------|------------------------|
| ~~Gap 20 — BP item numbers~~ | ~~Phase 3.8~~ | ✅ RESOLVED Session #20 | Item numbers confirmed. Dedup is simple exact match. Phase 3.8 is ⚡ Quick. |
| ~~Gap 22 — Tool schemas~~ | ~~Phase 1.5 (Thumper trade tools)~~ | ✅ RESOLVED Session #21 | 10 tools fully designed. Shared service layer required. Dual interface principle locked. Phase 1.5 and Phase 6 both consume the same service layer. |
| DUCLUS lightbox + photography kit | Phase 7.4 (photography kit standardization) | Arrived April 12 — testing in progress. Webcam testing follows. | If lightbox PASS: standardize, test webcam options, determine three-tier pricing. If FAIL: find alternative. Expanded scope: lightbox + camera + Thumper screening + start fee impact. Does not block prototype. |
| Platform pricing | Pre-Launch Checklist #4 | Louis decision session | Affects Stripe configuration (Phase 0.4) but doesn't change architecture. |
| Start/launch fee amounts | Pre-Launch Checklist #5–6 | Louis decision session | Affects Gate 2 and Gate 3 amounts but doesn't change gate logic. |
| ~~Ultraplan workflow~~ | ~~Pre-Phase 0~~ | ✅ RESOLVED (Session #22) | Claude Code CLI installed, authenticated, /ultraplan tested. Blocker cleared. |

---

*This plan is the operational roadmap for the entire Sparkle Suite platform build. It replaces ad-hoc session-by-session planning with a structured, phased approach. Update it as phases complete. Do not update it for ideas still in brainstorming — those go to Open Brain or the parking lot in SS_KB_OpenItems.*
