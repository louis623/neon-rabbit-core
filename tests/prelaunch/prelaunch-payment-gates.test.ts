import { describe, expect, it } from 'vitest'

import {
  buildPrelaunchPaymentGateMetadata,
  getPrelaunchPaymentGatePriceId,
  normalizePrelaunchPaymentGateType,
} from '@/lib/prelaunch/payment-gates'

describe('prelaunch payment gates', () => {
  it('normalizes the supported Phase 8 payment gate types', () => {
    expect(normalizePrelaunchPaymentGateType('start_work_fee')).toBe(
      'start_work_fee',
    )
    expect(normalizePrelaunchPaymentGateType('launch_fee')).toBe('launch_fee')
    expect(normalizePrelaunchPaymentGateType('sms_wallet')).toBeNull()
  })

  it('maps payment gate types to optional Stripe price IDs without hardcoded amounts', () => {
    expect(
      getPrelaunchPaymentGatePriceId('start_work_fee', {
        STRIPE_PRICE_START_WORK_FEE: 'price_start_123',
      }),
    ).toBe('price_start_123')
    expect(
      getPrelaunchPaymentGatePriceId('launch_fee', {
        STRIPE_PRICE_LAUNCH_FEE: 'price_launch_123',
      }),
    ).toBe('price_launch_123')
    expect(getPrelaunchPaymentGatePriceId('start_work_fee', {})).toBeNull()
  })

  it('builds the Stripe metadata contract for future gate checkout sessions', () => {
    expect(
      buildPrelaunchPaymentGateMetadata({
        gateType: 'start_work_fee',
        intakeId: 'intake-1',
        waitlistId: 'waitlist-1',
        operatorRepId: 'rep-1',
      }),
    ).toEqual({
      platform: 'sparkle_suite',
      payment_gate: 'start_work_fee',
      sparkle_suite_payment_gate: 'true',
      intake_submission_id: 'intake-1',
      waitlist_id: 'waitlist-1',
      operator_rep_id: 'rep-1',
    })
  })
})
