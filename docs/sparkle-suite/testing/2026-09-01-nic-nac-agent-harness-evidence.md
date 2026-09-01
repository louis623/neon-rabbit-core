# Nic-Nac agent-harness implementation evidence

Date: September 1, 2026

## Outcome

The approved Nic-Nac rebuild is implemented as a guarded release candidate. The top-level Workspace conversation is now driven by the Vercel AI SDK `ToolLoopAgent`: the model receives the complete capability catalog permitted for the authenticated surface, uses automatic tool choice, and may take up to six model/tool steps by default with a hard ceiling of eight.

The application still owns authentication, tenant isolation, tool schemas, validation, approval gates, audit behavior, data writes, streaming persistence, deterministic recovery, and proof of success. Existing transaction workflows may preserve transaction facts, but they no longer select or force the next conversational tool.

The production rollout is deliberately default-off. With no rollout environment variables, production requests use the preserved legacy route. An exact rep ID or email cohort can be enabled later, and `NIC_NAC_AGENT_HARNESS_ENABLED=false` is the kill switch. No cohort was enabled during this implementation.

## Implemented boundaries

- A concise employee guide tells Nic-Nac to interpret the latest explicit request, switch tasks naturally, ask one focused clarification when a material fact is missing, and use current tools rather than hidden phrase scripts.
- The full permission-scoped tool catalog is assembled independently of user wording and old workflow state.
- Every registered tool must have a safety-ledger classification before the agent can receive it. The ledger reconciles read/write behavior, approval metadata, side-effect risk, normal/setup surface access, and disclosed Support capability policy.
- SMS and email sends retain explicit approval. Support remains restricted from owner, billing, Stripe, payment, authentication, entitlement, DNS, domain, and customer-domain authority.
- Calendar reads finish as reads. A later explicit Calendar mutation replaces the read intent, while an unrelated explicit task can pause transaction context for that turn without being captured by it.
- Reviewed, versioned work knowledge is available for Sparkle Suite, live-show operation, live-stream troubleshooting, customer handling, closeout, and the boundary between general Bomb Party practice and current official policy.
- The existing UI stream, assistant-row persistence, thinking indicator, approval continuation, tool-result recovery, run telemetry, and legacy rollback route are preserved.

## Deterministic verification

- Critical same-conversation replay: Calendar read followed by add-show, plus Calendar/Dance Floor/site/guidance switches and recovery paths — 12 tests passed on each of three consecutive runs (36/36).
- Focused harness, rollout, real multi-step tool-loop, safety-ledger, knowledge, and route suite — 32/32 passed.
- Complete Nic-Nac regression suite — 1,271 passed, one existing skip across 168 files.
- Repository standard suite — 226/226 passed.
- Provider-free harness smoke — passed with 53 registered tools, 48 Workspace agent tools, zero approval-ledger findings, production default-off, exact-cohort enablement, and zero paid model calls.
- Changed-file ESLint — passed with no findings.
- Next.js 16.2.1 production build, including TypeScript and static generation — passed.
- `git diff --check` — passed.

## Still intentionally gated

These checks were not silently broadened into the implementation authorization:

- No paid live-model replay has run. It requires an explicit numeric request cap.
- No production rep/email cohort has been enabled.
- No real customer, Louis personal/admin account, restricted Support session, billing object, message recipient, DNS/domain/alias, or Live Queue extension was used or changed.
- The separately discussed scheduled isolated cross-workflow canary was not created.
- Browser-side Nic-Nac behavior was not claimed: the current in-app-browser runtime returned no claimable tab during preflight.

The next controlled acceptance gate is an exact synthetic-reviewer cohort plus a separately approved paid-request cap. It should replay natural-language Calendar read-to-add and cross-tool switches on the live customer domain, prove tool selection and visible answer quality, confirm no unintended data changes, and exercise the kill switch before broader rollout.
