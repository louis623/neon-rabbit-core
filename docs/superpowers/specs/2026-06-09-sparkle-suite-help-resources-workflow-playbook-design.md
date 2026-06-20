# Sparkle Suite Help & Resources Workflow Playbook Design

Date: 2026-06-09

## Purpose

Redesign the Sparkle Suite workspace Help & Resources section so it feels like a dependable rep operating manual instead of a flat pile of help cards.

The section must serve all reps all the time: brand-new reps, active weekly reps, tired reps, overwhelmed reps, and confident power users. The guiding standard is that the lowest-level operator on a bad day should still be able to reach a successful outcome.

## Product Principle

Help & Resources should be a Workflow Playbook first and a feature index second.

Reps should not need to know which Sparkle Suite feature owns their problem before they can get help. The front door should ask what they are trying to do, then guide them through a practical workflow.

## Goals

- Make Help & Resources useful as a daily operating guide, not just a support archive.
- Keep launch scope tight and focused on recurring rep workflows.
- Give every guide a predictable structure that is easy to scan.
- Give reps a clear path from self-service to Nic-Nac guidance to support escalation.
- Prevent future resource sprawl by requiring every new item to fit a defined content type.

## Non-Goals

- Do not build a large searchable knowledge base for launch.
- Do not document every future Sparkle Suite capability before it is production-ready.
- Do not make the feature index the main navigation.
- Do not make Nic-Nac the whole product story.
- Do not imply that Email/SMS updates, Live Queue rollout, payments, or production workflows are fully live when they are still sandbox, coming soon, or launch-gated.

## Information Architecture

Help & Resources has three layers, in this order:

1. Workflow Playbook
2. Feature Index
3. Support Path

### Workflow Playbook

This is the primary section. It answers: "What are you trying to do?"

Launch workflow guides:

- Start here: Learn your Sparkle Suite workspace
- Finish setup and approve your customer site
- Update your customer-facing site
- Get ready for a live show
- Use Live Queue during a show
- Add jewelry to your Trade Board
- Handle trade requests
- Manage customers and updates
- Billing, SMS wallet, and account basics
- Fix something or ask for help

These guides should be grouped by job area:

- Setup
- Live Shows
- Trade Board
- Customers & Account
- Help

### Feature Index

This is a smaller secondary section for reps who already know which tool they need.

Launch feature links:

- Customer Site
- Trade Board
- Live Queue
- Live Event Calendar
- Email Updates
- SMS Updates
- Nic-Nac
- Billing
- Account / Settings

Feature index pages or entries should stay short. If a feature entry becomes a step-by-step how-to, that content should be promoted into the Workflow Playbook or folded into an existing workflow guide.

### Support Path

The bottom of the section should provide simple support exits:

- Ask Nic-Nac
- Report a problem
- Request premium help, where appropriate

Support should not be the first or only path. The section should first help reps succeed through a workflow, then escalate cleanly when they are blocked.

## Guide Template

Every workflow guide must use the same structure.

### Goal

One plain-English sentence describing the successful outcome.

### Use This When

A short trigger that helps the rep know they are in the right place.

### Before You Start

Any information or material the rep needs ready, such as:

- item number
- customer site link
- show details
- label/details photo
- front-facing jewelry photo
- collection name
- sync code
- customer note
- billing or wallet status

### Steps

Short numbered steps. Steps should be action-first and should avoid long explanatory paragraphs.

### Good Result

What the rep should see when the workflow has worked.

### Ask Nic-Nac

A suggested prompt or action that starts the guided Nic-Nac flow.

### Still Stuck

What to check before escalation and what details to include if support is needed.

## Example Guide

### Add Jewelry To Your Trade Board

Goal: Add one tradeable piece with the correct details and customer-facing photo.

Use this when: You have a piece you are willing to trade.

Before you start: Have the item number ready. If the piece is not already in the database, you may also need a readable label/details photo, collection name or packaging photo, and a front-facing jewelry photo.

Steps:

1. Start with the item number.
2. Let Nic-Nac check the jewelry database.
3. If the item is already found, confirm the match.
4. If the item is missing, upload the label/details photo.
5. Confirm the collection.
6. Upload the final front-facing jewelry photo.
7. Review the listing and add it to your board.

Good result: The piece appears on your Trade Board with the correct item details, available status, and a clear jewelry photo.

Ask Nic-Nac: "Help me add a piece to my Trade Board."

Still stuck: Ask Nic-Nac what information is missing. If support is needed, include the item number, photos uploaded, and where the flow stopped.

## Launch Guide Details

### Start Here: Learn Your Sparkle Suite Workspace

Goal: Help any rep understand the main areas without feeling lost.

Covers:

- Dashboard
- Nic-Nac
- Customer site
- Trade Board
- Live Queue
- Live event calendar
- Customers
- Billing
- Support

### Finish Setup And Approve Your Customer Site

Goal: Get from a new account to a usable Sparkle Suite workspace and customer site.

Covers:

- Business/profile basics
- Display name
- Public links
- Skin
- Preview
- Final approval
- Workspace unlock

### Update Your Customer-Facing Site

Goal: Make common site edits without needing support.

Covers:

- Show name
- Ticker/banner text
- Tagline
- Social links
- Shop Now link
- Join Team visibility
- Skin preset

### Get Ready For A Live Show

Goal: Give reps a clear pre-show checklist.

Covers:

- Upcoming show details
- Live Queue readiness
- Customer site link
- Trade Board freshness
- Customer updates when enabled or production-ready

### Use Live Queue During A Show

Goal: Help reps understand what the queue is doing and what to check when it looks wrong.

Covers:

- Extension status
- Sync code
- Party Filter
- Stale queue
- Empty queue
- What customers see

Live Queue copy must stay honest about rollout status. If the production-ready Web Store flow is not active for a given rep, the guide must say so plainly.

### Add Jewelry To Your Trade Board

Goal: Get one piece listed correctly.

Covers:

- Item number first
- Jewelry database check
- Label/details photo only if needed
- Collection confirmation
- Final front-facing jewelry photo
- Available status

Label/details photos, packaging photos, and final customer-facing jewelry photos must remain separate in the guide.

### Handle Trade Requests

Goal: Make trade follow-up orderly.

Covers:

- Approve
- Deny
- Pending
- Shipped
- Completed
- Multiple customers wanting the same piece
- Rep judgment controlling the trade

The guide should not imply Sparkle Suite guarantees trade value, settles disputes, or approves trades for the rep.

### Manage Customers And Updates

Goal: Keep customer communication boundaries clear.

Covers:

- Customer roster
- Signup form
- Reachable customers
- Opt-outs
- Email updates
- SMS updates

Email/SMS copy must distinguish between live, sandbox, and coming-soon states.

### Billing, SMS Wallet, And Account Basics

Goal: Separate platform billing from SMS spend.

Covers:

- Subscription billing
- SMS wallet
- Auto-recharge
- Payment status
- Test-mode or sandbox language where relevant

### Fix Something Or Ask For Help

Goal: Give reps a calm escalation path.

Covers:

- What to try first
- When Nic-Nac can guide the workflow
- When support needs to step in
- What details to include

Escalation prompts should collect enough context for support to start from the actual problem instead of asking the rep to repeat everything.

## UI Behavior

The top of Help & Resources should lead with:

Title: Help & Resources

Supporting line: Pick what you are trying to do. Nic-Nac can walk you through the steps when you want help.

Search should remain available, but it should not be the main event. The main experience should be the workflow tiles or rows.

Recommended flow:

1. Rep opens Help & Resources.
2. Rep chooses a workflow from the Workflow Playbook.
3. The guide opens in a focused detail view or expanded panel.
4. The guide shows the standard template.
5. Rep can follow steps, ask Nic-Nac, or escalate if blocked.
6. Rep can still use the Feature Index for quick reference.

## Content Rules

### No Orphan Resources

Every item must belong to one of these types:

- workflow guide
- feature reference
- troubleshooting entry
- support/escalation note

If it does not fit one of those types, it should be rewritten or folded into an existing guide.

### One Guide, One Outcome

Do not create broad mixed guides such as "Shows and Trade Board and Setup." Split or rewrite them.

### Steps Before Explanation

Reps should not have to read a long introduction before the action steps.

### Plain-English Labels

Use labels like "Add jewelry to my Trade Board" instead of "Trade Board inventory management."

### Nic-Nac Is An Action Path

Every workflow should include a guided Nic-Nac prompt or action. Nic-Nac should help the rep do the thing; it should not become a generic article category.

### Escalation Collects Context

The Still Stuck section should tell reps what details to include so support is not starting from zero.

### Coming-Soon Features Stay Honest

Email/SMS updates, Live Queue readiness, and payment behavior must be described according to their current real status.

### Keep Launch Scope Tight

Do not add a new guide unless it helps a rep complete a real recurring workflow.

## Data Shape Recommendation

The current resource model can evolve from flat cards into structured guides.

Recommended fields:

- id
- type: workflow, feature_reference, troubleshooting, support
- group
- title
- summary
- goal
- useWhen
- beforeYouStart
- steps
- goodResult
- nicNacPrompt
- stillStuck
- relatedFeatureIds
- quickActions
- video
- status

Existing simple resources can be migrated into this structure gradually. Launch should prioritize the workflow guides first, then fold the older flat resource cards into the new model where they belong.

## Testing And Verification Approach

When implemented, verify:

- Help & Resources defaults to Workflow Playbook content, not a flat all-resource list.
- The ten launch workflow guides are present.
- Each workflow guide includes the standard guide fields.
- The Feature Index is visible but secondary.
- Search still returns relevant workflow and feature entries.
- The Add Jewelry workflow preserves the item-number, database-check, label/details, collection, and final front-facing jewelry photo sequence.
- Email/SMS and Live Queue copy does not overstate production readiness.
- Empty/error states tell reps what to do next.

## Launch Implementation Defaults

Use these defaults unless Louis approves a different implementation direction:

- Guides should open as expanded panels or an in-section detail view inside the existing workspace surface. A separate route is not needed for launch.
- Nic-Nac prompts should be both visible as plain text and available as a one-click chat starter when the UI supports it.
- Launch should prioritize the ten workflow guides and keep some existing help cards as compact feature references during migration.
- The first implementation should avoid a heavy CMS, nested article hierarchy, or large help-center buildout.

## Approved Direction

Louis approved the following foundation in chat on 2026-06-09:

- Workflow Playbook with a small Feature Index underneath.
- First launch batch of ten workflow guides.
- Standard guide recipe: Goal, Use this when, Before you start, Steps, Good result, Ask Nic-Nac, Still stuck.
- Content rules that prevent Help & Resources from becoming a junk pile again.
