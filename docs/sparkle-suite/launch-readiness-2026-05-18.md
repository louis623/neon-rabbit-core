# Sparkle Suite Launch Readiness - 2026-05-18

## Ready for demo

- Stripe subscription checkout and billing portal routes now return actionable configuration errors and use the authenticated rep identity for checkout metadata.
- Stripe webhook handling has focused coverage for signature-gated subscription updates.
- SignWell agreement onboarding can build a sandbox payload and blocks live sends unless `SIGNWELL_ALLOW_LIVE_SEND=true`.
- Demo account seed planning is repeatable by `DEMO_REP_EMAIL`, includes 2 upcoming shows, 10 listings, 5 audience members, and no live-provider actions.
- `npm run smoke:demo -- --category local_static` now executes a provider-free static smoke check against the demo seed shape.
- `npm run smoke:demo -- --category local_static --json` emits a machine-readable report without env secrets or dotenv noise.
- `npm run smoke:demo -- --category signwell_sandbox --json` can build a non-sending sandbox payload when SignWell sandbox env and `DEMO_REP_EMAIL` are present.
- `npm run smoke:demo -- --category stripe_test --json` validates test-mode Stripe config without creating a checkout session.

## P0 launch blockers

- Telnyx 10DLC approval is still pending. Do not attach `+19044383050` or send live SMS until campaign approval and number attachment are confirmed.
- Live Stripe readiness is not claimed. Use test mode first; production keys and a small live smoke need explicit Louis approval.
- Live SignWell sends are not approved. Sandbox/dry-run payloads are ready, but real agreements require explicit Louis approval.
- Paid Nic-Nac provider smoke is blocked by default and requires `NIC_NAC_ALLOW_PAID_SMOKE=true` plus a capped request count.

## P1 onboarding blockers

- Supabase demo seed has not been run against the target launch database in this session because `DEMO_REP_EMAIL` is not set in `.env.local`; choose the actual launch demo rep email before running `supabase_demo`.
- Stripe test-mode checkout/portal still needs a Louis-approved demo rep credential and configured test keys for an end-to-end browser smoke.
- SignWell sandbox payload still needs the final template id and sandbox credentials confirmed in the target environment.

## P2 post-launch polish

- Add a short operator-facing runbook once the first demo seed and provider sandbox smoke are performed.
- Add safe post-seed Supabase readback checks after the first approved `supabase_demo` seed run.
- Add a compact admin view link list for the demo rep once Louis chooses the first-user launch scope.

## Provider status

- Stripe: test-mode route readiness implemented; live mode parked behind explicit approval.
- SignWell: sandbox/dry-run payload readiness implemented; live send parked behind `SIGNWELL_ALLOW_LIVE_SEND=true` and explicit approval.
- Telnyx: live SMS parked until 10DLC approval and number attachment.
- Nic-Nac: paid smoke parked behind explicit paid-smoke env gates and request cap.
- Supabase: seed script is ready and wired into `smoke:demo -- --category supabase_demo`; target DB execution is waiting on `DEMO_REP_EMAIL`.

## Recommended first-user launch scope

- Launch with one seeded demo rep first.
- Smoke only `local_static`, then `supabase_demo` with the chosen demo email, then Stripe test mode, then SignWell sandbox.
- Keep SMS live sends, live SignWell sends, live Stripe charges, and paid Nic-Nac smoke out of the first pass unless Louis approves each provider scope separately.
