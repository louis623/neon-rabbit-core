import { describe, expect, it } from 'vitest'

import { arbitrateNicNacWorkflowTurn } from '@/lib/nic-nac/workflows/workflow-turn-arbitration'

describe('Nic-Nac workflow turn arbitration', () => {
  it('suspends stale Trade workflows for an explicit Calendar turn', () => {
    expect(arbitrateNicNacWorkflowTurn(['show_memory', 'calendar'])).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: true,
    })
  })

  it('suspends stale Calendar state for an explicit Dance Floor turn', () => {
    expect(arbitrateNicNacWorkflowTurn(['trade_board'])).toEqual({
      tradeBoard: true,
      trade: true,
      calendar: false,
    })
  })

  it('allows passive replies to continue whichever workflow is active', () => {
    expect(arbitrateNicNacWorkflowTurn(['memory'])).toEqual({
      tradeBoard: true,
      trade: true,
      calendar: true,
    })
  })

  it('routes a passive reply only to the most recently updated active workflow when context is known', () => {
    expect(
      arbitrateNicNacWorkflowTurn(['memory'], {
        tradeBoard: '2026-09-01T20:00:00.000Z',
        trade: '2026-09-01T20:05:00.000Z',
        calendar: '2026-09-01T20:10:00.000Z',
      }),
    ).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: true,
    })
  })

  it('does not fan out a passive reply when no active workflow exists', () => {
    expect(arbitrateNicNacWorkflowTurn(['memory'], {})).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: false,
    })
  })

  it('does not assign an unrecognized turn to stale work on the agent harness', () => {
    expect(
      arbitrateNicNacWorkflowTurn(
        ['memory'],
        {
          tradeBoard: '2026-09-01T20:00:00.000Z',
          trade: '2026-09-01T20:05:00.000Z',
          calendar: '2026-09-01T20:10:00.000Z',
        },
        { allowImplicitPassiveContinuation: false },
      ),
    ).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: false,
    })
  })

  it('suspends product workflows for an explicit resource request', () => {
    expect(arbitrateNicNacWorkflowTurn(['resources'])).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: false,
    })
  })
})
