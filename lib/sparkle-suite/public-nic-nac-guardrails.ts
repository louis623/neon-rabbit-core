import {
  NIC_NAC_TRADE_TERMS,
  normalizeNicNacTradeTerms,
} from '@/lib/nic-nac/knowledge'

export type PublicNicNacClassification =
  | { kind: 'public_safe' }
  | { kind: 'handoff'; reason: 'custom_exception' | 'needs_louis' }
  | { kind: 'blocked'; reason: 'private_or_internal' | 'provider_action' }

const providerActionTerms = [
  'trigger stripe',
  'trigger a stripe',
  'create checkout',
  'created checkout',
  'send email',
  'send an email',
  'email my customers',
  'email customers',
  'send sms',
  'send a text',
  'text my customers',
  'text customers',
  'text louis',
  'calendar invite',
  'create a calendar invite',
  'created a calendar invite',
  'signwell',
]

const privateTerms = [
  'admin',
  'backroom',
  'api key',
  'api keys',
  'secret',
  'private roadmap',
  'implementation detail',
  'database',
  'supabase',
  'source code',
  'internal',
  'sync code',
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

const tradeBoundaryTerms = [...NIC_NAC_TRADE_TERMS]

function hasAny(question: string, terms: string[]) {
  return terms.some((term) => question.includes(term))
}

export function classifyPublicNicNacQuestion(
  rawQuestion: string,
): PublicNicNacClassification {
  const question = normalizeNicNacTradeTerms(rawQuestion)

  if (hasAny(question, providerActionTerms)) {
    return { kind: 'blocked', reason: 'provider_action' }
  }

  if (hasAny(question, privateTerms)) {
    return { kind: 'blocked', reason: 'private_or_internal' }
  }

  if (hasAny(question, tradeBoundaryTerms)) {
    return { kind: 'public_safe' }
  }

  if (hasAny(question, customExceptionTerms)) {
    return { kind: 'handoff', reason: 'custom_exception' }
  }

  return { kind: 'public_safe' }
}

export function publicNicNacBlockedMessage() {
  return 'I can only answer public Sparkle Suite sales and setup questions here. I cannot share private workspace details, internal build notes, credentials, or trigger outside-service actions from this page.'
}

export function publicNicNacHandoffMessage() {
  return 'That sounds like something Louis should review directly. I can collect your name, email, and question here, but nothing is sent from this page yet.'
}

function publicNicNacTradeBoardCorrectionMessage() {
  return "Customers do not add their own dancers. Dancers are the rep-listed, trade-eligible jewelry already on the Dance Floor. A customer can request to trade for an available dancer when they do not want the item just revealed. The rep has both pieces during the live show, sets the final rules, and approves or declines each request. Customers do not ship or photograph a separate trade item."
}

function publicNicNacShippingCorrectionMessage() {
  return 'Sparkle Suite does not handle shipping, automate shipping, hold inventory, or vendor fulfillment for trades. Dance Floor organizes the request and lets the workspace track approved, shipped, and completed status, but the rep handles the actual exchange and follow-through.'
}

function publicNicNacValueCorrectionMessage() {
  return 'MSRP is reference only. Current Dance Floor rules are item-for-item only, same collection, and same jewelry type, with no pay-the-difference and no credit or payout. Sparkle Suite does not guarantee equal value; the rep makes the final approval decision.'
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
  const tradeBoardHallucinations = [
    'add their own items',
    'adds their own items',
    'add their own item',
    'create their own listings',
    'creates their own listings',
    'create a listing',
    'create listings',
    'customer-added',
    'customers add items',
    'customers add their items',
    'add dancers',
    'add their own dancers',
    'customers add dancers',
    'customers can add dancers',
    'create dancer listings',
    'customers create dancers',
  ]
  const shippingHallucinations = [
    'sparkle suite handles shipping',
    'handles shipping after',
    'handles trade shipping',
    'automates shipping',
    'takes care of the exchange',
    'takes care of shipping',
    'we ship the trade',
    'we handle shipping',
  ]
  const valueHallucinations = [
    'msrp decides',
    'msrp decide',
    'msrp determines',
    'guarantees equal value',
    'guarantees an equal value',
    'guaranteed equal value',
    'equal-value guarantee',
  ]
  const providerActionHallucinations = [
    'i sent a text',
    'i sent an sms',
    'i sent an email',
    'i texted',
    'i emailed',
    'created a calendar invite',
    'created checkout',
    'created a checkout',
    'contacted louis',
    'sent this to louis',
  ]

  if (forbiddenTerms.some((term) => lower.includes(term))) {
    return {
      kind: 'blocked' as const,
      message: publicNicNacBlockedMessage(),
    }
  }

  if (tradeBoardHallucinations.some((term) => lower.includes(term))) {
    return {
      kind: 'answer' as const,
      message: publicNicNacTradeBoardCorrectionMessage(),
    }
  }

  if (shippingHallucinations.some((term) => lower.includes(term))) {
    return {
      kind: 'answer' as const,
      message: publicNicNacShippingCorrectionMessage(),
    }
  }

  if (valueHallucinations.some((term) => lower.includes(term))) {
    return {
      kind: 'answer' as const,
      message: publicNicNacValueCorrectionMessage(),
    }
  }

  if (providerActionHallucinations.some((term) => lower.includes(term))) {
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
