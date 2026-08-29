import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getControlCenterAccessMock = vi.fn()
const createAdminClientMock = vi.fn()
const verifyAccessMock = vi.fn()
const resolveWorkspaceAccessMock = vi.fn()
const cookieGetMock = vi.fn()

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (...args: unknown[]) => cookieGetMock(...args) }),
}))
vi.mock('@/lib/supabase/operator-auth', () => ({
  getControlCenterAccess: (...args: unknown[]) => getControlCenterAccessMock(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))
vi.mock('@/lib/operator-support/session-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/operator-support/session-service')>()
  return {
    ...actual,
    verifyOperatorSupportSessionAccess: (...args: unknown[]) => verifyAccessMock(...args),
  }
})
vi.mock('@/lib/services/workspace-access', () => ({
  resolveWorkspaceAccess: (...args: unknown[]) => resolveWorkspaceAccessMock(...args),
}))

import { loadVerifiedOperatorSupportContext } from '@/lib/operator-support/http'

function targetQuery(target: Record<string, unknown>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: target, error: null }),
  }
}

describe('operator support HTTP boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getControlCenterAccessMock.mockResolvedValue({ operator: { repId: 'operator-1' } })
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(
        targetQuery({ id: 'rep-kim', status: 'active', public_site_slug: 'kim' }),
      ),
    })
    verifyAccessMock.mockResolvedValue({
      session: {
        id: 'session-1',
        operatorRepId: 'operator-1',
        targetRepId: 'rep-kim',
      },
      actor: { mode: 'operator_support' },
    })
    resolveWorkspaceAccessMock.mockResolvedValue({ hasFullAccess: true })
  })

  it('requires an exact same-origin request for every mutation', async () => {
    await expect(
      loadVerifiedOperatorSupportContext('session-1', {
        capability: 'site.manage',
        mutation: true,
        request: new Request('https://www.yoursparklesuite.com/api/support', {
          method: 'POST',
          headers: {
            origin: 'https://portal.yoursparklesuite.com',
            'x-sparkle-support-csrf': 'csrf-secret',
          },
        }),
      }),
    ).rejects.toMatchObject({ code: 'SUPPORT_CSRF_INVALID' })
    expect(verifyAccessMock).not.toHaveBeenCalled()
  })

  it('never falls back to the cookie token for mutations', async () => {
    cookieGetMock.mockReturnValue({ value: 'cookie-secret' })

    await loadVerifiedOperatorSupportContext('session-1', {
      capability: 'site.manage',
      mutation: true,
      request: new Request('https://www.yoursparklesuite.com/api/support', {
        method: 'POST',
        headers: { origin: 'https://www.yoursparklesuite.com' },
      }),
    })

    expect(verifyAccessMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mutation: true, csrfToken: null }),
    )
  })

  it('denies a session immediately when the target becomes inactive', async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(
        targetQuery({ id: 'rep-kim', status: 'inactive', public_site_slug: 'kim' }),
      ),
    })

    await expect(
      loadVerifiedOperatorSupportContext('session-1', {
        capability: 'workspace.view',
        mutation: false,
      }),
    ).rejects.toMatchObject({ code: 'SUPPORT_TARGET_INELIGIBLE' })
  })
})
