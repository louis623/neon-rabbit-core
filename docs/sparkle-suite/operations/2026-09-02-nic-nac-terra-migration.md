# Nic-Nac Terra migration — September 2, 2026

## Approved scope

Louis approved a same-day Suite human-default migration to `gpt-5.6-terra`,
keeping medium reasoning. Human-escalated stays GPT-5.5 medium, utility stays
GPT-5.4-mini low, and Lab stays GPT-5.5 high. Finder is not migrated in this
release. Its reporting baseline is separate in
`config/nic-nac-finder-reporting-policy.json`; this is not a Finder runtime
configuration or a policy-at-run-time history.

Louis separately approved a temporary Responses-only restricted Suite test
key with a $3 total synthetic replay cap, then revocation of that key only.
He also approved replacing only the deficient reviewer-smoke token with a
strong secret and using the existing synthetic reviewer account. Both
production environment updates (reviewer token and Suite default model) were
confirmed by Vercel. They become active on the new deployment.

## Implementation and evidence

- OpenAI AI SDK 6 adapter upgraded from 3.0.73 to 3.0.106; AI SDK core unchanged.
- Terra standard short-context estimates include input $2/M, cached read
  $0.20/M, output $12/M, and cache writes at 1.25x input. Historical GPT-5.4
  prices and the explicit model environment override are retained.
- Real synthetic replays exposed implicit Responses strict-mode normalization
  with BOTH models. Inspection showed both old and new adapters omit strict
  when unspecified. The permission-scoped catalog now explicitly preserves
  non-strict generation; app-owned Zod validation and approvals remain active.
  This prevents optional recurrence from being forced into a one-time show.
- Both models sometimes emitted timestamps without offsets. Add/update tool
  schemas now require a timezone-explicit ISO datetime before execution.
  This is input validation, not intent/phrase routing or post-selection rewrite.
- The one-off paid runner substitutes every execute handler, carries a
  persistent conservative integer-cent budget, disables SDK retries, and
  records model, usage, tools, output, latency and failures. It is not scheduled.
- Final corrected Terra calendar case: one valid add, no recurrence, correct
  September 4 7 PM Eastern instant, grounded visible success. Cancellation
  requested approval and did not execute. Raw earlier failures are preserved.
- Label and boxed-photo replays were semantically correct. The literal phrase
  detector also flags negated reassurance ("doesn't need to be unboxed or on
  a plain background"). Those runs remain flagged, not silently counted as
  zero-phrase passes. This is a model migration, not certification that every
  Trade Board intake path has been repaired.
- Temporary-key testing: 74 provider requests, 95 cents conservative estimated
  cost, no business writes. Reports stay under ignored
  `.local/terra-verification-2026-09-02/`; do not commit private transcripts.
- Final automated checks: 1,312 passed / one existing skip including Nic-Nac,
  cost dashboard, reviewer config; changed-file lint and full Next production
  build passed. Standalone broad test typecheck has pre-existing test typing
  errors; do not confuse it with the passing production build typecheck.

## Release and reviewer path

Pre-release: branch `codex/nic-nac-trade-hardening`, repository
`louis623/sparkle-suite`, project `sparkle-suite`
(`prj_zCKmYDx1Sbs9hA1Lokzdv9Qm0TM3`). Prior served deployment:
`dpl_3jf6qWNJJKJgibFJZrCbnMgeMzWm` /
`sparkle-suite-h17tgwrni-louis-2849s-projects.vercel.app`.

Deploy the exact verified branch tip with domain assignment held, then assign
only `www.yoursparklesuite.com` and `yoursparklesuite.com`. Customer aliases
remain on their existing deployment. No DNS, Stripe, billing, outbound message,
customer-account, scheduled canary, or unrelated key/project cleanup.

Live verification must use `/start` protected reviewer controls and the
existing synthetic dashboard-unlocked persona, then `/nic-nac`. Read Calendar,
perform a synthetic one-time add if safe, and verify persistence by reopening
Calendar. Inspect the Cost & Capacity dashboard for the actual model/run
evidence and refresh behavior. No token belongs in this document or a handoff
URL. Plain `/start` must not expose production reviewer controls.

Rollback is explicit: the prior deployment remains preserved. Restore only
the two Suite aliases to that exact known-good deployment if necessary, and
restore `NIC_NAC_HUMAN_DEFAULT_MODEL=gpt-5.4` before any later rebuild. Do not
restore a legacy route or automatically replay a turn after a tool may start.

## Sources

- [Terra model](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [Responses tool strictness](https://developers.openai.com/api/docs/guides/function-calling)

Deployment/live evidence is recorded in the session closeout after verification.
