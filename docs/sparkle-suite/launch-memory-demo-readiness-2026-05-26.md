# Sparkle Suite Launch Memory + Demo Readiness

Date: 2026-05-26

## Scope

This note records the launch-readiness decision for Nic-Nac memory and the current demo-account testing picture. Live Queue customer-site tuning is intentionally deferred and should not be changed until a real beta rep account is being prepared.

## Nic-Nac Memory Baseline

Launch with the existing structured memory path:

- `rep_notes` for lightweight rep memory through `read_recent_rep_notes` and `write_rep_note`.
- Current-show database memory through `nic_nac_show_sessions` and `nic_nac_show_session_events`.
- Open Brain and Memory Index remain HQ/operator context, not Nic-Nac runtime memory.

Hardening completed on this branch:

- Show-session events now verify that the target session belongs to the authenticated rep before insert.
- Suspected prompt-injection notes are redacted before being returned as model memory context.
- Attack 5 passed locally after redaction: poisoned `rep_notes` did not leak the foreign listing UUID, no foreign tool action was recorded, and the temporary poisoned note cleanup verified at count `0`.

## Demo Account Readiness

Already covered:

- Demo seed shape covers one demo rep, site settings, sample designs/listings, shows, and audience records.
- Local static demo smoke is provider-free.
- Temporary demo-password helpers exist for internal local/preview route smoke without printing passwords.
- Prior launch docs record successful protected preview route smoke and public route smoke evidence.

Still needed before external beta/demo handoff:

- A current protected preview or production in-browser pass with approved access.
- Intentional stable demo/beta password handling before sharing access outside internal testing.
- A first-real-beta-account setup pass that exercises onboarding and daily workflow without relying on demo-only assumptions.
- Fresh launch readiness report review after each new smoke artifact.

## Command Risk Labels

Safe/local-only:

```powershell
npm run smoke:demo -- --category local_static --json
npm exec vitest run tests/demo-account-seed.test.ts tests/smoke-demo-readiness.test.ts
npm exec vitest run tests/phase-11-smoke-manifest.test.ts tests/launch-readiness-report-runner.test.ts
npm run report:launch-readiness -- --json
```

Local-only but writes local artifacts:

```powershell
npm run smoke:launch -- --categories local_static,stripe_webhook_local_signature --json --write-report
npm run report:launch-readiness -- --write-report --json
```

Writes Supabase/auth data and needs explicit approval:

```powershell
npm run seed:demo-rep
npm run smoke:demo -- --category supabase_demo --json
npm run smoke:demo -- --category prelaunch_demo_seed --json
npm run seed:demo-launch-flow
npm run smoke:launch:local-temp-demo
npm run smoke:launch:preview-temp-demo -- --target <preview-or-production-url>
npm run smoke:customer-flow
```

Provider contact/write and needs explicit approval:

```powershell
npm run stripe:demo-price -- --json
npm run smoke:demo -- --category stripe_local_routes --json
npm run smoke:stripe:webhook-test-config
npm run stripe:ensure-test-webhook -- --target <target> --apply --write-secret-file <ignored-local-file> --json
npm run smoke:signwell:sandbox-provider
npm run smoke:preview:vercel-curl
npm run smoke:launch:preview-protected
```

Live/paid/provider-gated; do not run without exact approval:

```powershell
npm run smoke:stripe:live-preflight
npm run stripe:live-prices -- --env-file .local\vercel-production.env --apply --approved-at <timestamp> --json
npm run stripe:ensure-live-webhook -- --env-file .local\vercel-production.env --target https://www.yoursparklesuite.com --apply --approved-at <timestamp> --write-secret-file .local\stripe-live-webhook-www.secret --json
npm run smoke:signwell:live-preflight
npm run smoke:nic-nac:paid-preflight
npm run smoke:demo -- --category nic_nac_paid
```
