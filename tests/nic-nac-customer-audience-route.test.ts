import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getCustomerAudienceMock = vi.fn()
const unsubscribeCustomerAudienceMemberMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/customer-audience', () => ({
  getCustomerAudience: (...args: unknown[]) => getCustomerAudienceMock(...args),
  unsubscribeCustomerAudienceMember: (...args: unknown[]) =>
    unsubscribeCustomerAudienceMemberMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/customer-audience/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('GET /api/nic-nac/customer-audience', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getCustomerAudienceMock.mockReset()
    unsubscribeCustomerAudienceMemberMock.mockReset()
  })

  it('returns the authenticated rep audience summary', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getCustomerAudienceMock.mockResolvedValueOnce({
      summary: {
        totalCustomers: 2,
        smsReachableCount: 1,
        emailReachableCount: 2,
        marketingConsentCount: 1,
        smsOptedOutCount: 0,
        emailOptedOutCount: 0,
        addedLast30DaysCount: 2,
      },
      customers: [
        {
          id: 'aud-1',
          name: 'Jamie Lane',
          phone: '+15555550101',
          email: 'jamie@example.com',
          smsConsent: true,
          emailConsent: true,
          marketingConsent: true,
          canReceiveSms: true,
          canReceiveEmail: true,
          consentDate: '2026-05-05T12:00:00Z',
          createdAt: '2026-05-05T12:00:00Z',
          smsOptedOutAt: null,
          emailOptedOutAt: null,
          stopKeywordReceivedAt: null,
        },
      ],
    })

    const response = await GET(
      new Request('http://localhost/api/nic-nac/customer-audience?limit=5&channel=sms'),
    )

    expect(getCustomerAudienceMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      {
        channelFilter: 'sms',
        limit: 5,
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      summary: {
        totalCustomers: 2,
        smsReachableCount: 1,
        emailReachableCount: 2,
        marketingConsentCount: 1,
        smsOptedOutCount: 0,
        emailOptedOutCount: 0,
        addedLast30DaysCount: 2,
      },
      customers: [
        {
          id: 'aud-1',
          name: 'Jamie Lane',
          phone: '+15555550101',
          email: 'jamie@example.com',
          smsConsent: true,
          emailConsent: true,
          marketingConsent: true,
          canReceiveSms: true,
          canReceiveEmail: true,
          consentDate: '2026-05-05T12:00:00Z',
          createdAt: '2026-05-05T12:00:00Z',
          smsOptedOutAt: null,
          emailOptedOutAt: null,
          stopKeywordReceivedAt: null,
        },
      ],
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedNicNacContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await GET(
      new Request('http://localhost/api/nic-nac/customer-audience'),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })

  it('lets the authenticated rep unsubscribe one audience row by id', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    unsubscribeCustomerAudienceMemberMock.mockResolvedValueOnce({
      updatedCount: 1,
      smsUpdatedCount: 1,
      emailUpdatedCount: 0,
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/customer-audience', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: 'aud-1',
          unsubscribeSms: true,
          unsubscribeEmail: false,
        }),
      }),
    )

    expect(unsubscribeCustomerAudienceMemberMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      {
        audienceId: 'aud-1',
        unsubscribeSms: true,
        unsubscribeEmail: false,
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        updatedCount: 1,
        smsUpdatedCount: 1,
        emailUpdatedCount: 0,
      },
    })
  })
})
