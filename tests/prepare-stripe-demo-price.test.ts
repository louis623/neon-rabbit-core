import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STRIPE_DEMO_PRICES,
  ensureStripeDemoPrices,
  getStripeSecretKeyMode,
  parseStripeDemoPriceOptions,
  validateStripeDemoPriceOptions,
} from '@/scripts/prepare-stripe-demo-price'

describe('Stripe demo price setup', () => {
  it('refuses missing, live, and unknown Stripe keys', () => {
    expect(getStripeSecretKeyMode(undefined)).toBe('missing')
    expect(getStripeSecretKeyMode('sk_live_secret')).toBe('live')
    expect(getStripeSecretKeyMode('rk_test_secret')).toBe('unknown')

    expect(
      validateStripeDemoPriceOptions(
        parseStripeDemoPriceOptions([], { STRIPE_SECRET_KEY: 'sk_live_secret' }),
      ),
    ).toContain('STRIPE_SECRET_KEY must be a test key for demo price setup; mode=live.')
  })

  it('uses the approved launch price categories by default', () => {
    const options = parseStripeDemoPriceOptions([], {
      STRIPE_SECRET_KEY: 'sk_test_secret',
    })

    expect(validateStripeDemoPriceOptions(options)).toEqual([])
    expect(options.prices).toEqual(DEFAULT_STRIPE_DEMO_PRICES)
    expect(options.prices.map((price) => price.envName)).toEqual([
      'STRIPE_PRICE_BUILD_FEE',
      'STRIPE_PRICE_FOUNDER_MONTHLY',
      'STRIPE_PRICE_STANDARD_MONTHLY',
    ])
    expect(options.prices.map((price) => price.amountCents)).toEqual([
      4999,
      4999,
      7499,
    ])
  })

  it('finds existing active prices before creating new ones', async () => {
    const list = vi.fn(async ({ lookup_keys }: { lookup_keys: string[] }) => ({
      data: [
        {
          id: `price_${lookup_keys[0]}`,
          lookup_key: lookup_keys[0],
          unit_amount: 4999,
          currency: 'usd',
          recurring: lookup_keys[0].includes('build_fee')
            ? null
            : { interval: 'month' },
        },
      ],
    }))
    const create = vi.fn()

    const result = await ensureStripeDemoPrices(
      { prices: { list, create } },
      parseStripeDemoPriceOptions([], { STRIPE_SECRET_KEY: 'sk_test_secret' }),
    )

    expect(create).not.toHaveBeenCalled()
    expect(result.prices.every((price) => price.action === 'found')).toBe(true)
    expect(result.envLines).toEqual([
      'STRIPE_PRICE_BUILD_FEE=price_sparkle_suite_launch_demo_build_fee_test',
      'STRIPE_PRICE_FOUNDER_MONTHLY=price_sparkle_suite_launch_demo_founder_monthly_test',
      'STRIPE_PRICE_STANDARD_MONTHLY=price_sparkle_suite_launch_demo_standard_monthly_test',
    ])
  })

  it('creates test prices with no production-pricing claim', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    const create = vi.fn(async (params: { lookup_key: string; recurring?: unknown }) => ({
      id: `price_created_${params.lookup_key}`,
      lookup_key: params.lookup_key,
      unit_amount: 4999,
      currency: 'usd',
      recurring: params.recurring ? { interval: 'month' } : null,
    }))

    const result = await ensureStripeDemoPrices(
      { prices: { list, create } },
      parseStripeDemoPriceOptions([], { STRIPE_SECRET_KEY: 'sk_test_secret' }),
    )

    expect(create).toHaveBeenCalledTimes(3)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'usd',
        unit_amount: 4999,
        product_data: { name: 'Sparkle Suite setup fee (test only)' },
        metadata: expect.objectContaining({
          sparkle_suite_launch: 'demo_smoke',
          production_pricing: 'false',
          sparkle_suite_price_role: 'buildFee',
        }),
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('sparkle-suite-demo-price'),
      }),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_amount: 4999,
        recurring: { interval: 'month' },
        product_data: { name: 'Sparkle Suite Founding Rep Monthly (test only)' },
      }),
      expect.anything(),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_amount: 7499,
        recurring: { interval: 'month' },
        product_data: { name: 'Sparkle Suite Standard Monthly (test only)' },
      }),
      expect.anything(),
    )
    expect(result.envLines).toEqual([
      'STRIPE_PRICE_BUILD_FEE=price_created_sparkle_suite_launch_demo_build_fee_test',
      'STRIPE_PRICE_FOUNDER_MONTHLY=price_created_sparkle_suite_launch_demo_founder_monthly_test',
      'STRIPE_PRICE_STANDARD_MONTHLY=price_created_sparkle_suite_launch_demo_standard_monthly_test',
    ])
  })
})
