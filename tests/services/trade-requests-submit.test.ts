import { beforeEach, describe, expect, it, vi } from 'vitest'

import { submitTradeRequest } from '@/lib/services/trade-requests'

describe('submitTradeRequest', () => {
  const rpc = vi.fn()
  const supabase = { rpc } as unknown as {
    rpc: typeof rpc
  }

  beforeEach(() => {
    rpc.mockReset()
  })

  it('calls rpc_submit_trade_request and returns the request ids without checkbox acknowledgement', async () => {
    rpc.mockResolvedValueOnce({
      data: { request_id: 'request-1', listing_id: 'listing-1' },
      error: null,
    })

    await expect(
      submitTradeRequest(supabase as never, {
        listingId: 'listing-1',
        customerName: 'Jamie',
        customerDescription: 'Birthday ring, size 8',
      }),
    ).resolves.toEqual({
      requestId: 'request-1',
      listingId: 'listing-1',
    })

    expect(rpc).toHaveBeenCalledWith('rpc_submit_trade_request', {
      p_listing_id: 'listing-1',
      p_customer_name: 'Jamie',
      p_customer_description: 'Birthday ring, size 8',
    })
  })
})
