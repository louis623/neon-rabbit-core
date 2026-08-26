import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'

export interface RepNetworkEligibility {
  eligible: boolean
  reason:
    | 'eligible'
    | 'rep_inactive'
    | 'paid_subscription_required'
    | 'suspended'
    | 'blocked'
    | 'self_message'
    | 'reviewer_isolation'
}

type AccountClass = 'live_paid' | 'reviewer' | null

type SubscriptionEligibilityRow = {
  rep_id?: string
  status?: string | null
  monthly_amount?: number | string | null
  stripe_subscription_id?: string | null
  stripe_livemode?: boolean | null
  pricing_tier?: string | null
}

export interface RepNetworkDirectoryEntry {
  repId: string
  displayName: string
  businessName: string
  contextLabel?: string
}

function classifySubscriptions(subscriptions: SubscriptionEligibilityRow[], repId: string): AccountClass {
  const livePaid = subscriptions.some((subscription) => {
    const subscriptionId = String(subscription.stripe_subscription_id ?? '')
    return subscription.status === 'active' && Number(subscription.monthly_amount ?? 0) > 0 && subscription.stripe_livemode === true && Boolean(subscriptionId) && !subscriptionId.startsWith('sub_reviewer_smoke_')
  })
  const reviewer = subscriptions.some((subscription) => (
    subscription.status === 'active'
    && Number(subscription.monthly_amount ?? 0) > 0
    && subscription.stripe_livemode === false
    && subscription.pricing_tier === 'smoke'
    && subscription.stripe_subscription_id === `sub_reviewer_smoke_${repId}`
  ))
  return livePaid ? 'live_paid' : reviewer ? 'reviewer' : null
}

async function loadAccountClass(supabase: SupabaseClient, repId: string): Promise<{ active: boolean; accountClass: AccountClass; suspended: boolean }> {
  const [repResult, subscriptionResult, suspensionResult] = await Promise.all([
    supabase.from('reps').select('id, status').eq('id', repId).maybeSingle(),
    supabase.from('subscriptions').select('status, monthly_amount, stripe_subscription_id, stripe_livemode, pricing_tier').eq('rep_id', repId).eq('status', 'active').limit(20),
    supabase.from('workspace_rep_messaging_suspensions').select('rep_id').eq('rep_id', repId).is('lifted_at', null).maybeSingle(),
  ])
  if (repResult.error || subscriptionResult.error || suspensionResult.error) {
    throw new ServiceError({ code: 'REP_NETWORK_ELIGIBILITY_FAILED', message: 'failed to resolve rep network eligibility', userMessage: 'Rep Network access could not be verified right now.', statusCode: 500, cause: repResult.error ?? subscriptionResult.error ?? suspensionResult.error })
  }
  return {
    active: repResult.data?.status === 'active',
    accountClass: classifySubscriptions((subscriptionResult.data ?? []) as SubscriptionEligibilityRow[], repId),
    suspended: Boolean(suspensionResult.data),
  }
}

export async function listEligibleRepNetworkDirectory(
  supabase: SupabaseClient,
  callerRepId: string,
  options: { limit?: number } = {},
): Promise<RepNetworkDirectoryEntry[]> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 50)
  const caller = await loadAccountClass(supabase, callerRepId)
  if (!caller.active || !caller.accountClass || caller.suspended) {
    await requireRepNetworkEligibility(supabase, callerRepId)
    return []
  }

  // Fetch a bounded candidate set so ineligible or blocked rows do not make a
  // short page appear empty, while keeping all filtering on server-only data.
  const candidateResult = await supabase
    .from('reps')
    .select('id, display_name, business_name')
    .eq('status', 'active')
    .neq('id', callerRepId)
    .order('business_name', { ascending: true })
    .order('display_name', { ascending: true })
    .limit(Math.min(limit * 3, 100))
  if (candidateResult.error) {
    throw new ServiceError({
      code: 'REP_NETWORK_DIRECTORY_FAILED',
      message: 'failed to load rep network directory candidates',
      userMessage: 'The Rep Network directory could not be loaded right now.',
      statusCode: 500,
      cause: candidateResult.error,
    })
  }

  const candidates = (candidateResult.data ?? []) as Array<{
    id: string
    display_name: string | null
    business_name: string | null
  }>
  if (candidates.length === 0) return []

  const candidateIds = candidates.map((candidate) => candidate.id)
  const [blocksResult, subscriptionsResult, suspensionsResult] = await Promise.all([
    supabase
      .from('workspace_rep_message_blocks')
      .select('blocker_rep_id, blocked_rep_id')
      .or(`blocker_rep_id.eq.${callerRepId},blocked_rep_id.eq.${callerRepId}`)
      .is('lifted_at', null),
    supabase
      .from('subscriptions')
      .select('rep_id, status, monthly_amount, stripe_subscription_id, stripe_livemode, pricing_tier')
      .in('rep_id', candidateIds),
    supabase
      .from('workspace_rep_messaging_suspensions')
      .select('rep_id')
      .in('rep_id', candidateIds)
      .is('lifted_at', null),
  ])
  if (blocksResult.error || subscriptionsResult.error || suspensionsResult.error) {
    throw new ServiceError({
      code: 'REP_NETWORK_DIRECTORY_FAILED',
      message: 'failed to load rep network directory safeguards',
      userMessage: 'The Rep Network directory could not be loaded right now.',
      statusCode: 500,
      cause: blocksResult.error ?? subscriptionsResult.error ?? suspensionsResult.error,
    })
  }
  const blockedRepIds = new Set<string>()
  for (const row of (blocksResult.data ?? []) as Array<{ blocker_rep_id: string; blocked_rep_id: string }>) {
    if (row.blocker_rep_id === callerRepId) blockedRepIds.add(row.blocked_rep_id)
    if (row.blocked_rep_id === callerRepId) blockedRepIds.add(row.blocker_rep_id)
  }

  const subscriptionsByRepId = new Map<string, SubscriptionEligibilityRow[]>()
  for (const subscription of (subscriptionsResult.data ?? []) as SubscriptionEligibilityRow[]) {
    const repId = subscription.rep_id as string
    subscriptionsByRepId.set(repId, [...(subscriptionsByRepId.get(repId) ?? []), subscription])
  }
  const suspendedRepIds = new Set(
    ((suspensionsResult.data ?? []) as Array<{ rep_id: string }>).map((suspension) => suspension.rep_id),
  )
  return candidates
    .filter((candidate) => (
      !blockedRepIds.has(candidate.id)
      && !suspendedRepIds.has(candidate.id)
      && classifySubscriptions(subscriptionsByRepId.get(candidate.id) ?? [], candidate.id) === caller.accountClass
    ))
    .slice(0, limit)
    .map((candidate) => {
      const displayName = candidate.display_name?.trim() || candidate.business_name?.trim() || 'Sparkle Suite rep'
      const businessName = candidate.business_name?.trim() || displayName
      return {
        repId: candidate.id,
        displayName,
        businessName,
        ...(businessName !== displayName ? { contextLabel: businessName } : {}),
      }
    })
}

export async function getRepNetworkEligibility(
  supabase: SupabaseClient,
  repId: string,
  targetRepId?: string,
): Promise<RepNetworkEligibility> {
  if (targetRepId && targetRepId === repId) return { eligible: false, reason: 'self_message' }
  const account = await loadAccountClass(supabase, repId)
  if (!account.active) return { eligible: false, reason: 'rep_inactive' }
  if (!account.accountClass) return { eligible: false, reason: 'paid_subscription_required' }
  if (account.suspended) return { eligible: false, reason: 'suspended' }
  if (targetRepId) {
    const target = await loadAccountClass(supabase, targetRepId)
    if (!target.active) return { eligible: false, reason: 'rep_inactive' }
    if (!target.accountClass) return { eligible: false, reason: 'paid_subscription_required' }
    if (target.suspended) return { eligible: false, reason: 'suspended' }
    if (target.accountClass !== account.accountClass) return { eligible: false, reason: 'reviewer_isolation' }
    const block = await supabase
      .from('workspace_rep_message_blocks')
      .select('id')
      .or(`and(blocker_rep_id.eq.${repId},blocked_rep_id.eq.${targetRepId}),and(blocker_rep_id.eq.${targetRepId},blocked_rep_id.eq.${repId})`)
      .is('lifted_at', null)
      .limit(1)
      .maybeSingle()
    if (block.error) {
      throw new ServiceError({ code: 'REP_NETWORK_ELIGIBILITY_FAILED', message: 'failed to check rep message blocks', statusCode: 500, cause: block.error })
    }
    if (block.data) return { eligible: false, reason: 'blocked' }
  }
  return { eligible: true, reason: 'eligible' }
}

export async function requireRepNetworkEligibility(
  supabase: SupabaseClient,
  repId: string,
  targetRepId?: string,
) {
  const result = await getRepNetworkEligibility(supabase, repId, targetRepId)
  if (result.eligible) return result
  const messages: Record<RepNetworkEligibility['reason'], string> = {
    eligible: '',
    rep_inactive: 'Rep Network is available to active reps.',
    paid_subscription_required: 'An active Sparkle Suite subscription is required for Rep Network messaging.',
    suspended: 'Rep Network messaging is currently unavailable for this account.',
    blocked: 'Messaging is unavailable between these reps.',
    self_message: 'Choose another rep to message.',
    reviewer_isolation: 'Reviewer conversations stay isolated from live rep accounts.',
  }
  throw new ServiceError({
    code: `REP_NETWORK_${result.reason.toUpperCase()}`,
    message: `rep network ineligible: ${result.reason}`,
    userMessage: messages[result.reason],
    statusCode: result.reason === 'paid_subscription_required' ? 402 : 403,
  })
}
