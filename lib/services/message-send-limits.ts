import { createAdminClient } from '@/lib/supabase/admin'
import { errors } from './errors'

type MessageChannel = 'sms' | 'email'

const ACCEPTED_DELIVERY_STATUSES = ['queued', 'sent', 'delivered'] as const
const MANUAL_MESSAGE_LIMIT = 3
const ROLLING_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface MessageSendLimitInput {
  channel: MessageChannel
  isAutomated?: boolean
  automationKey?: string
  now?: Date
}

type MessageLogInsertError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

function getManualWindowStart(now: Date) {
  return new Date(now.getTime() - ROLLING_WEEK_MS).toISOString()
}

export function mapAutomatedMessageLogInsertError(
  error: unknown,
  input: Pick<MessageSendLimitInput, 'channel' | 'isAutomated' | 'automationKey'>,
) {
  const automationKey = input.automationKey?.trim()
  if (!input.isAutomated || !automationKey) return null

  const candidate = error as MessageLogInsertError | null
  if (!candidate || typeof candidate !== 'object') return null

  const text = [
    candidate.code,
    candidate.message,
    candidate.details,
    candidate.hint,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const isUniqueViolation =
    candidate.code === '23505' ||
    text.includes('idx_messages_automation_key_unique')

  return isUniqueViolation
    ? errors.AUTOMATED_MESSAGE_ALREADY_SENT(input.channel)
    : null
}

export async function assertMessageSendAllowed(
  repId: string,
  input: MessageSendLimitInput,
) {
  if (input.isAutomated) {
    const automationKey = input.automationKey?.trim()
    if (!automationKey) {
      throw errors.AUTOMATION_KEY_REQUIRED()
    }

    const admin = createAdminClient()
    const { count, error } = await admin
      .from('message_log')
      .select('id', { count: 'exact', head: true })
      .eq('rep_id', repId)
      .eq('channel', input.channel)
      .eq('is_automated', true)
      .in('delivery_status', [...ACCEPTED_DELIVERY_STATUSES])
      .eq('automation_key', automationKey)

    if (error) throw error
    if ((count ?? 0) > 0) {
      throw errors.AUTOMATED_MESSAGE_ALREADY_SENT(input.channel)
    }
    return
  }

  const windowStartIso = getManualWindowStart(input.now ?? new Date())
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('rep_id', repId)
    .eq('channel', input.channel)
    .eq('is_automated', false)
    .in('delivery_status', [...ACCEPTED_DELIVERY_STATUSES])
    .gte('sent_at', windowStartIso)

  if (error) throw error

  if ((count ?? 0) >= MANUAL_MESSAGE_LIMIT) {
    if (input.channel === 'sms') {
      throw errors.SMS_WEEKLY_LIMIT_REACHED()
    }
    throw errors.EMAIL_WEEKLY_LIMIT_REACHED()
  }
}
