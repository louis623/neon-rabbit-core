import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type PrelaunchLaunchSetupProfileStatus = 'draft' | 'ready' | 'locked'

export interface PrelaunchLaunchSetupProfileRow {
  id: string
  launch_build_id: string
  business_name: string
  public_site_goal: string
  primary_social_url: string | null
  secondary_social_url: string | null
  shop_url: string | null
  brand_notes: string
  must_have_launch_notes: string
  open_questions: string[]
  status: PrelaunchLaunchSetupProfileStatus
  created_at: string
  updated_at: string
}

export interface PrelaunchLaunchSetupProfile {
  id: string
  launchBuildId: string
  businessName: string
  publicSiteGoal: string
  primarySocialUrl: string | null
  secondarySocialUrl: string | null
  shopUrl: string | null
  brandNotes: string
  mustHaveLaunchNotes: string
  openQuestions: string[]
  status: PrelaunchLaunchSetupProfileStatus
  createdAt: string
  updatedAt: string
}

export interface UpsertPrelaunchLaunchSetupProfileInput {
  launchBuildId: string
  businessName: string
  publicSiteGoal?: string
  primarySocialUrl?: string | null
  secondarySocialUrl?: string | null
  shopUrl?: string | null
  brandNotes?: string
  mustHaveLaunchNotes?: string
  openQuestions?: string[]
  status?: PrelaunchLaunchSetupProfileStatus
}

export const PRELAUNCH_LAUNCH_SETUP_PROFILE_SELECT = [
  'id',
  'launch_build_id',
  'business_name',
  'public_site_goal',
  'primary_social_url',
  'secondary_social_url',
  'shop_url',
  'brand_notes',
  'must_have_launch_notes',
  'open_questions',
  'status',
  'created_at',
  'updated_at',
].join(', ')

function cleanString(value: string | null | undefined) {
  const cleaned = value?.trim() ?? ''
  return cleaned.length > 0 ? cleaned : null
}

function cleanRequiredString(value: string, label: string) {
  const cleaned = value.trim()

  if (!cleaned) {
    throw new Error(`${label} is required.`)
  }

  return cleaned
}

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function cleanOpenQuestions(values: string[] | undefined) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index)
}

function isMissingSchemaTable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'PGRST205'
  )
}

export function normalizePrelaunchLaunchSetupProfileRows(
  rows: PrelaunchLaunchSetupProfileRow[],
): PrelaunchLaunchSetupProfile[] {
  return rows.map((row) => ({
    id: row.id,
    launchBuildId: row.launch_build_id,
    businessName: row.business_name,
    publicSiteGoal: row.public_site_goal,
    primarySocialUrl: row.primary_social_url,
    secondarySocialUrl: row.secondary_social_url,
    shopUrl: row.shop_url,
    brandNotes: row.brand_notes,
    mustHaveLaunchNotes: row.must_have_launch_notes,
    openQuestions: row.open_questions,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function loadPrelaunchLaunchSetupProfilesByBuildIds(
  launchBuildIds: string[],
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchSetupProfile[]> {
  const uniqueIds = Array.from(
    new Set(launchBuildIds.map((id) => id.trim()).filter(Boolean)),
  )

  if (uniqueIds.length === 0) return []

  const { data, error } = await admin
    .from('sparkle_suite_launch_setup_profiles')
    .select(PRELAUNCH_LAUNCH_SETUP_PROFILE_SELECT)
    .in('launch_build_id', uniqueIds)

  if (error) {
    if (isMissingSchemaTable(error)) return []
    throw error
  }

  return normalizePrelaunchLaunchSetupProfileRows(
    (data ?? []) as unknown as PrelaunchLaunchSetupProfileRow[],
  )
}

export async function upsertPrelaunchLaunchSetupProfile(
  input: UpsertPrelaunchLaunchSetupProfileInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchSetupProfile> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const businessName = cleanRequiredString(input.businessName, 'businessName')
  const status = input.status ?? 'draft'

  const { data, error } = await admin
    .from('sparkle_suite_launch_setup_profiles')
    .upsert(
      {
        launch_build_id: launchBuildId,
        business_name: businessName,
        public_site_goal: cleanText(input.publicSiteGoal),
        primary_social_url: cleanString(input.primarySocialUrl),
        secondary_social_url: cleanString(input.secondarySocialUrl),
        shop_url: cleanString(input.shopUrl),
        brand_notes: cleanText(input.brandNotes),
        must_have_launch_notes: cleanText(input.mustHaveLaunchNotes),
        open_questions: cleanOpenQuestions(input.openQuestions),
        status,
      },
      { onConflict: 'launch_build_id' },
    )
    .select(PRELAUNCH_LAUNCH_SETUP_PROFILE_SELECT)
    .single()

  if (error) throw error

  const { error: buildError } = await admin
    .from('sparkle_suite_launch_builds')
    .update({
      setup_profile_status: status === 'ready' ? 'ready' : 'drafted',
      stage: 'setup_profile',
    })
    .eq('id', launchBuildId)

  if (buildError) throw buildError

  return normalizePrelaunchLaunchSetupProfileRows([
    data as unknown as PrelaunchLaunchSetupProfileRow,
  ])[0]
}
