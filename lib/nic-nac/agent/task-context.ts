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

/**
 * Compact continuity data exposed to the agent as untrusted, recoverable
 * workflow facts. It does not classify user text, select tools, or drive a
 * scripted state machine. The model reasons from the latest conversation and
 * may resume one of these transactions only when the rep asks to return to it.
 */
export type NicNacTaskContext = {
  schemaVersion: typeof NIC_NAC_TASK_CONTEXT_SCHEMA_VERSION
  currentGoal: NicNacTaskGoal | null
  pausedGoals: NicNacTaskGoal[]
  immediateContinuation: null
}
