import { describe, expect, it } from 'vitest'

import { APPROVAL_COPY } from '@/app/nic-nac/components/HITLBlock'

describe('Nic-Nac HITL approval copy', () => {
  it('uses swap-specific approval copy for approve_trade_swap', () => {
    expect(APPROVAL_COPY.approve_trade_swap).toEqual({
      title: 'Approve this swap?',
      confirm: 'Approve swap',
      cancel: 'Cancel',
    })
  })
})
