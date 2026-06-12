import type { SupabaseClient } from '@supabase/supabase-js'

type JsonObject = Record<string, unknown>

export interface ClientAccountSnapshot {
  profileId: string
  repId: string
  clientName: string
  showName: string
  primaryContactName: string | null
  email: string
  phone: string | null
  accountStatus: string | null
  subscriptionStatus: string | null
  supportTier: string | null
  publicSiteSlug: string | null
  customDomain: string | null
  sourceSnapshot: JsonObject
}

interface RepProfileSource {
  id: string
  display_name: string | null
  business_name: string | null
  email: string | null
  phone: string | null
  status: string | null
  public_site_slug: string | null
  custom_domain: string | null
}

interface ClientAccountProfileRow {
  id: string
  rep_id: string
  client_name: string
  show_name: string | null
  primary_contact_name: string | null
  email: string
  phone: string | null
  account_status: string | null
  subscription_status: string | null
  support_tier: string | null
  public_site_slug: string | null
  custom_domain: string | null
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function objectOrEmpty(value: unknown): JsonObject {
  return isObject(value) ? value : {}
}

function textOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function accountBasicsFromSetup(setup: unknown) {
  const setupObject = objectOrEmpty(setup)
  const answers = objectOrEmpty(setupObject.answers)
  return objectOrEmpty(answers.account_basics)
}

function normalizeProfile(row: ClientAccountProfileRow, sourceSnapshot: JsonObject): ClientAccountSnapshot {
  return {
    profileId: row.id,
    repId: row.rep_id,
    clientName: row.client_name,
    showName: row.show_name ?? row.client_name,
    primaryContactName: row.primary_contact_name,
    email: row.email,
    phone: row.phone,
    accountStatus: row.account_status,
    subscriptionStatus: row.subscription_status,
    supportTier: row.support_tier,
    publicSiteSlug: row.public_site_slug,
    customDomain: row.custom_domain,
    sourceSnapshot,
  }
}

export async function ensureClientAccountProfile(
  supabase: SupabaseClient,
  repId: string,
): Promise<ClientAccountSnapshot> {
  const normalizedRepId = repId.trim()
  if (!normalizedRepId) throw new Error('repId is required')

  const { data: rep, error: repError } = await supabase
    .from('reps')
    .select(
      'id, display_name, business_name, email, phone, status, public_site_slug, custom_domain',
    )
    .eq('id', normalizedRepId)
    .single()

  if (repError || !rep) {
    throw repError ?? new Error(`Rep ${normalizedRepId} was not found`)
  }

  const { data: setup, error: setupError } = await supabase
    .from('self_serve_setup_sessions')
    .select(
      'status, current_step, completed_steps, answers, generated_copy, support_state, dashboard_unlocked_at, updated_at',
    )
    .eq('rep_id', normalizedRepId)
    .maybeSingle()

  if (setupError) throw setupError

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('status, plan_tier, pricing_tier, updated_at')
    .eq('rep_id', normalizedRepId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subscriptionError) throw subscriptionError

  const repSource = rep as RepProfileSource
  const setupSource = setup ? objectOrEmpty(setup) : {}
  const subscriptionSource = subscription ? objectOrEmpty(subscription) : null
  const accountBasics = accountBasicsFromSetup(setupSource)
  const clientName =
    textOrNull(accountBasics.customerFacingDisplayName) ??
    textOrNull(repSource.business_name) ??
    textOrNull(repSource.display_name) ??
    repSource.email ??
    normalizedRepId
  const showName =
    textOrNull(accountBasics.liveShowName) ??
    textOrNull(accountBasics.businessName) ??
    clientName
  const email =
    textOrNull(accountBasics.bestContactEmail) ??
    textOrNull(repSource.email) ??
    `${normalizedRepId}@missing-email.local`
  const sourceSnapshot = {
    rep: repSource,
    setup: setupSource,
    subscription: subscriptionSource,
  }

  const upsertPayload = {
    rep_id: normalizedRepId,
    client_name: clientName,
    show_name: showName,
    primary_contact_name: textOrNull(repSource.display_name),
    email,
    phone: textOrNull(repSource.phone),
    account_status: textOrNull(repSource.status),
    subscription_status: textOrNull(subscriptionSource?.status),
    support_tier:
      textOrNull(subscriptionSource?.pricing_tier) ??
      textOrNull(subscriptionSource?.plan_tier) ??
      'standard',
    public_site_slug:
      textOrNull(accountBasics.publicSiteSlug) ??
      textOrNull(repSource.public_site_slug),
    custom_domain: textOrNull(repSource.custom_domain),
    setup_state: setupSource,
    source_snapshot: sourceSnapshot,
    updated_at: new Date().toISOString(),
  }

  const { data: profile, error: profileError } = await supabase
    .from('client_account_profiles')
    .upsert(upsertPayload, { onConflict: 'rep_id' })
    .select(
      'id, rep_id, client_name, show_name, primary_contact_name, email, phone, account_status, subscription_status, support_tier, public_site_slug, custom_domain',
    )
    .single()

  if (profileError || !profile) {
    throw profileError ?? new Error('client account profile upsert failed')
  }

  return normalizeProfile(profile as ClientAccountProfileRow, sourceSnapshot)
}
