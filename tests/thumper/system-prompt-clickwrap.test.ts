import { describe, expect, it } from 'vitest'

import { THUMPER_SYSTEM_PROMPT } from '@/lib/thumper/system-prompt'

describe('Thumper system prompt — listing-time clickwrap guidance', () => {
  it('requires ownership, listing-accuracy, and rep-controlled trade decision confirmation before add_listing', () => {
    expect(THUMPER_SYSTEM_PROMPT).toContain('they own the piece')
    expect(THUMPER_SYSTEM_PROMPT).toContain('listing details are accurate')
    expect(THUMPER_SYSTEM_PROMPT).toContain(
      'trade-board decisions are ultimately rep-controlled',
    )
  })

  it('frames MSRP as reference data rather than the trade-parity engine', () => {
    expect(THUMPER_SYSTEM_PROMPT).toContain(
      'MSRP is reference data, not the trade-parity engine',
    )
  })
})
