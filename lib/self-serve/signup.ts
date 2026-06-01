import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export const SELF_SERVE_NEXT_PATH =
  '/nic-nac?section=account&onboarding=self-serve-started'

const selfServeSignupSchema = z.object({
  displayName: z.string().trim().min(2),
  businessName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  primarySocialUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  shopUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
})

export type SelfServeSignupInput = z.input<typeof selfServeSignupSchema>

export type SelfServeSignupResult =
  | {
      ok: true
      repId: string
      email: string
      next: typeof SELF_SERVE_NEXT_PATH
    }
  | {
      ok: false
      status: number
      code: string
      error: string
      fields?: Record<string, string[]>
    }

export function selfServeSignupEnabled(env: NodeJS.ProcessEnv = process.env) {
  const flag = env.SPARKLE_SELF_SERVE_ENABLED?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  return env.NODE_ENV !== 'production'
}

function cleanNullableUrl(value: string | null) {
  if (!value) return null
  return value
}

function flattenSignupErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors
  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].length > 0,
    ),
  )
}

function isExistingAuthUserError(error: unknown) {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error ?? '')

  return /already (registered|exists)|user already/i.test(message)
}

async function assertNoExistingRep(email: string, admin: AdminClient) {
  const { data, error } = await admin
    .from('reps')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  if (data) {
    return {
      ok: false,
      status: 409,
      code: 'REP_ALREADY_EXISTS',
      error: 'A Sparkle Suite account already exists for this email.',
    } as const
  }

  return null
}

export async function createSelfServeSignup(
  input: unknown,
  adminClient?: AdminClient,
): Promise<SelfServeSignupResult> {
  const parsed = selfServeSignupSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_INPUT',
      error: 'Please check the signup form and try again.',
      fields: flattenSignupErrors(parsed.error),
    }
  }

  const signup = parsed.data
  const admin = adminClient ?? createAdminClient()
  const duplicate = await assertNoExistingRep(signup.email, admin)
  if (duplicate) return duplicate

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: signup.email,
      password: signup.password,
      email_confirm: true,
    })

  if (authError) {
    if (isExistingAuthUserError(authError)) {
      return {
        ok: false,
        status: 409,
        code: 'ACCOUNT_ALREADY_EXISTS',
        error:
          'A Sparkle Suite account already exists for this email. Sign in to continue or contact support.',
      }
    }

    throw authError
  }

  const authUserId = authData.user?.id
  if (!authUserId) {
    throw new Error('Supabase did not return an auth user id.')
  }

  try {
    const { data: rep, error: repError } = await admin
      .from('reps')
      .insert({
        auth_user_id: authUserId,
        email: signup.email,
        display_name: signup.displayName,
        business_name: signup.businessName,
        phone: signup.phone,
        custom_domain: null,
        shop_link: cleanNullableUrl(signup.shopUrl),
        streaming_links: {
          primary: cleanNullableUrl(signup.primarySocialUrl),
          secondary: null,
        },
        social_handles: {},
        template_id: 'default',
        status: 'onboarding',
      })
      .select('id, auth_user_id, email')
      .single()

    if (repError) throw repError

    const repId = rep.id as string
    const [
      { error: siteSettingsError },
      { error: onboardingError },
      { error: walletError },
    ] = await Promise.all([
      admin.from('site_settings').upsert(
        {
          rep_id: repId,
          banner_text: `Welcome to ${signup.businessName}`,
          banner_visible: true,
          ticker_text: null,
          ticker_visible: false,
          tagline: `A polished place to shop ${signup.businessName}.`,
          team_name: signup.businessName,
          show_join_page: true,
          hero_animation_type: 'zoom',
          customer_site_template: 'amethyst',
          appearance_preset: 'sparkle_suite_morganite',
        },
        { onConflict: 'rep_id' },
      ),
      admin.from('onboarding_status').upsert(
        {
          rep_id: repId,
          current_stage: 'signup_received',
          completed_steps: ['self_serve_account_created'],
        },
        { onConflict: 'rep_id' },
      ),
      admin.from('sms_wallet').upsert(
        {
          rep_id: repId,
          balance_mils: 0,
          auto_recharge_enabled: false,
          auto_recharge_threshold_mils: 5000,
          auto_recharge_amount_mils: 25000,
          minimum_load_amount_mils: 25000,
        },
        { onConflict: 'rep_id' },
      ),
    ])

    if (siteSettingsError) throw siteSettingsError
    if (onboardingError) throw onboardingError
    if (walletError) throw walletError

    return {
      ok: true,
      repId,
      email: signup.email,
      next: SELF_SERVE_NEXT_PATH,
    }
  } catch (error) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(authUserId)
    if (cleanupError) {
      console.error('[self-serve/signup] Cleanup failed:', cleanupError)
    }
    throw error
  }
}
