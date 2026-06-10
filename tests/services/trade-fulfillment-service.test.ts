import { describe, expect, it, vi } from 'vitest'

import { updateFulfillmentStatus } from '@/lib/services/trade-fulfillment'

function makeFulfillmentSupabase(row: Record<string, unknown>) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const lookupEq = vi.fn(() => ({ maybeSingle }))
  const lookupSelect = vi.fn(() => ({ eq: lookupEq }))
  const updateSingle = vi.fn().mockResolvedValue({
    data: {
      ...row,
      fulfillment_status: 'shipped',
      completed_at: null,
    },
    error: null,
  })
  const updateSelect = vi.fn(() => ({ single: updateSingle }))
  const updateEq = vi.fn(() => ({ select: updateSelect }))
  const update = vi.fn(() => ({ eq: updateEq }))
  const from = vi.fn((table: string) => {
    if (table !== 'trade_fulfillment') {
      throw new Error(`Unexpected table ${table}`)
    }
    return {
      select: lookupSelect,
      update,
    }
  })

  return {
    supabase: { from },
    spies: {
      update,
    },
  }
}

describe('trade fulfillment service', () => {
  it('treats same-status updates as no-ops without resetting fulfillment aging', async () => {
    const { supabase, spies } = makeFulfillmentSupabase({
      id: 'fulfillment-1',
      request_id: 'request-1',
      fulfillment_status: 'shipped',
      completed_at: null,
    })

    const result = await updateFulfillmentStatus(supabase as never, 'rep-1', {
      requestId: 'request-1',
      nextStatus: 'shipped',
      shippingNotes: 'Already shipped.',
    })

    expect(spies.update).not.toHaveBeenCalled()
    expect(result).toEqual({
      fulfillmentId: 'fulfillment-1',
      requestId: 'request-1',
      previousStatus: 'shipped',
      status: 'shipped',
      completedAt: null,
      changed: false,
      shouldPromptAddToBoard: false,
    })
  })
})
