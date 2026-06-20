# Sparkle Suite Help & Resources Workflow Playbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the improved Sparkle Suite workspace Help & Resources section as a Workflow Playbook first, with a compact Feature Index and clean support path underneath.

**Architecture:** Evolve the existing `HelpResource` service model instead of creating a new help-center subsystem. Keep `/api/nic-nac/resources` as the endpoint, migrate the resource data into structured workflow/feature/support entries, and replace the flat card rendering in `HelpResourcesCard` with grouped playbook sections and guide detail panels.

**Tech Stack:** Next.js App Router, React client component, TypeScript service-layer data, Vitest unit/component-style tests, existing CSS module styling in `DashboardPlaceholder.module.css`.

---

## Guardrails

- Work from `C:\Users\louis\sparkle-suite-repo` for implementation.
- Do not implement, build, test, commit, or push from `C:\Users\louis\sparkle-suite`.
- Do not touch Chrome Web Store settings.
- Do not modify Sparkle Suite local live queue extension code.
- Treat dirty worktree state as expected. Do not revert unrelated local changes.
- Keep Live Queue copy honest about rollout/readiness; do not claim the Web Store flow is fully live unless product state confirms it.
- Keep Email/SMS copy honest about sandbox, test-mode, coming-soon, and production-ready status.

## File Structure

Modify these active repo files:

- `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
  - Extend `HelpResource` with workflow playbook fields while preserving current fields for compatibility.
- `C:\Users\louis\sparkle-suite-repo\lib\services\help-resources.ts`
  - Replace the flat help-card list with structured workflow, feature reference, troubleshooting, and support entries.
  - Keep `getHelpResources(query?: string): HelpResource[]`.
  - Add small helpers for grouping and filtering if they keep the render simple.
- `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\get-help-resources.ts`
  - Update the tool description so Nic-Nac understands the playbook shape and can use workflow fields.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Replace the flat `HelpResourcesCard` resource list with Workflow Playbook, Feature Index, and Support Path sections.
  - Keep the skin gallery already present in the section unless Louis separately decides to relocate it.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
  - Add focused styles for playbook groups, guide detail rows, feature index, and support path.
- `C:\Users\louis\sparkle-suite-repo\tests\help-resources.test.ts`
  - Update service tests for the new data shape, launch guide coverage, search, and readiness guardrails.
- `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-resources-route.test.ts`
  - Keep route contract coverage passing with the extended `HelpResource` shape.
- `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`
  - Add render/HTML assertions that Help & Resources is no longer a flat junk-drawer list.
- `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\tool-routing.test.ts`
  - Keep help/how-to routing on the read-only resources tool.

No database migration is needed for launch.

---

### Task 1: Add Failing Service Tests For The Workflow Playbook Contract

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\help-resources.test.ts`

- [ ] **Step 1: Replace the old broad category test with explicit playbook coverage**

Add this test near the top of `describe('help resources', () => { ... })`:

```ts
it('defaults to the launch Workflow Playbook guides before feature references', () => {
  const resources = getHelpResources()
  const workflowTitles = resources
    .filter((resource) => resource.type === 'workflow')
    .map((resource) => resource.title)

  expect(workflowTitles).toEqual([
    'Start here: Learn your Sparkle Suite workspace',
    'Finish setup and approve your customer site',
    'Update your customer-facing site',
    'Get ready for a live show',
    'Use Live Queue during a show',
    'Add jewelry to your Trade Board',
    'Handle trade requests',
    'Manage customers and updates',
    'Billing, SMS wallet, and account basics',
    'Fix something or ask for help',
  ])

  const firstFeatureIndex = resources.findIndex(
    (resource) => resource.type === 'feature_reference',
  )
  const lastWorkflowIndex = resources.reduce(
    (lastIndex, resource, index) =>
      resource.type === 'workflow' ? index : lastIndex,
    -1,
  )

  expect(firstFeatureIndex).toBeGreaterThan(lastWorkflowIndex)
})
```

- [ ] **Step 2: Add the standard guide-field contract test**

Add this test below the launch guide coverage test:

```ts
it('gives every workflow guide the standard operator-manual fields', () => {
  const workflows = getHelpResources().filter((resource) => resource.type === 'workflow')

  expect(workflows.length).toBe(10)

  for (const workflow of workflows) {
    expect(workflow.group).toMatch(/Setup|Live Shows|Trade Board|Customers & Account|Help/)
    expect(workflow.goal).toBeTruthy()
    expect(workflow.useWhen).toBeTruthy()
    expect(workflow.beforeYouStart.length).toBeGreaterThanOrEqual(1)
    expect(workflow.steps.length).toBeGreaterThanOrEqual(3)
    expect(workflow.goodResult).toBeTruthy()
    expect(workflow.nicNacPrompt).toMatch(/\w/)
    expect(workflow.stillStuck).toBeTruthy()
  }
})
```

- [ ] **Step 3: Add the Feature Index coverage test**

Add this test after the workflow-field contract test:

```ts
it('keeps a compact Feature Index underneath the workflows', () => {
  const featureReferences = getHelpResources()
    .filter((resource) => resource.type === 'feature_reference')
    .map((resource) => resource.title)

  expect(featureReferences).toEqual([
    'Customer Site',
    'Trade Board',
    'Live Queue',
    'Live Event Calendar',
    'Email Updates',
    'SMS Updates',
    'Nic-Nac',
    'Billing',
    'Account / Settings',
  ])
})
```

- [ ] **Step 4: Add a guardrail test for the Add Jewelry workflow**

Replace the current `includes a rep guide for adding jewelry pieces...` test with:

```ts
it('preserves the strict Add Jewelry workflow sequence and photo boundaries', () => {
  const guide = getHelpResources('add jewelry trade board light box white background')
    .find((resource) => resource.id === 'add-jewelry-to-trade-board')

  expect(guide).toMatchObject({
    type: 'workflow',
    group: 'Trade Board',
    title: 'Add jewelry to your Trade Board',
    nicNacPrompt: 'Help me add a piece to my Trade Board.',
  })

  expect(guide?.steps).toEqual([
    'Start with the item number.',
    'Let Nic-Nac check the Sparkle Suite jewelry database.',
    'If the item is already found, confirm the match and listing details.',
    'If the item is missing, upload a readable label/details photo.',
    'Confirm the collection name or upload packaging context if the collection is not clear.',
    'Upload the final front-facing jewelry photo for the customer-facing board image.',
    'Review the listing and add it to your board.',
  ])

  expect(guide?.body).toContain('Label/details and packaging photos are not final board photos')
  expect(guide?.body).toContain('front-facing jewelry photo')
  expect(guide?.body).toContain('white background')
  expect(guide?.body).toContain('brightest setting')
})
```

- [ ] **Step 5: Add readiness guardrail tests**

Add these tests near the existing Live Queue and domain tests:

```ts
it('keeps Live Queue guidance honest about rollout and Web Store readiness', () => {
  const liveQueueText = getHelpResources('live queue')
    .map((resource) => [resource.title, resource.summary, resource.body].join(' '))
    .join(' ')

  expect(liveQueueText).toContain('coming soon or launch-gated')
  expect(liveQueueText).toContain('Web Store')
  expect(liveQueueText).not.toContain('fully live for every rep')
})

it('keeps Email and SMS update guidance honest about readiness', () => {
  const updateText = getHelpResources('email sms updates')
    .map((resource) => [resource.title, resource.summary, resource.body].join(' '))
    .join(' ')

  expect(updateText).toContain('coming soon or sandbox')
  expect(updateText).toContain('opted-in')
  expect(updateText).not.toContain('send production texts now')
})
```

- [ ] **Step 6: Run the focused failing test**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/help-resources.test.ts
```

Expected result: FAIL because `HelpResource` does not yet have `type`, `group`, workflow fields, or the new launch guide IDs.

---

### Task 2: Extend The HelpResource Type Without Breaking Existing Callers

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\types.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-resources-route.test.ts`

- [ ] **Step 1: Update `HelpResource` type**

Replace the current `HelpResource` interface with:

```ts
export type HelpResourceType =
  | 'workflow'
  | 'feature_reference'
  | 'troubleshooting'
  | 'support'

export type HelpResourceGroup =
  | 'Setup'
  | 'Live Shows'
  | 'Trade Board'
  | 'Customers & Account'
  | 'Help'
  | 'Feature Index'
  | 'Support'

export interface HelpResource {
  id: string
  type: HelpResourceType
  group: HelpResourceGroup
  category: string
  title: string
  summary: string
  body: string
  goal: string
  useWhen: string
  beforeYouStart: string[]
  steps: string[]
  goodResult: string
  nicNacPrompt: string
  stillStuck: string
  relatedFeatureIds: string[]
  quickActions: string[]
  video?: {
    title: string
    provider: 'youtube'
    status: 'placeholder' | 'ready'
    url?: string
  }
}
```

- [ ] **Step 2: Update the mocked route resource**

In `tests/nic-nac-resources-route.test.ts`, update the mocked resource returned by `getHelpResourcesMock.mockReturnValueOnce`.

Use this full object:

```ts
{
  id: 'trade-board',
  type: 'feature_reference',
  group: 'Feature Index',
  category: 'Trade Board',
  title: 'Trade Board',
  summary: 'Trade Board reference.',
  body: 'Trade Board helps reps keep customer trade interest organized.',
  goal: 'Understand where Trade Board help lives.',
  useWhen: 'Use this when you want Trade Board reference help.',
  beforeYouStart: ['Know what trade board question you need answered.'],
  steps: ['Open Help & Resources.', 'Choose Trade Board.', 'Ask Nic-Nac if you need guided help.'],
  goodResult: 'You know which Trade Board workflow to use next.',
  nicNacPrompt: 'Help me with my Trade Board.',
  stillStuck: 'Ask Nic-Nac to collect the trade board details for support.',
  relatedFeatureIds: ['trade-board'],
  quickActions: ['Open Trade Board'],
}
```

- [ ] **Step 3: Run type-focused tests**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/nic-nac-resources-route.test.ts tests/help-resources.test.ts
```

Expected result: route test may pass; help-resources test still fails until the data is migrated.

---

### Task 3: Migrate Help Resource Data Into Structured Workflow And Feature Entries

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\services\help-resources.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\help-resources.test.ts`

- [ ] **Step 1: Add local builder helpers at the top of `help-resources.ts`**

Place these helpers after the import:

```ts
import type {
  HelpResource,
  HelpResourceGroup,
  HelpResourceType,
} from '@/lib/services/types'

type HelpResourceInput = Omit<
  HelpResource,
  | 'beforeYouStart'
  | 'steps'
  | 'relatedFeatureIds'
  | 'quickActions'
> & {
  beforeYouStart?: string[]
  steps?: string[]
  relatedFeatureIds?: string[]
  quickActions?: string[]
}

function helpResource(input: HelpResourceInput): HelpResource {
  return {
    beforeYouStart: ['Open the Sparkle Suite workspace.'],
    steps: ['Open Help & Resources.', 'Choose the closest workflow.', 'Ask Nic-Nac if you want guided help.'],
    relatedFeatureIds: [],
    quickActions: [],
    ...input,
  }
}
```

If TypeScript flags `HelpResourceGroup` or `HelpResourceType` as unused, remove those two imported names and keep only `HelpResource`.

- [ ] **Step 2: Replace the old `HELP_RESOURCES` array with workflow entries first**

The first entries must be the ten workflow guides, in this exact order:

```ts
const HELP_RESOURCES: HelpResource[] = [
  helpResource({
    id: 'start-here-workspace',
    type: 'workflow',
    group: 'Setup',
    category: 'Setup',
    title: 'Start here: Learn your Sparkle Suite workspace',
    summary: 'A quick map of the workspace so reps know where the main tools live.',
    body:
      'Use this as the first stop when the workspace feels like a lot. It explains the main areas without expecting reps to know product names first.',
    goal: 'Understand the main Sparkle Suite workspace areas without feeling lost.',
    useWhen: 'Use this when you are new, returning after time away, or unsure where to start.',
    beforeYouStart: ['Open the Sparkle Suite workspace.'],
    steps: [
      'Review the dashboard as your home base.',
      'Open Nic-Nac when you want plain-English guidance.',
      'Use Site Settings for customer-facing site details.',
      'Use Trade Board for listings, requests, and trade follow-up.',
      'Use Calendar and Live Queue tools before and during live shows.',
      'Use Account for billing, SMS wallet, and site analytics.',
      'Use Help & Resources when you need the next workflow.',
    ],
    goodResult: 'You know which workspace area to open for the job in front of you.',
    nicNacPrompt: 'Walk me through the Sparkle Suite workspace.',
    stillStuck: 'Ask Nic-Nac what you are trying to do and which workspace area to open.',
    relatedFeatureIds: ['nic-nac', 'customer-site', 'trade-board', 'live-queue', 'billing'],
    quickActions: ['Ask Nic-Nac for directions', 'Open Site Settings', 'Open Trade Board'],
    video: {
      title: 'Workspace orientation walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  }),
  helpResource({
    id: 'finish-setup-approve-site',
    type: 'workflow',
    group: 'Setup',
    category: 'Setup',
    title: 'Finish setup and approve your customer site',
    summary: 'Move from a new account to a usable workspace and customer-facing site.',
    body:
      'This workflow keeps setup focused on the basics reps need before sharing their Sparkle Suite link.',
    goal: 'Finish setup, approve the customer-site preview, and unlock the workspace.',
    useWhen: 'Use this when your account is new or your site preview still needs approval.',
    beforeYouStart: [
      'Business or show display name',
      'Public links and social profiles',
      'Preferred customer-site skin',
    ],
    steps: [
      'Confirm your business and profile basics.',
      'Add the public links shoppers need.',
      'Choose or confirm the customer-site skin.',
      'Review the customer-facing site preview.',
      'Ask Nic-Nac to help adjust unclear setup answers.',
      'Approve the final setup preview.',
      'Confirm that the Sparkle Suite workspace opens after approval.',
    ],
    goodResult: 'Your customer site is approved and the workspace opens for regular use.',
    nicNacPrompt: 'Help me finish setup and approve my customer site.',
    stillStuck:
      'Tell Nic-Nac which setup step is blocked and include any visible error or missing field.',
    relatedFeatureIds: ['customer-site', 'nic-nac', 'account-settings'],
    quickActions: ['Review site preview', 'Ask Nic-Nac about setup', 'Open Site Settings'],
  }),
  helpResource({
    id: 'update-customer-site',
    type: 'workflow',
    group: 'Setup',
    category: 'Customer Site',
    title: 'Update your customer-facing site',
    summary: 'Make common customer-site edits without needing support.',
    body:
      'Use Site Settings for public-facing changes shoppers notice first. Custom hero image upload is not part of the launch surface.',
    goal: 'Update the customer-facing site details reps can safely manage from the workspace.',
    useWhen: 'Use this when your show info, links, branding, or Join Team visibility changes.',
    beforeYouStart: ['The exact copy, link, handle, or setting you want to change.'],
    steps: [
      'Open Site Settings.',
      'Update display name, business name, ticker, tagline, or social links.',
      'Confirm the Shop Now link points to the right customer destination.',
      'Set Join Team visibility for launch expectations.',
      'Choose a supported skin preset if the site appearance needs a refresh.',
      'Save the settings.',
      'Open the customer-facing site preview and confirm the change.',
    ],
    goodResult: 'The customer-facing site shows the updated public details.',
    nicNacPrompt: 'Help me update my customer-facing site.',
    stillStuck:
      'Ask Nic-Nac to identify which site setting controls the change and include the exact copy or link you wanted to use.',
    relatedFeatureIds: ['customer-site', 'account-settings', 'nic-nac'],
    quickActions: ['Open Site Settings', 'Preview customer site', 'Ask Nic-Nac for a site edit'],
    video: {
      title: 'Public site editing walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  }),
```

Continue the array with these seven workflow entries using the same `helpResource({ ... })` shape:

```ts
  helpResource({
    id: 'get-ready-for-live-show',
    type: 'workflow',
    group: 'Live Shows',
    category: 'Live Shows',
    title: 'Get ready for a live show',
    summary: 'A pre-show checklist for site, queue, calendar, and trade board readiness.',
    body:
      'Use this before going live so customers can find the right show details and the rep is not chasing setup pieces mid-show.',
    goal: 'Confirm the main Sparkle Suite live-show surfaces are ready before show time.',
    useWhen: 'Use this on show day or while scheduling the next show.',
    beforeYouStart: ['Show date and time', 'Live platform', 'Customer site link', 'Current trade board pieces'],
    steps: [
      'Confirm the upcoming show appears in the calendar.',
      'Open the customer site link and check the visible show information.',
      'Review the Trade Board for stale or unavailable pieces.',
      'Check Live Queue readiness based on current rollout instructions.',
      'Confirm any customer update feature is enabled only if it is production-ready for this account.',
      'Ask Nic-Nac to review anything that looks out of place.',
    ],
    goodResult: 'The customer site, show details, and trade board are ready before the live starts.',
    nicNacPrompt: 'Help me get ready for a live show.',
    stillStuck: 'Tell Nic-Nac which pre-show check failed and include the show date, platform, and visible issue.',
    relatedFeatureIds: ['live-event-calendar', 'live-queue', 'trade-board', 'customer-site'],
    quickActions: ['Open Calendar', 'Open Trade Board', 'Check Live Queue'],
  }),
  helpResource({
    id: 'use-live-queue-during-show',
    type: 'workflow',
    group: 'Live Shows',
    category: 'Live Queue',
    title: 'Use Live Queue during a show',
    summary: 'Understand what the queue is doing and what to check when it looks wrong.',
    body:
      'Live Queue readiness can be coming soon or launch-gated depending on rollout state. Reps should follow the current approved setup path and ask for help if the queue is stale or empty.',
    goal: 'Keep the public queue understandable during a live show.',
    useWhen: 'Use this when checking Live Queue before or during a live show.',
    beforeYouStart: ['Sparkle Suite sync code', 'Bomb Party Party Orders tab', 'Current party or show context'],
    steps: [
      'Confirm the approved Live Queue setup path for this account.',
      'Check that the sync code matches the workspace.',
      'Confirm the Bomb Party Party Orders tab is open when queue sync is expected.',
      'Use Party Filter when only one party should sync from a busy dashboard.',
      'Check whether the queue is stale, empty, or missing expected names.',
      'Ask Nic-Nac to gather status details if the queue still looks wrong.',
    ],
    goodResult: 'The queue state makes sense for the current show, or the right support details are collected.',
    nicNacPrompt: 'Help me check my Live Queue.',
    stillStuck:
      'Include sync code status, Party Filter, whether Chrome and the BP tab are open, and what the public queue shows.',
    relatedFeatureIds: ['live-queue'],
    quickActions: ['Check extension status', 'Review stale queue', 'Ask Nic-Nac for help'],
  }),
  helpResource({
    id: 'add-jewelry-to-trade-board',
    type: 'workflow',
    group: 'Trade Board',
    category: 'Trade Board',
    title: 'Add jewelry to your Trade Board',
    summary: 'Start with the item number, then add photos only when the database needs them.',
    body:
      'Start with the item number. Nic-Nac checks the Sparkle Suite jewelry database first. Label/details and packaging photos are not final board photos; the final customer-facing board image must be a clear front-facing jewelry photo. Use a light box with the white background and brightest setting when taking catalog or board photos.',
    goal: 'Add one tradeable piece with correct details and a customer-facing jewelry photo.',
    useWhen: 'Use this when you have a piece you are willing to trade.',
    beforeYouStart: [
      'Item number',
      'Readable label/details photo if the item is missing from the database',
      'Collection name or packaging context if collection is unclear',
      'Final front-facing jewelry photo',
    ],
    steps: [
      'Start with the item number.',
      'Let Nic-Nac check the Sparkle Suite jewelry database.',
      'If the item is already found, confirm the match and listing details.',
      'If the item is missing, upload a readable label/details photo.',
      'Confirm the collection name or upload packaging context if the collection is not clear.',
      'Upload the final front-facing jewelry photo for the customer-facing board image.',
      'Review the listing and add it to your board.',
    ],
    goodResult: 'The piece appears on your Trade Board with correct details, available status, and a clear jewelry photo.',
    nicNacPrompt: 'Help me add a piece to my Trade Board.',
    stillStuck:
      'Ask Nic-Nac what information is missing. If support is needed, include the item number, photos uploaded, and where the flow stopped.',
    relatedFeatureIds: ['trade-board', 'nic-nac'],
    quickActions: ['Add a piece to Trade Board', 'Review photo best practices', 'Ask Nic-Nac what info is missing'],
    video: {
      title: 'Adding trade board jewelry and taking light-box photos',
      provider: 'youtube',
      status: 'placeholder',
    },
  }),
  helpResource({
    id: 'handle-trade-requests',
    type: 'workflow',
    group: 'Trade Board',
    category: 'Trade Requests',
    title: 'Handle trade requests',
    summary: 'Approve, deny, and follow up on trade requests without losing the thread.',
    body:
      'Sparkle Suite organizes trade interest, but the rep still controls trade judgment, approvals, shipping, and follow-through.',
    goal: 'Move trade requests through a clear decision and fulfillment rhythm.',
    useWhen: 'Use this when a customer requests a trade or a pending trade needs follow-up.',
    beforeYouStart: ['Customer request note', 'Current listing status', 'Rep decision on whether the trade should move forward'],
    steps: [
      'Open the trade request inbox.',
      'Review the customer note and the requested listing.',
      'Approve the request when the trade should move forward.',
      'Deny the request when the trade should not move forward.',
      'Move approved trades through shipped and completed when follow-through happens.',
      'Keep only one request moving forward when several customers want the same piece.',
    ],
    goodResult: 'Each request has the right status and the rep knows what follow-up remains.',
    nicNacPrompt: 'Help me handle my trade requests.',
    stillStuck: 'Include the customer name, listing, request status, and the decision you are trying to make.',
    relatedFeatureIds: ['trade-board'],
    quickActions: ['Open request inbox', 'Approve request', 'Deny request'],
  }),
  helpResource({
    id: 'manage-customers-and-updates',
    type: 'workflow',
    group: 'Customers & Account',
    category: 'Customers',
    title: 'Manage customers and updates',
    summary: 'Keep customer roster, signup, opt-outs, and update readiness clear.',
    body:
      'Email Updates and SMS Updates must be treated according to their current account readiness. Customer messages should only go to opted-in reachable customers when the feature is production-ready for that account; otherwise describe the flow as coming soon or sandbox.',
    goal: 'Understand which customers are reachable and what update tools are ready to use.',
    useWhen: 'Use this when checking customer signup, opt-outs, Email Updates, or SMS Updates.',
    beforeYouStart: ['Customer roster access', 'Signup form link', 'Current Email/SMS readiness state'],
    steps: [
      'Open the customer roster.',
      'Review which customers are reachable by email or SMS.',
      'Use the signup form link when a customer wants to opt in.',
      'Respect opt-outs and STOP status.',
      'Confirm whether Email Updates or SMS Updates are coming soon, sandbox, or production-ready for this account.',
      'Ask Nic-Nac before sending or promising any customer update flow.',
    ],
    goodResult: 'The rep knows who is reachable and avoids promising update behavior that is not ready.',
    nicNacPrompt: 'Help me understand my customer updates.',
    stillStuck: 'Include the customer channel, opt-in question, and whether the account is in sandbox or production mode.',
    relatedFeatureIds: ['email-updates', 'sms-updates', 'customer-roster'],
    quickActions: ['Copy signup form link', 'Review reachable customers', 'Ask Nic-Nac about updates'],
  }),
  helpResource({
    id: 'billing-wallet-account-basics',
    type: 'workflow',
    group: 'Customers & Account',
    category: 'Billing',
    title: 'Billing, SMS wallet, and account basics',
    summary: 'Separate platform billing from SMS wallet spend and account status.',
    body:
      'Platform billing and SMS wallet spend are separate. Payment behavior may be sandbox or test-mode during demo and launch review.',
    goal: 'Understand subscription billing, SMS wallet balance, and account payment state.',
    useWhen: 'Use this when reviewing payment status, SMS wallet balance, or auto-recharge.',
    beforeYouStart: ['Account billing section', 'SMS wallet section', 'Current demo or production context'],
    steps: [
      'Open Account.',
      'Review subscription billing status.',
      'Review SMS wallet balance separately from platform billing.',
      'Check whether auto-recharge is enabled.',
      'Confirm whether payment behavior is sandbox, test-mode, or production-ready.',
      'Ask Nic-Nac to explain unclear account status before escalating.',
    ],
    goodResult: 'The rep understands what is subscription billing and what is SMS wallet spend.',
    nicNacPrompt: 'Help me understand billing and my SMS wallet.',
    stillStuck: 'Include billing status, wallet balance, checkout mode, and the action you attempted.',
    relatedFeatureIds: ['billing', 'sms-updates', 'account-settings'],
    quickActions: ['Open SMS wallet', 'Manage billing', 'Review auto-recharge'],
  }),
  helpResource({
    id: 'fix-something-or-ask-for-help',
    type: 'workflow',
    group: 'Help',
    category: 'Support',
    title: 'Fix something or ask for help',
    summary: 'Try the right first checks, then package support details when blocked.',
    body:
      'This path keeps reps from getting stuck and helps support start from the actual issue instead of asking the rep to repeat everything.',
    goal: 'Resolve simple issues or collect clean support details when the rep is blocked.',
    useWhen: 'Use this when something looks broken, confusing, stale, missing, or blocked.',
    beforeYouStart: ['The page or workflow where the issue happened', 'What you tried', 'Any visible error'],
    steps: [
      'Open the closest workflow guide.',
      'Check the Good Result section to confirm what should happen.',
      'Ask Nic-Nac to walk through the workflow.',
      'If still blocked, collect the page, account, action attempted, and visible error.',
      'Send the support request with those details.',
    ],
    goodResult: 'The rep either resolves the issue or sends support enough context to act.',
    nicNacPrompt: 'Help me troubleshoot this Sparkle Suite issue.',
    stillStuck: 'Include page, account email, action attempted, expected result, actual result, and any visible error.',
    relatedFeatureIds: ['nic-nac', 'account-settings'],
    quickActions: ['Ask Nic-Nac to troubleshoot', 'Gather support details', 'Escalate to support'],
  }),
]
```

- [ ] **Step 3: Append compact feature references after workflows**

Add these entries after the ten workflow entries:

```ts
const FEATURE_REFERENCE_TITLES = [
  ['customer-site', 'Customer Site', 'Update your public-facing Sparkle Suite site details.'],
  ['trade-board', 'Trade Board', 'Manage listings, requests, and trade follow-up.'],
  ['live-queue', 'Live Queue', 'Help customers follow queue state when rollout is active.'],
  ['live-event-calendar', 'Live Event Calendar', 'Show upcoming lives in a clear customer-facing place.'],
  ['email-updates', 'Email Updates', 'Reach opted-in customers when Email Updates are ready for the account.'],
  ['sms-updates', 'SMS Updates', 'Reach opted-in customers when SMS Updates are ready for the account.'],
  ['nic-nac', 'Nic-Nac', 'Use the built-in Sparkle Suite assistant for guided rep support.'],
  ['billing', 'Billing', 'Review platform billing and payment status.'],
  ['account-settings', 'Account / Settings', 'Manage account basics, wallet, and workspace settings.'],
] as const

const FEATURE_RESOURCES: HelpResource[] = FEATURE_REFERENCE_TITLES.map(
  ([id, title, summary]) =>
    helpResource({
      id,
      type: 'feature_reference',
      group: 'Feature Index',
      category: 'Feature Index',
      title,
      summary,
      body: `${title} reference lives under the Feature Index. Use the Workflow Playbook first when you are trying to complete a specific task.`,
      goal: `Know where ${title} fits in Sparkle Suite.`,
      useWhen: `Use this when you already know you need ${title} reference help.`,
      beforeYouStart: ['Know the feature you want to inspect.'],
      steps: [
        'Open Help & Resources.',
        `Choose ${title} in the Feature Index.`,
        'Use the related workflow guide when you need step-by-step help.',
      ],
      goodResult: `You know which ${title} workflow or workspace section to open next.`,
      nicNacPrompt: `Help me with ${title}.`,
      stillStuck: `Ask Nic-Nac which ${title} workflow applies to your situation.`,
      relatedFeatureIds: [id],
      quickActions: [`Open ${title}`, 'Ask Nic-Nac for guided help'],
    }),
)

const HELP_RESOURCES: HelpResource[] = [
  ...WORKFLOW_RESOURCES,
  ...FEATURE_RESOURCES,
]
```

If the worker used `const HELP_RESOURCES` for workflows in Step 2, rename it to `WORKFLOW_RESOURCES` before adding this feature reference block.

- [ ] **Step 4: Keep search compatible with the new fields**

Replace the searchable text block in `getHelpResources` with:

```ts
const searchableText = [
  resource.type,
  resource.group,
  resource.category,
  resource.title,
  resource.summary,
  resource.body,
  resource.goal,
  resource.useWhen,
  ...resource.beforeYouStart,
  ...resource.steps,
  resource.goodResult,
  resource.nicNacPrompt,
  resource.stillStuck,
  ...resource.relatedFeatureIds,
  ...resource.quickActions,
  resource.video?.title ?? '',
  resource.video?.status ?? '',
]
  .join(' ')
  .toLowerCase()
```

- [ ] **Step 5: Run the service tests**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/help-resources.test.ts tests/nic-nac-resources-route.test.ts
```

Expected result: PASS.

- [ ] **Step 6: Checkpoint commit if Louis has approved commits for the implementation session**

```powershell
git add lib/services/types.ts lib/services/help-resources.ts tests/help-resources.test.ts tests/nic-nac-resources-route.test.ts
git commit -m "feat: structure help resources as workflow playbook"
```

Expected result: commit succeeds only if the implementation session includes commit approval and these are intentional changes.

---

### Task 4: Update Nic-Nac Help Tool Copy For The New Playbook Shape

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\get-help-resources.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\tool-routing.test.ts`

- [ ] **Step 1: Update the tool description**

In `get-help-resources.ts`, replace the description string with:

```ts
description:
  'Search the approved Sparkle Suite Help & Resources Workflow Playbook. Prefer workflow guides for step-by-step rep outcomes, feature references for quick lookup, and support resources when the rep is blocked. Use only returned resource details; do not claim coming-soon or sandbox features are fully live.',
```

- [ ] **Step 2: Add a routing assertion that workflow language still maps to resources**

In `tests/nic-nac/tool-routing.test.ts`, add this query to the existing resources routing cases if the file already has an `it.each` block for resources:

```ts
'walk me through adding jewelry to my trade board',
```

If the file does not have that exact shape when executed, add this standalone test:

```ts
it('routes workflow playbook questions to the read-only resources tool', () => {
  const intents = detectToolIntents('walk me through adding jewelry to my trade board')

  expect(intents).toEqual(['resources'])
  expect(listToolNamesForIntents(intents)).toEqual(['get_help_resources'])
})
```

- [ ] **Step 3: Run the routing tests**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/nic-nac/tool-routing.test.ts
```

Expected result: PASS.

- [ ] **Step 4: Checkpoint commit if Louis has approved commits for the implementation session**

```powershell
git add lib/nic-nac/tools/get-help-resources.ts tests/nic-nac/tool-routing.test.ts
git commit -m "fix: teach Nic-Nac resources tool workflow playbook shape"
```

Expected result: commit succeeds only if the implementation session includes commit approval and these are intentional changes.

---

### Task 5: Render Workflow Playbook, Feature Index, And Support Path In The Workspace

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Add small grouping helpers above `HelpResourcesCard`**

Add this code immediately before `function HelpResourcesCard`:

```tsx
const HELP_RESOURCE_GROUP_ORDER = [
  'Setup',
  'Live Shows',
  'Trade Board',
  'Customers & Account',
  'Help',
] as const

function getResourcesByType(resources: HelpResource[] | undefined, type: HelpResource['type']) {
  return resources?.filter((resource) => resource.type === type) ?? []
}

function getWorkflowResourcesByGroup(resources: HelpResource[] | undefined) {
  const workflows = getResourcesByType(resources, 'workflow')

  return HELP_RESOURCE_GROUP_ORDER.map((group) => ({
    group,
    resources: workflows.filter((resource) => resource.group === group),
  })).filter((section) => section.resources.length > 0)
}
```

- [ ] **Step 2: Update the `HelpResourcesCard` header copy**

Replace:

```tsx
<div className={styles.cardSubtitle}>
  Customer-site skin reference and the full operating library.
</div>
```

with:

```tsx
<div className={styles.cardSubtitle}>
  Pick what you are trying to do. Nic-Nac can walk you through the steps when you want help.
</div>
```

- [ ] **Step 3: Add grouped resource constants inside `HelpResourcesCard`**

After `recommendedSkins` is created, add:

```tsx
const workflowGroups = getWorkflowResourcesByGroup(state.resources)
const featureReferences = getResourcesByType(state.resources, 'feature_reference')
const supportResources = (state.resources ?? []).filter((resource) =>
  resource.type === 'support' || resource.id === 'fix-something-or-ask-for-help',
)
```

- [ ] **Step 4: Replace the flat resource list render**

Replace the current block:

```tsx
{state.status === 'ready' && state.resources ? (
  <div className={styles.resourceList}>
    {state.resources.map((resource) => (
      <div key={resource.id} className={styles.resourceCard}>
        ...
      </div>
    ))}
  </div>
) : state.status === 'error' ? (
```

with:

```tsx
{state.status === 'ready' && state.resources ? (
  <div className={styles.playbookStack}>
    <div className={styles.playbookIntro}>
      <div>
        <div className={styles.walletSettingsTitle}>Workflow Playbook</div>
        <div className={styles.helperNote}>
          Start with the outcome, then follow the same simple recipe every time.
        </div>
      </div>
      <span className={styles.rosterTag}>Start here</span>
    </div>

    {workflowGroups.map((section) => (
      <section key={section.group} className={styles.playbookGroup}>
        <div className={styles.playbookGroupHeader}>
          <div className={styles.customerName}>{section.group}</div>
          <span className={styles.rosterTag}>{section.resources.length} guides</span>
        </div>
        <div className={styles.playbookGuideList}>
          {section.resources.map((resource) => (
            <details key={resource.id} className={styles.playbookGuide}>
              <summary className={styles.playbookGuideSummary}>
                <span>
                  <span className={styles.customerName}>{resource.title}</span>
                  <span className={styles.helperNote}>{resource.summary}</span>
                </span>
                <span className={styles.rosterTag}>Open guide</span>
              </summary>
              <div className={styles.playbookGuideBody}>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Goal</span>
                  <p>{resource.goal}</p>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Use this when</span>
                  <p>{resource.useWhen}</p>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Before you start</span>
                  <ul>
                    {resource.beforeYouStart.map((item) => (
                      <li key={`${resource.id}-before-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Steps</span>
                  <ol>
                    {resource.steps.map((step) => (
                      <li key={`${resource.id}-step-${step}`}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Good result</span>
                  <p>{resource.goodResult}</p>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Ask Nic-Nac</span>
                  <p>{resource.nicNacPrompt}</p>
                </div>
                <div className={styles.guideField}>
                  <span className={styles.searchLabel}>Still stuck</span>
                  <p>{resource.stillStuck}</p>
                </div>
                {resource.video ? (
                  <div className={styles.timelineList}>
                    <span className={styles.timelineItem}>
                      Video: {resource.video.title}
                    </span>
                    <span className={styles.timelineItem}>
                      {resource.video.status === 'ready'
                        ? 'Ready to watch'
                        : 'Video slot ready'}
                    </span>
                  </div>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>
    ))}

    <section className={styles.featureIndex}>
      <div className={styles.playbookGroupHeader}>
        <div>
          <div className={styles.walletSettingsTitle}>Feature Index</div>
          <div className={styles.helperNote}>
            Use this when you already know which Sparkle Suite tool you need.
          </div>
        </div>
        <span className={styles.rosterTag}>Quick reference</span>
      </div>
      <div className={styles.featureIndexGrid}>
        {featureReferences.map((resource) => (
          <div key={resource.id} className={styles.featureIndexItem}>
            <div className={styles.customerName}>{resource.title}</div>
            <div className={styles.helperNote}>{resource.summary}</div>
          </div>
        ))}
      </div>
    </section>

    <section className={styles.supportPath}>
      <div>
        <div className={styles.walletSettingsTitle}>Support Path</div>
        <div className={styles.helperNote}>
          Try the workflow first, ask Nic-Nac next, then send support the details if you are blocked.
        </div>
      </div>
      <div className={styles.actionRow}>
        {(supportResources[0]?.quickActions ?? [
          'Ask Nic-Nac to troubleshoot',
          'Gather support details',
          'Escalate to support',
        ]).map((action) => (
          <span key={`support-${action}`} className={styles.timelineItem}>
            {action}
          </span>
        ))}
      </div>
    </section>
  </div>
) : state.status === 'error' ? (
```

- [ ] **Step 5: Add CSS for the new playbook sections**

Add this CSS after `.resourceCard`:

```css
.playbookStack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.playbookIntro,
.playbookGroup,
.featureIndex,
.supportPath {
  border-radius: 14px;
  border: 1px solid var(--nic-nac-border);
  background: rgba(255, 255, 255, 0.72);
  padding: 14px;
}

.playbookIntro,
.playbookGroupHeader,
.supportPath {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.playbookGroup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playbookGuideList {
  display: grid;
  gap: 8px;
}

.playbookGuide {
  border-radius: 12px;
  border: 1px solid rgba(64, 41, 36, 0.1);
  background: rgba(255, 246, 250, 0.58);
  overflow: hidden;
}

.playbookGuideSummary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  list-style: none;
}

.playbookGuideSummary::-webkit-details-marker {
  display: none;
}

.playbookGuideBody {
  display: grid;
  gap: 10px;
  padding: 0 12px 12px;
}

.guideField {
  display: grid;
  gap: 4px;
}

.guideField p,
.guideField ul,
.guideField ol {
  margin: 0;
}

.guideField ul,
.guideField ol {
  padding-left: 18px;
}

.guideField li + li {
  margin-top: 4px;
}

.featureIndex {
  display: grid;
  gap: 10px;
}

.featureIndexGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.featureIndexItem {
  border-radius: 12px;
  border: 1px solid rgba(64, 41, 36, 0.1);
  background: rgba(255, 255, 255, 0.68);
  padding: 10px;
}
```

- [ ] **Step 6: Add mobile CSS**

Inside the existing mobile media query where `.resourceList` becomes one column, add:

```css
.playbookIntro,
.playbookGroupHeader,
.supportPath {
  flex-direction: column;
}

.featureIndexGrid {
  grid-template-columns: 1fr;
}

.playbookGuideSummary {
  flex-direction: column;
}
```

- [ ] **Step 7: Add dashboard rendering assertions**

In `tests/nic-nac-dashboard-placeholder.test.ts`, add this test inside `describe('DashboardPlaceholder', () => { ... })` after the existing `renders the Sparkle Suite Nic-Nac workspace shell` test:

```ts
it('renders Help & Resources as a workflow playbook with a secondary feature index', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { search: '?section=help-resources' } },
  })

  try {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

    expect(html).toContain('Pick what you are trying to do')
    expect(html).toContain('Workflow Playbook')
    expect(html).toContain('Start here: Learn your Sparkle Suite workspace')
    expect(html).toContain('Add jewelry to your Trade Board')
    expect(html).toContain('Goal')
    expect(html).toContain('Use this when')
    expect(html).toContain('Before you start')
    expect(html).toContain('Good result')
    expect(html).toContain('Feature Index')
    expect(html).toContain('Support Path')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})
```

- [ ] **Step 8: Run the dashboard tests**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected result: PASS.

- [ ] **Step 9: Checkpoint commit if Louis has approved commits for the implementation session**

```powershell
git add app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/DashboardPlaceholder.module.css tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "feat: render help resources workflow playbook"
```

Expected result: commit succeeds only if the implementation session includes commit approval and these are intentional changes.

---

### Task 6: Verify API, Tooling, Search, And Build

**Files:**
- Read/verify: `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\resources\route.ts`
- Read/verify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\get-help-resources.ts`
- Read/verify: `C:\Users\louis\sparkle-suite-repo\lib\services\help-resources.ts`

- [ ] **Step 1: Run the full focused Help & Resources suite**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/help-resources.test.ts tests/nic-nac-resources-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/tool-routing.test.ts
```

Expected result: PASS.

- [ ] **Step 2: Run current broader Nic-Nac/help smoke tests**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/help-resources.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected result: PASS.

- [ ] **Step 3: Run the production build**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm run build
```

Expected result: PASS.

- [ ] **Step 4: Manual local review if a dev server is already available**

If a dev server is already running for `C:\Users\louis\sparkle-suite-repo`, open:

```text
http://localhost:3000/nic-nac?section=help-resources
```

Expected visible result:

- Help & Resources subtitle says "Pick what you are trying to do."
- Workflow Playbook appears before Feature Index.
- The ten launch guides are grouped by job area.
- Opening "Add jewelry to your Trade Board" shows Goal, Use this when, Before you start, Steps, Good result, Ask Nic-Nac, and Still stuck.
- Feature Index is compact and secondary.
- Support Path is visible below the index.

- [ ] **Step 5: Final checkpoint commit if Louis has approved commits for the implementation session**

```powershell
git status --short
git add lib/services/types.ts lib/services/help-resources.ts lib/nic-nac/tools/get-help-resources.ts app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/DashboardPlaceholder.module.css tests/help-resources.test.ts tests/nic-nac-resources-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/tool-routing.test.ts
git commit -m "feat: build help resources workflow playbook"
```

Expected result: commit succeeds only if there are remaining intentional changes from this implementation session and Louis has approved committing them.

---

## Self-Review Checklist For The Implementer

- The Workflow Playbook appears before Feature Index in service data and UI.
- The ten approved launch guides are present.
- Every workflow guide includes Goal, Use this when, Before you start, Steps, Good result, Ask Nic-Nac, and Still stuck.
- Search includes workflow fields, not only title/body.
- Add Jewelry guide preserves item-number-first, database check, label/details, collection, and final front-facing photo sequence.
- Live Queue copy does not touch extension code and does not overclaim rollout readiness.
- Email/SMS copy does not overclaim production readiness.
- Skin gallery remains unchanged unless Louis separately asks to move it.
- Existing `/api/nic-nac/resources` route still works.
- Nic-Nac still routes help/how-to/resource questions to the read-only resources tool.
- Focused tests and `npm run build` pass from `C:\Users\louis\sparkle-suite-repo`.
