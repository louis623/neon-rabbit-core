import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const upsertPrelaunchLaunchCheckMock = vi.fn()

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

vi.mock('@/lib/prelaunch/launch-checks', () => ({
  upsertPrelaunchLaunchCheck: (...args: unknown[]) =>
    upsertPrelaunchLaunchCheckMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/launch-check/route'

describe('POST /api/control-center/intake/launch-check', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    upsertPrelaunchLaunchCheckMock.mockReset()
  })

  it('saves an operator-only launch check without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchCheckMock.mockResolvedValueOnce({
      id: 'check-1',
      launchBuildId: 'build-1',
      checkKey: 'setup_profile_ready',
      status: 'passed',
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          checkKey: 'setup_profile_ready',
          status: 'passed',
          notes: 'Profile reviewed.',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchCheckMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      checkKey: 'setup_profile_ready',
      status: 'passed',
      notes: 'Profile reviewed.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      check: {
        id: 'check-1',
        launchBuildId: 'build-1',
        checkKey: 'setup_profile_ready',
        status: 'passed',
      },
    })
  })

  it('redirects form saves back to the active build', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchCheckMock.mockResolvedValueOnce({ id: 'check-1' })

    const form = new FormData()
    form.set('launchBuildId', 'build-1')
    form.set('checkKey', 'site_shell_review')
    form.set('status', 'blocked')
    form.set('notes', 'Need URL draft.')
    form.set('returnTo', '/control-center/intake#launch-checks')

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-check', {
        method: 'POST',
        body: form,
      }),
    )

    expect(upsertPrelaunchLaunchCheckMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      checkKey: 'site_shell_review',
      status: 'blocked',
      notes: 'Need URL draft.',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake#launch-checks',
    )
  })

  it('rejects missing build id before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkKey: 'site_shell_review' }),
      }),
    )

    expect(upsertPrelaunchLaunchCheckMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          checkKey: 'site_shell_review',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchCheckMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
