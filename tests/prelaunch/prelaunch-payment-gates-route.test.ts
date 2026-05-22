import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const checkoutCreateMock = vi.fn()
const sendPrelaunchEmailMock = vi.fn()
const paymentGateInsertMock = vi.fn()
const launchBuildSingleMock = vi.fn()
const launchBuildEqMock = vi.fn(() => ({ single: launchBuildSingleMock }))
const launchBuildSelectMock = vi.fn(() => ({ eq: launchBuildEqMock }))
const fromMock = vi.fn((table: string) => {
  if (table === 'sparkle_suite_launch_builds') {
    return { select: launchBuildSelectMock }
  }

  return { insert: paymentGateInsertMock }
})

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

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

vi.mock('@/lib/stripe/client', () => ({
  stripeEnabled: () => true,
  getStripe: () => ({
    checkout: {
      sessions: {
        create: checkoutCreateMock,
      },
    },
  }),
}))

vi.mock('@/lib/stripe/config', () => ({
  getAppUrl: () => 'http://localhost:3000',
}))

vi.mock('@/lib/prelaunch/waitlist-email', () => ({
  sendPrelaunchEmail: (...args: unknown[]) => sendPrelaunchEmailMock(...args),
}))

import { POST } from '@/app/api/prelaunch/payment-gates/checkout/route'

describe('POST /api/prelaunch/payment-gates/checkout', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    checkoutCreateMock.mockReset()
    sendPrelaunchEmailMock.mockReset()
    paymentGateInsertMock.mockReset()
    launchBuildSingleMock.mockReset()
    launchBuildEqMock.mockClear()
    launchBuildSelectMock.mockClear()
    fromMock.mockClear()
    delete process.env.STRIPE_PRICE_START_WORK_FEE
    delete process.env.STRIPE_PRICE_LAUNCH_FEE
    delete process.env.STRIPE_PRICE_BUILD_FEE
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

  it('creates a Stripe test checkout and emails the customer when a price ID is configured', async () => {
    process.env.STRIPE_PRICE_START_WORK_FEE = 'price_start_123'
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    launchBuildSingleMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: null,
        lead_name: 'Sparkle Customer',
        lead_email: 'customer@example.com',
      },
      error: null,
    })
    checkoutCreateMock.mockResolvedValueOnce({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
      customer: null,
      amount_total: 50000,
      currency: 'usd',
      livemode: false,
    })
    sendPrelaunchEmailMock.mockResolvedValueOnce({
      status: 'sent',
      providerId: 'email-1',
    })
    paymentGateInsertMock.mockResolvedValueOnce({ error: null })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/payment-gates/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          gateType: 'start_work_fee',
          launchBuildId: 'build-1',
        }),
      }),
    )

    expect(checkoutCreateMock).toHaveBeenCalledWith({
      mode: 'payment',
      customer_email: 'customer@example.com',
      line_items: [{ price: 'price_start_123', quantity: 1 }],
      success_url:
        'http://localhost/prelaunch/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost/prelaunch/payment/cancelled',
      metadata: expect.objectContaining({
        sparkle_suite_payment_gate: 'true',
        payment_gate: 'start_work_fee',
        launch_build_id: 'build-1',
        waitlist_id: 'waitlist-1',
        lead_email: 'customer@example.com',
      }),
    })
    expect(paymentGateInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gate_type: 'start_work_fee',
        status: 'checkout_created',
        launch_build_id: 'build-1',
        stripe_checkout_session_id: 'cs_test_123',
        checkout_email_status: 'sent',
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      code: 'PAYMENT_GATE_CHECKOUT_CREATED',
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session',
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

  it('returns 401 for unauthenticated requests before checkout prep', async () => {
    process.env.STRIPE_PRICE_START_WORK_FEE = 'price_start_123'
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('not signed in'),
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

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
