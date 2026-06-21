import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'

export type NicNacMemoryScope =
  | 'shared_linked_human'
  | 'suite_rep_private'
  | 'finder_user_private'
  | 'product_public'
  | 'global_lesson'

export type NicNacMemorySafety = 'safe' | 'guarded' | 'blocked'

export interface NicNacMemoryCard {
  id: string
  scope: NicNacMemoryScope
  title: string
  summary: string
  ownerId?: string
  priority?: number
  safety?: NicNacMemorySafety
  source?: string
  updatedAt?: string
}

export interface NicNacBlockedMemoryCard {
  id: string
  scope: NicNacMemoryScope
  reason:
    | 'shared_memory_not_allowed'
    | 'owner_mismatch'
    | 'unsafe_memory'
}

export interface NicNacContextAssemblerLimits {
  maxCards: number
  maxTotalChars: number
  maxCardChars: number
}

export interface NicNacAssembledContext {
  promptText: string
  memoryCards: NicNacMemoryCard[]
  blockedMemoryCards: NicNacBlockedMemoryCard[]
  telemetry: {
    memoryCardCount: number
    blockedMemoryCardCount: number
    memoryScopes: NicNacMemoryScope[]
    linkedHumanId?: string
    truncated: boolean
  }
}

export const DEFAULT_NIC_NAC_CONTEXT_LIMITS: NicNacContextAssemblerLimits = {
  maxCards: 8,
  maxTotalChars: 2400,
  maxCardChars: 360,
}

export function getNicNacLinkedHumanId(
  context: NicNacProductContext,
): string | undefined {
  const suiteRepId = context.actor.linkedSuiteRepId ?? context.actor.suiteRepId
  if (suiteRepId) return `suite_rep:${suiteRepId}`
  if (context.actor.finderUserId) return `finder_user:${context.actor.finderUserId}`
  return undefined
}

export function assembleNicNacContext(input: {
  productContext: NicNacProductContext
  memoryCards?: NicNacMemoryCard[]
  limits?: Partial<NicNacContextAssemblerLimits>
}): NicNacAssembledContext {
  const limits = {
    ...DEFAULT_NIC_NAC_CONTEXT_LIMITS,
    ...input.limits,
  }
  const linkedHumanId = getNicNacLinkedHumanId(input.productContext)
  const blockedMemoryCards: NicNacBlockedMemoryCard[] = []
  const allowedCards: NicNacMemoryCard[] = []

  for (const card of input.memoryCards ?? []) {
    const blockedReason = getBlockedMemoryReason(
      input.productContext,
      card,
      linkedHumanId,
    )
    if (blockedReason) {
      blockedMemoryCards.push({
        id: card.id,
        scope: card.scope,
        reason: blockedReason,
      })
      continue
    }

    allowedCards.push(card)
  }

  const sortedCards = allowedCards.sort((a, b) => {
    const priorityDelta = (b.priority ?? 0) - (a.priority ?? 0)
    if (priorityDelta !== 0) return priorityDelta
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
  })

  const includedCards: NicNacMemoryCard[] = []
  let remainingChars = limits.maxTotalChars
  let truncated = false

  for (const card of sortedCards) {
    if (includedCards.length >= limits.maxCards || remainingChars <= 0) {
      truncated = true
      break
    }

    const normalizedCard = {
      ...card,
      title: sanitizeContextText(card.title, 120),
      summary: sanitizeContextText(
        card.summary,
        Math.min(limits.maxCardChars, remainingChars),
      ),
    }
    if (normalizedCard.summary.length < card.summary.trim().length) {
      truncated = true
    }

    const cardCost =
      normalizedCard.title.length + normalizedCard.summary.length + 24
    if (cardCost > remainingChars && includedCards.length > 0) {
      truncated = true
      break
    }

    includedCards.push(normalizedCard)
    remainingChars -= Math.min(cardCost, remainingChars)
  }

  const memoryScopes = Array.from(
    new Set(includedCards.map((card) => card.scope)),
  )

  return {
    promptText: buildMemoryPromptText(includedCards),
    memoryCards: includedCards,
    blockedMemoryCards,
    telemetry: {
      memoryCardCount: includedCards.length,
      blockedMemoryCardCount: blockedMemoryCards.length,
      memoryScopes,
      linkedHumanId,
      truncated,
    },
  }
}

function getBlockedMemoryReason(
  context: NicNacProductContext,
  card: NicNacMemoryCard,
  linkedHumanId?: string,
): NicNacBlockedMemoryCard['reason'] | null {
  if (card.safety === 'blocked') return 'unsafe_memory'

  if (card.scope === 'global_lesson' || card.scope === 'product_public') {
    return null
  }

  if (card.scope === 'shared_linked_human') {
    if (!context.permissions.canReadSharedMemory) {
      return 'shared_memory_not_allowed'
    }
    return card.ownerId && card.ownerId === linkedHumanId
      ? null
      : 'owner_mismatch'
  }

  if (card.scope === 'suite_rep_private') {
    return card.ownerId === getSuiteRepOwnerId(context) ? null : 'owner_mismatch'
  }

  if (card.scope === 'finder_user_private') {
    return card.ownerId === getFinderUserOwnerId(context)
      ? null
      : 'owner_mismatch'
  }

  return 'owner_mismatch'
}

function getSuiteRepOwnerId(context: NicNacProductContext): string | undefined {
  return context.product === 'sparkle_suite' &&
    context.surface === 'rep_workspace' &&
    context.actor.suiteRepId
    ? `suite_rep:${context.actor.suiteRepId}`
    : undefined
}

function getFinderUserOwnerId(context: NicNacProductContext): string | undefined {
  return context.actor.finderUserId
    ? `finder_user:${context.actor.finderUserId}`
    : undefined
}

function sanitizeContextText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`
}

function buildMemoryPromptText(cards: NicNacMemoryCard[]): string {
  if (!cards.length) return ''

  return [
    'Relevant memory context:',
    ...cards.map(
      (card) => `- [${card.scope}] ${card.title}: ${card.summary}`,
    ),
    'Use this memory quietly. Do not reveal memory mechanics unless asked.',
  ].join('\n')
}
