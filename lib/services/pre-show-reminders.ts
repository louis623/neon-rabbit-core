import type { SupabaseClient } from '@supabase/supabase-js'
import { sendSmsNotification } from './sms-notifications'
import { sendEmailNotification } from './email-notifications'
import { ServiceError } from './errors'
import type {
  CalendarEvent,
  CustomerAudienceMember,
  ShowReminderOverride,
  ShowReminderPreferences,
} from './types'
import { DEFAULT_REP_TIME_ZONE } from './calendar-timezone'
import {
  defaultShowReminderPreferences,
  getShowReminderPreferences,
  listShowReminderOverrides,
} from './show-reminder-preferences'

const DEFAULT_LEAD_MINUTES = 30
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100
const MAX_REMINDER_LEAD_MINUTES = 180

export interface PreShowReminderPlan {
  audienceId: string
  automationKey: string
  channel: 'sms' | 'email'
  eventId: string
  eventTime: string
  message: string
  recipient: string
  repId: string
  scheduledFor: string
  subject?: string
}

export interface BuildPreShowReminderPlansInput {
  now: Date
  leadMinutes?: number
  events: CalendarEvent[]
  audienceByRepId: Record<string, CustomerAudienceMember[]>
  preferencesByRepId?: Record<string, ShowReminderPreferences>
  overridesByEventId?: Record<string, ShowReminderOverride>
}

export interface ProcessPreShowReminderOptions {
  dryRun?: boolean
  limit?: number
  leadMinutes?: number
  sendSms?: typeof sendSmsNotification
  sendEmail?: typeof sendEmailNotification
  liveSendsEnabled?: boolean
  liveEmailSendsEnabled?: boolean
  now?: Date
}

type ReminderSendRecord = {
  plan: PreShowReminderPlan
  result: unknown
}

type ReminderSkipRecord = {
  plan: PreShowReminderPlan
  error: string
}

type CalendarEventRow = {
  id: string
  rep_id: string
  platform: string
  event_time: string
  time_zone: string | null
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
    timeZone: row.time_zone ?? DEFAULT_REP_TIME_ZONE,
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

function buildReminderMessage(
  event: CalendarEvent,
  preferences: Pick<
    ShowReminderPreferences,
    'includeDiscountCodes' | 'includeFeaturedCollections'
  >,
  channel: 'sms' | 'email',
): string {
  const title = event.title?.trim() || 'Your live show'
  const platform = event.platform.trim() || 'the live show'
  const extras: string[] = []

  if (preferences.includeDiscountCodes && event.discountCodes.length) {
    extras.push(`Codes: ${event.discountCodes.map((discountCode) => discountCode.code).join(', ')}`)
  }
  if (preferences.includeFeaturedCollections && event.featuredCollections?.length) {
    extras.push(`Featured: ${event.featuredCollections.join(', ')}`)
  }

  if (channel === 'sms') {
    const suffix = extras.length ? ` ${extras.join(' ')}` : ''
    return `Sparkle Suite: Reminder - ${title} starts soon on ${platform}.${suffix} Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.`
  }

  return [
    `${title} starts soon on ${platform}.`,
    ...extras,
    '',
    'You are receiving this because you opted in for show reminders.',
  ].join('\n')
}

function normalizeReminderRecipient(phone: string): string {
  const compact = phone.trim().replace(/[\s().-]/g, '')
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact
  if (/^\d{10}$/.test(compact)) return `+1${compact}`
  return compact
}

export function buildPreShowReminderPlans(
  input: BuildPreShowReminderPlansInput,
): PreShowReminderPlan[] {
  const nowMs = input.now.getTime()
  const scheduledFor = input.now.toISOString()

  return input.events.flatMap((event) => {
    const preferences = input.overridesByEventId?.[event.id] ??
      input.preferencesByRepId?.[event.repId] ?? defaultShowReminderPreferences(event.repId)
    if (!preferences.enabled) return []
    const leadMinutes = input.leadMinutes ?? preferences.leadMinutes ?? DEFAULT_LEAD_MINUTES
    const dueByMs = nowMs + leadMinutes * 60 * 1000
    const eventMs = Date.parse(event.eventTime)
    if (event.status !== 'scheduled') return []
    if (!Number.isFinite(eventMs) || eventMs <= nowMs || eventMs > dueByMs) {
      return []
    }

    const audience = input.audienceByRepId[event.repId] ?? []
    const plans: PreShowReminderPlan[] = []
    for (const customer of audience) {
      if (preferences.channels.includes('sms') && customer.canReceiveSms && customer.phone) {
        plans.push({
          audienceId: customer.id,
          automationKey: `show:${event.id}:audience:${customer.id}:pre-show-sms`,
          channel: 'sms',
          eventId: event.id,
          eventTime: event.eventTime,
          message: input.preferencesByRepId
            ? buildReminderMessage(event, preferences, 'sms')
            : buildMessage(event),
          recipient: normalizeReminderRecipient(customer.phone),
          repId: event.repId,
          scheduledFor,
        })
      }
      if (preferences.channels.includes('email') && customer.canReceiveEmail && customer.email) {
        const title = event.title?.trim() || 'Your live show'
        plans.push({
          audienceId: customer.id,
          automationKey: `show:${event.id}:audience:${customer.id}:pre-show-email`,
          channel: 'email',
          eventId: event.id,
          eventTime: event.eventTime,
          message: buildReminderMessage(event, preferences, 'email'),
          recipient: customer.email,
          repId: event.repId,
          scheduledFor,
          subject: `Reminder: ${title} starts soon`,
        })
      }
    }
    return plans
  })
}

async function loadPreferencesByRepId(
  supabase: SupabaseClient,
  repIds: string[],
): Promise<Record<string, ShowReminderPreferences>> {
  const entries = await Promise.all(
    repIds.map(async (repId) => [repId, await getShowReminderPreferences(supabase, repId)] as const),
  )
  return Object.fromEntries(entries)
}

async function loadOverridesByEventId(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, ShowReminderOverride>> {
  return listShowReminderOverrides(supabase, eventIds)
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
        'time_zone',
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

  if (error) throw error

  return (
    (data ?? []) as unknown as Array<CustomerAudienceRow & { rep_id: string }>
  ).reduce((byRep, row) => {
    byRep[row.rep_id] = byRep[row.rep_id] ?? []
    byRep[row.rep_id].push(mapAudience(row))
    return byRep
  }, {} as Record<string, CustomerAudienceMember[]>)
}

async function persistPreShowReminderRun(
  supabase: SupabaseClient,
  input: {
    dryRun: boolean
    status: 'completed' | 'failed'
    now: Date
    limit?: number
    leadMinutes?: number
    liveSmsSendsEnabled: boolean
    liveEmailSendsEnabled: boolean
    plans: PreShowReminderPlan[]
    sends: ReminderSendRecord[]
    skipped: ReminderSkipRecord[]
    disabledReason?: string
  },
): Promise<string | null> {
  try {
    const repIds = [...new Set(input.plans.map((plan) => plan.repId))]
    const { data, error } = await supabase
      .from('show_reminder_runs')
      .insert({
        run_mode: input.dryRun ? 'dry_run' : 'live',
        status: input.status,
        rep_ids: repIds,
        live_sms_enabled: input.liveSmsSendsEnabled,
        live_email_enabled: input.liveEmailSendsEnabled,
        planned_count: input.plans.length,
        sent_count: input.sends.length,
        skipped_count: input.skipped.length,
        started_at: input.now.toISOString(),
        completed_at: new Date().toISOString(),
        metadata: {
          limit: input.limit ?? null,
          leadMinutes: input.leadMinutes ?? null,
          disabledReason: input.disabledReason ?? null,
        },
      })
      .select('id')
      .single()
    if (error) throw error

    const runId = (data as { id?: string } | null)?.id
    if (!runId) return null

    if (input.plans.length) {
      const sentByKey = new Set(
        input.sends.map((send) => send.plan.automationKey),
      )
      const skippedByKey = new Map(
        input.skipped.map((skip) => [skip.plan.automationKey, skip.error]),
      )

      const rows = input.plans.map((plan) => ({
        run_id: runId,
        rep_id: plan.repId,
        event_id: plan.eventId,
        audience_id: plan.audienceId,
        channel: plan.channel,
        automation_key: plan.automationKey,
        status: sentByKey.has(plan.automationKey)
          ? 'sent'
          : skippedByKey.has(plan.automationKey)
            ? 'skipped'
            : 'planned',
        recipient: plan.recipient,
        scheduled_for: plan.scheduledFor,
        event_time: plan.eventTime,
        error: skippedByKey.get(plan.automationKey) ?? null,
        message_preview: plan.message.slice(0, 280),
        metadata: {
          subject: plan.subject ?? null,
        },
      }))

      const { error: itemsError } = await supabase
        .from('show_reminder_run_items')
        .insert(rows)
      if (itemsError) throw itemsError
    }

    return runId
  } catch (error) {
    console.error('[pre-show-reminders] failed to persist run ledger', {
      error,
    })
    return null
  }
}

export async function recordPreShowReminderNoop(
  supabase: SupabaseClient,
  input: {
    now?: Date
    limit?: number
    liveSmsSendsEnabled?: boolean
    liveEmailSendsEnabled?: boolean
    disabledReason: string
  },
): Promise<string | null> {
  return persistPreShowReminderRun(supabase, {
    dryRun: false,
    status: 'completed',
    now: input.now ?? new Date(),
    limit: input.limit,
    liveSmsSendsEnabled: input.liveSmsSendsEnabled ?? false,
    liveEmailSendsEnabled: input.liveEmailSendsEnabled ?? false,
    plans: [],
    sends: [],
    skipped: [],
    disabledReason: input.disabledReason,
  })
}

export async function processDuePreShowReminders(
  supabase: SupabaseClient,
  options: ProcessPreShowReminderOptions = {},
) {
  const dryRun = options.dryRun ?? true
  const sendSms = options.sendSms ?? sendSmsNotification
  const sendEmail = options.sendEmail ?? sendEmailNotification
  const liveSmsSendsEnabled = options.liveSendsEnabled ?? false
  const liveEmailSendsEnabled = options.liveEmailSendsEnabled ?? false

  if (!dryRun && !liveSmsSendsEnabled && !liveEmailSendsEnabled) {
    throw new ServiceError({
      code: 'PRE_SHOW_REMINDER_SEND_DISABLED',
      message: 'pre-show reminder sends are disabled',
      userMessage:
        'Automated show reminders are not enabled in this environment yet.',
      statusCode: 403,
    })
  }

  const now = options.now ?? new Date()
  const leadMinutes = options.leadMinutes
  const events = await loadEvents(supabase, {
    now,
    leadMinutes: options.leadMinutes ?? MAX_REMINDER_LEAD_MINUTES,
    limit: clampLimit(options.limit),
  })
  const repIds = [...new Set(events.map((event) => event.repId))]
  const audienceByRepId = await loadAudienceByRepId(supabase, repIds)
  const preferencesByRepId = await loadPreferencesByRepId(supabase, repIds)
  const overridesByEventId = await loadOverridesByEventId(
    supabase,
    events.map((event) => event.id),
  )
  const plans = buildPreShowReminderPlans({
    now,
    leadMinutes,
    events,
    audienceByRepId,
    preferencesByRepId,
    overridesByEventId,
  })

  if (dryRun) {
    const reminderRunId = await persistPreShowReminderRun(supabase, {
      dryRun: true,
      status: 'completed',
      now,
      limit: options.limit,
      leadMinutes,
      liveSmsSendsEnabled,
      liveEmailSendsEnabled,
      plans,
      sends: [],
      skipped: [],
    })

    return {
      dryRun: true,
      reminderRunId,
      plannedCount: plans.length,
      sentCount: 0,
      skippedCount: 0,
      plans,
      sends: [],
      skipped: [],
    }
  }

  const sends: ReminderSendRecord[] = []
  const skipped: ReminderSkipRecord[] = []
  for (const plan of plans) {
    try {
      if (plan.channel === 'email') {
        if (!liveEmailSendsEnabled) {
          skipped.push({ plan, error: 'pre-show email sends are disabled' })
          continue
        }
        const result = await sendEmail(
          plan.repId,
          {
            recipientEmail: plan.recipient,
            subject: plan.subject ?? 'Show reminder',
            body: plan.message,
          },
          { isAutomated: true, automationKey: plan.automationKey, now },
        )
        sends.push({ plan, result })
        continue
      }

      if (!liveSmsSendsEnabled) {
        skipped.push({ plan, error: 'pre-show SMS sends are disabled' })
        continue
      }

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

  const reminderRunId = await persistPreShowReminderRun(supabase, {
    dryRun: false,
    status: 'completed',
    now,
    limit: options.limit,
    leadMinutes,
    liveSmsSendsEnabled,
    liveEmailSendsEnabled,
    plans,
    sends,
    skipped,
  })

  return {
    dryRun: false,
    reminderRunId,
    plannedCount: plans.length,
    sentCount: sends.length,
    skippedCount: skipped.length,
    plans,
    sends,
    skipped,
  }
}
