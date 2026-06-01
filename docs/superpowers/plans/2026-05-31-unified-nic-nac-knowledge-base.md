# Unified Nic-Nac Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one canonical Nic-Nac knowledge base used by every Nic-Nac surface in Sparkle Suite and Sparkle Finder, with separate guardrails and tool permissions per surface.

**Architecture:** Extract product truth, Bomb Party rep terminology, TradeBoard/dance floor rules, LiveQ facts, affiliation language, and Nic-Nac personality into a shared domain package. Public landing, rep workspace, customer-site, and Sparkle Finder surfaces compose that shared knowledge with their own surface policy, guardrails, prompt framing, and tool permissions. Runtime tools remain surface-specific; shared knowledge must never imply shared powers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vercel AI SDK, Anthropic provider, Vitest.

---

## Scope And Principles

This plan is a knowledge architecture migration, not a UI redesign.

The target model is: same Nic-Nac, same core truth, different doors and permissions.

- Public landing Nic-Nac can answer sales/setup/product-fit questions, but cannot inspect private data or trigger providers.
- Rep workspace Nic-Nac can use authenticated tools scoped to the rep, but must not leak cross-rep data or invent tool results.
- Customer-site Nic-Nac can answer customer-safe questions only.
- Sparkle Finder Nic-Nac should consume the same brand, product, terminology, and safety language when it uses Nic-Nac personality or Sparkle Suite concepts.

Do not stage, commit, deploy, push, or touch production without explicit approval.

Do not touch:

- `chrome-extension/content.js`
- `supabase/functions/live-queue-sync`
- `docs/sparkle-suite/marketing`
- hero images

Do not add live SMS/email/SignWell/Stripe/calendar/provider actions.

## Current State

Public landing Nic-Nac currently has its own package:

- `lib/sparkle-suite/public-nic-nac-knowledge.ts`
- `lib/sparkle-suite/public-nic-nac-prompt.ts`
- `lib/sparkle-suite/public-nic-nac-guardrails.ts`
- `lib/sparkle-suite/public-nic-nac-contract.ts`
- `app/api/public/nic-nac/route.ts`

Rep workspace Nic-Nac currently has its own prompt/tool system:

- `lib/nic-nac/prompt-builder.ts`
- `lib/nic-nac/system-prompt.ts`
- `lib/nic-nac/tools/index.ts`
- `app/api/nic-nac/route.ts`

The public and workspace assistants overlap in facts, but they are not driven by one canonical knowledge source yet.

## Target File Structure

Create a shared Nic-Nac knowledge package:

- Create `lib/nic-nac/knowledge/core.ts`
  - Canonical product truth and shared terms.
  - No surface permissions.
  - No secrets, internals, customer data, provider credentials, or private roadmap.

- Create `lib/nic-nac/knowledge/tradeboard.ts`
  - TradeBoard/dance floor facts.
  - Dancers terminology.
  - Eligibility/value/shipping/dispute boundaries.
  - Public-safe and workspace-safe wording that can be rendered into prompts.

- Create `lib/nic-nac/knowledge/liveq.ts`
  - LiveQ public-level facts and data boundaries.
  - Workspace-level operational facts only if already approved and non-secret.

- Create `lib/nic-nac/knowledge/affiliation.ts`
  - Bomb Party affiliation disclaimer.
  - Neon Rabbit/Sparkle Suite ownership wording.

- Create `lib/nic-nac/knowledge/personality.ts`
  - Nic-Nac voice rules shared across surfaces.
  - Surface-neutral personality constraints: warm, practical, plain-English, not corporate, no cheesy hype.

- Create `lib/nic-nac/knowledge/index.ts`
  - Exports structured knowledge objects.
  - Exports renderer helpers such as `buildNicNacCoreKnowledgeText(surface)`.

- Create `lib/nic-nac/surfaces.ts`
  - Defines supported surfaces: `public_landing`, `rep_workspace`, `customer_site`, `sparkle_finder`.
  - Defines surface policy shape.

- Create `lib/nic-nac/surface-policy.ts`
  - Public allowed/blocked scopes.
  - Workspace allowed/blocked scopes.
  - Customer-site allowed/blocked scopes.
  - Sparkle Finder allowed/blocked scopes.

Modify public surface files:

- Modify `lib/sparkle-suite/public-nic-nac-knowledge.ts`
  - Convert into a compatibility adapter, or delete after migration if imports are updated.
  - It should consume `lib/nic-nac/knowledge/*`, not duplicate canonical facts.

- Modify `lib/sparkle-suite/public-nic-nac-prompt.ts`
  - Compose shared knowledge plus public landing policy.

- Modify `lib/sparkle-suite/public-nic-nac-guardrails.ts`
  - Keep public preflight/postflight checks.
  - Import shared terminology lists where useful.

Modify workspace files:

- Modify `lib/nic-nac/prompt-builder.ts`
  - Add shared knowledge sections to the workspace prompt.
  - Keep active tools and workspace-specific routing exactly where they are.

- Modify `lib/nic-nac/system-prompt.ts`
  - Either reduce duplication by composing from shared knowledge or mark it as legacy/static and ensure production builder uses the shared renderer.

Add or update tests:

- Create `tests/nic-nac-shared-knowledge.test.ts`
- Create `tests/nic-nac-surface-policy.test.ts`
- Modify `tests/sparkle-suite-public-nic-nac-contract.test.ts`
- Modify `tests/sparkle-suite-public-nic-nac-route.test.ts`
- Modify or add workspace prompt tests, likely under `tests/nic-nac/prompt-routing.test.ts` or a new `tests/nic-nac-workspace-knowledge.test.ts`
- Add Sparkle Finder coverage after locating its current Nic-Nac or assistant entrypoints.

---

## Task 1: Inventory Every Nic-Nac Surface

**Files:**
- Read: `app/api/public/nic-nac/route.ts`
- Read: `app/api/nic-nac/route.ts`
- Read: `lib/sparkle-suite/public-nic-nac-*.ts`
- Read: `lib/nic-nac/prompt-builder.ts`
- Read: `lib/nic-nac/system-prompt.ts`
- Read: Sparkle Finder assistant files found by search
- Create: `docs/superpowers/specs/2026-05-31-nic-nac-surface-inventory.md`

- [ ] **Step 1: Search all Nic-Nac references**

Run:

```powershell
rg "Nic-Nac|nic-nac|NicNac|assistant|prompt|knowledge|guardrail" app lib tests docs -g "*.ts" -g "*.tsx" -g "*.md"
```

Expected: output lists public landing, workspace, tests, brand docs, and any Sparkle Finder surfaces.

- [ ] **Step 2: Write the inventory doc**

Create `docs/superpowers/specs/2026-05-31-nic-nac-surface-inventory.md` with this structure:

```markdown
# Nic-Nac Surface Inventory

## Public Landing

- Entry route:
- Prompt files:
- Knowledge files:
- Guardrails:
- Tools/provider actions:
- Allowed scope:
- Blocked scope:

## Rep Workspace

- Entry route:
- Prompt files:
- Knowledge files:
- Guardrails:
- Tools/provider actions:
- Allowed scope:
- Blocked scope:

## Customer Site

- Entry route:
- Prompt files:
- Knowledge files:
- Guardrails:
- Tools/provider actions:
- Allowed scope:
- Blocked scope:

## Sparkle Finder

- Entry route:
- Prompt files:
- Knowledge files:
- Guardrails:
- Tools/provider actions:
- Allowed scope:
- Blocked scope:

## Duplicated Facts To Extract

- Bomb Party rep audience:
- TradeBoard / dance floor:
- dancers:
- LiveQ:
- affiliation:
- setup/onboarding:
- email/SMS consent:
- pricing:
- Nic-Nac personality:
```

- [ ] **Step 3: Confirm no prohibited paths are in scope**

Run:

```powershell
Select-String -Path docs\superpowers\specs\2026-05-31-nic-nac-surface-inventory.md -Pattern "chrome-extension/content.js|supabase/functions/live-queue-sync|docs/sparkle-suite/marketing"
```

Expected: no matches.

---

## Task 2: Create Shared Surface Types And Policy Contract

**Files:**
- Create: `lib/nic-nac/surfaces.ts`
- Create: `lib/nic-nac/surface-policy.ts`
- Create: `tests/nic-nac-surface-policy.test.ts`

- [ ] **Step 1: Write failing tests for surface definitions**

Create `tests/nic-nac-surface-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  NIC_NAC_SURFACES,
  type NicNacSurface,
} from '@/lib/nic-nac/surfaces'
import {
  NIC_NAC_SURFACE_POLICIES,
  getNicNacSurfacePolicy,
} from '@/lib/nic-nac/surface-policy'

describe('Nic-Nac surfaces', () => {
  it('defines every known Nic-Nac surface', () => {
    expect(NIC_NAC_SURFACES).toEqual([
      'public_landing',
      'rep_workspace',
      'customer_site',
      'sparkle_finder',
    ])
  })

  it('has a policy for every surface', () => {
    for (const surface of NIC_NAC_SURFACES) {
      expect(NIC_NAC_SURFACE_POLICIES[surface]).toBeDefined()
      expect(getNicNacSurfacePolicy(surface).surface).toBe(surface)
    }
  })

  it('keeps public landing read-only and provider-action blocked', () => {
    const policy = getNicNacSurfacePolicy('public_landing')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(false)
    expect(policy.canTriggerProviderActions).toBe(false)
    expect(policy.allowedScopes).toContain('public_sales_support')
    expect(policy.blockedScopes).toContain('private_workspace_data')
    expect(policy.blockedScopes).toContain('provider_actions')
  })

  it('allows rep workspace tools without allowing cross-rep data', () => {
    const policy = getNicNacSurfacePolicy('rep_workspace')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(true)
    expect(policy.allowedScopes).toContain('authenticated_rep_workspace')
    expect(policy.blockedScopes).toContain('cross_rep_data')
    expect(policy.blockedScopes).toContain('unapproved_provider_actions')
  })

  it('keeps customer site customer-safe', () => {
    const policy = getNicNacSurfacePolicy('customer_site')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(false)
    expect(policy.allowedScopes).toContain('customer_safe_support')
    expect(policy.blockedScopes).toContain('rep_admin_workflows')
  })

  it('keeps Sparkle Finder scoped to finder-safe knowledge', () => {
    const policy = getNicNacSurfacePolicy('sparkle_finder')

    expect(policy.allowedScopes).toContain('finder_safe_guidance')
    expect(policy.blockedScopes).toContain('sparkle_suite_private_workspace')
  })

  it('rejects unknown surfaces at compile time through the NicNacSurface type', () => {
    const surface: NicNacSurface = 'public_landing'

    expect(surface).toBe('public_landing')
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm exec vitest run tests/nic-nac-surface-policy.test.ts
```

Expected: FAIL because `lib/nic-nac/surfaces.ts` and `lib/nic-nac/surface-policy.ts` do not exist yet.

- [ ] **Step 3: Implement surface definitions**

Create `lib/nic-nac/surfaces.ts`:

```ts
export const NIC_NAC_SURFACES = [
  'public_landing',
  'rep_workspace',
  'customer_site',
  'sparkle_finder',
] as const

export type NicNacSurface = (typeof NIC_NAC_SURFACES)[number]
```

- [ ] **Step 4: Implement surface policies**

Create `lib/nic-nac/surface-policy.ts`:

```ts
import type { NicNacSurface } from './surfaces'

export interface NicNacSurfacePolicy {
  surface: NicNacSurface
  audience: string
  allowedScopes: string[]
  blockedScopes: string[]
  canUseAuthenticatedWorkspaceTools: boolean
  canTriggerProviderActions: boolean
}

export const NIC_NAC_SURFACE_POLICIES = {
  public_landing: {
    surface: 'public_landing',
    audience: 'Potential Sparkle Suite buyers and Bomb Party representatives before checkout.',
    allowedScopes: [
      'public_sales_support',
      'public_product_fit',
      'public_setup_overview',
      'public_tradeboard_explanation',
    ],
    blockedScopes: [
      'private_workspace_data',
      'admin_workflows',
      'implementation_details',
      'provider_actions',
      'custom_pricing_exceptions',
      'non_public_roadmap',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
  rep_workspace: {
    surface: 'rep_workspace',
    audience: 'Authenticated Sparkle Suite reps working inside their own workspace.',
    allowedScopes: [
      'authenticated_rep_workspace',
      'rep_owned_trade_board',
      'rep_owned_trade_requests',
      'rep_owned_calendar',
      'rep_owned_customer_audience',
      'approved_single_customer_notifications',
    ],
    blockedScopes: [
      'cross_rep_data',
      'unapproved_provider_actions',
      'secret_extraction',
      'prompt_extraction',
      'unsupported_bulk_campaigns',
      'non_public_roadmap',
    ],
    canUseAuthenticatedWorkspaceTools: true,
    canTriggerProviderActions: true,
  },
  customer_site: {
    surface: 'customer_site',
    audience: 'Customers visiting a rep customer-facing site.',
    allowedScopes: [
      'customer_safe_support',
      'public_show_details',
      'customer_trade_request_help',
      'public_liveq_status_explanation',
    ],
    blockedScopes: [
      'rep_admin_workflows',
      'private_workspace_data',
      'cross_customer_data',
      'provider_actions',
      'private_rep_notes',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
  sparkle_finder: {
    surface: 'sparkle_finder',
    audience: 'Sparkle Finder users who need finder-safe guidance.',
    allowedScopes: [
      'finder_safe_guidance',
      'public_product_language',
      'shared_nic_nac_personality',
    ],
    blockedScopes: [
      'sparkle_suite_private_workspace',
      'rep_admin_workflows',
      'provider_actions',
      'secret_extraction',
    ],
    canUseAuthenticatedWorkspaceTools: false,
    canTriggerProviderActions: false,
  },
} as const satisfies Record<NicNacSurface, NicNacSurfacePolicy>

export function getNicNacSurfacePolicy(surface: NicNacSurface) {
  return NIC_NAC_SURFACE_POLICIES[surface]
}
```

- [ ] **Step 5: Run policy tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-surface-policy.test.ts
```

Expected: PASS.

---

## Task 3: Extract Canonical Shared Knowledge

**Files:**
- Create: `lib/nic-nac/knowledge/core.ts`
- Create: `lib/nic-nac/knowledge/tradeboard.ts`
- Create: `lib/nic-nac/knowledge/liveq.ts`
- Create: `lib/nic-nac/knowledge/affiliation.ts`
- Create: `lib/nic-nac/knowledge/personality.ts`
- Create: `lib/nic-nac/knowledge/index.ts`
- Create: `tests/nic-nac-shared-knowledge.test.ts`

- [ ] **Step 1: Write failing shared knowledge tests**

Create `tests/nic-nac-shared-knowledge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  NIC_NAC_AFFILIATION,
  NIC_NAC_CORE_KNOWLEDGE,
  NIC_NAC_LIVEQ_KNOWLEDGE,
  NIC_NAC_PERSONALITY,
  NIC_NAC_TRADEBOARD_KNOWLEDGE,
  buildNicNacCoreKnowledgeText,
} from '@/lib/nic-nac/knowledge'

describe('shared Nic-Nac knowledge', () => {
  it('defines shared product truth for all Nic-Nac surfaces', () => {
    expect(NIC_NAC_CORE_KNOWLEDGE.productName).toBe('Sparkle Suite')
    expect(NIC_NAC_CORE_KNOWLEDGE.assistantName).toBe('Nic-Nac')
    expect(NIC_NAC_CORE_KNOWLEDGE.primaryAudience).toContain('Bomb Party')
    expect(NIC_NAC_CORE_KNOWLEDGE.productSummary).toContain('customer-facing website')
    expect(NIC_NAC_CORE_KNOWLEDGE.productSummary).toContain('live-show support tools')
  })

  it('defines TradeBoard, dance floor, and dancers terminology once', () => {
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.productTerm).toBe('TradeBoard')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.danceFloor).toContain('TradeBoard')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.dancers).toContain('trade-eligible jewelry')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow).toContain('Customers do not add')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow).toContain('request')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow).toContain('piece they just revealed')
  })

  it('defines trade eligibility and value boundaries', () => {
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules).toContain('item-for-item only')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules).toContain('same collection')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules).toContain('same jewelry type')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules).toContain('MSRP is reference only')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules).toContain('No pay-the-difference')
    expect(NIC_NAC_TRADEBOARD_KNOWLEDGE.boundaries).toContain('does not handle shipping')
  })

  it('defines public-safe LiveQ data boundaries', () => {
    expect(NIC_NAC_LIVEQ_KNOWLEDGE.summary).toContain('live-show queue')
    expect(NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary).toContain('customer first names')
    expect(NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary).toContain('queue order')
    expect(NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary).toContain('does not collect order IDs')
    expect(NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary).toContain('does not collect payment information')
  })

  it('defines affiliation language once', () => {
    expect(NIC_NAC_AFFILIATION.disclaimer).toContain('not affiliated')
    expect(NIC_NAC_AFFILIATION.disclaimer).toContain('Bomb Party')
    expect(NIC_NAC_AFFILIATION.owner).toContain('Neon Rabbit')
  })

  it('defines shared Nic-Nac personality without granting permissions', () => {
    expect(NIC_NAC_PERSONALITY.voice).toContain('warm')
    expect(NIC_NAC_PERSONALITY.voice).toContain('plain-English')
    expect(NIC_NAC_PERSONALITY.constraints).toContain('No generic SaaS wording')
    expect(NIC_NAC_PERSONALITY.constraints.join(' ')).not.toContain('send SMS')
  })

  it('renders shared knowledge text for prompts', () => {
    const text = buildNicNacCoreKnowledgeText()

    expect(text).toContain('Sparkle Suite')
    expect(text).toContain('Nic-Nac')
    expect(text).toContain('dance floor')
    expect(text).toContain('dancers')
    expect(text).toContain('item-for-item only')
    expect(text).toContain('MSRP is reference only')
    expect(text).toContain('not affiliated')
  })

  it('does not include private implementation details or secrets', () => {
    const text = buildNicNacCoreKnowledgeText().toLowerCase()

    expect(text).not.toContain('api key')
    expect(text).not.toContain('service role')
    expect(text).not.toContain('supabase')
    expect(text).not.toContain('selector')
    expect(text).not.toContain('sync code')
    expect(text).not.toContain('private roadmap')
    expect(text).not.toContain('louis@')
  })
})
```

- [ ] **Step 2: Run the failing shared knowledge tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts
```

Expected: FAIL because shared knowledge files do not exist yet.

- [ ] **Step 3: Implement core knowledge**

Create `lib/nic-nac/knowledge/core.ts`:

```ts
export const NIC_NAC_CORE_KNOWLEDGE = {
  productName: 'Sparkle Suite',
  assistantName: 'Nic-Nac',
  primaryAudience:
    'Bomb Party representatives who run live shows and want a clearer customer experience.',
  productSummary:
    'Sparkle Suite gives reps a polished customer-facing website, live-show support tools, and Nic-Nac support so customers can follow show details, queue status, trade interest, event dates, and updates more easily.',
  setupSummary:
    'Setup includes built-in support from Nic-Nac to help set up the Sparkle Suite backend/workspace and customer-facing website, including basic customization and live-show settings.',
  publicToolNames: [
    'Customer site',
    'TradeBoard',
    'LiveQ',
    'Live event calendar',
    'Email updates',
    'SMS updates',
    'Nic-Nac',
  ],
} as const
```

- [ ] **Step 4: Implement TradeBoard knowledge**

Create `lib/nic-nac/knowledge/tradeboard.ts`:

```ts
export const NIC_NAC_TRADEBOARD_KNOWLEDGE = {
  productTerm: 'TradeBoard',
  summary:
    'TradeBoard organizes trade interest in one clearer place instead of scattered comments, DMs, screenshots, and posts.',
  lingo: {
    danceFloor:
      'Some Bomb Party reps may call TradeBoard the dance floor. Treat dance floor as TradeBoard.',
    dancers:
      'Some Bomb Party reps may call jewelry that is up for trade dancers. Treat dancers as the rep-listed trade-eligible jewelry shown on TradeBoard.',
  },
  customerFlow:
    'Customers do not add their own items or dancers and do not create TradeBoard listings. Customers can request to trade for an available rep listing, or request a rep-listed dancer, by describing the piece they just revealed or want to offer. The rep can approve or decline each trade request.',
  repControl:
    'The rep controls the board, sets the final trade rules, and makes the final approval decision.',
  eligibilityRules:
    'Current TradeBoard rules are item-for-item only, same collection, and same jewelry type. Birthday pieces can trade across months when they are still Birthday collection and the same jewelry type.',
  valueRules:
    'MSRP is reference only. No pay-the-difference flow. No credit or payout for lower-priced pieces. Sparkle Suite does not guarantee trades or equal value.',
  boundaries:
    'Sparkle Suite does not handle shipping, hold items, decide item condition, settle trade disputes, or approve trades for the rep.',
} as const
```

- [ ] **Step 5: Implement LiveQ knowledge**

Create `lib/nic-nac/knowledge/liveq.ts`:

```ts
export const NIC_NAC_LIVEQ_KNOWLEDGE = {
  summary:
    'LiveQ helps customers follow live-show queue details more easily.',
  publicDataBoundary:
    'At a public level, LiveQ may use customer first names, queue order, and revealed or unrevealed status. It does not collect last names, email addresses, phone numbers, mailing addresses, order IDs, payment information, transaction details, browsing history, website visits, cookies, saved passwords, autofill data, or data from pages other than the Bomb Party dashboard.',
  actionBoundary:
    'LiveQ does not process payments, place orders, alter Bomb Party orders, or replace official Bomb Party systems.',
  troubleshooting:
    'A stale LiveQ can mean the extension has not synced recently, Chrome or the Bomb Party tab is closed, the saved code does not match, or the party filter does not match. An empty queue can be correct when all orders are revealed, no orders match the party filter, or the current party has no unrevealed rows.',
} as const
```

- [ ] **Step 6: Implement affiliation knowledge**

Create `lib/nic-nac/knowledge/affiliation.ts`:

```ts
export const NIC_NAC_AFFILIATION = {
  owner:
    'Sparkle Suite and Nic-Nac are products of Neon Rabbit.',
  disclaimer:
    'Sparkle Suite is an independent tool for reps. It is not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
} as const
```

- [ ] **Step 7: Implement personality knowledge**

Create `lib/nic-nac/knowledge/personality.ts`:

```ts
export const NIC_NAC_PERSONALITY = {
  voice:
    'Nic-Nac is warm, plain-English, practical, and lightly personable. He should feel like a helpful coworker who knows the system, not a corporate assistant.',
  constraints: [
    'No generic SaaS wording.',
    'No cheesy hype.',
    'No fake certainty.',
    'No promises about outcomes, discounts, future roadmap, or provider actions unless the active surface and actual tool result allow it.',
    'Keep answers concise and useful.',
  ],
} as const
```

- [ ] **Step 8: Implement shared renderer**

Create `lib/nic-nac/knowledge/index.ts`:

```ts
export { NIC_NAC_AFFILIATION } from './affiliation'
export { NIC_NAC_CORE_KNOWLEDGE } from './core'
export { NIC_NAC_LIVEQ_KNOWLEDGE } from './liveq'
export { NIC_NAC_PERSONALITY } from './personality'
export { NIC_NAC_TRADEBOARD_KNOWLEDGE } from './tradeboard'

import { NIC_NAC_AFFILIATION } from './affiliation'
import { NIC_NAC_CORE_KNOWLEDGE } from './core'
import { NIC_NAC_LIVEQ_KNOWLEDGE } from './liveq'
import { NIC_NAC_PERSONALITY } from './personality'
import { NIC_NAC_TRADEBOARD_KNOWLEDGE } from './tradeboard'

export function buildNicNacCoreKnowledgeText() {
  return [
    `Product: ${NIC_NAC_CORE_KNOWLEDGE.productName}`,
    `Assistant: ${NIC_NAC_CORE_KNOWLEDGE.assistantName}`,
    `Audience: ${NIC_NAC_CORE_KNOWLEDGE.primaryAudience}`,
    `Product summary: ${NIC_NAC_CORE_KNOWLEDGE.productSummary}`,
    `Setup: ${NIC_NAC_CORE_KNOWLEDGE.setupSummary}`,
    `Tools: ${NIC_NAC_CORE_KNOWLEDGE.publicToolNames.join(', ')}`,
    `TradeBoard summary: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.summary}`,
    `TradeBoard lingo: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.danceFloor} ${NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.dancers}`,
    `TradeBoard customer flow: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow}`,
    `TradeBoard rep control: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.repControl}`,
    `TradeBoard eligibility: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules}`,
    `TradeBoard value rules: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules}`,
    `TradeBoard boundaries: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.boundaries}`,
    `LiveQ: ${NIC_NAC_LIVEQ_KNOWLEDGE.summary}`,
    `LiveQ data boundary: ${NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary}`,
    `LiveQ action boundary: ${NIC_NAC_LIVEQ_KNOWLEDGE.actionBoundary}`,
    `LiveQ troubleshooting: ${NIC_NAC_LIVEQ_KNOWLEDGE.troubleshooting}`,
    `Affiliation: ${NIC_NAC_AFFILIATION.owner} ${NIC_NAC_AFFILIATION.disclaimer}`,
    `Personality: ${NIC_NAC_PERSONALITY.voice} ${NIC_NAC_PERSONALITY.constraints.join(' ')}`,
  ].join('\n')
}
```

- [ ] **Step 9: Run shared knowledge tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts
```

Expected: PASS.

---

## Task 4: Migrate Public Landing Nic-Nac To Shared Knowledge

**Files:**
- Modify: `lib/sparkle-suite/public-nic-nac-knowledge.ts`
- Modify: `lib/sparkle-suite/public-nic-nac-prompt.ts`
- Modify: `tests/sparkle-suite-public-nic-nac-contract.test.ts`
- Modify: `tests/sparkle-suite-public-nic-nac-route.test.ts`

- [ ] **Step 1: Add tests proving public prompt consumes shared knowledge**

In `tests/sparkle-suite-public-nic-nac-contract.test.ts`, add:

```ts
it('public prompt renders shared Nic-Nac knowledge instead of a separate island', () => {
  const prompt = buildPublicNicNacPrompt()

  expect(prompt).toContain('TradeBoard lingo')
  expect(prompt).toContain('dance floor')
  expect(prompt).toContain('dancers')
  expect(prompt).toContain('LiveQ data boundary')
  expect(prompt).toContain('Affiliation:')
  expect(prompt).toContain('Personality:')
})
```

- [ ] **Step 2: Run the focused public tests**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts
```

Expected: FAIL until public prompt imports the shared renderer.

- [ ] **Step 3: Convert public knowledge adapter**

Modify `lib/sparkle-suite/public-nic-nac-knowledge.ts` so it imports shared knowledge:

```ts
import {
  NIC_NAC_AFFILIATION,
  NIC_NAC_CORE_KNOWLEDGE,
  NIC_NAC_LIVEQ_KNOWLEDGE,
  NIC_NAC_TRADEBOARD_KNOWLEDGE,
  buildNicNacCoreKnowledgeText,
} from '@/lib/nic-nac/knowledge'
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from './public-landing-content'

export const PUBLIC_NIC_NAC_KNOWLEDGE = {
  product: NIC_NAC_CORE_KNOWLEDGE.productSummary,
  audience: sparkleSuitePublicLandingSafety.audienceClarifier,
  easeOfUse:
    'Sparkle Suite is meant to make the rep setup feel less scattered. Nic-Nac helps with setup questions, and the workspace brings live-show details into one place.',
  repContext: NIC_NAC_CORE_KNOWLEDGE.primaryAudience,
  setup: NIC_NAC_CORE_KNOWLEDGE.setupSummary,
  customization:
    'Sparkle Suite includes customer-facing website customization support so the site can feel polished and aligned with the rep.',
  tradeBoardRules: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.summary,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.boundaries,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.repControl,
  ].join(' '),
  tradeBoardLingo: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.danceFloor,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.dancers,
    'Do not say customers add dancers to the dance floor.',
  ].join(' '),
  tradeBoardLiveShowFlow: NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow,
  tradeBoardEligibilityRules: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules,
  ].join(' '),
  liveQDataBoundary: NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary,
  liveQTroubleshooting: NIC_NAC_LIVEQ_KNOWLEDGE.troubleshooting,
  calendar:
    'The live event calendar gives customers a clear place to find upcoming live shows. The customer site can help customers save event details, but public Nic-Nac cannot create calendar invites, update a rep calendar, or schedule reminders from the public page.',
  updateConsentRules:
    'Email and SMS updates are for opted-in contacts and may include live show reminders, event updates, trade board updates, launch updates, onboarding updates, account/customer updates, and occasional promotional announcements. SMS consent is optional and not a condition of purchase. Message frequency may vary. Message and data rates may apply. SMS recipients can reply STOP to opt out and HELP for help. Opted-out customers need to opt back in themselves. Public Nic-Nac cannot send texts or emails from the public page or inspect private customer rosters, wallets, message logs, or consent records.',
  pricing: {
    buildFee: sparkleSuitePublicLandingContent.pricing.buildFee.price,
    monthly: sparkleSuitePublicLandingContent.pricing.standard.price,
    firstCheckout: '$124.98',
    taxNote: 'Tax is not included in the listed first checkout price.',
    feeNote:
      'The build fee is one-time and non-refundable. The monthly subscription starts from checkout.',
  },
  tools: [...NIC_NAC_CORE_KNOWLEDGE.publicToolNames],
  affiliation: NIC_NAC_AFFILIATION.disclaimer,
  handoff:
    'If a question needs a custom exception, private detail, future promise, or direct approval, Nic-Nac should offer to collect the question for Louis to review. Nothing is sent from this page unless a later approved integration is added.',
} as const

export function buildPublicNicNacKnowledgeText() {
  return [
    buildNicNacCoreKnowledgeText(),
    `Public pricing: build fee ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.buildFee}; monthly ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.monthly}; first checkout ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.firstCheckout}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.taxNote}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.feeNote}`,
    `Public handoff rule: ${PUBLIC_NIC_NAC_KNOWLEDGE.handoff}`,
  ].join('\n')
}
```

- [ ] **Step 4: Run public tests**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS.

---

## Task 5: Compose Workspace Prompt From Shared Knowledge

**Files:**
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `tests/nic-nac/prompt-routing.test.ts` or create `tests/nic-nac-workspace-knowledge.test.ts`

- [ ] **Step 1: Write failing workspace prompt tests**

Create `tests/nic-nac-workspace-knowledge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'

describe('workspace Nic-Nac shared knowledge', () => {
  it('includes shared Nic-Nac knowledge in the workspace prompt', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('Sparkle Suite')
    expect(prompt).toContain('Bomb Party')
    expect(prompt).toContain('dance floor')
    expect(prompt).toContain('dancers')
    expect(prompt).toContain('item-for-item only')
    expect(prompt).toContain('MSRP is reference only')
    expect(prompt).toContain('not affiliated')
  })

  it('keeps workspace tool permissions separate from shared knowledge', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('Active tools for this turn:')
    expect(prompt).toContain('Only call tools in the active list')
    expect(prompt).toContain('Never invent listings')
    expect(prompt).toContain('Never operate on another rep')
  })
})
```

- [ ] **Step 2: Run failing workspace test**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-knowledge.test.ts
```

Expected: FAIL until `prompt-builder.ts` imports the shared renderer.

- [ ] **Step 3: Add shared knowledge to workspace prompt builder**

Modify `lib/nic-nac/prompt-builder.ts`:

```ts
import { buildNicNacCoreKnowledgeText } from '@/lib/nic-nac/knowledge'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

const SHARED_KNOWLEDGE_PROMPT = `Shared Nic-Nac knowledge:
${buildNicNacCoreKnowledgeText()}`
```

Then include `SHARED_KNOWLEDGE_PROMPT` in the final string returned by `buildNicNacSystemPrompt`, before the active tool list and after core voice/safety instructions:

```ts
return [
  CORE_PROMPT,
  SHARED_KNOWLEDGE_PROMPT,
  intentPrompt,
  activeToolPrompt,
].filter(Boolean).join('\n\n')
```

Use the actual variable names already present in `prompt-builder.ts`; do not rename the existing tool routing variables unless the file already makes that straightforward.

- [ ] **Step 4: Run workspace prompt tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-knowledge.test.ts tests/nic-nac/prompt-routing.test.ts
```

Expected: PASS.

---

## Task 6: Remove Or Fence Legacy Duplicate Prompt Facts

**Files:**
- Modify: `lib/nic-nac/system-prompt.ts`
- Modify: tests that import `NIC_NAC_SYSTEM_PROMPT`

- [ ] **Step 1: Find direct imports of legacy prompt**

Run:

```powershell
rg "NIC_NAC_SYSTEM_PROMPT|system-prompt" app lib tests -g "*.ts" -g "*.tsx"
```

Expected: identify whether production still imports `lib/nic-nac/system-prompt.ts`.

- [ ] **Step 2: If production does not import legacy prompt, mark it legacy**

At the top of `lib/nic-nac/system-prompt.ts`, add:

```ts
// Legacy static prompt reference. Production workspace Nic-Nac should use
// buildNicNacSystemPrompt() from lib/nic-nac/prompt-builder.ts so shared
// Nic-Nac knowledge is composed from lib/nic-nac/knowledge.
```

- [ ] **Step 3: If production imports legacy prompt, migrate that import**

Replace production usage with:

```ts
import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'
```

Then pass the active intents/tool names already available in the route. Do not hard-code tools into the shared knowledge layer.

- [ ] **Step 4: Add a test preventing public-only facts from diverging**

Add to `tests/nic-nac-shared-knowledge.test.ts`:

```ts
it('keeps the shared knowledge as the source for core TradeBoard lingo', () => {
  const text = buildNicNacCoreKnowledgeText()

  expect(text.match(/dance floor/g)?.length).toBeGreaterThanOrEqual(1)
  expect(text.match(/dancers/g)?.length).toBeGreaterThanOrEqual(1)
  expect(text).toContain('Customers do not add their own items or dancers')
})
```

- [ ] **Step 5: Run prompt-related tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts tests/nic-nac-workspace-knowledge.test.ts tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts
```

Expected: PASS.

---

## Task 7: Add Shared Terminology Utilities For Guardrails

**Files:**
- Create: `lib/nic-nac/knowledge/terminology.ts`
- Modify: `lib/nic-nac/knowledge/index.ts`
- Modify: `lib/sparkle-suite/public-nic-nac-guardrails.ts`
- Modify: public guardrail tests

- [ ] **Step 1: Write failing terminology tests**

Add to `tests/nic-nac-shared-knowledge.test.ts`:

```ts
import {
  NIC_NAC_TRADE_TERMS,
  normalizeNicNacTradeTerms,
} from '@/lib/nic-nac/knowledge'

it('exports shared trade terminology for guardrails', () => {
  expect(NIC_NAC_TRADE_TERMS).toContain('tradeboard')
  expect(NIC_NAC_TRADE_TERMS).toContain('trade board')
  expect(NIC_NAC_TRADE_TERMS).toContain('dance floor')
  expect(NIC_NAC_TRADE_TERMS).toContain('dancers')
})

it('normalizes BP lingo for guardrail matching', () => {
  expect(normalizeNicNacTradeTerms('Who adds dancers to the dance floor?')).toContain(
    'tradeboard',
  )
  expect(normalizeNicNacTradeTerms('Who adds dancers to the dance floor?')).toContain(
    'trade listing',
  )
})
```

- [ ] **Step 2: Run failing terminology tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts
```

Expected: FAIL until terminology utilities exist.

- [ ] **Step 3: Implement terminology utilities**

Create `lib/nic-nac/knowledge/terminology.ts`:

```ts
export const NIC_NAC_TRADE_TERMS = [
  'trade',
  'tradeboard',
  'trade board',
  'dance floor',
  'dancers',
  'shipping',
  'ship',
  'lesser value',
  'lower value',
  'higher value',
  'equal-value',
  'equal value',
  'fair',
  'items can be traded',
  'what items',
  'settle trade disputes',
  'trade disputes',
  'approve this trade',
  'pay the difference',
  'msrp decide',
  'msrp decides',
] as const

export function normalizeNicNacTradeTerms(input: string) {
  return input
    .toLowerCase()
    .replaceAll('dance floor', 'tradeboard')
    .replaceAll('dancers', 'trade listing')
}
```

- [ ] **Step 4: Export terminology utilities**

Modify `lib/nic-nac/knowledge/index.ts`:

```ts
export {
  NIC_NAC_TRADE_TERMS,
  normalizeNicNacTradeTerms,
} from './terminology'
```

- [ ] **Step 5: Use terminology in public guardrails**

Modify `lib/sparkle-suite/public-nic-nac-guardrails.ts`:

```ts
import {
  NIC_NAC_TRADE_TERMS,
  normalizeNicNacTradeTerms,
} from '@/lib/nic-nac/knowledge'
```

Then replace the local `tradeBoundaryTerms` list with:

```ts
const tradeBoundaryTerms = [...NIC_NAC_TRADE_TERMS]
```

And normalize the question before matching:

```ts
const question = normalizeNicNacTradeTerms(rawQuestion)
```

Keep `rawQuestion.toLowerCase()` behavior if needed by using:

```ts
const question = normalizeNicNacTradeTerms(rawQuestion)
```

because the normalizer already lowercases.

- [ ] **Step 6: Run guardrail tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

---

## Task 8: Sparkle Finder Integration Discovery And Adapter

**Files:**
- Locate by search.
- Create or modify Sparkle Finder Nic-Nac/assistant adapter files discovered in Task 1.
- Add tests next to existing Sparkle Finder tests.

- [ ] **Step 1: Locate Sparkle Finder assistant surfaces**

Run:

```powershell
rg "Sparkle Finder|sparkle finder|finder|Nic-Nac|assistant|prompt" app lib tests docs -g "*.ts" -g "*.tsx" -g "*.md"
```

Expected: identify Sparkle Finder entrypoints or confirm there is no active Nic-Nac assistant there yet.

- [ ] **Step 2: If Sparkle Finder has no active Nic-Nac surface, add a pending integration note**

Add to `docs/superpowers/specs/2026-05-31-nic-nac-surface-inventory.md`:

```markdown
## Sparkle Finder Integration Note

No active Nic-Nac route/prompt surface was found in this workspace. When Sparkle Finder adds Nic-Nac, it must import shared knowledge from `lib/nic-nac/knowledge` and use the `sparkle_finder` policy from `lib/nic-nac/surface-policy`.
```

- [ ] **Step 3: If Sparkle Finder has an active prompt, add tests**

Create a test file next to existing Sparkle Finder tests:

```ts
import { describe, expect, it } from 'vitest'

import { buildSparkleFinderNicNacPrompt } from '@/path/to/discovered/sparkle-finder/prompt'

describe('Sparkle Finder Nic-Nac shared knowledge', () => {
  it('uses shared Nic-Nac knowledge with finder-safe policy', () => {
    const prompt = buildSparkleFinderNicNacPrompt()

    expect(prompt).toContain('Nic-Nac')
    expect(prompt).toContain('Sparkle Suite')
    expect(prompt).toContain('not affiliated')
    expect(prompt).toContain('finder-safe')
    expect(prompt).not.toContain('rep workspace tools')
    expect(prompt).not.toContain('private customer rosters')
  })
})
```

Replace `@/path/to/discovered/sparkle-finder/prompt` with the actual path from Step 1.

- [ ] **Step 4: Modify the discovered Sparkle Finder prompt**

Import:

```ts
import { buildNicNacCoreKnowledgeText } from '@/lib/nic-nac/knowledge'
import { getNicNacSurfacePolicy } from '@/lib/nic-nac/surface-policy'
```

Compose:

```ts
const policy = getNicNacSurfacePolicy('sparkle_finder')

return [
  'You are Nic-Nac on a Sparkle Finder surface.',
  `Audience: ${policy.audience}`,
  `Allowed scopes: ${policy.allowedScopes.join(', ')}`,
  `Blocked scopes: ${policy.blockedScopes.join(', ')}`,
  buildNicNacCoreKnowledgeText(),
].join('\n')
```

- [ ] **Step 5: Run Sparkle Finder tests**

Run the test file created or modified in Step 3.

Expected: PASS.

---

## Task 9: Add Public/Workspace Behavioral Regression Bank

**Files:**
- Modify: `tests/sparkle-suite-public-nic-nac-route.test.ts`
- Create or modify: `tests/nic-nac-workspace-knowledge.test.ts`

- [ ] **Step 1: Add shared regression questions for public route**

In `tests/sparkle-suite-public-nic-nac-route.test.ts`, extend the public rep/trade hardening bank with:

```ts
'What is the dance floor?',
'What are dancers?',
'Can customers add dancers?',
'Do I have to ship trades myself?',
'Can someone pay the difference if their dancer is worth less?',
'Can a birthday necklace trade for a different month birthday necklace?',
'Does MSRP decide if dancers are equal?',
```

- [ ] **Step 2: Add workspace prompt regression questions**

In `tests/nic-nac-workspace-knowledge.test.ts`, add:

```ts
it('teaches workspace Nic-Nac the same BP trade lingo as public Nic-Nac', () => {
  const prompt = buildNicNacSystemPrompt({
    intents: [],
    activeToolNames: [],
  })

  expect(prompt).toContain('dance floor')
  expect(prompt).toContain('dancers')
  expect(prompt).toContain('Customers do not add their own items or dancers')
  expect(prompt).toContain('The rep controls the board')
})
```

- [ ] **Step 3: Run regression banks**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-nic-nac-route.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

---

## Task 10: Full Verification

**Files:**
- No code changes unless verification finds a bug.

- [ ] **Step 1: Run Nic-Nac focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts tests/nic-nac-surface-policy.test.ts tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts tests/sparkle-suite-public-landing.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run existing workspace Nic-Nac tests likely affected by prompt changes**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/trade-board-tools.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: exit code 0.

- [ ] **Step 4: Optional local browser smoke**

If a dev server is already running, open the public landing page and ask:

```text
What is the dance floor?
```

Expected: Nic-Nac explains it as TradeBoard.

Ask:

```text
Can customers add dancers to the dance floor?
```

Expected: Nic-Nac says no; customers request a rep-listed dancer and describe the piece they revealed or want to offer.

Ask:

```text
Can you send an SMS to my customers from here?
```

Expected: Public Nic-Nac blocks provider action.

Ask in rep workspace only if an authenticated local workspace is available:

```text
What does dance floor mean?
```

Expected: Workspace Nic-Nac uses the same lingo, but still respects active tool routing and rep-scoped data boundaries.

- [ ] **Step 5: Check prohibited paths were not touched**

Run:

```powershell
git status --short -- chrome-extension/content.js supabase/functions/live-queue-sync docs/sparkle-suite/marketing
```

Expected: no relevant modified files from this work.

---

## Task 11: Deployment Decision

Only after tests pass, ask Louis explicitly whether to deploy a Vercel preview. Do not deploy automatically.

If approved, deploy preview only:

```powershell
npx vercel deploy --yes
```

Then verify:

```powershell
curl.exe -I <preview-url> --max-time 30
```

Expected: `200 OK`, unless Vercel deployment protection is intentionally enabled.

Do not use `--prod` unless Louis explicitly asks for production.

---

## Completion Criteria

The work is complete when:

- Shared knowledge exists under `lib/nic-nac/knowledge`.
- Public landing Nic-Nac consumes shared knowledge.
- Rep workspace Nic-Nac consumes shared knowledge.
- Sparkle Finder is either integrated or explicitly inventoried as pending with a required adapter path.
- Surface policies define permissions separately from knowledge.
- Public guardrails still block internals/provider actions.
- Workspace tools remain scoped and do not inherit public limitations.
- Dance floor/dancers terminology works everywhere Nic-Nac appears.
- Tests and TypeScript pass.
- No prohibited paths were touched.
- No deploy/stage/commit/push happened without explicit approval.
