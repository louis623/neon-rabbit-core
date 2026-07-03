// Tool: prepare_calendar_work - read-only resolver for live calendar work.
// It gives Nic-Nac the app-owned next path before calendar/reminder writes run.

import { z } from 'zod'
import { tool } from 'ai'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  requestText: z.string().min(1),
  knownEventId: z.string().uuid().optional(),
  knownPauseUntil: z.string().optional(),
  knownTimeZone: z.string().optional(),
})

type CalendarWorkIntent =
  | 'add_show'
  | 'update_show'
  | 'series_update'
  | 'cancel_show'
  | 'skip_occurrence'
  | 'cancel_series_future'
  | 'pause_series_range'
  | 'default_reminder_preferences'
  | 'show_reminder_override'
  | 'list_shows'
  | 'unknown'

type CalendarWorkScope =
  | 'occurrence'
  | 'series_future'
  | 'series_range'
  | 'rep_default'
  | 'event'
  | 'calendar'

const BASE_HARD_RULES = [
  'This preflight is read-only and never mutates the calendar or reminder settings.',
  'No SMS or email sends are triggered by calendar/reminder setup tools.',
  'When needsApproval is true, call the recommended approval-gated write tool; the tool emits the confirmation dialog. Do not ask a separate natural-language confirmation first.',
]

const REMINDER_HARD_RULE =
  'Reminder preference tools only save future scheduled-job settings; they do not send SMS or email immediately.'

const SERIES_UPDATE_HARD_RULE =
  'Do not combine applyToSeries:true with eventTime. Series-wide edits can update details, codes, collections, platform, duration, title, description, and timezone only.'

const SKIP_HARD_RULE =
  'skip_show_occurrence cancels exactly one occurrence and preserves the rest of a recurring series.'

const CANCEL_SHOW_HARD_RULE =
  'cancel_show cancels one scheduled/live show entry. Use it for one-time, specific, or titled show cancellation when the rep is not asking to preserve a recurring series occurrence.'

const PAUSE_HARD_RULE =
  'pause_show_series needs a bounded pauseUntil date and cancels only scheduled occurrences inside that window.'

const CANCEL_SERIES_HARD_RULE =
  'cancel_show_series cancels the selected recurring occurrence plus future scheduled occurrences in that series.'

type CalendarWorkPlan = {
  intent: CalendarWorkIntent
  scope: CalendarWorkScope
  needsEventId: boolean
  needsPauseUntil: boolean
  needsApproval: boolean
  recommendedTools: string[]
  missingFields: string[]
  hardRules: string[]
  nextAction: string
  sendsTriggered: false
  parsedShowPatch?: {
    applyToSeries?: boolean
    discountCodes?: Array<{ code: string }>
    featuredCollections?: string[]
  }
  parsedReminderPatch?: {
    enabled?: boolean
    channels?: Array<'sms' | 'email'>
    leadMinutes?: number
  }
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text))
}

function includesSeriesLanguage(text: string) {
  return hasAny(text, [
    /\ball\b/,
    /\bevery\b/,
    /\bfuture\b/,
    /\bseries\b/,
    /\bre[- ]?occur(?:ring|s)?\b/,
    /\brecurring\b/,
    /\bongoing\b/,
    /\bforeseeable future\b/,
    /\bmon(day)?s?\b/,
    /\btue(s|sday)?s?\b/,
    /\bwed(nesday)?s?\b/,
    /\bthu(r|rsday)?s?\b/,
    /\bfri(day)?s?\b/,
    /\bsat(urday)?s?\b/,
    /\bsun(day)?s?\b/,
  ])
}

function includesAddShowLanguage(text: string) {
  return hasAny(text, [
    /\b(add|schedule|set up|create|put)\b[\s\S]{0,120}\b(show|live|event|calendar)\b/,
    /\bnew\b[\s\S]{0,100}\b(one[- ]?time|show|live|event)\b/,
    /\breplace\b[\s\S]{0,140}\bwith\b[\s\S]{0,100}\bnew\b[\s\S]{0,100}\b(show|live|event)\b/,
    /\bre[- ]?occur(?:ring|s)?\b/,
    /\bforeseeable future\b/,
  ])
}

function includesSpecificOneTimeCancelLanguage(text: string) {
  return (
    hasAny(text, [
      /\bcancel\b[\s\S]{0,100}\bone[- ]?time\b[\s\S]{0,60}\b(show|live|event)\b/,
      /\bcancel\b[\s\S]{0,100}\b(show|live|event)\s+titled\b/,
      /\bcancel\b[\s\S]{0,100}\btitled\b/,
      /\bcancel\b[\s\S]{0,100}\bspecific\b[\s\S]{0,60}\b(show|live|event)\b/,
    ]) &&
    !hasAny(text, [/\bfuture\b/, /\bseries\b/, /\bre[- ]?occur(?:ring|s)?\b/, /\brecurring\b/, /\bevery\b/, /\ball\b/])
  )
}

function extractDiscountCode(requestText: string) {
  const match = requestText.match(/\b(?:code|discount)\b[\s\S]{0,80}\b([A-Z0-9][A-Z0-9_-]{2,24})\b/i)
  const code = match?.[1]?.toUpperCase()
  if (!code) return undefined
  if (['ALL', 'EVERY', 'FUTURE', 'LIVES', 'SHOWS'].includes(code)) return undefined
  return code
}

function extractLeadMinutes(text: string) {
  const minuteMatch = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes)?\s*(?:before|prior)\b/)
  if (minuteMatch) return Number(minuteMatch[1])

  const looseMatch = text.match(/\b(\d{1,3})\b[\s\S]{0,40}\b(?:before|ahead of)\b/)
  if (looseMatch) return Number(looseMatch[1])

  return undefined
}

function parseReminderPatch(text: string): CalendarWorkPlan['parsedReminderPatch'] {
  const channels: Array<'sms' | 'email'> = []
  if (/\b(text|sms)\b/.test(text) && !/\b(no|off|disable|turn off)\b[\s\S]{0,40}\b(text|sms)\b/.test(text)) {
    channels.push('sms')
  }
  if (/\bemail\b/.test(text) && !/\b(no|off|disable|turn off)\b[\s\S]{0,40}\bemail\b/.test(text)) {
    channels.push('email')
  }
  if (/\b(text|sms)\b/.test(text) && /\b(email)\b/.test(text) && /\b(keep|but keep|leave)\b[\s\S]{0,20}\bemail\b/.test(text)) {
    return {
      enabled: true,
      channels: ['email'],
    }
  }

  const leadMinutes = extractLeadMinutes(text)
  const patch: CalendarWorkPlan['parsedReminderPatch'] = { enabled: true }
  if (channels.length) patch.channels = [...new Set(channels)]
  if (leadMinutes) patch.leadMinutes = leadMinutes
  return patch
}

function plan(input: z.infer<typeof inputSchema>): CalendarWorkPlan {
  const originalText = input.requestText.trim()
  const text = originalText.toLowerCase()
  const knownEventId = Boolean(
    input.knownEventId &&
      input.knownEventId !== '00000000-0000-0000-0000-000000000000',
  )
  const knownPauseUntil = Boolean(input.knownPauseUntil?.trim())
  const seriesLanguage = includesSeriesLanguage(text)
  const hardRules = [...BASE_HARD_RULES]

  const build = (partial: Omit<CalendarWorkPlan, 'hardRules' | 'sendsTriggered' | 'missingFields'> & {
    hardRules?: string[]
    missingFields?: string[]
  }): CalendarWorkPlan => {
    const missingFields: string[] = []
    if (partial.needsEventId && !knownEventId) missingFields.push('eventId')
    if (partial.needsPauseUntil && !knownPauseUntil) missingFields.push('pauseUntil')
    for (const field of partial.missingFields ?? []) {
      if (!missingFields.includes(field)) missingFields.push(field)
    }

    return {
      ...partial,
      missingFields,
      hardRules: [...hardRules, ...(partial.hardRules ?? [])],
      sendsTriggered: false,
    }
  }

  if (includesSpecificOneTimeCancelLanguage(text)) {
    return build({
      intent: 'cancel_show',
      scope: 'event',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      recommendedTools: knownEventId
        ? ['cancel_show']
        : ['list_my_shows', 'cancel_show'],
      nextAction: knownEventId
        ? 'Call cancel_show for the selected one-time or specific show; its approval dialog is the confirmation step.'
        : 'Call list_my_shows to identify the one-time or specific show, then call cancel_show; its approval dialog is the confirmation step.',
      hardRules: [CANCEL_SHOW_HARD_RULE],
    })
  }

  if (
    hasAny(text, [
      /\b(skip|cancel|suspend)\b[\s\S]{0,60}\b(tonight|today|one|single|this)\b/,
      /\b(sick|ill|emergency|cannot make|can't make)\b[\s\S]{0,80}\b(show|live|tonight|today)\b/,
    ]) &&
    !hasAny(text, [/\bfuture\b/, /\bseries\b/, /\bre[- ]?occur(?:ring|s)?\b/, /\brecurring\b/, /\bevery\b/, /\ball\b/])
  ) {
    return build({
      intent: 'skip_occurrence',
      scope: 'occurrence',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      recommendedTools: knownEventId
        ? ['skip_show_occurrence']
        : ['list_my_shows', 'skip_show_occurrence'],
      nextAction: knownEventId
        ? 'Call skip_show_occurrence for the selected event; its approval dialog is the confirmation step.'
        : 'Call list_my_shows to identify the specific show, then call skip_show_occurrence; its approval dialog is the confirmation step.',
      hardRules: [SKIP_HARD_RULE],
    })
  }

  if (
    hasAny(text, [/\b(pause|suspend)\b/]) &&
    hasAny(text, [/\b(two weeks?|weeks?|month|months?|until|through)\b/, /\bmon(day)?s?\b|\btue(s|sday)?s?\b|\bwed(nesday)?s?\b|\bthu(r|rsday)?s?\b|\bfri(day)?s?\b|\bsat(urday)?s?\b|\bsun(day)?s?\b/])
  ) {
    return build({
      intent: 'pause_series_range',
      scope: 'series_range',
      needsEventId: true,
      needsPauseUntil: true,
      needsApproval: true,
      recommendedTools: knownEventId
        ? ['pause_show_series']
        : ['list_my_shows', 'pause_show_series'],
      nextAction:
        knownEventId && knownPauseUntil
          ? 'Call pause_show_series with the selected eventId and pauseUntil; its approval dialog is the confirmation step.'
          : 'Call list_my_shows to identify the series, calculate or ask for pauseUntil, then call pause_show_series; its approval dialog is the confirmation step.',
      hardRules: [PAUSE_HARD_RULE],
    })
  }

  if (
    hasAny(text, [/\b(stop|cancel|end)\b[\s\S]{0,80}\b(series|recurring|re[- ]?occurring|future shows?|future lives?)\b/])
  ) {
    return build({
      intent: 'cancel_series_future',
      scope: 'series_future',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      recommendedTools: knownEventId
        ? ['cancel_show_series']
        : ['list_my_shows', 'cancel_show_series'],
      nextAction: knownEventId
        ? 'Call cancel_show_series for the selected recurring event; its approval dialog is the confirmation step.'
        : 'Call list_my_shows to identify the recurring show, then call cancel_show_series; its approval dialog is the confirmation step.',
      hardRules: [CANCEL_SERIES_HARD_RULE],
    })
  }

  if (
    hasAny(text, [/\b(reminder|reminders)\b/, /\b(text|sms|email)\b/]) &&
    hasAny(text, [/\btonight\b/, /\btoday\b/, /\bthis show\b/, /\bthat show\b/])
  ) {
    return build({
      intent: 'show_reminder_override',
      scope: 'event',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      recommendedTools: knownEventId
        ? ['set_show_reminder_override']
        : ['list_my_shows', 'set_show_reminder_override'],
      nextAction: knownEventId
        ? 'Call set_show_reminder_override for this show; its approval dialog is the confirmation step.'
        : 'Call list_my_shows to identify the specific show, then call set_show_reminder_override; its approval dialog is the confirmation step.',
      hardRules: [REMINDER_HARD_RULE],
      parsedReminderPatch: parseReminderPatch(text),
    })
  }

  if (
    hasAny(text, [/\b(reminder|reminders)\b/, /\b(text|sms|email)\b/]) &&
    hasAny(text, [/\bevery show\b/, /\bbefore every\b/, /\bdefault\b/, /\ball shows?\b/, /\bfuture shows?\b/])
  ) {
    return build({
      intent: 'default_reminder_preferences',
      scope: 'rep_default',
      needsEventId: false,
      needsPauseUntil: false,
      needsApproval: true,
      recommendedTools: ['get_notification_preferences', 'set_notification_preferences'],
      missingFields: [],
      nextAction:
        'Read current preferences with get_notification_preferences, then call set_notification_preferences with the parsed patch; its approval dialog is the confirmation step.',
      hardRules: [REMINDER_HARD_RULE],
      parsedReminderPatch: parseReminderPatch(text),
    })
  }

  if (includesAddShowLanguage(text)) {
    const needsTimeZone = !input.knownTimeZone
    return build({
      intent: 'add_show',
      scope: 'calendar',
      needsEventId: false,
      needsPauseUntil: false,
      needsApproval: false,
      recommendedTools: ['add_show'],
      missingFields: needsTimeZone ? ['timeZone'] : [],
      nextAction: needsTimeZone
        ? 'Collect a timezone-explicit show time before calling add_show.'
        : 'Call add_show once platform and timezone-explicit eventTime are known. Description is optional.',
      hardRules: [
        'Calendar times must be timezone-explicit before scheduling.',
        'Recurring ongoing schedules generate bounded future occurrences, not forever.',
        'Description is optional for add_show; do not ask for it when the required scheduling fields are known.',
      ],
    })
  }

  if (hasAny(text, [/\b(code|discount|collection|collections?|highlight)\b/])) {
    const discountCode = extractDiscountCode(originalText)
    return build({
      intent: seriesLanguage ? 'series_update' : 'update_show',
      scope: seriesLanguage ? 'series_future' : 'event',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: false,
      recommendedTools: knownEventId ? ['update_show'] : ['list_my_shows', 'update_show'],
      nextAction: knownEventId
        ? 'Call update_show with the selected eventId.'
        : 'Call list_my_shows to identify the show or series, then call update_show.',
      hardRules: seriesLanguage ? [SERIES_UPDATE_HARD_RULE] : [],
      parsedShowPatch: {
        applyToSeries: seriesLanguage || undefined,
        discountCodes: discountCode ? [{ code: discountCode }] : undefined,
      },
    })
  }

  if (includesAddShowLanguage(text)) {
    const needsTimeZone = !input.knownTimeZone
    return build({
      intent: 'add_show',
      scope: 'calendar',
      needsEventId: false,
      needsPauseUntil: false,
      needsApproval: false,
      recommendedTools: ['add_show'],
      missingFields: needsTimeZone ? ['timeZone'] : [],
      nextAction: needsTimeZone
        ? 'Collect a timezone-explicit show time before calling add_show.'
        : 'Call add_show once platform and timezone-explicit eventTime are known.',
      hardRules: [
        'Calendar times must be timezone-explicit before scheduling.',
        'Recurring ongoing schedules generate bounded future occurrences, not forever.',
      ],
    })
  }

  if (hasAny(text, [/\b(calendar|schedule|upcoming|next show|what shows?)\b/])) {
    return build({
      intent: 'list_shows',
      scope: 'calendar',
      needsEventId: false,
      needsPauseUntil: false,
      needsApproval: false,
      recommendedTools: ['list_my_shows'],
      missingFields: [],
      nextAction: 'Call list_my_shows and answer only from the returned calendar events.',
    })
  }

  return build({
    intent: 'unknown',
    scope: 'calendar',
    needsEventId: false,
    needsPauseUntil: false,
    needsApproval: false,
    recommendedTools: ['list_my_shows'],
    missingFields: [],
    nextAction:
      'Ask one short clarifying question or call list_my_shows if the request appears to reference an existing show.',
  })
}

export function makePrepareCalendarWorkTool() {
  return tool({
    description:
      'Read-only resolver for live calendar and show reminder work. Use this first for ambiguous show scheduling, recurring-series changes, one-night skips, bounded pauses, discount/collection updates, and show reminder settings. It returns the allowed path, required fields, approval need, and recommended next tools before writes run.',
    inputSchema,
    execute: async (input) => plan(input),
  })
}

export const prepareCalendarWorkTool: ToolDefinition = {
  name: 'prepare_calendar_work',
  readOnly: true,
  build: () => makePrepareCalendarWorkTool(),
}
