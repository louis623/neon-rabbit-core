import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

interface PreparePrelaunchClientAccountInput {
  launchBuildId: string
  temporaryPassword: string
  operatorRepId?: string | null
}

interface LaunchBuildClientAccountRow {
  id: string
  rep_id: string | null
  lead_name: string
  lead_email: string
  setup_profile_status: string
  payment_gate_status: string
  agreement_gate_status: string
  build_check_status: string
}

interface LaunchSetupProfileClientAccountRow {
  business_name: string
  public_site_goal: string
  custom_domain: string | null
  primary_social_url: string | null
  secondary_social_url: string | null
  shop_url: string | null
  brand_notes: string
}

interface ExistingRepRow {
  id: string
  email: string
}

interface CreatedRepRow {
  id: string
  auth_user_id: string
  email: string
  display_name: string
  business_name: string
}

export interface PrelaunchClientAccountResult {
  repId: string
  email: string
  createdAuthUser: boolean
  sentInvite: false
}

function cleanRequiredString(value: string, label: string) {
  const cleaned = value.trim()

  if (!cleaned) {
    throw new Error(`${label} is required.`)
  }

  return cleaned
}

function cleanEmail(value: string) {
  return cleanRequiredString(value, 'leadEmail').toLowerCase()
}

function cleanNullable(value: string | null | undefined) {
  const cleaned = value?.trim() ?? ''
  return cleaned.length > 0 ? cleaned : null
}

function cleanDomain(value: string | null | undefined) {
  return cleanNullable(value)?.toLowerCase() ?? null
}

function assertClientAccountAllowed(build: LaunchBuildClientAccountRow) {
  if (build.rep_id) {
    throw new Error('This launch build already has a client account connected.')
  }

  if (
    build.setup_profile_status !== 'ready' ||
    build.payment_gate_status !== 'ready' ||
    build.agreement_gate_status !== 'ready' ||
    build.build_check_status !== 'passed'
  ) {
    throw new Error(
      'Client account requires setup, payment, agreement, and build checks to be ready.',
    )
  }
}

async function loadLaunchBuildClientAccountRow(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select(
      'id, rep_id, lead_name, lead_email, setup_profile_status, payment_gate_status, agreement_gate_status, build_check_status',
    )
    .eq('id', launchBuildId)
    .single()

  if (error) throw error
  return data as unknown as LaunchBuildClientAccountRow
}

async function loadLaunchSetupProfileClientAccountRow(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_setup_profiles')
    .select(
      'business_name, public_site_goal, custom_domain, primary_social_url, secondary_social_url, shop_url, brand_notes',
    )
    .eq('launch_build_id', launchBuildId)
    .maybeSingle()

  if (error) throw error
  return data as unknown as LaunchSetupProfileClientAccountRow | null
}

async function loadExistingRepByEmail(email: string, admin: AdminClient) {
  const { data, error } = await admin
    .from('reps')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data as ExistingRepRow | null
}

async function assertNoExistingAuthUserByEmail(
  email: string,
  admin: AdminClient,
) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (error) throw error

  const existing = data.users.find(
    (user) => user.email?.trim().toLowerCase() === email,
  )

  if (existing) {
    throw new Error(
      'An auth user already exists for this email. Use the existing rep account path.',
    )
  }
}

export async function preparePrelaunchClientAccountForLaunchBuild(
  input: PreparePrelaunchClientAccountInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchClientAccountResult> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const temporaryPassword = cleanRequiredString(
    input.temporaryPassword,
    'temporaryPassword',
  )
  const build = await loadLaunchBuildClientAccountRow(launchBuildId, admin)
  assertClientAccountAllowed(build)

  const email = cleanEmail(build.lead_email)
  const profile = await loadLaunchSetupProfileClientAccountRow(
    launchBuildId,
    admin,
  )
  const businessName =
    cleanNullable(profile?.business_name) ??
    cleanRequiredString(build.lead_name, 'leadName')
  const existingRep = await loadExistingRepByEmail(email, admin)
  if (existingRep) {
    throw new Error(
      'A rep account already exists for this email. Use the existing rep account path.',
    )
  }

  await assertNoExistingAuthUserByEmail(email, admin)
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    })

  if (authError) throw authError

  const authUserId = authData.user?.id
  if (!authUserId) {
    throw new Error('Supabase did not return an auth user id.')
  }

  const { data: repData, error: repError } = await admin
    .from('reps')
    .insert({
      auth_user_id: authUserId,
      email,
      display_name: cleanRequiredString(build.lead_name, 'leadName'),
      business_name: businessName,
      custom_domain: cleanDomain(profile?.custom_domain),
      phone: null,
      shop_link: cleanNullable(profile?.shop_url),
      streaming_links: {
        primary: cleanNullable(profile?.primary_social_url),
        secondary: cleanNullable(profile?.secondary_social_url),
      },
      social_handles: {},
      template_id: 'default',
      status: 'active',
    })
    .select('id, auth_user_id, email, display_name, business_name')
    .single()

  if (repError) throw repError

  const rep = repData as unknown as CreatedRepRow
  const { error: siteSettingsError } = await admin.from('site_settings').upsert(
    {
      rep_id: rep.id,
      tagline: profile?.public_site_goal ?? '',
      banner_text: `Welcome to ${businessName}`,
      banner_visible: true,
      ticker_text: null,
      ticker_visible: false,
      team_name: businessName,
      show_join_page: true,
      hero_animation_type: 'zoom',
    },
    { onConflict: 'rep_id' },
  )

  if (siteSettingsError) throw siteSettingsError

  const { error: onboardingError } = await admin
    .from('onboarding_status')
    .upsert(
      {
        rep_id: rep.id,
        current_stage: 'launch_ready',
        completed_steps: [
          'waitlist',
          'conversation',
          'setup_profile',
          'payment_gate',
          'agreement_gate',
          'build_checks',
        ],
      },
      { onConflict: 'rep_id' },
    )

  if (onboardingError) throw onboardingError

  return {
    repId: rep.id,
    email: rep.email,
    createdAuthUser: true,
    sentInvite: false,
  }
}
