import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const upsertPrelaunchLaunchGateMock = vi.fn()

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

vi.mock('@/lib/prelaunch/launch-gates', () => ({
  upsertPrelaunchLaunchGate: (...args: unknown[]) =>
    upsertPrelaunchLaunchGateMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/launch-gate/route'

describe('POST /api/control-center/intake/launch-gate', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    upsertPrelaunchLaunchGateMock.mockReset()
  })

  it('saves an operator-only launch gate without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchGateMock.mockResolvedValueOnce({
      id: 'gate-1',
      launchBuildId: 'build-1',
      gateKey: 'payment',
      status: 'ready',
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-gate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          gateKey: 'payment',
          status: 'ready',
          notes: 'Stripe test config reviewed.',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchGateMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      gateKey: 'payment',
      status: 'ready',
      notes: 'Stripe test config reviewed.',
      operatorRepId: 'operator-1',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      gate: {
        id: 'gate-1',
        launchBuildId: 'build-1',
        gateKey: 'payment',
        status: 'ready',
      },
    })
  })

  it('redirects form saves back to the launch gates panel', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    upsertPrelaunchLaunchGateMock.mockResolvedValueOnce({ id: 'gate-1' })

    const form = new FormData()
    form.set('launchBuildId', 'build-1')
    form.set('gateKey', 'agreement')
    form.set('status', 'ready')
    form.set('notes', 'SignWell sandbox payload reviewed.')
    form.set('returnTo', '/control-center/intake#launch-gates')

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-gate', {
        method: 'POST',
        body: form,
      }),
    )

    expect(upsertPrelaunchLaunchGateMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      gateKey: 'agreement',
      status: 'ready',
      notes: 'SignWell sandbox payload reviewed.',
      operatorRepId: 'operator-1',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake#launch-gates',
    )
  })

  it('rejects missing build id before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-gate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gateKey: 'payment' }),
      }),
    )

    expect(upsertPrelaunchLaunchGateMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/launch-gate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          gateKey: 'payment',
        }),
      }),
    )

    expect(upsertPrelaunchLaunchGateMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
