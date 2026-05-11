import type { SupabaseClient } from '@supabase/supabase-js'
import { errors } from '@/lib/services/errors'
import type {
  CreateRepSupportMessageInput,
  GetRepMessagesFilters,
  RepMessageSummary,
  RepMessagesDashboardResult,
  RepMessageType,
  MessageDirection,
} from '@/lib/services/types'

type RepMessageRow = {
  id: string
  message_type: RepMessageType
  direction: MessageDirection
  subject: string | null
  body: string
  is_read: boolean | null
  read_at: string | null
  created_at: string
}

const MESSAGE_SELECT =
  'id, message_type, direction, subject, body, is_read, read_at, created_at'

function mapRepMessage(row: RepMessageRow): RepMessageSummary {
  return {
    id: row.id,
    messageType: row.message_type,
    direction: row.direction,
    subject: row.subject,
    body: row.body,
    isRead: row.is_read ?? false,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function getRepMessages(
  supabase: SupabaseClient,
  repId: string,
  filters: GetRepMessagesFilters = {},
): Promise<RepMessagesDashboardResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  let query = supabase
    .from('rep_messages')
    .select(MESSAGE_SELECT)
    .eq('rep_id', repId)
    .order('created_at', { ascending: false })

  if (filters.messageType) {
    query = query.eq('message_type', filters.messageType)
  }

  if (filters.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const [{ data, error }, unreadResult] = await Promise.all([
    query,
    supabase
      .from('rep_messages')
      .select('id', { head: true, count: 'exact' })
      .eq('rep_id', repId)
      .eq('is_read', false),
  ])

  if (error) throw error
  if (unreadResult.error) throw unreadResult.error

  return {
    unreadCount: unreadResult.count ?? 0,
    messages: ((data ?? []) as RepMessageRow[]).map(mapRepMessage),
  }
}

export async function createRepSupportMessage(
  supabase: SupabaseClient,
  repId: string,
  input: CreateRepSupportMessageInput,
): Promise<RepMessageSummary> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.subject.trim()) {
    throw errors.INVALID_INPUT(
      'subject required',
      'Add a short subject so support knows what this is about.',
    )
  }
  if (!input.body.trim()) {
    throw errors.INVALID_INPUT(
      'body required',
      'Add a short note so Neon Rabbit knows what help you need.',
    )
  }

  const { data, error } = await supabase
    .from('rep_messages')
    .insert({
      rep_id: repId,
      message_type: 'support_request',
      direction: 'rep_to_nr',
      subject: input.subject.trim(),
      body: input.body.trim(),
      is_read: false,
    })
    .select(MESSAGE_SELECT)
    .single()

  if (error || !data) throw error ?? new Error('support message insert failed')
  return mapRepMessage(data as RepMessageRow)
}

export async function markRepMessageRead(
  supabase: SupabaseClient,
  repId: string,
  messageId: string,
): Promise<RepMessageSummary> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!messageId.trim()) throw errors.MISSING_ITEM_INPUT()

  const { data, error } = await supabase
    .from('rep_messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('rep_id', repId)
    .select(MESSAGE_SELECT)
    .single()

  if (error || !data) {
    throw error ?? errors.LISTING_NOT_FOUND(`message ${messageId}`)
  }

  return mapRepMessage(data as RepMessageRow)
}
