import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'

export type WorkspaceMessageAudience =
  | { kind: 'all_active' }
  | { kind: 'selected'; repIds: string[] }

export interface WorkspaceMessageAudienceMember {
  repId: string
  displayName: string
  businessName: string
}

export interface WorkspaceMessageAudiencePreview {
  rule: WorkspaceMessageAudience
  members: WorkspaceMessageAudienceMember[]
  count: number
}

type RepRow = {
  id: string
  display_name: string
  business_name: string
}

function audienceError(
  code: string,
  message: string,
  statusCode = 400,
) {
  return new ServiceError({ code, message, userMessage: message, statusCode })
}

function normalizeAudience(
  audience: WorkspaceMessageAudience,
): WorkspaceMessageAudience {
  if (audience.kind === 'all_active') return { kind: 'all_active' }
  if (audience.kind !== 'selected' || !Array.isArray(audience.repIds)) {
    throw audienceError(
      'WORKSPACE_MESSAGE_INVALID_AUDIENCE',
      'Choose all active reps or a selected rep audience.',
    )
  }
  const repIds = [...new Set(audience.repIds.map((id) => id.trim()).filter(Boolean))]
  if (repIds.length === 0) {
    throw audienceError(
      'WORKSPACE_MESSAGE_EMPTY_AUDIENCE',
      'Select at least one recipient.',
    )
  }
  if (repIds.length > 10_000) {
    throw audienceError(
      'WORKSPACE_MESSAGE_AUDIENCE_TOO_LARGE',
      'The selected recipient list is too large.',
    )
  }
  return { kind: 'selected', repIds }
}

export async function resolveWorkspaceMessageAudience(
  supabase: SupabaseClient,
  audience: WorkspaceMessageAudience,
): Promise<WorkspaceMessageAudiencePreview> {
  const normalized = normalizeAudience(audience)
  let query = supabase
    .from('reps')
    .select('id, display_name, business_name')
    .eq('status', 'active')

  if (normalized.kind === 'selected') {
    query = query.in('id', normalized.repIds)
  }

  const { data, error } = await query.order('display_name', { ascending: true })
  if (error) throw error

  const rows = (data ?? []) as RepRow[]
  if (normalized.kind === 'selected' && rows.length !== normalized.repIds.length) {
    const found = new Set(rows.map((row) => row.id))
    const missing = normalized.repIds.filter((id) => !found.has(id))
    throw audienceError(
      'WORKSPACE_MESSAGE_RECIPIENT_UNAVAILABLE',
      `Some selected recipients are not active or do not exist: ${missing.join(', ')}`,
      409,
    )
  }
  if (rows.length === 0) {
    throw audienceError(
      'WORKSPACE_MESSAGE_EMPTY_AUDIENCE',
      'No active recipients matched this audience.',
      409,
    )
  }

  const members = rows
    .map((row) => ({
      repId: row.id,
      displayName: row.display_name,
      businessName: row.business_name,
    }))
    .sort(
      (left, right) =>
        left.displayName.localeCompare(right.displayName) ||
        left.repId.localeCompare(right.repId),
    )

  return { rule: normalized, members, count: members.length }
}

export const previewWorkspaceMessageAudience = resolveWorkspaceMessageAudience

export function serializeWorkspaceMessageAudienceSnapshot(
  preview: WorkspaceMessageAudiencePreview,
) {
  return preview.members.map((member) => ({
    repId: member.repId,
    displayName: member.displayName,
    businessName: member.businessName,
  }))
}
