import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createAdminClientMock,
  getAuthenticatedRepMock,
  ensureLiveQueueSyncCodeForRepMock,
  getLiveQueueSyncCodeForRepMock,
  getRequiredSetupStateMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  getAuthenticatedRepMock: vi.fn(),
  ensureLiveQueueSyncCodeForRepMock: vi.fn(),
  getLiveQueueSyncCodeForRepMock: vi.fn(),
  getRequiredSetupStateMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/services/live-queue', () => ({
  ensureLiveQueueSyncCodeForRep: (...args: unknown[]) =>
    ensureLiveQueueSyncCodeForRepMock(...args),
  getLiveQueueSyncCodeForRep: (...args: unknown[]) =>
    getLiveQueueSyncCodeForRepMock(...args),
}))

vi.mock('@/lib/self-serve/required-setup', () => ({
  getRequiredSetupState: (...args: unknown[]) => getRequiredSetupStateMock(...args),
}))

describe('/api/self-serve/setup-state', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    getAuthenticatedRepMock.mockReset()
    ensureLiveQueueSyncCodeForRepMock.mockReset()
    getLiveQueueSyncCodeForRepMock.mockReset()
    getRequiredSetupStateMock.mockReset()
  })

  it('returns setup state for authenticated reps', async () => {
    getAuthenticatedRepMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    getRequiredSetupStateMock.mockResolvedValue({
      status: 'required_setup',
      currentStep: 'account_basics',
      completedSteps: [],
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    getLiveQueueSyncCodeForRepMock.mockResolvedValue('MHF-7342')
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(getRequiredSetupStateMock).toHaveBeenCalledWith('rep-1')
    expect(getLiveQueueSyncCodeForRepMock).toHaveBeenCalledWith(
      expect.any(Object),
      'rep-1',
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      state: {
        status: 'required_setup',
        currentStep: 'account_basics',
        completedSteps: [],
        liveQueueSyncCode: 'MHF-7342',
      },
    })
  })

  it('creates a saved Live Queue sync code when required setup has none yet', async () => {
    getAuthenticatedRepMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    getRequiredSetupStateMock.mockResolvedValue({
      status: 'required_setup',
      currentStep: 'live_queue_setup',
      completedSteps: ['account_basics'],
    })
    const admin = { from: vi.fn() }
    createAdminClientMock.mockReturnValue(admin)
    getLiveQueueSyncCodeForRepMock.mockResolvedValue(null)
    ensureLiveQueueSyncCodeForRepMock.mockResolvedValue({
      syncCode: 'GFF-7342',
      created: true,
    })
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(getLiveQueueSyncCodeForRepMock).toHaveBeenCalledWith(admin, 'rep-1')
    expect(ensureLiveQueueSyncCodeForRepMock).toHaveBeenCalledWith(admin, {
      repId: 'rep-1',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      state: {
        status: 'required_setup',
        currentStep: 'live_queue_setup',
        completedSteps: ['account_basics'],
        liveQueueSyncCode: 'GFF-7342',
      },
    })
  })

  it('returns 401 when the rep is not authenticated', async () => {
    const { AuthError } = await import('@/lib/supabase/auth')
    getAuthenticatedRepMock.mockRejectedValue(new AuthError('Not authenticated'))
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Not authenticated',
    })
    expect(getRequiredSetupStateMock).not.toHaveBeenCalled()
  })

  it('returns 500 when setup state cannot be loaded', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getAuthenticatedRepMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    getRequiredSetupStateMock.mockRejectedValue(new Error('database unavailable'))
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load setup state',
    })
    consoleErrorSpy.mockRestore()
  })
})
