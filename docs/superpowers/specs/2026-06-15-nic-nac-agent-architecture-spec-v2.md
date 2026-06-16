# Nic-Nac Agent Architecture Spec v2

Date: 2026-06-15

Status: v2 architecture spec for Louis review. No implementation, build, test, deploy, commit, or push has been performed from this document.

## Executive Summary

Nic-Nac should be rebuilt around a stateful agent architecture for business workflows. The model should not be responsible for remembering the hidden Trade Board add-listing script. Sparkle Suite should own workflow state, photo roles, tool availability, validation, telemetry, and final mutations. The model should provide flexible conversation, extraction, coaching, and tool-use reasoning inside those app-owned boundaries.

This spec starts with Trade Board add-listing because `ER13229 / The Florence Earrings` exposed the most important failure mode: a label/details photo was mistaken for a customer-facing jewelry photo, the correction turn dropped Trade Board tools, and Nic-Nac claimed he could not add listings from chat.

The v2 target is not a rigid form. It is a flexible assistant over a reliable workflow controller.

## June 16 Shared-Core Addendum

Forefront architecture decision from Louis: Nic-Nac should be one shared Sparkle ecosystem agent, not separate copy-pasted assistants for Sparkle Suite and Sparkle Finder.

Sparkle Suite remains the launch priority. Sparkle Finder work can wait, but Sparkle Suite Nic-Nac work should preserve the shared-core path instead of baking in Suite-only assumptions. The target is one shared Nic-Nac core with shared model adapter, workflow engine, jewelry intake state, photo-role rules, catalog truth, tool registry, evals, and smoke harness.

Sparkle Suite and Sparkle Finder should call that same core with product context, account tier, permissions, and final mutation destination. For Sparkle Suite, jewelry intake may end by adding a rep Trade Board listing. For Sparkle Finder Silver, the same intake should later end by adding or updating jewelry library/catalog data. Nic-Nac's identity, intake behavior, photo rules, and eval gates stay shared; product context decides what tools are allowed and where the mutation lands.

## Why This Spec Exists

Nic-Nac has repeatedly failed the Trade Board add-listing flow for `ER13229 / The Florence Earrings`. The most important failure was not that the model misunderstood one sentence. The system allowed one ambiguous visual interpretation to collapse the whole workflow:

- The rep uploaded a label/details/back-of-card photo.
- The label photo showed the backs of earrings, so the model treated it as a jewelry photo.
- Nic-Nac criticized the label/details photo as if it were the customer-facing jewelry photo.
- When corrected, the turn could route away from Trade Board tools, removing `add_listing`.
- Nic-Nac then claimed he could not add listings from chat.

This points to an architecture problem, not a single prompt problem. Nic-Nac has many tools, but the app does not yet own enough durable workflow state for a front-facing, rep-safe assistant.

## Research Basis

The recommended architecture follows common production agent guidance:

- Anthropic recommends starting with clear success criteria and evaluations, with task-specific evals that include edge cases and automated grading where possible.
- Anthropic describes tool use as an application/model contract: the model emits structured tool calls, while the application executes client tools and returns results.
- OpenAI describes agents as applications that plan, call tools, collaborate across specialists, and keep enough state to complete multi-step work. Their SDK guidance fits cases where the server owns orchestration, tool execution, state, approvals, storage, and observability.
- LangGraph is relevant as a reference pattern because it emphasizes long-running, stateful agent workflows, persistence, human-in-the-loop control, and traceability. Sparkle Suite does not need to adopt LangGraph immediately, but the pattern is useful.

References:

- https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- https://platform.openai.com/docs/guides/agents
- https://langchain-ai.github.io/langgraphjs/

## Current Architecture Summary

From the active repo on `codex/sparkle-cross-phase-hardening`:

- Workspace Nic-Nac route: `app/api/nic-nac/route.ts`
- Model provider: Vercel AI SDK with `@ai-sdk/anthropic`
- Current model: `claude-haiku-4-5-20251001`
- Tool registry and text routing: `lib/nic-nac/tools/index.ts`
- Dynamic prompt composition: `lib/nic-nac/prompt-builder.ts`
- Legacy static prompt reference: `lib/nic-nac/system-prompt.ts`
- Add-listing tool: `lib/nic-nac/tools/add-listing.ts`
- Listing photo processing: `lib/services/listing-photo-processing.ts`
- Jewelry photo semantic/preflight helpers:
  - `lib/services/jewelry-photo-semantics.ts`
  - `lib/services/jewelry-photo-preflight.ts`
- Client attachment creation:
  - `app/nic-nac/components/InputRow.tsx`
  - `app/nic-nac/components/NicNacChatBody.tsx`

Important current behavior:

- The route derives active tool intents per turn from recent text and attachments.
- The prompt tells Nic-Nac to only call tools in the active list.
- The client sends image parts with quality metadata.
- The conversation persists messages and parts, but not a first-class Trade Board add-listing workflow state.
- The code has visual photo quality and semantic checks, but not a durable user/workflow photo role such as `label_details` versus `jewelry_front`.

## Main Diagnosis

Nic-Nac is currently too reactive. The system asks the model to infer workflow state from recent conversation text, image content, and prompt instructions. That is fragile for a rep-facing business workflow.

The app should own the business state. The model should own conversational flexibility.

The target split:

- Application code owns workflow truth, required fields, photo roles, allowed state transitions, tool availability, and final mutations.
- The model owns language understanding, extraction, summarization, coaching tone, and asking the next useful question.
- Tests and smoke replays own proof that real conversations behave like a rep expects.

## Success Criteria

Success means a working rep can add a real piece of jewelry to the Sparkle Suite jewelry database and Trade Board through Nic-Nac without needing to know the hidden script, without Louis intervening, and without Nic-Nac blocking on avoidable misunderstandings.

The first success target is the `ER13229 / The Florence Earrings` flow because it exposed the highest-risk gaps.

### Numeric Success Thresholds

These thresholds define the first release gate for the Trade Board intake architecture:

- Deterministic workflow/controller tests: 100% pass for required state transitions.
- Hard-fail phrase checks: 0 occurrences in any passing model-in-loop or browser-smoke transcript.
- Active workflow tool retention: 100% of active add-listing turns include the Trade Board tool pack until the workflow ends.
- Photo-role invariant: 100% of `declaredRole=label_details` photos fail the `jewelry_front` requirement.
- ER13229 model replay: 3 consecutive passes against the selected model before deployed review.
- Reviewer-smoke replay: 1 pass through logged-in reviewer/synthetic browser automation before deployed review.
- Listing mutation integrity: 100% of completed smoke runs verify the expected listing/design database state.
- False success rate: 0 cases where Nic-Nac claims a listing was added before `add_listing` returns success.
- Cost tracking: every model-in-loop smoke records total input/output tokens and estimated provider cost.
- Latency tracking: every smoke records send-to-final-answer time and final-answer-to-database-verification time.

Initial latency and cost should be recorded as baselines rather than hard blockers. Hard thresholds can be set after 10 successful smoke runs.

### Product Success

- A rep can start the add-listing flow from chat, a chip, or natural wording.
- Facts can arrive in any order: item number, label/details photo, collection name, jewelry photo, quantity, ring size, or corrections.
- Nic-Nac accepts a collection name typed by the rep and does not demand packaging proof after the rep provides it.
- Nic-Nac treats a label/details/tag/back-of-card photo as a details source only, even when partial jewelry is visible.
- Nic-Nac asks for a separate customer-facing jewelry photo when only a label/details photo has been provided.
- Nic-Nac accepts a clear boxed display jewelry photo when the jewelry is centered, close, clear, and website-worthy.
- Nic-Nac coaches only for the two strict photo gates:
  - unreadable label/details/tag photo
  - genuinely bad customer-facing jewelry photo
- Nic-Nac adds the listing only after the required workflow state is satisfied and the tool returns success.

### Reliability Success

- An active add-listing workflow keeps Trade Board tools available until the workflow is completed, cancelled, expired, or escalated.
- Rep corrections, frustration, short answers, and retry language do not drop the workflow into memory-only routing.
- `declaredRole=label_details` photos can never satisfy the `jewelry_front` requirement.
- Ambiguous photo roles may pause final mutation, but they do not discard known details or reset the workflow.
- Tool failures produce a plain retry/escalation response and never turn into fake success.

### Eval Success

Before a Trade Board intake change is called fixed:

- Deterministic workflow/controller tests pass for all required state transitions.
- Prompt/router tests pass for correction and retry turns.
- Model-in-loop replay passes the ER13229 fixture set with real uploaded image parts.
- Browser or Chrome reviewer-smoke passes through the actual logged-in UI or real `/api/nic-nac` route.
- Database assertions confirm the expected listing/design state after a completed add.
- Transcript capture includes the conversation id, run ids, active tools, tool calls, tool results, and final assistant text.

### Hard Failure Conditions

Any of these fail the ER13229 smoke:

- Nic-Nac says or implies he cannot add listings from chat while `add_listing` should be available.
- Nic-Nac tells the rep to manually add the item in Sparkle Suite.
- Nic-Nac says "the photo of the earrings needs..." when only a label/details photo was uploaded.
- Nic-Nac treats a label/details/back-of-card photo as the customer-facing jewelry photo.
- Nic-Nac demands "unboxed" jewelry, a "plain background", or says packaging is too prominent for a clear boxed display jewelry photo.
- Nic-Nac loses known facts after a correction or retry.
- Nic-Nac claims the listing was added before `add_listing` returns success.

### Launch Readiness Success

For the first production-ready version of this architecture:

- The ER13229 replay passes at least three consecutive times against the selected model.
- The same replay passes once through reviewer-smoke/synthetic browser automation.
- No hard-fail phrase appears in the transcript.
- The total model/tool cost per successful add is recorded.
- Latency is recorded from send to final answer and from final answer to database verification.
- Failures are observable enough that Louis can see whether the issue was routing, workflow state, image role, model behavior, tool execution, or database mutation.

## Failure Modes To Design Against

1. Tool cliff from per-turn routing

Current issue: if a correction or frustrated reply routes to `memory` instead of `trade_board`, the active tools no longer include `add_listing`. The prompt then tells Nic-Nac the capability is unavailable on this turn.

Target rule: when an add-listing workflow is active, `add_listing`, `search_jewelry_database`, and related Trade Board tools stay available until the workflow is completed, cancelled, or times out.

2. Photo role confusion

Current issue: the model can treat visible jewelry in a label/details photo as proof that the same photo is the jewelry-front photo.

Target rule: photo role is workflow state. A `label_details` photo can provide item number, design name, collection, MSRP, material, stone, year, size, or other printed data. It must never satisfy the `jewelry_front` requirement.

3. Visual classification mixed with user intent

Current issue: visual heuristics can decide whether an image looks like jewelry or packaging, but they cannot know why the rep uploaded it.

Target rule: keep two separate fields:

- `declaredRole`: why the photo was provided in this workflow.
- `visualAssessment`: what the image appears to contain and whether it is usable.

If the rep starts with "here is the label," `declaredRole = label_details` even if the photo contains partial jewelry.

4. Script rigidity

Current issue: the prompt encodes a guided flow, but reps provide facts in arbitrary order.

Target rule: the workflow session should accept facts in any order and compute missing requirements from structured state.

5. Over-strict photo coaching

Current issue: Nic-Nac can ask for unboxed, plain-background, or no-packaging retakes even when the boxed display photo is clear.

Target rule: only two strict photo gates exist:

- If the label/details/tag photo is unreadable, ask for a clearer details photo.
- If the customer-facing jewelry photo is genuinely bad for the website, coach for a better jewelry photo.

Boxed display jewelry photos are acceptable when centered, close, clear, and attractive enough for the board/customer site.

6. Inadequate verification

Current issue: unit tests and prompt assertions can pass while the live model/tool loop still fails.

Target rule: Trade Board intake changes require real conversation replay with uploaded image parts, model/tool loop, hard-fail phrase checks, and tool-call/result assertions.

## Target Architecture

### 1. Workflow State Layer

Add a persistent workflow session for multi-turn Nic-Nac jobs. For this incident, start with Trade Board add-listing:

`trade_board_intake_sessions`

Suggested fields:

- `id`
- `rep_id`
- `conversation_id`
- `status`: `active`, `completed`, `cancelled`, `expired`, `needs_human_review`
- `current_phase`: `started`, `details_capture`, `photo_capture`, `catalog_match`, `ready_to_add`, `adding`, `completed`
- `item_number`
- `quantity`
- `design_name`
- `collection_name`
- `collection_year`
- `material`
- `main_stone`
- `bp_msrp`
- `ring_size`
- `rep_notes`
- `trade_preferences`
- `missing_fields`
- `hard_blockers`
- `soft_warnings`
- `created_listing_ids`
- `created_design_id`
- `created_at`, `updated_at`, `expires_at`

`trade_board_intake_photos`

Suggested fields:

- `id`
- `session_id`
- `conversation_message_id`
- `attachment_index`
- `declared_role`: `label_details`, `jewelry_front`, `unknown`, `other`
- `visual_role`: `jewelry`, `label_or_packaging`, `uncertain`
- `is_role_confirmed`
- `image_url` or stored uploaded object path
- `quality_score`
- `quality_issues`
- `ocr_or_vision_summary`
- `created_at`

The key architectural decision: `declared_role` wins over `visual_role` for workflow meaning.

### 1a. State Machine Contract

The first implementation should support one workflow type:

`trade_board_add_listing`

Allowed statuses:

- `active`
- `completed`
- `cancelled`
- `expired`
- `needs_human_review`

Allowed phases:

- `started`
- `details_capture`
- `photo_capture`
- `catalog_match`
- `ready_to_add`
- `adding`
- `completed`
- `cancelled`
- `needs_human_review`

Allowed transitions:

| From | To | Trigger |
| --- | --- | --- |
| none | `started` | Rep starts add-listing by chip, natural language, item number, or relevant upload |
| `started` | `details_capture` | Any item/detail signal is present or requested |
| `started` | `photo_capture` | Rep starts with upload but details are not yet known |
| `details_capture` | `catalog_match` | Item number is known |
| `details_capture` | `photo_capture` | Required printed details are known but jewelry photo is missing |
| `photo_capture` | `details_capture` | Jewelry photo is present but required details are missing |
| `photo_capture` | `catalog_match` | Item number and at least one usable details source are present |
| `catalog_match` | `ready_to_add` | Required details and photo role requirements are satisfied |
| `ready_to_add` | `adding` | Controller authorizes final `add_listing` attempt |
| `adding` | `completed` | `add_listing` succeeds and database verification passes |
| any active phase | `cancelled` | Rep clearly cancels or starts over |
| any active phase | `expired` | Session exceeds expiration without activity |
| any active phase | `needs_human_review` | Escalation policy triggers |

Invalid transitions:

- `label_details` photo directly satisfying `jewelry_front`.
- `ready_to_add` without item number or confirmed catalog/new-design path.
- `ready_to_add` without either a usable customer-facing jewelry photo or an approved canonical-photo fallback for known database items.
- `completed` without successful tool result and database verification.
- `cancelled`, `expired`, or `completed` returning to active without creating a new session.

Timeout rule:

- Active sessions should expire after a conservative inactivity window, initially 24 hours.
- If the rep returns to the same conversation after expiration and clearly continues the same add-listing task, create a new session and seed it once from recent conversation context.

Restart rule:

- "Start over", "cancel this", "wrong item", or equivalent wording should cancel the active session and offer to begin a new add-listing workflow.

### 2. Workflow Controller

Create a deterministic controller that:

- Starts or resumes the active add-listing session.
- Ingests text facts and image attachments.
- Updates structured fields.
- Computes missing inputs.
- Determines which tools must remain available.
- Tells the model the current state and next best action.
- Prevents final add unless the state is genuinely ready.

The model should not decide whether the workflow exists. The app should.

### 2a. Controller-To-Model Contract

Every model turn during an active workflow should receive a compact state block with a stable shape. The model may use the block to speak naturally and call tools, but application code remains the source of truth.

Required model-facing state shape:

```ts
type NicNacWorkflowPromptState = {
  workflow: {
    id: string
    type: 'trade_board_add_listing'
    status: 'active' | 'completed' | 'cancelled' | 'expired' | 'needs_human_review'
    phase:
      | 'started'
      | 'details_capture'
      | 'photo_capture'
      | 'catalog_match'
      | 'ready_to_add'
      | 'adding'
      | 'completed'
      | 'cancelled'
      | 'needs_human_review'
  }
  known: {
    itemNumber?: string
    quantity?: number
    designName?: string
    collectionName?: string
    collectionYear?: number
    material?: string
    mainStone?: string
    bpMsrp?: number
    ringSize?: string
  }
  photos: Array<{
    index: number
    declaredRole: 'label_details' | 'jewelry_front' | 'unknown' | 'other'
    visualRole: 'jewelry' | 'label_or_packaging' | 'uncertain'
    roleConfirmed: boolean
    quality: 'usable' | 'warning' | 'blocked' | 'unknown'
    notes: string[]
  }>
  missing: string[]
  blockers: string[]
  nextAction:
    | 'ask_for_item_number'
    | 'ask_for_label_details_photo'
    | 'ask_for_jewelry_front_photo'
    | 'ask_for_collection'
    | 'confirm_extracted_details'
    | 'call_search_jewelry_database'
    | 'call_add_listing'
    | 'ask_photo_role_clarification'
    | 'escalate_to_human_review'
  hardRules: string[]
}
```

Model permissions:

- The model may ask the next question, summarize known details, and call active tools.
- The model may propose extracted fields through a structured update path if implemented.
- The model may not mark workflow state as ready, completed, or verified by text alone.
- The model may not override `declaredRole`.
- The model may not claim a mutation succeeded without the tool result.

Controller responsibilities:

- Own the session state.
- Own final readiness checks.
- Own photo-role invariants.
- Own mutation authorization.
- Own database verification.
- Own telemetry and hard-fail detection.

### 3. Model Prompt As Conversation Layer

Keep Nic-Nac warm and flexible, but reduce the prompt burden:

- Do not encode the entire state machine in prose.
- Feed the model a compact workflow summary each turn.
- Let it ask the next useful question in plain language.
- Let it extract facts from rep language and images, but validate against workflow state.

Example model-facing state:

```text
Active workflow: add_trade_board_listing
Known details:
- itemNumber: ER13229
- designName: The Florence Earrings
- collectionName: July Birthday
- collectionYear: 2026
Photos:
- photo 1: declaredRole=label_details, visualRole=label_or_packaging, roleConfirmed=true
Missing:
- jewelry_front photo
Hard rules:
- photo 1 cannot satisfy jewelry_front
- ask only for the missing customer-facing jewelry photo
Available tools:
- search_jewelry_database
- add_listing
```

Expected reply:

```text
Got it. That first image is just the label/details source. I still need the customer-facing photo of the earrings, then I can finish the listing.
```

### 4. Tool Availability Policy

Change tool routing from "latest text decides everything" to a layered policy:

1. If required setup mode is active, use required setup tools.
2. If a workflow session is active, include that workflow's tools.
3. Add latest-turn tools for unrelated direct requests when safe.
4. Fall back to memory/resources only when no active workflow needs tools.

For Trade Board intake, active workflow tools should include:

- `search_jewelry_database`
- `add_listing`
- `list_my_trade_board` if needed for duplicate or board context
- `report_jewelry_catalog_issue` only if correction flow is explicitly needed

Tool policy source should be logged every run:

- `mode_required_setup`
- `active_workflow`
- `latest_turn_intent`
- `fallback_memory`
- `fallback_resources`

### 5. Photo Role UX

Do not rely only on hidden inference. Make the product help the rep:

Possible low-friction options:

- When the rep taps "Add a piece to Trade Board," show two upload buttons or chips:
  - "Upload label/details"
  - "Upload jewelry photo"
- If they use the generic camera button during an active intake, Nic-Nac can ask "Is this the label/details photo or the jewelry photo?" only when role is ambiguous.
- When Nic-Nac asks for a specific photo, the next uploaded image can inherit the requested role.

This is not making reps fill out a rigid form. It is giving the system reliable state so Nic-Nac can be flexible.

Acceptance criteria:

- Generic chat remains available.
- Role-aware controls appear only during active add-listing or immediately after Nic-Nac asks for a specific photo.
- Reps can still upload normally; ambiguous uploads trigger a short role clarification only when needed.
- Uploads that immediately follow "send the label/details photo" inherit `label_details` unless the rep says otherwise.
- Uploads that immediately follow "send the customer-facing jewelry photo" inherit `jewelry_front` unless the rep says otherwise.
- A rep can correct a role in plain language, and the controller updates `declaredRole` without losing known details.

### 6. Evals And Smoke Harness

Create a repeatable fixture folder:

`C:\Users\louis\sparkle-suite-smoke-assets`

Recommended files:

- `ER13229-label.jpg`
- `ER13229-jewelry-boxed-front.jpg`
- `ER13229-label-with-earring-backs-visible.jpg`
- `ER13229-bad-blurry-jewelry.jpg`
- `ER13229-too-far-jewelry.jpg`
- `cases.txt`

Minimum eval cases:

1. Label photo only
   - Expect: accepts as details source, asks for separate customer-facing jewelry photo.
   - Fail if: critiques the earrings photo, says "photo of the earrings needs", asks for unboxed/plain background.

2. Label photo with backs of earrings visible
   - Expect: still treats as label/details only.
   - Fail if: counts it as jewelry-front photo.

3. Rep provides collection by text
   - Expect: accepts collection, does not demand packaging proof.

4. Boxed display jewelry photo
   - Expect: accepts if centered, close, clear, and attractive.
   - Fail if: says "unboxed", "plain background", or "packaging is too prominent."

5. Correction after Nic-Nac mistake
   - Expect: stays in add-listing workflow and keeps tools active.
   - Fail if: claims manual add is needed.

6. Complete add-listing
   - Expect: calls `add_listing`, does not claim success before tool success, verifies listing/database result.

Hard fail phrases:

- "I can't actually add listings"
- "Log into your workspace and add it manually"
- "The photo of the earrings needs" when only a label/details photo was uploaded
- "Unboxed"
- "Plain background"
- "Packaging is too prominent" for a clear boxed display jewelry photo

The eval harness should support:

- Deterministic route/controller tests.
- Model-in-loop API tests with capped calls.
- Browser or Chrome reviewer-smoke tests with real upload parts.
- Tool-call assertions.
- Final database assertions.
- Transcript and run-id capture for debugging.

### 6a. Eval Grading Contract

Use three grading modes:

Code-graded checks:

- Hard-fail phrase absence.
- Required tool availability.
- Required tool call occurred.
- Forbidden tool call did not occur.
- Database state matches expected listing/design result.
- `label_details` photo does not satisfy `jewelry_front`.
- Known details persist after correction/retry.

Rubric/LLM-graded checks:

- Nic-Nac's response asks the correct next question.
- Nic-Nac's coaching is practical, brief, and not rigid.
- Nic-Nac correctly distinguishes label/details source from customer-facing photo in natural language.
- Nic-Nac does not sound like a generic corporate support bot.

Human review checks for early rollout:

- Website-worthiness of borderline jewelry photos.
- Whether the UI role-capture experience feels helpful rather than form-bound.
- Whether rep-facing copy feels like Neon Rabbit/Sparkle Suite.

Minimum grading output per case:

```json
{
  "caseId": "ER13229-label-only",
  "passed": true,
  "codeChecks": {
    "hardFailPhraseCount": 0,
    "tradeBoardToolsActive": true,
    "labelDidNotSatisfyJewelryFront": true
  },
  "rubricChecks": {
    "askedCorrectNextQuestion": "pass",
    "tone": "pass"
  },
  "toolCalls": [],
  "databaseAssertions": [],
  "notes": []
}
```

### 7. Model Strategy

Do not switch models as the first fix. A better model might be more forgiving, but it will not repair missing workflow state.

Recommended model strategy:

1. Keep current Claude Haiku while building state/evals.
2. Run the same eval bank across candidate models.
3. Compare:
   - task success
   - tool-call correctness
   - photo-role correctness
   - hard-fail phrase rate
   - cost per successful completed listing
   - latency
   - rep-tone quality
4. Use smaller/cheaper models for bounded extraction if they pass.
5. Use stronger models only for ambiguous visual reasoning or complex recovery if the evals prove they are worth the cost.

Potential future split:

- Cheap model or deterministic code: intent classification, workflow state updates, field extraction from text.
- Vision-capable model: photo interpretation when OCR/heuristics are insufficient.
- Main assistant model: rep conversation and tool orchestration.
- Deterministic service code: final validation and mutation.

### 7a. Provider Abstraction Requirement

Before model comparison, route model selection through a provider-neutral adapter instead of hard-coding one provider/model inside `/api/nic-nac`.

Required capabilities:

- Select model by task class: `conversation`, `vision_extraction`, `rubric_grading`, `cheap_text_extraction`.
- Log provider, model, token usage, latency, and estimated cost.
- Support per-environment defaults.
- Support capped smoke/eval runs without changing production defaults.
- Keep tool schema and workflow state independent of provider-specific prompt quirks.

This does not require replacing Vercel AI SDK. It requires isolating model selection so the architecture can compare providers without rewriting business logic.

### 7b. Observability Contract

Every model/tool run inside an active workflow should log:

- `workflow_id`
- `workflow_type`
- `phase_before`
- `phase_after`
- `status_before`
- `status_after`
- `tool_policy_source`
- `active_tools`
- `model_provider`
- `model_name`
- `input_tokens`
- `output_tokens`
- `estimated_cost`
- `latency_ms`
- `photo_roles`: declared role, visual role, role confirmation, quality state
- `tool_calls`: name, success/failure, error code
- `hard_fail_detector`: matched phrases and count
- `final_outcome`: `continued`, `completed`, `cancelled`, `expired`, `needs_human_review`, `failed`

Observability goal:

Louis should be able to tell whether a failure came from routing, workflow state, image role, model behavior, tool execution, or database mutation without replaying the whole conversation by hand.

### 8. Skill And Plugin Plan

Start with a project skill, not a plugin.

Create `sparkle-nic-nac-agent-architecture` after Louis approves this audit. The skill should instruct future Codex sessions to:

- Treat Nic-Nac as a stateful product agent, not a prompt-only chatbot.
- Preserve binder/repo split.
- Avoid Chrome Web Store and protected live extension files.
- Use workflow state before prompt patches.
- Keep photo role rules explicit.
- Require real eval/smoke replay for Trade Board intake changes.
- Prefer reviewer-smoke/synthetic sessions.
- Maintain stable demo alias rules for deployed review.

Use a plugin later only if we bundle executable machinery:

- smoke fixture management
- transcript replay runner
- model comparison runner
- eval grader
- dashboard/report artifact generation
- MCP/app integration for repeatable Nic-Nac QA

Skill first is faster and lower risk. Plugin later is justified when there are scripts and assets worth packaging.

### 9. Human Escalation Policy

Set workflow status to `needs_human_review` when:

- The same tool fails twice for the same required action.
- The rep explicitly says Nic-Nac is wrong, broken, or not listening twice in the same workflow.
- The workflow has conflicting item numbers or collection facts that cannot be safely resolved.
- The jewelry photo remains blocked after two coached attempts.
- The label/details photo remains unreadable after two coached attempts.
- The model or controller detects a possible unsafe catalog mutation.
- Cross-rep data, prompt injection, or unsupported provider action appears in workflow context.

When escalation triggers:

- Preserve the workflow state and transcript.
- Ask one short question only if Louis needs missing context to debug.
- Do not tell the rep to manually add the item unless Louis explicitly designs that as a fallback.
- Create or reuse the support/audit path when available.

### 10. Photo, Transcript, And Privacy Rules

Photos:

- Store uploaded workflow photos through the same approved Sparkle Suite storage path used for jewelry/listing photos.
- Avoid persisting raw data URLs longer than needed for processing.
- Store photo role metadata separately from model interpretation.
- Keep smoke fixture photos local unless Louis explicitly approves adding them to the repo or cloud storage.

Transcripts:

- Eval transcripts may include rep text, assistant text, tool calls, and run metadata.
- Redact direct personal contact/payment identifiers from portable artifacts when not needed for grading.
- Use reviewer/synthetic accounts for browser smoke, not Louis's personal account.
- Mark smoke transcripts as synthetic when generated from fixture data.

Retention:

- Production workflow state should persist long enough for support/debugging and normal rep continuity.
- Synthetic smoke rows, files, and database records should clean up automatically unless a failure artifact is intentionally retained.

### 11. Backward Compatibility And Rollout

Existing conversations will not have workflow session rows. The rollout should handle that without breaking reps:

- If an active add-listing context is detected in recent messages and no session exists, create one new session seeded from recent text and image parts.
- Seed only once per conversation/workflow start to avoid repeatedly reinterpreting old messages.
- Preserve the current tool registry and prompt flow for non-add-listing conversations during Phase B.
- Keep existing deterministic router tests while adding workflow-state precedence tests.
- Do not migrate historical conversations in bulk for the first release.
- Roll out first on stable demo/reviewer-smoke before production.

## Recommended Implementation Phases

### Phase A: Architecture Lock And Skill

Deliverables:

- Finalize this spec into an approved design.
- Create the `sparkle-nic-nac-agent-architecture` skill.
- Add skill references to the binder so future sessions use it.

Exit criteria:

- Louis approves target architecture.
- Future Codex sessions have a reusable workflow for Nic-Nac changes.

### Phase B: Trade Board Intake State

Deliverables:

- Add persistent add-listing session state.
- Add photo role records.
- Add controller functions for state transitions and missing-field computation.
- Integrate active workflow state into `/api/nic-nac` routing and prompt-building.

Exit criteria:

- Existing ER13229-style correction turns keep Trade Board tools active without regex patching every phrase.
- Label/details photos cannot satisfy jewelry-front requirement.

### Phase C: UX Role Capture

Deliverables:

- Add low-friction upload role hints during active add-listing.
- Let requested photo role carry into the next attachment when unambiguous.
- Keep generic camera/gallery behavior for normal chat.

Exit criteria:

- Reps are not forced into a form, but the app can reliably know why each photo was uploaded.

### Phase D: Eval And Smoke Harness

Deliverables:

- Create fixture pack support.
- Add transcript replay tests.
- Add model-in-loop capped smoke.
- Add browser/Chrome reviewer-smoke with real uploads.

Exit criteria:

- ER13229 flow is proven through the actual model/tool loop.
- Hard-fail phrases fail the smoke.
- Tool calls and DB outcomes are verified.

### Phase E: Model Comparison

Deliverables:

- Run the eval bank across candidate models/providers.
- Compare quality, cost, latency, and failure modes.
- Recommend default model and fallback strategy.

Exit criteria:

- Model choice is based on Sparkle Suite's real tasks, not vendor preference.

## Decisions Proposed For Louis

1. Treat workflow state as the source of truth.
2. Treat photo role as explicit state.
3. Keep Nic-Nac conversational, not form-bound.
4. Keep guardrails few and sharp.
5. Require real conversation replay before calling Trade Board intake fixed.
6. Create a reusable skill before creating a plugin.
7. Delay model switching until evals exist.

## Open Questions

1. Should the first implementation focus only on Trade Board add-listing, or should the workflow state layer be generic from day one?

Recommendation: build a generic workflow-session shape, but implement only Trade Board add-listing first.

2. Should photo roles be selected by UI controls, inferred from Nic-Nac's last request, or both?

Recommendation: both. Use UI controls when the guided flow is active, and infer from the last assistant request when the rep uploads immediately after a specific ask.

3. Should unknown/ambiguous photo roles block progress?

Recommendation: only block final mutation. Ambiguous roles can continue collecting details, but final listing requires a confirmed or strongly inferred jewelry-front photo.

4. Should model-in-loop evals run on every change?

Recommendation: deterministic evals on every change; capped model-in-loop evals before deploy or when changing prompts, routing, workflow state, or photo handling.

## Self-Review Notes

- This doc intentionally avoids implementation code.
- The scope is narrow enough for one implementation plan if Phase B is treated as the first build target.
- The main design choice is explicit: app-owned workflow state, model-owned conversation.
- The highest-risk ambiguity is UX role capture; this should be reviewed with Louis before implementation.
- The model/provider decision is intentionally deferred until evals can measure real outcomes.
