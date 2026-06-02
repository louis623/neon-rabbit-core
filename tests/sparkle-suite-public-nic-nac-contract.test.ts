import { describe, expect, it } from 'vitest'

import {
  parsePublicNicNacRequest,
  PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH,
} from '@/lib/sparkle-suite/public-nic-nac-contract'
import {
  PUBLIC_NIC_NAC_KNOWLEDGE,
  buildPublicNicNacKnowledgeText,
} from '@/lib/sparkle-suite/public-nic-nac-knowledge'
import {
  classifyPublicNicNacQuestion,
  sanitizePublicNicNacAnswer,
} from '@/lib/sparkle-suite/public-nic-nac-guardrails'
import { buildPublicNicNacPrompt } from '@/lib/sparkle-suite/public-nic-nac-prompt'

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

describe('public Nic-Nac knowledge pack', () => {
  it('contains approved public sales and support facts', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.pricing.firstCheckout).toBe('$124.98')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.pricing.monthly).toBe('$74.99/month')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.setup).toContain('built-in support from Nic-Nac')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tools).toContain('LiveQ')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tools).toContain('TradeBoard')
  })

  it('contains public Bomb Party rep workflow context', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('Bomb Party reps')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('live shows')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('customer groups')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('comments')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('DMs')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('queue')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.repContext).toContain('trade')
  })

  it('contains public TradeBoard facilitation rules and boundaries', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules).toContain(
      'TradeBoard organizes trade interest',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules).toContain(
      'Sparkle Suite does not handle shipping',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules).toContain(
      'The rep sets the final trade rules and approvals',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules).toContain(
      'Sparkle Suite does not guarantee trades',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules).toContain(
      'Sparkle Suite does not decide what items can be traded for what items',
    )
  })

  it('contains exact current TradeBoard eligibility rules for public buyer answers', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'item-for-item only',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'same collection',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'same jewelry type',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'No pay-the-difference',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'No credit or payout',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules).toContain(
      'MSRP is reference only',
    )
  })

  it('contains Bomb Party rep lingo for TradeBoard and trade jewelry', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo).toContain(
      'TradeBoard the dance floor',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo).toContain(
      'jewelry that is up for trade dancers',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo).toContain(
      'Treat dance floor as TradeBoard',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo).toContain(
      'rep-listed trade-eligible jewelry',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo).toContain(
      'Do not say customers add dancers',
    )
  })

  it('defines the live-show TradeBoard flow without customer-added listings', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow).toContain(
      "TradeBoard shows the rep's available trade listings",
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow).toContain(
      'Customers do not add their own items',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow).toContain(
      'request to trade for an available rep listing',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow).toContain(
      'describe the piece they just revealed',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow).toContain(
      'rep can approve or decline',
    )
  })

  it('contains LiveQ data boundaries without internal implementation details', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).toContain(
      'customer first names',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).toContain('queue order')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).toContain(
      'revealed or unrevealed status',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).toContain(
      'does not collect last names',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).toContain(
      'does not collect order IDs',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).not.toContain('selector')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary).not.toContain('sync key')
  })

  it('contains public email and SMS consent boundaries', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'opted-in',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'SMS consent is optional',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'not a condition of purchase',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'reply STOP',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'opt back in themselves',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules).toContain(
      'cannot send texts or emails from the public page',
    )
  })

  it('contains public signup-page form and next-step guidance', () => {
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.purpose).toContain(
      'creates the rep account first',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.purpose).toContain(
      'No card is needed on this step',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('name')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('business name')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('email')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('password')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('phone')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain(
      'primary live/social link',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.fields).toContain('shop link')
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.safety).toContain(
      'does not text or email customers',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.safety).toContain(
      'does not charge',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.nextSteps).toContain(
      'plan and terms',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.nextSteps).toContain(
      'Stripe checkout',
    )
    expect(PUBLIC_NIC_NAC_KNOWLEDGE.signupPage.nextSteps).toContain('Nic-Nac')
  })

  it('does not include private or implementation-only context', () => {
    const text = buildPublicNicNacKnowledgeText()

    expect(text).not.toContain('Supabase')
    expect(text).not.toContain('SignWell')
    expect(text).not.toContain('Stripe secret')
    expect(text).not.toContain('admin')
    expect(text).not.toContain('backroom')
    expect(text).not.toContain('roadmap')
    expect(text).not.toContain('configured trade rules later')
    expect(text).not.toContain('customers can add their own items')
    expect(text).not.toContain('customers add their own TradeBoard listings')
    expect(text).not.toContain('Sparkle Suite handles shipping')
    expect(text).not.toContain('MSRP decides')
    expect(text).not.toContain('sync key')
    expect(text).not.toContain('louis@')
    expect(text).not.toContain('346954')
  })
})

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
    'What is this form for?',
    'Why do you ask for my phone?',
    'Do I pay on this page?',
    'What happens after I create my account?',
    'Can it help with live shows?',
    "I'm a Bomb Party rep. How does Sparkle Suite help me?",
    'How are you going to facilitate trades?',
    'Do you handle shipping for trades?',
    'Do you know what items can be traded for what items?',
    'What if somebody wants to trade an item of lesser value?',
    'How does the dance floor work during a live show?',
    'Who adds dancers to the dance floor?',
    'Can customers request dancers from the dance floor?',
    'Who decides if a trade is fair?',
    'Can you guarantee equal-value trades?',
    'Will Sparkle Suite settle trade disputes?',
    'Can you approve this trade for me?',
    'Can a customer pay the difference?',
    'Does MSRP decide whether the trade is even?',
    'Does LiveQ collect order IDs or payment info?',
    'What happens if someone replies STOP?',
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
    'Can you send a text to my customers from here?',
    'Can you create a calendar invite from here?',
    'What is my sync code?',
  ])('blocks private, internal, or provider-action requests: %s', (question) => {
    expect(classifyPublicNicNacQuestion(question).kind).toBe('blocked')
  })
})

describe('public Nic-Nac prompt', () => {
  it('frames Nic-Nac as a public concierge with approved boundaries', () => {
    const prompt = buildPublicNicNacPrompt()

    expect(prompt).toContain('You are Nic-Nac')
    expect(prompt).toContain('public Sparkle Suite landing page')
    expect(prompt).toContain('warm, plain-English concierge')
    expect(prompt).toContain('Assume the visitor is a current or future Bomb Party rep')
    expect(prompt).toContain('Do not treat the visitor as one of the rep customers')
    expect(prompt).toContain('slightly empathic')
    expect(prompt).toContain('trusted business partner')
    expect(prompt).toContain('business goals')
    expect(prompt).toContain('Ask probing questions')
    expect(prompt).toContain('Do not lie, hallucinate, or make things up')
    expect(prompt).toContain('Use only the approved public facts below')
    expect(prompt).toContain('potential Bomb Party representatives')
    expect(prompt).toContain('Answer normal public TradeBoard mechanics questions directly')
    expect(prompt).toContain('Answer signup-page questions directly')
    expect(prompt).toContain('No card is needed on this step')
    expect(prompt).toContain('what happens after account creation')
    expect(prompt).toContain('dance floor means TradeBoard')
    expect(prompt).toContain('dancers means the rep-listed trade-eligible jewelry')
    expect(prompt).toContain('never say customers add dancers to the dance floor')
    expect(prompt).toContain('Do not promise discounts, exceptions, outcomes, or future roadmap')
    expect(prompt).toContain('Do not use Markdown formatting')
    expect(prompt).toContain('Keep answers short enough for a small pop-up')
  })

  it('includes approved public knowledge but no private implementation details', () => {
    const prompt = buildPublicNicNacPrompt()

    expect(prompt).toContain('Sparkle Suite backend/workspace')
    expect(prompt).toContain('customer-facing website')
    expect(prompt).toContain('Sparkle Suite does not handle shipping')
    expect(prompt).toContain('Customers do not add their own items')
    expect(prompt).toContain('Do not say customers add dancers to the dance floor')
    expect(prompt).toContain('Treat dance floor as TradeBoard')
    expect(prompt).toContain('item-for-item only')
    expect(prompt).toContain('same collection')
    expect(prompt).toContain('same jewelry type')
    expect(prompt).toContain('No pay-the-difference')
    expect(prompt).toContain('No credit or payout')
    expect(prompt).toContain('MSRP is reference only')
    expect(prompt).toContain('does not collect order IDs')
    expect(prompt).toContain('SMS consent is optional')
    expect(prompt).toContain('does not text or email customers')
    expect(prompt).toContain('Stripe checkout')
    expect(prompt).toContain('cannot send texts or emails from the public page')
    expect(prompt).toContain('The rep sets the final trade rules and approvals')
    expect(prompt).toContain('$74.99/month')
    expect(prompt).not.toContain('Supabase')
    expect(prompt).not.toContain('SignWell')
    expect(prompt).not.toContain('service role')
  })

  it('public prompt renders shared Nic-Nac knowledge instead of a separate island', () => {
    const prompt = buildPublicNicNacPrompt()

    expect(prompt).toContain('TradeBoard lingo')
    expect(prompt).toContain('dance floor')
    expect(prompt).toContain('dancers')
    expect(prompt).toContain('LiveQ data boundary')
    expect(prompt).toContain('Affiliation:')
    expect(prompt).toContain('Personality:')
  })
})

describe('public Nic-Nac postflight guardrails', () => {
  it('corrects model output that says customers add their own TradeBoard items', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'Customers can browse trade interest and add their own items in real time.',
    )

    expect(sanitized.kind).toBe('answer')
    expect(sanitized.message).toContain('Customers do not add their own items')
    expect(sanitized.message).toContain('request to trade for an available rep listing')
    expect(sanitized.message).toContain('piece they just revealed')
    expect(sanitized.message).not.toContain('add their own items in real time')
  })

  it('corrects model output that says customers create TradeBoard listings', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'Customers can create their own listings on the TradeBoard during a live show.',
    )

    expect(sanitized.kind).toBe('answer')
    expect(sanitized.message).toContain('Customers do not create TradeBoard listings')
    expect(sanitized.message).toContain('rep controls the board')
    expect(sanitized.message).not.toContain('create their own listings')
  })

  it('corrects model output that says customers add dancers to the dance floor', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'Customers can add dancers to the dance floor during the show.',
    )

    expect(sanitized.kind).toBe('answer')
    expect(sanitized.message).toContain('Customers do not add their own items or dancers')
    expect(sanitized.message).toContain('dance floor')
    expect(sanitized.message).toContain('rep-listed trade-eligible pieces')
    expect(sanitized.message).toContain('request a rep-listed dancer')
    expect(sanitized.message).not.toContain('Customers can add dancers')
  })

  it('corrects model output that says Sparkle Suite handles trade shipping', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'Sparkle Suite handles shipping after the trade is approved.',
    )

    expect(sanitized.kind).toBe('answer')
    expect(sanitized.message).toContain('Sparkle Suite does not handle shipping')
    expect(sanitized.message).toContain('rep handles')
    expect(sanitized.message).not.toContain('handles shipping after')
  })

  it('corrects model output that says MSRP decides equal-value trades', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'MSRP decides whether the trade is even and guarantees equal value.',
    )

    expect(sanitized.kind).toBe('answer')
    expect(sanitized.message).toContain('MSRP is reference only')
    expect(sanitized.message).toContain('does not guarantee equal value')
    expect(sanitized.message).not.toContain('MSRP decides')
  })

  it('corrects model output that claims public-page provider actions happened', () => {
    const sanitized = sanitizePublicNicNacAnswer(
      'I sent a text to your customers and created a calendar invite.',
    )

    expect(sanitized.kind).toBe('blocked')
    expect(sanitized.message).toContain('cannot')
    expect(sanitized.message).toContain('trigger outside-service actions')
    expect(sanitized.message).not.toContain('I sent a text')
  })
})
