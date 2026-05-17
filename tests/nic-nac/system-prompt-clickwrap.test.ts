import { describe, expect, it } from 'vitest'

import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

describe('Nic-Nac system prompt — listing-time clickwrap guidance', () => {
  it('requires ownership, listing-accuracy, and rep-controlled trade decision confirmation before add_listing', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('they own the piece')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('listing details are accurate')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'trade-board decisions are ultimately rep-controlled',
    )
  })

  it('frames MSRP as reference data rather than the trade-parity engine', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'MSRP is reference data, not the trade-parity engine',
    )
  })
})
