import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import type { TradeBoardIntakeToolPolicySource } from './trade-board-intake-types'

export type ActiveNicNacWorkflowType =
  | 'trade_board_add_listing'
  | 'trade_board_remove_listing'
  | 'trade_request_decision'
  | 'trade_swap_capture'
  | 'trade_swap_cleanup'
  | 'trade_fulfillment_update'
  | 'trade_catalog_correction'
  | 'calendar_event_work'

export type ActiveNicNacWorkflowStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'needs_human_review'

export interface ActiveNicNacWorkflowContext {
  workflowId: string
  workflowType: ActiveNicNacWorkflowType
  status: ActiveNicNacWorkflowStatus
  phase: string
  workflowIntents: NicNacToolIntent[]
  toolPolicySource: TradeBoardIntakeToolPolicySource | 'active_workflow'
  promptState: string
}

export function mergeActiveWorkflowToolIntents(
  latestIntents: NicNacToolIntent[],
  activeWorkflows: ActiveNicNacWorkflowContext[],
): NicNacToolIntent[] {
  const merged: NicNacToolIntent[] = []
  for (const intent of latestIntents) {
    if (!merged.includes(intent)) merged.push(intent)
  }
  for (const workflow of activeWorkflows) {
    if (workflow.status !== 'active') continue
    for (const intent of workflow.workflowIntents) {
      if (!merged.includes(intent)) merged.push(intent)
    }
  }
  return merged
}

export function renderActiveWorkflowPromptStates(
  activeWorkflows: ActiveNicNacWorkflowContext[],
): string {
  return activeWorkflows
    .filter((workflow) => workflow.status === 'active' && workflow.promptState.trim())
    .map((workflow) => workflow.promptState.trim())
    .join('\n\n')
}

export function activeWorkflowRequiresToolCall(
  activeWorkflows: ActiveNicNacWorkflowContext[],
): boolean {
  return activeWorkflows.some(
    (workflow) =>
      workflow.status === 'active' &&
      workflow.workflowIntents.some((intent) =>
        [
          'calendar',
          'trade_board',
          'catalog',
          'site',
          'trade_requests',
          'fulfillment',
        ].includes(intent),
      ),
  )
}
