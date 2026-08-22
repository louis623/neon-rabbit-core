import { NIC_NAC_AFFILIATION } from './affiliation'
import { NIC_NAC_CORE_KNOWLEDGE } from './core'
import { NIC_NAC_LIVEQ_KNOWLEDGE } from './liveq'
import { NIC_NAC_PERSONALITY } from './personality'
import { NIC_NAC_TRADEBOARD_KNOWLEDGE } from './tradeboard'

export { NIC_NAC_AFFILIATION } from './affiliation'
export { NIC_NAC_CORE_KNOWLEDGE } from './core'
export { NIC_NAC_LIVEQ_KNOWLEDGE } from './liveq'
export { NIC_NAC_PERSONALITY } from './personality'
export { NIC_NAC_TRADEBOARD_KNOWLEDGE } from './tradeboard'
export {
  NIC_NAC_TRADE_TERMS,
  normalizeNicNacTradeTerms,
} from './terminology'

export function buildNicNacCoreKnowledgeText() {
  return [
    `Product: ${NIC_NAC_CORE_KNOWLEDGE.productName} with assistant ${NIC_NAC_CORE_KNOWLEDGE.assistantName}.`,
    `Audience: ${NIC_NAC_CORE_KNOWLEDGE.primaryAudience}`,
    `Product summary: ${NIC_NAC_CORE_KNOWLEDGE.productSummary}`,
    `Setup: ${NIC_NAC_CORE_KNOWLEDGE.setupSummary}`,
    `Included public tools: ${NIC_NAC_CORE_KNOWLEDGE.publicToolNames.join(', ')}`,
    `Dance Floor rules: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.summary} ${NIC_NAC_TRADEBOARD_KNOWLEDGE.customerFlow} ${NIC_NAC_TRADEBOARD_KNOWLEDGE.repControl}`,
    `Dance Floor terminology: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.danceFloor} ${NIC_NAC_TRADEBOARD_KNOWLEDGE.lingo.dancers}`,
    `Dance Floor eligibility and value rules: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.eligibilityRules} ${NIC_NAC_TRADEBOARD_KNOWLEDGE.valueRules}`,
    `Dance Floor boundaries: ${NIC_NAC_TRADEBOARD_KNOWLEDGE.boundaries}`,
    `LiveQ: ${NIC_NAC_LIVEQ_KNOWLEDGE.summary}`,
    `LiveQ data boundary: ${NIC_NAC_LIVEQ_KNOWLEDGE.publicDataBoundary}`,
    `LiveQ troubleshooting boundary: ${NIC_NAC_LIVEQ_KNOWLEDGE.troubleshooting}`,
    `Affiliation: ${NIC_NAC_AFFILIATION.owner} ${NIC_NAC_AFFILIATION.disclaimer}`,
    `Personality: ${NIC_NAC_PERSONALITY.voice} ${NIC_NAC_PERSONALITY.relationship} ${NIC_NAC_PERSONALITY.uncertaintyRules} Related domains: ${NIC_NAC_PERSONALITY.relatedDomains.join(', ')}. ${NIC_NAC_PERSONALITY.constraints.join('; ')}`,
  ].join('\n')
}
