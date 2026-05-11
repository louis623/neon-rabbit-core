import { z } from 'zod'

const telnyxEnvSchema = z.object({
  TELNYX_API_KEY: z.string().min(1),
  TELNYX_SMS_FROM: z.string().regex(/^\+[1-9]\d{7,14}$/),
  TELNYX_PUBLIC_KEY: z.string().min(1).optional(),
})

type TelnyxEnv = z.infer<typeof telnyxEnvSchema>

type CachedTelnyxConfig = {
  config: TelnyxEnv | null
  enabled: boolean
  cacheKey: string
}

let cached: CachedTelnyxConfig | null = null

function getCacheKey() {
  return JSON.stringify({
    apiKey: process.env.TELNYX_API_KEY ?? null,
    smsFrom: process.env.TELNYX_SMS_FROM ?? null,
    publicKey: process.env.TELNYX_PUBLIC_KEY ?? null,
    nextPhase: process.env.NEXT_PHASE ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  })
}

function loadTelnyxConfig(): { config: TelnyxEnv | null; enabled: boolean } {
  const cacheKey = getCacheKey()
  if (cached?.cacheKey === cacheKey) {
    return cached
  }

  const result = telnyxEnvSchema.safeParse(process.env)

  if (result.success) {
    cached = { config: result.data, enabled: true, cacheKey }
    return cached
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    cached = { config: null, enabled: false, cacheKey }
    return cached
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[telnyx] Missing required environment variables in production:',
      result.error.flatten().fieldErrors,
    )
    throw new Error('Telnyx configuration is incomplete - cannot start in production')
  }

  console.warn(
    '[telnyx] Telnyx not configured - SMS delivery will return a user-facing error:',
    result.error.flatten().fieldErrors,
  )
  cached = { config: null, enabled: false, cacheKey }
  return cached
}

export function getTelnyxConfig(): TelnyxEnv | null {
  return loadTelnyxConfig().config
}

export function isTelnyxEnabled(): boolean {
  return loadTelnyxConfig().enabled
}
