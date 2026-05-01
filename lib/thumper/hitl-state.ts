// Pure helpers around AI SDK v6 HITL state. No React, no Supabase — these
// are shared between the route handler (continuation detection) and the
// Thumper client (actionable-approval gating) and unit-tested in isolation.

import type { UIMessage } from 'ai'

/**
 * Decide the assistant message id for a POST to /api/thumper.
 *
 * AI SDK v6's continuation pattern (handle-ui-message-stream-finish.ts:42–50)
 * reuses the last assistant message id when the last incoming message is an
 * assistant turn — that's the HITL resume case. We mirror that decision so
 * the resume's output-available chunk lands on the SAME assistant row,
 * instead of creating a parallel row that leaves the original stuck at
 * approval-requested in the DB.
 */
export function decideAssistantMessageId(
  messages: UIMessage[],
  generateNewId: () => string
): { messageId: string; isContinuation: boolean } {
  const last = messages[messages.length - 1]
  if (last?.role === 'assistant') {
    return { messageId: last.id, isContinuation: true }
  }
  return { messageId: generateNewId(), isContinuation: false }
}

export interface ActionableApproval {
  approvalId: string
  toolName: string
  input: Record<string, unknown>
}

/**
 * Find an actionable approval-requested part within the LAST step of an
 * assistant message. Mirrors the AI SDK's
 * `lastAssistantMessageIsCompleteWithApprovalResponses` semantic — only parts
 * after the most recent `step-start` count.
 *
 * Approval-requested parts that live on prior steps (or prior messages) are
 * historical and the SDK can no longer mutate them via
 * `addToolApprovalResponse`, so they should not render a live HITL card and
 * should not lock the input. Returns `null` when the message has no
 * actionable approval in its last step.
 */
export function approvalRequestedInLastStep(
  message: UIMessage
): ActionableApproval | null {
  if (message.role !== 'assistant') return null
  const parts = message.parts ?? []
  let lastStepStart = -1
  for (let i = 0; i < parts.length; i++) {
    if ((parts[i] as { type?: string }).type === 'step-start') {
      lastStepStart = i
    }
  }
  for (let i = lastStepStart + 1; i < parts.length; i++) {
    const p = parts[i] as {
      state?: string
      type?: string
      toolName?: string
      input?: Record<string, unknown>
      approval?: { id?: string }
    }
    if (p.state !== 'approval-requested' || !p.approval?.id) continue
    const toolName =
      p.toolName ??
      (p.type?.startsWith('tool-') ? p.type.slice('tool-'.length) : 'tool')
    return {
      approvalId: p.approval.id,
      toolName,
      input: p.input ?? {},
    }
  }
  return null
}

/**
 * Find the actionable approval (if any) for the entire conversation. Only
 * the LAST assistant message can carry one — earlier assistant messages,
 * even if they still have approval-requested parts, are historical.
 */
export function findActionableApproval(
  messages: UIMessage[]
): { messageId: string; approval: ActionableApproval } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'assistant') continue
    const approval = approvalRequestedInLastStep(m)
    return approval ? { messageId: m.id, approval } : null
  }
  return null
}
