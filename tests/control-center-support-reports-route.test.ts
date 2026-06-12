import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createAdminClientMock = vi.fn()
const listOperatorSupportReportsMock = vi.fn()
const updateOperatorSupportReportStatusMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/support-reports', () => ({
  listOperatorSupportReports: (...args: unknown[]) =>
    listOperatorSupportReportsMock(...args),
  updateOperatorSupportReportStatus: (...args: unknown[]) =>
    updateOperatorSupportReportStatusMock(...args),
}))

import {
  GET,
  PATCH,
} from '@/app/api/control-center/support-reports/route'

describe('/api/control-center/support-reports', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createAdminClientMock.mockReset()
    listOperatorSupportReportsMock.mockReset()
    updateOperatorSupportReportStatusMock.mockReset()
    getAuthenticatedOperatorMock.mockResolvedValue({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
  })

  it('lists dashboard-ready support reports for authenticated operators', async () => {
    listOperatorSupportReportsMock.mockResolvedValueOnce([
      {
        id: 'report-1',
        status: 'open',
        urgency: 'showtime_urgent',
        title: 'Live Queue stale',
      },
    ])

    const response = await GET(
      new Request(
        'http://localhost/api/control-center/support-reports?status=open&limit=25',
      ),
    )

    expect(response.status).toBe(200)
    expect(listOperatorSupportReportsMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      { status: 'open', limit: 25 },
    )
    await expect(response.json()).resolves.toEqual({
      ok: true,
      reports: [
        {
          id: 'report-1',
          status: 'open',
          urgency: 'showtime_urgent',
          title: 'Live Queue stale',
        },
      ],
    })
  })

  it('updates support report status for dashboard triage', async () => {
    updateOperatorSupportReportStatusMock.mockResolvedValueOnce({
      id: 'report-1',
      status: 'reviewing',
    })

    const response = await PATCH(
      new Request('http://localhost/api/control-center/support-reports', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'reviewing',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(updateOperatorSupportReportStatusMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      {
        reportId: 'report-1',
        status: 'reviewing',
      },
    )
    await expect(response.json()).resolves.toEqual({
      ok: true,
      report: {
        id: 'report-1',
        status: 'reviewing',
      },
    })
  })

  it('returns 401 for unauthenticated operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await GET(
      new Request('http://localhost/api/control-center/support-reports'),
    )

    expect(response.status).toBe(401)
    expect(listOperatorSupportReportsMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })

  it('returns 403 for authenticated non-operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const response = await PATCH(
      new Request('http://localhost/api/control-center/support-reports', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'reviewing',
        }),
      }),
    )

    expect(response.status).toBe(403)
    expect(updateOperatorSupportReportStatusMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })

  it('rejects invalid status updates before writing', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/control-center/support-reports', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'invalid',
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(updateOperatorSupportReportStatusMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'Check the report status and try again.',
    })
  })
})
