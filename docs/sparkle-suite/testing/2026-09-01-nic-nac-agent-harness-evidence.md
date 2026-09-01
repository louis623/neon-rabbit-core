# Nic-Nac agent-harness implementation evidence

Date: September 1, 2026

## Outcome

The approved Nic-Nac rebuild is implemented as a guarded release candidate. The top-level Workspace conversation is now driven by the Vercel AI SDK `ToolLoopAgent`: the model receives the complete capability catalog permitted for the authenticated surface, uses automatic tool choice, and may take up to six model/tool steps by default with a hard ceiling of eight.

The application still owns authentication, tenant isolation, tool schemas, validation, approval gates, audit behavior, data writes, streaming persistence, deterministic recovery, and proof of success. Existing transaction workflows may preserve transaction facts, but they no longer select or force the next conversational tool.

The production rollout is deliberately default-off. With no rollout environment variables, production requests use the preserved legacy route. An exact rep ID or email cohort can be enabled later, and `NIC_NAC_AGENT_HARNESS_ENABLED=false` is the kill switch. No cohort was enabled during this implementation.

## Implemented boundaries

- A concise employee guide tells Nic-Nac to interpret the latest explicit request, switch tasks naturally, ask one focused clarification when a material fact is missing, and use current tools rather than hidden phrase scripts.
- The permission-scoped tool catalog is assembled independently of user wording and old workflow state. The new harness deliberately excludes the legacy regex-based `prepare_calendar_work` resolver, so the model reasons directly among the real Calendar tools; the resolver remains only on the untouched legacy route.
- Every registered tool must have a safety-ledger classification before the agent can receive it. The ledger reconciles read/write behavior, approval metadata, side-effect risk, normal/setup surface access, and disclosed Support capability policy.
- SMS and email sends retain explicit approval. Support remains restricted from owner, billing, Stripe, payment, authentication, entitlement, DNS, domain, and customer-domain authority.
- Calendar reads finish as reads. A later explicit Calendar mutation replaces the read intent, while an unrelated explicit task can pause transaction context for that turn without being captured by it.
- Durable unfinished Calendar, Dance Floor, and trade transactions are loaded once per turn and supplied as bounded, valid JSON recoverable facts. Strings, arrays, object breadth, and nesting are capped; embedded rep/customer text is labeled untrusted data. Optional continuity read failures degrade to no continuity instead of blocking an unrelated request. The records never set the current goal or select a tool. In disclosed Support, only workflow domains covered by the session's exact capabilities are queried or disclosed.
- Passive replies are offered only to the most recently updated active workflow instead of being fanned into every active Calendar, Dance Floor, and trade ingestor. Explicit current requests still determine their own domain.
- Overlapping tool descriptions are now explicit: simple Calendar and Dance Floor questions call their direct read tools, while preflight tools are reserved for ambiguous mutations. An empty Calendar read cannot answer or block a later add request.
- The unused scripted task reducer and its tests were removed. The remaining task-context type is only a compact data envelope for recoverable transaction facts; it does not classify text or move a hidden state machine.
- Approval responses are accepted only when the final client assistant turn exactly matches the last canonical server-issued request: message ID, approval ID, tool name, tool-call ID, and input must all match. Approved work resumes through the actual `ToolLoopAgent`, so the model sees real tool success/failure and can continue with another tool; the old canned “Done” continuation was removed. Historical approvals are ignored on later user turns.
- Removing a public Pantry recipe or Join Team roster member now requires visible approval. Starting a show session is idempotent for the same anchor and cannot silently end a different active show; replacement requires an exact active-session guard plus visible approval. Show-session metadata is bounded.
- Provider failures thrown before a stream iterator exists now enter the same persistence, incident, and visible-error path as failures during iteration.
- The agent loop is bounded to six steps by default (hard ceiling eight), 1,600 output tokens per model call, one retry, and total/step/chunk timeouts of 75/35/25 seconds.
- Reviewed, versioned work knowledge is available for Sparkle Suite, live-show operation, live-stream troubleshooting, customer handling, closeout, and the boundary between general Bomb Party practice and current official policy.
- The existing UI stream, assistant-row persistence, thinking indicator, approval continuation, tool-result recovery, run telemetry, and legacy rollback route are preserved.

## Deterministic verification

- Critical same-conversation replay: Calendar read followed by add-show, Calendar/Dance Floor/site/guidance switches, Support capability isolation, canonical approval provenance, historical-approval isolation, and recovery paths — 17 tests passed on each of three consecutive final runs (51/51).
- Recorded agent-loop replay: one conversation switched Calendar read → Dance Floor read → grounded live-show guidance → Calendar write; all eight model steps received the same four-tool catalog with `toolChoice: auto`, and the expected four tools executed in order.
- Focused approval, task-continuity, tool-contract, show-session, agent-loop, and route suite — 92/92 passed after the final safety changes.
- Complete Nic-Nac regression suite — 1,390 passed, one existing skip across 171 files. The file count dropped by one because the disconnected scripted task-reducer test file was intentionally retired.
- Repository standard suite — 226/226 passed.
- Provider-free harness smoke — passed with 53 registered tools, 47 Workspace agent tools, the legacy Calendar resolver explicitly excluded, zero approval-ledger findings, production default-off, exact-cohort enablement, and zero paid model calls.
- Changed-file ESLint — passed with no findings.
- Next.js 16.2.1 production build, including TypeScript and static generation — passed.
- `git diff --check` — passed.

The standalone repository-wide `tsc --noEmit` command still reports pre-existing test-fixture typing errors outside this change. The production build's application TypeScript gate passed, and no changed-file lint or focused test errors remain.

## Still intentionally gated

These checks were not silently broadened into the implementation authorization:

- No paid live-model replay has run. It requires an explicit numeric request cap.
- No production rep/email cohort has been enabled.
- No real customer, Louis personal/admin account, restricted Support session, billing object, message recipient, DNS/domain/alias, or Live Queue extension was used or changed.
- The separately discussed scheduled isolated cross-workflow canary was not created.
- Browser-side Nic-Nac behavior was not claimed: the current in-app-browser runtime returned no claimable tab during preflight.

The next controlled acceptance gate is an exact synthetic-reviewer cohort plus a separately approved paid-request cap. It should replay natural-language Calendar read-to-add and cross-tool switches on the live customer domain, prove tool selection and visible answer quality, confirm no unintended data changes, and exercise the kill switch before broader rollout.
