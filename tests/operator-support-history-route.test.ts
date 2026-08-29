import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()

const { MockAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: MockAuthError,
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { GET } from '@/app/api/nic-nac/support-access-history/route'

describe('rep-visible operator support history route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedRepMock.mockResolvedValue({ repId: 'rep-kim' })
  })

  it('hard-scopes history to the authenticated rep target', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    createAdminClientMock.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })

    const response = await GET()

    expect(response.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('target_rep_id', 'rep-kim')
    expect(chain.in).toHaveBeenCalledWith('status', [
      'active',
      'ended',
      'expired',
      'revoked',
    ])
  })

  it('never reveals history without a rep session', async () => {
    getAuthenticatedRepMock.mockRejectedValueOnce(new MockAuthError('missing'))

    const response = await GET()

    expect(response.status).toBe(401)
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })
})
