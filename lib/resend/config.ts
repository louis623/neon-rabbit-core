import { z } from 'zod'

function extractEmailAddress(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/<([^<>]+)>$/)
  return (match ? match[1] : trimmed).trim()
}

function isValidResendFromEmail(value: string) {
  return z.string().email().safeParse(extractEmailAddress(value)).success
}

const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().trim().min(1),
  RESEND_FROM_EMAIL: z
    .string()
    .trim()
    .min(1)
    .refine(isValidResendFromEmail, 'Invalid email address'),
})

type ResendEnv = z.infer<typeof resendEnvSchema>

let cached:
  | { config: ResendEnv | null; enabled: boolean; signature: string }
  | null = null

function getEnvSignature() {
  return JSON.stringify({
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? null,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? null,
    NEXT_PHASE: process.env.NEXT_PHASE ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  })
}

function loadResendConfig(): { config: ResendEnv | null; enabled: boolean } {
  const signature = getEnvSignature()
  if (cached && cached.signature === signature) {
    return cached
  }

  const result = resendEnvSchema.safeParse(process.env)
  if (result.success) {
    cached = { config: result.data, enabled: true, signature }
    return cached
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    cached = { config: null, enabled: false, signature }
    return cached
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[resend] Missing required environment variables in production:',
      result.error.flatten().fieldErrors,
    )
    cached = { config: null, enabled: false, signature }
    return cached
  }

  console.warn(
    '[resend] Resend not configured - email sends will return 503:',
    result.error.flatten().fieldErrors,
  )
  cached = { config: null, enabled: false, signature }
  return cached
}

export function getResendConfig(): ResendEnv | null {
  return loadResendConfig().config
}

export function isResendEnabled(): boolean {
  return loadResendConfig().enabled
}
