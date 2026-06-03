import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedRepMock, getRequiredSetupStateMock } = vi.hoisted(() => ({
  getAuthenticatedRepMock: vi.fn(),
  getRequiredSetupStateMock: vi.fn(),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/self-serve/required-setup', () => ({
  getRequiredSetupState: (...args: unknown[]) => getRequiredSetupStateMock(...args),
}))

describe('/api/self-serve/setup-state', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
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
    const { GET } = await import('@/app/api/self-serve/setup-state/route')

    const response = await GET()

    expect(getRequiredSetupStateMock).toHaveBeenCalledWith('rep-1')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      state: {
        status: 'required_setup',
        currentStep: 'account_basics',
        completedSteps: [],
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
