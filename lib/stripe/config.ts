import { z } from 'zod'

const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_MONTHLY: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_QUARTERLY: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_ANNUAL: z.string().startsWith('price_').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

type StripeEnv = z.infer<typeof stripeEnvSchema>

let _cached: { config: StripeEnv | null; enabled: boolean } | null = null

function loadStripeConfig(): { config: StripeEnv | null; enabled: boolean } {
  if (_cached) return _cached

  const result = stripeEnvSchema.safeParse(process.env)

  if (result.success) {
    _cached = { config: result.data, enabled: true }
    return _cached
  }

  // During build (next build), env vars aren't available — don't crash
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    _cached = { config: null, enabled: false }
    return _cached
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[stripe] Missing required environment variables in production:', result.error.flatten().fieldErrors)
    throw new Error('Stripe configuration is incomplete — cannot start in production')
  }

  console.warn('[stripe] Stripe not configured — billing routes will return 503:', result.error.flatten().fieldErrors)
  _cached = { config: null, enabled: false }
  return _cached
}

export function getStripeConfig(): StripeEnv | null {
  return loadStripeConfig().config
}

export function isStripeEnabled(): boolean {
  return loadStripeConfig().enabled
}

/** @deprecated Use getStripeConfig() for lazy evaluation */
export const stripeConfig = null as StripeEnv | null
/** @deprecated Use isStripeEnabled() for lazy evaluation */
export const stripeEnabled = false

export function getPriceId(planType: string): string | undefined {
  const config = getStripeConfig()
  if (!config) return undefined
  const map: Record<string, string | undefined> = {
    monthly: config.STRIPE_PRICE_MONTHLY,
    quarterly: config.STRIPE_PRICE_QUARTERLY,
    annual: config.STRIPE_PRICE_ANNUAL,
  }
  return map[planType]
}

export function getAppUrl(): string {
  return getStripeConfig()?.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
