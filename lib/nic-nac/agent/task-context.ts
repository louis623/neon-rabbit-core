export const NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION = 1 as const

export type NicNacTaskFactValue =
  | string
  | number
  | boolean
  | null
  | NicNacTaskFactValue[]
  | { [key: string]: NicNacTaskFactValue }

export type NicNacTaskFacts = Record<string, NicNacTaskFactValue>

export type NicNacTaskKind = 'read' | 'mutation' | 'guidance' | 'other'

export type NicNacTaskStatus =
  | 'active'
  | 'waiting_for_user'
  | 'waiting_for_approval'
  | 'completed'
  | 'failed'

export type NicNacTaskToolResult = {
  toolName: string
  success: boolean
  summary?: string
}

export type NicNacPendingClarification = {
  clarificationId: string
  missingFacts: string[]
}

export type NicNacPendingApproval = {
  approvalId: string
  toolName: string
}

export type NicNacTaskGoal = {
  id: string
  kind: NicNacTaskKind
  summary: string
  relevantFacts: NicNacTaskFacts
  missingFacts: string[]
  lastToolResult?: NicNacTaskToolResult
  status: NicNacTaskStatus
  resumeHint: string
  pendingClarification?: NicNacPendingClarification
  pendingApproval?: NicNacPendingApproval
}

export type NicNacTaskGoalDraft = Pick<
  NicNacTaskGoal,
  'id' | 'kind' | 'summary' | 'resumeHint'
> &
  Partial<Pick<NicNacTaskGoal, 'relevantFacts' | 'missingFacts'>>

export type NicNacTaskContinuation = {
  kind: 'clarification'
  goalId: string
  clarificationId: string
}

/**
 * Compact, persistence-adapter-neutral conversation continuity.
 *
 * This state preserves facts and resumable work. It deliberately does not
 * classify text, select tools, or encode domain workflow transitions.
 */
export type NicNacTaskContext = {
  schemaVersion: typeof NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION
  currentGoal: NicNacTaskGoal | null
  pausedGoals: NicNacTaskGoal[]
  immediateContinuation: NicNacTaskContinuation | null
}

export type NicNacTaskContextEvent =
  | {
      type: 'explicit_request'
      goal: NicNacTaskGoalDraft
    }
  | {
      type: 'clarification_requested'
      goalId: string
      clarificationId: string
      missingFacts: string[]
      resumeHint?: string
    }
  | {
      type: 'clarification_answered'
      clarificationId: string
      facts?: NicNacTaskFacts
      resolvedFacts?: string[]
      missingFacts?: string[]
      resumeHint?: string
    }
  | {
      type: 'correction'
      goalId?: string
      replacementGoal?: NicNacTaskGoalDraft
      summary?: string
      facts?: NicNacTaskFacts
      factsMode?: 'merge' | 'replace'
      removeFacts?: string[]
      missingFacts?: string[]
      resumeHint?: string
    }
  | {
      type: 'approval_requested'
      goalId: string
      approvalId: string
      toolName: string
      resumeHint?: string
    }
  | {
      type: 'approval_resolved'
      approvalId: string
      approved: boolean
    }
  | {
      type: 'tool_result'
      goalId: string
      result: NicNacTaskToolResult
      facts?: NicNacTaskFacts
      nextStatus?: 'active' | 'waiting_for_user' | 'completed' | 'failed'
    }
  | {
      type: 'resume_goal'
      goalId: string
    }
  | {
      type: 'complete_goal'
      goalId: string
    }
  | {
      type: 'fail_goal'
      goalId: string
    }

export type NicNacTaskContextEffect =
  | 'started'
  | 'switched'
  | 'clarification_requested'
  | 'clarification_answered'
  | 'corrected'
  | 'approval_requested'
  | 'approval_resumed'
  | 'approval_denied'
  | 'tool_result_recorded'
  | 'read_completed'
  | 'resumed'
  | 'completed'
  | 'failed'
  | 'ignored'

export type NicNacTaskContextTransition = {
  context: NicNacTaskContext
  effect: NicNacTaskContextEffect
}

export function createEmptyNicNacTaskContext(): NicNacTaskContext {
  return {
    schemaVersion: NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION,
    currentGoal: null,
    pausedGoals: [],
    immediateContinuation: null,
  }
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function createGoal(draft: NicNacTaskGoalDraft): NicNacTaskGoal {
  return {
    id: draft.id,
    kind: draft.kind,
    summary: draft.summary,
    relevantFacts: { ...(draft.relevantFacts ?? {}) },
    missingFacts: unique(draft.missingFacts ?? []),
    status: 'active',
    resumeHint: draft.resumeHint,
  }
}

function isUnfinished(goal: NicNacTaskGoal): boolean {
  return goal.status !== 'completed' && goal.status !== 'failed'
}

function pauseGoal(
  pausedGoals: readonly NicNacTaskGoal[],
  goal: NicNacTaskGoal | null,
  excludingGoalId?: string,
): NicNacTaskGoal[] {
  const withoutDuplicates = pausedGoals.filter(
    (paused) => paused.id !== goal?.id && paused.id !== excludingGoalId,
  )
  if (!goal || !isUnfinished(goal) || goal.id === excludingGoalId) {
    return [...withoutDuplicates]
  }
  return [goal, ...withoutDuplicates]
}

function removeGoal(
  context: NicNacTaskContext,
  goalId: string,
): NicNacTaskContext {
  const removesCurrent = context.currentGoal?.id === goalId
  return {
    ...context,
    currentGoal: removesCurrent ? null : context.currentGoal,
    pausedGoals: context.pausedGoals.filter((goal) => goal.id !== goalId),
    immediateContinuation:
      context.immediateContinuation?.goalId === goalId
        ? null
        : context.immediateContinuation,
  }
}

function updateGoal(
  context: NicNacTaskContext,
  goalId: string,
  update: (goal: NicNacTaskGoal) => NicNacTaskGoal,
): { context: NicNacTaskContext; found: boolean } {
  if (context.currentGoal?.id === goalId) {
    return {
      context: { ...context, currentGoal: update(context.currentGoal) },
      found: true,
    }
  }

  const pausedIndex = context.pausedGoals.findIndex((goal) => goal.id === goalId)
  if (pausedIndex < 0) return { context, found: false }

  return {
    context: {
      ...context,
      pausedGoals: context.pausedGoals.map((goal, index) =>
        index === pausedIndex ? update(goal) : goal,
      ),
    },
    found: true,
  }
}

function switchToPausedGoal(
  context: NicNacTaskContext,
  goalId: string,
): NicNacTaskContext | null {
  const target = context.pausedGoals.find((goal) => goal.id === goalId)
  if (!target) return null

  return {
    ...context,
    currentGoal: target,
    pausedGoals: pauseGoal(
      context.pausedGoals.filter((goal) => goal.id !== goalId),
      context.currentGoal,
      goalId,
    ),
    immediateContinuation: null,
  }
}

function withoutFacts(
  facts: NicNacTaskFacts,
  keys: readonly string[],
): NicNacTaskFacts {
  if (keys.length === 0) return facts
  const next = { ...facts }
  for (const key of keys) delete next[key]
  return next
}

/**
 * Applies a semantic task-continuity event. The caller (normally the agent
 * harness) decides what the user meant; this reducer only preserves and moves
 * task state after that decision has been made.
 */
export function applyNicNacTaskContextEvent(
  context: NicNacTaskContext,
  event: NicNacTaskContextEvent,
): NicNacTaskContextTransition {
  if (event.type === 'explicit_request') {
    const goal = createGoal(event.goal)
    const hadDifferentCurrent =
      context.currentGoal !== null && context.currentGoal.id !== goal.id
    return {
      context: {
        ...context,
        currentGoal: goal,
        pausedGoals: pauseGoal(context.pausedGoals, context.currentGoal, goal.id),
        immediateContinuation: null,
      },
      effect: hadDifferentCurrent ? 'switched' : 'started',
    }
  }

  if (event.type === 'clarification_requested') {
    if (context.currentGoal?.id !== event.goalId) {
      return { context, effect: 'ignored' }
    }
    const missingFacts = unique(event.missingFacts)
    return {
      context: {
        ...context,
        currentGoal: {
          ...context.currentGoal,
          status: 'waiting_for_user',
          missingFacts,
          resumeHint: event.resumeHint ?? context.currentGoal.resumeHint,
          pendingClarification: {
            clarificationId: event.clarificationId,
            missingFacts,
          },
          pendingApproval: undefined,
        },
        immediateContinuation: {
          kind: 'clarification',
          goalId: event.goalId,
          clarificationId: event.clarificationId,
        },
      },
      effect: 'clarification_requested',
    }
  }

  if (event.type === 'clarification_answered') {
    const continuation = context.immediateContinuation
    const current = context.currentGoal
    if (
      continuation?.kind !== 'clarification' ||
      continuation.clarificationId !== event.clarificationId ||
      current?.id !== continuation.goalId ||
      current.pendingClarification?.clarificationId !== event.clarificationId
    ) {
      return { context, effect: 'ignored' }
    }

    const resolvedFacts = unique(event.resolvedFacts ?? Object.keys(event.facts ?? {}))
    const missingFacts =
      event.missingFacts ??
      current.missingFacts.filter((fact) => !resolvedFacts.includes(fact))
    return {
      context: {
        ...context,
        currentGoal: {
          ...current,
          relevantFacts: { ...current.relevantFacts, ...(event.facts ?? {}) },
          missingFacts: unique(missingFacts),
          status: 'active',
          resumeHint: event.resumeHint ?? current.resumeHint,
          pendingClarification: undefined,
        },
        immediateContinuation: null,
      },
      effect: 'clarification_answered',
    }
  }

  if (event.type === 'correction') {
    const current = context.currentGoal
    if (!current || (event.goalId && current.id !== event.goalId)) {
      return { context, effect: 'ignored' }
    }
    if (event.replacementGoal) {
      const replacement = createGoal(event.replacementGoal)
      return {
        context: {
          ...context,
          currentGoal: replacement,
          pausedGoals: context.pausedGoals.filter(
            (goal) => goal.id !== replacement.id,
          ),
          immediateContinuation: null,
        },
        effect: 'corrected',
      }
    }
    const baseFacts = event.factsMode === 'replace' ? {} : current.relevantFacts
    const correctedFacts = withoutFacts(
      { ...baseFacts, ...(event.facts ?? {}) },
      event.removeFacts ?? [],
    )
    return {
      context: {
        ...context,
        currentGoal: {
          ...current,
          summary: event.summary ?? current.summary,
          relevantFacts: correctedFacts,
          missingFacts: unique(event.missingFacts ?? current.missingFacts),
          status: 'active',
          resumeHint: event.resumeHint ?? current.resumeHint,
          pendingClarification: undefined,
          pendingApproval: undefined,
        },
        immediateContinuation: null,
      },
      effect: 'corrected',
    }
  }

  if (event.type === 'approval_requested') {
    if (context.currentGoal?.id !== event.goalId) {
      return { context, effect: 'ignored' }
    }
    return {
      context: {
        ...context,
        currentGoal: {
          ...context.currentGoal,
          status: 'waiting_for_approval',
          resumeHint: event.resumeHint ?? context.currentGoal.resumeHint,
          pendingApproval: {
            approvalId: event.approvalId,
            toolName: event.toolName,
          },
          pendingClarification: undefined,
        },
        immediateContinuation: null,
      },
      effect: 'approval_requested',
    }
  }

  if (event.type === 'approval_resolved') {
    const currentMatches =
      context.currentGoal?.pendingApproval?.approvalId === event.approvalId
    const pausedMatch = context.pausedGoals.find(
      (goal) => goal.pendingApproval?.approvalId === event.approvalId,
    )
    const target = currentMatches ? context.currentGoal : pausedMatch
    if (!target) return { context, effect: 'ignored' }

    if (!event.approved) {
      return {
        context: removeGoal(context, target.id),
        effect: 'approval_denied',
      }
    }

    const selected = currentMatches
      ? context
      : switchToPausedGoal(context, target.id)
    if (!selected?.currentGoal) return { context, effect: 'ignored' }
    return {
      context: {
        ...selected,
        currentGoal: {
          ...selected.currentGoal,
          status: 'active',
          pendingApproval: undefined,
        },
        immediateContinuation: null,
      },
      effect: 'approval_resumed',
    }
  }

  if (event.type === 'tool_result') {
    const goal =
      context.currentGoal?.id === event.goalId
        ? context.currentGoal
        : context.pausedGoals.find((candidate) => candidate.id === event.goalId)
    if (!goal) return { context, effect: 'ignored' }

    // Reads are single-turn facts, not durable locks. Their result closes the
    // read wherever it currently lives, without auto-resuming another task.
    if (goal.kind === 'read') {
      return {
        context: removeGoal(context, goal.id),
        effect: 'read_completed',
      }
    }

    if (event.nextStatus === 'completed' || event.nextStatus === 'failed') {
      return {
        context: removeGoal(context, goal.id),
        effect: event.nextStatus === 'completed' ? 'completed' : 'failed',
      }
    }

    const updated = updateGoal(context, goal.id, (existing) => ({
      ...existing,
      relevantFacts: { ...existing.relevantFacts, ...(event.facts ?? {}) },
      lastToolResult: { ...event.result },
      status: event.nextStatus ?? 'active',
    }))
    return {
      context: updated.context,
      effect: updated.found ? 'tool_result_recorded' : 'ignored',
    }
  }

  if (event.type === 'resume_goal') {
    const selected = switchToPausedGoal(context, event.goalId)
    return selected
      ? { context: selected, effect: 'resumed' }
      : { context, effect: 'ignored' }
  }

  if (event.type === 'complete_goal' || event.type === 'fail_goal') {
    const goalExists =
      context.currentGoal?.id === event.goalId ||
      context.pausedGoals.some((goal) => goal.id === event.goalId)
    if (!goalExists) return { context, effect: 'ignored' }
    return {
      context: removeGoal(context, event.goalId),
      effect: event.type === 'complete_goal' ? 'completed' : 'failed',
    }
  }

  return { context, effect: 'ignored' }
}
