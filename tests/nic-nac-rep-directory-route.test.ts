import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const directoryMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) => authMock(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ marker: 'admin' }) }))
vi.mock('@/lib/services/workspace-conversation-eligibility', () => ({
  listEligibleRepNetworkDirectory: (...args: unknown[]) => directoryMock(...args),
}))

import { GET } from '@/app/api/nic-nac/conversations/rep-directory/route'

describe('Rep Network directory route', () => {
  beforeEach(() => {
    authMock.mockReset()
    directoryMock.mockReset()
  })

  it('returns only the server-filtered public directory DTO', async () => {
    authMock.mockResolvedValueOnce({ repId: 'rep-caller' })
    directoryMock.mockResolvedValueOnce([{ repId: 'rep-2', displayName: 'Jamie', businessName: 'Jamie Sparkles', contextLabel: 'Jamie Sparkles' }])
    const response = await GET(new Request('http://localhost/api/nic-nac/conversations/rep-directory?limit=25'))
    expect(directoryMock).toHaveBeenCalledWith({ marker: 'admin' }, 'rep-caller', { limit: 25 })
    await expect(response.json()).resolves.toEqual({ reps: [{ repId: 'rep-2', displayName: 'Jamie', businessName: 'Jamie Sparkles', contextLabel: 'Jamie Sparkles' }] })
  })

  it('rejects an unsafe limit before authentication', async () => {
    const response = await GET(new Request('http://localhost/api/nic-nac/conversations/rep-directory?limit=500'))
    expect(response.status).toBe(400)
    expect(authMock).not.toHaveBeenCalled()
  })
})
