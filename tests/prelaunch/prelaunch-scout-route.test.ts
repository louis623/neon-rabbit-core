import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const runPrelaunchScoutForIntakeMock = vi.fn()

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

vi.mock('@/lib/prelaunch/scout', () => ({
  runPrelaunchScoutForIntake: (...args: unknown[]) =>
    runPrelaunchScoutForIntakeMock(...args),
}))

import { POST } from '@/app/api/prelaunch/scout/route'

describe('POST /api/prelaunch/scout', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    runPrelaunchScoutForIntakeMock.mockReset()
  })

  it('runs Scout for one intake id for an authenticated operator', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    runPrelaunchScoutForIntakeMock.mockResolvedValueOnce({
      runKey: 'scout:intake-1:2026-05-09T19:00:00.000Z',
      output: {
        briefTitle: 'Scout brief: Jamie Hart Jewelry',
        recommendedNextStep: 'operator_review_first',
      },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/scout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId: 'intake-1' }),
      }),
    )

    expect(runPrelaunchScoutForIntakeMock).toHaveBeenCalledWith({
      intakeId: 'intake-1',
      operatorRepId: 'rep-1',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      runKey: 'scout:intake-1:2026-05-09T19:00:00.000Z',
      output: {
        briefTitle: 'Scout brief: Jamie Hart Jewelry',
        recommendedNextStep: 'operator_review_first',
      },
    })
  })

  it('rejects missing intake ids', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/scout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'intakeId is required.',
    })
  })

  it('returns 403 for non-operator reps', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('nope'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/scout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId: 'intake-1' }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })
})
