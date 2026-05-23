import { describe, expect, it } from 'vitest'

import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

describe('Nic-Nac system prompt - listing-time trade guidance', () => {
  it('does not make Nic-Nac ask ownership clickwrap questions before add_listing', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain('they own the piece')
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain('listing details are accurate')
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain('clickwrapAccepted')
  })

  it('frames MSRP as reference data rather than the trade-parity engine', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'MSRP is reference data, not the trade-parity engine',
    )
  })
})
