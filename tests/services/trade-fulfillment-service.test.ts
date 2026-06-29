import { describe, expect, it, vi } from 'vitest'

import {
  getFulfillmentQueue,
  updateFulfillmentStatus,
} from '@/lib/services/trade-fulfillment'

class ThenableQuery {
  constructor(private readonly result: Record<string, unknown>) {}

  select() {
    return this
  }

  neq() {
    return this
  }

  order() {
    return this
  }

  then(resolve: (value: Record<string, unknown>) => unknown) {
    return Promise.resolve(this.result).then(resolve)
  }
}

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

  it('keeps non-item-number listings visible in the active fulfillment queue', async () => {
    const queueQuery = new ThenableQuery({
      data: [
        {
          id: 'fulfillment-1',
          fulfillment_status: 'approved',
          status_updated_at: new Date().toISOString(),
          request: {
            id: 'request-1',
            customer_name: 'Jamie',
            listing: {
              rep_id: 'rep-1',
              listing_source: 'non_item_number',
              listing_photo_url:
                'https://cdn.example.com/jewelry-photos/rep-1/manual-ring.jpg',
              uses_canonical_photo: false,
              manual_type_prefix: 'RG',
              manual_collection_family: 'Birthday',
              manual_collection_name: 'July Birthday 2026',
              manual_size: '7',
              manual_photo_url:
                'https://cdn.example.com/jewelry-photos/rep-1/manual-ring.jpg',
              design: null,
            },
          },
        },
      ],
      error: null,
    })
    const from = vi.fn((table: string) => {
      if (table === 'trade_fulfillment') return { select: vi.fn(() => queueQuery) }
      throw new Error(`Unexpected table ${table}`)
    })

    const queue = await getFulfillmentQueue({ from } as never, 'rep-1')

    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({
      fulfillmentId: 'fulfillment-1',
      requestId: 'request-1',
      customerName: 'Jamie',
      designName: 'July Birthday 2026 Ring - Size 7',
      itemNumber: null,
    })
  })
})
