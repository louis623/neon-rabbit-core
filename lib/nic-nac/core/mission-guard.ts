import type { UIMessage } from 'ai'

export type NicNacMissionScopeDecision =
  | { action: 'allow' }
  | {
      action: 'redirect'
      reason: NicNacMissionRedirectReason
      message: string
    }

export type NicNacMissionRedirectReason =
  | 'therapist'
  | 'grocery_list'
  | 'homework_or_content'
  | 'travel_planning'
  | 'medical_advice'
  | 'legal_or_financial_advice'
  | 'general_chatbot'

export const NIC_NAC_MISSION_REDIRECT_MESSAGE =
  "I can keep it light, but I'm here for Sparkle Suite, Sparkle Finder, Bomb Party, jewelry, live shows, social selling, rep business goals, streaming setup, and system help. For that outside-the-shop question, a general AI assistant is the better fit. What Sparkle work can I help with?"

const missionPatterns = [
  /\bsparkle\s*(suite|finder|lab)\b/,
  /\bnic[-\s]?nac\b/,
  /\bbomb party\b/,
  /\bbp\b/,
  /\b(rep|reps|collector|collectors|customer|customers)\b/,
  /\b(jewelry|jewellery|bling|ring|rings|earring|earrings|necklace|necklaces|bracelet|bracelets|collection|wishlist|dance floor|tradeboard|live queue|livequeue)\b/,
  /\b(live show|show setup|tiktok live|facebook live|instagram live|youtube live|streaming|obs|camera|microphone|lighting|multistream|multi-stream)\b/,
  /\b(social selling|business goal|business goals|business budget|sales goal|lead|leads|calendar|customer site|workspace|fulfillment|recipe|recipes)\b/,
]

const lightSmallTalkPatterns = [
  /^\s*(hey|hi|hello|howdy|good morning|good afternoon|good evening)\b/,
  /\bhow are you\b/,
  /\bjoke\b/,
  /\bvirgo\b/,
]

const redirectPatterns: Array<{
  reason: NicNacMissionRedirectReason
  patterns: RegExp[]
}> = [
  {
    reason: 'therapist',
    patterns: [
      /\b(be|act as|become)\s+(my\s+)?(therapist|psychiatrist|psychologist|counselor)\b/,
      /\btherapy session\b/,
    ],
  },
  {
    reason: 'grocery_list',
    patterns: [
      /\b(grocery|groceries)\s+(list|shopping list)\b/,
      /\b(make|build|write|create|plan)\b.{0,40}\b(grocery|groceries)\b/,
    ],
  },
  {
    reason: 'homework_or_content',
    patterns: [
      /\b(write|draft|do)\b.{0,40}\b(essay|homework|book report|term paper)\b/,
      /\b(solve|answer)\b.{0,40}\b(homework|math problem|worksheet)\b/,
    ],
  },
  {
    reason: 'travel_planning',
    patterns: [
      /\b(plan|build|make|create)\b.{0,40}\b(vacation|holiday|travel itinerary|trip itinerary)\b/,
    ],
  },
  {
    reason: 'medical_advice',
    patterns: [
      /\b(diagnose|identify)\b.{0,40}\b(rash|symptom|illness|disease|medical)\b/,
      /\bshould i take\b.{0,40}\b(medicine|medication|antibiotic)\b/,
    ],
  },
  {
    reason: 'legal_or_financial_advice',
    patterns: [
      /\b(write|draft|review)\b.{0,40}\b(legal contract|lawsuit|will|lease)\b/,
      /\b(tax return|investment advice|stock pick|crypto trade)\b/,
    ],
  },
  {
    reason: 'general_chatbot',
    patterns: [
      /\b(use you like chatgpt|be chatgpt|ignore sparkle suite)\b/,
    ],
  },
]

export function classifyNicNacMissionScopeForMessages(
  messages: UIMessage[],
): NicNacMissionScopeDecision {
  const latestText = [...messages]
    .reverse()
    .find((message) => message.role === 'user')
    ?.parts?.map((part) => {
      const maybeText = part as { type?: string; text?: string }
      return maybeText.type === 'text' ? maybeText.text ?? '' : ''
    })
    .join(' ')

  return classifyNicNacMissionScopeForText(latestText ?? '')
}

export function classifyNicNacMissionScopeForText(
  text: string,
): NicNacMissionScopeDecision {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return { action: 'allow' }
  }

  for (const redirect of redirectPatterns) {
    if (hasAny(normalized, redirect.patterns)) {
      return {
        action: 'redirect',
        reason: redirect.reason,
        message: NIC_NAC_MISSION_REDIRECT_MESSAGE,
      }
    }
  }

  if (hasAny(normalized, missionPatterns) || hasAny(normalized, lightSmallTalkPatterns)) {
    return { action: 'allow' }
  }

  return { action: 'allow' }
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}
