export const OPERATOR_SUPPORT_REASON_CODES = [
  'account_setup',
  'troubleshooting',
  'support_request',
  'content_update',
  'other',
] as const

export type OperatorSupportReasonCode = (typeof OPERATOR_SUPPORT_REASON_CODES)[number]

export const OPERATOR_SUPPORT_SESSION_STATUSES = [
  'pending_notice',
  'active',
  'ended',
  'expired',
  'revoked',
  'failed',
] as const

export type OperatorSupportSessionStatus = (typeof OPERATOR_SUPPORT_SESSION_STATUSES)[number]

export const OPERATOR_SUPPORT_ENDED_REASONS = [
  'operator',
  'expired',
  'revoked',
  'control_center_logout',
  'target_ineligible',
  'failure',
] as const

export type OperatorSupportEndedReason = (typeof OPERATOR_SUPPORT_ENDED_REASONS)[number]

export const OPERATOR_SUPPORT_AUDIT_EVENT_TYPES = [
  'session_requested',
  'rep_notice_published',
  'session_started',
  'workspace_area_viewed',
  'public_site_opened',
  'mutation_attempted',
  'mutation_succeeded',
  'mutation_failed',
  'blocked_action_attempted',
  'session_extended',
  'session_end_requested',
  'session_ended',
  'session_expired',
  'session_revoked',
  'completion_notice_published',
] as const

export type OperatorSupportAuditEventType = (typeof OPERATOR_SUPPORT_AUDIT_EVENT_TYPES)[number]

export const OPERATOR_SUPPORT_WORKSPACE_AREAS = [
  'session',
  'workspace',
  'site',
  'inventory',
  'calendar',
  'customers',
  'team',
  'messages',
  'nic_nac',
  'live_queue',
  'billing',
  'authentication',
  'security',
  'communications',
  'exports',
  'system',
] as const

export type OperatorSupportWorkspaceArea = (typeof OPERATOR_SUPPORT_WORKSPACE_AREAS)[number]
export type OperatorSupportAuditResult = 'attempted' | 'succeeded' | 'failed' | 'denied'

export type SupportCapability =
  | 'workspace.view'
  | 'workspace.manage'
  | 'site.view'
  | 'site.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'calendar.view'
  | 'calendar.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'team.view'
  | 'team.manage'
  | 'messages.view'
  | 'messages.manage'
  | 'communications.manage'
  | 'nic_nac.use'
  | 'live_queue.view'
  | 'live_queue.manage'

export type WorkspaceActor =
  | {
      mode: 'rep'
      actorRepId: string
      subjectRepId: string
    }
  | {
      mode: 'operator_support'
      operatorRepId: string
      operatorEmail: string
      operatorDisplayName: string
      subjectRepId: string
      supportSessionId: string
      capabilities: SupportCapability[]
    }

export type OperatorSupportSession = {
  id: string
  operatorRepId: string
  operatorEmailSnapshot: string
  operatorDisplayNameSnapshot: string
  targetRepId: string
  targetNameSnapshot: string
  targetBusinessSnapshot: string
  reasonCode: OperatorSupportReasonCode
  reasonNote: string | null
  supportReportId: string | null
  status: OperatorSupportSessionStatus
  capabilities: SupportCapability[]
  requestId: string
  startedAt: string | null
  lastActivityAt: string | null
  expiresAt: string
  extendedAt: string | null
  endedAt: string | null
  endedReason: OperatorSupportEndedReason | null
  completionSummary: string | null
  startPublicationId: string | null
  endPublicationId: string | null
  createdAt: string
  updatedAt: string
}

export type OperatorSupportAuditEvent = {
  id: string
  supportSessionId: string
  operatorRepId: string
  targetRepId: string
  eventType: OperatorSupportAuditEventType
  workspaceArea: OperatorSupportWorkspaceArea
  capability: SupportCapability | null
  resourceType: string | null
  resourceId: string | null
  actionName: string | null
  result: OperatorSupportAuditResult
  safeDiff: Record<string, unknown>
  errorCode: string | null
  idempotencyKey: string | null
  requestId: string | null
  createdAt: string
}

export type OperatorSupportAuditInput = {
  supportSessionId: string
  operatorRepId: string
  targetRepId: string
  eventType: OperatorSupportAuditEventType
  workspaceArea: OperatorSupportWorkspaceArea
  capability?: SupportCapability | null
  resourceType?: string | null
  resourceId?: string | null
  actionName?: string | null
  result: OperatorSupportAuditResult
  safeDiff?: unknown
  errorCode?: string | null
  idempotencyKey?: string | null
  requestId?: string | null
}
