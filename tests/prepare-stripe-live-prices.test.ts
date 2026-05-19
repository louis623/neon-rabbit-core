import { describe, expect, it, vi } from 'vitest'

import {
  ensureStripeLivePrices,
  getStripeSecretKeyMode,
  parseStripeLivePricesOptions,
  STRIPE_LIVE_PRICE_SPECS,
  validateStripeLivePricesOptions,
} from '@/scripts/prepare-stripe-live-prices'

describe('Stripe live price setup', () => {
  it('refuses missing, test, and unknown Stripe keys', () => {
    expect(getStripeSecretKeyMode(undefined)).toBe('missing')
    expect(getStripeSecretKeyMode('sk_test_secret')).toBe('test')
    expect(getStripeSecretKeyMode('rk_live_secret')).toBe('unknown')

    expect(
      validateStripeLivePricesOptions(
        parseStripeLivePricesOptions([], { STRIPE_SECRET_KEY: 'sk_test_secret' }),
      ),
    ).toContain('STRIPE_SECRET_KEY must be a live key for live price setup; mode=test.')
  })

  it('uses the approved production launch price categories by default', () => {
    const options = parseStripeLivePricesOptions([], {
      STRIPE_SECRET_KEY: 'sk_live_secret',
    })

    expect(validateStripeLivePricesOptions(options)).toEqual([])
    expect(options.apply).toBe(false)
    expect(options.prices).toEqual(STRIPE_LIVE_PRICE_SPECS)
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

  it('finds existing active live prices before creating new ones', async () => {
    const list = vi.fn(async ({ lookup_keys }: { lookup_keys: string[] }) => ({
      data: [
        {
          id: `price_live_${lookup_keys[0]}`,
          lookup_key: lookup_keys[0],
          unit_amount: lookup_keys[0].includes('standard') ? 7499 : 4999,
          currency: 'usd',
          recurring: lookup_keys[0].includes('build_fee')
            ? null
            : { interval: 'month' },
        },
      ],
    }))
    const create = vi.fn()

    const result = await ensureStripeLivePrices(
      { prices: { list, create } },
      parseStripeLivePricesOptions([], { STRIPE_SECRET_KEY: 'sk_live_secret' }),
    )

    expect(create).not.toHaveBeenCalled()
    expect(result.mode).toBe('live')
    expect(result.prices.every((price) => price.action === 'found')).toBe(true)
    expect(result.envLines).toEqual([
      'STRIPE_PRICE_BUILD_FEE=price_live_sparkle_suite_build_fee_live',
      'STRIPE_PRICE_FOUNDER_MONTHLY=price_live_sparkle_suite_founder_monthly_live',
      'STRIPE_PRICE_STANDARD_MONTHLY=price_live_sparkle_suite_standard_monthly_live',
    ])
    expect(result.approvedEnvLines).toEqual([
      'STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID=price_live_sparkle_suite_build_fee_live',
      'STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID=price_live_sparkle_suite_founder_monthly_live',
      'STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID=price_live_sparkle_suite_standard_monthly_live',
    ])
  })

  it('does not create missing live prices without an apply approval gate', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    const create = vi.fn()

    const result = await ensureStripeLivePrices(
      { prices: { list, create } },
      parseStripeLivePricesOptions([], { STRIPE_SECRET_KEY: 'sk_live_secret' }),
    )

    expect(create).not.toHaveBeenCalled()
    expect(result.prices.every((price) => price.action === 'missing')).toBe(true)
    expect(result.prices.map((price) => price.priceId)).toEqual([null, null, null])
    expect(result.envLines).toEqual([])
    expect(result.approvedEnvLines).toEqual([])
  })

  it('requires an approval timestamp before applying live price creation', () => {
    const options = parseStripeLivePricesOptions(['--apply'], {
      STRIPE_SECRET_KEY: 'sk_live_secret',
    })

    expect(validateStripeLivePricesOptions(options)).toContain(
      'STRIPE_LIVE_PRICE_APPROVED_AT or --approved-at is required before creating live prices.',
    )
  })

  it('creates live prices with production pricing metadata and itemized billing names when applied', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    const create = vi.fn(
      async (params: { lookup_key: string; recurring?: unknown; unit_amount: number }) => ({
        id: `price_created_${params.lookup_key}`,
        lookup_key: params.lookup_key,
        unit_amount: params.unit_amount,
        currency: 'usd',
        recurring: params.recurring ? { interval: 'month' } : null,
      }),
    )

    const result = await ensureStripeLivePrices(
      { prices: { list, create } },
      parseStripeLivePricesOptions(['--apply', '--approved-at', '2026-05-19T20:00:00Z'], {
        STRIPE_SECRET_KEY: 'sk_live_secret',
      }),
    )

    expect(create).toHaveBeenCalledTimes(3)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'usd',
        unit_amount: 4999,
        product_data: { name: 'Sparkle Suite build fee' },
        metadata: expect.objectContaining({
          production_pricing: 'true',
          sparkle_suite_price_role: 'buildFee',
          non_refundable_build_fee: 'true',
        }),
      }),
      expect.objectContaining({
        idempotencyKey: 'sparkle-suite-live-price-sparkle_suite_build_fee_live',
      }),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_amount: 4999,
        recurring: { interval: 'month' },
        product_data: { name: 'Sparkle Suite Founding Rep Monthly' },
      }),
      expect.anything(),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_amount: 7499,
        recurring: { interval: 'month' },
        product_data: { name: 'Sparkle Suite Standard Monthly' },
      }),
      expect.anything(),
    )
    expect(result.envLines).toEqual([
      'STRIPE_PRICE_BUILD_FEE=price_created_sparkle_suite_build_fee_live',
      'STRIPE_PRICE_FOUNDER_MONTHLY=price_created_sparkle_suite_founder_monthly_live',
      'STRIPE_PRICE_STANDARD_MONTHLY=price_created_sparkle_suite_standard_monthly_live',
    ])
  })

  it('rejects existing live prices that do not match the approved launch terms', async () => {
    const list = vi.fn(async () => ({
      data: [
        {
          id: 'price_live_wrong_amount',
          lookup_key: 'sparkle_suite_build_fee_live',
          unit_amount: 100,
          currency: 'usd',
          recurring: null,
        },
      ],
    }))
    const create = vi.fn()

    await expect(
      ensureStripeLivePrices(
        { prices: { list, create } },
        parseStripeLivePricesOptions([], { STRIPE_SECRET_KEY: 'sk_live_secret' }),
      ),
    ).rejects.toThrow(
      'STRIPE_PRICE_BUILD_FEE live price price_live_wrong_amount does not match approved launch pricing: amount expected=4999 actual=100.',
    )
    expect(create).not.toHaveBeenCalled()
  })
})
