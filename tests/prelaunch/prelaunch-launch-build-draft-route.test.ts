import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createPrelaunchLaunchBuildDraftMock = vi.fn()

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

vi.mock('@/lib/prelaunch/launch-builds', () => ({
  createPrelaunchLaunchBuildDraft: (...args: unknown[]) =>
    createPrelaunchLaunchBuildDraftMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/launch-build-draft/route'

describe('POST /api/control-center/intake/launch-build-draft', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createPrelaunchLaunchBuildDraftMock.mockReset()
  })

  it('creates an internal launch build draft for an operator without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createPrelaunchLaunchBuildDraftMock.mockResolvedValueOnce({
      id: 'build-1',
      waitlistId: 'waitlist-1',
      intakeSubmissionId: null,
      stage: 'draft',
      status: 'blocked',
      blockers: ['Payment gate is disabled.'],
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/launch-build-draft',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ waitlistId: 'waitlist-1' }),
        },
      ),
    )

    expect(createPrelaunchLaunchBuildDraftMock).toHaveBeenCalledWith({
      waitlistId: 'waitlist-1',
      intakeSubmissionId: null,
      operatorRepId: 'operator-1',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      build: {
        id: 'build-1',
        waitlistId: 'waitlist-1',
        intakeSubmissionId: null,
        stage: 'draft',
        status: 'blocked',
        blockers: ['Payment gate is disabled.'],
      },
    })
  })

  it('rejects requests without a waitlist or intake id before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/launch-build-draft',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        },
      ),
    )

    expect(createPrelaunchLaunchBuildDraftMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'waitlistId or intakeSubmissionId is required.',
    })
  })

  it('redirects form submissions back to the Control Center after creating a draft', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createPrelaunchLaunchBuildDraftMock.mockResolvedValueOnce({
      id: 'build-1',
      waitlistId: 'waitlist-1',
      intakeSubmissionId: null,
      stage: 'draft',
      status: 'blocked',
      blockers: ['Payment gate is disabled.'],
    })

    const form = new FormData()
    form.set('waitlistId', 'waitlist-1')
    form.set('returnTo', '/control-center/intake')

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/launch-build-draft',
        {
          method: 'POST',
          body: form,
        },
      ),
    )

    expect(createPrelaunchLaunchBuildDraftMock).toHaveBeenCalledWith({
      waitlistId: 'waitlist-1',
      intakeSubmissionId: null,
      operatorRepId: 'operator-1',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake',
    )
  })


  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/launch-build-draft',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ waitlistId: 'waitlist-1' }),
        },
      ),
    )

    expect(createPrelaunchLaunchBuildDraftMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
