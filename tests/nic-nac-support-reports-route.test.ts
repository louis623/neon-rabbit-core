import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()
const createSupportReportMock = vi.fn()

vi.mock('@/lib/supabase/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/auth')>(
    '@/lib/supabase/auth',
  )
  return {
    ...actual,
    getAuthenticatedRep: (...args: unknown[]) =>
      getAuthenticatedRepMock(...args),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/support-reports', () => ({
  createSupportReport: (...args: unknown[]) => createSupportReportMock(...args),
}))

import { AuthError } from '@/lib/supabase/auth'
import { POST } from '@/app/api/nic-nac/support-reports/route'

describe('support reports route', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    createAdminClientMock.mockReset()
    createSupportReportMock.mockReset()
    getAuthenticatedRepMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { email: 'jamie@example.com' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    createSupportReportMock.mockResolvedValue({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })
  })

  it('creates a help form support report for the authenticated rep', async () => {
    const response = await POST(new Request(
      'http://localhost/api/nic-nac/support-reports',
      {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'bug',
          urgency: 'blocking',
          pageOrWorkflow: 'Calendar',
          title: 'Calendar save fails',
          details: 'Clicking save does nothing after I edit a show.',
          expectedResult: 'The show saves.',
          actualResult: 'Nothing happens.',
          contactOk: true,
        }),
      },
    ))

    expect(response.status).toBe(201)
    expect(createSupportReportMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      {
        repId: 'rep-1',
        repEmail: 'jamie@example.com',
        source: 'help_form',
        reportType: 'bug',
        urgency: 'blocking',
        pageOrWorkflow: 'Calendar',
        title: 'Calendar save fails',
        details: 'Clicking save does nothing after I edit a show.',
        expectedResult: 'The show saves.',
        actualResult: 'Nothing happens.',
        contactOk: true,
      },
    )
    await expect(response.json()).resolves.toEqual({
      ok: true,
      reportId: 'report-1',
      notificationStatus: 'delivered',
    })
  })

  it('returns 401 when the rep is not authenticated', async () => {
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('Not authenticated'))

    const response = await POST(new Request(
      'http://localhost/api/nic-nac/support-reports',
      {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'bug',
          title: 'Calendar save fails',
          details: 'Clicking save does nothing after I edit a show.',
        }),
      },
    ))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Not authenticated',
    })
  })

  it('returns 400 for invalid report details', async () => {
    const response = await POST(new Request(
      'http://localhost/api/nic-nac/support-reports',
      {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'bug',
          title: 'No',
          details: 'short',
        }),
      },
    ))

    expect(response.status).toBe(400)
    expect(createSupportReportMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'Check the report details and try again.',
    })
  })

  it('returns the saved report when notification delivery is unavailable', async () => {
    createSupportReportMock.mockResolvedValueOnce({
      ok: true,
      reportId: 'report-2',
      notificationStatus: 'not_configured',
    })

    const response = await POST(new Request(
      'http://localhost/api/nic-nac/support-reports',
      {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'workflow_idea',
          title: 'Better cleanup view',
          details: 'Please add a clearer after-show cleanup queue.',
        }),
      },
    ))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      reportId: 'report-2',
      notificationStatus: 'not_configured',
    })
  })
})
