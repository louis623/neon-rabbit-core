# Neon Rabbit — Master Build Sequence

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Uploaded to chat when needed (Layer 2 reference)
📁 UPLOAD TO PROJECT: No — Layer 2 file. Upload to chat when actively working on builds.
🏷 PROJECT: Neon Rabbit (all projects)
👤 WHO USES IT: Louis (daily roadmap), Claude (session context), Claude Code (execution)
🔄 UPDATE TRIGGER: Any phase completion, blocker resolved, sequence change, or new build decision

**Version:** 1.0 | **Created:** April 10, 2026 | **Status:** ACTIVE
**Source documents:** SS_Master_Build_Plan_v1.1.md (Sparkle Suite phases), HQ_Master_Plan_v1.3.md (HQ phases), NR_Intelligence_System_Plan_v1.0.md (intelligence system)

---

## The Principle

Sparkle Suite is the main course — it generates revenue. NR HQ is the kitchen — it makes cooking easier. Build the kitchen just functional enough to cook, then focus entirely on the meal. Come back to renovate the kitchen when the meal is being served.

---

## Where We Are Right Now (April 10, 2026)

**Sparkle Suite:** Pre-build. 19 gap analysis sessions complete. Master Build Plan v1.1 locked. Waiting on Gap 20 (Lindsey — BP item numbers) and DUCLUS lightbox test (Saturday April 12). Gap 22 (Thumper tool schemas — Opus session) fires immediately after Gap 20.

**NR HQ:** Phase 2A complete (8 Supabase tables, auth, RLS, live data). Phase 2B (Stripe + Plaid) needs Opus architecture session. Phase 2C (Gmail agent) needs dedicated architecture session. Phase 3 (full module build) depends on 2B + 2C.

**Standing Rules file:** Needs v3.6 bump (two new rules: Codex pre-validation, ultraplan default). Do this next session.

---

## The Road Ahead

Nine stages from today to Sparkle Suite launch, with HQ work slotted into natural gaps. Each stage tells you exactly what to do, in what order, and why.

---

### Stage 1 — Fill the Dead Time (NOW → Gap 20 answered)

SS is blocked waiting on Lindsey. Use this window for HQ work that will pay off later.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 1.1 | HQ Phase 2B — Opus architecture session | HQ | 🎯 CLAUDE CHAT (Opus) | ~45 min |
| 1.2 | HQ Phase 2B — Build (Stripe + Plaid + daily cron) | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 1.3 | HQ Build Tracker tab — populate from SS Master Build Plan | HQ | ⚙️ STANDARD | 1 session |
| 1.4 | Standing Rules file bump to v3.6 | NR | 🎯 CLAUDE CHAT | 15 min |
| 1.5 | DUCLUS lightbox test (Saturday April 12) | SS | 👤 Louis only | 30 min |

**Why this order:** 2B Opus session must happen before the build. Build Tracker tab gives you visibility into SS construction from day one. Standing Rules file is a quick housekeeping item that's been deferred. DUCLUS is a fixed Saturday event.

**What you're doing daily:** Run 1.1 first (Opus session). Fire 1.2 overnight or while at work. Slot 1.3 in when 1.2 is done. 1.4 takes 15 minutes anytime. 1.5 is Saturday.

---

### Stage 2 — Unblock Sparkle Suite (Gap 20 answered → Gap 22 complete)

The moment Lindsey confirms BP item numbers, the SS critical path unblocks.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 2.1 | Gap 22 — Thumper trade board tool schemas | SS | 🎯 CLAUDE CHAT (Opus) | 30–45 min |

**Why this is its own stage:** Gap 22 is a design session that shapes everything in SS Phases 1 and 3. It must be done before any SS code work. Nothing else should run during this — give it full attention.

**What you're doing daily:** One focused Opus session. Get the tool schemas locked. Move to Stage 3 immediately after.

---

### Stage 3 — SS Foundation Sprint (Gap 22 complete → Phase 0 done)

Everything in SS depends on Phase 0. This is the foundation — Supabase schema, auth, Stripe integration, seed data.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 3.1 | SS Phase 0.1 — Design complete Supabase schema | SS | 🎯 CLAUDE CHAT (Opus) | 1 session |
| 3.2 | SS Phase 0.2 — Create all tables + RLS | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 3.3 | SS Phase 0.3 — Supabase Auth setup | SS | ⚙️ STANDARD | 🌙 Overnight |
| 3.4 | SS Phase 0.4 — Stripe subscription integration | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 3.5 | SS Phase 0.5 — Stripe SMS wallet | SS | ⚙️ STANDARD | 🌙 Overnight |
| 3.6 | SS Phase 0.6 — Seed Lindsey prototype data | SS | ⚙️ STANDARD | 🌙 Overnight |

**What you're doing daily:** 3.1 requires Louis (schema review). Everything else is overnight/autonomous. Fire sessions before bed, verify in the morning. Multiple tasks can run in parallel (3.2 + 3.4 are independent infrastructure).

**HQ during this stage:** Nothing. Full focus on SS foundation.

---

### Stage 4 — SS Parallel Build Sprint (Phase 0 done → ready for prototype)

This is the biggest construction push. Three parallel tracks running simultaneously. This is where aggressive parallelism pays off.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| **Track A — Thumper** | | | | |
| 4.1 | SS Phase 1.1 — Thumper API route | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.2 | SS Phase 1.2 — Thumper system prompt | SS | 🎯 CLAUDE CHAT (Opus) | Needs Louis |
| 4.3 | SS Phase 1.3 — Thumper conversation UI | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.4 | SS Phase 1.4 — Tool infrastructure | SS | ⚙️ STANDARD | 🌙 Overnight |
| 4.5 | SS Phase 1.5 — Trade board tools (Gap 22 schemas) | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.6 | SS Phase 1.6 — Calendar tools | SS | ⚙️ STANDARD | 🌙 Overnight |
| 4.7 | SS Phase 1.7 — Site customization tools | SS | ⚙️ STANDARD | 🌙 Overnight |
| 4.8 | SS Phase 1.8 — SMS/email tool stubs | SS | ⚙️ STANDARD | 🌙 Overnight |
| 4.9 | SS Phase 1.9 — Rep notes memory | SS | ⚙️ STANDARD | 🌙 Overnight |
| 4.10 | SS Phase 1.10 — Model routing (Haiku/Sonnet) | SS | ⚙️ STANDARD | 🌙 Overnight |
| **Track B — Site Template** | | | | |
| 4.11 | SS Phase 2.1 — Design system | SS | 🎯 CLAUDE CHAT (Opus) | Needs Louis |
| 4.12 | SS Phase 2.2–2.3 — Global header/footer | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.13 | SS Phase 2.4 — Homepage | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.14 | SS Phase 2.5 — About page | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.15 | SS Phase 2.6 — Join Team page | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.16 | SS Phase 2.7 — U&D/FAQ page | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.17 | SS Phase 2.8 — Custom domain routing | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.18 | SS Phase 2.9 — Mobile responsive pass | SS | ⚙️ STANDARD | Needs Louis (phone test) |
| **Track C — Independent** | | | | |
| 4.19 | SS Phase 10.1 — Chrome extension rebuild | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 4.20 | SS Phase 10.2 — Chrome Web Store publication | SS | 👤 Louis only | Manual submission |
| **Then (after Thumper core + site pages working):** | | | | |
| 4.21 | SS Phase 3.1–3.6 — Trade board UI + trade flow | SS | 🧠 ULTRAPLAN | 2–3 sessions |
| 4.22 | SS Phase 4.1–4.3 — Calendar feature | SS | 🧠 ULTRAPLAN | 1–2 sessions |

**What you're doing daily:** Fire overnight sessions on Tracks A, B, and C simultaneously. Your active work during the day is the design sessions (4.2, 4.11) and phone testing (4.18). Morning routine: check overnight results, verify test gates, fire next batch.

**HQ during this stage:** Nothing. SS is the only priority.

**Estimated duration:** 8–12 calendar days from Phase 0 start to prototype readiness.

---

### Stage 5 — Lindsey Prototype Validation (SS Phase LP)

No new code. This is a live test with real Bomb Party shows.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 5.1 | Lindsey runs 1–2 live shows using Thumper + trade board | SS | 👤 Louis + Lindsey | 2–3 days (show schedule dependent) |
| 5.2 | Collect Lindsey's feedback — what's confusing, missing, broken | SS | 👤 Louis | During/after shows |
| 5.3 | Fix issues identified in prototype testing | SS | ⚙️ STANDARD or 🧠 ULTRAPLAN | Depends on issues |

**Decision gate after prototype:**
- ✅ Validated → proceed to Stage 6
- ⚠️ Friction → fix and re-test before proceeding
- ❌ Concept failure → pause, redesign, reassess

**HQ during this stage:** Good window for HQ Phase 2C (Gmail agent) Opus architecture session. You're waiting on Lindsey's show schedule anyway — use the gaps productively. Don't build 2C yet, just plan it.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 5.4 | HQ Phase 2C — Gmail agent architecture session | HQ | 🎯 CLAUDE CHAT (Opus) | ~45 min |

---

### Stage 6 — SS Post-Prototype Build (Maximum Parallelism)

Prototype is validated. Now build everything else. This is the maximum parallelism stage — four independent workstreams can run simultaneously.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| **Track A** | SS Phase 5 — SMS/Email Automation | SS | 🧠 ULTRAPLAN | 3–4 sessions |
| **Track B** | SS Phase 6 — Rep Dashboard (read-only views) | SS | 🧠 ULTRAPLAN | 2–3 sessions |
| **Track C** | SS Phase 7 — AI Photo Enhancement Pipeline | SS | 🧠 ULTRAPLAN | 2–3 sessions |
| **Track D** | SS Phase 9 — SEO/GEO Layer | SS | 🧠 ULTRAPLAN | 2–3 sessions |

**What you're doing daily:** Fire all four tracks in parallel. Most tasks are overnight candidates. Your active work: review photo enhancement output quality (Phase 7), verify SEO schema markup (Phase 9).

**HQ during this stage:** Slot in HQ Phase 2C build (Gmail agent) as a fifth parallel track if the architecture session from Stage 5 is done. Gmail agent is independent of SS — no conflicts.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 6.5 | HQ Phase 2C — Gmail agent build | HQ | 🧠 ULTRAPLAN | 2–3 sessions |

---

### Stage 7 — SS Onboarding Pipeline + Final Polish

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 7.1 | SS Phase 8.1 — Landing page (yoursparklesuite.com) | SS | 🧠 ULTRAPLAN | 🌙 Overnight |
| 7.2 | SS Phase 8.2–8.12 — Full onboarding pipeline | SS | 🧠 ULTRAPLAN | 4–6 sessions |
| 7.3 | SS Phase 11 — Integration testing (all 9 scenarios) | SS | 🧠 ULTRAPLAN + 👤 Louis | 2–3 days |

**Note:** Phase 8.1 (landing page) can start as early as Stage 4 if capacity allows — it's independent. The rest of Phase 8 depends on Phases 1–7 all working.

**What you're doing daily:** Integration testing requires hands-on attention. This is where you're clicking through every flow, testing on your phone, running the "Brittany test" (can a non-technical user navigate it?).

**HQ during this stage:** Nothing. Final SS push gets full attention.

---

### Stage 8 — SS Pre-Launch Checklist (Non-Build Items)

These are administrative, legal, and operational tasks. Many can run in parallel with Stage 7.

| # | Task | Owner | Blocking Launch? |
|---|------|-------|-----------------|
| 8.1 | A2P 10DLC registration (TCR) | Louis | YES |
| 8.2 | Attorney session (8 agenda items) | Louis | YES |
| 8.3 | BP Policy Section 7.1 verification | Louis | YES |
| 8.4 | Platform subscription pricing decision | Louis + Claude | YES |
| 8.5 | Start fee + launch fee amounts | Louis | YES |
| 8.6 | DPAs with vendors (Anthropic, Photoroom, Telnyx, Resend, Stripe, PostHog) | Louis | Recommended |
| 8.7 | FIPA incident response protocol | Claude | Recommended |
| 8.8 | Chrome extension deployed to all clients | SS | After Phase 10 |
| 8.9 | Photography kit decision | Louis | After DUCLUS test |
| 8.10 | Existing client SEO/GEO retrofit | Claude Code | After Phase 9 |

**Advice:** Start items 8.1–8.5 as early as possible — don't wait until code is done. Attorney session can be scheduled during any stage. Pricing decision can happen anytime Louis is ready. A2P 10DLC registration takes time to process — submit early.

---

### Stage 9 — Launch + HQ Phase 3 (Post-Launch)

SS is live. Clients are paying. Now the HQ dashboard has real data to display.

| # | Task | Project | Type | Est. Time |
|---|------|---------|------|-----------|
| 9.1 | 🚀 Sparkle Suite LAUNCH | SS | 👤 Louis | — |
| 9.2 | HQ Build Tracker tab → Platform Health tab conversion | HQ | ⚙️ STANDARD | 1 session |
| 9.3 | HQ Phase 3 — Customer Board | HQ | 🧠 ULTRAPLAN | 2–3 sessions |
| 9.4 | HQ Phase 3 — Lifecycle Workflow Map | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 9.5 | HQ Phase 3 — Onboarding Pipeline Funnel View | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 9.6 | HQ Phase 3 — Automation Health panel | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 9.7 | HQ Phase 3 — Project Financials panel | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 9.8 | HQ Phase 3 — Thumper CEO View | HQ | 🧠 ULTRAPLAN | 1–2 sessions |
| 9.9 | HQ Phase 3 — BP Intelligence display | HQ | 🧠 ULTRAPLAN | 1 session |
| 9.10 | HQ Phase 3 — Built-in chatbot | HQ | 🧠 ULTRAPLAN | 2–3 sessions |
| 9.11 | HQ Phase 3 — Voice briefing | HQ | 🧠 ULTRAPLAN | 1 session |
| 9.12 | HQ Phase 3 — Data Storage Center | HQ | 🧠 ULTRAPLAN | 1–2 sessions |

**What you're doing daily:** Onboarding your first new clients on SS while building out HQ Phase 3 in parallel. HQ tasks are mostly overnight candidates — they read from existing Supabase data and build UI components.

---

## Visual Timeline

```
STAGE 1 ─── Fill Dead Time (HQ 2B + Build Tracker)          ~3–5 days
STAGE 2 ─── Unblock SS (Gap 22 Opus)                        ~1 day
STAGE 3 ─── SS Foundation (Phase 0)                          ~2–3 days
STAGE 4 ─── SS Parallel Build (Phases 1–4, 10)              ~8–12 days
STAGE 5 ─── Lindsey Prototype (+ HQ 2C planning)            ~2–3 days
STAGE 6 ─── SS Post-Prototype (Phases 5–7, 9 + HQ 2C)      ~5–7 days
STAGE 7 ─── SS Onboarding + Polish (Phases 8, 11)           ~5–7 days
STAGE 8 ─── SS Pre-Launch Checklist                          Parallel with 6–7
STAGE 9 ─── LAUNCH + HQ Phase 3                             Ongoing
            ─────────────────────────────────────────────
            TOTAL: ~25–35 calendar days to SS launch
            (from Gap 20 answer to live platform)
```

---

## Daily Routine During Build

**Morning (before work):**
1. Open NR HQ → check Build Tracker tab
2. Review overnight Claude Code results — did sessions succeed? Test gates pass?
3. If results are clean: fire next batch of overnight sessions
4. If something failed: flag it for evening fix session
5. Check for Gap 20 answer from Lindsey (Stage 1–2 only)

**Evening (after work):**
1. Active sessions — design reviews, Opus planning, phone testing
2. Queue up overnight sessions for things that don't need Louis
3. Quick Open Brain capture of what happened today
4. Fire overnight batch before bed

**Weekends:**
- Best time for Opus design sessions (uninterrupted focus)
- Best time for phone testing (no work distractions)
- DUCLUS test is a Saturday item

---

## What NOT to Do

1. **Don't build HQ Phase 3 before SS launches.** The dashboard modules need real data. Building them against empty tables wastes time and guarantees rework.
2. **Don't start SS code before Gap 22 is done.** The tool schemas shape the entire Supabase schema. Wrong tables = rework everything.
3. **Don't skip the Lindsey prototype gate.** If she can't use it, 100 reps won't be able to either. Fix first, then scale.
4. **Don't batch HQ and SS in the same Claude Code session.** Different repos, different concerns. One repo per session. Always.
5. **Don't defer standing rules or file generation.** Do it the session it's decided. Context degrades overnight.

---

## Quick Reference — What's Blocking What

| If you're stuck on... | You need... | To unblock... |
|----------------------|-------------|---------------|
| Starting any SS code | Gap 20 (Lindsey) + Gap 22 (Opus) | SS Phase 0 |
| HQ Phase 2B | Opus architecture session | Stripe + Plaid + cron |
| HQ Phase 2C | Dedicated architecture session | Gmail agent |
| HQ Phase 3 | SS launch (real data flowing) | Full dashboard modules |
| SS Phase LP | Phases 0, 1, 2 (partial), 3, 4 complete | Lindsey prototype test |
| SS Phases 5–9 | Lindsey prototype validated | Post-prototype build |
| SS Launch | Phases 0–11 + pre-launch checklist complete | 🚀 |

---

*This document is the single roadmap for all Neon Rabbit build work. It replaces mental tracking of "what do I work on today?" with a concrete sequence. Update when stages complete or the order changes.*
