import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { config } from 'dotenv'
import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-03-25.dahlia'

export const STRIPE_LIVE_PRICE_SPECS = [
  {
    key: 'buildFee',
    envName: 'STRIPE_PRICE_BUILD_FEE',
    approvedEnvName: 'STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID',
    lookupKey: 'sparkle_suite_build_fee_live',
    productName: 'Sparkle Suite build fee',
    amountCents: 4999,
    currency: 'usd',
    interval: null,
  },
  {
    key: 'founderMonthly',
    envName: 'STRIPE_PRICE_FOUNDER_MONTHLY',
    approvedEnvName: 'STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID',
    lookupKey: 'sparkle_suite_founder_monthly_live',
    productName: 'Sparkle Suite Founding Rep Monthly',
    amountCents: 4999,
    currency: 'usd',
    interval: 'month',
  },
  {
    key: 'standardMonthly',
    envName: 'STRIPE_PRICE_STANDARD_MONTHLY',
    approvedEnvName: 'STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID',
    lookupKey: 'sparkle_suite_standard_monthly_live',
    productName: 'Sparkle Suite Standard Monthly',
    amountCents: 7499,
    currency: 'usd',
    interval: 'month',
  },
] as const

type StripeLivePriceKey = (typeof STRIPE_LIVE_PRICE_SPECS)[number]['key']
type StripePriceAction = 'found' | 'created' | 'missing'
type StripeSecretKeyMode = 'missing' | 'test' | 'live' | 'unknown'

interface StripeLivePriceSpec {
  key: StripeLivePriceKey
  envName: string
  approvedEnvName: string
  lookupKey: string
  productName: string
  amountCents: number
  currency: string
  interval: 'month' | null
}

interface StripePriceLike {
  id: string
  lookup_key?: string | null
  unit_amount?: number | null
  currency: string
  recurring?: { interval?: string | null } | null
}

interface StripePriceClient {
  prices: {
    list: (params: {
      lookup_keys: string[]
      active: boolean
      limit: number
    }) => Promise<{ data: StripePriceLike[] }>
    create: (
      params: {
        currency: string
        unit_amount: number
        lookup_key: string
        product_data: { name: string }
        metadata: Record<string, string>
        recurring?: { interval: 'month' }
      },
      options: { idempotencyKey: string },
    ) => Promise<StripePriceLike>
  }
}

export interface StripeLivePricesOptions {
  secretKey: string | undefined
  envFile?: string
  apply: boolean
  approvedAt?: string
  json: boolean
  prices: StripeLivePriceSpec[]
}

export interface StripeLivePriceResult {
  action: StripePriceAction
  priceId: string | null
  lookupKey: string
  envName: string
  approvedEnvName: string
  amountCents: number
  currency: string
  interval: 'month' | null
}

export interface StripeLivePricesResult {
  ok: true
  mode: 'live'
  prices: StripeLivePriceResult[]
  envLines: string[]
  approvedEnvLines: string[]
}

export function getStripeSecretKeyMode(
  secretKey: string | undefined,
): StripeSecretKeyMode {
  if (!secretKey?.trim()) return 'missing'
  if (secretKey.startsWith('sk_test_')) return 'test'
  if (secretKey.startsWith('sk_live_')) return 'live'
  return 'unknown'
}

function readStringFlag(args: string[], name: string): string | undefined {
  const index = args.findIndex((arg) => arg === name)
  if (index < 0) return undefined
  const value = args[index + 1]?.trim()
  return value || undefined
}

export function parseStripeLivePricesOptions(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): StripeLivePricesOptions {
  const envFile =
    readStringFlag(args, '--env-file') ??
    readStringFlag(args, '--dotenv') ??
    env.STRIPE_LIVE_PRICE_ENV_FILE

  return {
    secretKey: env.STRIPE_SECRET_KEY,
    envFile,
    apply: args.includes('--apply'),
    approvedAt:
      readStringFlag(args, '--approved-at') ??
      env.STRIPE_LIVE_PRICE_APPROVED_AT,
    json: args.includes('--json'),
    prices: STRIPE_LIVE_PRICE_SPECS.map((price) => ({ ...price })),
  }
}

export function validateStripeLivePricesOptions(
  options: StripeLivePricesOptions,
): string[] {
  const errors: string[] = []
  const keyMode = getStripeSecretKeyMode(options.secretKey)

  if (keyMode !== 'live') {
    errors.push(
      `STRIPE_SECRET_KEY must be a live key for live price setup; mode=${keyMode}.`,
    )
  }
  if (options.apply && !options.approvedAt?.trim()) {
    errors.push(
      'STRIPE_LIVE_PRICE_APPROVED_AT or --approved-at is required before creating live prices.',
    )
  }

  for (const price of options.prices) {
    if (!price.lookupKey.trim()) {
      errors.push(`${price.envName} live lookup key is required.`)
    }
    if (!Number.isInteger(price.amountCents) || price.amountCents <= 0) {
      errors.push(`${price.envName} live amount must be a positive integer number of cents.`)
    }
    if (!/^[a-z]{3}$/.test(price.currency)) {
      errors.push(`${price.envName} live currency must be a three-letter lowercase code.`)
    }
  }

  return errors
}

function getPriceInterval(price: StripePriceLike): 'month' | null {
  return price.recurring?.interval === 'month' ? 'month' : null
}

function validateExistingLivePrice(
  expected: StripeLivePriceSpec,
  actual: StripePriceLike,
): string[] {
  const mismatches: string[] = []
  const actualInterval = getPriceInterval(actual)

  if (actual.unit_amount !== expected.amountCents) {
    mismatches.push(
      `amount expected=${expected.amountCents} actual=${actual.unit_amount ?? 'missing'}`,
    )
  }
  if (actual.currency !== expected.currency) {
    mismatches.push(
      `currency expected=${expected.currency} actual=${actual.currency}`,
    )
  }
  if (actualInterval !== expected.interval) {
    mismatches.push(
      `interval expected=${expected.interval ?? 'one-time'} actual=${actualInterval ?? 'one-time'}`,
    )
  }

  return mismatches
}

export async function ensureStripeLivePrices(
  stripe: StripePriceClient,
  options: StripeLivePricesOptions,
): Promise<StripeLivePricesResult> {
  const prices: StripeLivePriceResult[] = []

  for (const priceOptions of options.prices) {
    const existing = await stripe.prices.list({
      lookup_keys: [priceOptions.lookupKey],
      active: true,
      limit: 1,
    })
    const price = existing.data[0]
    if (price) {
      const mismatches = validateExistingLivePrice(priceOptions, price)
      if (mismatches.length > 0) {
        throw new Error(
          `${priceOptions.envName} live price ${price.id} does not match approved launch pricing: ${mismatches.join('; ')}.`,
        )
      }
    }
    const action: StripePriceAction = price
      ? 'found'
      : options.apply
        ? 'created'
        : 'missing'
    const createParams = {
      currency: priceOptions.currency,
      unit_amount: priceOptions.amountCents,
      lookup_key: priceOptions.lookupKey,
      product_data: { name: priceOptions.productName },
      metadata: {
        sparkle_suite_launch: 'live',
        production_pricing: 'true',
        sparkle_suite_price_role: priceOptions.key,
        non_refundable_build_fee:
          priceOptions.key === 'buildFee' ? 'true' : 'false',
      },
      ...(priceOptions.interval
        ? { recurring: { interval: priceOptions.interval } }
        : {}),
    }
    const ensuredPrice =
      price ??
      (options.apply
        ? await stripe.prices.create(createParams, {
            idempotencyKey: `sparkle-suite-live-price-${priceOptions.lookupKey}`,
          })
        : null)

    prices.push({
      action,
      priceId: ensuredPrice?.id ?? null,
      lookupKey: priceOptions.lookupKey,
      envName: priceOptions.envName,
      approvedEnvName: priceOptions.approvedEnvName,
      amountCents: ensuredPrice?.unit_amount ?? priceOptions.amountCents,
      currency: ensuredPrice?.currency ?? priceOptions.currency,
      interval: ensuredPrice ? getPriceInterval(ensuredPrice) : priceOptions.interval,
    })
  }

  return {
    ok: true,
    mode: 'live',
    prices,
    envLines: prices
      .filter((price) => price.priceId)
      .map((price) => `${price.envName}=${price.priceId}`),
    approvedEnvLines: prices
      .filter((price) => price.priceId)
      .map((price) => `${price.approvedEnvName}=${price.priceId}`),
  }
}

function printResult(result: StripeLivePricesResult) {
  for (const price of result.prices) {
    const cadence = price.interval ? `/${price.interval}` : ' one-time'
    const id = price.priceId ?? '(missing; rerun with --apply after approval)'
    console.log(
      `[stripe:live-price] ${price.action} ${price.envName} ${id}`,
    )
    console.log(
      `[stripe:live-price] ${price.amountCents} ${price.currency.toUpperCase()} cents${cadence}; production pricing.`,
    )
  }
  for (const envLine of [...result.envLines, ...result.approvedEnvLines]) {
    console.log(envLine)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const parsed = parseStripeLivePricesOptions(args)
  if (parsed.envFile) {
    config({ path: parsed.envFile, quiet: true, override: true })
  } else {
    config({ path: '.env.local', quiet: true })
  }

  const options = parseStripeLivePricesOptions(args)
  const errors = validateStripeLivePricesOptions(options)
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[stripe:live-price] ${error}`)
    }
    process.exit(1)
  }

  const stripe = new Stripe(options.secretKey!, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  })
  const result = await ensureStripeLivePrices(stripe, options)

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printResult(result)
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
