import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const upsertPrelaunchLaunchSetupProfileMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/prelaunch/setup-profiles', () => ({
  upsertPrelaunchLaunchSetupProfile: (...args: unknown[]) =>
    upsertPrelaunchLaunchSetupProfileMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/setup-profile/route'

describe('POST /api/control-center/intake/setup-profile', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    upsertPrelaunchLaunchSetupProfileMock.mockReset()
  })

  it('saves an operator-only setup profile without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchSetupProfileMock.mockResolvedValueOnce({
      id: 'profile-1',
      launchBuildId: 'build-1',
      businessName: 'Sparkle Demo Shop',
      status: 'draft',
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/setup-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          businessName: 'Sparkle Demo Shop',
          publicSiteGoal: 'Launch a clean hub.',
          openQuestions: ['Confirm logo.', 'Confirm launch date.'],
          status: 'draft',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchSetupProfileMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      businessName: 'Sparkle Demo Shop',
      publicSiteGoal: 'Launch a clean hub.',
      primarySocialUrl: null,
      secondarySocialUrl: null,
      shopUrl: null,
      brandNotes: '',
      mustHaveLaunchNotes: '',
      openQuestions: ['Confirm logo.', 'Confirm launch date.'],
      status: 'draft',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      profile: {
        id: 'profile-1',
        launchBuildId: 'build-1',
        businessName: 'Sparkle Demo Shop',
        status: 'draft',
      },
    })
  })

  it('redirects form saves back to the Control Center', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchSetupProfileMock.mockResolvedValueOnce({
      id: 'profile-1',
    })

    const form = new FormData()
    form.set('launchBuildId', 'build-1')
    form.set('businessName', 'Sparkle Demo Shop')
    form.set('publicSiteGoal', 'Launch a clean hub.')
    form.set('openQuestions', 'Confirm logo.\nConfirm launch date.')
    form.set('returnTo', '/control-center/intake#active-client')

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/setup-profile', {
        method: 'POST',
        body: form,
      }),
    )

    expect(upsertPrelaunchLaunchSetupProfileMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      businessName: 'Sparkle Demo Shop',
      publicSiteGoal: 'Launch a clean hub.',
      primarySocialUrl: null,
      secondarySocialUrl: null,
      shopUrl: null,
      brandNotes: '',
      mustHaveLaunchNotes: '',
      openQuestions: ['Confirm logo.', 'Confirm launch date.'],
      status: 'draft',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake#active-client',
    )
  })

  it('rejects saves without a launch build id before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/setup-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ businessName: 'Sparkle Demo Shop' }),
      }),
    )

    expect(upsertPrelaunchLaunchSetupProfileMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/setup-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          businessName: 'Sparkle Demo Shop',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchSetupProfileMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
