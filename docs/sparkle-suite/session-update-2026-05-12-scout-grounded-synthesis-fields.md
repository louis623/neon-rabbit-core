# Sparkle Suite Scout Grounded Synthesis Fields - 2026-05-12

## What moved

- Advanced Phase 8.5 Scout output with explicit grounded synthesis fields.
- The Scout synthesis contract now always includes:
  - `evidenceBackedObservations`
  - `manualVerificationNeeded`
  - `contradictions`
  - `confidence`

## Why this matters

- Scout can now separate what public evidence actually supports from what Louis still needs to verify manually.
- Model-backed synthesis must return the same grounded fields as deterministic fallback synthesis.
- This keeps Scout useful without overclaiming deep external research.

## Still true

- Scout public evidence is bounded to captured public-profile/customer-path metadata and link-hub inspection.
- Deep external social research is not complete.
- SMS is not live until Telnyx campaign approval, `+19044383050` attachment, and a real handset smoke test succeed.

## Verification

- Focused Scout test passed:
  - `npm exec vitest run tests/prelaunch/prelaunch-scout.test.ts`
