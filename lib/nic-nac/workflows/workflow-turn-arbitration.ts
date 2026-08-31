import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

export type NicNacWorkflowTurnArbitration = {
  tradeBoard: boolean
  trade: boolean
  calendar: boolean
}

const PASSIVE_CONTINUATION_INTENTS = new Set<NicNacToolIntent>([
  'memory',
  'show_memory',
])

function includesAny(
  intents: readonly NicNacToolIntent[],
  candidates: readonly NicNacToolIntent[],
) {
  return candidates.some((candidate) => intents.includes(candidate))
}

/**
 * Selects the durable workflow families allowed to consume the latest turn.
 * Explicit new product intents suspend unrelated workflows for that turn;
 * passive replies may continue whichever workflow is already active.
 */
export function arbitrateNicNacWorkflowTurn(
  latestTurnIntents: readonly NicNacToolIntent[],
): NicNacWorkflowTurnArbitration {
  const isPassiveContinuation = latestTurnIntents.every((intent) =>
    PASSIVE_CONTINUATION_INTENTS.has(intent),
  )

  if (isPassiveContinuation) {
    return { tradeBoard: true, trade: true, calendar: true }
  }

  return {
    tradeBoard: includesAny(latestTurnIntents, ['trade_board', 'catalog']),
    trade: includesAny(latestTurnIntents, [
      'trade_board',
      'trade_requests',
      'fulfillment',
      'catalog',
    ]),
    calendar: includesAny(latestTurnIntents, ['calendar', 'notification']),
  }
}
