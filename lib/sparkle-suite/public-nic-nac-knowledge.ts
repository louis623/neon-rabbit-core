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
  repContext: `${NIC_NAC_CORE_KNOWLEDGE.primaryAudience} Bomb Party reps often sell through live shows and customer groups, while customers ask questions in comments, DMs, posts, and messages about where to go, show schedules, queue status, trade interest, and updates.`,
  setup: NIC_NAC_CORE_KNOWLEDGE.setupSummary,
  customization:
    'Sparkle Suite includes customer-facing website customization support so the site can feel polished and aligned with the rep.',
  tradeBoardRules: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.summary,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.boundaries,
    'Sparkle Suite does not guarantee trades or equal value.',
    'Sparkle Suite does not decide what items can be traded for what items on the fly; the current TradeBoard rules define eligibility.',
    NIC_NAC_TRADEBOARD_KNOWLEDGE.repControl,
  ].join(' '),
  tradeBoardLingo: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.danceFloor,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.dancers,
    'Do not say customers add dancers to the dance floor; customers request a rep-listed dancer and describe the piece they revealed or want to offer.',
  ].join(' '),
  tradeBoardLiveShowFlow:
    "TradeBoard shows the rep's available trade listings. " +
    NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow,
  tradeBoardEligibilityRules: [
    NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules,
    NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules,
    'Diamonds and unicorns may appear, but they are rare edge inventory rather than the normal case.',
    'The rep still makes the final approval decision.',
  ].join(' '),
  liveQDataBoundary: [
    NIC_NAC_LIVEQ_KNOWLEDGE.summary,
    'At a public level, LiveQ reads limited live reveal queue information from the Bomb Party rep dashboard and syncs it to the rep site.',
    NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary,
  ].join(' '),
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
  toolDetails: {
    liveq: 'LiveQ helps customers follow live-show queue details more easily.',
    tradeboard:
      "TradeBoard helps customers browse the rep's available trade listings and request to trade a piece they just revealed.",
    calendar:
      'The live event calendar gives customers a clear place to find upcoming live shows.',
    updates:
      'Email and SMS updates help customers keep up with relevant show and site updates.',
    nicNac:
      'Nic-Nac is the Sparkle Suite assistant. On the public landing page, Nic-Nac answers sales and setup questions only.',
  },
  affiliation: NIC_NAC_AFFILIATION.disclaimer,
  handoff:
    'If a question needs a custom exception, private detail, future promise, or direct approval, Nic-Nac should offer to collect the question for Louis to review. Nothing is sent from this page unless a later approved integration is added.',
} as const

export function buildPublicNicNacKnowledgeText() {
  return [
    buildNicNacCoreKnowledgeText(),
    `Product: ${PUBLIC_NIC_NAC_KNOWLEDGE.product}`,
    `Audience: ${PUBLIC_NIC_NAC_KNOWLEDGE.audience}`,
    `Ease of use: ${PUBLIC_NIC_NAC_KNOWLEDGE.easeOfUse}`,
    `Rep context: ${PUBLIC_NIC_NAC_KNOWLEDGE.repContext}`,
    `Setup: ${PUBLIC_NIC_NAC_KNOWLEDGE.setup}`,
    `Customization: ${PUBLIC_NIC_NAC_KNOWLEDGE.customization}`,
    `TradeBoard rules: ${PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardRules}`,
    `TradeBoard Bomb Party lingo: ${PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLingo}`,
    `TradeBoard live-show flow: ${PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardLiveShowFlow}`,
    `TradeBoard eligibility and value rules: ${PUBLIC_NIC_NAC_KNOWLEDGE.tradeBoardEligibilityRules}`,
    `LiveQ data boundary: ${PUBLIC_NIC_NAC_KNOWLEDGE.liveQDataBoundary}`,
    `LiveQ troubleshooting boundary: ${PUBLIC_NIC_NAC_KNOWLEDGE.liveQTroubleshooting}`,
    `Calendar: ${PUBLIC_NIC_NAC_KNOWLEDGE.calendar}`,
    `Email and SMS consent rules: ${PUBLIC_NIC_NAC_KNOWLEDGE.updateConsentRules}`,
    `Pricing: build fee ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.buildFee}; monthly ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.monthly}; first checkout ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.firstCheckout}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.taxNote}; ${PUBLIC_NIC_NAC_KNOWLEDGE.pricing.feeNote}`,
    `Included tools: ${PUBLIC_NIC_NAC_KNOWLEDGE.tools.join(', ')}`,
    `Tool details: ${Object.values(PUBLIC_NIC_NAC_KNOWLEDGE.toolDetails).join(' ')}`,
    `Affiliation: ${PUBLIC_NIC_NAC_KNOWLEDGE.affiliation}`,
    `Handoff rule: ${PUBLIC_NIC_NAC_KNOWLEDGE.handoff}`,
  ].join('\n')
}
