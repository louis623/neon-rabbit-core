import type { SupabaseClient } from '@supabase/supabase-js'
import { sendSmsNotification } from './sms-notifications'
import { ServiceError } from './errors'
import type { CalendarEvent, CustomerAudienceMember } from './types'

const DEFAULT_LEAD_MINUTES = 30
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

export interface PreShowReminderPlan {
  audienceId: string
  automationKey: string
  channel: 'sms'
  eventId: string
  eventTime: string
  message: string
  recipient: string
  repId: string
  scheduledFor: string
}

export interface BuildPreShowReminderPlansInput {
  now: Date
  leadMinutes?: number
  events: CalendarEvent[]
  audienceByRepId: Record<string, CustomerAudienceMember[]>
}

export interface ProcessPreShowReminderOptions {
  dryRun?: boolean
  limit?: number
  leadMinutes?: number
  sendSms?: typeof sendSmsNotification
  liveSendsEnabled?: boolean
  now?: Date
}

type CalendarEventRow = {
  id: string
  rep_id: string
  platform: string
  event_time: string
  duration_minutes: number | null
  title: string | null
  description: string | null
  discount_codes: unknown[] | null
  featured_collections: string[] | null
  is_recurring: boolean | null
  recurrence_group_id: string | null
  recurrence_rule: string | null
  status: CalendarEvent['status']
  created_at: string
  updated_at: string
}

type CustomerAudienceRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  sms_consent: boolean
  email_consent: boolean
  marketing_consent: boolean
  consent_date: string | null
  created_at: string
  sms_opted_out_at: string | null
  email_opted_out_at: string | null
  stop_keyword_received_at: string | null
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
}

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    repId: row.rep_id,
    platform: row.platform,
    eventTime: row.event_time,
    durationMinutes: row.duration_minutes ?? 60,
    title: row.title,
    description: row.description,
    discountCodes: [],
    featuredCollections: row.featured_collections,
    isRecurring: row.is_recurring ?? false,
    recurrenceGroupId: row.recurrence_group_id,
    recurrenceRule: row.recurrence_rule,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAudience(row: CustomerAudienceRow): CustomerAudienceMember {
  const canReceiveSms =
    row.sms_consent &&
    Boolean(row.phone) &&
    !row.sms_opted_out_at &&
    !row.stop_keyword_received_at

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    smsConsent: row.sms_consent,
    emailConsent: row.email_consent,
    marketingConsent: row.marketing_consent,
    canReceiveSms,
    canReceiveEmail: row.email_consent && Boolean(row.email) && !row.email_opted_out_at,
    consentDate: row.consent_date,
    createdAt: row.created_at,
    smsOptedOutAt: row.sms_opted_out_at,
    emailOptedOutAt: row.email_opted_out_at,
    stopKeywordReceivedAt: row.stop_keyword_received_at,
  }
}

function buildMessage(event: CalendarEvent): string {
  const title = event.title?.trim() || 'Your live show'
  const platform = event.platform.trim() || 'the live show'
  return `Sparkle Suite: Reminder - ${title} starts soon on ${platform}. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
}

export function buildPreShowReminderPlans(
  input: BuildPreShowReminderPlansInput,
): PreShowReminderPlan[] {
  const leadMinutes = input.leadMinutes ?? DEFAULT_LEAD_MINUTES
  const nowMs = input.now.getTime()
  const dueByMs = nowMs + leadMinutes * 60 * 1000
  const scheduledFor = input.now.toISOString()

  return input.events.flatMap((event) => {
    const eventMs = Date.parse(event.eventTime)
    if (event.status !== 'scheduled') return []
    if (!Number.isFinite(eventMs) || eventMs <= nowMs || eventMs > dueByMs) {
      return []
    }

    const audience = input.audienceByRepId[event.repId] ?? []
    return audience
      .filter((customer) => customer.canReceiveSms && customer.phone)
      .map((customer) => ({
        audienceId: customer.id,
        automationKey: `show:${event.id}:pre-show-sms`,
        channel: 'sms' as const,
        eventId: event.id,
        eventTime: event.eventTime,
        message: buildMessage(event),
        recipient: customer.phone!,
        repId: event.repId,
        scheduledFor,
      }))
  })
}

async function loadEvents(
  supabase: SupabaseClient,
  opts: { now: Date; leadMinutes: number; limit: number },
): Promise<CalendarEvent[]> {
  const dueBy = new Date(
    opts.now.getTime() + opts.leadMinutes * 60 * 1000,
  ).toISOString()

  const { data, error } = await supabase
    .from('calendar_events')
    .select(
      [
        'id',
        'rep_id',
        'platform',
        'event_time',
        'duration_minutes',
        'title',
        'description',
        'discount_codes',
        'featured_collections',
        'is_recurring',
        'recurrence_group_id',
        'recurrence_rule',
        'status',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('status', 'scheduled')
    .gt('event_time', opts.now.toISOString())
    .lte('event_time', dueBy)
    .order('event_time', { ascending: true })
    .limit(opts.limit)

  if (error) throw error
  return ((data ?? []) as unknown as CalendarEventRow[]).map(mapEvent)
}

async function loadAudienceByRepId(
  supabase: SupabaseClient,
  repIds: string[],
): Promise<Record<string, CustomerAudienceMember[]>> {
  if (repIds.length === 0) return {}

  const { data, error } = await supabase
    .from('customer_audience')
    .select(
      [
        'id',
        'rep_id',
        'name',
        'phone',
        'email',
        'sms_consent',
        'email_consent',
        'marketing_consent',
        'consent_date',
        'sms_opted_out_at',
        'email_opted_out_at',
        'stop_keyword_received_at',
        'created_at',
      ].join(', '),
    )
    .in('rep_id', repIds)
    .eq('sms_consent', true)

  if (error) throw error

  return (
    (data ?? []) as unknown as Array<CustomerAudienceRow & { rep_id: string }>
  ).reduce((byRep, row) => {
    byRep[row.rep_id] = byRep[row.rep_id] ?? []
    byRep[row.rep_id].push(mapAudience(row))
    return byRep
  }, {} as Record<string, CustomerAudienceMember[]>)
}

export async function processDuePreShowReminders(
  supabase: SupabaseClient,
  options: ProcessPreShowReminderOptions = {},
) {
  const dryRun = options.dryRun ?? true
  const sendSms = options.sendSms ?? sendSmsNotification

  if (!dryRun && !options.liveSendsEnabled) {
    throw new ServiceError({
      code: 'PRE_SHOW_REMINDER_SEND_DISABLED',
      message: 'pre-show SMS sends are disabled',
      userMessage:
        'Automated show reminders are not enabled in this environment yet.',
      statusCode: 403,
    })
  }

  const now = options.now ?? new Date()
  const leadMinutes = options.leadMinutes ?? DEFAULT_LEAD_MINUTES
  const events = await loadEvents(supabase, {
    now,
    leadMinutes,
    limit: clampLimit(options.limit),
  })
  const repIds = [...new Set(events.map((event) => event.repId))]
  const audienceByRepId = await loadAudienceByRepId(supabase, repIds)
  const plans = buildPreShowReminderPlans({
    now,
    leadMinutes,
    events,
    audienceByRepId,
  })

  if (dryRun) {
    return {
      dryRun: true,
      plannedCount: plans.length,
      sentCount: 0,
      skippedCount: 0,
      plans,
      sends: [],
      skipped: [],
    }
  }

  const sends = []
  const skipped = []
  for (const plan of plans) {
    try {
      const result = await sendSms(
        plan.repId,
        { recipientPhone: plan.recipient, message: plan.message },
        { isAutomated: true, automationKey: plan.automationKey, now },
      )
      sends.push({ plan, result })
    } catch (error) {
      skipped.push({
        plan,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    dryRun: false,
    plannedCount: plans.length,
    sentCount: sends.length,
    skippedCount: skipped.length,
    plans,
    sends,
    skipped,
  }
}
