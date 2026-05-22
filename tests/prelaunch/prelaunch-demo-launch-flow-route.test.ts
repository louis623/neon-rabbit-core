import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const runDemoLaunchRunMock = vi.fn()

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

vi.mock('@/lib/prelaunch/demo-launch-run', () => ({
  runDemoLaunchRun: (...args: unknown[]) => runDemoLaunchRunMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/demo-launch-flow/route'

describe('POST /api/control-center/intake/demo-launch-flow', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    runDemoLaunchRunMock.mockReset()
  })

  it('runs the demo-only launch flow from JSON', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    runDemoLaunchRunMock.mockResolvedValueOnce({
      ok: true,
      launchBuildId: 'build-1',
      repId: 'rep-1',
      providerActions: {
        sendSms: false,
        sendEmail: false,
        sendSignWellLiveAgreement: false,
        chargeStripe: false,
        callPaidNicNac: false,
        attachReservedPhone: false,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/demo-launch-flow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          demoRepEmail: 'louis+demo@example.com',
          leadName: 'Demo Lead',
          businessName: 'Demo Sparkle Studio',
        }),
      }),
    )

    expect(runDemoLaunchRunMock).toHaveBeenCalledWith({
      demoRepEmail: 'louis+demo@example.com',
      leadName: 'Demo Lead',
      businessName: 'Demo Sparkle Studio',
      operatorRepId: 'operator-1',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      result: {
        launchBuildId: 'build-1',
        providerActions: {
          sendEmail: false,
          sendSms: false,
        },
      },
    })
  })

  it('redirects form runs back to the roster panel', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    runDemoLaunchRunMock.mockResolvedValueOnce({ ok: true })

    const form = new FormData()
    form.set('demoRepEmail', 'louis+demo@example.com')
    form.set('leadName', 'Demo Lead')
    form.set('businessName', 'Demo Sparkle Studio')
    form.set('returnTo', '/control-center/intake#reps')

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/demo-launch-flow', {
        method: 'POST',
        body: form,
      }),
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake#reps',
    )
  })

  it('returns 401 without running the demo when unauthenticated', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/demo-launch-flow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          demoRepEmail: 'louis+demo@example.com',
        }),
      }),
    )

    expect(runDemoLaunchRunMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
  })
})
