import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type WaitlistRow = {
  id: string
  name: string
  email: string
  phone: string | null
  tiktok_handle: string | null
  source: string
  lead_status: string
  intake_submission_id: string | null
  created_at: string
}

type IntakeRow = {
  id: string
  business_name: string | null
}

const WAITLIST_SELECT = [
  'id',
  'name',
  'email',
  'phone',
  'tiktok_handle',
  'source',
  'lead_status',
  'intake_submission_id',
  'created_at',
].join(', ')

function cleanNullable(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function mapControlCenterWaitlistLead(
  row: WaitlistRow,
  shopName: string | null,
) {
  return {
    leadId: row.id,
    name: row.name,
    shopName: cleanNullable(shopName),
    contact: {
      email: row.email,
      phone: cleanNullable(row.phone),
      tiktokHandle: cleanNullable(row.tiktok_handle),
    },
    signupSource: row.source,
    signupDate: row.created_at,
    status: row.lead_status,
  }
}

async function loadShopNames(
  supabase: SupabaseClient,
  rows: WaitlistRow[],
) {
  const intakeIds = Array.from(
    new Set(
      rows.flatMap((row) =>
        typeof row.intake_submission_id === 'string'
          ? [row.intake_submission_id]
          : [],
      ),
    ),
  )
  if (intakeIds.length === 0) return new Map<string, string | null>()

  const { data, error } = await supabase
    .from('sparkle_suite_intake_submissions')
    .select('id, business_name')
    .in('id', intakeIds)
  if (error) throw error

  return new Map(
    ((data ?? []) as IntakeRow[]).map((row) => [
      row.id,
      cleanNullable(row.business_name),
    ]),
  )
}

export async function listControlCenterWaitlistLeads(
  supabase: SupabaseClient,
  options: { status?: string; limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100)
  let query = supabase
    .from('sparkle_suite_waitlist')
    .select(WAITLIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (options.status) query = query.eq('lead_status', options.status)

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as unknown as WaitlistRow[]
  const shopNames = await loadShopNames(supabase, rows)

  return rows.map((row) =>
    mapControlCenterWaitlistLead(
      row,
      row.intake_submission_id
        ? (shopNames.get(row.intake_submission_id) ?? null)
        : null,
    ),
  )
}

export async function getControlCenterWaitlistLead(
  supabase: SupabaseClient,
  leadId: string,
) {
  const { data, error } = await supabase
    .from('sparkle_suite_waitlist')
    .select(WAITLIST_SELECT)
    .eq('id', leadId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as WaitlistRow
  const shopNames = await loadShopNames(supabase, [row])
  return mapControlCenterWaitlistLead(
    row,
    row.intake_submission_id
      ? (shopNames.get(row.intake_submission_id) ?? null)
      : null,
  )
}
