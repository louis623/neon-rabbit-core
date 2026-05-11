# Sparkle Suite Waitlist HQ + Nic-Nac Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Sparkle Suite public waitlist to Neon Rabbit HQ so Louis can review, triage, and work those leads through the embedded `Nic-Nac` agent without creating duplicate lead stores or colliding with current HQ work.

**Architecture:** Keep `public.sparkle_suite_waitlist` as the canonical intake table for prelaunch signups. Add an HQ-facing read model plus a small operations layer for follow-up status, ownership, and Nic-Nac-visible notes instead of copying rows into `neon_rabbit_clients`. Let Nic-Nac operate on that HQ layer with guarded, visible actions that align to the approved HQ Agent OS design.

**Tech Stack:** Next.js App Router, Supabase Postgres, Sparkle Suite prelaunch waitlist route, Neon Rabbit HQ data layer, embedded Nic-Nac workspace, Vitest.

---

## Current Truth

- The public waitlist form posts to `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\app\api\prelaunch\waitlist\route.ts`.
- That route validates and inserts through `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\lib\prelaunch\waitlist.ts`.
- The current canonical intake table is `public.sparkle_suite_waitlist`.
- The schema currently lives in `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\supabase\migrations\040_prelaunch_waitlist.sql`.
- The current captured columns are:
  - `id`
  - `name`
  - `email`
  - `phone`
  - `tiktok_handle`
  - `team_rep_name`
  - `setup_pain`
  - `lead_status` default `new`
  - `source` default `prelaunch_site`
  - `sms_consent`
  - `email_consent`
  - `created_at`
- HQ already has a real data layer and operational shell, but it is built around live clients and broad HQ surfaces:
  - `C:\Users\louis\neon-rabbit-hq\src\lib\data.ts`
  - `C:\Users\louis\neon-rabbit-hq\src\components\ClientDirectory.tsx`
  - `C:\Users\louis\neon-rabbit-hq\src\components\OperationsView.tsx`
- HQ already has an approved Agent OS direction where `Nic-Nac` is an embedded expert that can inspect state, answer questions, and take guarded business actions:
  - `C:\Users\louis\neon-rabbit-hq\docs\superpowers\specs\2026-05-07-agentic-os-hq-design.md`
- HQ does **not** yet have a dedicated Sparkle Suite waitlist/prospects workflow in the repo.

## Recommended Boundary Decisions

- `sparkle_suite_waitlist` stays the only source of truth for raw intake.
- `neon_rabbit_clients` remains reserved for actual clients, not prelaunch leads.
- HQ gets a dedicated `Sparkle Suite prospects` surface instead of overloading the client directory.
- Nic-Nac should operate on a read model plus a small operations layer, not directly rewrite the original signup values.
- The public signup flow must never depend on HQ being up.
- Open Brain remains memory, not the waitlist database. Nic-Nac may use memory/context, but the lead record itself should stay in structured business tables.

## Recommended Data Model

Use a split model instead of stuffing everything into the intake row:

### 1. Canonical intake table

Keep `public.sparkle_suite_waitlist` focused on what the rep originally submitted.

### 2. Operations companion table

Add a new table such as `public.sparkle_suite_waitlist_ops` keyed by `waitlist_id` for operator workflow fields:

- `waitlist_id`
- `pipeline_status`
- `owner`
- `priority`
- `last_contact_at`
- `last_contact_channel`
- `next_action`
- `next_action_at`
- `nic_nac_summary`
- `operator_notes`
- `updated_at`

This keeps raw intake clean while giving HQ and Nic-Nac a safe place to work.

### 3. HQ read view

Add a view such as `public.sparkle_suite_waitlist_hq_v1` that joins the intake row with ops metadata into one stable shape for HQ.

## Phase Order

### Phase 1: Freeze The Canonical Intake Contract

**Files:**
- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\supabase\migrations\040_prelaunch_waitlist.sql`
- Review: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\lib\prelaunch\waitlist.ts`
- Create: `C:\Users\louis\neon-rabbit-core\docs\superpowers\specs\2026-05-10-sparkle-suite-waitlist-data-contract.md`

- [ ] Confirm `sparkle_suite_waitlist` remains the only write path for new public signups.
- [ ] Document which fields are immutable once submitted:
  - `name`
  - `email`
  - `phone`
  - `tiktok_handle`
  - `team_rep_name`
  - `setup_pain`
  - `sms_consent`
  - `email_consent`
  - `source`
  - `created_at`
- [ ] Treat `lead_status` on the raw table as temporary legacy state and plan to stop relying on it as the main operating field once the ops companion table exists.
- [ ] Explicitly document that Open Brain is not the lead store and `neon_rabbit_clients` is not the waitlist.

### Phase 2: Add The HQ Operations Layer For Prospects

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\supabase\migrations\0xx_waitlist_ops.sql`
- Create: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\supabase\migrations\0xx_waitlist_hq_view.sql`
- Review/Modify: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\lib\services\types.ts`
- Test: `C:\Users\louis\neon-rabbit-core\.worktrees\sparkle-suite-prelaunch\tests\prelaunch\prelaunch-waitlist-service.test.ts`

- [ ] Create `sparkle_suite_waitlist_ops` with one row per lead.
- [ ] Backfill an ops row automatically for each new waitlist signup.
- [ ] Keep the first ops schema intentionally small:
  - `pipeline_status` using values such as `new`, `reviewing`, `ready_for_follow_up`, `contacted`, `nurture`, `converted`, `archived`
  - `owner`
  - `priority`
  - `last_contact_at`
  - `last_contact_channel`
  - `next_action`
  - `next_action_at`
  - `nic_nac_summary`
  - `operator_notes`
- [ ] Create `sparkle_suite_waitlist_hq_v1` as the stable HQ-facing read view.
- [ ] Make sure waitlist inserts still succeed even if HQ-specific fields are null or HQ is offline.

### Phase 3: Add Read-Only Prospect Visibility In HQ

**Files:**
- Modify: `C:\Users\louis\neon-rabbit-hq\src\types\index.ts`
- Modify: `C:\Users\louis\neon-rabbit-hq\src\lib\data.ts`
- Create: `C:\Users\louis\neon-rabbit-hq\src\components\SparkleProspectDirectory.tsx`
- Modify: `C:\Users\louis\neon-rabbit-hq\src\components\OperationsView.tsx`
- Create: `C:\Users\louis\neon-rabbit-hq\tests\sparkle-waitlist.test.ts`

- [ ] Add a dedicated HQ type such as `SparkleWaitlistProspect`.
- [ ] Add a fetch path such as `getSparkleWaitlistProspects()` that reads only from `sparkle_suite_waitlist_hq_v1`.
- [ ] Add a standalone HQ surface for Sparkle Suite prospects instead of reusing `ClientDirectory`.
- [ ] Keep the first HQ pass read-only so it does not collide with other active HQ work.
- [ ] Surface the fields Louis actually needs for triage:
  - identity/contact
  - TikTok handle
  - team rep name
  - setup pain
  - consent flags
  - created date
  - pipeline status
  - owner
  - next action
  - last contact

### Phase 4: Give Nic-Nac Safe Prospect Actions

**Files:**
- Review: `C:\Users\louis\neon-rabbit-hq\docs\superpowers\specs\2026-05-07-agentic-os-hq-design.md`
- Modify: the HQ Nic-Nac route/service files that own action parsing and policy
- Create: `C:\Users\louis\neon-rabbit-hq\docs\superpowers\specs\2026-05-10-sparkle-suite-prospect-action-contract.md`
- Create or modify: focused Nic-Nac action tests in HQ

- [ ] Define the exact Sparkle Suite prospect actions Nic-Nac is allowed to take in phase one.
- [ ] Recommended safe action set:
  - open a prospect record
  - summarize why the lead matters
  - update `pipeline_status`
  - assign `owner`
  - draft or set `next_action`
  - stamp `last_contact_at` and `last_contact_channel`
  - write short `operator_notes`
- [ ] Explicitly forbid Nic-Nac from changing raw signup identity or consent fields.
- [ ] Require every Nic-Nac action to produce a visible receipt in HQ.
- [ ] Keep outbound messaging out of phase one unless a separate approval flow is designed.

### Phase 5: Add Board-Level Monitoring Without Building A Second CRM

**Files:**
- Modify: `C:\Users\louis\neon-rabbit-hq\src\components\OperationsView.tsx`
- Modify: any board summary/view-model files that feed HQ stats
- Test: extend `C:\Users\louis\neon-rabbit-hq\tests\sparkle-waitlist.test.ts`

- [ ] Add simple monitoring cards or counts for Sparkle Suite prospect flow:
  - new prospects
  - prospects not reviewed
  - prospects ready for follow-up
  - prospects touched this week
  - prospects with no next action
- [ ] Let the executive board surface attention, then let Nic-Nac explain or act on it.
- [ ] Do not recreate a full CRM inside HQ. The goal is visibility, triage, and guided action.

### Phase 6: Define Conversion Into A Real Client

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\docs\superpowers\specs\2026-05-10-sparkle-suite-prospect-conversion-contract.md`
- Modify later if approved: HQ or Sparkle Suite conversion workflow files

- [ ] Define the one intentional path where a Sparkle Suite prospect becomes a record in `neon_rabbit_clients`.
- [ ] Require conversion to be explicit and operator-visible.
- [ ] Decide which prospect fields copy over to client records and which stay prospect-only.
- [ ] Make sure conversion is one-way and auditable so there is no ambiguity about the live source of truth.

## Recommendation Summary

If this were implemented today, the safest sequence would be:

1. Keep `sparkle_suite_waitlist` as the single intake source of truth.
2. Add a separate `sparkle_suite_waitlist_ops` layer for workflow state.
3. Add HQ read-only visibility first.
4. Add Nic-Nac actions second, with receipts and a small allowed action set.
5. Add client conversion only after the prospect workflow is stable.

That order avoids the mess you were trying to avoid:

- no duplicate lead database
- no mixing prospects into the live client table
- no public signup dependency on HQ uptime
- no confusion between Open Brain memory and lead storage
- no Nic-Nac write access to raw consent or identity fields until explicitly designed
