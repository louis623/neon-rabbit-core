export type SparkleSuitePricingTier = 'founder' | 'standard'

export interface SparkleSuitePriceIds {
  buildFee?: string
  founderMonthly?: string
  standardMonthly?: string
}

export interface SparkleSuiteCheckoutLineItem {
  price: string
  quantity: 1
}

export interface SparkleSuiteCheckoutPriceDataLineItem {
  price_data: {
    currency: 'usd'
    unit_amount: number
    product_data: {
      name: string
      metadata?: Record<string, string>
    }
    recurring?: {
      interval: 'month'
    }
  }
  quantity: 1
}

interface BuildSparkleSuiteCheckoutPricingInput {
  paidSubscriptionStarts: number
  priceIds: SparkleSuitePriceIds
  pricingAssignment?: SparkleSuitePricingAssignment | null
}

export interface SparkleSuitePricingAssignment {
  tier: SparkleSuitePricingTier
  founderSequence: number | null
}

export interface SparkleSuiteCheckoutPricingReady {
  ok: true
  tier: SparkleSuitePricingTier
  founderSequence: number | null
  lineItems: [SparkleSuiteCheckoutLineItem, SparkleSuiteCheckoutLineItem]
  metadata: {
    pricing_tier: SparkleSuitePricingTier
    founder_sequence: string
    build_fee_charged: 'true'
    founder_rate_months: string
    build_fee_price_id: string
    monthly_price_id: string
  }
}

export interface SparkleSuiteCheckoutPricingBlocked {
  ok: false
  missingEnv: string[]
}

export type SparkleSuiteCheckoutPricing =
  | SparkleSuiteCheckoutPricingReady
  | SparkleSuiteCheckoutPricingBlocked

export const TEST_BUYER_CHECKOUT_AMOUNT_CENTS = 50
export const FOUNDER_PRICING_REP_LIMIT = 20
export const FOUNDER_RATE_MONTHS = 12
export const SPARKLE_SUITE_SETUP_FEE_CENTS = 4999
export const SPARKLE_SUITE_FOUNDER_MONTHLY_CENTS = 4999
export const SPARKLE_SUITE_STANDARD_MONTHLY_CENTS = 7499

export interface SparkleSuiteTestBuyerCheckoutPricing {
  ok: true
  tier: 'standard'
  founderSequence: null
  lineItems: [SparkleSuiteCheckoutPriceDataLineItem]
  metadata: {
    pricing_tier: 'standard'
    founder_sequence: ''
    build_fee_charged: 'false'
    founder_rate_months: ''
    build_fee_price_id: 'test_buyer_no_build_fee'
    monthly_price_id: 'test_buyer_price_data_50_cents'
    test_buyer_checkout: 'true'
    production_pricing: 'false'
  }
}

export function getMissingSparkleSuitePriceEnv(
  priceIds: SparkleSuitePriceIds,
): string[] {
  const missing: string[] = []

  if (!priceIds.buildFee) missing.push('STRIPE_PRICE_BUILD_FEE')
  if (!priceIds.founderMonthly) missing.push('STRIPE_PRICE_FOUNDER_MONTHLY')
  if (!priceIds.standardMonthly) missing.push('STRIPE_PRICE_STANDARD_MONTHLY')

  return missing
}

export function buildSparkleSuiteCheckoutPricing({
  paidSubscriptionStarts,
  priceIds,
  pricingAssignment,
}: BuildSparkleSuiteCheckoutPricingInput): SparkleSuiteCheckoutPricing {
  const missingEnv = getMissingSparkleSuitePriceEnv(priceIds)
  if (missingEnv.length > 0) {
    return { ok: false, missingEnv }
  }

  const founderSequence =
    pricingAssignment !== undefined && pricingAssignment !== null
      ? pricingAssignment.founderSequence
      : paidSubscriptionStarts < FOUNDER_PRICING_REP_LIMIT
        ? paidSubscriptionStarts + 1
        : null
  const tier: SparkleSuitePricingTier =
    pricingAssignment?.tier ?? (founderSequence ? 'founder' : 'standard')
  const monthlyPrice =
    tier === 'founder' ? priceIds.founderMonthly : priceIds.standardMonthly
  const founderRateMonths =
    tier === 'founder' ? String(FOUNDER_RATE_MONTHS) : ''

  return {
    ok: true,
    tier,
    founderSequence,
    lineItems: [
      { price: priceIds.buildFee as string, quantity: 1 },
      { price: monthlyPrice as string, quantity: 1 },
    ],
    metadata: {
      pricing_tier: tier,
      founder_sequence: founderSequence ? String(founderSequence) : '',
      build_fee_charged: 'true',
      founder_rate_months: founderRateMonths,
      build_fee_price_id: priceIds.buildFee as string,
      monthly_price_id: monthlyPrice as string,
    },
  }
}

export function buildSparkleSuiteTestBuyerCheckoutPricing(): SparkleSuiteTestBuyerCheckoutPricing {
  return {
    ok: true,
    tier: 'standard',
    founderSequence: null,
    lineItems: [
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
    ],
    metadata: {
      pricing_tier: 'standard',
      founder_sequence: '',
      build_fee_charged: 'false',
      founder_rate_months: '',
      build_fee_price_id: 'test_buyer_no_build_fee',
      monthly_price_id: 'test_buyer_price_data_50_cents',
      test_buyer_checkout: 'true',
      production_pricing: 'false',
    },
  }
}
