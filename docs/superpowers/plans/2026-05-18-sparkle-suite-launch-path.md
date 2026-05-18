# Sparkle Suite Launch Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Sparkle Suite from build-hardening into launch-path readiness by wiring payment/agreement onboarding, demo accounts, realistic smoke tests, and a short blocker list.

**Architecture:** Keep live-provider actions behind explicit configuration and test-mode gates while building the full user workflows end to end. Work in small commits, favor existing service/route patterns, and do not touch Headquarters or `docs/sparkle-suite/marketing/`.

**Tech Stack:** Next.js App Router 16.2.1, TypeScript, Supabase, Stripe, SignWell, Vitest, existing Nic-Nac service/tool architecture.

---

## Launch Rules

- Do not edit `C:\Users\louis\neon-rabbit-hq` while Louis has an active HQ session.
- Do not touch `docs/sparkle-suite/marketing/`.
- Do not modify `chrome-extension/content.js`, `supabase/functions/live-queue-sync`, or deployed queue behavior for existing live shows.
- Do not send live SMS until Telnyx 10DLC approval and number attachment are confirmed.
- Do not run paid Nic-Nac smoke calls unless Louis explicitly approves the exact run size.
- Use Stripe test mode first. Do not claim production payment readiness until Louis confirms live Stripe keys and a live penny/small-dollar smoke is approved.
- Use SignWell test/sandbox mode first. Do not send live agreements until Louis approves.
- Keep rep-facing assistant name as Nic-Nac.

## Workstreams

### Workstream A: Stripe Subscription And Billing Readiness

**Owner:** Worker 1  
**Purpose:** Make rep subscription/payment onboarding usable enough for demo and test-mode checkout.

**Files:**
- Read: `C:\Users\louis\neon-rabbit-core\lib\stripe\config.ts`
- Read: `C:\Users\louis\neon-rabbit-core\lib\stripe\client.ts`
- Read: `C:\Users\louis\neon-rabbit-core\app\api\stripe\create-checkout\route.ts`
- Read: `C:\Users\louis\neon-rabbit-core\app\api\stripe\create-portal-session\route.ts`
- Read: `C:\Users\louis\neon-rabbit-core\app\api\stripe\webhook\route.ts`
- Modify: `C:\Users\louis\neon-rabbit-core\lib\services\account-billing.ts`
- Modify: `C:\Users\louis\neon-rabbit-core\app\api\nic-nac\account-billing\route.ts`
- Test: `C:\Users\louis\neon-rabbit-core\tests\services\account-billing.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\tests\stripe-create-checkout-route.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\tests\stripe-create-portal-session-route.test.ts`

- [ ] **Step A1: Inventory current Stripe behavior**

Run:

```powershell
rg -n "stripe|checkout|portal|subscription|billing" lib app tests -g "!docs/sparkle-suite/marketing/**"
```

Expected:
- Identify existing checkout, portal, webhook, and billing dashboard code.
- No code changes.

- [ ] **Step A2: Add/verify missing test-mode guards**

Add tests proving:
- checkout refuses to run when Stripe env is missing;
- checkout uses authenticated rep identity;
- portal refuses when the rep has no Stripe customer id;
- webhook updates subscription status only from verified Stripe events.

Run:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-create-portal-session-route.test.ts tests/services/account-billing.test.ts
```

Expected:
- New tests fail before implementation or confirm existing behavior.

- [ ] **Step A3: Implement the smallest checkout/portal fixes**

Implementation constraints:
- Use existing `lib/stripe/*` helpers.
- Do not create a new payment architecture.
- Keep test mode and live mode separated by Stripe keys, not a custom production toggle.
- Return actionable JSON errors for missing configuration.

Run:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-create-portal-session-route.test.ts tests/services/account-billing.test.ts
npx tsc --noEmit --pretty false
```

Expected:
- Stripe tests pass.
- Typecheck passes.

- [ ] **Step A4: Commit Stripe readiness**

```powershell
git add -- lib/stripe app/api/stripe lib/services/account-billing.ts app/api/nic-nac/account-billing/route.ts tests/stripe-create-checkout-route.test.ts tests/stripe-create-portal-session-route.test.ts tests/services/account-billing.test.ts
git commit -m "feat: prepare Stripe billing for launch smoke"
```

---

### Workstream B: SignWell Agreement Onboarding Readiness

**Owner:** Worker 2  
**Purpose:** Make the agreement workflow ready for sandbox/test-mode smoke without sending live agreements.

**Files:**
- Read: `C:\Users\louis\neon-rabbit-core\lib\prelaunch\signwell.ts`
- Read: `C:\Users\louis\neon-rabbit-core\app\api\prelaunch\signwell\agreement\route.ts`
- Modify: `C:\Users\louis\neon-rabbit-core\lib\prelaunch\signwell.ts`
- Modify: `C:\Users\louis\neon-rabbit-core\app\api\prelaunch\signwell\agreement\route.ts`
- Test: `C:\Users\louis\neon-rabbit-core\tests\prelaunch\prelaunch-signwell.test.ts`
- Test: `C:\Users\louis\neon-rabbit-core\tests\prelaunch\prelaunch-signwell-route.test.ts`

- [ ] **Step B1: Inventory current SignWell behavior**

Run:

```powershell
rg -n "SignWell|signwell|agreement|document" lib/prelaunch app/api/prelaunch tests/prelaunch -g "!docs/sparkle-suite/marketing/**"
```

Expected:
- Identify current sandbox/live boundaries and route inputs.
- No code changes.

- [ ] **Step B2: Add tests for sandbox-first agreement creation**

Add tests proving:
- route refuses when SignWell env is missing;
- route refuses live send unless an explicit allow flag is set;
- route can build a dry-run/sandbox agreement payload for a demo rep;
- no live email/send claim is returned unless live send is explicitly enabled.

Run:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-signwell.test.ts tests/prelaunch/prelaunch-signwell-route.test.ts
```

Expected:
- Tests define the exact current gaps.

- [ ] **Step B3: Implement SignWell readiness fixes**

Implementation constraints:
- Prefer existing `lib/prelaunch/signwell.ts`.
- Add explicit live-send guard if missing.
- Return `mode: "sandbox" | "dry_run" | "live_blocked"` in route responses so smoke tests are unambiguous.

Run:

```powershell
npm exec vitest run tests/prelaunch/prelaunch-signwell.test.ts tests/prelaunch/prelaunch-signwell-route.test.ts
npx tsc --noEmit --pretty false
```

Expected:
- SignWell tests pass.
- Typecheck passes.

- [ ] **Step B4: Commit SignWell readiness**

```powershell
git add -- lib/prelaunch/signwell.ts app/api/prelaunch/signwell/agreement/route.ts tests/prelaunch/prelaunch-signwell.test.ts tests/prelaunch/prelaunch-signwell-route.test.ts
git commit -m "feat: prepare SignWell onboarding for launch smoke"
```

---

### Workstream C: Demo Account And Seed Data

**Owner:** Worker 3  
**Purpose:** Create repeatable demo setup so Louis can pretend to be a rep and smoke the actual workflows.

**Files:**
- Read: `C:\Users\louis\neon-rabbit-core\scripts\seed-test-rep.ts`
- Read: `C:\Users\louis\neon-rabbit-core\scripts\seed-spike-rep-b.ts`
- Create or modify: `C:\Users\louis\neon-rabbit-core\scripts\seed-demo-rep.ts`
- Create or modify: `C:\Users\louis\neon-rabbit-core\tests\demo-account-seed.test.ts`

- [ ] **Step C1: Inventory existing seed scripts and schema assumptions**

Run:

```powershell
Get-Content scripts\seed-test-rep.ts
Get-Content scripts\seed-spike-rep-b.ts
rg -n "from\\('reps'\\)|from\\('jewelry_designs'\\)|from\\('trade_listings'\\)|from\\('calendar_events'\\)|from\\('customer_audience'\\)" scripts lib tests
```

Expected:
- Identify existing seed patterns and required tables.
- No code changes.

- [ ] **Step C2: Add a pure demo seed plan test**

Create `tests/demo-account-seed.test.ts` with tests for a pure helper that returns:
- one rep profile;
- realistic site settings;
- at least two upcoming shows;
- at least ten jewelry designs/listings;
- at least five audience members;
- no SMS-send attempt;
- no SignWell live send;
- no Stripe charge attempt.

Run:

```powershell
npm exec vitest run tests/demo-account-seed.test.ts
```

Expected:
- Test fails until helper exists.

- [ ] **Step C3: Implement demo seed helper and script**

Implementation constraints:
- Script must require `DEMO_REP_EMAIL`.
- Script must print inserted IDs, not secrets.
- Script must be idempotent by email where practical.
- Script must not touch marketing docs or HQ.

Run:

```powershell
npm exec vitest run tests/demo-account-seed.test.ts
npx tsc --noEmit --pretty false
```

Expected:
- Demo seed tests pass.
- Typecheck passes.

- [ ] **Step C4: Commit demo seed setup**

```powershell
git add -- scripts/seed-demo-rep.ts tests/demo-account-seed.test.ts
git commit -m "feat: add launch demo account seed"
```

---

### Workstream D: End-To-End Smoke Harness

**Owner:** Main agent after A-C land  
**Purpose:** Give Louis a single command/checklist for demo readiness without surprise paid calls.

**Files:**
- Modify: `C:\Users\louis\neon-rabbit-core\package.json`
- Create: `C:\Users\louis\neon-rabbit-core\scripts\smoke-demo-readiness.ts`
- Create: `C:\Users\louis\neon-rabbit-core\tests\smoke-demo-readiness.test.ts`
- Read: `C:\Users\louis\neon-rabbit-core\spike\run-benchmark.ts`

- [ ] **Step D1: Define smoke categories**

Smoke categories:
- `local_static`: no providers, no DB writes.
- `supabase_demo`: DB reads/writes against configured Supabase.
- `stripe_test`: Stripe test-mode checkout/portal only.
- `signwell_sandbox`: SignWell sandbox/dry-run only.
- `nic_nac_paid`: requires `NIC_NAC_ALLOW_PAID_SMOKE=true`.

- [ ] **Step D2: Add smoke harness tests**

Create tests proving:
- default run includes no paid Nic-Nac calls;
- SMS live send is excluded;
- live SignWell send is excluded;
- Stripe live-mode run requires explicit confirmation;
- demo account email is required for demo-specific smoke.

Run:

```powershell
npm exec vitest run tests/smoke-demo-readiness.test.ts tests/nic-nac-benchmark-plan.test.ts
```

Expected:
- Tests fail until harness exists.

- [ ] **Step D3: Implement smoke harness**

Implementation constraints:
- Print a plan before running actions.
- Exit nonzero on missing required env for selected category.
- Never print secrets.
- For paid Nic-Nac, reuse `assertPaidSmokeAllowed` from `spike/run-benchmark.ts`.

Add package script:

```json
"smoke:demo": "tsx scripts/smoke-demo-readiness.ts"
```

Run:

```powershell
npm exec vitest run tests/smoke-demo-readiness.test.ts tests/nic-nac-benchmark-plan.test.ts
npx tsc --noEmit --pretty false
```

Expected:
- Smoke harness tests pass.
- Typecheck passes.

- [ ] **Step D4: Commit smoke harness**

```powershell
git add -- package.json scripts/smoke-demo-readiness.ts tests/smoke-demo-readiness.test.ts
git commit -m "feat: add demo launch smoke harness"
```

---

### Workstream E: Demo Walkthrough And Blocker List

**Owner:** Main agent with Louis present  
**Purpose:** Convert the build into a practical go/no-go checklist.

**Files:**
- Create: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\launch-readiness-2026-05-18.md`
- Do not modify: `C:\Users\louis\neon-rabbit-core\docs\sparkle-suite\marketing\`

- [ ] **Step E1: Run local verification**

Run:

```powershell
npm exec vitest run
npx tsc --noEmit --pretty false
npm run build
git diff --check
```

Expected:
- Full test suite passes, or failures are triaged into P0/P1/P2.
- Typecheck and build pass.

- [ ] **Step E2: Run demo smoke with Louis-approved providers only**

Start with:

```powershell
npm run smoke:demo -- --category local_static
```

Then, only after Louis confirms env and scope:

```powershell
npm run smoke:demo -- --category supabase_demo
npm run smoke:demo -- --category stripe_test
npm run smoke:demo -- --category signwell_sandbox
```

Paid Nic-Nac smoke requires a separate explicit approval:

```powershell
$env:NIC_NAC_ALLOW_PAID_SMOKE='true'
$env:NIC_NAC_PAID_SMOKE_MAX_REQUESTS='20'
npm run smoke:demo -- --category nic_nac_paid
```

- [ ] **Step E3: Write the blocker list**

Create `docs/sparkle-suite/launch-readiness-2026-05-18.md` with sections:
- Ready for demo
- P0 launch blockers
- P1 onboarding blockers
- P2 post-launch polish
- Provider status
- Recommended first-user launch scope

- [ ] **Step E4: Commit launch readiness output**

```powershell
git add -- docs/sparkle-suite/launch-readiness-2026-05-18.md
git commit -m "docs: capture Sparkle Suite launch readiness"
```

---

## Parallel Dispatch Recommendation

Use three workers first:

- Worker 1: Workstream A, Stripe.
- Worker 2: Workstream B, SignWell.
- Worker 3: Workstream C, demo seed.

Main agent:
- Supervise workers.
- Review diffs.
- Run focused tests after each worker returns.
- Integrate D and E after A-C land.
- Stop for Louis before any paid or live-provider smoke.

## Definition Of Done

- Stripe test-mode checkout/portal path is smokeable.
- SignWell sandbox/dry-run agreement path is smokeable.
- Demo account seeding is repeatable.
- Demo smoke harness exists and blocks paid/live actions by default.
- Full test suite, typecheck, build, and diff check pass.
- A launch-readiness document lists only real blockers, not speculative polish.
