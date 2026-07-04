import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import type { UIMessage } from 'ai'
import type { ActiveNicNacWorkflowContext } from './active-tool-context'
import {
  computeTradeWorkflowReadiness,
  inferTradeWorkflowIntent,
} from './trade-workflow-controller'
import {
  createTradeWorkflowSession,
  getActiveTradeWorkflowSession,
  isMissingTradeWorkflowSchemaError,
  updateTradeWorkflowSession,
} from './trade-workflow-store'
import {
  getTradeWorkflowToolIntents,
  type TradeWorkflowSessionState,
  type TradeWorkflowType,
} from './trade-workflow-types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateTradeWorkflowContext(args: {
  supabase: SupabaseClient
  repId: string
  conversationId: string
  latestUserText: string
  latestToolIntents: NicNacToolIntent[]
  messages?: UIMessage[]
  latestUserMessageId?: string
  mode: 'workspace' | 'required_setup'
  nowIso: string
}): Promise<{
  sessionAfter: TradeWorkflowSessionState | null
  activeWorkflow: ActiveNicNacWorkflowContext | null
}> {
  if (args.mode !== 'workspace') return emptyContext()

  try {
    const existing = await getActiveTradeWorkflowSession(args.supabase, {
      repId: args.repId,
      conversationId: args.conversationId,
      nowIso: args.nowIso,
    })
    const workflowType =
      existing?.workflowType ??
      inferWorkflowTypeFromTurn(args.latestUserText, args.latestToolIntents)
    if (!workflowType) return emptyContext()

    const base =
      existing ??
      (await createTradeWorkflowSession(args.supabase, {
        repId: args.repId,
        conversationId: args.conversationId,
        workflowType,
        intent: inferTradeWorkflowIntent(workflowType),
        lastUserMessageId: args.latestUserMessageId,
      }))
    const ingested = ingestTradeWorkflowTurn(base, args.messages ?? [])
    const readiness = computeTradeWorkflowReadiness({
      workflowType: ingested.workflowType,
      intent: ingested.intent,
      knownFields: ingested.knownFields,
      candidateCount: ingested.candidates.length,
      approvalState: ingested.approvalState,
    })
    const updated =
      ingested.phase === readiness.phase &&
      sameArray(ingested.missingFields, readiness.missingFields) &&
      sameArray(ingested.blockers, readiness.blockers) &&
      sameJson(ingested.knownFields, base.knownFields) &&
      sameJson(ingested.candidates, base.candidates)
        ? ingested
        : await updateTradeWorkflowSession(args.supabase, {
            ...ingested,
            phase: readiness.phase,
            missingFields: readiness.missingFields,
            blockers: readiness.blockers,
            lastUserMessageId: args.latestUserMessageId ?? ingested.lastUserMessageId,
          })
    const workflowIntents = getTradeWorkflowToolIntents(updated)
    return {
      sessionAfter: updated,
      activeWorkflow:
        updated.status === 'active' && workflowIntents.length
          ? {
              workflowId: updated.id,
              workflowType: updated.workflowType,
              status: updated.status,
              phase: updated.phase,
              workflowIntents,
              toolPolicySource: 'active_workflow',
              promptState: renderTradeWorkflowPromptState(updated, workflowIntents),
            }
          : null,
    }
  } catch (err) {
    if (isMissingTradeWorkflowSchemaError(err)) {
      console.warn('[nic-nac] generic Trade workflow schema is unavailable', {
        conversationId: args.conversationId,
      })
      return emptyContext()
    }
    throw err
  }
}

type TradeSwapCleanupToolPart = {
  type?: string
  state?: string
  output?: {
    items?: Array<{
      swapId?: unknown
      requestId?: unknown
      customerName?: unknown
      outgoingListingId?: unknown
      revealedItemNumber?: unknown
      revealedRingSize?: unknown
      replacementStatus?: unknown
    }>
  }
}

function ingestTradeWorkflowTurn(
  state: TradeWorkflowSessionState,
  messages: UIMessage[],
): TradeWorkflowSessionState {
  if (state.workflowType !== 'trade_swap_cleanup') return state

  const cleanup = extractLatestTradeSwapCleanupOutput(messages)
  if (!cleanup) return state

  const items = cleanup.items ?? []
  const candidates = items
    .filter(
      (item) =>
        typeof item.swapId === 'string' && item.swapId.trim().length > 0,
    )
    .map((item) => {
      const swapId = typeof item.swapId === 'string' ? item.swapId.trim() : ''
      return {
        id: swapId,
        kind: 'swap' as const,
        itemNumber:
          typeof item.revealedItemNumber === 'string'
            ? item.revealedItemNumber.trim().toUpperCase()
            : undefined,
        status:
          typeof item.replacementStatus === 'string'
            ? item.replacementStatus
            : undefined,
        summary: [
          typeof item.customerName === 'string' ? item.customerName : 'Swap',
          typeof item.revealedItemNumber === 'string'
            ? item.revealedItemNumber.trim().toUpperCase()
            : null,
          typeof item.revealedRingSize === 'string'
            ? `size ${item.revealedRingSize.trim()}`
            : null,
        ]
          .filter(Boolean)
          .join(' - '),
        risk: 'medium' as const,
      }
    })

  const knownFields = { ...state.knownFields }
  if (items.length === 1) {
    const item = items[0]
    if (typeof item.swapId === 'string') knownFields.swapId = item.swapId.trim()
    if (typeof item.requestId === 'string') knownFields.requestId = item.requestId.trim()
    if (typeof item.revealedItemNumber === 'string') {
      knownFields.revealedItemNumber = item.revealedItemNumber.trim().toUpperCase()
      knownFields.itemNumber = item.revealedItemNumber.trim().toUpperCase()
    }
    if (typeof item.revealedRingSize === 'string') {
      knownFields.revealedRingSize = item.revealedRingSize.trim()
    }
  }

  return {
    ...state,
    knownFields,
    candidates,
  }
}

function extractLatestTradeSwapCleanupOutput(messages: UIMessage[]) {
  const parts = messages.flatMap(
    (message) => (message.parts ?? []) as TradeSwapCleanupToolPart[],
  )
  return [...parts]
    .reverse()
    .find(
      (part) =>
        part.type === 'tool-get_trade_swap_cleanup' &&
        part.state === 'output-available' &&
        Array.isArray(part.output?.items),
    )?.output
}

function inferWorkflowTypeFromTurn(
  text: string,
  latestToolIntents: NicNacToolIntent[],
): TradeWorkflowType | null {
  if (
    latestToolIntents.includes('fulfillment') &&
    /\b(mark|set|update|move|advance|ship|shipped|complete|completed|done|tracking|fulfilled|received)\b/i.test(
      text,
    )
  ) {
    return 'trade_fulfillment_update'
  }
  if (
    latestToolIntents.includes('catalog') &&
    /\b(wrong|incorrect|bad|fix|correct|correction|issue|problem|duplicate|bad\s+photo|photo\s+is\s+wrong|collection\s+is\s+wrong|material\s+is\s+wrong|stone\s+is\s+wrong|msrp|variant)\b/i.test(
      text,
    )
  ) {
    return 'trade_catalog_correction'
  }
  if (latestToolIntents.includes('trade_requests')) {
    if (/\b(cleanup|missing\s+details|ring\s+size|after[-\s]?show)\b/i.test(text)) {
      return 'trade_swap_cleanup'
    }
    if (/\b(swap|revealed|just\s+revealed|item\s*(?:number|#))\b/i.test(text)) {
      return 'trade_swap_capture'
    }
    if (/\b(approve|accept|reject|decline|deny|cancel)\b/i.test(text)) {
      return 'trade_request_decision'
    }
  }
  if (
    latestToolIntents.includes('trade_board') &&
    /\b(remove|take\s+down|delete|pull)\b[\s\S]{0,80}\b(listing|trade\s+board|board|piece|item)\b/i.test(
      text,
    )
  ) {
    return 'trade_board_remove_listing'
  }
  return null
}

function renderTradeWorkflowPromptState(
  state: TradeWorkflowSessionState,
  intents: NicNacToolIntent[],
) {
  return [
    'Active Nic-Nac Trade workflow:',
    `- id: ${state.id}`,
    `- type: ${state.workflowType}`,
    `- phase: ${state.phase}`,
    `- status: ${state.status}`,
    `- intent: ${state.intent}`,
    `- missing: ${state.missingFields.length ? state.missingFields.join(', ') : 'none'}`,
    `- blockers: ${state.blockers.length ? state.blockers.join(', ') : 'none'}`,
    `- approval: ${state.approvalState}`,
    `- active tool intents: ${intents.join(', ')}`,
    'Rules: keep the listed Trade tools available until this workflow completes, is cancelled, expires, or needs human review. Do not invent mutation fields; ask for missing required fields or exact candidates before calling write tools.',
  ].join('\n')
}

function sameArray(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function emptyContext() {
  return {
    sessionAfter: null,
    activeWorkflow: null,
  }
}
