import {
  getOperatorSupportToolPolicy,
  type OperatorSupportToolPolicy,
} from '@/lib/nic-nac/core/operator-support-policy'
import type {
  OperatorSupportWorkspaceArea,
  SupportCapability,
} from '@/lib/operator-support/types'

export const NIC_NAC_TOOL_DOMAINS = [
  'memory',
  'show_session',
  'trade_board',
  'trade_requests',
  'fulfillment',
  'jewelry_catalog',
  'calendar',
  'site_content',
  'team',
  'notifications',
  'customer_audience',
  'resources_support',
  'required_setup',
] as const

export type NicNacToolDomain = (typeof NIC_NAC_TOOL_DOMAINS)[number]
export type NicNacToolOperation = 'read' | 'write'
export type NicNacToolApprovalPolicy =
  | 'not_required'
  | 'required'
  | 'dynamic'
export type NicNacToolApprovalReview =
  | 'accepted'
  | 'review_before_agent_rollout'
export type NicNacToolSideEffectRisk =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
export type NicNacToolSideEffectKind =
  | 'none'
  | 'client_navigation'
  | 'internal_record'
  | 'workflow_state'
  | 'inventory_state'
  | 'public_content'
  | 'trade_decision'
  | 'calendar_state'
  | 'show_session_state'
  | 'customer_data'
  | 'outbound_communication'
  | 'storage_upload'
  | 'access_credential'
  | 'account_entitlement'

export type NicNacOperatorSupportAvailability =
  | {
      allowed: true
      capability: SupportCapability
      workspaceArea: OperatorSupportWorkspaceArea
      auditedAsMutation: boolean
    }
  | {
      allowed: false
      reason: 'permanently_blocked'
    }

export type NicNacToolSafetyLedgerEntry = {
  name: string
  domain: NicNacToolDomain
  operation: NicNacToolOperation
  approval: {
    /** Current AI SDK `needsApproval` metadata. */
    policy: NicNacToolApprovalPolicy
    /** All tools must be deliberately reviewed before the agent catalog ships. */
    review: NicNacToolApprovalReview
    /** Human-readable reason the approval behavior is appropriate. */
    rationale?: string
  }
  sideEffect: {
    risk: NicNacToolSideEffectRisk
    kind: NicNacToolSideEffectKind
  }
  availability: {
    normalWorkspace: boolean
    requiredSetup: boolean
    operatorSupport: NicNacOperatorSupportAvailability
  }
}

type ToolEntryInput = Omit<NicNacToolSafetyLedgerEntry, 'name'>

function defineTool(
  name: string,
  input: ToolEntryInput,
): NicNacToolSafetyLedgerEntry {
  return { name, ...input }
}

function allowedSupport(
  capability: SupportCapability,
  workspaceArea: OperatorSupportWorkspaceArea,
  auditedAsMutation: boolean,
): NicNacOperatorSupportAvailability {
  return { allowed: true, capability, workspaceArea, auditedAsMutation }
}

const blockedSupport: NicNacOperatorSupportAvailability = {
  allowed: false,
  reason: 'permanently_blocked',
}

const noEffect = {
  risk: 'none',
  kind: 'none',
} as const

const acceptedNoApproval = {
  policy: 'not_required',
  review: 'accepted',
} as const

const requiredApproval = {
  policy: 'required',
  review: 'accepted',
  rationale: 'A visible approval is required before this consequential action executes.',
} as const

const dynamicApproval = {
  policy: 'dynamic',
  review: 'accepted',
  rationale:
    'The tool requires visible approval only for its destructive or replacement action; ordinary reversible actions remain direct.',
} as const

const reviewedDirectRequestNoApproval = {
  policy: 'not_required',
  review: 'accepted',
  rationale:
    'The rep’s direct, unambiguous request authorizes this established reversible workspace action; schema and service validation remain the execution backstop.',
} as const

const reviewedSetupFlowNoApproval = {
  policy: 'not_required',
  review: 'accepted',
  rationale:
    'This capability is confined to required-setup mode and can execute only after the application-controlled setup state makes it eligible.',
} as const

/**
 * Machine-readable contract for every tool in the Nic-Nac registry.
 *
 * This ledger records the reviewed approval behavior. Direct, reversible
 * workspace actions may rely on an unambiguous user request; destructive,
 * outbound, or otherwise high-consequence actions use a visible approval.
 */
export const NIC_NAC_TOOL_SAFETY_LEDGER: Readonly<
  Record<string, NicNacToolSafetyLedgerEntry>
> = {
  list_my_trade_board: defineTool('list_my_trade_board', {
    domain: 'trade_board', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  prepare_trade_board_work: defineTool('prepare_trade_board_work', {
    domain: 'trade_board', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  remove_listing: defineTool('remove_listing', {
    domain: 'trade_board', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'inventory_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  restore_listing: defineTool('restore_listing', {
    domain: 'trade_board', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'moderate', kind: 'inventory_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  add_listing: defineTool('add_listing', {
    domain: 'trade_board', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  get_trade_requests: defineTool('get_trade_requests', {
    domain: 'trade_requests', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  approve_trade: defineTool('approve_trade', {
    domain: 'trade_requests', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'trade_decision' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  approve_trade_swap: defineTool('approve_trade_swap', {
    domain: 'trade_requests', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'trade_decision' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  reject_trade: defineTool('reject_trade', {
    domain: 'trade_requests', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'moderate', kind: 'trade_decision' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  get_trade_swap_cleanup: defineTool('get_trade_swap_cleanup', {
    domain: 'trade_requests', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  search_jewelry_database: defineTool('search_jewelry_database', {
    domain: 'jewelry_catalog', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  report_jewelry_catalog_issue: defineTool('report_jewelry_catalog_issue', {
    domain: 'jewelry_catalog', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'moderate', kind: 'internal_record' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  update_listing: defineTool('update_listing', {
    domain: 'trade_board', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  get_trade_history: defineTool('get_trade_history', {
    domain: 'trade_requests', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  get_fulfillment_queue: defineTool('get_fulfillment_queue', {
    domain: 'fulfillment', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', false) },
  }),
  update_fulfillment_status: defineTool('update_fulfillment_status', {
    domain: 'fulfillment', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'moderate', kind: 'workflow_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('inventory.manage', 'inventory', true) },
  }),
  add_show: defineTool('add_show', {
    domain: 'calendar', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  prepare_calendar_work: defineTool('prepare_calendar_work', {
    domain: 'calendar', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', false) },
  }),
  list_my_shows: defineTool('list_my_shows', {
    domain: 'calendar', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', false) },
  }),
  update_show: defineTool('update_show', {
    domain: 'calendar', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  cancel_show: defineTool('cancel_show', {
    domain: 'calendar', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  skip_show_occurrence: defineTool('skip_show_occurrence', {
    domain: 'calendar', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  cancel_show_series: defineTool('cancel_show_series', {
    domain: 'calendar', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  pause_show_series: defineTool('pause_show_series', {
    domain: 'calendar', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'calendar_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('calendar.manage', 'calendar', true) },
  }),
  end_show: defineTool('end_show', {
    domain: 'show_session', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'show_session_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('live_queue.manage', 'live_queue', true) },
  }),
  update_banner_text: defineTool('update_banner_text', {
    domain: 'site_content', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', true) },
  }),
  update_streaming_links: defineTool('update_streaming_links', {
    domain: 'site_content', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', true) },
  }),
  update_site_setting: defineTool('update_site_setting', {
    domain: 'site_content', operation: 'write', approval: reviewedDirectRequestNoApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', true) },
  }),
  list_join_team_roster: defineTool('list_join_team_roster', {
    domain: 'team', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('team.manage', 'team', false) },
  }),
  manage_join_team_roster: defineTool('manage_join_team_roster', {
    domain: 'team', operation: 'write', approval: dynamicApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('team.manage', 'team', true) },
  }),
  build_site_recipe_draft: defineTool('build_site_recipe_draft', {
    domain: 'site_content', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'moderate', kind: 'storage_upload' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', true) },
  }),
  list_site_recipes: defineTool('list_site_recipes', {
    domain: 'site_content', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', false) },
  }),
  manage_site_recipes: defineTool('manage_site_recipes', {
    domain: 'site_content', operation: 'write', approval: dynamicApproval,
    sideEffect: { risk: 'high', kind: 'public_content' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('site.manage', 'site', true) },
  }),
  write_rep_note: defineTool('write_rep_note', {
    domain: 'memory', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'low', kind: 'internal_record' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('workspace.view', 'workspace', true) },
  }),
  read_recent_rep_notes: defineTool('read_recent_rep_notes', {
    domain: 'memory', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('workspace.view', 'workspace', false) },
  }),
  start_show_session: defineTool('start_show_session', {
    domain: 'show_session', operation: 'write', approval: dynamicApproval,
    sideEffect: { risk: 'moderate', kind: 'show_session_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('live_queue.manage', 'live_queue', true) },
  }),
  record_show_session_event: defineTool('record_show_session_event', {
    domain: 'show_session', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'low', kind: 'show_session_state' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('live_queue.manage', 'live_queue', true) },
  }),
  get_show_session_context: defineTool('get_show_session_context', {
    domain: 'show_session', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('live_queue.manage', 'live_queue', false) },
  }),
  send_sms_notification: defineTool('send_sms_notification', {
    domain: 'notifications', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'outbound_communication' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('communications.manage', 'communications', true) },
  }),
  send_email_notification: defineTool('send_email_notification', {
    domain: 'notifications', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'outbound_communication' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('communications.manage', 'communications', true) },
  }),
  get_notification_preferences: defineTool('get_notification_preferences', {
    domain: 'notifications', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('customers.manage', 'customers', false) },
  }),
  set_notification_preferences: defineTool('set_notification_preferences', {
    domain: 'notifications', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'moderate', kind: 'customer_data' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('customers.manage', 'customers', true) },
  }),
  set_show_reminder_override: defineTool('set_show_reminder_override', {
    domain: 'notifications', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'moderate', kind: 'customer_data' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('customers.manage', 'customers', true) },
  }),
  get_customer_audience: defineTool('get_customer_audience', {
    domain: 'customer_audience', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('customers.manage', 'customers', false) },
  }),
  manage_customer_contact: defineTool('manage_customer_contact', {
    domain: 'customer_audience', operation: 'write', approval: requiredApproval,
    sideEffect: { risk: 'high', kind: 'customer_data' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('customers.manage', 'customers', true) },
  }),
  get_help_resources: defineTool('get_help_resources', {
    domain: 'resources_support', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('workspace.view', 'workspace', false) },
  }),
  search_work_knowledge: defineTool('search_work_knowledge', {
    domain: 'resources_support', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('workspace.view', 'workspace', false) },
  }),
  submit_support_report: defineTool('submit_support_report', {
    domain: 'resources_support', operation: 'read', approval: acceptedNoApproval,
    sideEffect: { risk: 'low', kind: 'client_navigation' },
    availability: { normalWorkspace: true, requiredSetup: false, operatorSupport: allowedSupport('communications.manage', 'communications', true) },
  }),
  get_required_setup_state: defineTool('get_required_setup_state', {
    domain: 'required_setup', operation: 'read', approval: acceptedNoApproval,
    sideEffect: noEffect,
    availability: { normalWorkspace: false, requiredSetup: true, operatorSupport: allowedSupport('workspace.manage', 'workspace', false) },
  }),
  ensure_live_queue_sync_code: defineTool('ensure_live_queue_sync_code', {
    domain: 'required_setup', operation: 'write', approval: reviewedSetupFlowNoApproval,
    sideEffect: { risk: 'critical', kind: 'access_credential' },
    availability: { normalWorkspace: false, requiredSetup: true, operatorSupport: blockedSupport },
  }),
  save_required_setup_answer: defineTool('save_required_setup_answer', {
    domain: 'required_setup', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'low', kind: 'workflow_state' },
    availability: { normalWorkspace: false, requiredSetup: true, operatorSupport: allowedSupport('workspace.manage', 'workspace', true) },
  }),
  request_required_setup_support: defineTool('request_required_setup_support', {
    domain: 'required_setup', operation: 'write', approval: acceptedNoApproval,
    sideEffect: { risk: 'moderate', kind: 'internal_record' },
    availability: { normalWorkspace: false, requiredSetup: true, operatorSupport: allowedSupport('communications.manage', 'communications', true) },
  }),
  unlock_required_setup: defineTool('unlock_required_setup', {
    domain: 'required_setup', operation: 'write', approval: reviewedSetupFlowNoApproval,
    sideEffect: { risk: 'critical', kind: 'account_entitlement' },
    availability: { normalWorkspace: false, requiredSetup: true, operatorSupport: blockedSupport },
  }),
}

export type RegisteredNicNacToolContract = {
  name: string
  readOnly: boolean
  approvalPolicy?: NicNacToolApprovalPolicy
}

export type NicNacToolSafetyFinding = {
  severity: 'error' | 'warning'
  code:
    | 'duplicate_registered_tool'
    | 'missing_ledger_entry'
    | 'unknown_ledger_entry'
    | 'tool_name_mismatch'
    | 'operation_mismatch'
    | 'approval_metadata_mismatch'
    | 'read_requires_approval'
    | 'write_has_no_side_effect'
    | 'unsafe_no_approval_metadata'
    | 'operator_support_policy_mismatch'
    | 'surface_policy_mismatch'
    | 'approval_review_required'
  toolName: string
  message: string
}

type SafetyAuditOptions = {
  registeredTools: readonly RegisteredNicNacToolContract[]
  normalWorkspaceToolNames?: readonly string[]
  requiredSetupToolNames?: readonly string[]
}

function sameOperatorPolicy(
  ledgerPolicy: NicNacOperatorSupportAvailability,
  runtimePolicy: OperatorSupportToolPolicy | null,
) {
  if (!ledgerPolicy.allowed) return runtimePolicy === null
  return Boolean(
    runtimePolicy &&
      runtimePolicy.capability === ledgerPolicy.capability &&
      runtimePolicy.workspaceArea === ledgerPolicy.workspaceArea &&
      runtimePolicy.mutation === ledgerPolicy.auditedAsMutation,
  )
}

/**
 * Reconciles the independent safety ledger with the actual registered tools
 * and surface policies. Errors indicate metadata that cannot safely reach the
 * agent harness. Warnings are explicit approval decisions still owed before
 * rollout; they do not change current behavior.
 */
export function auditNicNacToolSafetyLedger(
  options: SafetyAuditOptions,
): NicNacToolSafetyFinding[] {
  const findings: NicNacToolSafetyFinding[] = []
  const counts = new Map<string, number>()
  for (const tool of options.registeredTools) {
    counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1)
  }

  for (const [name, count] of counts) {
    if (count > 1) {
      findings.push({
        severity: 'error', code: 'duplicate_registered_tool', toolName: name,
        message: `${name} is registered ${count} times.`,
      })
    }
  }

  const registeredNames = new Set(options.registeredTools.map((tool) => tool.name))
  const normalWorkspaceNames = options.normalWorkspaceToolNames
    ? new Set(options.normalWorkspaceToolNames)
    : null
  const requiredSetupNames = options.requiredSetupToolNames
    ? new Set(options.requiredSetupToolNames)
    : null

  for (const tool of options.registeredTools) {
    const entry = NIC_NAC_TOOL_SAFETY_LEDGER[tool.name]
    if (!entry) {
      findings.push({
        severity: 'error', code: 'missing_ledger_entry', toolName: tool.name,
        message: `${tool.name} is registered without a safety-ledger entry.`,
      })
      continue
    }
    if (entry.name !== tool.name) {
      findings.push({
        severity: 'error', code: 'tool_name_mismatch', toolName: tool.name,
        message: `Ledger key ${tool.name} declares the name ${entry.name}.`,
      })
    }
    if ((entry.operation === 'read') !== tool.readOnly) {
      findings.push({
        severity: 'error', code: 'operation_mismatch', toolName: tool.name,
        message: `${tool.name} registry readOnly=${tool.readOnly} conflicts with ledger operation=${entry.operation}.`,
      })
    }
    if (
      tool.approvalPolicy &&
      tool.approvalPolicy !== entry.approval.policy
    ) {
      findings.push({
        severity: 'error', code: 'approval_metadata_mismatch', toolName: tool.name,
        message: `${tool.name} runtime approval=${tool.approvalPolicy} conflicts with ledger approval=${entry.approval.policy}.`,
      })
    }
    if (entry.operation === 'read' && entry.approval.policy !== 'not_required') {
      findings.push({
        severity: 'error', code: 'read_requires_approval', toolName: tool.name,
        message: `${tool.name} is read-only but declares approval metadata.`,
      })
    }
    if (entry.operation === 'write' && entry.sideEffect.kind === 'none') {
      findings.push({
        severity: 'error', code: 'write_has_no_side_effect', toolName: tool.name,
        message: `${tool.name} is a write but has no declared side effect.`,
      })
    }
    if (
      entry.operation === 'write' &&
      (entry.sideEffect.risk === 'high' || entry.sideEffect.risk === 'critical') &&
      entry.approval.policy === 'not_required' &&
      !(
        entry.approval.review === 'accepted' &&
        Boolean(entry.approval.rationale?.trim())
      )
    ) {
      findings.push({
        severity: 'error', code: 'unsafe_no_approval_metadata', toolName: tool.name,
        message: `${tool.name} is a ${entry.sideEffect.risk}-risk write without approval or a documented accepted rationale.`,
      })
    }
    if (entry.approval.review === 'review_before_agent_rollout') {
      findings.push({
        severity: 'warning', code: 'approval_review_required', toolName: tool.name,
        message: `${tool.name} preserves its current no-approval behavior but requires explicit approval-policy review before agent rollout.`,
      })
    }

    const supportPolicy = getOperatorSupportToolPolicy(tool.name)
    if (!sameOperatorPolicy(entry.availability.operatorSupport, supportPolicy)) {
      findings.push({
        severity: 'error', code: 'operator_support_policy_mismatch', toolName: tool.name,
        message: `${tool.name} ledger operator-support policy does not match the enforced policy.`,
      })
    }

    if (
      normalWorkspaceNames &&
      normalWorkspaceNames.has(tool.name) !== entry.availability.normalWorkspace
    ) {
      findings.push({
        severity: 'error', code: 'surface_policy_mismatch', toolName: tool.name,
        message: `${tool.name} normal-workspace availability conflicts with the routed tool packs.`,
      })
    }
    if (
      requiredSetupNames &&
      requiredSetupNames.has(tool.name) !== entry.availability.requiredSetup
    ) {
      findings.push({
        severity: 'error', code: 'surface_policy_mismatch', toolName: tool.name,
        message: `${tool.name} required-setup availability conflicts with the routed tool pack.`,
      })
    }
  }

  for (const name of Object.keys(NIC_NAC_TOOL_SAFETY_LEDGER)) {
    if (!registeredNames.has(name)) {
      findings.push({
        severity: 'error', code: 'unknown_ledger_entry', toolName: name,
        message: `${name} has a safety-ledger entry but is not registered.`,
      })
    }
  }

  return findings
}

export function getNicNacToolSafetyEntry(toolName: string) {
  return NIC_NAC_TOOL_SAFETY_LEDGER[toolName] ?? null
}
