import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()
const activatePendingWorkspaceTrialMock = vi.fn()

vi.mock('@/lib/supabase/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/supabase/auth')>()
  return {
    ...original,
    getAuthenticatedRep: (...args: unknown[]) =>
      getAuthenticatedRepMock(...args),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/workspace-access', () => ({
  activatePendingWorkspaceTrial: (...args: unknown[]) =>
    activatePendingWorkspaceTrialMock(...args),
}))

import { POST } from '@/app/api/account/activate-trial/route'
import { AuthError } from '@/lib/supabase/auth'

describe('POST /api/account/activate-trial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({ kind: 'admin' })
  })

  it('activates an authenticated rep trial idempotently', async () => {
    getAuthenticatedRepMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    activatePendingWorkspaceTrialMock.mockResolvedValue({
      status: 'active',
      firstSignedInAt: '2026-08-02T14:00:00.000Z',
      expiresAt: '2026-08-07T14:00:00.000Z',
    })

    const response = await POST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      activated: true,
      trialStartsAt: '2026-08-02T14:00:00.000Z',
      trialEndsAt: '2026-08-07T14:00:00.000Z',
    })
    expect(activatePendingWorkspaceTrialMock).toHaveBeenCalledWith({
      supabase: { kind: 'admin' },
      repId: 'rep-1',
    })
  })

  it('rejects unauthenticated activation', async () => {
    getAuthenticatedRepMock.mockRejectedValue(new AuthError('no session'))

    const response = await POST()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
    expect(activatePendingWorkspaceTrialMock).not.toHaveBeenCalled()
  })
})
