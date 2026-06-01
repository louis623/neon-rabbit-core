import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const getSiteAnalyticsDashboardMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ marker: 'admin' })),
}))

vi.mock('@/lib/services/site-analytics', () => ({
  getSiteAnalyticsDashboard: (...args: unknown[]) =>
    getSiteAnalyticsDashboardMock(...args),
}))

import { GET } from '@/app/api/nic-nac/site-analytics/route'

describe('site analytics route', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    getSiteAnalyticsDashboardMock.mockReset()
  })

  it('returns the account analytics summary for the authenticated rep', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    getSiteAnalyticsDashboardMock.mockResolvedValueOnce({
      configured: false,
      privacy: {
        disablesIpCapture: true,
        masksSensitiveInputs: true,
        identifiesAfterLoginOnly: true,
      },
      overview: null,
      topPages: [],
      trafficSources: [],
      deviceMix: [],
    })

    const response = await GET()

    expect(getSiteAnalyticsDashboardMock).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
      repId: 'rep-1',
    })
    expect(response.status).toBe(200)
  })
})
