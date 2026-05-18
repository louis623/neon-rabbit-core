import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STRIPE_DEMO_PRICE,
  ensureStripeDemoMonthlyPrice,
  getStripeSecretKeyMode,
  parseStripeDemoPriceOptions,
  validateStripeDemoPriceOptions,
} from '@/scripts/prepare-stripe-demo-price'

describe('Stripe demo monthly price setup', () => {
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

  it('uses a clearly labeled test-only monthly price by default', () => {
    const options = parseStripeDemoPriceOptions([], {
      STRIPE_SECRET_KEY: 'sk_test_secret',
    })

    expect(validateStripeDemoPriceOptions(options)).toEqual([])
    expect(options.lookupKey).toBe(DEFAULT_STRIPE_DEMO_PRICE.lookupKey)
    expect(options.productName).toBe('Sparkle Suite Launch Demo (test only)')
    expect(options.amountCents).toBe(100)
    expect(options.currency).toBe('usd')
  })

  it('finds an existing active price before creating a new one', async () => {
    const list = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'price_existing',
          lookup_key: DEFAULT_STRIPE_DEMO_PRICE.lookupKey,
          unit_amount: 100,
          currency: 'usd',
          recurring: { interval: 'month' },
        },
      ],
    })
    const create = vi.fn()

    const result = await ensureStripeDemoMonthlyPrice(
      { prices: { list, create } },
      parseStripeDemoPriceOptions([], { STRIPE_SECRET_KEY: 'sk_test_secret' }),
    )

    expect(create).not.toHaveBeenCalled()
    expect(result.action).toBe('found')
    expect(result.envLine).toBe('STRIPE_PRICE_MONTHLY=price_existing')
  })

  it('creates a test monthly price with no production-pricing claim', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    const create = vi.fn().mockResolvedValue({
      id: 'price_created',
      lookup_key: DEFAULT_STRIPE_DEMO_PRICE.lookupKey,
      unit_amount: 100,
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    const result = await ensureStripeDemoMonthlyPrice(
      { prices: { list, create } },
      parseStripeDemoPriceOptions([], { STRIPE_SECRET_KEY: 'sk_test_secret' }),
    )

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'usd',
        unit_amount: 100,
        recurring: { interval: 'month' },
        product_data: { name: 'Sparkle Suite Launch Demo (test only)' },
        metadata: expect.objectContaining({
          sparkle_suite_launch: 'demo_smoke',
          production_pricing: 'false',
        }),
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('sparkle-suite-demo-price'),
      }),
    )
    expect(result.action).toBe('created')
    expect(result.envLine).toBe('STRIPE_PRICE_MONTHLY=price_created')
  })
})
