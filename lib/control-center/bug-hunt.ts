import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export const BUG_HUNT_ITEM_TYPES = ['bug', 'update', 'research', 'content', 'operations'] as const
export const BUG_HUNT_STATUSES = ['open', 'in_progress', 'blocked', 'complete'] as const
export const BUG_HUNT_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const

export type BugHuntItemType = (typeof BUG_HUNT_ITEM_TYPES)[number]
export type BugHuntStatus = (typeof BUG_HUNT_STATUSES)[number]
export type BugHuntPriority = (typeof BUG_HUNT_PRIORITIES)[number]

export type BugHuntItem = {
  id: string
  title: string
  details: string
  itemType: BugHuntItemType
  status: BugHuntStatus
  priority: BugHuntPriority
  owner: string
  source: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  sourceSupportReportId: string | null
}

type BugHuntRow = {
  id: string
  title: string
  details: string | null
  item_type: BugHuntItemType
  status: BugHuntStatus
  priority: BugHuntPriority
  owner: string | null
  source: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  source_support_report_id: string | null
}

export const BUG_HUNT_SELECT = 'id, title, details, item_type, status, priority, owner, source, created_at, updated_at, completed_at, source_support_report_id'

export function normalizeBugHuntItem(row: BugHuntRow): BugHuntItem {
  return {
    id: row.id,
    title: row.title,
    details: row.details?.trim() ?? '',
    itemType: row.item_type,
    status: row.status,
    priority: row.priority,
    owner: row.owner?.trim() ?? '',
    source: row.source?.trim() ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    sourceSupportReportId: row.source_support_report_id,
  }
}

export async function loadBugHuntItems(
  admin: AdminClient = createAdminClient(),
): Promise<BugHuntItem[]> {
  const { data, error } = await admin
    .from('sparkle_suite_bug_hunt_items')
    .select(BUG_HUNT_SELECT)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => normalizeBugHuntItem(row as BugHuntRow))
}
