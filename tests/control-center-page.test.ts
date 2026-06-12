import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createAdminClientMock = vi.fn()
const listOperatorSupportReportsMock = vi.fn()
const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`)
})

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('next/navigation', () => ({
  redirect: (target: string) => redirectMock(target),
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
}))

vi.mock(
  '@/app/internal/prelaunch/intake/_components/ControlCenterThemeToggle',
  () => ({
    ControlCenterThemeToggle: () => createElement('div', null, 'Theme toggle'),
  }),
)

import SparkleSuiteControlCenterPage from '@/app/control-center/page'

describe('SparkleSuiteControlCenterPage', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createAdminClientMock.mockReset()
    listOperatorSupportReportsMock.mockReset()
    redirectMock.mockClear()
    getAuthenticatedOperatorMock.mockResolvedValue({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    listOperatorSupportReportsMock.mockResolvedValue([
      {
        id: 'report-1',
        report_type: 'bug',
        urgency: 'blocking',
        status: 'open',
        audit_status: 'completed',
        source: 'help_form',
        title: 'Trade Board item vanished',
        page_or_workflow: 'Trade Board',
        details: 'The replacement listing did not show after approval.',
        client_snapshot: {
          clientName: 'Jane Roberts',
          showName: "Jane's Sparkle Party",
          phone: '555-123-4567',
          email: 'jane@example.com',
        },
        created_at: '2026-06-12T17:00:00.000Z',
      },
    ])
  })

  it('renders the Support Command Center instead of redirecting to intake', async () => {
    const page = await SparkleSuiteControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(redirectMock).not.toHaveBeenCalled()
    expect(getAuthenticatedOperatorMock).toHaveBeenCalledOnce()
    expect(listOperatorSupportReportsMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      { limit: 50 },
    )
    expect(html).toContain('Support Command Center')
    expect(html).toContain('Support Inbox')
    expect(html).toContain('Report Detail')
    expect(html).toContain('Client Profile')
    expect(html).toContain('Resolution')
    expect(html).toContain('Trade Board item vanished')
    expect(html).toContain('Jane Roberts')
    expect(html).toContain("Jane&#x27;s Sparkle Party")
  })

  it('redirects unauthenticated operators to login', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    await expect(SparkleSuiteControlCenterPage()).rejects.toThrow(
      'redirect:/login',
    )

    expect(listOperatorSupportReportsMock).not.toHaveBeenCalled()
  })

  it('renders an operator access required message for non-operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const page = await SparkleSuiteControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Operator access required')
    expect(listOperatorSupportReportsMock).not.toHaveBeenCalled()
  })
})
