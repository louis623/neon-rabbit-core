import { describe, expect, it } from 'vitest'

import {
  buildSparkleSuiteCheckoutPricing,
  getMissingSparkleSuitePriceEnv,
} from '@/lib/stripe/sparkle-suite-pricing'

describe('Sparkle Suite checkout pricing', () => {
  const priceIds = {
    buildFee: 'price_build_fee',
    founderMonthly: 'price_founder_monthly',
    standardMonthly: 'price_standard_monthly',
  }

  it('itemizes the build fee and founder monthly price before the first 20 paid reps', () => {
    const pricing = buildSparkleSuiteCheckoutPricing({
      paidSubscriptionStarts: 19,
      priceIds,
    })

    expect(pricing).toEqual({
      ok: true,
      tier: 'founder',
      founderSequence: 20,
      lineItems: [
        { price: 'price_build_fee', quantity: 1 },
        { price: 'price_founder_monthly', quantity: 1 },
      ],
      metadata: {
        pricing_tier: 'founder',
        founder_sequence: '20',
        build_fee_charged: 'true',
        founder_rate_months: '12',
      },
    })
  })

  it('itemizes the build fee and standard monthly price after the founder cohort is full', () => {
    const pricing = buildSparkleSuiteCheckoutPricing({
      paidSubscriptionStarts: 20,
      priceIds,
    })

    expect(pricing).toEqual({
      ok: true,
      tier: 'standard',
      founderSequence: null,
      lineItems: [
        { price: 'price_build_fee', quantity: 1 },
        { price: 'price_standard_monthly', quantity: 1 },
      ],
      metadata: {
        pricing_tier: 'standard',
        founder_sequence: '',
        build_fee_charged: 'true',
        founder_rate_months: '',
      },
    })
  })

  it('reports the exact missing Stripe price env names needed for itemized checkout', () => {
    expect(
      getMissingSparkleSuitePriceEnv({
        buildFee: undefined,
        founderMonthly: 'price_founder_monthly',
        standardMonthly: undefined,
      }),
    ).toEqual(['STRIPE_PRICE_BUILD_FEE', 'STRIPE_PRICE_STANDARD_MONTHLY'])
  })
})
