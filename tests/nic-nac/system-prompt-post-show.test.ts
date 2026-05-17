import { describe, expect, it } from 'vitest'

import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

describe('Nic-Nac system prompt — post-show cleanup orchestration', () => {
  it('frames post-show cleanup as a rep-invoked conversation instead of an automatic queue', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('show is over')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('asks for cleanup')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'rep-invoked cleanup conversation',
    )
  })

  it('uses get_trade_requests first and add_listing batch for remaining reveal pieces', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('get_trade_requests')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'summarize pending trade-request decisions',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('remaining reveal pieces')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain("mode:'batch'")
  })

  it('forbids claiming automatic post-show counts and keeps fulfillment review as a separate follow-on step', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      "Do not claim automatic counts like 'You have 3 new pieces to catalog and 2 trades to finalize'",
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Fulfillment queue review is a separate follow-on step after cleanup',
    )
  })
})
