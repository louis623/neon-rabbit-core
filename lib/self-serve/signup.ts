import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateUniqueSparkleSuiteReferralCode,
  normalizeSparkleSuiteReferralCode,
} from '@/lib/services/sparkle-suite-referrals'

type AdminClient = ReturnType<typeof createAdminClient>

export const SELF_SERVE_NEXT_PATH =
  '/nic-nac?onboarding=checkout-required'

export interface SelfServeWorkspaceAccount {
  authUserId: string
  email: string
  displayName: string
  referralCode?: string | null
}

const selfServeSignupSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
  referralCode: z
    .string()
    .trim()
    .optional()
    .transform((value, context) => {
      if (!value) return null
      const normalized = normalizeSparkleSuiteReferralCode(value)
      if (!normalized) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid Sparkle Suite referral code.',
        })
        return z.NEVER
      }
      return normalized
    }),
}).refine((value) => value.password === value.passwordConfirm, {
  path: ['passwordConfirm'],
  message: 'Enter the same password twice.',
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
  const reviewerFlag = env.SPARKLE_REVIEWER_SMOKE_MODE?.trim().toLowerCase()
  if (
    env.VERCEL_ENV === 'preview' &&
    (reviewerFlag === 'true' || reviewerFlag === '1')
  ) {
    return true
  }
  return env.NODE_ENV !== 'production'
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

export function getSelfServeDisplayNameFromAuthUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}) {
  const metadata = user.user_metadata ?? {}
  const metadataName =
    typeof metadata.display_name === 'string'
      ? metadata.display_name
      : typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : ''
  const trimmedMetadataName = metadataName.trim()
  if (trimmedMetadataName) return trimmedMetadataName

  const email = user.email?.trim()
  if (!email) return 'Sparkle Rep'

  return email.split('@')[0]?.trim() || 'Sparkle Rep'
}

export async function createSelfServeWorkspaceForAuthUser(
  account: SelfServeWorkspaceAccount,
  admin: AdminClient = createAdminClient(),
) {
  const displayName = account.displayName.trim() || 'Sparkle Rep'
  const email = account.email.trim().toLowerCase()
  const referralCode = account.referralCode
    ? normalizeSparkleSuiteReferralCode(account.referralCode)
    : null
  const ownReferralCode = await generateUniqueSparkleSuiteReferralCode(admin)
  const { data: rep, error: repError } = await admin
    .from('reps')
    .insert({
      auth_user_id: account.authUserId,
      email,
      display_name: displayName,
      business_name: displayName,
      phone: null,
      custom_domain: null,
      public_site_slug: null,
      shop_link: null,
      streaming_links: {
        primary: null,
        secondary: null,
      },
      social_handles: {},
      template_id: 'default',
      status: 'onboarding',
      referral_code: ownReferralCode,
    })
    .select('id, auth_user_id, email')
    .single()

  if (repError) throw repError

  const repId = rep.id as string
  const [
    { error: siteSettingsError },
    { error: setupSessionError },
    { error: walletError },
  ] = await Promise.all([
    admin.from('site_settings').upsert(
      {
        rep_id: repId,
        banner_text: `Welcome to ${displayName}`,
        banner_visible: true,
        ticker_text: null,
        ticker_visible: false,
        tagline: `A polished place to shop ${displayName}.`,
        team_name: displayName,
        show_join_page: true,
        hero_animation_type: 'sparkle_rise',
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    ),
    admin.from('self_serve_setup_sessions').upsert(
      {
        rep_id: repId,
        status: 'checkout_required',
        current_step: 'account_basics',
        completed_steps: ['self_serve_account_created'],
        answers: {
          displayName,
          email,
          ...(referralCode ? { referralCode } : {}),
        },
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
  if (setupSessionError) throw setupSessionError
  if (walletError) throw walletError

  return {
    repId,
    email,
  }
}

export async function ensureSelfServeWorkspaceForAuthUser(
  account: SelfServeWorkspaceAccount,
  admin: AdminClient = createAdminClient(),
  options: { allowCreate?: boolean } = {},
) {
  const { data: existingRep, error } = await admin
    .from('reps')
    .select('id')
    .eq('auth_user_id', account.authUserId)
    .maybeSingle()

  if (error) throw error
  if (existingRep) {
    return {
      repId: existingRep.id as string,
      created: false,
    }
  }

  if (options.allowCreate === false) {
    return {
      repId: null,
      created: false,
    }
  }

  const created = await createSelfServeWorkspaceForAuthUser(account, admin)
  return {
    repId: created.repId,
    created: true,
  }
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
    const { repId } = await createSelfServeWorkspaceForAuthUser(
      {
        authUserId,
        email: signup.email,
        displayName: signup.displayName,
        referralCode: signup.referralCode,
      },
      admin,
    )

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
