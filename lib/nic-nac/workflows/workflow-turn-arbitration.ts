import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

export type NicNacWorkflowTurnArbitration = {
  tradeBoard: boolean
  trade: boolean
  calendar: boolean
}

export type NicNacActiveWorkflowTimestamps = {
  tradeBoard?: string | null
  trade?: string | null
  calendar?: string | null
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
  activeWorkflowTimestamps?: NicNacActiveWorkflowTimestamps,
): NicNacWorkflowTurnArbitration {
  const isPassiveContinuation = latestTurnIntents.every((intent) =>
    PASSIVE_CONTINUATION_INTENTS.has(intent),
  )

  if (isPassiveContinuation) {
    if (activeWorkflowTimestamps) {
      const active = (
        [
          ['tradeBoard', activeWorkflowTimestamps.tradeBoard],
          ['trade', activeWorkflowTimestamps.trade],
          ['calendar', activeWorkflowTimestamps.calendar],
        ] as const
      )
        .filter((entry): entry is readonly [keyof NicNacWorkflowTurnArbitration, string] =>
          Boolean(entry[1]),
        )
        .sort(
          (left, right) =>
            (Date.parse(right[1]) || 0) - (Date.parse(left[1]) || 0),
        )
      const selected = active[0]?.[0]
      return {
        tradeBoard: selected === 'tradeBoard',
        trade: selected === 'trade',
        calendar: selected === 'calendar',
      }
    }
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
