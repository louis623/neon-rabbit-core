import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

import { GET as getQuestions } from '@/app/api/nic-nac/team-onboarding/questions/route'
import { GET as getSites } from '@/app/api/nic-nac/team-onboarding/sites/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('Nic-Nac team onboarding control-plane routes', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
  })

  it('returns authenticated onboarding sites shell payload', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({ repId: 'rep-1' })

    const response = await getSites()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      sites: [],
      repId: 'rep-1',
    })
  })

  it('returns 401 for unauthenticated onboarding sites requests', async () => {
    getAuthenticatedNicNacContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await getSites()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })

  it('returns authenticated onboarding questions shell payload', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({ repId: 'rep-1' })

    const response = await getQuestions()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      questions: [],
      repId: 'rep-1',
    })
  })

  it('returns 401 for unauthenticated onboarding questions requests', async () => {
    getAuthenticatedNicNacContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await getQuestions()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })
})
