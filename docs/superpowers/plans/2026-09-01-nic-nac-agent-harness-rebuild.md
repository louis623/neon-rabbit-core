# Nic-Nac Agent Harness Rebuild Plan

**Status:** Local implementation and adversarial completion audit are complete and deterministically verified as of September 1, 2026. Production stays default-off behind an exact-cohort rollout gate with the legacy orchestrator preserved. Paid model replays, production cohort enablement, real-customer testing, and the scheduled isolated canary remain separately authorization-gated.

**Goal:** Make Nic-Nac feel like a capable live-show business partner who can understand a rep's current request, choose the right Sparkle Suite tools, switch tasks naturally in the same conversation, ask a short clarification when needed, and complete safe work without being trapped by an earlier workflow.

**Bottom line:** Keep the working Sparkle Suite tools, data services, permissions, approval gates, conversation UI, persistence, and telemetry. Replace the custom intent router, sticky workflow steering, and forced tool selection with the `ToolLoopAgent` harness already provided by the installed Vercel AI SDK. The model should drive conversation and tool choice. Application code should enforce truth and safety.

### Completion-audit result

- Phases 0 through 6 are implemented locally behind the production-default-off exact-cohort gate.
- Phase 7 is complete at the deterministic and recorded-agent-loop layers: the final critical route suite passed 17/17 three consecutive times, and a real `ToolLoopAgent` fixture switched Calendar → Dance Floor → grounded knowledge → Calendar write while keeping the same full safe catalog and `toolChoice: auto` on every model step.
- Durable Calendar, Dance Floor, and trade transactions now reach the agent as bounded, valid, explicitly untrusted recoverable facts. They never declare the current goal or force a tool, they degrade safely when optional reads fail, and they are filtered to the exact capabilities of a disclosed Support session before storage is queried.
- The new agent catalog excludes the legacy regex Calendar resolver. The model chooses directly among the real Calendar tools; the resolver remains on the preserved legacy route only. The disconnected scripted task reducer was retired.
- Approval responses must match the exact last canonical server-issued request and resume through the real agent loop. Public-content removal and replacement of a different active show session now use conditional visible approval, and show replacement has an exact active-session guard.
- Calendar and Dance Floor read/preflight/write descriptions are explicitly non-overlapping, including the exact read-then-add failure class.
- The harness has bounded steps, output tokens, retries, and total/step/chunk timeouts.
- The remaining Phase 7 gate is the separately authorized capped live-model replay bank. Phase 8 production cohort acceptance is also pending. This code must not be broadly enabled until both gates pass.

---

## 1. Product Outcome

Nic-Nac is the rep's live-show assistant, not a form wizard and not a menu of scripted workflows.

He should be able to:

- Answer grounded questions about Bomb Party, live streaming, Sparkle Suite, and the rep's own workspace.
- Read current workspace state when the answer depends on live data.
- Add, update, or remove workspace data through the correct tool when authorized.
- Move from Calendar to Dance Floor to show coaching to a Sparkle Suite question and back again in one conversation.
- Preserve useful details from an interrupted task without treating that task as a lock.
- Infer ordinary details from natural language and ask one concise question only when a material fact is missing or ambiguous.
- Explain what happened naturally after a tool runs.
- Never claim he checked, changed, sent, scheduled, added, or completed something unless the corresponding tool result proves it.

The expected experience is:

> "Tell Nic-Nac what you need in normal language. He figures out which capability to use, asks only what he truly needs, and gets the work done."

---

## 2. What Is Wrong Today

The current production model is not the primary limitation. The application steers the model too aggressively before the model can reason.

Current evidence in the repository:

- `app/api/nic-nac/route.ts` is a large custom orchestration route that classifies the latest text, loads several durable workflow controllers, merges workflow intents, chooses a tool policy, and then runs `streamText`.
- `lib/nic-nac/tools/index.ts` contains a regex-driven intent router even though authenticated workspaces already receive the full normal tool catalog.
- `lib/nic-nac/tool-choice-policy.ts` can force an exact first tool based on an earlier active workflow or text pattern.
- Calendar, Trade Board intake, and trade operations each have durable workflow state that can influence later turns.
- The production human-default model policy currently defaults to `gpt-5.4` with medium reasoning. It is not currently defaulting to GPT-5.6.

That combination creates a scripted router with an AI response layer on top. In the reported failure, a Calendar read left a `list_shows` workflow active. The next request clearly asked to add a show, but the old workflow caused the application to force `list_my_shows` again. The model never received a fair chance to choose `add_show`.

The repeated fixes did not solve the root cause because they added more routing, more retained workflow state, and more phrase coverage to protect individual cases. Those changes made specific flows more deterministic but made free task switching more fragile.

This plan deliberately revises the earlier architectural assumption that application-owned workflow state should steer the entire conversation. The corrected boundary is:

- The **agent** owns current-goal interpretation, conversational task switching, clarification, tool choice, and natural explanation.
- The **application** owns authentication, permissions, data truth, schemas, validation, approval requirements, idempotency, audit records, and tool execution.
- A **transaction-specific state machine** may exist inside a complex tool or resumable transaction, but it does not own the conversation and cannot force unrelated future turns.

### Relationship to the earlier Nic-Nac plans

This plan supersedes the top-level routing and conversation-ownership portions of `2026-06-15-nic-nac-agent-architecture-spec-v2.md` and `2026-07-02-nic-nac-durable-tool-context.md`. It does not discard their useful safeguards. Photo-role truth, transaction validation, durable recovery facts, approval gates, tenant isolation, and real replay requirements remain in force. What changes is the assumption that an active transaction should retain or force a domain tool pack on later turns.

---

## 3. Use the Existing Agent Harness Instead of Inventing One

Sparkle Suite already uses Vercel AI SDK 6 and the OpenAI provider. The installed SDK includes `ToolLoopAgent`, `createAgentUIStreamResponse`, multi-step tool execution, stopping conditions, tool approval support, and per-step telemetry hooks.

The official guidance recommends `ToolLoopAgent` for agents that need an LLM, tools, and an execution loop. Its default tool choice is `auto`, allowing the model to decide whether to answer, ask a question, or call one or more tools. Structured `streamText` orchestration remains useful inside tightly controlled workflows, but it should not be the top-level conversational brain.

Primary references:

- [Vercel AI SDK agent overview](https://ai-sdk.dev/docs/agents/overview)
- [Vercel AI SDK building agents](https://ai-sdk.dev/docs/agents/building-agents)
- [Vercel AI SDK tools and tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Vercel AI SDK loop control](https://ai-sdk.dev/docs/agents/loop-control)
- [OpenAI agent guidance](https://developers.openai.com/api/docs/guides/agents)

### Chosen harness

Use one primary `ToolLoopAgent` for authenticated Nic-Nac Workspace conversations.

Do not begin with multiple specialist agents or handoffs. One agent can switch tools more naturally, keeps the approval path simpler, and avoids another routing layer. Specialist agents can be reconsidered only if measured tool-catalog limits later justify them.

Do not change model and orchestration in the same initial release. First prove the harness using the current approved model policy. After it works, compare approved models with the same replay set and a pre-authorized cost cap.

---

## 4. The New Responsibility Boundary

### Nic-Nac decides

- What the rep is asking for now.
- Whether the request is a question, a read, a write, a continuation, a correction, or a new task.
- Which available tool or sequence of tools best satisfies the request.
- Whether a genuinely missing detail requires a clarification.
- How to summarize a tool result in plain language.
- When to resume an earlier paused task after completing an interruption.

### Sparkle Suite decides

- Which tools the signed-in identity and product surface are allowed to see.
- Which rep and tenant every operation targets.
- Which input schemas and business rules are valid.
- Which actions require approval.
- Whether an operation is safe, idempotent, authorized, and successfully persisted.
- What audit and telemetry records are written.
- What the tool actually returned.

### Nic-Nac must never decide by himself

- Account ownership, billing, Stripe, subscriptions, payment methods, or charges.
- Customer-domain mappings, DNS, nameservers, aliases, or registrant details.
- Cross-rep access or identity changes.
- Whether a failed tool actually succeeded.
- Whether an approval requirement can be skipped.

---

## 5. Guardrails Become a User Guide

The main instructions should fit on roughly one page. They describe who Nic-Nac is and how a good assistant behaves; they do not script every possible sentence or workflow.

### Proposed instruction shape

1. **Role**
   - You are Nic-Nac, the live-show and Sparkle Suite business partner for Bomb Party reps.
   - Be warm, concise, practical, and confident only when the available information supports it.

2. **Work from the current request**
   - Treat the rep's latest explicit request or correction as the current goal.
   - You may switch tools or topics at any turn.
   - An unfinished earlier task may be paused and resumed, but it never blocks the current request.

3. **Use tools for facts and actions**
   - Use the appropriate read tool for current workspace facts.
   - Use the appropriate write tool when the rep asks for an action and the tool is authorized.
   - You may call several tools in sequence when the task requires it.

4. **Clarify intelligently**
   - Infer details already supplied in the conversation.
   - If one material fact is missing or ambiguous, ask one short, specific question.
   - Do not ask the rep to repeat information already known.

5. **Prove completion**
   - Never say an action is complete until the tool returns success.
   - If a tool fails or is unavailable, say what could not be completed and offer the next useful step.

6. **Respect hard boundaries**
   - Follow identity, permission, approval, privacy, customer-contact, financial, and production safety rules enforced by Sparkle Suite.
   - Never invent access or bypass a blocked capability.

Domain-specific guidance belongs primarily in tool names, descriptions, schemas, validation, and grounded knowledge—not in an expanding master prompt.

---

## 6. Tool Catalog Design

The existing tool implementations are valuable and should be migrated, not rewritten wholesale.

### Keep

- Calendar read and mutation services.
- Dance Floor / Trade Board tools and jewelry safeguards.
- Trade requests, swaps, fulfillment, audience, notification, site, resource, memory, and show-session tools.
- Zod schemas and service-layer validation.
- Per-rep identity binding and Supabase row isolation.
- Read-only retry behavior and write-side no-double-execution rules.
- Operator-support capability filtering and audit wrappers.
- Human approval metadata and continuation handling.
- Tool execution telemetry and failure classification.
- The visible-completion guard and bounded tool-result summaries as last-resort recovery when the model emits no customer-visible answer. They remain a safety net, not the normal conversational response generator.

### Improve every tool contract

Each tool should declare:

- A short action-oriented name.
- When Nic-Nac should use it.
- When he should not use it.
- Whether it reads or changes data.
- Required versus optional fields.
- The meaning and expected format of every field.
- Whether the action requires approval.
- A structured result containing IDs, changed fields, timestamps, and a truthful status.
- Stable error codes with a rep-safe explanation.

Tool descriptions should contain operational guidance currently buried in prompt and router rules. That lets the model reason over the catalog without phrase matching.

### Capability filtering

Filter tools only for real capability reasons:

- Signed-in product surface.
- Rep identity and tenant.
- Account role and explicit support capability.
- Read versus mutation permission.
- Feature availability.
- Safety or legal restriction.

Do not filter tools because a regex guessed that the rep is still doing Calendar work or because the previous turn used a different domain.

### Approval policy

Preserve the current approval behavior during the harness migration so safety and orchestration are not changed at once. Then perform a separate approval audit with this goal:

- Reads never require approval.
- A direct, unambiguous request may authorize an ordinary reversible workspace action when product policy permits it.
- Irreversible, public/customer-facing, outbound-message, destructive, account-control, and otherwise consequential actions require the established approval gate.
- Financial, billing, DNS, ownership, and customer-domain operations remain outside normal Nic-Nac authority.

No approval simplification ships implicitly as part of this plan.

---

## 7. Conversation and Task Memory

Do not persist one conversation-wide `intent` that owns later turns.

Persist facts and task status instead:

```text
currentGoal
  summary
  relevantFacts
  missingFacts
  lastToolResult
  status: active | waiting_for_user | waiting_for_approval | completed | failed

pausedGoals[]
  summary
  relevantFacts
  resumeHint
  status
```

Rules:

- The latest explicit request becomes `currentGoal`.
- An interrupted unfinished goal moves to `pausedGoals` with its collected facts.
- A short answer to Nic-Nac's immediately preceding clarification continues that goal.
- A correction updates or replaces the current goal instead of being interpreted through the old goal.
- A read completes after its result is explained; it does not remain an active workflow.
- Approval-waiting tool calls are resumable but cannot force unrelated turns.
- Returning to a paused goal is natural language behavior, not a forced router transition.
- Transaction records may remain durable for audit and recovery, but they do not select tools for the next turn.

This memory is not intended to become another large state machine. It is a compact continuity aid for the agent and the UI.

---

## 8. Grounded Expertise

Tool switching alone will not make Nic-Nac an expert. Expertise needs a trusted knowledge layer.

Build one grounded knowledge capability with clear source categories:

- Sparkle Suite product help and current feature behavior.
- Bomb Party terminology, product rules, and rep-provided business context.
- Live-streaming setup, show flow, troubleshooting, moderation, and selling playbooks.
- Rep-specific notes and preferences where permission and privacy rules allow them.
- Current workspace state from live tools, never from static knowledge.

The knowledge tool should return source, freshness, scope, and confidence. Nic-Nac should distinguish:

- "Here is how Sparkle Suite works."
- "Here is a common live-show practice."
- "Here is what your workspace currently contains."
- "I am not certain; let me ask or check."

Do not claim universal expertise by stuffing more prose into the system prompt. Curate, version, retrieve, and test the knowledge.

---

## 9. Target File Structure

The exact names can adjust during implementation, but the boundaries should be explicit:

```text
lib/nic-nac/agent/
  nic-nac-agent.ts          # ToolLoopAgent construction
  instructions.ts           # concise user guide and hard boundaries
  capability-catalog.ts     # permission-based tool exposure
  task-context.ts           # current/paused goal continuity
  run-observer.ts           # turn, tool, cost, and outcome telemetry
  stream-adapter.ts         # existing UI/persistence integration

lib/nic-nac/tools/
  ...existing tools...      # retained and contract-hardened

lib/nic-nac/knowledge/
  ...existing knowledge...
  search-knowledge.ts       # grounded retrieval contract

tests/nic-nac/agent/
  harness.test.ts
  capability-catalog.test.ts
  task-switching.test.ts
  approval-resume.test.ts
  completion-truth.test.ts
  transcript-replays.test.ts

tests/nic-nac/fixtures/agent/
  calendar-to-dance-floor.ts
  dance-floor-to-question-and-back.ts
  read-to-write-correction.ts
  live-show-mixed-tasking.ts

scripts/
  smoke-nic-nac-agent-harness.ts
```

`app/api/nic-nac/route.ts` remains the public API boundary but becomes thinner. It should authenticate, load conversation context, build the allowed tool catalog, invoke the agent, persist output, and record telemetry. It should not infer the user's business intent or pin a domain tool.

---

## 10. Migration Phases

### Phase 0 — Lock the baseline and cost rules

**Purpose:** Protect working behavior and prevent another round of expensive tests that do not exercise the real failure.

Work:

- Capture the current route, tool registry, approval flow, UI parts, persistence behavior, and production model policy.
- Add the reported same-conversation failure as the first critical transcript fixture.
- Inventory every current tool by domain, read/write classification, approval requirement, side effects, idempotency behavior, and result shape.
- Define an explicit paid-eval budget before any model-backed replay.
- Require every tool-switching replay to reuse one conversation ID across all turns.
- Stop a paid replay batch on the first repeated critical architecture failure.

Exit gate:

- The baseline fixture reproduces the failure deterministically at the routing layer without a paid model call.
- The tool safety ledger is complete.
- No production behavior has changed.

### Phase 1 — Harden tool contracts without changing orchestration

**Purpose:** Give the future agent a clean, trustworthy capability catalog.

Work:

- Rewrite ambiguous tool descriptions to explain purpose, inputs, side effects, and success proof.
- Normalize structured results and error contracts.
- Confirm wrappers preserve schemas, approval metadata, and telemetry.
- Separate preflight/lookup behavior from mutation behavior where one tool currently mixes both.
- Remove dependencies on `latestUserText` or active workflow state from tool execution where structured input should be authoritative.
- Keep service-layer business validation inside the application.

Exit gate:

- All existing tool unit tests pass.
- Every write tool has an explicit safety and idempotency decision.
- No tool can report success without a persisted result.

### Phase 2 — Introduce the agent harness behind a default-off flag

**Purpose:** Run the new orchestration path without replacing production Nic-Nac for ordinary reps.

Work:

- Create one `ToolLoopAgent` with the current OpenAI model policy.
- Use `toolChoice: 'auto'` as the normal policy.
- Set a bounded step limit and cost/timeout guards.
- Build the tool catalog from product permissions, not text intent.
- Add an adapter for the current Nic-Nac UI stream, message persistence, approval parts, thinking indicator, and telemetry.
- Keep the legacy route path available only as a rollback path while the new harness is evaluated.
- Enable the harness only for a supported synthetic reviewer identity or explicit test cohort.

Exit gate:

- Plain conversation works without a tool.
- Reads call the correct tool and explain the result.
- Writes enter the existing approval/execution path correctly.
- The new path can be disabled immediately without data migration or alias changes.

### Phase 3 — Replace sticky intent with task continuity

**Purpose:** Make interruptions, corrections, and resumptions first-class behavior.

Work:

- Add compact current/paused goal context.
- Make a completed read leave no active workflow lock.
- Make an explicit new request supersede the prior goal for the current turn.
- Preserve collected facts for a paused mutation.
- Resume approval-waiting work only when the matching approval response arrives.
- Prevent a correction such as "No, add it" from being reinterpreted as the earlier read.
- Stop supplying active workflow state as a first-step tool-choice instruction.

Exit gate:

- All critical same-conversation switching fixtures pass without forced tool selection.
- No unfinished task loses its collected facts.
- No old task overrides a newer explicit request.

### Phase 4 — Prove the Calendar vertical slice

**Purpose:** Repair the exact reported failure before expanding the rollout.

Critical conversation:

1. Rep: "Do I have any shows on my calendar?"
2. Nic-Nac calls `list_my_shows` and truthfully reports the result.
3. Rep: "Add a show tonight at 7 p.m. Eastern. Code AWESOME is 10% off, and feature Bunny Ears."
4. Nic-Nac recognizes a new add request. If platform is the only material missing fact, he asks only, "Which platform is the show on?"
5. Rep: "TikTok."
6. Nic-Nac calls the add flow with the already supplied details, follows the approval policy, and reports the created show only after success.
7. Rep can immediately ask an unrelated Sparkle Suite or Dance Floor question.

Additional Calendar coverage:

- Read upcoming, tonight, date-range, past, and recurring shows.
- Add one-time and recurring shows with details in any order.
- Correct date, time, timezone, platform, discount, collection, or recurrence mid-task.
- Update, skip, pause, cancel, and end with correct approval behavior.
- Ask a Calendar knowledge question without treating it as a live-data read.
- Interrupt Calendar work with another domain and return later.

Exit gate:

- Critical Calendar scenarios pass deterministically and in a capped same-conversation model replay.
- Zero wrong-tool calls after an explicit Calendar read-to-write switch.
- Zero false claims of a successful Calendar mutation.

### Phase 5 — Prove Dance Floor and live-show task switching

**Purpose:** Make the most important live-show operating loop feel natural.

Work:

- Migrate Trade Board / Dance Floor intake from conversation-owning workflow state to agent-led collection with transaction-level validation.
- Preserve photo roles, catalog truth, duplicate-piece rules, and mutation safeguards.
- Allow facts and photos in any order.
- Let the rep interrupt listing intake with Calendar, show-session, fulfillment, or knowledge questions.
- Resume with the captured item facts and clearly state what is still needed.
- Inventory live-show "counter" and Dance Floor capabilities. Add safe service tools only where a real capability is missing; do not modify the protected Live Queue extension.

Exit gate:

- The existing ER13229 and non-item-number cases still pass.
- Label/details photos cannot satisfy the customer-facing jewelry-photo requirement.
- Cross-domain interruptions do not lose item details or pin Trade Board tools on unrelated turns.

### Phase 6 — Add grounded expert assistance

**Purpose:** Deliver the useful "ask Nic-Nac anything about the show" experience, not only CRUD operations.

Work:

- Add grounded search across Sparkle Suite help, Bomb Party knowledge, and live-show playbooks.
- Define freshness and source ownership for each knowledge collection.
- Teach Nic-Nac to distinguish advice from current workspace facts.
- Add representative questions about show preparation, live-stream troubleshooting, customer handling, Sparkle Suite use, and post-show follow-up.
- Allow a knowledge answer to interrupt and then resume an operational task.

Exit gate:

- Answers cite or identify their trusted basis internally.
- Current-data questions still use live tools.
- Unsupported or uncertain answers produce a useful clarification or honest limitation instead of invented facts.

### Phase 7 — Cross-workflow reliability and wow-factor evaluation

**Purpose:** Test how real reps talk, not how our scripts expect them to talk.

Replay families:

- Calendar read → Calendar add → Dance Floor add → Calendar correction.
- Dance Floor intake → Bomb Party question → Calendar read → resume Dance Floor.
- Show-session question → fulfillment update → customer-audience read.
- Plain question → live-data check → mutation → unrelated question.
- Frustrated correction after a wrong assumption.
- Short replies, slang, voice-transcript wording, typos, and details supplied out of order.
- Multiple tool calls needed for one request.
- Tool failure followed by retry, alternative, or honest escalation.

Evaluation dimensions:

- Correct current goal.
- Correct tool or no tool.
- Correct arguments.
- Appropriate clarification.
- Retained facts.
- No forbidden tool.
- No mutation without required approval.
- No false success statement.
- Natural, concise response.
- Cost and latency per completed task.

Exit gate:

- 100% pass on critical safety and tool-switch cases.
- At least 95% task success across the broader approved replay bank before beta exposure.
- Three consecutive clean runs of the critical mixed-workflow suite after the final relevant code change.
- Paid model calls stay inside Louis's approved cap and are reported by scenario.

### Phase 8 — Controlled release

**Purpose:** Release without putting real customers, billing, or live-show operations at risk.

Order:

1. Local deterministic tests.
2. Local/mock UI and stream tests.
3. Supported synthetic reviewer session on the live Sparkle Suite domain after an approved release.
4. Explicitly approved internal demo cohort.
5. Small opt-in beta-rep cohort with rollback flag.
6. Broader release only after telemetry and rep feedback meet the gates.
7. Remove the legacy router only after the agent path has been stable and its rollback window is complete.

Production/UI verification must use the `sparkle-suite-production-smoke` skill and reviewer-safe identities. Do not use Louis's personal/admin account or a real customer account for destructive or reviewer testing.

The scheduled isolated cross-workflow canary remains out of scope until Louis gives separate explicit authorization.

---

## 11. Test Strategy

### Layer 1 — No-model deterministic tests

- Tool schemas and descriptions.
- Permission-based capability catalog.
- Read/write and approval classification.
- Task pause, supersede, correction, and resume rules.
- Tool result truthfulness and persistence.
- UI message/approval continuation contracts.
- Old workflow state cannot pin a new explicit request.

These tests are fast and should run on every relevant change.

### Layer 2 — Recorded agent-loop fixtures

Use controlled model outputs to exercise the actual `ToolLoopAgent`, multiple steps, tool results, approvals, persistence, and UI parts without paying for a provider call.

### Layer 3 — Capped live-model replays

- Use the actual model/tool loop.
- Keep every multi-turn case in one conversation.
- Seed only synthetic reviewer data.
- Record model, reasoning level, input/output tokens, cost, exposed tools, chosen tools, arguments, results, and final text.
- Run only after deterministic layers pass.
- Obtain Louis's explicit approval for the batch size and dollar/credit cap.

### Layer 4 — Live-domain reviewer smoke

- Use the exact live path on `https://www.yoursparklesuite.com`.
- Verify the visible UI, approval flow, refreshed workspace data, and reset/reseed path.
- Confirm both live domains resolve to the exact approved deployment when an application release occurs.
- Do not call the work complete from an HTTP 200 or raw Vercel URL.

---

## 12. Observability Louis Can Actually Use

For every turn, capture:

- Conversation and run IDs.
- Current model and reasoning policy.
- Tool catalog exposed to the agent and why each capability was allowed.
- Model-selected tool calls in order.
- Validated arguments, approval state, result status, and stable error code.
- Whether the turn started, switched, paused, resumed, or completed a goal.
- Final answer and whether it was grounded in a tool result or knowledge source.
- Latency, tokens, and estimated cost.

The Control Center read model should answer these questions without log archaeology:

- What did the rep ask for now?
- What tools could Nic-Nac use?
- What did Nic-Nac choose?
- Did Sparkle Suite block or approve it?
- Did the operation really succeed?
- Did Nic-Nac switch away from an unfinished task?
- How much did the turn cost?

Telemetry observes and explains behavior. It must not become another router.

---

## 13. What Gets Retired

Retire after the new path passes its gates:

- Regex intent classification as the normal top-level tool selector.
- `active_workflow` as a reason to pin a domain on a later explicit request.
- Exact first-step tool forcing for ordinary Workspace conversation.
- Scripted static responses that bypass the model for normal workflow starts.
- Customer-facing fallback text that guesses a business answer from the latest phrase.
- Prompt rules that duplicate tool schemas or prescribe every dialogue step.
- Tests that treat separate one-turn conversations as proof of mid-conversation task switching.

Keep deterministic code for permissions, safety, validation, transactions, parsing where exactness is required, and catastrophic fallback. A catastrophic fallback should state that the request could not be completed; it must never invent the business result.

---

## 14. Risks and Mitigations

### Risk: The full tool catalog overwhelms the model

Mitigation: improve names/descriptions, remove duplicate/overlapping tools, and filter by real permissions and product capabilities. Measure before introducing specialist agents or semantic tool search.

### Risk: More autonomy causes unsafe mutations

Mitigation: tool schemas, tenant binding, service validation, idempotency, approval metadata, and audit wrappers remain authoritative. The model never receives direct database authority.

### Risk: A framework migration breaks the existing UI or approvals

Mitigation: build a stream adapter, preserve the current message-part contract, test approval continuation before enabling any cohort, and keep a kill switch.

### Risk: We rebuild all tools and create new regressions

Mitigation: migrate the orchestration boundary first. Retain proven tool/service code and harden contracts incrementally.

### Risk: Knowledge answers sound confident but are wrong

Mitigation: grounded retrieval with source/freshness metadata, explicit uncertainty behavior, and evals that separate general advice from current workspace facts.

### Risk: Tests consume credits without testing the real problem

Mitigation: deterministic layers first, same-conversation fixtures, explicit paid cap, stop-on-critical-failure rules, and per-scenario cost reporting.

### Risk: Another state machine quietly grows around the agent

Mitigation: architecture review rejects any top-level code that selects a business tool from phrases or an old goal. Durable state may preserve facts and transactions but may not own the next conversational turn.

---

## 15. Definition of Done

This rebuild is not done merely because Nic-Nac answers the reported sentence correctly.

It is done when:

- A rep can switch among Calendar, Dance Floor, show-session work, grounded questions, and other allowed Sparkle Suite tools in one conversation.
- The latest explicit request wins without losing recoverable details from paused work.
- Nic-Nac asks a concise clarification only for material missing information.
- Read questions use live data, and write requests use the correct mutation path.
- Required approvals, identity guards, data validation, and audit records still work.
- Nic-Nac never claims an unproven action or check.
- Critical cross-workflow and safety scenarios pass at 100%.
- The broader replay bank reaches the agreed task-success target.
- Live reviewer smoke succeeds on the actual Sparkle Suite domain with safe data and a reset path.
- Louis can inspect why a tool was chosen and what it cost.
- The old sticky router can be removed without reducing capability or safety.

---

## 16. Approval Boundary for Starting Work

Approval of this plan should authorize only the explicitly agreed implementation phase. Recommended first authorization:

1. Phase 0 baseline and safety ledger.
2. Phase 1 tool-contract hardening.
3. Phase 2 local/default-off agent harness.

That first implementation slice should not authorize:

- Production enablement for ordinary reps.
- Paid model replays without a separate stated cap.
- The scheduled isolated canary.
- DNS, Vercel alias, customer-domain, billing, Stripe, or account-control changes.
- Live Queue extension changes.
- Real customer testing.
- Transparent-support expiry clocks, sliding expiration, automatic expiration, or timestamp-based support denial.

After the local/default-off harness and Calendar slice pass their deterministic gates, Louis should receive an evidence report before approving any model-backed or production cohort evaluation.
