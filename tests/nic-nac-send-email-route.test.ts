import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getCustomerAudienceMemberMock = vi.fn()
const sendEmailNotificationMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/customer-audience', () => ({
  getCustomerAudienceMember: (...args: unknown[]) =>
    getCustomerAudienceMemberMock(...args),
}))

vi.mock('@/lib/services/email-notifications', () => ({
  sendEmailNotification: (...args: unknown[]) => sendEmailNotificationMock(...args),
}))

import { POST } from '@/app/api/nic-nac/send-email/route'
import { ServiceError } from '@/lib/services/errors'
import { AuthError } from '@/lib/nic-nac/auth'

describe('POST /api/nic-nac/send-email', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getCustomerAudienceMemberMock.mockReset()
    sendEmailNotificationMock.mockReset()
  })

  it('sends an email to an authenticated rep audience row', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getCustomerAudienceMemberMock.mockResolvedValueOnce({
      id: 'aud-1',
      name: 'Jamie Lane',
      email: 'jamie@example.com',
      canReceiveEmail: true,
    })
    sendEmailNotificationMock.mockResolvedValueOnce({
      success: true,
      emailId: 'email-1',
      deliveryStatus: 'sent',
      recipientEmail: 'jamie@example.com',
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/send-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-1',
          subject: 'Your order is ready',
          body: 'Pickup is available now.',
        }),
      }),
    )

    expect(getCustomerAudienceMemberMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      'aud-1',
    )
    expect(sendEmailNotificationMock).toHaveBeenCalledWith('rep-1', {
      recipientEmail: 'jamie@example.com',
      subject: 'Your order is ready',
      body: 'Pickup is available now.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        success: true,
        emailId: 'email-1',
        deliveryStatus: 'sent',
        recipientEmail: 'jamie@example.com',
      },
      customer: {
        id: 'aud-1',
        name: 'Jamie Lane',
        email: 'jamie@example.com',
      },
    })
  })

  it('returns 404 when the audience row is not available to that rep', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getCustomerAudienceMemberMock.mockResolvedValueOnce(null)

    const response = await POST(
      new Request('http://localhost/api/nic-nac/send-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-missing',
          subject: 'Your order is ready',
          body: 'Pickup is available now.',
        }),
      }),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: "I couldn't find that customer in your audience.",
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedNicNacContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await POST(
      new Request('http://localhost/api/nic-nac/send-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-1',
          subject: 'Your order is ready',
          body: 'Pickup is available now.',
        }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })

  it('returns 429 when the rep hits the weekly manual email cap', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getCustomerAudienceMemberMock.mockResolvedValueOnce({
      id: 'aud-1',
      name: 'Jamie Lane',
      email: 'jamie@example.com',
      canReceiveEmail: true,
    })
    sendEmailNotificationMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'EMAIL_WEEKLY_LIMIT_REACHED',
        message: 'manual email weekly limit reached',
        userMessage: "You've hit your weekly email limit.",
        statusCode: 429,
      }),
    )

    const response = await POST(
      new Request('http://localhost/api/nic-nac/send-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-1',
          subject: 'Your order is ready',
          body: 'Pickup is available now.',
        }),
      }),
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      code: 'EMAIL_WEEKLY_LIMIT_REACHED',
      error: "You've hit your weekly email limit.",
    })
  })

  it('returns 422 when content screening blocks the email', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getCustomerAudienceMemberMock.mockResolvedValueOnce({
      id: 'aud-1',
      name: 'Jamie Lane',
      email: 'jamie@example.com',
      canReceiveEmail: true,
    })
    sendEmailNotificationMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'CONTENT_SCREENING_BLOCKED',
        message: 'content screening blocked the message',
        userMessage:
          "I can't send that as written because it uses prohibited recruiting language: financial freedom. Try plain product or show language instead.",
        statusCode: 422,
      }),
    )

    const response = await POST(
      new Request('http://localhost/api/nic-nac/send-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-1',
          subject: 'Your order is ready',
          body: 'financial freedom',
        }),
      }),
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      code: 'CONTENT_SCREENING_BLOCKED',
      error:
        "I can't send that as written because it uses prohibited recruiting language: financial freedom. Try plain product or show language instead.",
    })
  })
})
