# Sparkle Suite Cross-Phase Hardening Plan

Date: 2026-05-13
Branch: `codex/sparkle-cross-phase-hardening`

## Tracker Baseline

- HQ shows Phase 5, Phase 8, and Phase 9 in progress; Phase 11 is not started and is mostly manual acceptance work.
- Open Brain confirms the current Phase 8 blockers: SMS/Telnyx, Google OAuth/Drive transcript acquisition, Supabase/Docker payment-gate verification, live payment webhooks, and live SignWell sends are parked.
- Repo baseline is clean except unrelated `docs/sparkle-suite/marketing/`, which stays untouched.

## Safe Work Cluster

### Batch A: Wallet RPC spec alignment

Low-decision because the RPCs and service wrappers already exist in code and migrations. The work is documentation/spec alignment only.

- Add a doc-contract test for the current service-layer spec.
- Document the three SMS wallet RPCs in `SS_Service_Layer_Spec_v1_2.md`.
- Update the active master plan note that still says wallet RPCs are TBD.
- Resolve HQ open item `eb89bf3e` after verification.

Boundaries:

- No new migrations.
- No live Stripe webhook changes.
- No payment-gate webhook work.
- No Telnyx or real SMS work.
- No Supabase/Docker verification claims.

### Batch B: Phase 11 service parity contracts

Good next code batch after Batch A lands. This supports Phase 11 without pretending final manual acceptance is complete.

- Add or extend tests proving dashboard routes and Thumper tools call the same service-layer functions with authenticated `repId`.
- Focus on trade board, jewelry library, trade requests, and fulfillment queue boundaries.
- Keep the scope unit/contract-level; browser/manual acceptance remains Phase 11 proper.

### Batch C: Phase 11 provider-free recovery contracts

Good follow-up if Batch B is clean.

- Consolidate mocked failure coverage for disabled SignWell, disabled payment gates, SMS refund behavior, Photoroom provider errors, audit-write failures, and route auth failures.
- Keep all provider interactions mocked/offline.

## Parked Or Manual

- Phase 5 SMS/Telnyx live work remains blocked until campaign approval, +19044383050 attachment, and real handset smoke.
- Phase 8 Google transcript acquisition remains parked for Louis review.
- Payment-gate migration verification and live webhook work remain parked until Docker/Supabase auth is available.
- Phase 11 full end-to-end show flow, phone checks, live payment checks, SignWell sends, and final non-technical acceptance require Louis/provider attention.
