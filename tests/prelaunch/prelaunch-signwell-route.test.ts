import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()

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

import { POST } from '@/app/api/prelaunch/signwell/agreement/route'

describe('POST /api/prelaunch/signwell/agreement', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    delete process.env.SIGNWELL_API_KEY
    delete process.env.SIGNWELL_API_BASE_URL
    delete process.env.SIGNWELL_TEMPLATE_ID
    delete process.env.SIGNWELL_SEND_ENABLED
  })

  it('returns not_configured before SignWell send configuration exists', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/signwell/agreement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'service_agreement',
          intakeId: 'intake-1',
          waitlistId: 'waitlist-1',
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'SIGNWELL_NOT_CONFIGURED',
      error: 'SignWell agreement sending is not configured yet.',
      gateType: 'service_agreement',
      metadata: {
        platform: 'sparkle_suite',
        agreement_gate: 'service_agreement',
        sparkle_suite_agreement_gate: 'true',
        intake_submission_id: 'intake-1',
        waitlist_id: 'waitlist-1',
        operator_rep_id: 'operator-rep-1',
      },
    })
  })

  it('keeps agreement sending disabled even after SignWell config is present', async () => {
    process.env.SIGNWELL_API_KEY = 'signwell_api_key'
    process.env.SIGNWELL_API_BASE_URL = 'https://www.signwell.com/api/v1'
    process.env.SIGNWELL_TEMPLATE_ID = 'template_123'
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/signwell/agreement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'service_agreement',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(501)
    await expect(response.json()).resolves.toEqual({
      code: 'SIGNWELL_SEND_NOT_ENABLED',
      error:
        'SignWell agreement sending is waiting for final legal/template review.',
      gateType: 'service_agreement',
      templateId: 'template_123',
      metadata: {
        platform: 'sparkle_suite',
        agreement_gate: 'service_agreement',
        sparkle_suite_agreement_gate: 'true',
        intake_submission_id: 'intake-1',
        waitlist_id: null,
        operator_rep_id: 'operator-rep-1',
      },
    })
  })

  it('rejects unsupported agreement gates before doing provider work', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/signwell/agreement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'trade_clickwrap',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'gateType must be service_agreement.',
    })
  })

  it('returns 403 for non-operator reps', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('nope'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/signwell/agreement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'service_agreement',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })
})
