import { describe, expect, it } from 'vitest'

import {
  buildSparkleSuiteCheckoutPricing,
  buildSparkleSuiteTestBuyerCheckoutPricing,
  getMissingSparkleSuitePriceEnv,
  TEST_BUYER_CHECKOUT_AMOUNT_CENTS,
} from '@/lib/stripe/sparkle-suite-pricing'

describe('Sparkle Suite checkout pricing', () => {
  const priceIds = {
    buildFee: 'price_build_fee',
    founderMonthly: 'price_founder_monthly',
    standardMonthly: 'price_standard_monthly',
  }

  it('itemizes the build fee and founder monthly price for the first paid start', () => {
    const pricing = buildSparkleSuiteCheckoutPricing({
      paidSubscriptionStarts: 0,
      priceIds,
    })

    expect(pricing).toEqual({
      ok: true,
      tier: 'founder',
      founderSequence: 1,
      lineItems: [
        { price: 'price_build_fee', quantity: 1 },
        { price: 'price_founder_monthly', quantity: 1 },
      ],
      metadata: {
        pricing_tier: 'founder',
        founder_sequence: '1',
        build_fee_charged: 'true',
        founder_rate_months: '12',
        build_fee_price_id: 'price_build_fee',
        monthly_price_id: 'price_founder_monthly',
      },
    })
  })

  it('keeps founder monthly pricing for the twentieth paid start', () => {
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
        build_fee_price_id: 'price_build_fee',
        monthly_price_id: 'price_founder_monthly',
      },
    })
  })

  it('uses standard monthly pricing starting with the twenty-first paid start', () => {
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
        build_fee_price_id: 'price_build_fee',
        monthly_price_id: 'price_standard_monthly',
      },
    })
  })

  it('reports the exact missing Stripe price env names needed for itemized checkout', () => {
    expect(
      getMissingSparkleSuitePriceEnv({
        buildFee: undefined,
        founderMonthly: undefined,
        standardMonthly: undefined,
      }),
    ).toEqual([
      'STRIPE_PRICE_BUILD_FEE',
      'STRIPE_PRICE_FOUNDER_MONTHLY',
      'STRIPE_PRICE_STANDARD_MONTHLY',
    ])
  })

  it('builds a local-only Stripe test buyer checkout at Stripe minimum amount', () => {
    const result = buildSparkleSuiteTestBuyerCheckoutPricing()

    expect(result.lineItems).toEqual([
      {
        price_data: {
          currency: 'usd',
          unit_amount: TEST_BUYER_CHECKOUT_AMOUNT_CENTS,
          product_data: {
            name: 'Sparkle Suite test buyer subscription',
            metadata: {
              sparkle_suite_launch: 'test_buyer_walkthrough',
              production_pricing: 'false',
            },
          },
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ])
    expect(result.metadata).toEqual({
      pricing_tier: 'standard',
      founder_sequence: '',
      build_fee_charged: 'false',
      founder_rate_months: '',
      build_fee_price_id: 'test_buyer_no_build_fee',
      monthly_price_id: 'test_buyer_price_data_50_cents',
      test_buyer_checkout: 'true',
      production_pricing: 'false',
    })
  })
})
