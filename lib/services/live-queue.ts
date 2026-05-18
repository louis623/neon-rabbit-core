import type { SupabaseClient } from '@supabase/supabase-js'
import type { LiveQueueSnapshot } from '@/lib/services/types'

const AUTO_ANCHOR_PREFIX = 'NIC-NAC-AUTO-'
const DEFAULT_STALE_AFTER_SECONDS = 180
const MAX_QUEUE_NAMES = 200

type LiveQueueRow = {
  sync_code: string
  queue: unknown
  last_updated: string | null
}

export interface GetLiveQueueSnapshotInput {
  repId: string
  syncCode: string | null | undefined
  now?: Date
  staleAfterSeconds?: number
}

export function normalizeLiveQueue(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item).trim()
      }
      return ''
    })
    .filter(Boolean)
    .slice(0, MAX_QUEUE_NAMES)
}

export function buildLiveQueueSnapshot(
  row: LiveQueueRow,
  options: { now?: Date; staleAfterSeconds?: number } = {},
): LiveQueueSnapshot {
  const now = options.now ?? new Date()
  const staleAfterSeconds =
    options.staleAfterSeconds ?? DEFAULT_STALE_AFTER_SECONDS
  const queue = normalizeLiveQueue(row.queue)
  const updatedAt = row.last_updated ? new Date(row.last_updated) : null
  const ageSeconds =
    updatedAt && Number.isFinite(updatedAt.getTime())
      ? Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / 1000))
      : null

  return {
    syncCode: row.sync_code,
    queue,
    queueLength: queue.length,
    currentCustomer: queue[0] ?? null,
    onDeckCustomer: queue[1] ?? null,
    lastUpdated: row.last_updated,
    ageSeconds,
    staleAfterSeconds,
    isFresh: ageSeconds !== null && ageSeconds <= staleAfterSeconds,
  }
}

export async function getLiveQueueSnapshot(
  supabase: SupabaseClient,
  input: GetLiveQueueSnapshotInput,
): Promise<LiveQueueSnapshot | null> {
  const syncCode = String(input.syncCode ?? '').trim()
  if (!syncCode || syncCode.startsWith(AUTO_ANCHOR_PREFIX)) return null

  const { data, error } = await supabase
    .from('live_queue')
    .select('sync_code, queue, last_updated')
    .eq('rep_id', input.repId)
    .eq('sync_code', syncCode)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return buildLiveQueueSnapshot(data as unknown as LiveQueueRow, {
    now: input.now,
    staleAfterSeconds: input.staleAfterSeconds,
  })
}
