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

import { POST } from '@/app/api/prelaunch/payment-gates/checkout/route'

describe('POST /api/prelaunch/payment-gates/checkout', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    delete process.env.STRIPE_PRICE_START_WORK_FEE
    delete process.env.STRIPE_PRICE_LAUNCH_FEE
  })

  it('returns not_configured before a Stripe price ID exists for the gate', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/payment-gates/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'start_work_fee',
          intakeId: 'intake-1',
          waitlistId: 'waitlist-1',
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'PAYMENT_GATE_PRICE_NOT_CONFIGURED',
      error:
        'The Stripe price for this payment gate is not configured yet.',
      gateType: 'start_work_fee',
      metadata: {
        platform: 'sparkle_suite',
        payment_gate: 'start_work_fee',
        sparkle_suite_payment_gate: 'true',
        intake_submission_id: 'intake-1',
        waitlist_id: 'waitlist-1',
        operator_rep_id: 'operator-rep-1',
      },
    })
  })

  it('rejects unsupported gate types before doing payment work', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/payment-gates/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'sms_wallet',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'gateType must be start_work_fee or launch_fee.',
    })
  })

  it('keeps checkout disabled even after a price ID is configured', async () => {
    process.env.STRIPE_PRICE_START_WORK_FEE = 'price_start_123'
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/payment-gates/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'start_work_fee',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(501)
    await expect(response.json()).resolves.toEqual({
      code: 'PAYMENT_GATE_CHECKOUT_NOT_ENABLED',
      error:
        'Payment gate checkout is waiting for final Stripe price review.',
      gateType: 'start_work_fee',
      priceId: 'price_start_123',
      metadata: {
        platform: 'sparkle_suite',
        payment_gate: 'start_work_fee',
        sparkle_suite_payment_gate: 'true',
        intake_submission_id: 'intake-1',
        waitlist_id: null,
        operator_rep_id: 'operator-rep-1',
      },
    })
  })

  it('returns 403 for non-operator reps', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('nope'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/payment-gates/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'start_work_fee',
          intakeId: 'intake-1',
        }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })
})
