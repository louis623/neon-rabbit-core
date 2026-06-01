import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'

export const PAID_WORKSPACE_STATUSES = ['active', 'trialing', 'past_due'] as const

export function subscriptionRequiredError() {
  return new ServiceError({
    code: 'SPARKLE_SUBSCRIPTION_REQUIRED',
    message: 'paid Sparkle Suite subscription required',
    userMessage:
      'Start your Sparkle Suite subscription before using workspace tools.',
    statusCode: 402,
  })
}

export async function hasPaidWorkspaceAccess(
  supabase: SupabaseClient,
  repId: string,
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('rep_id', repId)
    .in('status', [...PAID_WORKSPACE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new ServiceError({
      code: 'SPARKLE_SUBSCRIPTION_LOOKUP_FAILED',
      message: 'failed to verify Sparkle Suite subscription access',
      userMessage:
        "I couldn't verify subscription access right now. Please try again.",
      statusCode: 500,
      cause: error,
    })
  }

  return Boolean(data)
}

export async function assertPaidWorkspaceAccess(
  supabase: SupabaseClient,
  repId: string,
) {
  if (await hasPaidWorkspaceAccess(supabase, repId)) return
  throw subscriptionRequiredError()
}
