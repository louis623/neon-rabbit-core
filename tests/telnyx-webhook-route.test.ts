import { generateKeyPairSync, sign as signPayload } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const unsubscribeCustomerAudienceByPhoneMock = vi.fn()
const createAdminClientMock = vi.fn(() => ({ mocked: true }))

vi.mock('@/lib/services/customer-audience', () => ({
  unsubscribeCustomerAudienceByPhone: (...args: unknown[]) =>
    unsubscribeCustomerAudienceByPhoneMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

import { POST } from '@/app/api/telnyx/webhook/route'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

function createSignedTelnyxHeaders(payload: string, timestamp = '1700000000') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const publicKeyDer = publicKey.export({ format: 'der', type: 'spki' })
  const rawPublicKey = Buffer.from(publicKeyDer).subarray(ED25519_SPKI_PREFIX.length)
  const signature = signPayload(
    null,
    Buffer.from(`${timestamp}|${payload}`),
    privateKey,
  )

  return {
    publicKey: rawPublicKey.toString('base64'),
    timestamp,
    signature: signature.toString('base64'),
  }
}

describe('POST /api/telnyx/webhook', () => {
  beforeEach(() => {
    unsubscribeCustomerAudienceByPhoneMock.mockReset()
    createAdminClientMock.mockClear()
    delete process.env.TELNYX_PUBLIC_KEY
  })

  it('tracks STOP opt-outs from inbound message.received webhooks', async () => {
    unsubscribeCustomerAudienceByPhoneMock.mockResolvedValueOnce({
      updatedCount: 2,
      smsUpdatedCount: 2,
      emailUpdatedCount: 0,
    })

    const response = await POST(
      new Request('http://localhost/api/telnyx/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: {
            event_type: 'message.received',
            payload: {
              autoresponse_type: 'STOP',
              from: { phone_number: '+15555551212' },
              text: 'STOP',
            },
          },
        }),
      }),
    )

    expect(unsubscribeCustomerAudienceByPhoneMock).toHaveBeenCalledWith(
      expect.anything(),
      '+15555551212',
      { markStopKeywordReceived: true },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('rejects webhook requests with invalid signatures when a public key is configured', async () => {
    const body = JSON.stringify({
      data: {
        event_type: 'message.received',
        payload: {
          autoresponse_type: 'STOP',
          from: { phone_number: '+15555551212' },
          text: 'STOP',
        },
      },
    })
    const signed = createSignedTelnyxHeaders(body)
    process.env.TELNYX_PUBLIC_KEY = signed.publicKey

    const response = await POST(
      new Request('http://localhost/api/telnyx/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'telnyx-timestamp': signed.timestamp,
          'telnyx-signature-ed25519': 'invalid-signature',
        },
        body,
      }),
    )

    expect(unsubscribeCustomerAudienceByPhoneMock).not.toHaveBeenCalled()
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid webhook signature.',
    })
  })

  it('also recognizes plain STOP keywords even without autoresponse_type', async () => {
    unsubscribeCustomerAudienceByPhoneMock.mockResolvedValueOnce({
      updatedCount: 1,
      smsUpdatedCount: 1,
      emailUpdatedCount: 0,
    })

    const response = await POST(
      new Request('http://localhost/api/telnyx/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: {
            event_type: 'message.received',
            payload: {
              from: { phone_number: '+15555551212' },
              text: 'unsubscribe',
            },
          },
        }),
      }),
    )

    expect(unsubscribeCustomerAudienceByPhoneMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('ignores non-opt-out webhook events', async () => {
    const response = await POST(
      new Request('http://localhost/api/telnyx/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: {
            event_type: 'message.finalized',
            payload: {
              id: 'msg-1',
            },
          },
        }),
      }),
    )

    expect(unsubscribeCustomerAudienceByPhoneMock).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
