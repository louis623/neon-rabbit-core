import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  attachTradeRequestRevealScreenshot,
  getTradeRequestRevealScreenshotForRep,
  submitTradeRequest,
} from '@/lib/services/trade-requests'

describe('submitTradeRequest', () => {
  const rpc = vi.fn()
  const maybeSingle = vi.fn()
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const supabase = { rpc } as unknown as {
    rpc: typeof rpc
  }
  const supabaseWithListingLookup = {
    from,
    rpc,
  }

  beforeEach(() => {
    rpc.mockReset()
    from.mockReset()
    select.mockClear()
    eq.mockClear()
    maybeSingle.mockReset()
    from.mockReturnValue({ select })
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

  it('rejects expected-rep mismatches before submitting the request rpc', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { id: 'listing-1', rep_id: 'rep-other' },
      error: null,
    })

    await expect(
      submitTradeRequest(supabaseWithListingLookup as never, {
        listingId: 'listing-1',
        customerName: 'Jamie',
        customerDescription: 'Birthday ring, size 8',
        expectedRepId: 'rep-louis',
      }),
    ).rejects.toMatchObject({
      code: 'LISTING_NOT_FOUND',
    })

    expect(from).toHaveBeenCalledWith('trade_listings')
    expect(eq).toHaveBeenCalledWith('id', 'listing-1')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('attaches reveal screenshot metadata to an existing trade request', async () => {
    const updateEq = vi.fn().mockResolvedValueOnce({ error: null })
    const update = vi.fn(() => ({ eq: updateEq }))
    from.mockReturnValueOnce({ update })

    await attachTradeRequestRevealScreenshot(supabaseWithListingLookup as never, 'request-1', {
      objectPath: 'rep-1/request-1/reveal.png',
      contentType: 'image/png',
      sizeBytes: 123,
      uploadedAt: '2026-06-17T12:00:00.000Z',
      expiresAt: '2026-06-19T12:00:00.000Z',
    })

    expect(from).toHaveBeenCalledWith('trade_requests')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        reveal_screenshot_path: 'rep-1/request-1/reveal.png',
        reveal_screenshot_content_type: 'image/png',
        reveal_screenshot_size_bytes: 123,
        reveal_screenshot_uploaded_at: '2026-06-17T12:00:00.000Z',
        reveal_screenshot_expires_at: '2026-06-19T12:00:00.000Z',
      }),
    )
    expect(updateEq).toHaveBeenCalledWith('id', 'request-1')
  })

  it('returns a reveal screenshot only for the owning rep and before expiry', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'request-1',
        reveal_screenshot_path: 'rep-1/request-1/reveal.png',
        reveal_screenshot_content_type: 'image/png',
        reveal_screenshot_size_bytes: 123,
        reveal_screenshot_uploaded_at: '2026-06-17T12:00:00.000Z',
        reveal_screenshot_expires_at: '2999-06-19T12:00:00.000Z',
        listing: { rep_id: 'rep-1' },
      },
      error: null,
    })

    await expect(
      getTradeRequestRevealScreenshotForRep(
        supabaseWithListingLookup as never,
        'rep-1',
        'request-1',
      ),
    ).resolves.toEqual({
      objectPath: 'rep-1/request-1/reveal.png',
      contentType: 'image/png',
      sizeBytes: 123,
      uploadedAt: '2026-06-17T12:00:00.000Z',
      expiresAt: '2999-06-19T12:00:00.000Z',
    })
  })

  it('returns null for expired reveal screenshots', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'request-1',
        reveal_screenshot_path: 'rep-1/request-1/reveal.png',
        reveal_screenshot_content_type: 'image/png',
        reveal_screenshot_size_bytes: 123,
        reveal_screenshot_uploaded_at: '2026-06-17T12:00:00.000Z',
        reveal_screenshot_expires_at: '2020-06-19T12:00:00.000Z',
        listing: { rep_id: 'rep-1' },
      },
      error: null,
    })

    await expect(
      getTradeRequestRevealScreenshotForRep(
        supabaseWithListingLookup as never,
        'rep-1',
        'request-1',
      ),
    ).resolves.toBeNull()
  })
})
