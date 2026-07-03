import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'
import {
  getToolIntentsForMessages,
  type NicNacToolIntent,
} from '@/lib/nic-nac/tools'
import type { ActiveNicNacWorkflowContext } from './active-tool-context'
import {
  computeCalendarWorkflowReadiness,
  mergeCalendarKnownFieldsFromText,
} from './calendar-workflow-controller'
import {
  createCalendarWorkflowSession,
  getActiveCalendarWorkflowSession,
  isMissingCalendarWorkflowSchemaError,
  updateCalendarWorkflowSession,
} from './calendar-workflow-store'
import {
  getCalendarWorkflowToolIntents,
  type CalendarWorkflowIntent,
  type CalendarWorkflowSessionState,
} from './calendar-workflow-types'
import type { TradeBoardIntakeToolPolicySource } from './trade-board-intake-types'

type Mode = 'workspace' | 'required_setup'

export interface CalendarWorkflowContextResult {
  sessionBefore: CalendarWorkflowSessionState | null
  sessionAfter: CalendarWorkflowSessionState | null
  activeWorkflow: ActiveNicNacWorkflowContext | null
  workflowIntents: NicNacToolIntent[]
  toolPolicySource: TradeBoardIntakeToolPolicySource
  workflowPromptState: string
}

function emptyCalendarWorkflowContext(
  toolPolicySource: TradeBoardIntakeToolPolicySource,
): CalendarWorkflowContextResult {
  return {
    sessionBefore: null,
    sessionAfter: null,
    activeWorkflow: null,
    workflowIntents: [],
    toolPolicySource,
    workflowPromptState: '',
  }
}

function getMessageText(message: UIMessage | undefined): string {
  if (!message?.parts?.length) return ''

  const textParts: string[] = []
  for (const part of message.parts) {
    if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
      textParts.push(part.text)
    }
  }
  return textParts.join('\n')
}

function getLatestUserMessage(messages: UIMessage[]): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === 'user')
}

function inferCalendarIntent(messages: UIMessage[]): CalendarWorkflowIntent {
  const latestUserText = getMessageText(getLatestUserMessage(messages)).toLowerCase()
  const recentText = messages
    .slice(-6)
    .map((message) => getMessageText(message))
    .join('\n')
    .toLowerCase()

  if (/\b(add|schedule|set up|create|put)\b[\s\S]{0,100}\b(show|live|event|calendar)\b/.test(recentText)) {
    return 'add_show'
  }
  if (/\breplace\b[\s\S]{0,120}\bwith\b[\s\S]{0,80}\bnew\b[\s\S]{0,80}\b(show|live|event)\b/.test(recentText)) {
    return 'add_show'
  }
  if (/\b(skip|suspend)\b/.test(latestUserText)) return 'skip_occurrence'
  if (/\b(cancel|delete)\b/.test(latestUserText)) return 'cancel_show'
  if (/\b(reminder|text|sms|email)\b/.test(latestUserText)) {
    return /\bevery|default|all shows?\b/.test(latestUserText)
      ? 'default_reminder_preferences'
      : 'show_reminder_override'
  }
  if (/\b(update|change|move|replace)\b/.test(recentText)) return 'update_show'
  if (/\bcalendar|schedule|upcoming|next show\b/.test(recentText)) return 'list_shows'
  return 'unknown'
}

function shouldStartCalendarWorkflow(messages: UIMessage[]) {
  return getToolIntentsForMessages(messages).includes('calendar')
}

function renderCalendarWorkflowPromptState(
  state: CalendarWorkflowSessionState,
): string {
  const known = Object.entries(state.knownFields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)

  return [
    'Active workflow: calendar_event_work',
    `Workflow id: ${state.id}`,
    `Workflow status: ${state.status}`,
    `Workflow phase: ${state.phase}`,
    `Intent: ${state.intent}`,
    `Known: ${known.length ? known.join(', ') : 'none'}`,
    `Missing: ${state.missingFields.length ? state.missingFields.join(', ') : 'none'}`,
    'Description: optional; do not ask for description before add_show.',
    'Tool retention: keep Calendar tools available until completed, cancelled, expired, blocked by policy, or escalated.',
  ].join('\n')
}

function toActiveWorkflow(
  state: CalendarWorkflowSessionState | null,
): ActiveNicNacWorkflowContext | null {
  if (!state || state.status !== 'active') return null
  return {
    workflowId: state.id,
    workflowType: 'calendar_event_work',
    status: state.status,
    phase: state.phase,
    workflowIntents: getCalendarWorkflowToolIntents(state),
    toolPolicySource: 'active_workflow',
    promptState: renderCalendarWorkflowPromptState(state),
  }
}

async function ingestCalendarWorkflowTurn(
  supabase: SupabaseClient,
  args: {
    session: CalendarWorkflowSessionState
    messages: UIMessage[]
    latestUserMessageId?: string
  },
): Promise<CalendarWorkflowSessionState> {
  const latestUserText = getMessageText(getLatestUserMessage(args.messages))
  const intent =
    args.session.intent === 'unknown'
      ? inferCalendarIntent(args.messages)
      : args.session.intent
  const knownFields = latestUserText
    ? mergeCalendarKnownFieldsFromText(args.session.knownFields, latestUserText)
    : args.session.knownFields
  const readiness = computeCalendarWorkflowReadiness({
    intent,
    knownFields,
    candidateEventIds: args.session.candidateEventIds,
  })

  return updateCalendarWorkflowSession(supabase, {
    ...args.session,
    intent,
    knownFields,
    phase: readiness.phase,
    missingFields: readiness.missingFields,
    lastUserMessageId: args.latestUserMessageId ?? args.session.lastUserMessageId,
  })
}

export async function getOrCreateCalendarWorkflowContext(args: {
  supabase: SupabaseClient
  workflowSupabase?: SupabaseClient
  repId: string
  conversationId: string
  messages: UIMessage[]
  latestUserMessageId?: string
  mode: Mode
  nowIso: string
}): Promise<CalendarWorkflowContextResult> {
  if (args.mode !== 'workspace') {
    return emptyCalendarWorkflowContext('mode_required_setup')
  }

  try {
    const workflowSupabase = args.workflowSupabase ?? args.supabase
    const existing = await getActiveCalendarWorkflowSession(workflowSupabase, {
      repId: args.repId,
      conversationId: args.conversationId,
      nowIso: args.nowIso,
    })
    const shouldStart = existing !== null || shouldStartCalendarWorkflow(args.messages)
    if (!shouldStart) {
      return emptyCalendarWorkflowContext('latest_turn_intent')
    }

    const baseSession =
      existing ??
      (await createCalendarWorkflowSession(workflowSupabase, {
        repId: args.repId,
        conversationId: args.conversationId,
        lastUserMessageId: args.latestUserMessageId,
      }))
    const ingested = await ingestCalendarWorkflowTurn(workflowSupabase, {
      session: baseSession,
      messages: args.messages,
      latestUserMessageId: args.latestUserMessageId,
    })
    const activeWorkflow = toActiveWorkflow(ingested)

    return {
      sessionBefore: existing,
      sessionAfter: ingested,
      activeWorkflow,
      workflowIntents: activeWorkflow?.workflowIntents ?? [],
      toolPolicySource: 'active_workflow',
      workflowPromptState: activeWorkflow?.promptState ?? '',
    }
  } catch (err) {
    if (isMissingCalendarWorkflowSchemaError(err)) {
      console.warn('[nic-nac] Calendar workflow schema is unavailable', {
        conversationId: args.conversationId,
      })
      return emptyCalendarWorkflowContext('latest_turn_intent')
    }
    throw err
  }
}
