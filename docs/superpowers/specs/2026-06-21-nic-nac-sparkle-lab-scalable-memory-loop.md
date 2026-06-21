# Nic-Nac And Sparkle Lab Scalable Memory Loop Spec

**Date:** June 21, 2026
**Status:** Locked architecture direction; implementation design still required
**Owner:** Sparkle Suite / Sparkle Finder

---

## Purpose

Nic-Nac is a core Sparkle ecosystem assistant, not a copied chatbot per product. The long-term product goal is one production Nic-Nac that can work with the same human across Sparkle Suite and Sparkle Finder, backed by a scalable memory and improvement loop.

This spec locks the decisions Louis made on June 21, 2026 so future implementation work does not drift into separate assistants, prompt-only memory, or passive logs that do not improve the product.

## Core Product Principle

There is one production Nic-Nac.

Sparkle Suite and Sparkle Finder should feel like two surfaces where the same Nic-Nac appears. A linked rep should not feel like they are talking to a different assistant in Sparkle Finder than the one they work with in Sparkle Suite.

There is one separate lab intelligence surface: Sparkle Lab. Sparkle Lab can study, analyze, draft, recommend, and run internal experiments. Sparkle Lab cannot mutate production behavior without approval.

## Locked Decisions

### 1. Secret Rep ID Number

The private code that was formerly described as the Live Queue code is now the rep's **Secret Rep ID Number**.

It has two internal uses:

- Live Queue connection/sync.
- Sparkle Finder rep account claiming/linking.

Rules:

- It is visible only inside the rep's Sparkle Suite account.
- It should be labeled clearly as secret, such as `Secret Rep ID Number` and `Do not share publicly`.
- It is not a customer-facing referral code.
- It can be rotated if leaked.
- Sparkle Finder uses it to link a Finder account to the durable Sparkle Suite `rep_id`.
- Nic-Nac follows the durable linked identity after setup, not the visible code itself.

### 2. Shared Memory, Surface-Gated Actions

For a linked rep, Nic-Nac should treat the rep as the same person in Sparkle Suite and Sparkle Finder.

Memory is shared across both places for that linked human. Nic-Nac may remember show style, goals, preferences, business habits, collection interests, prior corrections, and how the rep likes to work.

Tool execution is gated by the current authenticated product surface:

- Sparkle Suite work must be done from Sparkle Suite.
- Sparkle Finder work may be done from Sparkle Finder when the user has the needed Finder permissions.
- If a rep asks from Sparkle Finder for a Sparkle Suite mutation, Nic-Nac should retain the context and ask them to open/log into Sparkle Suite for that work.

Example behavior:

> "I know what you want to do, but I need you logged into Sparkle Suite before I can change your Trade Board. Open Sparkle Suite and I can pick it up there."

The assistant should not forget the request or act like a different assistant. The boundary is security and troubleshooting, not identity.

### 3. Sparkle Finder Rep Badge And Silver Tier

Sparkle Finder already exposes public Sparkle Suite data when relevant, including available Trade Board items and the next 48 hours of shows. That public discovery data can exist whether or not the rep has claimed a Finder account.

When a Sparkle Suite rep links a Sparkle Finder account with their Secret Rep ID Number:

- Finder links the Finder user to the Sparkle Suite `rep_id`.
- Finder grants the rep Sparkle Finder Silver tier.
- Finder adds a visible BP Rep / verified rep badge or similar profile flair.
- The rep does not receive extra Sparkle Finder powers beyond the normal Silver account.

The key purpose of this link is not special Finder capability. The purpose is identity continuity so Nic-Nac knows this is the same human across Sparkle Suite and Sparkle Finder.

### 4. Production Nic-Nac Cannot Self-Mutate

Production Nic-Nac is not allowed to change its own production behavior, tools, workflow rules, permissions, prompts, code, product behavior, pricing, or global memory lessons.

Production Nic-Nac can use approved runtime memory and approved tools within product and permission boundaries.

### 5. Sparkle Lab And Lab Nic-Nac

Sparkle Lab is the proactive improvement surface inside the Sparkle Suite Control Center.

Sparkle Lab should be a dedicated Control Center page or section that links back to the main Control Center. Its initial structure should support:

- Nic-Nac Lab: failures, replay cases, memory quality, tool behavior, response quality.
- Sparkle Suite Lab: rep business health, site health, Trade Board/live show patterns, support trends.
- Sparkle Finder Lab: collector behavior, search gaps, jewelry demand, lead flow to reps.
- Ops Lab: internal process issues, trouble-ticket patterns, launch risks, cost/usage trends.
- Research Desk: platform changes, AI/tooling opportunities, live-selling/social commerce trends.

Lab Nic-Nac is separate from production Nic-Nac. Lab Nic-Nac studies production data and internal artifacts, runs private experiments/replays, and produces recommendations. It cannot deploy or promote its own recommendations into production.

### 6. Lab Write Permissions

Sparkle Lab can automatically create internal, non-production artifacts:

- Findings.
- Draft recommendations.
- Replay/eval cases.
- Trouble-ticket analyses.
- Trend notes.
- Analytics reports.
- Business-health reports.
- Research briefs.
- Product opportunity notes.
- Workflow/tool improvement proposals.
- Lab self-improvement notes.

Sparkle Lab cannot automatically change:

- Production Nic-Nac behavior.
- Tool permissions.
- Workflow rules.
- Customer/rep-facing product behavior.
- Global approved lessons.
- Pricing.
- Account settings.
- Code.
- Public site content.

The lab is a researcher, analyst, whistleblower, and recommender. It is not the deployer.

### 7. Lab Loop Can Improve The Lab

Lab Nic-Nac may have its own mini loop for studying the quality of Sparkle Lab itself.

That loop may create internal recommendations such as:

- Lab report quality improvements.
- Missing analytics inputs.
- Better replay/eval categories.
- Noisy finding cleanup.
- Suggested lab cadence changes.
- Proposed new internal checks.

Those recommendations follow the same rule: they remain internal artifacts until reviewed and implemented through normal work.

### 8. No Forced "Wow" Moment

Sparkle Suite should not force a staged Nic-Nac wow moment.

The desired wow factor should compound from:

- Reliability.
- Memory.
- Reduced repeated mistakes.
- Better rep outcomes.
- Better collector experience.
- Lead and sales lift.
- Continuous improvement from the lab loop.

Early beta is expected to have hiccups. That is acceptable if the system captures them, learns from them, and reduces them over time.

### 9. Memory Transparency And Product Terms

Nic-Nac memory is a core product feature and a marketing point.

The product should clearly explain that:

- Nic-Nac remembers helpful context.
- Nic-Nac learns from interactions.
- Nic-Nac uses memory across linked Sparkle Suite and Sparkle Finder experiences.
- Better use of Nic-Nac should lead to better assistance over time.

Do not design broad self-serve memory controls for beta. Reps and collectors get the best Nic-Nac the product can provide. Privacy policy, terms, onboarding, and marketing must state the memory behavior clearly.

Internal/operator correction or deletion tools may still be required for legal, privacy, abuse, data-quality, or operational reasons. Those are not a customer-facing tuning surface.

### 10. Sparkle Lab Cadence And Budget Guardrails

Sparkle Lab should not run continuously or burn model credits without bounds.

Default cadence:

- Run Sparkle Lab once per week by default.
- The preferred initial schedule is Sunday at **2:00 AM America/New_York** so fresh lab results are available Monday morning.
- The cadence is adjustable after real usage shows whether weekly is too much or not enough.

Allowed additional runs:

- Manual/on-demand lab runs from Control Center.
- Narrow issue-specific lab runs tied to a trouble ticket, replay, or urgent investigation.
- High-severity checks may run outside the weekly cadence only when bounded by explicit scope and budget limits.

Budget and usage rules:

- Every lab run must have a configured max cost, max model calls, max runtime, and max records/items reviewed.
- Sparkle Lab must stop gracefully when a limit is reached and report what was skipped.
- Lab reports must show estimated cost/usage, scope reviewed, skipped scope, and whether any limit was hit.
- Lab defaults should prefer summaries, sampling, and staged analysis over reading every raw event.
- A lab run should never recursively trigger unbounded follow-up runs.

Initial default limits:

- Weekly scheduled lab run hard cost cap: **$5.00**.
- Monthly scheduled lab hard cost cap: **$20.00**.
- Default manual/on-demand lab run hard cost cap: **$2.00**.
- Urgent issue-specific run hard cost cap: **$3.00**, unless Louis/operator explicitly raises it before the run.
- Maximum model calls per weekly run: **20 total**, including no more than **4 premium/deep synthesis calls**.
- Maximum model calls per manual/on-demand run: **8 total**, including no more than **2 premium/deep synthesis calls**.
- Maximum wall-clock runtime per weekly run: **20 minutes**.
- Maximum wall-clock runtime per manual/on-demand run: **10 minutes**.
- Maximum records/items reviewed per weekly run: **250 candidate records total** after deterministic pre-filtering.
- Maximum records/items reviewed per manual/on-demand run: **75 candidate records total** after deterministic pre-filtering.
- Maximum deep-analyzed items per weekly run: **25 total**.
- Maximum deep-analyzed items per manual/on-demand run: **10 total**.
- External research/source-fetching is off by default for the weekly run unless the Research Desk section is enabled for that run; when enabled, it is capped at **5 sources** and must prefer primary/official sources.

Prioritization limits:

- The weekly report should elevate no more than **3 headline findings**.
- The weekly report should recommend no more than **2 active work priorities**.
- Additional issues may be tracked as backlog candidates, but they should not be presented as immediate work unless they are urgent business, performance, money, data-safety, or launch-risk issues.
- The lab should rank recommendations by business impact, rep/customer impact, revenue/lead impact, severity, confidence, and implementation effort.
- If the lab hits a cap, it should explicitly say which sections were partial and what it recommends reviewing next week.

Changing limits:

- The lab may recommend raising or lowering its own caps, but it cannot change them.
- Any cap increase requires Louis/operator approval.
- Cap changes should be recorded in Control Center/Sparkle Lab configuration and reflected in the next lab report.

### 11. Nic-Nac Virgo Persona And Mission Tone

Nic-Nac's public personality foundation is September Virgo.

That means Nic-Nac should come across as:

- Organized.
- Detail-minded.
- Service-oriented.
- Practical.
- Warm, friendly, sweet, courteous, and professional.
- Lightly quirky or funny when the moment fits.

The Virgo traits should show up in how Nic-Nac behaves all the time: organized, detail-minded, service-oriented, careful, practical, and helpful. The word `Virgo` should show up rarely. Nic-Nac should mention being a Virgo only if asked directly or during light/playful conversation. It should be a low-key personality detail, not a routine opener, repeated session marker, or forced astrology bit in normal work.

Nic-Nac should stay mission-focused around Sparkle Suite, Sparkle Finder, Bomb Party, live shows, social selling, rep business goals, collector needs, jewelry, streaming setup, hardware/workflow guidance, and system help.

If a user tries to use Nic-Nac as a general chatbot, therapist, grocery-list helper, or unrelated personal assistant, Nic-Nac should politely redirect to his mission instead of spending credits on off-scope support.

## Scalable Loop Shape

The scalable memory and improvement loop is:

```text
Capture -> Classify -> Curate -> Retrieve -> Act -> Verify -> Learn
```

The loop should not rely on one giant prompt. Nic-Nac should receive the right scoped context at the right time.

Core components:

- Event log: important actions and observations across Suite and Finder.
- Workflow state: current active jobs such as Trade Board add, site edit, show planning, collector profile work.
- Profile memory: durable facts about reps, collectors, businesses, goals, preferences, habits.
- Knowledge base: product rules, Bomb Party/Sparkle rules, live-selling guidance, platform/hardware advice.
- Semantic retrieval: likely Supabase pgvector or equivalent for relevant memory lookup.
- Compiled memory summaries: small curated memory cards so runtime context stays bounded.
- Lesson system: approved global lessons from failures, support tickets, Louis corrections, and lab findings.
- Context assembler: selects the memory/tools/rules Nic-Nac sees for a turn.
- Tool registry: allowed actions by product, identity, account tier, surface, and safety state.
- Replay/eval bank: every meaningful failure becomes a replay case.
- Observability: cost, model, tools, latency, failure type, memory used, outcome.

Open Brain is one facet of this loop, not the whole loop. Open Brain can serve as raw capture/archive and semantic source material. Runtime Nic-Nac memory should be more curated and permission-aware.

## Product Context Contract

Nic-Nac's core should receive product context before responding.

Examples:

```text
Suite workspace rep
-> private rep memory
-> Sparkle Suite workspace tools
-> allowed Sparkle Suite mutations

Suite public visitor
-> public rep/site facts only
-> customer-site tools
-> no private workspace mutations

Finder collector
-> collector memory and Finder tools
-> collection/profile/search/favorite actions

Linked rep in Finder
-> shared linked-human memory
-> Finder tools only
-> Suite actions require opening Sparkle Suite

Louis/operator
-> operator/admin memory and tools
-> Sparkle Lab and Control Center surfaces
```

## OpenAI Direction

The working product direction is OpenAI-first for Nic-Nac, with a premium visible assistant experience and cheaper/background models only for invisible utility work.

Implementation must verify current model names, prices, and capabilities before coding. Do not hardcode stale model assumptions from this spec.

The important locked product rule is:

- Human-facing Nic-Nac should not be skimped into a weak model for cost alone.
- Utility/background work may use cheaper models if quality is sufficient.
- Keep provider/accounting complexity low for launch.

## First Implementation Tracks

These tracks are intentionally sequenced. Do not start with self-improvement automation before identity, memory, and safety contracts exist.

### Track 1: Identity And Surface Contract

- Rename the private code in UI/copy to Secret Rep ID Number.
- Ensure it can still serve Live Queue connection/sync.
- Add/plan Sparkle Finder claim flow using Secret Rep ID Number.
- Store durable Finder user to Sparkle Suite `rep_id` link.
- Add rep badge/Silver tier behavior after successful claim.

### Track 2: Shared Nic-Nac Runtime Core

- Extract model/provider selection behind a core adapter.
- Add product context to Nic-Nac calls.
- Add surface-gated tool policy.
- Add shared linked-human memory lookup.
- Ensure Finder and Suite use the same Nic-Nac core rather than copied prompts/tools.

### Track 3: Memory Workbench

- Audit current `rep_notes`, show-session memory, support lessons, Open Brain/memory index, conversation history, and run telemetry.
- Define memory tables and visibility/scope rules.
- Build context assembler for bounded memory packets.
- Add "what memory was used" observability.

### Track 4: Sparkle Lab Page

- Add Sparkle Lab page inside Control Center.
- Include sections for Nic-Nac Lab, Sparkle Suite Lab, Sparkle Finder Lab, Ops Lab, and Research Desk.
- Start with read-only lab artifacts and manually reviewed recommendations.

### Track 5: Replay And Eval Loop

- Extend existing Nic-Nac replay harnesses beyond Trade Board intake.
- Add duplicate-item confirmation regression from the BlingKitchen demo failure.
- Capture trouble-ticket-linked replay candidates.
- Add lab findings that can create replay/eval artifacts automatically.

### Track 6: Lab Cadence

- Weekly scheduled Sparkle Lab report by default, initially Sunday at 2:00 AM America/New_York for Monday morning review.
- On-demand lab run for a specific issue, trend, trouble ticket, replay, or product question.
- High-severity bounded issue scan when an urgent trouble ticket or repeated failure justifies it.
- Post-resolution lesson pass: resolved support reports become lesson/replay candidates.
- Initial weekly usage guardrails: $5/run, $20/month, 20 model calls, 4 premium/deep calls, 20 minutes, 250 candidate records, 25 deep-analyzed items, 3 headline findings, and 2 active work priorities.
- Initial manual/on-demand guardrails: $2/run, 8 model calls, 2 premium/deep calls, 10 minutes, 75 candidate records, and 10 deep-analyzed items.
- Initial urgent issue-specific guardrail: $3/run unless Louis/operator explicitly raises it.
- Graceful stop/report when any limit is hit.

## Required Guardrails

- No production self-mutation by production Nic-Nac or Lab Nic-Nac.
- No separate copied Sparkle Finder Nic-Nac.
- No prompt-only fixes for workflow-state or tool-availability problems.
- No cross-surface mutations without correct authenticated surface.
- No customer-facing memory-control panel for beta unless Louis reopens the decision.
- No hidden memory behavior in terms/privacy/onboarding.
- No off-mission general chatbot behavior. Nic-Nac may be warm and lightly social, but should redirect unrelated therapy, grocery-list, or broad ChatGPT-style requests.
- No always-on Sparkle Lab credit burn. Lab runs must be scheduled or explicitly triggered, bounded, and usage-reported.
- No implementation claim of "fixed" without deterministic tests and real replay/smoke where the workflow risk requires it.

## Clarifications Still Needed Before Implementation

The architecture direction is locked, but implementation still needs discovery before coding:

- Current Sparkle Finder repo/schema location and account model.
- Whether the existing Live Queue code column can safely become the displayed Secret Rep ID Number everywhere, or whether a DB alias/renamed field is needed.
- Exact account-linking table shape between Sparkle Finder users and Sparkle Suite `rep_id`.
- Exact OpenAI model IDs and pricing at implementation time.
- Legal/privacy copy requirements for Nic-Nac memory disclosure and cancellation/access behavior.
- Control Center routing convention for the new Sparkle Lab page.
- Where Sparkle Lab schedule and cap configuration should live in code/database.
- Whether the initial caps are too tight after the first 2-4 real lab runs.

Do not guess these during implementation. Inspect the current code/schema and ask Louis when product intent is not discoverable.

## Success Criteria

This architecture is working when:

- A linked rep experiences Nic-Nac as the same assistant in Sparkle Suite and Sparkle Finder.
- Nic-Nac can use shared memory while respecting surface-gated actions.
- Sparkle Finder linked reps receive Silver tier and a visible BP Rep / verified rep badge without extra Finder privileges beyond Silver.
- Production Nic-Nac and Lab Nic-Nac never mutate production behavior directly.
- Sparkle Lab creates useful findings, replay cases, reports, and recommendations.
- Sparkle Lab runs on a bounded schedule or explicit trigger and reports usage/cost/limits hit.
- Sparkle Lab focuses the team on one or two active priorities instead of overwhelming the backlog.
- Repeated Nic-Nac failures decrease because the loop captures, tests, and resolves them.
- Sparkle Finder collector behavior and Sparkle Suite rep behavior feed business-health and lead-flow insights without leaking private data across users.

## Decision Coverage Audit

This section exists so future sessions can check the June 21 conversation against the durable spec without relying on memory.

| Conversation decision | Spec location | Status |
| --- | --- | --- |
| One production Nic-Nac across Sparkle Suite and Sparkle Finder | Core Product Principle; Locked Decision 2 | Locked |
| Separate Lab Nic-Nac / Sparkle Lab cannot mutate production | Core Product Principle; Locked Decisions 4-7 | Locked |
| Former Live Queue code is now Secret Rep ID Number | Locked Decision 1 | Locked |
| Secret Rep ID Number links Finder user to durable Suite `rep_id` | Locked Decision 1; Track 1 | Locked |
| Linked rep memory is shared across Suite and Finder | Locked Decision 2 | Locked |
| Actions are gated by current product/security surface | Locked Decision 2; Product Context Contract | Locked |
| Finder rep claim grants Silver tier and BP Rep / verified rep badge only | Locked Decision 3 | Locked |
| Sparkle Finder already exposes Suite trade/show data independently of account claim | Locked Decision 3 | Locked |
| Sparkle Lab may create internal artifacts automatically | Locked Decision 6 | Locked |
| Sparkle Lab cannot change production behavior | Locked Decisions 4 and 6 | Locked |
| Lab may have its own improvement loop | Locked Decision 7 | Locked |
| Do not force a staged wow moment | Locked Decision 8 | Locked |
| Nic-Nac memory is a marketed feature; no broad beta memory controls | Locked Decision 9 | Locked |
| Privacy/terms/onboarding must disclose memory behavior | Locked Decision 9; Required Guardrails | Locked |
| Sparkle Lab should not run continuously or burn unbounded credits | Locked Decision 10 | Locked |
| Weekly Sunday 2:00 AM America/New_York is the initial preferred Sparkle Lab cadence | Locked Decision 10; Track 6 | Locked default, adjustable |
| Initial weekly Sparkle Lab hard cap is $5/run and $20/month | Locked Decision 10; Track 6 | Locked default, adjustable |
| Initial lab reports elevate at most 3 headline findings and 2 active work priorities | Locked Decision 10; Track 6 | Locked default, adjustable |
| Nic-Nac is a September Virgo and may mention it only when asked or in light conversation | Locked Decision 11 | Locked |
| Nic-Nac stays mission-focused and redirects off-scope chatbot/therapy/grocery-list use | Locked Decision 11; Required Guardrails | Locked |
| Exact schema/routes/model IDs require implementation-time discovery | Clarifications Still Needed Before Implementation | Open discovery |
| Whether Sparkle Lab caps should change after real run data | Clarifications Still Needed Before Implementation | Open discovery |
