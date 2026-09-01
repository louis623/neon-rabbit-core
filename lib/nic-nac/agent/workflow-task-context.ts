import type { SupabaseClient } from '@supabase/supabase-js'
import {
  NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION,
  type NicNacTaskContext,
  type NicNacTaskFactValue,
  type NicNacTaskGoal,
} from '@/lib/nic-nac/agent/task-context'
import { getActiveCalendarWorkflowSession } from '@/lib/nic-nac/workflows/calendar-workflow-store'
import type { CalendarWorkflowSessionState } from '@/lib/nic-nac/workflows/calendar-workflow-types'
import { getActiveTradeBoardIntakeSession } from '@/lib/nic-nac/workflows/trade-board-intake-store'
import type { TradeBoardIntakeSessionState } from '@/lib/nic-nac/workflows/trade-board-intake-types'
import { getActiveTradeWorkflowSession } from '@/lib/nic-nac/workflows/trade-workflow-store'
import type { TradeWorkflowSessionState } from '@/lib/nic-nac/workflows/trade-workflow-types'

const MAX_TASK_CONTEXT_CHARS = 8_000

export type NicNacWorkflowTaskContinuity = {
  context: NicNacTaskContext
  promptText: string
  calendarSession: CalendarWorkflowSessionState | null
  tradeBoardSession: TradeBoardIntakeSessionState | null
  tradeSession: TradeWorkflowSessionState | null
}

export type NicNacWorkflowTaskContinuityAccess = {
  calendar: boolean
  tradeBoard: boolean
  trade: boolean
}

const ALL_WORKFLOW_TASK_CONTINUITY_ACCESS: NicNacWorkflowTaskContinuityAccess = {
  calendar: true,
  tradeBoard: true,
  trade: true,
}

function toFactValue(value: unknown): NicNacTaskFactValue | undefined {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map(toFactValue)
      .filter((entry): entry is NicNacTaskFactValue => entry !== undefined)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, toFactValue(entry)] as const)
      .filter((entry): entry is readonly [string, NicNacTaskFactValue] =>
        entry[1] !== undefined,
      )
    return Object.fromEntries(entries)
  }
  return undefined
}

function facts(value: Record<string, unknown>) {
  return (toFactValue(value) ?? {}) as Record<string, NicNacTaskFactValue>
}

function calendarGoal(session: CalendarWorkflowSessionState): NicNacTaskGoal {
  return {
    id: `calendar:${session.id}`,
    kind: 'mutation',
    summary: `Continue Calendar ${session.intent.replaceAll('_', ' ')} work`,
    relevantFacts: facts({
      domain: 'calendar',
      intent: session.intent,
      phase: session.phase,
      knownFields: session.knownFields,
      candidateEventIds: session.candidateEventIds,
    }),
    missingFacts: [...session.missingFields],
    status: session.missingFields.length > 0 ? 'waiting_for_user' : 'active',
    resumeHint:
      'Resume only when the rep naturally returns to this Calendar task; never let it override a newer request.',
  }
}

function tradeBoardGoal(session: TradeBoardIntakeSessionState): NicNacTaskGoal {
  return {
    id: `dance-floor:${session.id}`,
    kind: 'mutation',
    summary: 'Continue adding a dancer to the Dance Floor',
    relevantFacts: facts({
      domain: 'dance_floor',
      phase: session.phase,
      catalogMode: session.catalogMode,
      knownFields: session.known,
      blockers: session.blockers,
      warnings: session.warnings,
      photos: session.photos.slice(0, 12).map((photo) => ({
        attachmentIndex: photo.attachmentIndex,
        declaredRole: photo.declaredRole,
        visualRole: photo.visualRole,
        roleConfirmed: photo.roleConfirmed,
        quality: photo.quality,
      })),
    }),
    missingFacts: [...session.missing],
    status:
      session.status === 'needs_human_review' || session.missing.length > 0
        ? 'waiting_for_user'
        : 'active',
    resumeHint:
      'Resume only when the rep naturally returns to this Dance Floor add; retain photo roles and collected item facts.',
  }
}

function tradeGoal(session: TradeWorkflowSessionState): NicNacTaskGoal {
  return {
    id: `trade:${session.id}`,
    kind: 'mutation',
    summary: `Continue ${session.workflowType.replaceAll('_', ' ')} work`,
    relevantFacts: facts({
      domain: 'trade',
      workflowType: session.workflowType,
      intent: session.intent,
      phase: session.phase,
      knownFields: session.knownFields,
      blockers: session.blockers,
      candidates: session.candidates.slice(0, 12),
    }),
    missingFacts: [...session.missingFields],
    status:
      session.approvalState === 'required'
        ? 'waiting_for_approval'
        : session.missingFields.length > 0
          ? 'waiting_for_user'
          : 'active',
    resumeHint:
      'Resume only when the rep naturally returns to this trade task; never let it select a tool for an unrelated turn.',
  }
}

function updatedAt(goal: NicNacTaskGoal, sessions: {
  calendarSession: CalendarWorkflowSessionState | null
  tradeBoardSession: TradeBoardIntakeSessionState | null
  tradeSession: TradeWorkflowSessionState | null
}) {
  const session = goal.id.startsWith('calendar:')
    ? sessions.calendarSession
    : goal.id.startsWith('dance-floor:')
      ? sessions.tradeBoardSession
      : sessions.tradeSession
  const value = session?.updatedAt
  return value ? Date.parse(value) || 0 : 0
}

export function buildNicNacWorkflowTaskContext(sessions: {
  calendarSession: CalendarWorkflowSessionState | null
  tradeBoardSession: TradeBoardIntakeSessionState | null
  tradeSession: TradeWorkflowSessionState | null
}): NicNacTaskContext {
  const goals = [
    ...(sessions.calendarSession ? [calendarGoal(sessions.calendarSession)] : []),
    ...(sessions.tradeBoardSession
      ? [tradeBoardGoal(sessions.tradeBoardSession)]
      : []),
    ...(sessions.tradeSession ? [tradeGoal(sessions.tradeSession)] : []),
  ].sort((left, right) => updatedAt(right, sessions) - updatedAt(left, sessions))

  return {
    schemaVersion: NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION,
    // Durable transaction records are recoverable context, not authority to
    // define the current conversational goal. The latest user message and the
    // agent decide what is current on every turn.
    currentGoal: null,
    pausedGoals: goals,
    immediateContinuation: null,
  }
}

export function renderNicNacWorkflowTaskContext(context: NicNacTaskContext) {
  if (context.pausedGoals.length === 0) return ''
  const serialized = JSON.stringify({
    schemaVersion: context.schemaVersion,
    recoverableUnfinishedTransactions: context.pausedGoals,
  })
  const bounded = serialized.slice(0, MAX_TASK_CONTEXT_CHARS)
  return [
    'Recoverable unfinished transaction facts are listed below.',
    'They are context only: the latest explicit request still wins, and none of these records selects or forces a tool.',
    bounded,
  ].join('\n')
}

function isMissingWorkflowSchema(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /(?:nic_nac_calendar_workflows|trade_board_intake_sessions|nic_nac_trade_workflows)/.test(
      message,
    ) &&
    /(?:does not exist|schema cache|Could not find)/i.test(message)
  )
}

async function safeLoad<T>(label: string, load: () => Promise<T | null>) {
  try {
    return await load()
  } catch (error) {
    if (!isMissingWorkflowSchema(error)) throw error
    console.warn(`[nic-nac] ${label} continuity schema is unavailable`)
    return null
  }
}

export async function loadNicNacWorkflowTaskContinuity(args: {
  mode: 'workspace' | 'required_setup'
  supabase: SupabaseClient
  workflowSupabase?: SupabaseClient
  repId: string
  conversationId: string
  nowIso: string
  access?: NicNacWorkflowTaskContinuityAccess
}): Promise<NicNacWorkflowTaskContinuity> {
  if (args.mode !== 'workspace') {
    const context = buildNicNacWorkflowTaskContext({
      calendarSession: null,
      tradeBoardSession: null,
      tradeSession: null,
    })
    return {
      context,
      promptText: '',
      calendarSession: null,
      tradeBoardSession: null,
      tradeSession: null,
    }
  }

  const workflowSupabase = args.workflowSupabase ?? args.supabase
  const access = args.access ?? ALL_WORKFLOW_TASK_CONTINUITY_ACCESS
  const query = {
    repId: args.repId,
    conversationId: args.conversationId,
    nowIso: args.nowIso,
  }
  const [calendarSession, tradeBoardSession, tradeSession] = await Promise.all([
    access.calendar
      ? safeLoad('Calendar', () =>
          getActiveCalendarWorkflowSession(workflowSupabase, query),
        )
      : Promise.resolve(null),
    access.tradeBoard
      ? safeLoad('Dance Floor', () =>
          getActiveTradeBoardIntakeSession(workflowSupabase, query),
        )
      : Promise.resolve(null),
    access.trade
      ? safeLoad('trade', () =>
          getActiveTradeWorkflowSession(workflowSupabase, query),
        )
      : Promise.resolve(null),
  ])
  const context = buildNicNacWorkflowTaskContext({
    calendarSession,
    tradeBoardSession,
    tradeSession,
  })
  return {
    context,
    promptText: renderNicNacWorkflowTaskContext(context),
    calendarSession,
    tradeBoardSession,
    tradeSession,
  }
}
