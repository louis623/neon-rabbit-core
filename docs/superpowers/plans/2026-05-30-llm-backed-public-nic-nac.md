# LLM-Backed Public Nic-Nac Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brittle public Nic-Nac keyword helper on the Sparkle Suite landing page with an LLM-backed public concierge that can answer normal buyer questions with personality while staying inside approved public boundaries.

**Architecture:** Add a separate public Nic-Nac route that sends only approved public Sparkle Suite context to the model, with preflight and postflight guardrails around the LLM. Keep the landing-page pop-up UI, but route user questions through the public API and render structured answer/handoff/error states. Keep the existing deterministic helper only as a safe fallback and test fixture, not the main public brain.

**Tech Stack:** Next.js App Router route handlers, React client component, AI SDK v6, `@ai-sdk/anthropic`, Vitest, TypeScript, existing Sparkle Suite landing content.

**Hard Guardrails:**
- Do not deploy, push, stage, or commit without explicit Louis approval.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not touch `docs/sparkle-suite/marketing`.
- No live SMS/email/SignWell/Stripe/calendar/provider actions.
- The public route must not import paid Nic-Nac workspace context, Supabase customer data, private docs, admin routes, or backroom tooling.
- The public route may call the model only with approved public context.

---

## File Structure

**Create:**
- `lib/sparkle-suite/public-nic-nac-contract.ts`
  Request/response types, input limits, and `zod` schemas for the public route.
- `lib/sparkle-suite/public-nic-nac-knowledge.ts`
  Approved public knowledge pack: product summary, pricing facts, setup support, tool descriptions, affiliation disclaimer, voice rules, and hard no-go topics.
- `lib/sparkle-suite/public-nic-nac-guardrails.ts`
  Preflight classifier and postflight sanitizer for public-safe, handoff, and blocked questions.
- `lib/sparkle-suite/public-nic-nac-prompt.ts`
  Prompt builder that gives the LLM only approved public context and Nic-Nac’s public-facing voice.
- `app/api/public/nic-nac/route.ts`
  Landing-page-only LLM route.
- `tests/sparkle-suite-public-nic-nac-contract.test.ts`
  Schema and guardrail tests.
- `tests/sparkle-suite-public-nic-nac-route.test.ts`
  Route tests with mocked AI SDK output.

**Modify:**
- `app/_components/sparkle-suite-public-nic-nac.tsx`
  Replace local answer calls with API calls, loading/error states, and improved handoff handling.
- `lib/sparkle-suite/public-nic-nac-assistant.ts`
  Keep as deterministic fallback or remove from UI path once the API is wired.
- `tests/sparkle-suite-public-landing.test.ts`
  Update landing/UI expectations and keep “no Louis identifiers” coverage.
- `app/globals.css`
  Add small loading/error state styling only if needed.

---

## Task 1: Public Contract and Safety Taxonomy

**Files:**
- Create: `lib/sparkle-suite/public-nic-nac-contract.ts`
- Create: `tests/sparkle-suite-public-nic-nac-contract.test.ts`

- [ ] **Step 1: Write the failing contract tests**

Add `tests/sparkle-suite-public-nic-nac-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  parsePublicNicNacRequest,
  PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH,
} from '@/lib/sparkle-suite/public-nic-nac-contract'

describe('public Nic-Nac contract', () => {
  it('accepts a normal visitor question', () => {
    expect(parsePublicNicNacRequest({ question: 'Is Sparkle Suite easy to use?' })).toEqual({
      question: 'Is Sparkle Suite easy to use?',
    })
  })

  it('trims visitor questions', () => {
    expect(parsePublicNicNacRequest({ question: '  What is included?  ' })).toEqual({
      question: 'What is included?',
    })
  })

  it('rejects missing or empty questions', () => {
    expect(parsePublicNicNacRequest({})).toEqual(null)
    expect(parsePublicNicNacRequest({ question: '   ' })).toEqual(null)
  })

  it('rejects oversized questions', () => {
    expect(
      parsePublicNicNacRequest({
        question: 'x'.repeat(PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH + 1),
      }),
    ).toEqual(null)
  })
})
```

- [ ] **Step 2: Run the failing contract tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: FAIL because `public-nic-nac-contract.ts` does not exist.

- [ ] **Step 3: Implement the contract module**

Create `lib/sparkle-suite/public-nic-nac-contract.ts`:

```ts
import { z } from 'zod'

export const PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH = 600

export type PublicNicNacRequest = {
  question: string
}

export type PublicNicNacResponse =
  | {
      kind: 'answer'
      message: string
    }
  | {
      kind: 'handoff'
      message: string
      collectContact: true
    }
  | {
      kind: 'blocked'
      message: string
    }
  | {
      kind: 'error'
      message: string
    }

const publicNicNacRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1)
    .max(PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH),
})

export function parsePublicNicNacRequest(input: unknown): PublicNicNacRequest | null {
  const result = publicNicNacRequestSchema.safeParse(input)
  return result.success ? result.data : null
}
```

- [ ] **Step 4: Verify the contract tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

---

## Task 2: Public Knowledge Pack

**Files:**
- Create: `lib/sparkle-suite/public-nic-nac-knowledge.ts`
- Test: `tests/sparkle-suite-public-nic-nac-contract.test.ts`

- [ ] **Step 1: Add failing tests for approved public facts**

Append to `tests/sparkle-suite-public-nic-nac-contract.test.ts`:

```ts
import {
  PUBLIC_NIC_NAC_KNOWLEDGE,
  buildPublicNicNacKnowledgeText,
} from '@/lib/sparkle-suite/public-nic-nac-knowledge'

describe('public Nic-Nac knowledge pack', () => {
  it('contains approved public sales and support facts', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.pricing.firstCheckout).toBe('$124.98')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.pricing.monthly).toBe('$74.99/month')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.setup).toContain('built-in support from Nic-Nac')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tools).toContain('LiveQ')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tools).toContain('TradeBoard')
  })

  it('does not include private or implementation-only context', () => {
    const text = buildPublicNicNacKnowledgeText()

    expect(text).not.toContain('Supabase')
    expect(text).not.toContain('SignWell')
    expect(text).not.toContain('Stripe secret')
    expect(text).not.toContain('admin')
    expect(text).not.toContain('backroom')
    expect(text).not.toContain('roadmap')
    expect(text).not.toContain('louis@')
    expect(text).not.toContain('346954')
  })
})
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: FAIL because the knowledge module does not exist.

- [ ] **Step 3: Implement the public knowledge pack**

Create `lib/sparkle-suite/public-nic-nac-knowledge.ts`:

```ts
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from './public-landing-content'

export const PUBLIC_NIC_NAC_KNOWLEDGE = {
  product:
    'Sparkle Suite gives reps a polished customer-facing website, live-show support tools, and Nic-Nac support so the customer experience feels easier to follow.',
  audience:
    sparkleSuitePublicLandingSafety.audienceClarifier,
  easeOfUse:
    'Sparkle Suite is meant to make the rep setup feel less scattered. Nic-Nac helps with setup questions, and the workspace brings live-show details into one place.',
  setup:
    'Setup includes built-in support from Nic-Nac to help set up the Sparkle Suite backend/workspace and customer-facing website, including basic customization and live-show settings.',
  customization:
    'Sparkle Suite includes customer-facing website customization support so the site can feel polished and aligned with the rep.',
  pricing: {
    buildFee: sparkleSuitePublicLandingContent.pricing.buildFee.price,
    monthly: sparkleSuitePublicLandingContent.pricing.standard.price,
    firstCheckout: '$124.98',
    taxNote: 'Tax is not included in the listed first checkout price.',
    feeNote:
      'The build fee is one-time and non-refundable. The monthly subscription starts from checkout.',
  },
  tools: [
    'Customer site',
    'TradeBoard',
    'LiveQ',
    'Live event calendar',
    'Email updates',
    'SMS updates',
    'Nic-Nac',
  ],
  toolDetails: {
    liveq:
      'LiveQ helps customers follow live-show queue details more easily.',
    tradeboard:
      'TradeBoard helps make trade interest easier for customers to browse and follow.',
    calendar:
      'The live event calendar gives customers a clear place to find upcoming live shows.',
    updates:
      'Email and SMS updates help customers keep up with relevant show and site updates.',
    nicNac:
      'Nic-Nac is the Sparkle Suite assistant. On the public landing page, Nic-Nac answers sales and setup questions only.',
  },
  affiliation: sparkleSuitePublicLandingSafety.disclaimer,
  handoff:
    'If a question needs a custom exception, private detail, future promise, or direct approval, Nic-Nac should offer to collect the question for Louis to review. Nothing is sent from this page unless a later approved integration is added.',
} as const

export function buildPublicNicNacKnowledgeText() {
  return [
    `Product: ${PUBLIC_NIC_NAC_KNOWLEDGE.product}`,
    `Audience: ${PUBLIC_NIC_NAC_KNOWLEDGE.audience}`,
    `Ease of use: ${PUBLIC_NIC_NAC_KNOWLEDGE.easeOfUse}`,
    `Setup: ${PUBLIC_NIC_NAC_KNOWLEDGE.setup}`,
    `Customization: ${PUBLIC_NIC_NAC_KNOWLEDGE.customization}`,
    `Pricing: build fee ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.buildFee}; monthly ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.monthly}; first checkout ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.firstCheckout}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.taxNote}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.feeNote}`,
    `Included tools: ${PUBLIC_NIC_NAC_KNOWLEDGE.tools.join(', ')}`,
    `Tool details: ${Object.values(PUBLIC_NIC_NAC_KNOWLEDGE.toolDetails).join(' ')}`,
    `Affiliation: ${PUBLIC_NIC_NAC_KNOWLEDGE.affiliation}`,
    `Handoff rule: ${PUBLIC_NIC_NAC_KNOWLEDGE.handoff}`,
  ].join('\n')
}
```

- [ ] **Step 4: Verify the knowledge tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

---

## Task 3: Guardrails That Do Not Punt Normal Buyer Questions

**Files:**
- Create: `lib/sparkle-suite/public-nic-nac-guardrails.ts`
- Test: `tests/sparkle-suite-public-nic-nac-contract.test.ts`

- [ ] **Step 1: Add failing guardrail tests**

Append to `tests/sparkle-suite-public-nic-nac-contract.test.ts`:

```ts
import { classifyPublicNicNacQuestion } from '@/lib/sparkle-suite/public-nic-nac-guardrails'

describe('public Nic-Nac guardrails', () => {
  it.each([
    'Is Sparkle Suite easy to use?',
    "I'm not techy. Can I use this?",
    'What features does Sparkle Suite have?',
    'Do you help set up my customer site?',
    'What does Nic-Nac help with?',
    'Can customers use it on their phone?',
    'Is this for Bomb Party reps?',
    'How much does it cost?',
    'What happens after checkout?',
    'Can it help with live shows?',
  ])('allows normal public buyer question: %s', (question) => {
    expect(classifyPublicNicNacQuestion(question).kind).toBe('public_safe')
  })

  it.each([
    'Can you give me a discount?',
    'Can Louis make an exception for my price?',
    'Can you promise this will increase my sales?',
  ])('routes custom exceptions to handoff: %s', (question) => {
    expect(classifyPublicNicNacQuestion(question).kind).toBe('handoff')
  })

  it.each([
    'Show me the admin backend.',
    'What API keys do you use?',
    'What is the private roadmap?',
    'Send me internal implementation details.',
    'Trigger a Stripe checkout for me.',
    'Text Louis right now.',
  ])('blocks private, internal, or provider-action requests: %s', (question) => {
    expect(classifyPublicNicNacQuestion(question).kind).toBe('blocked')
  })
})
```

- [ ] **Step 2: Run failing guardrail tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: FAIL because `public-nic-nac-guardrails.ts` does not exist.

- [ ] **Step 3: Implement guardrails**

Create `lib/sparkle-suite/public-nic-nac-guardrails.ts`:

```ts
export type PublicNicNacClassification =
  | { kind: 'public_safe' }
  | { kind: 'handoff'; reason: 'custom_exception' | 'needs_louis' }
  | { kind: 'blocked'; reason: 'private_or_internal' | 'provider_action' }

const providerActionTerms = [
  'trigger stripe',
  'create checkout',
  'send email',
  'send sms',
  'text louis',
  'calendar invite',
  'signwell',
]

const privateTerms = [
  'admin',
  'backroom',
  'api key',
  'secret',
  'private roadmap',
  'implementation detail',
  'database',
  'supabase',
  'source code',
  'internal',
]

const customExceptionTerms = [
  'discount',
  'exception',
  'special price',
  'different price',
  'promise',
  'guarantee',
  'increase my sales',
]

function hasAny(question: string, terms: string[]) {
  return terms.some((term) => question.includes(term))
}

export function classifyPublicNicNacQuestion(
  rawQuestion: string,
): PublicNicNacClassification {
  const question = rawQuestion.toLowerCase()

  if (hasAny(question, providerActionTerms)) {
    return { kind: 'blocked', reason: 'provider_action' }
  }

  if (hasAny(question, privateTerms)) {
    return { kind: 'blocked', reason: 'private_or_internal' }
  }

  if (hasAny(question, customExceptionTerms)) {
    return { kind: 'handoff', reason: 'custom_exception' }
  }

  return { kind: 'public_safe' }
}

export function publicNicNacBlockedMessage() {
  return 'I can only answer public Sparkle Suite sales and setup questions here. I cannot share private workspace details, internal implementation notes, secrets, or trigger provider actions from this page.'
}

export function publicNicNacHandoffMessage() {
  return 'That sounds like something Louis should review directly. I can collect your name, email, and question here, but nothing is sent from this page yet.'
}

export function sanitizePublicNicNacAnswer(message: string) {
  const forbiddenTerms = [
    'supabase',
    'api key',
    'secret',
    'private roadmap',
    'implementation detail',
    'admin backroom',
    'louis@',
    '346954',
  ]
  const lower = message.toLowerCase()

  if (forbiddenTerms.some((term) => lower.includes(term))) {
    return {
      kind: 'blocked' as const,
      message: publicNicNacBlockedMessage(),
    }
  }

  return {
    kind: 'answer' as const,
    message: message.trim(),
  }
}
```

- [ ] **Step 4: Verify guardrail tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

---

## Task 4: Public Prompt Builder with Nic-Nac Personality

**Files:**
- Create: `lib/sparkle-suite/public-nic-nac-prompt.ts`
- Test: `tests/sparkle-suite-public-nic-nac-contract.test.ts`

- [ ] **Step 1: Add failing prompt tests**

Append to `tests/sparkle-suite-public-nic-nac-contract.test.ts`:

```ts
import { buildPublicNicNacPrompt } from '@/lib/sparkle-suite/public-nic-nac-prompt'

describe('public Nic-Nac prompt', () => {
  it('frames Nic-Nac as a public concierge with approved boundaries', () => {
    const prompt = buildPublicNicNacPrompt()

    expect(prompt).toContain('You are Nic-Nac')
    expect(prompt).toContain('public Sparkle Suite landing page')
    expect(prompt).toContain('warm, plain-English concierge')
    expect(prompt).toContain('Use only the approved public facts below')
    expect(prompt).toContain('Do not promise discounts, exceptions, outcomes, or future roadmap')
    expect(prompt).toContain('Keep answers short enough for a small pop-up')
  })

  it('includes approved public knowledge but no private implementation details', () => {
    const prompt = buildPublicNicNacPrompt()

    expect(prompt).toContain('Sparkle Suite backend/workspace')
    expect(prompt).toContain('customer-facing website')
    expect(prompt).toContain('$74.99/month')
    expect(prompt).not.toContain('Supabase')
    expect(prompt).not.toContain('SignWell')
    expect(prompt).not.toContain('service role')
  })
})
```

- [ ] **Step 2: Run failing prompt tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: FAIL because `public-nic-nac-prompt.ts` does not exist.

- [ ] **Step 3: Implement the prompt builder**

Create `lib/sparkle-suite/public-nic-nac-prompt.ts`:

```ts
import { buildPublicNicNacKnowledgeText } from './public-nic-nac-knowledge'

export function buildPublicNicNacPrompt() {
  return [
    'You are Nic-Nac, the public-facing Sparkle Suite assistant on the public Sparkle Suite landing page.',
    'Your job is to answer buyer questions as a warm, plain-English concierge.',
    'Use only the approved public facts below. Do not use private workspace knowledge, implementation details, customer data, internal plans, or non-public pricing exceptions.',
    'If a question asks for private/internal details, provider actions, discounts, exceptions, or future roadmap promises, do not answer it. Say that Louis should review it directly.',
    'Do not promise discounts, exceptions, outcomes, or future roadmap.',
    'Keep answers short enough for a small pop-up: usually 2-4 sentences.',
    'Use a little personality, but stay useful. No cheesy hype. No generic SaaS wording.',
    'If the visitor sounds unsure, reassure them and explain how Nic-Nac helps.',
    '',
    'Approved public facts:',
    buildPublicNicNacKnowledgeText(),
  ].join('\n')
}
```

- [ ] **Step 4: Verify prompt tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts
```

Expected: PASS.

---

## Task 5: LLM-Backed Public Route

**Files:**
- Create: `app/api/public/nic-nac/route.ts`
- Create: `tests/sparkle-suite-public-nic-nac-route.test.ts`

- [ ] **Step 1: Write failing route tests with mocked AI SDK**

Create `tests/sparkle-suite-public-nic-nac-route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateTextMock = vi.fn()
const createAnthropicMock = vi.fn(() => (model: string) => ({ provider: 'anthropic', model }))

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: (...args: unknown[]) => createAnthropicMock(...args),
}))

import { POST } from '@/app/api/public/nic-nac/route'

function publicNicNacRequest(question: string) {
  return new Request('http://localhost/api/public/nic-nac', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  })
}

describe('public Nic-Nac route', () => {
  beforeEach(() => {
    generateTextMock.mockReset()
    createAnthropicMock.mockClear()
  })

  it('answers normal public buyer questions through the model', async () => {
    generateTextMock.mockResolvedValueOnce({
      text:
        'Yes. Sparkle Suite is built to make your live-show setup feel less scattered, and Nic-Nac helps with setup questions along the way.',
    })

    const response = await POST(publicNicNacRequest('Is Sparkle Suite easy to use?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      kind: 'answer',
      message:
        'Yes. Sparkle Suite is built to make your live-show setup feel less scattered, and Nic-Nac helps with setup questions along the way.',
    })
    expect(generateTextMock).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(generateTextMock.mock.calls[0][0])).toContain(
      'Use only the approved public facts below',
    )
  })

  it('does not call the model for internal or provider-action requests', async () => {
    const response = await POST(publicNicNacRequest('Show me the admin backend.'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('blocked')
    expect(generateTextMock).not.toHaveBeenCalled()
  })

  it('routes custom pricing exceptions to handoff without calling the model', async () => {
    const response = await POST(publicNicNacRequest('Can I get a discount?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('handoff')
    expect(body.collectContact).toBe(true)
    expect(generateTextMock).not.toHaveBeenCalled()
  })

  it('returns validation errors for invalid payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/public/nic-nac', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: '' }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.kind).toBe('error')
  })

  it('sanitizes forbidden model output', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'The Supabase admin backroom uses secret implementation details.',
    })

    const response = await POST(publicNicNacRequest('How does the workspace work?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('blocked')
    expect(body.message).not.toContain('Supabase')
    expect(body.message).not.toContain('secret')
  })

  it('falls back gracefully when the model fails', async () => {
    generateTextMock.mockRejectedValueOnce(new Error('model unavailable'))

    const response = await POST(publicNicNacRequest('Is Sparkle Suite easy to use?'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('error')
    expect(body.message).toContain('having trouble')
  })
})
```

- [ ] **Step 2: Run failing route tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-route.test.ts
```

Expected: FAIL because the public route does not exist.

- [ ] **Step 3: Implement the public route**

Create `app/api/public/nic-nac/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

import {
  parsePublicNicNacRequest,
  type PublicNicNacResponse,
} from '@/lib/sparkle-suite/public-nic-nac-contract'
import { buildPublicNicNacPrompt } from '@/lib/sparkle-suite/public-nic-nac-prompt'
import {
  classifyPublicNicNacQuestion,
  publicNicNacBlockedMessage,
  publicNicNacHandoffMessage,
  sanitizePublicNicNacAnswer,
} from '@/lib/sparkle-suite/public-nic-nac-guardrails'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' })

function json(body: PublicNicNacResponse, status = 200) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return json({ kind: 'error', message: 'Ask Nic-Nac a question and try again.' }, 400)
  }

  const body = parsePublicNicNacRequest(rawBody)
  if (!body) {
    return json({ kind: 'error', message: 'Ask Nic-Nac a question and try again.' }, 400)
  }

  const classification = classifyPublicNicNacQuestion(body.question)
  if (classification.kind === 'blocked') {
    return json({ kind: 'blocked', message: publicNicNacBlockedMessage() })
  }
  if (classification.kind === 'handoff') {
    return json({
      kind: 'handoff',
      message: publicNicNacHandoffMessage(),
      collectContact: true,
    })
  }

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: buildPublicNicNacPrompt(),
      prompt: body.question,
      temperature: 0.4,
      maxOutputTokens: 220,
    })

    const sanitized = sanitizePublicNicNacAnswer(result.text)
    if (sanitized.kind === 'blocked') {
      return json({ kind: 'blocked', message: sanitized.message })
    }

    return json({ kind: 'answer', message: sanitized.message })
  } catch {
    return json({
      kind: 'error',
      message:
        "I'm having trouble answering right now. You can try again in a moment, or leave your question here for Louis to review.",
    })
  }
}
```

- [ ] **Step 4: Verify route tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-route.test.ts
```

Expected: PASS.

---

## Task 6: Route the Landing Pop-Up Through the Public API

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Modify: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add failing component-source tests**

Append expectations to `tests/sparkle-suite-public-landing.test.ts` in a new test:

```ts
it('routes public Nic-Nac questions through the landing-page API', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )

  expect(source).toContain("fetch('/api/public/nic-nac'")
  expect(source).not.toContain("answerPublicNicNacQuestion(trimmedQuestion)")
  expect(source).toContain('isLoading')
  expect(source).toContain('collectContact')
})
```

- [ ] **Step 2: Run failing landing tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: FAIL because the component still calls the deterministic helper directly.

- [ ] **Step 3: Update the client component to call the API**

Modify `app/_components/sparkle-suite-public-nic-nac.tsx`:

```tsx
'use client'

import { FormEvent, useState } from 'react'

import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import type { PublicNicNacResponse } from '@/lib/sparkle-suite/public-nic-nac-contract'

type NicNacMessage = {
  role: 'visitor' | 'assistant'
  text: string
}

type AskNicNacOptions = {
  echoQuestion?: boolean
  replaceThread?: boolean
}

export function SparkleSuitePublicNicNac() {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<NicNacMessage[]>([])
  const [showHandoff, setShowHandoff] = useState(false)
  const [handoffQuestion, setHandoffQuestion] = useState('')
  const [handoffSaved, setHandoffSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { publicNicNacAssistant } = sparkleSuitePublicLandingContent

  async function askNicNac(
    nextQuestion: string,
    { echoQuestion = true, replaceThread = false }: AskNicNacOptions = {},
  ) {
    const trimmedQuestion = nextQuestion.trim()

    if (!trimmedQuestion || isLoading) {
      return
    }

    const visitorMessage: NicNacMessage[] = echoQuestion
      ? [{ role: 'visitor', text: trimmedQuestion }]
      : []

    setMessages((currentMessages) => [
      ...(replaceThread ? [] : currentMessages),
      ...visitorMessage,
    ])
    setQuestion('')
    setHandoffSaved(false)
    setShowHandoff(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/public/nic-nac', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      })
      const answer = (await response.json()) as PublicNicNacResponse

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: answer.message },
      ])
      setShowHandoff(answer.kind === 'handoff' && answer.collectContact)
      setHandoffQuestion(
        answer.kind === 'handoff' && answer.collectContact ? trimmedQuestion : '',
      )
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          text:
            "I'm having trouble answering right now. You can try again in a moment, or leave your question here for Louis to review.",
        },
      ])
      setShowHandoff(true)
      setHandoffQuestion(trimmedQuestion)
    } finally {
      setIsLoading(false)
    }
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void askNicNac(question)
  }

  function handleHandoffSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHandoffSaved(true)
  }

  return (
    <aside className="sl2-nic-nac" aria-label="Public Nic-Nac assistant">
      <div className="sl2-nic-nac__teaser">
        <div>
          <strong>{publicNicNacAssistant.teaser}</strong>
          <p>{publicNicNacAssistant.body}</p>
        </div>
        <button
          aria-controls="sparkle-public-nic-nac-panel"
          aria-expanded={isOpen}
          className="sl2-nic-nac__button"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
        >
          {publicNicNacAssistant.buttonLabel}
        </button>
      </div>

      {isOpen ? (
        <div className="sl2-nic-nac-popover">
          <div
            aria-label="Ask Nic-Nac"
            className="sl2-nic-nac-panel"
            id="sparkle-public-nic-nac-panel"
            role="dialog"
          >
            <div className="sl2-nic-nac-panel__head">
              <div>
                <h3>{publicNicNacAssistant.panelTitle}</h3>
                <p>{publicNicNacAssistant.panelIntro}</p>
              </div>
              <button
                aria-label="Close Nic-Nac"
                className="sl2-nic-nac-panel__close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="sl2-nic-nac-starters" aria-label="Starter questions">
              {publicNicNacAssistant.starterQuestions.map((starterQuestion) => (
                <button
                  disabled={isLoading}
                  key={starterQuestion}
                  onClick={() =>
                    void askNicNac(starterQuestion, {
                      echoQuestion: false,
                      replaceThread: true,
                    })
                  }
                  type="button"
                >
                  {starterQuestion}
                </button>
              ))}
            </div>

            <div className="sl2-nic-nac-thread" aria-live="polite">
              {messages.length === 0 && !isLoading ? (
                <p className="sl2-nic-nac-empty">
                  Choose a starter question or ask your own.
                </p>
              ) : null}
              {messages.map((message, index) => (
                <p
                  className={`sl2-nic-nac-message sl2-nic-nac-message--${message.role}`}
                  key={`${message.role}-${index}-${message.text}`}
                >
                  {message.text}
                </p>
              ))}
              {isLoading ? (
                <p className="sl2-nic-nac-message sl2-nic-nac-message--assistant">
                  Nic-Nac is thinking through that.
                </p>
              ) : null}
            </div>

            <form className="sl2-nic-nac-form" onSubmit={handleQuestionSubmit}>
              <label htmlFor="sparkle-public-nic-nac-question">
                {publicNicNacAssistant.inputLabel}
              </label>
              <div>
                <input
                  disabled={isLoading}
                  id="sparkle-public-nic-nac-question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={publicNicNacAssistant.inputPlaceholder}
                  type="text"
                  value={question}
                />
                <button disabled={isLoading} type="submit">
                  {publicNicNacAssistant.submitLabel}
                </button>
              </div>
            </form>

            {showHandoff ? (
              <form className="sl2-nic-nac-handoff" onSubmit={handleHandoffSubmit}>
                <label>
                  {publicNicNacAssistant.handoffLabels.name}
                  <input autoComplete="name" name="name" type="text" />
                </label>
                <label>
                  {publicNicNacAssistant.handoffLabels.email}
                  <input autoComplete="email" name="email" type="email" />
                </label>
                <label>
                  {publicNicNacAssistant.handoffLabels.question}
                  <textarea
                    name="question"
                    onChange={(event) => setHandoffQuestion(event.target.value)}
                    rows={3}
                    value={handoffQuestion}
                  />
                </label>
                <button type="submit">{publicNicNacAssistant.handoffLabels.submit}</button>
                {handoffSaved ? (
                  <p role="status">{publicNicNacAssistant.handoffLabels.saved}</p>
                ) : null}
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
```

- [ ] **Step 4: Verify landing tests pass**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS.

---

## Task 7: Question Bank Regression Tests

**Files:**
- Modify: `tests/sparkle-suite-public-nic-nac-route.test.ts`

- [ ] **Step 1: Add a broad buyer-question regression table**

Append to `tests/sparkle-suite-public-nic-nac-route.test.ts`:

```ts
describe('public Nic-Nac buyer question regression bank', () => {
  it.each([
    'Is Sparkle Suite easy to use?',
    "I'm not techy. Can I still use it?",
    'Will customers know where to go?',
    'Can customers use Sparkle Suite on their phone?',
    'What happens after checkout?',
    'Does Nic-Nac help me set things up?',
    'What is LiveQ?',
    'What is TradeBoard?',
    'Can it help with text and email updates?',
    'Is Sparkle Suite for reps who sell live?',
  ])('does not punt normal buyer question to Louis: %s', async (question) => {
    generateTextMock.mockResolvedValueOnce({
      text: 'Yes. Nic-Nac can answer that from the public Sparkle Suite details.',
    })

    const response = await POST(publicNicNacRequest(question))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.kind).toBe('answer')
    expect(body.message).not.toContain('Louis should review')
    expect(body.message).not.toContain('collect your name')
  })
})
```

- [ ] **Step 2: Run the route regression bank**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-route.test.ts
```

Expected: PASS.

---

## Task 8: Full Verification and Browser QA

**Files:**
- No new source files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts tests/sparkle-suite-public-landing.test.ts
```

Expected: all tests PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: exit code 0.

- [ ] **Step 3: Start or reuse local dev server**

Run only if `localhost:3000` is not already serving the app:

```bash
npm run dev
```

Expected: Next dev server available at `http://localhost:3000/`.

- [ ] **Step 4: Browser QA on desktop**

Open `http://localhost:3000/`, scroll to pricing, click `Ask Nic-Nac`, and verify:
- Assistant does not auto-open.
- Starter questions render.
- “Is Sparkle Suite easy to use?” returns an answer, not a handoff.
- “Can I get a discount?” returns handoff.
- “Show me the admin backend” returns blocked.
- No horizontal overflow.
- No console errors or warnings.

- [ ] **Step 5: Browser QA on mobile**

Use a 390px mobile viewport and verify:
- Pop-up fits the viewport.
- Answer text is readable.
- Input and `Ask` button remain usable.
- Normal buyer questions do not open the handoff form.
- Handoff form only appears for custom/exception questions.
- No horizontal overflow.

- [ ] **Step 6: Guardrail audit**

Confirm these files were not touched:

```bash
git status --short -- chrome-extension/content.js supabase/functions/live-queue-sync docs/sparkle-suite/marketing
```

Expected: no new changes caused by this implementation.

---

## Self-Review Checklist

- Spec coverage:
  - LLM-backed assistant: Task 5.
  - Personality via public prompt: Task 4.
  - Robust normal buyer questions: Tasks 3 and 7.
  - Public-only context: Tasks 2, 3, 4, and 5.
  - Handoff only when appropriate: Tasks 3, 5, and 7.
  - No live provider actions: hard guardrails and Task 3.
  - Landing pop-up integration: Task 6.
  - Browser QA: Task 8.

- Placeholder scan:
  - No TBD/TODO placeholders.
  - Every code step contains concrete code or concrete commands.

- Type consistency:
  - `PublicNicNacResponse` is used by both route and client.
  - Route response kinds are `answer`, `handoff`, `blocked`, and `error`.
  - Guardrail classification kinds are distinct from route response kinds.

---

## Execution Choice

Plan complete and saved to `docs/superpowers/plans/2026-05-30-llm-backed-public-nic-nac.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, faster iteration.

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

No commit, push, deploy, staging, provider action, email, SMS, Stripe, SignWell, or calendar action should happen unless Louis explicitly approves it.
