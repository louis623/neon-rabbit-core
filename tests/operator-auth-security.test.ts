import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()

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

import { AuthError, getAuthenticatedOperator } from '@/lib/supabase/operator-auth'

describe('operator auth security', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalDevBypass = process.env.CONTROL_CENTER_DEV_AUTH_BYPASS
  const originalOperatorEmails = process.env.INTERNAL_OPERATOR_EMAILS

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = originalNodeEnv
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS = originalDevBypass
    process.env.INTERNAL_OPERATOR_EMAILS = originalOperatorEmails
  })

  it('does not honor the Control Center dev bypass in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS = 'true'
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('missing session'))

    await expect(getAuthenticatedOperator()).rejects.toThrow('missing session')
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })
})
