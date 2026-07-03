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
  const hourMatch = text.match(/\b(\d+(?:\.\d+)?)\s*hours?\b/i)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)

  const halfHourMatch = text.match(/\btwo and a half hours?\b/i)
  if (halfHourMatch) return 150

  const minuteMatch = text.match(/\b(\d{2,3})\s*minutes?\b/i)
  if (minuteMatch) return Number(minuteMatch[1])

  return undefined
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

  const durationMinutes = parseDurationMinutes(text)
  if (durationMinutes) next.durationMinutes = durationMinutes

  const titleMatch = text.match(/\b(?:called|title(?:d)?|named)\s+([^.,\n]+)/i)
  const title = cleanText(titleMatch?.[1])
  if (title) next.title = title

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
