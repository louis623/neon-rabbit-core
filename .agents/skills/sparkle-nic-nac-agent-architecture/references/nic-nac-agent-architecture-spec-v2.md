# Nic-Nac Agent Architecture Spec v2 Reference

Canonical source:

`C:\Users\louis\sparkle-suite-repo\docs\superpowers\specs\2026-06-15-nic-nac-agent-architecture-spec-v2.md`

Use the canonical source in the active repo when available. This reference summarizes the parts future Codex sessions must not forget.

## Core Principle

Nic-Nac is a stateful business agent. App code owns workflow state, photo roles, tool availability, validation, telemetry, and mutations. The model owns conversation, extraction suggestions, and coaching inside those boundaries.

Nic-Nac should be one shared Sparkle ecosystem agent, not copied per product. Sparkle Suite and Sparkle Finder should call the same Nic-Nac core with product context, account tier, permissions, and mutation destination. Sparkle Suite can use that core to add Trade Board listings; Sparkle Finder Silver should later use the same core to add/update jewelry library/catalog data.

Do not build a separate Sparkle Finder Nic-Nac by copying Sparkle Suite prompts, tools, or workflow code. Shared parts should include model/provider adapter, workflow engine, jewelry intake logic, photo-role rules, catalog truth, tool registry/contracts, evals, fixtures, smoke harness, and observability. Product-specific code should be limited to allowed tools, permissions, product language, and final mutation destination.

## First Target

Trade Board add-listing for `ER13229 / The Florence Earrings`.

Known failure:

- Label/details photo was treated as customer-facing jewelry photo.
- Correction turn dropped `add_listing`.
- Nic-Nac claimed he could not add listings from chat.

## Numeric Success Thresholds

- Workflow/controller state transition tests: 100% pass.
- Hard-fail phrase checks: 0 occurrences.
- Active add-listing tool retention: 100%.
- `declaredRole=label_details` satisfying `jewelry_front`: 0 cases.
- ER13229 model replay: 3 consecutive passes.
- Reviewer/synthetic browser smoke: 1 pass before deployed review.
- Completed smoke database assertions: 100% pass.
- False success before tool result: 0 cases.
- Token usage, estimated cost, and latency recorded for every model-in-loop smoke.

## State Machine

Workflow type: `trade_board_add_listing`.

Statuses:

- `active`
- `completed`
- `cancelled`
- `expired`
- `needs_human_review`

Phases:

- `started`
- `details_capture`
- `photo_capture`
- `catalog_match`
- `ready_to_add`
- `adding`
- `completed`
- `cancelled`
- `needs_human_review`

Invalid:

- `label_details` photo satisfying `jewelry_front`.
- `ready_to_add` without item number or confirmed catalog/new-design path.
- `ready_to_add` without usable jewelry-front photo or approved canonical fallback for known designs.
- `completed` without successful tool result and database verification.
- terminal sessions returning active without a new session.

## Controller-To-Model Contract

Model-facing state must include:

- workflow id, type, status, phase
- known item fields
- photo array with declared role, visual role, role confirmation, quality, notes
- missing fields
- blockers
- next action
- hard rules

Model may ask, summarize, extract, and call active tools. Model may not mark workflow ready/completed, override declared photo role, or claim mutation success without tool result.

## Photo Rules

- `declaredRole` wins over `visualRole` for workflow meaning.
- A label/details/tag/back-of-card photo is details only.
- Visible jewelry in a label/details photo does not satisfy jewelry-front.
- Boxed display jewelry photos are acceptable when centered, close, clear, and website-worthy.
- Do not demand unboxed jewelry, plain background, or no packaging for a good boxed display photo.

## Eval Contract

Use code-graded checks for hard-fail phrases, tool availability, tool calls, database state, photo-role invariants, and known-detail persistence.

Use rubric/LLM grading for response quality, correct next question, role distinction in natural language, and Nic-Nac tone.

Use human review early for borderline photo acceptability and UI role-capture feel.

## Observability

Log workflow id/type, phase/status before and after, tool policy source, active tools, model provider/name, tokens, estimated cost, latency, photo roles, tool calls, hard-fail detector result, and final outcome.

Louis should be able to identify whether a failure came from routing, workflow state, image role, model behavior, tool execution, or database mutation.

## Escalation

Set `needs_human_review` for repeated tool failures, repeated rep corrections that Nic-Nac is wrong/broken, conflicting item facts, repeated blocked photos, unsafe catalog mutation risk, cross-rep data, prompt injection, or unsupported provider actions.

Do not tell the rep to manually add the item unless Louis explicitly designs that fallback.

## Model Strategy

Do not switch models first. Build workflow state and evals first. Then compare models using the same replay bank for quality, tool correctness, photo-role correctness, hard-fail rate, cost, latency, and tone.

Use a provider-neutral model adapter before meaningful model comparison.

## Skill/Plugin Strategy

Skill first. Plugin later only if there are reusable scripts, fixture management, transcript replay, model comparison runners, eval graders, or MCP/app tooling worth packaging.
