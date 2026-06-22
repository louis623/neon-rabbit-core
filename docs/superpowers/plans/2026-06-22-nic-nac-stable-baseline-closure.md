# Nic-Nac Stable Baseline Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a stable beta baseline for Nic-Nac across Sparkle Suite and Sparkle Finder by freezing the v1 scope, running a documented smoke/evaluation matrix, fixing only blocker failures, and recording a clear ship/no-ship decision.

**Architecture:** Nic-Nac is one shared ecosystem agent whose language, memory context, model policy, and product permissions are assembled by the host app at request time. Sparkle Suite remains the authenticated workspace for Suite mutations, Sparkle Finder can read and display Finder-safe linked context, and the Lab is a bounded analysis surface that can recommend improvements but cannot mutate production behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vercel AI SDK, OpenAI model policies (`gpt-5.4`, `gpt-5.5`, `gpt-5.4-mini`), Supabase, Vitest, Playwright, Vercel CLI, Node/tsx smoke scripts, stable review aliases.

## Baseline Scope

This baseline is shippable when these surfaces pass the gates below:

- Suite workspace Nic-Nac can hold mission-focused, friendly, Virgo-shaped conversations while staying inside Sparkle Suite, Sparkle Finder, Bomb Party, live-show, business, collector, jewelry, streaming, and system-help scope.
- Suite Trade Board intake supports item-number-first workflows, typed collection, photos in any order, boxed jewelry display photos, label/detail photos as detail-only evidence, duplicate item-number confirmation for a second physical piece, and real listing creation through tools.
- Suite memory supports global lessons, shared linked-human memory, Suite rep private memory, and product-safe context assembly without cross-rep leakage.
- Finder Nic-Nac presents as the same Nic-Nac for Silver users and linked reps, preloads Finder-safe memory, reads allowed public/Finder context, and refuses Suite mutations from Finder with a calm instruction to log in to Sparkle Suite.
- Secret Rep ID Number is the rep-linking credential for Finder claim. Referral code is not used for identity linking.
- Model routing is OpenAI-only for Nic-Nac: `human_default` uses `gpt-5.4` at medium reasoning, `human_escalated` uses `gpt-5.5`, `utility_fast` uses `gpt-5.4-mini`, and `lab_synthesis` uses `gpt-5.5` with bounded high reasoning.
- Sparkle Lab has a Control Center page, route protection, weekly/manual/urgent run types, default caps, persisted findings, and no production self-mutation. Weekly defaults remain bounded: 500 cents per scheduled run, 2,000 cents per month scheduled cap, 20 model calls, 4 premium calls, 20 minute runtime cap, 3 headline findings, and 2 active priorities.
- Reviewer-safe deployed smokes exist for Suite and Finder so Louis does not need personal auth, live customer data, or live provider side effects to review.

The following work is outside this stable baseline and moves to backlog unless a baseline gate fails:

- Rich Finder chat upload mutation workflows and full collector catalog editing from Nic-Nac.
- A fully extracted shared package or monorepo library for all Nic-Nac core code.
- Always-on Lab automation or unbounded model synthesis.
- Broad model bake-off, pricing experiments, and large eval-bank expansion.
- Final attorney-reviewed privacy/terms language beyond verifying current pages disclose memory, tool gating, and model-provider processing.

## Ship Criteria

All of these must be true before calling the stable baseline done:

- [ ] Suite local gate passes.
- [ ] Suite deployed gate passes against `https://sparkle-suite-demo.vercel.app`.
- [ ] Finder local gate passes.
- [ ] Finder deployed gate passes against `https://sparkle-finder-dev.vercel.app`.
- [ ] Cross-product linked-rep and memory gate passes.
- [ ] Lab guardrail gate passes.
- [ ] Model policy and telemetry gate passes in both repos.
- [ ] No gate failure is papered over as "future work." Failures are either fixed or explicitly marked blocker with the exact missing dependency.
- [ ] Vault notes record the final ship/no-ship decision, evidence commands, deployed URLs, and remaining backlog.

## Task 1: Freeze The Baseline Ledger

Create `docs/nic-nac/stable-baseline-checklist.md` in the Suite repo and use it as the run ledger for this plan.

- [ ] Record the exact Suite branch, Finder branch, Suite commit, Finder commit, Suite stable URL, and Finder stable URL.
- [ ] Record the in-scope baseline list from this plan.
- [ ] Record the out-of-scope backlog list from this plan.
- [ ] Record all environment-sensitive values by name only, never secret values: `OPENAI_API_KEY`, `NIC_NAC_HUMAN_DEFAULT_MODEL`, `NIC_NAC_HUMAN_ESCALATED_MODEL`, `NIC_NAC_UTILITY_MODEL`, `NIC_NAC_LAB_SYNTHESIS_MODEL`, Supabase URLs/keys, smoke tokens, and Finder/Suite bridge tokens.
- [ ] Add a "Result" section with `PASS`, `FAIL`, or `BLOCKED` for each gate below.

## Task 2: Suite Local Gate

Run these commands from `C:\Users\louis\sparkle-suite-repo`.

- [ ] `git status --short --branch`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm exec vitest run tests/nic-nac/core-prompt.test.ts tests/nic-nac/mission-guard.test.ts tests/nic-nac/mission-guard-route.test.ts tests/nic-nac/mission-guard-route-runtime.test.ts`
- [ ] `npm exec vitest run tests/nic-nac/model-policy.test.ts tests/nic-nac/model-policy-route.test.ts tests/nic-nac/model-cost.test.ts tests/nic-nac/run-telemetry.test.ts tests/nic-nac/tool-telemetry.test.ts`
- [ ] `npm exec vitest run tests/nic-nac/add-listing-batch.test.ts tests/nic-nac/jewelry-database.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/trade-board-intake-controller.test.ts tests/nic-nac/trade-board-intake-eval.test.ts tests/nic-nac/trade-board-intake-route-context.test.ts tests/nic-nac/tool-routing.test.ts tests/nic-nac/tool-choice-policy.test.ts tests/services/trade-board-add-listing.test.ts`
- [ ] `npm exec vitest run tests/nic-nac/context-assembler.test.ts tests/nic-nac/rep-memory-cards.test.ts tests/nic-nac/product-context.test.ts tests/nic-nac/core-tool-policy.test.ts tests/sparkle-finder-linked-rep-memory.test.ts tests/sparkle-finder-rep-claim.test.ts`
- [ ] `npm exec vitest run tests/control-center-sparkle-lab-page.test.ts tests/control-center-sparkle-lab-run-route.test.ts tests/sparkle-lab-weekly-route.test.ts tests/sparkle-lab/schema.test.ts tests/sparkle-lab/runner.test.ts tests/sparkle-lab/read-model.test.ts tests/sparkle-lab/budget.test.ts tests/nic-nac/lab-budget.test.ts tests/vercel-cron-config.test.ts`

Success criteria:

- [ ] Lint exits 0. Existing warnings can remain if unrelated and previously accepted.
- [ ] Unit/integration tests exit 0.
- [ ] Build exits 0.
- [ ] Mission guard redirects off-mission, therapist, general chatbot, and grocery-list requests before model setup.
- [ ] Virgo personality is locked as behavior and rare/light mention, not routine astrology chatter.
- [ ] Duplicate item-number flow asks whether the rep is adding a second physical piece instead of refusing the add.
- [ ] Tool retention stays available during active add-listing workflows.
- [ ] Memory scopes do not leak across reps or products.
- [ ] Lab caps and route protections remain enforced.

## Task 3: Suite Deployed Gate

Run these commands from `C:\Users\louis\sparkle-suite-repo`.

- [ ] Confirm the stable alias responds: `Invoke-WebRequest -Uri https://sparkle-suite-demo.vercel.app -UseBasicParsing | Select-Object StatusCode`
- [ ] Run the paid preflight smoke: `npm run smoke:nic-nac:paid-preflight`
- [ ] Run the Trade Board live API replay once: `npm run smoke:nic-nac:trade-board-intake`
- [ ] Run the Trade Board live API replay two more times with the same command.

Environment expected by the Trade Board smoke:

- `SPARKLE_NIC_NAC_SMOKE_APP_URL` defaults to `https://sparkle-suite-demo.vercel.app`.
- `SPARKLE_NIC_NAC_SMOKE_ASSETS` defaults to `C:\Users\louis\sparkle-suite-smoke-assets`.
- Required assets are `ER13229-label.jpg` and `ER13229-jewelry-boxed-front.jpg`.
- Required Supabase env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Optional account env: `DEMO_REP_EMAIL`; without it, the reviewer-smoke persona is used.

Success criteria:

- [ ] Stable alias returns HTTP 200.
- [ ] Paid preflight returns success for the Nic-Nac category.
- [ ] ER13229 replay passes 3 consecutive times.
- [ ] The label/details photo is not accepted as jewelry-front evidence.
- [ ] The boxed jewelry display photo is accepted as website-worthy front evidence.
- [ ] Created listing is available before cleanup and tied to ER13229 The Florence Earrings.
- [ ] Smoke cleanup removes the created listing unless `SPARKLE_NIC_NAC_SMOKE_KEEP_LISTING=true` was intentionally set.
- [ ] Hard-fail phrases count is 0, including manual-add refusals and duplicate-listing refusals.

## Task 4: Finder Local Gate

Run these commands from `C:\Users\louis\sparkle-finder-repo`.

- [ ] `git status --short --branch`
- [ ] `npm run lint`
- [ ] `npm test -- tests/sparkle-finder`
- [ ] `npm run build`
- [ ] `npm test -- tests/sparkle-finder/finder-nic-nac-route.test.ts tests/sparkle-finder/finder-nic-nac-prompt.test.ts tests/sparkle-finder/finder-nic-nac-tools.test.ts tests/sparkle-finder/finder-nic-nac-tool-policy.test.ts tests/sparkle-finder/finder-nic-nac-curator.test.ts tests/sparkle-finder/finder-nic-nac-mission-guard.test.ts tests/sparkle-finder/finder-nic-nac-persistence.test.ts`
- [ ] `npm test -- tests/sparkle-finder/suite-linked-rep-memory.test.ts tests/sparkle-finder/showcase-studio.test.ts tests/sparkle-finder/showcase-studio-schema.test.ts tests/sparkle-finder/showcase-studio-persistence.test.ts`
- [ ] `npm test -- tests/sparkle-finder/finder-reviewer-smoke-session-route.test.ts tests/sparkle-finder/finder-nic-nac-smoke-script.test.ts tests/sparkle-finder/finder-nic-nac-telemetry-smoke-route.test.ts tests/sparkle-finder/nic-nac-model-provider.test.ts`

Success criteria:

- [ ] Lint exits 0.
- [ ] Finder Sparkle Finder tests exit 0.
- [ ] Build exits 0.
- [ ] Silver access is required before model-backed Finder Nic-Nac streams.
- [ ] Off-mission requests redirect before model configuration and tools.
- [ ] Finder route uses shared OpenAI model policy, not Anthropic/Haiku route hardcoding.
- [ ] Finder memory preload includes safe linked context and filters unsafe memory.
- [ ] Finder tool policy blocks Suite workspace mutations from Finder.
- [ ] Reviewer-smoke route requires bearer auth.

## Task 5: Finder Deployed Gate

Run these commands from `C:\Users\louis\sparkle-finder-repo`.

- [ ] Confirm the stable alias responds: `Invoke-WebRequest -Uri https://sparkle-finder-dev.vercel.app -UseBasicParsing | Select-Object StatusCode`
- [ ] Confirm reviewer smoke route blocks unauthenticated calls:

```powershell
Invoke-WebRequest `
  -Uri https://sparkle-finder-dev.vercel.app/api/internal/finder/reviewer-smoke-session `
  -Method POST `
  -SkipHttpErrorCheck `
  -UseBasicParsing |
  Select-Object StatusCode
```

- [ ] Rotate or set `SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN` in Vercel without printing the value in logs.
- [ ] Run deployed Finder Nic-Nac smoke:

```powershell
# $smokeToken is the rotated or retrieved token for this run. Do not print it.
$env:SPARKLE_FINDER_NIC_NAC_SMOKE_BASE_URL='https://sparkle-finder-dev.vercel.app'
$env:SPARKLE_FINDER_NIC_NAC_SMOKE_START_SERVER='false'
$env:SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN=$smokeToken
npm run smoke:finder-nic-nac
```

- [ ] Run Vercel error/fatal log scan for the Finder deployment after the smoke.

Success criteria:

- [ ] Stable alias returns HTTP 200.
- [ ] Unauthenticated reviewer-smoke route returns 401.
- [ ] Deployed smoke returns `stream_ok`.
- [ ] Hard-fail phrases count is 0.
- [ ] Reviewer smoke session cleanup completes without warning.
- [ ] Vercel logs show no new Finder Nic-Nac error/fatal entries caused by the smoke.

## Task 6: Cross-Product Linked-Rep And Memory Gate

Run this command from `C:\Users\louis\sparkle-finder-repo`.

```powershell
$env:SPARKLE_FINDER_LINKED_SMOKE_BASE_URL='https://sparkle-finder-dev.vercel.app'
npm run smoke:finder-linked-runtime
```

Environment names accepted by the smoke:

- `SPARKLE_FINDER_LINKED_SMOKE_SUITE_ENV_FILE`
- `SPARKLE_FINDER_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `SPARKLE_FINDER_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SPARKLE_FINDER_LINKED_SMOKE_SECRET_REP_ID_NUMBER`
- `SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN`
- `SPARKLE_SUITE_FINDER_REP_CLAIM_API_URL`
- `SPARKLE_SUITE_FINDER_API_BASE_URL` or `NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL`
- `SPARKLE_SUITE_SERVICE_ROLE_KEY`
- `SPARKLE_SUITE_SUPABASE_URL`
- `SPARKLE_FINDER_LINKED_SMOKE_RUN_NIC_NAC`
- `SPARKLE_FINDER_LINKED_SMOKE_NIC_NAC_PROMPT`

Success criteria:

- [ ] Smoke creates a temporary Finder user and cleans it up.
- [ ] Secret Rep ID Number claim persists `is_rep`, Suite rep id, Suite business name, public site slug, and claimed timestamp.
- [ ] Finder membership becomes `silver_rep_included` with `silver_source=sparkle_suite_rep`.
- [ ] Finder Nic-Nac answers as the same shared Nic-Nac while keeping Suite mutations gated to Sparkle Suite.
- [ ] Finder Nic-Nac run telemetry records `model_provider=openai`, `model_policy_key=human_default`, model name, token usage, and completed status.
- [ ] No shared memory card leaks another rep's private context.

## Task 7: Lab Guardrail Gate

Run these commands from `C:\Users\louis\sparkle-suite-repo`.

- [ ] `npm exec vitest run tests/control-center-sparkle-lab-page.test.ts tests/control-center-sparkle-lab-run-route.test.ts tests/sparkle-lab-weekly-route.test.ts tests/sparkle-lab/schema.test.ts tests/sparkle-lab/runner.test.ts tests/sparkle-lab/read-model.test.ts tests/sparkle-lab/budget.test.ts tests/nic-nac/lab-budget.test.ts tests/vercel-cron-config.test.ts`
- [ ] Confirm weekly route blocks unauthenticated requests:

```powershell
Invoke-WebRequest `
  -Uri https://sparkle-suite-demo.vercel.app/api/internal/sparkle-lab/weekly `
  -Method GET `
  -SkipHttpErrorCheck `
  -UseBasicParsing |
  Select-Object StatusCode
```

Success criteria:

- [ ] Control Center Lab page renders latest runs, caps, headline findings, active priorities, and access issues.
- [ ] Manual route and weekly route are protected.
- [ ] Model synthesis is disabled unless explicitly requested and configured.
- [ ] Unknown/unpriced model families skip synthesis rather than undercounting spend.
- [ ] Default caps match the baseline values in this plan.
- [ ] Lab artifacts recommend improvements but do not mutate prompts, tools, model policy, database schema, or deployed settings.

## Task 8: Model Policy And Cost Gate

Run these commands from `C:\Users\louis\sparkle-suite-repo`.

- [ ] `npm exec vitest run tests/nic-nac/model-policy.test.ts tests/nic-nac/model-policy-route.test.ts tests/nic-nac/model-cost.test.ts tests/nic-nac/run-thresholds.test.ts tests/nic-nac/run-telemetry.test.ts`
- [ ] Verify Suite deployment env has one OpenAI API key and no required Anthropic key for Nic-Nac route operation.

Run these commands from `C:\Users\louis\sparkle-finder-repo`.

- [ ] `npm test -- tests/sparkle-finder/nic-nac-model-provider.test.ts tests/sparkle-finder/finder-nic-nac-route.test.ts tests/sparkle-finder/finder-nic-nac-persistence.test.ts`
- [ ] Verify Finder deployment env has one OpenAI API key and no required Anthropic key for Finder Nic-Nac route operation.

Success criteria:

- [ ] `human_default` resolves to `gpt-5.4` unless `NIC_NAC_HUMAN_DEFAULT_MODEL` overrides it.
- [ ] `human_escalated` resolves to `gpt-5.5` unless `NIC_NAC_HUMAN_ESCALATED_MODEL` overrides it.
- [ ] `utility_fast` resolves to `gpt-5.4-mini` unless `NIC_NAC_UTILITY_MODEL` overrides it.
- [ ] `lab_synthesis` resolves to `gpt-5.5` unless `NIC_NAC_LAB_SYNTHESIS_MODEL` overrides it.
- [ ] Route files do not hardcode Anthropic/Haiku/Sonnet model ids for Nic-Nac.
- [ ] Token usage, estimated cost, model provider, model policy key, and model id are persisted for model-in-loop runs.
- [ ] Mission redirects record no model spend.

## Task 9: Browser Smoke For Louis-Visible Surfaces

Use the browser connector or Playwright against stable aliases.

- [ ] Open `https://sparkle-suite-demo.vercel.app` and complete the reviewer smoke login path.
- [ ] Visit the Suite workspace Nic-Nac surface.
- [ ] Send a mission-safe prompt: `What can you help me with during my live show?`
- [ ] Send a light personality prompt: `Are you really a Virgo?`
- [ ] Send an off-mission prompt: `Make my grocery list for the week.`
- [ ] Visit `https://sparkle-finder-dev.vercel.app`.
- [ ] Use the Finder reviewer smoke path or deployed smoke token route, not Louis's personal account.
- [ ] Open Finder Nic-Nac as a Silver user.
- [ ] Send: `From Sparkle Finder, remind me how you handle Sparkle Suite workspace requests.`

Success criteria:

- [ ] Suite visible Nic-Nac loads without console crash.
- [ ] Suite mission-safe prompt is helpful and product-focused.
- [ ] Virgo mention is low-key and only in the light personality interaction.
- [ ] Off-mission prompt redirects politely before model/tool work.
- [ ] Finder visible Nic-Nac loads without console crash.
- [ ] Finder answer feels like the same Nic-Nac but does not offer to mutate Suite data from Finder.
- [ ] No smoke requires Louis's personal login, personal data, live charges, or live customer/provider side effects.

## Task 10: Fix Policy During Closure

Use this policy while executing the gates:

- [ ] Fix blocker failures that violate an in-scope baseline rule.
- [ ] Fix broken tests, broken builds, broken smoke cleanup, missing reviewer-safe auth, model-not-configured errors, and hard-fail phrases.
- [ ] Fix any accidental Anthropic dependency in the Nic-Nac runtime path.
- [ ] Do not add new product features unless a failing baseline gate requires it.
- [ ] Do not broaden Lab automation beyond the existing guarded weekly/manual/urgent surfaces.
- [ ] Do not mutate live customer or rep data except temporary smoke fixtures that are cleaned up by the smoke.
- [ ] Do not use Louis's personal account for reviewer smokes.

## Task 11: Release Notes And Vault Closeout

After all gates pass, update the Suite repo.

- [ ] Add or update `docs/nic-nac/stable-baseline-release.md` with the shipped baseline, commands run, deployed URLs, and known backlog.
- [ ] Update `vault/session-log.md` with the closure summary.
- [ ] Update `vault/decisions.md` if any policy changed during closure.
- [ ] Update `vault/open-items.md` so stable-baseline blockers are removed and ongoing enhancements remain clearly labeled as backlog.
- [ ] Commit and push Suite documentation and any Suite code fixes.

After all Finder gates pass, update the Finder repo if Finder code/docs changed.

- [ ] Commit and push Finder documentation and any Finder code fixes.
- [ ] Confirm `https://sparkle-finder-dev.vercel.app` points to the intended deployment after any Finder deploy.

## Baseline Is Done When

- [ ] Every gate in this plan is `PASS`.
- [ ] Stable URLs are recorded.
- [ ] Reviewer smoke paths are documented and repeatable.
- [ ] All temporary smoke data is cleaned up.
- [ ] No critical caveat remains hidden in the final answer.
- [ ] Remaining Nic-Nac ideas are recorded as backlog, not baseline blockers.

## Recommended Execution Mode

Use subagent-driven execution with one supervised worker per independent gate:

- Suite local/deployed gate worker.
- Finder local/deployed gate worker.
- Cross-product linked-rep and memory gate worker.
- Lab/model-policy gate worker.
- Main agent supervisor to reconcile results, review patches, rerun failing gates, and write closeout.

If subagents are not available, execute sequentially in the task order above and stop at the first true blocker only after recording the exact command, exit status, output summary, and likely owner.
