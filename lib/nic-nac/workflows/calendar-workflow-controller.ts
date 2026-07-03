import type {
  CalendarWorkflowIntent,
  CalendarWorkflowKnownFields,
  CalendarWorkflowPhase,
} from './calendar-workflow-types'

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function parseDurationMinutes(text: string): number | undefined {
  const hourMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)

  const halfHourMatch = text.match(/\btwo and a half hours?\b/i)
  if (halfHourMatch) return 150

  const minuteMatch = text.match(/\b(\d{2,3})\s*minutes?\b/i)
  if (minuteMatch) return Number(minuteMatch[1])

  return undefined
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function easternOffsetFor(month: number) {
  return month >= 3 && month <= 10 ? '-04:00' : '-05:00'
}

function parseNaturalEventTime(text: string): string | undefined {
  const match = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?\s*(a|am|p|pm)?\b/i,
  )
  if (!match) return undefined

  const month = MONTHS[match[1].toLowerCase()]
  const day = Number(match[2])
  const hourText = Number(match[3])
  const minute = match[4] ? Number(match[4]) : 0
  const meridiem = match[5]?.toLowerCase()
  if (!month || !day || !hourText || minute > 59) return undefined

  let hour = hourText
  if (meridiem === 'p' || meridiem === 'pm') {
    hour = hourText === 12 ? 12 : hourText + 12
  } else if (meridiem === 'a' || meridiem === 'am') {
    hour = hourText === 12 ? 0 : hourText
  }
  if (hour > 23) return undefined

  const year = new Date().getFullYear()
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  const hourOut = String(hour).padStart(2, '0')
  const minuteOut = String(minute).padStart(2, '0')
  return `${year}-${monthText}-${dayText}T${hourOut}:${minuteOut}:00${easternOffsetFor(month)}`
}

function extractPlainTitle(text: string): string | undefined {
  if (
    /\b(?:tik\s*tok|tiktok|facebook|instagram|youtube|america\/new_york|eastern|edt|est)\b/i.test(text) ||
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(text)
  ) {
    return undefined
  }

  const cleaned = text
    .replace(/\b(?:and\s+)?\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?)\b/gi, '')
    .replace(/\btwo and a half hours?\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/\band$/i, '')
    .trim()

  if (!/[a-z]/i.test(cleaned)) return undefined
  if (cleaned.length < 3 || cleaned.length > 80) return undefined
  return titleCase(cleaned)
}

export function mergeCalendarKnownFieldsFromText(
  current: CalendarWorkflowKnownFields,
  text: string,
): CalendarWorkflowKnownFields {
  const normalized = text.trim().toLowerCase()
  const next: CalendarWorkflowKnownFields = { ...current }

  if (
    /\bno\b[\s\S]{0,80}\bdescription\b/.test(normalized) ||
    /\bdon'?t\s+need\b[\s\S]{0,80}\bdescription\b/.test(normalized) ||
    /\bleave\b[\s\S]{0,20}\bblank\b/.test(normalized)
  ) {
    next.description = null
  }

  if (/\btik\s*tok\b/.test(normalized) || /\btiktok\b/.test(normalized)) {
    next.platform = 'TikTok'
  } else if (/\bfacebook\b/.test(normalized)) {
    next.platform = 'Facebook Live'
  } else if (/\binstagram\b/.test(normalized)) {
    next.platform = 'Instagram'
  } else if (/\byoutube\b/.test(normalized)) {
    next.platform = 'YouTube'
  }

  if (
    /\bamerica\/new_york\b/i.test(text) ||
    /\b(eastern|edt|est)\b/i.test(text)
  ) {
    next.timeZone = 'America/New_York'
  }

  const eventTime = parseNaturalEventTime(text)
  if (eventTime) next.eventTime = eventTime

  const durationMinutes = parseDurationMinutes(text)
  if (durationMinutes) next.durationMinutes = durationMinutes

  const titleMatch = text.match(/\b(?:called|title(?:d)?|named)\s+([^.,\n]+)/i)
  const title = cleanText(titleMatch?.[1])
  if (title) next.title = title
  if (!next.title && (next.eventTime || next.durationMinutes)) {
    const plainTitle = extractPlainTitle(text)
    if (plainTitle) next.title = plainTitle
  }

  const codeMatch = text.match(/\b(?:code|discount code)\s*(?:is|:)?\s*([A-Z0-9_-]{3,})\b/i)
  const code = cleanText(codeMatch?.[1])
  if (code && !next.discountCodes?.some((discount) => discount.code === code)) {
    next.discountCodes = [...(next.discountCodes ?? []), { code }]
  }

  const collectionMatch = text.match(/\bfeatured collection(?:\s+will be|\s+is|:)?\s+([^.,\n]+)/i)
  const collection = cleanText(collectionMatch?.[1])
  if (collection && !next.featuredCollections?.includes(collection)) {
    next.featuredCollections = [...(next.featuredCollections ?? []), collection]
  }

  return next
}

export function computeCalendarWorkflowReadiness(args: {
  intent: CalendarWorkflowIntent
  knownFields: CalendarWorkflowKnownFields
  candidateEventIds: string[]
}): { phase: CalendarWorkflowPhase; missingFields: string[] } {
  const missingFields: string[] = []

  if (args.intent === 'add_show') {
    if (!args.knownFields.platform) missingFields.push('platform')
    if (!args.knownFields.eventTime) missingFields.push('eventTime')
    if (!args.knownFields.timeZone) missingFields.push('timeZone')
    return {
      phase: missingFields.length ? 'details_capture' : 'ready_to_add',
      missingFields,
    }
  }

  if (
    args.intent === 'update_show' ||
    args.intent === 'series_update' ||
    args.intent === 'cancel_show' ||
    args.intent === 'skip_occurrence' ||
    args.intent === 'cancel_series_future' ||
    args.intent === 'pause_series_range' ||
    args.intent === 'show_reminder_override'
  ) {
    if (!args.knownFields.eventId && args.candidateEventIds.length !== 1) {
      missingFields.push('eventId')
    }
    if (missingFields.length) {
      return { phase: 'identify_existing_event', missingFields }
    }
    if (args.intent === 'cancel_show' || args.intent === 'skip_occurrence') {
      return { phase: 'ready_to_cancel', missingFields }
    }
    if (args.intent === 'show_reminder_override') {
      return { phase: 'ready_for_reminder_settings', missingFields }
    }
    return { phase: 'ready_to_update', missingFields }
  }

  return { phase: 'details_capture', missingFields }
}
