# Nic-Nac agent-harness implementation evidence

Date: September 1, 2026

> Production cutover update: commit `564223ac` retired the legacy route and
> rollout gate. The ToolLoopAgent is now the only `/api/nic-nac` orchestrator.
> Any default-off or legacy-fallback wording retained in the chronological
> evidence below describes the earlier implementation/review state, not the
> current production architecture.

## Outcome

The approved Nic-Nac rebuild is implemented and live. The top-level Workspace conversation is driven by the Vercel AI SDK `ToolLoopAgent`: the model receives the complete capability catalog permitted for the authenticated surface, uses automatic tool choice, and may take up to six model/tool steps by default with a hard ceiling of eight.

The application still owns authentication, tenant isolation, tool schemas, validation, approval gates, audit behavior, data writes, streaming persistence, deterministic recovery, and proof of success. Existing transaction workflows may preserve transaction facts, but they no longer select or force the next conversational tool.

The production route has no legacy fallback or rollout switch. Git and the preserved prior Vercel deployment remain the recoverable rollback evidence; a missing environment variable cannot silently return a rep to the retired route.

## Sole-agent production release

- Exact commit `564223ac10918d14e5a19e79bdb2b5af21b5b597` removed the 1,428-line legacy handler, removed the rollout gate, and made every `/api/nic-nac` response identify `x-nic-nac-orchestrator: agent` from the start of request handling.
- A completely blank successful model turn is retried once only when no tool has started. Once a tool begins, the route never replays the turn, so writes cannot be duplicated. Existing deterministic tool-result summaries and the tenant-scoped Calendar read recovery remain the final safety net.
- Provider-free proof passed 1,294 Nic-Nac tests with one skip, 228 standard tests, the 45-tool architecture/safety smoke with zero paid model calls, changed-file ESLint, diff checks, and the Next.js production build.
- Ready deployment `dpl_3GEo2haLjRbgkiUCqapMzWHk6Bdo` / `sparkle-suite-6vppehzbk-louis-2849s-projects.vercel.app` was verified while held, then only `www.yoursparklesuite.com` and `yoursparklesuite.com` were moved to it. Root and `/nic-nac` returned 200, health reported API/database reachable and zero recent errors, and an unauthenticated zero-model-call live probe returned `X-Nic-Nac-Orchestrator: agent`.
- Bri's Glowtique and The Bling Kitchen remained on `dpl_2qiLozydCs16rXufFNbqttMvfDWz`. No signed-in account, paid Nic-Nac call, customer data, message, billing object, DNS, customer-domain mapping, or Live Queue state was used or changed during release proof.

## Implemented boundaries

- A concise employee guide tells Nic-Nac to interpret the latest explicit request, switch tasks naturally, ask one focused clarification when a material fact is missing, and use current tools rather than hidden phrase scripts.
- The permission-scoped tool catalog is assembled independently of user wording and old workflow state. The new harness deliberately excludes the legacy regex-based `prepare_calendar_work` resolver, so the model reasons directly among the real Calendar tools; the resolver remains only on the untouched legacy route. Direct SMS and email sends are also temporarily absent from this default catalog rather than conditionally exposed through another wording router.
- Every registered tool must have a safety-ledger classification before the agent can receive it. The ledger reconciles read/write behavior, approval metadata, side-effect risk, normal/setup surface access, and disclosed Support capability policy.
- SMS and email send tools remain registered and approval-gated on the legacy path, but are not exposed by the default ToolLoopAgent harness during this correction slice. Support remains restricted from owner, billing, Stripe, payment, authentication, entitlement, DNS, domain, and customer-domain authority.
- Calendar reads finish as reads. A later explicit Calendar mutation replaces the read intent, while an unrelated explicit task can pause transaction context for that turn without being captured by it.
- Durable unfinished Calendar, Dance Floor, and trade transactions are loaded once per turn and supplied as bounded, valid JSON recoverable facts. Strings, arrays, object breadth, and nesting are capped; embedded rep/customer text is labeled untrusted data. Optional continuity read failures degrade to no continuity instead of blocking an unrelated request. The rendered JSON contains collected and missing facts only—no active status, resume command, or “continue this job” wording. The records never set the current goal or select a tool. In disclosed Support, only workflow domains covered by the session's exact capabilities are queried or disclosed.
- On the ToolLoopAgent path, a vague or unrecognized turn is no longer assigned to whichever workflow happened to be most recently updated. A deliberate immediate answer to Nic-Nac's preceding workflow question can still update that workflow; explicit current requests determine their own domain.
- `add_show` treats its validated structured ToolLoopAgent arguments as authoritative. Saved Calendar state and phrase-extracted text cannot silently add, remove, or replace recurrence after the model selects the tool. The legacy route retains its existing reconciliation behavior for rollback.
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
- Provider-free harness smoke — passed with 53 registered tools, 45 Workspace agent tools, the legacy Calendar resolver plus direct SMS/email sends explicitly excluded, zero approval-ledger findings, production default-off, exact-cohort enablement, and zero paid model calls.
- Changed-file ESLint — passed with no findings.
- Next.js 16.2.1 production build, including TypeScript and static generation — passed.
- `git diff --check` — passed.

The standalone repository-wide `tsc --noEmit` command still reports pre-existing test-fixture typing errors outside this change. The production build's application TypeScript gate passed, and no changed-file lint or focused test errors remain.

## Still intentionally gated

These checks were not silently broadened into the implementation authorization:

- No paid live-model replay has run. It requires an explicit numeric request cap.
- No production rep/email cohort has been enabled.
- No real customer, Louis personal/admin account, restricted Support session, billing object, message recipient, DNS/customer-domain, or Live Queue extension was used or changed. Only the two normal Sparkle Suite production aliases were moved for the authorized release.
- The separately discussed scheduled isolated cross-workflow canary was not created.
- Browser-side Nic-Nac behavior is not claimed. The current browser runtime and exact target preflight succeeded, and the public landing page was visually stable, but the protected synthetic reviewer controls remained token-gated. An inherited authenticated session was left untouched rather than used as reviewer evidence.

The next controlled acceptance gate is an exact synthetic-reviewer cohort plus a separately approved paid-request cap. It should replay natural-language Calendar read-to-add and cross-tool switches on the live customer domain, prove tool selection and visible answer quality, confirm no unintended data changes, and exercise the kill switch before broader rollout.

## Dex correction-slice verification

- Exact recorded conversation: empty Calendar read; request for a 7 p.m. Eastern Bunny Ears show with `AWESOME` at 10% off; one natural platform clarification; `TikTok` answer; one `add_show` execution with the earlier facts preserved. The clarification did not repeat the empty Calendar result, and every model step used `toolChoice: auto`.
- The recorded exchange used five model steps across its three rep turns, so the six-step default and eight-step hard ceiling were retained. No evidence justified increasing cost and loop exposure.
- Focused correction suite: 75/75 passed.
- Critical agent/route/arbitration set: 32/32 passed on each of three consecutive runs (96/96).
- Complete Nic-Nac regression suite: 1,396 passed with one existing skip across 171 files.
- Repository standard suite: 228/228 passed.
- Changed-file ESLint, `git diff --check`, provider-free harness smoke, and the Next.js 16.2.1 production build including TypeScript/static generation passed.
- Exact commit `4d96111efe65a6895bea8c78f48976cd57da0044` was manually released as Ready Vercel deployment `dpl_FksLyVKFHSgPUZH5w19sWYhRcDpf`. Both Suite domains resolve to that deployment. The `www` landing page stayed stable after settling, the apex redirected canonically to `www`, `/nic-nac` returned 200, and `/api/nic-nac/health` reported the API and database reachable.
- Deployment used `--skip-domain` because customer domains share the project, then assigned only `www.yoursparklesuite.com` and `yoursparklesuite.com`. Bri's Glowtique and The Bling Kitchen remained on the prior deployment.
- Production contains no `NIC_NAC_AGENT_HARNESS_ENABLED`, `NIC_NAC_AGENT_HARNESS_REP_IDS`, or `NIC_NAC_AGENT_HARNESS_EMAILS` variable, so the new harness remains default-off. No cohort, paid model call, synthetic reviewer reset, customer mutation, message send, billing action, DNS/customer-domain change, or Live Queue mutation occurred.

## Live legacy Calendar empty-turn incident and recovery

- Louis's two screenshot failures were production runs
  `77a37401-45bf-432c-892e-59a98146f898` and
  `7dae2da0-4c4b-4da4-95b6-70bf790ad962`. Both used the legacy route, completed
  on `gpt-5.4` with zero input/output/total tokens, executed no tool, recorded
  no tool failure, and ended as `empty_model_output_recovered`. Log review
  found no 429, quota, or insufficient-credit error.
- The exact apostrophe-free text `Whats on my calendar` did not match the old
  Calendar-read recognizer, while `What's on my calendar` did. That prevented
  the direct `list_my_shows` pin and left the 48-tool legacy catalog on
  automatic selection. The provider then returned its known successful-empty
  edge, so the existing tool-result summarizer never received a result.
- The recognizer now treats straight, curly, and omitted apostrophes as the
  same natural Calendar wording. In both the legacy and ToolLoopAgent stream
  paths, a Calendar read that still ends with no visible text and no tool result
  performs one tenant-scoped, read-only `list_my_shows` recovery and renders the
  normal grounded Calendar summary. Add/update/cancel requests cannot enter
  this fallback. A failed recovery produces an explicit Calendar error and is
  recorded rather than emitting the generic apology.
- Provider-free verification passed 91 focused route/policy/recovery tests,
  228 standard tests, 112 agent/routing/workflow tests, changed-file ESLint,
  diff checks, and the production build. Repository-wide `tsc --noEmit` still
  reports the pre-existing unrelated test-fixture typing backlog; application
  TypeScript passed in the production build.
- Exact commit `47275febe2e0796d435bf060666b991539d94f25` was manually released
  as Ready deployment `dpl_9WJxru6eyyX6A4KQCrZrkuov7QRK` /
  `sparkle-suite-dclumf6r2-louis-2849s-projects.vercel.app`. The held deployment
  returned 200 for `/` and `/nic-nac`, and health reported API/database
  reachable before alias movement. Both Suite domains now resolve to it; the
  apex canonicalizes to `www`, live health remained green with zero recent
  errors, and the deployment had no recent error-level logs.
- Deployment used `--skip-domain`, then assigned only the two Suite domains.
  Both Bri's Glowtique hostnames and both Bling Kitchen hostnames remained on
  Ready deployment `dpl_2qiLozydCs16rXufFNbqttMvfDWz`. No paid Nic-Nac call,
  rollout cohort, signed-in account, customer data, billing, messaging, DNS,
  customer-domain, or Live Queue state was used or changed.
- Remaining risk: the exact Calendar failure now has defense in depth, but the
  large legacy catalog and automatic new-agent catalog can still encounter a
  provider empty-turn edge on other unpinned jobs. Broad rollout remains gated
  on a general no-empty-turn proof and evaluation of model-native deferred tool
  loading or an equivalent capability design that does not recreate phrase
  routing or sticky tool packs.
