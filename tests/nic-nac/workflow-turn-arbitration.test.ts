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

  it('suspends product workflows for an explicit resource request', () => {
    expect(arbitrateNicNacWorkflowTurn(['resources'])).toEqual({
      tradeBoard: false,
      trade: false,
      calendar: false,
    })
  })
})
