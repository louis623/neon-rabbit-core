import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()
const cookieGetMock = vi.fn()

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (...args: unknown[]) => cookieGetMock(...args) }),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AuthError'
    }
  },
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import {
  AuthError,
  createControlCenterSessionValue,
  getAuthenticatedOperator,
  getControlCenterAccess,
} from '@/lib/supabase/operator-auth'

describe('operator auth security', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalDevBypass = process.env.CONTROL_CENTER_DEV_AUTH_BYPASS
  const originalOperatorEmails = process.env.INTERNAL_OPERATOR_EMAILS
  const originalOwnerEmails = process.env.CONTROL_CENTER_OWNER_EMAILS
  const originalAccountingViewerEmails = process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAILS
  const originalAccountingViewerUsername = process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_USERNAME
  const originalAccountingViewerPassword = process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_PASSWORD
  const originalAccountingViewerOperatorEmail = process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAIL
  const originalSessionSecret = process.env.CONTROL_CENTER_SESSION_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = originalNodeEnv
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS = originalDevBypass
    process.env.INTERNAL_OPERATOR_EMAILS = originalOperatorEmails
    process.env.CONTROL_CENTER_OWNER_EMAILS = originalOwnerEmails
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAILS = originalAccountingViewerEmails
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_USERNAME = originalAccountingViewerUsername
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_PASSWORD = originalAccountingViewerPassword
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAIL = originalAccountingViewerOperatorEmail
    process.env.CONTROL_CENTER_SESSION_SECRET = originalSessionSecret
  })

  it('does not honor the Control Center dev bypass in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS = 'true'
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('missing session'))

    await expect(getAuthenticatedOperator()).rejects.toThrow('missing session')
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('revalidates the signed Control Center identity against the current operator record', async () => {
    process.env.CONTROL_CENTER_SESSION_SECRET = 'test-control-center-secret'
    process.env.INTERNAL_OPERATOR_EMAILS = 'louis@example.com'
    process.env.CONTROL_CENTER_OWNER_EMAILS = 'louis@example.com'
    const operator = {
      repId: 'operator-1',
      rep: {
        auth_user_id: 'auth-1',
        email: 'louis@example.com',
      },
    } as Parameters<typeof createControlCenterSessionValue>[0]
    cookieGetMock.mockReturnValue({ value: createControlCenterSessionValue(operator).value })
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'operator-1',
            auth_user_id: 'different-auth-user',
            email: 'louis@example.com',
            status: 'active',
          },
          error: null,
        }),
      }),
    })

    await expect(getControlCenterAccess()).rejects.toThrow(
      'no longer authorized',
    )
  })

  it('permits an accounting viewer only on the accounting opt-in path', async () => {
    process.env.CONTROL_CENTER_SESSION_SECRET = 'test-control-center-secret'
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAILS = 'lane-accounting@example.com'
    const operator = {
      repId: 'lane-operator-1',
      rep: { auth_user_id: 'lane-auth-1', email: 'lane-accounting@example.com' },
    } as Parameters<typeof createControlCenterSessionValue>[0]
    cookieGetMock.mockReturnValue({ value: createControlCenterSessionValue(operator).value })
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'lane-operator-1',
            auth_user_id: 'lane-auth-1',
            email: 'lane-accounting@example.com',
            status: 'active',
          },
          error: null,
        }),
      }),
    })

    await expect(getControlCenterAccess()).rejects.toThrow('assigned area')
    await expect(getControlCenterAccess({ allowAccountingViewer: true })).resolves.toMatchObject({
      scope: 'accounting_viewer',
      operator: { email: 'lane-accounting@example.com' },
    })
  })

  it('accepts only the dedicated accounting-viewer credential', async () => {
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAILS = 'lane-accounting@example.com'
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_USERNAME = 'accounting_viewer'
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_PASSWORD = 'test-lane-password'
    process.env.CONTROL_CENTER_ACCOUNTING_VIEWER_OPERATOR_EMAIL = 'lane-accounting@example.com'
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'lane-operator-1', auth_user_id: 'lane-auth-1', email: 'lane-accounting@example.com' },
          error: null,
        }),
      }),
    })

    const { authenticateControlCenterOperator } = await import('@/lib/supabase/operator-auth')
    await expect(authenticateControlCenterOperator('accounting_viewer', 'test-lane-password')).resolves.toMatchObject({
      repId: 'lane-operator-1',
    })
    await expect(authenticateControlCenterOperator('accounting_viewer', 'wrong-password')).rejects.toThrow('not valid')
  })
})
