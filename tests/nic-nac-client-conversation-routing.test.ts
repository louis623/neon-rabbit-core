import { describe, expect, it } from 'vitest'

import {
  buildConversationStateUrl,
  canUseUrlConversationId,
  getConversationIdFromSearch,
  putConversationIdInSearch,
  readJsonResponse,
} from '@/lib/nic-nac/client-conversation-routing'

describe('Nic-Nac client conversation routing', () => {
  it('does not treat the workspace customer code as a chat conversation id', () => {
    expect(
      getConversationIdFromSearch('?c=1fa4ba02-154e-4d5b-aef2-759cb13abbfb'),
    ).toBeNull()
    expect(getConversationIdFromSearch('?conversationId=conv-123')).toBe('conv-123')
  })

  it('preserves the rep workspace code when writing the chat conversation id', () => {
    expect(
      putConversationIdInSearch(
        '?c=1fa4ba02-154e-4d5b-aef2-759cb13abbfb&section=trade-board',
        'conv-123',
      ),
    ).toBe('c=1fa4ba02-154e-4d5b-aef2-759cb13abbfb&section=trade-board&conversationId=conv-123')
  })

  it('uses the flat conversation-state API to avoid nested route ambiguity', () => {
    expect(buildConversationStateUrl()).toBe('/api/nic-nac/conversation-state')
    expect(buildConversationStateUrl('conv-123')).toBe(
      '/api/nic-nac/conversation-state?conversationId=conv-123',
    )
  })

  it('trusts a checkout-success conversation id after Stripe sync is complete', () => {
    expect(
      canUseUrlConversationId({
        urlId: 'conv-123',
        isCheckoutSuccessReturn: true,
        checkoutSyncComplete: false,
      }),
    ).toBe(false)

    expect(
      canUseUrlConversationId({
        urlId: 'conv-123',
        isCheckoutSuccessReturn: true,
        checkoutSyncComplete: true,
      }),
    ).toBe(true)
  })

  it('turns non-JSON route failures into readable errors', async () => {
    const response = new Response('<!DOCTYPE html><h1>Not Found</h1>', {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })

    await expect(readJsonResponse(response, 'conversation history')).rejects.toThrow(
      'conversation history returned 404 with text/html',
    )
  })
})
