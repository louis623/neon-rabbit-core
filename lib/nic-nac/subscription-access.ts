import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'
import {
  resolveWorkspaceAccess,
  WORKSPACE_PAID_SUBSCRIPTION_STATUSES,
} from '@/lib/services/workspace-access'

export const PAID_WORKSPACE_STATUSES = WORKSPACE_PAID_SUBSCRIPTION_STATUSES

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
  return (await resolveWorkspaceAccess({ supabase, repId })).hasFullAccess
}

export async function assertPaidWorkspaceAccess(
  supabase: SupabaseClient,
  repId: string,
) {
  if (await hasPaidWorkspaceAccess(supabase, repId)) return
  throw subscriptionRequiredError()
}
