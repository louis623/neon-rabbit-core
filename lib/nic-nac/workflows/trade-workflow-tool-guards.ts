import { NicNacToolError } from '@/lib/nic-nac/errors'
import {
  normalizeTradeItemNumber,
  normalizeTradeRingSize,
} from './trade-workflow-sanitizers'
import type {
  TradeWorkflowKnownFields,
  TradeWorkflowSessionState,
  TradeWorkflowType,
} from './trade-workflow-types'

type GuardedField = keyof TradeWorkflowKnownFields

export function assertTradeWorkflowInputMatches(args: {
  workflow?: TradeWorkflowSessionState | null
  workflowType: TradeWorkflowType
  toolName: string
  checks: Array<{
    field: GuardedField
    value: unknown
    label?: string
  }>
}) {
  const workflow = args.workflow
  if (!workflow || workflow.workflowType !== args.workflowType) return

  for (const check of args.checks) {
    const expected = workflow.knownFields[check.field]
    if (expected === undefined || expected === null || check.value === undefined) {
      continue
    }

    const expectedNormalized = normalizeWorkflowGuardValue(check.field, expected)
    const receivedNormalized = normalizeWorkflowGuardValue(check.field, check.value)
    if (!expectedNormalized || !receivedNormalized) continue
    if (expectedNormalized === receivedNormalized) continue

    throw new NicNacToolError({
      code: 'WORKFLOW_TARGET_MISMATCH',
      userMessage:
        `I have this ${check.label ?? String(check.field)} tied to the active workflow already, ` +
        'and that tool call pointed at a different target. I need to re-check the exact item before changing anything.',
    })
  }
}

export function workflowKnownString(
  workflow: TradeWorkflowSessionState | null | undefined,
  field: GuardedField,
): string | undefined {
  const value = workflow?.knownFields[field]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeWorkflowGuardValue(field: GuardedField, value: unknown) {
  if (field === 'itemNumber' || field === 'revealedItemNumber') {
    return normalizeTradeItemNumber(value)
  }
  if (field === 'revealedRingSize') {
    return normalizeTradeRingSize(value)
  }
  if (typeof value !== 'string') return String(value)
  return value.trim()
}
