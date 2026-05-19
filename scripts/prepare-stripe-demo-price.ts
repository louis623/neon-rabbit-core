import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { config } from 'dotenv'
import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-03-25.dahlia'

export const DEFAULT_STRIPE_DEMO_PRICES = [
  {
    key: 'buildFee',
    envName: 'STRIPE_PRICE_BUILD_FEE',
    lookupKey: 'sparkle_suite_launch_demo_build_fee_test',
    productName: 'Sparkle Suite build fee (test only)',
    amountCents: 4999,
    currency: 'usd',
    interval: null,
  },
  {
    key: 'founderMonthly',
    envName: 'STRIPE_PRICE_FOUNDER_MONTHLY',
    lookupKey: 'sparkle_suite_launch_demo_founder_monthly_test',
    productName: 'Sparkle Suite Founding Rep Monthly (test only)',
    amountCents: 4999,
    currency: 'usd',
    interval: 'month',
  },
  {
    key: 'standardMonthly',
    envName: 'STRIPE_PRICE_STANDARD_MONTHLY',
    lookupKey: 'sparkle_suite_launch_demo_standard_monthly_test',
    productName: 'Sparkle Suite Standard Monthly (test only)',
    amountCents: 7499,
    currency: 'usd',
    interval: 'month',
  },
] as const

export const DEFAULT_STRIPE_DEMO_PRICE = DEFAULT_STRIPE_DEMO_PRICES[1]

type StripeSecretKeyMode = 'missing' | 'test' | 'live' | 'unknown'
type StripeDemoPriceAction = 'found' | 'created'
type StripeDemoPriceKey = (typeof DEFAULT_STRIPE_DEMO_PRICES)[number]['key']

export interface StripeDemoPriceOptions {
  secretKey: string | undefined
  json: boolean
  prices: Array<{
    key: StripeDemoPriceKey
    envName: string
    lookupKey: string
    productName: string
    amountCents: number
    currency: string
    interval: 'month' | null
  }>
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

export interface StripeDemoPriceResult {
  action: StripeDemoPriceAction
  priceId: string
  lookupKey: string
  envName: string
  amountCents: number
  currency: string
  interval: 'month' | null
}

export interface StripeDemoPricesResult {
  ok: true
  mode: 'test'
  prices: StripeDemoPriceResult[]
  envLines: string[]
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
    json: args.includes('--json'),
    prices: DEFAULT_STRIPE_DEMO_PRICES.map((price) => ({
      ...price,
      lookupKey:
        readStringFlag(args, `--${toKebabCase(price.key)}-lookup-key`) ??
        env[`STRIPE_DEMO_${toSnakeCase(price.key)}_LOOKUP_KEY`] ??
        price.lookupKey,
      amountCents:
        readPositiveIntFlag(args, `--${toKebabCase(price.key)}-amount-cents`) ??
        readPositiveIntEnv(env, `STRIPE_DEMO_${toSnakeCase(price.key)}_AMOUNT_CENTS`) ??
        price.amountCents,
      currency:
        readStringFlag(args, `--${toKebabCase(price.key)}-currency`) ??
        env[`STRIPE_DEMO_${toSnakeCase(price.key)}_CURRENCY`] ??
        price.currency,
    })),
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

  for (const price of options.prices) {
    if (!price.lookupKey.trim()) {
      errors.push(`${price.envName} demo lookup key is required.`)
    }

    if (!price.productName.trim()) {
      errors.push(`${price.envName} demo product name is required.`)
    }

    if (!Number.isInteger(price.amountCents) || price.amountCents <= 0) {
      errors.push(`${price.envName} demo amount must be a positive integer number of cents.`)
    }

    if (!/^[a-z]{3}$/.test(price.currency)) {
      errors.push(`${price.envName} demo currency must be a three-letter lowercase code.`)
    }
  }

  return errors
}

export async function ensureStripeDemoPrices(
  stripe: StripePriceClient,
  options: StripeDemoPriceOptions,
): Promise<StripeDemoPricesResult> {
  const prices: StripeDemoPriceResult[] = []

  for (const priceOptions of options.prices) {
    const existing = await stripe.prices.list({
      lookup_keys: [priceOptions.lookupKey],
      active: true,
      limit: 1,
    })
    const price = existing.data[0]
    const action: StripeDemoPriceAction = price ? 'found' : 'created'
    const createParams = {
      currency: priceOptions.currency,
      unit_amount: priceOptions.amountCents,
      lookup_key: priceOptions.lookupKey,
      product_data: { name: priceOptions.productName },
      metadata: {
        sparkle_suite_launch: 'demo_smoke',
        production_pricing: 'false',
        sparkle_suite_price_role: priceOptions.key,
      },
      ...(priceOptions.interval
        ? { recurring: { interval: priceOptions.interval } }
        : {}),
    }
    const ensuredPrice =
      price ??
      (await stripe.prices.create(
        createParams,
        { idempotencyKey: `sparkle-suite-demo-price-${priceOptions.lookupKey}` },
      ))

    prices.push({
      action,
      priceId: ensuredPrice.id,
      lookupKey: priceOptions.lookupKey,
      envName: priceOptions.envName,
      amountCents: ensuredPrice.unit_amount ?? priceOptions.amountCents,
      currency: ensuredPrice.currency,
      interval: ensuredPrice.recurring?.interval === 'month' ? 'month' : null,
    })
  }

  return {
    ok: true,
    mode: 'test',
    prices,
    envLines: prices.map((price) => `${price.envName}=${price.priceId}`),
  }
}

export async function ensureStripeDemoMonthlyPrice(
  stripe: StripePriceClient,
  options: StripeDemoPriceOptions,
): Promise<StripeDemoPriceResult & { envLine: string }> {
  const result = await ensureStripeDemoPrices(stripe, {
    ...options,
    prices: options.prices.filter((price) => price.key === 'founderMonthly'),
  })
  const price = result.prices[0]
  return { ...price, envLine: `${price.envName}=${price.priceId}` }
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

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function printResult(result: StripeDemoPricesResult) {
  for (const price of result.prices) {
    const cadence = price.interval ? `/${price.interval}` : ' one-time'
    console.log(
      `[stripe:demo-price] ${price.action} ${price.envName} ${price.priceId}`,
    )
    console.log(
      `[stripe:demo-price] ${price.amountCents} ${price.currency.toUpperCase()} cents${cadence}; test-only smoke price, not production pricing.`,
    )
  }
  for (const envLine of result.envLines) {
    console.log(envLine)
  }
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
  const result = await ensureStripeDemoPrices(stripe, options)

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
