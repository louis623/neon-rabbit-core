import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { config } from 'dotenv'
import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-03-25.dahlia'

export const DEFAULT_STRIPE_DEMO_PRICE = {
  lookupKey: 'sparkle_suite_launch_demo_monthly_test',
  productName: 'Sparkle Suite Launch Demo (test only)',
  amountCents: 100,
  currency: 'usd',
  interval: 'month',
} as const

type StripeSecretKeyMode = 'missing' | 'test' | 'live' | 'unknown'
type StripeDemoPriceAction = 'found' | 'created'

export interface StripeDemoPriceOptions {
  secretKey: string | undefined
  lookupKey: string
  productName: string
  amountCents: number
  currency: string
  interval: 'month'
  json: boolean
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
        recurring: { interval: 'month' }
        lookup_key: string
        product_data: { name: string }
        metadata: Record<string, string>
      },
      options: { idempotencyKey: string },
    ) => Promise<StripePriceLike>
  }
}

export interface StripeDemoPriceResult {
  ok: true
  action: StripeDemoPriceAction
  mode: 'test'
  priceId: string
  lookupKey: string
  amountCents: number
  currency: string
  interval: 'month'
  envLine: string
}

export function getStripeSecretKeyMode(
  secretKey: string | undefined,
): StripeSecretKeyMode {
  if (!secretKey?.trim()) return 'missing'
  if (secretKey.startsWith('sk_test_')) return 'test'
  if (secretKey.startsWith('sk_live_')) return 'live'
  return 'unknown'
}

export function parseStripeDemoPriceOptions(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): StripeDemoPriceOptions {
  return {
    secretKey: env.STRIPE_SECRET_KEY,
    lookupKey:
      readStringFlag(args, '--lookup-key') ??
      env.STRIPE_DEMO_MONTHLY_LOOKUP_KEY ??
      DEFAULT_STRIPE_DEMO_PRICE.lookupKey,
    productName:
      readStringFlag(args, '--product-name') ??
      env.STRIPE_DEMO_PRODUCT_NAME ??
      DEFAULT_STRIPE_DEMO_PRICE.productName,
    amountCents:
      readPositiveIntFlag(args, '--amount-cents') ??
      readPositiveIntEnv(env, 'STRIPE_DEMO_MONTHLY_AMOUNT_CENTS') ??
      DEFAULT_STRIPE_DEMO_PRICE.amountCents,
    currency:
      readStringFlag(args, '--currency') ??
      env.STRIPE_DEMO_MONTHLY_CURRENCY ??
      DEFAULT_STRIPE_DEMO_PRICE.currency,
    interval: 'month',
    json: args.includes('--json'),
  }
}

export function validateStripeDemoPriceOptions(
  options: StripeDemoPriceOptions,
): string[] {
  const errors: string[] = []
  const keyMode = getStripeSecretKeyMode(options.secretKey)

  if (keyMode !== 'test') {
    errors.push(
      `STRIPE_SECRET_KEY must be a test key for demo price setup; mode=${keyMode}.`,
    )
  }

  if (!options.lookupKey.trim()) {
    errors.push('Stripe demo monthly lookup key is required.')
  }

  if (!options.productName.trim()) {
    errors.push('Stripe demo product name is required.')
  }

  if (!Number.isInteger(options.amountCents) || options.amountCents <= 0) {
    errors.push('Stripe demo monthly amount must be a positive integer number of cents.')
  }

  if (!/^[a-z]{3}$/.test(options.currency)) {
    errors.push('Stripe demo monthly currency must be a three-letter lowercase code.')
  }

  return errors
}

export async function ensureStripeDemoMonthlyPrice(
  stripe: StripePriceClient,
  options: StripeDemoPriceOptions,
): Promise<StripeDemoPriceResult> {
  const existing = await stripe.prices.list({
    lookup_keys: [options.lookupKey],
    active: true,
    limit: 1,
  })
  const price = existing.data[0]
  const action: StripeDemoPriceAction = price ? 'found' : 'created'
  const ensuredPrice =
    price ??
    (await stripe.prices.create(
      {
        currency: options.currency,
        unit_amount: options.amountCents,
        recurring: { interval: options.interval },
        lookup_key: options.lookupKey,
        product_data: { name: options.productName },
        metadata: {
          sparkle_suite_launch: 'demo_smoke',
          production_pricing: 'false',
        },
      },
      { idempotencyKey: `sparkle-suite-demo-price-${options.lookupKey}` },
    ))

  return {
    ok: true,
    action,
    mode: 'test',
    priceId: ensuredPrice.id,
    lookupKey: options.lookupKey,
    amountCents: ensuredPrice.unit_amount ?? options.amountCents,
    currency: ensuredPrice.currency,
    interval: 'month',
    envLine: `STRIPE_PRICE_MONTHLY=${ensuredPrice.id}`,
  }
}

function readStringFlag(args: string[], name: string): string | undefined {
  const index = args.findIndex((arg) => arg === name)
  if (index < 0) return undefined
  const value = args[index + 1]?.trim()
  return value || undefined
}

function readPositiveIntFlag(args: string[], name: string): number | undefined {
  const raw = readStringFlag(args, name)
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN
}

function readPositiveIntEnv(
  env: Record<string, string | undefined>,
  name: string,
): number | undefined {
  const raw = env[name]?.trim()
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN
}

function printResult(result: StripeDemoPriceResult) {
  console.log(
    `[stripe:demo-price] ${result.action} test monthly price ${result.priceId}`,
  )
  console.log(
    `[stripe:demo-price] ${result.amountCents} ${result.currency.toUpperCase()} cents/month; test-only smoke price, not production pricing.`,
  )
  console.log(result.envLine)
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const options = parseStripeDemoPriceOptions(process.argv.slice(2))
  const errors = validateStripeDemoPriceOptions(options)
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[stripe:demo-price] ${error}`)
    }
    process.exit(1)
  }

  const stripe = new Stripe(options.secretKey!, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  })
  const result = await ensureStripeDemoMonthlyPrice(stripe, options)

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
