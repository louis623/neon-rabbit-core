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

interface BuildSparkleSuiteCheckoutPricingInput {
  paidSubscriptionStarts: number
  priceIds: SparkleSuitePriceIds
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
  }
}

export interface SparkleSuiteCheckoutPricingBlocked {
  ok: false
  missingEnv: string[]
}

export type SparkleSuiteCheckoutPricing =
  | SparkleSuiteCheckoutPricingReady
  | SparkleSuiteCheckoutPricingBlocked

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
}: BuildSparkleSuiteCheckoutPricingInput): SparkleSuiteCheckoutPricing {
  const missingEnv = getMissingSparkleSuitePriceEnv(priceIds)
  if (missingEnv.length > 0) {
    return { ok: false, missingEnv }
  }

  const founderSequence =
    paidSubscriptionStarts >= 0 && paidSubscriptionStarts < 20
      ? paidSubscriptionStarts + 1
      : null
  const tier: SparkleSuitePricingTier = founderSequence ? 'founder' : 'standard'
  const monthlyPrice =
    tier === 'founder' ? priceIds.founderMonthly : priceIds.standardMonthly

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
      founder_rate_months: tier === 'founder' ? '12' : '',
    },
  }
}
