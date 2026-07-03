import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

export type CalendarWorkflowType = 'calendar_event_work'

export type CalendarWorkflowStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'needs_human_review'

export type CalendarWorkflowPhase =
  | 'started'
  | 'identify_existing_event'
  | 'details_capture'
  | 'ready_to_add'
  | 'ready_to_update'
  | 'ready_to_cancel'
  | 'ready_for_reminder_settings'
  | 'completed'
  | 'cancelled'
  | 'needs_human_review'

export type CalendarWorkflowIntent =
  | 'add_show'
  | 'update_show'
  | 'series_update'
  | 'list_shows'
  | 'cancel_show'
  | 'skip_occurrence'
  | 'cancel_series_future'
  | 'pause_series_range'
  | 'show_reminder_override'
  | 'default_reminder_preferences'
  | 'unknown'

export interface CalendarWorkflowKnownFields {
  eventId?: string
  title?: string
  platform?: string
  eventTime?: string
  timeZone?: string
  durationMinutes?: number
  description?: string | null
  discountCodes?: Array<{ code: string; description?: string }>
  featuredCollections?: string[]
  localStartTime?: {
    hour: number
    minute: number
  }
  completedToolName?: string
  resultEventIds?: string[]
  resultCount?: number
  recurring?: {
    cadence: 'daily' | 'weekly' | 'weekday'
    duration: '1_month' | '3_months' | 'ongoing'
    occurrenceCount?: number
    mode?: 'exact_count' | 'series'
  }
}

export interface CalendarWorkflowSessionState {
  id: string
  repId: string
  conversationId: string
  workflowType: CalendarWorkflowType
  status: CalendarWorkflowStatus
  phase: CalendarWorkflowPhase
  intent: CalendarWorkflowIntent
  knownFields: CalendarWorkflowKnownFields
  missingFields: string[]
  candidateEventIds: string[]
  lastUserMessageId?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export function getCalendarWorkflowToolIntents(
  state: CalendarWorkflowSessionState,
): NicNacToolIntent[] {
  if (state.status !== 'active') return []
  return ['calendar']
}
