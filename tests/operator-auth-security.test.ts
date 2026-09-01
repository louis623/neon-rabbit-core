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
  const originalSessionSecret = process.env.CONTROL_CENTER_SESSION_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = originalNodeEnv
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS = originalDevBypass
    process.env.INTERNAL_OPERATOR_EMAILS = originalOperatorEmails
    process.env.CONTROL_CENTER_OWNER_EMAILS = originalOwnerEmails
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
})
