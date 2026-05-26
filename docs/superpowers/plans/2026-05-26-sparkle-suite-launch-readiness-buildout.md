# Sparkle Suite Launch-Readiness Buildout Plan - 2026-05-26

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` before implementation. Workers must keep file ownership narrow, report changed paths, and never revert unrelated changes.

**Goal:** Move Sparkle Suite from "large pieces built" to launch-readable evidence by closing tracker/code drift, building Phase 11 real-flow smoke coverage, proving host-aware customer sites, and finishing rep-facing Nic-Nac/live queue readiness.

**Current truth:** Phase 5 SMS/email automation is complete, production pre-show SMS reminders are enabled, skins are committed/pushed, and HQ action cards have been corrected to `Launch Readiness Truth Pass` / `Choose Next Launch Lane`. Remaining launch work is mostly proof, routing/provisioning, integration, and operator readiness.

**Tech stack:** Next.js App Router 16.2.1, React 19, TypeScript, Supabase, Stripe, SignWell, Telnyx, Resend, Photoroom, PostHog-ready analytics surfaces, Vitest.

---

## Operating Guardrails

- Do not trigger live SMS, email, SignWell, Stripe, calendar, Photoroom, PostHog, or provider actions without explicit Louis approval for that exact action.
- Stripe work is test-mode only unless Louis separately approves live preflight.
- Do not attach `+19044383050` again.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not touch `docs/sparkle-suite/marketing/`.
- Keep the rep-facing assistant name as Nic-Nac.
- Before modifying Next.js route/page behavior, read the relevant local docs in `node_modules/next/dist/docs/`.
- Preserve the known untracked `docs/sparkle-suite/marketing/` path.

---

## Audit Summary

### Already Built Enough To Build On

- SMS/email Phase 5 live smoke and scheduler evidence.
- Customer-site skin presets: Amethyst, Morganite, Black Diamond, Rose Gold, Garnet, Amber, Velvet, Rose Quartz.
- Demo seed and smoke scaffolding: `seed:demo-rep`, `seed:demo-launch-flow`, `smoke:demo`, `smoke:launch`.
- Stripe test-mode checkout/webhook/portal coverage.
- SignWell sandbox/dry-run agreement coverage.
- Nic-Nac core chat, persisted state, HITL replay protection, rep notes memory, show-session state, and live queue snapshot service.
- Phase 9 helper foundations for sitemaps, robots, structured data, and llms text.

### Most Important Gaps

- No single Phase 11 journey manifest/report mapping the nine real-flow tasks to tests, smoke commands, and missing evidence.
- Payment-gate recovery contract drift: `PAYMENT_GATE_CHECKOUT_NOT_ENABLED` exists in the contract but is not emitted/covered by the route tests.
- 8.21 provisioning is incomplete: `reps.custom_domain` exists, but host-to-rep routing and setup-profile domain capture are not wired.
- Phase 9 is foundation-only until custom host routing, canonicals, JSON-LD injection, and `llms.txt` serving are live.
- Live-show flow is covered in pieces, not as a composed provider-free smoke.
- Customer-site live queue is still static/fallback-oriented and does not prove fresh/stale/empty states on public surfaces.
- Nic-Nac runtime uses structured `rep_notes`; Open Brain is not actually wired into assistant runtime context.
- PostHog analytics is a stubbed readiness/privacy shape, not a real privacy-first capture adapter.
- Photoroom has mocked/local queue coverage but lacks explicit real-provider proof path and evidence.
- Mobile/final responsive coverage is mostly CSS assertions, not rendered viewport smoke.

---

## Wave 0: Truth Drift And Control Plane

**Purpose:** Remove known contradictions before adding more build surface.

### Task 0.1: Payment-Gate Recovery Contract Drift

**Owner:** Worker A

**Files:**
- `lib/prelaunch/provider-recovery-contract.ts`
- `app/api/prelaunch/payment-gates/checkout/route.ts`
- `tests/prelaunch/prelaunch-payment-gates-route.test.ts`

**Steps:**
- [ ] Read the local Next.js route-handler docs before editing the route.
- [ ] Confirm whether checkout-disabled state should emit `PAYMENT_GATE_CHECKOUT_NOT_ENABLED` or whether the contract entry is stale.
- [ ] Add route tests for start-fee and launch-fee disabled checkout behavior.
- [ ] Implement the smallest code or contract fix so route behavior, tests, and recovery contract agree.
- [ ] Run `npm exec vitest run tests/prelaunch/prelaunch-payment-gates-route.test.ts tests/prelaunch-provider-recovery-contract.test.ts`.

**Done when:** route/tests/contract agree and focused tests pass.

### Task 0.2: Phase 11 Smoke Manifest

**Owner:** Worker B

**Files:**
- Create `lib/launch-readiness/phase-11-smoke-manifest.ts`
- Create `tests/phase-11-smoke-manifest.test.ts`
- Optional later integration: `scripts/smoke-demo-readiness.ts`

**Steps:**
- [ ] Define the nine HQ Phase 11 journeys as data: onboarding, daily workflow, live show, post-show, dashboard/Nic-Nac, cancellation, multi-rep isolation, error recovery, mobile/final responsive.
- [ ] For each journey, list current evidence files, safe smoke command if one exists, status (`covered`, `partial`, `missing`), and next action.
- [ ] Add tests proving all nine journeys are present and no live/provider action is included by default.
- [ ] Run `npm exec vitest run tests/phase-11-smoke-manifest.test.ts`.

**Done when:** Phase 11 has a machine-readable truth layer that can drive HQ/documentation and later smoke commands.

### Task 0.3: Live Queue Help And Rollout Readiness

**Owner:** Worker C

**Files:**
- `lib/services/help-resources.ts`
- Existing related tests for help resources or dashboard help display
- Optional docs outside `docs/sparkle-suite/marketing/`

**Steps:**
- [ ] Add rep-facing help resources for Live Queue setup, sync code, Party Filter, troubleshooting, and Web Store vs unpacked-install status.
- [ ] Keep language clear that the extension can be repo-ready while Web Store approval/rep rollout are separate.
- [ ] Add or update tests so Nic-Nac/help surfaces can retrieve the new guidance.
- [ ] Run the focused help-resource tests.

**Done when:** reps/Nic-Nac have launch-facing guidance for the live queue extension.

---

## Wave 1: Customer-Site Provisioning And Host-Aware SEO

**Purpose:** Make the customer-site phase real for custom domains and stop hardcoding Sparkle Suite canonicals.

### Task 1.1: Host-To-Rep Resolution

**Owner:** Worker D after Wave 0 starts cleanly

**Files:**
- `lib/amethyst/request-rep-target.ts`
- `lib/amethyst/preview-rep.ts`
- Optional new `lib/amethyst/host-routing.ts`
- `tests/amethyst-request-rep-target.test.ts`
- `tests/amethyst-preview-rep.test.ts`

**Steps:**
- [ ] Normalize request hosts safely, including localhost and preview hosts.
- [ ] Resolve `reps.custom_domain` when no explicit `?c=`/`repId` override is present.
- [ ] Preserve demo/local overrides for current smoke workflows.
- [ ] Add tests for custom domain hit, unknown host fallback, and explicit override precedence.

### Task 1.2: Provisioning Carries Domain Data

**Owner:** Worker E

**Files:**
- `lib/prelaunch/client-account.ts`
- `lib/prelaunch/production-roster.ts`
- Setup-profile/control-center route/tests as discovered
- Migration only if setup profiles lack a suitable domain field

**Steps:**
- [ ] Decide whether existing setup profile fields can carry `custom_domain`.
- [ ] Populate `reps.custom_domain` during ready launch-build connection.
- [ ] Keep Vercel/domain-provider automation out of scope for this task.
- [ ] Add tests proving domain data flows from launch setup to production rep.

### Task 1.3: Host-Aware Phase 9 Outputs

**Owner:** Worker F after Task 1.1

**Files:**
- `app/sitemap.ts`
- `app/robots.ts`
- New `app/llms.txt/route.ts`
- `app/amethyst/[...asset]/route.ts`
- `lib/seo/*`
- SEO and Amethyst tests

**Steps:**
- [ ] Serve sitemap/robots/llms text from the request host where supported.
- [ ] Replace hardcoded Amethyst canonical output with host-aware canonical data.
- [ ] Inject JSON-LD into Amethyst public HTML where appropriate.
- [ ] Add tests for custom host URLs, default Sparkle Suite URLs, and local/preview behavior.

---

## Wave 2: Phase 11 Real-Flow Proof

**Purpose:** Convert unit-level coverage into launch-story evidence.

### Task 2.1: Provider-Free Live-Show Composed Smoke

**Owner:** Worker G

**Files:**
- New `lib/launch-readiness/live-show-smoke.ts` or similar
- New `tests/live-show-smoke.test.ts`
- Optional integration with `scripts/smoke-demo-readiness.ts`

**Steps:**
- [ ] Compose existing pieces with injected dependencies: pre-show reminder plan, live queue snapshot, customer-site trade/request action, Nic-Nac show-session event, fulfillment/post-show status.
- [ ] Default to provider-free mode: no SMS/email/provider sends.
- [ ] Report fresh/stale/empty live queue states.
- [ ] Add tests for happy path, empty queue, stale queue, and provider-action exclusion.

### Task 2.2: Cancellation And Multi-Rep Route-Level Smokes

**Owner:** Worker H

**Files:**
- Existing Stripe/refund/cancellation tests
- Existing multi-rep isolation tests
- New launch-readiness tests as needed

**Steps:**
- [ ] Add a cancellation smoke that covers subscription cancellation/offline-at-period-end without live Stripe calls.
- [ ] Add route-level two-rep isolation proof for workspace/public data access.
- [ ] Keep provider calls mocked or test-mode only.

### Task 2.3: Rendered Mobile/Viewport Smoke

**Owner:** Main agent or browser-focused worker

**Files:**
- New script/test under `scripts/` and `tests/`
- Launch-readiness docs outside marketing

**Steps:**
- [ ] Verify `/prelaunch`, `/nic-nac`, and Amethyst homepage/trade/join at mobile widths.
- [ ] Check render success, auth boundary where needed, key controls visible, and no horizontal overflow.
- [ ] Use browser automation after dev server is running.

---

## Wave 3: Provider Proof And Analytics

**Purpose:** Prepare controlled proof paths without surprise external actions.

### Task 3.1: Photoroom Provider Smoke Harness

**Owner:** Worker I

**Files:**
- `scripts/smoke-demo-readiness.ts`
- `lib/services/photo-enhancement-queue.ts`
- Existing Photoroom/photo tests

**Steps:**
- [ ] Add a Photoroom provider-proof category that is blocked by default.
- [ ] Require explicit env approval for real provider call.
- [ ] Ensure default launch smoke remains provider-free.
- [ ] Add tests proving real provider calls cannot run accidentally.

### Task 3.2: Privacy-First Analytics Adapter

**Owner:** Worker J

**Files:**
- `lib/services/site-analytics.ts`
- `app/api/nic-nac/site-analytics/route.ts`
- `tests/nic-nac-site-analytics-route.test.ts`

**Steps:**
- [ ] Replace stubbed readiness with an adapter boundary that can capture safe events when configured.
- [ ] Keep PII minimization and opt-out behavior explicit.
- [ ] Add tests for disabled config, allowed event capture, rejected PII-ish payloads, and no-secret output.

### Task 3.3: Provider Evidence Runbooks

**Owner:** Main agent with Louis approval

**Files:**
- Docs outside marketing

**Steps:**
- [ ] Record Photoroom provider proof only after Louis approves a controlled run.
- [ ] Record PostHog proof only after Louis approves using configured analytics.
- [ ] Record any SignWell/Stripe live-preflight proof only under explicit approval and existing test-mode-first guardrails.

---

## Wave 4: Nic-Nac Memory Decision

**Purpose:** Resolve the launch promise around memory without pretending Open Brain is already in runtime.

### Task 4.1: Memory Architecture Decision And Proof

**Owner:** Main agent first, worker only after decision

**Options:**
- Launch with structured `rep_notes` as Nic-Nac memory and document Open Brain as HQ/operator memory.
- Add read-only Open Brain/Memory Index retrieval into Nic-Nac runtime with strict rep isolation and prompt-injection tests.

**Minimum proof either way:**
- Cross-rep leakage tests.
- Prompt-injection resistance tests.
- Rep-facing help copy that tells reps what Nic-Nac remembers and how to correct it.

---

## Recommended First Parallel Wave

Start with three workers only:

- Worker A: Task 0.1 payment-gate truth drift.
- Worker B: Task 0.2 Phase 11 smoke manifest.
- Worker C: Task 0.3 live queue help and rollout readiness.

Main agent responsibilities:

- Review every worker diff before accepting it.
- Run focused tests after each worker returns.
- Keep Wave 1 host routing and Wave 2 live-show smoke queued until Wave 0 is clean.
- Stop before any live/provider action.

## Definition Of Done For This Buildout

- Phase 11 has a clear machine-readable journey map and real smoke evidence path.
- Known tracker/code drift is corrected or explicitly documented.
- Host-aware customer-site provisioning exists without provider-side domain automation claims.
- Phase 9 outputs reflect the actual host/domain state.
- Live queue surfaces and rep help are launch-ready.
- Nic-Nac memory promise is truthful and tested.
- Provider proof paths are guarded by default and documented after approved runs.
- Focused tests, typecheck, build, and relevant browser smoke pass before final closeout.
