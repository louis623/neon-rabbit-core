// Production /api/nic-nac route. Ports app/api/nic-nac/spike/route.ts and
// adds Guardian telemetry + Enforcer audit hooks at the route handler level.
//
// Telemetry approach is fixed: closure-wrapper around tool.execute (NOT the
// AI SDK onStepFinish/onToolCall hook path). See lib/nic-nac/guardian-telemetry.ts.

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
} from 'ai'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  loadCanonicalHistory,
  insertUserMessage,
  reserveAssistantMessage,
  completeAssistant,
  abortAssistant,
  checkpointAssistant,
  recordApprovalEvent,
} from '@/lib/nic-nac/persistence'
import {
  addWorkspaceBaselineToolIntents,
  buildToolsForIntents,
  getToolIntentsForMessages,
  shouldRequireToolCallForMessages,
  type NicNacToolIntent,
} from '@/lib/nic-nac/tools'
import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'
import { probeConversationOwner } from '@/lib/nic-nac/probe-conversation-owner'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import {
  decideAssistantMessageId,
  shouldCheckpointContinuation,
} from '@/lib/nic-nac/hitl-state'
import { selectMessagesForModel } from '@/lib/nic-nac/model-context'
import {
  logNicNacRun,
  normalizeRunUsage,
  type NicNacRunUsage,
} from '@/lib/nic-nac/run-telemetry'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'
import {
  getNicNacLanguageModel,
  getNicNacProviderOptions,
} from '@/lib/nic-nac/core/model-provider'
import { estimateNicNacRunCostCents } from '@/lib/nic-nac/core/model-cost'
import {
  createSuiteOperatorSupportProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'
import { getOperatorSupportRequestContext } from '@/lib/operator-support/request-context'
import {
  assertOperatorSupportConversationId,
  insertOperatorSupportConversationMessage,
  loadOperatorSupportConversation,
  recordOperatorSupportApprovalEvent,
} from '@/lib/nic-nac/support-conversation'
import { filterNicNacToolIntentsForContext } from '@/lib/nic-nac/core/tool-policy'
import { assembleNicNacContext } from '@/lib/nic-nac/core/context-assembler'
import { loadSuiteRepMemoryCards } from '@/lib/nic-nac/core/memory/rep-memory-cards'
import { classifyNicNacMissionScopeForMessages } from '@/lib/nic-nac/core/mission-guard'
import { createNicNacStaticTextStreamResponse } from '@/lib/nic-nac/core/static-stream'
import { chooseNicNacToolChoiceForStep } from '@/lib/nic-nac/tool-choice-policy'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeNicNacAssistantParts } from '@/lib/nic-nac/message-normalize'
import {
  getOrCreateTradeBoardIntakeContext,
} from '@/lib/nic-nac/workflows/trade-board-intake-context'
import { getOrCreateTradeWorkflowContext } from '@/lib/nic-nac/workflows/trade-workflow-context'
import { getOrCreateCalendarWorkflowContext } from '@/lib/nic-nac/workflows/calendar-workflow-context'
import {
  activeWorkflowRequiresToolCall,
  mergeActiveWorkflowToolIntents,
  renderActiveWorkflowPromptStates,
  type ActiveNicNacWorkflowContext,
} from '@/lib/nic-nac/workflows/active-tool-context'
import { summarizeHardFailDetection } from '@/lib/nic-nac/workflows/trade-board-intake-eval'
import {
  isRenderableNicNacStreamChunk,
  NIC_NAC_EMPTY_RESPONSE_FALLBACK,
} from '@/lib/nic-nac/core/stream-output-guard'
import { buildPersonalizedRepGreeting } from '@/lib/nic-nac/core/rep-personalization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface PostBody {
  conversationId: string
  messages: UIMessage[]
  mode?: 'workspace' | 'required_setup'
}

function readTextFromMessage(message: UIMessage | undefined): string {
  return (
    message?.parts
      ?.filter(
        (part): part is { type: 'text'; text: string } =>
          part.type === 'text' &&
          typeof (part as { text?: unknown }).text === 'string',
      )
      .map((part) => part.text)
      .join('\n') ?? ''
  )
}

function extractStreamErrorMessage(err: unknown): string {
  const seen = new Set<unknown>()
  const messages: string[] = []
  const codes: string[] = []

  const visit = (value: unknown) => {
    if (!value || seen.has(value)) return
    if (typeof value !== 'object') {
      if (typeof value === 'string' && value.trim()) messages.push(value.trim())
      return
    }

    seen.add(value)
    const record = value as Record<string, unknown>
    const message = record.message
    const code = record.code
    const type = record.type
    if (typeof message === 'string' && message.trim()) {
      messages.push(message.trim())
    }
    if (typeof code === 'string' && code.trim()) codes.push(code.trim())
    if (typeof type === 'string' && type.trim()) codes.push(type.trim())
    visit(record.error)
    visit(record.cause)
  }

  visit(err)

  const prefix = Array.from(new Set(codes)).join(':')
  const message = Array.from(new Set(messages)).join(' | ')
  if (prefix && message) return `${prefix}: ${message}`
  if (message) return message
  if (prefix) return prefix
  return String(err)
}

// Scan messages for HITL approval-responded parts. AI SDK v6 mutates the
// assistant message parts in place when the user clicks approve/reject.
function extractApprovalResponses(
  messages: UIMessage[]
): Array<{ approvalId: string; approved: boolean; toolName: string }> {
  const out: Array<{ approvalId: string; approved: boolean; toolName: string }> = []
  for (const m of messages) {
    for (const part of m.parts ?? []) {
      const p = part as unknown as {
        type?: string
        state?: string
        approval?: { id?: string; approved?: boolean }
        toolName?: string
      }
      if (p?.state === 'approval-responded' && p?.approval?.id) {
        out.push({
          approvalId: p.approval.id,
          approved: p.approval.approved ?? false,
          toolName:
            p.toolName ??
            (p.type?.startsWith('tool-') ? p.type.slice('tool-'.length) : 'unknown'),
        })
      }
    }
  }
  return out
}

type ApprovalContinuationResult = {
  handled: boolean
  updatedParts?: UIMessage['parts']
  responseText?: string
  executedToolNames?: string[]
}

async function executeApprovedToolContinuations(args: {
  messages: UIMessage[]
  tools: Record<string, unknown>
}): Promise<ApprovalContinuationResult> {
  const last = args.messages.at(-1)
  if (last?.role !== 'assistant') return { handled: false }

  let handled = false
  const executedToolNames: string[] = []
  const responseLines: string[] = []
  const updatedParts = [...(last.parts ?? [])] as UIMessage['parts']

  for (let index = 0; index < updatedParts.length; index += 1) {
    const part = updatedParts[index] as UIMessage['parts'][number] & {
      type?: string
      state?: string
      toolName?: string
      input?: unknown
      output?: unknown
      toolCallId?: string
      approval?: { id?: string; approved?: boolean; reason?: string }
    }
    if (part.state !== 'approval-responded' || !part.approval?.id) continue

    const toolName =
      part.toolName ??
      (part.type?.startsWith('tool-') ? part.type.slice('tool-'.length) : undefined)
    if (!toolName || !part.toolCallId) continue

    const tool = args.tools[toolName] as {
      needsApproval?: boolean
      execute?: (input: unknown) => Promise<unknown>
    } | undefined
    if (tool?.needsApproval !== true || typeof tool.execute !== 'function') continue

    handled = true
    if (part.approval.approved === false) {
      updatedParts[index] = {
        ...part,
        toolName,
        state: 'output-denied',
      } as UIMessage['parts'][number]
      responseLines.push('No problem — I left that unchanged.')
      continue
    }

    const output = await tool.execute(part.input ?? {})
    executedToolNames.push(toolName)
    updatedParts[index] = {
      ...part,
      toolName,
      state: 'output-available',
      output,
    } as UIMessage['parts'][number]
    responseLines.push(formatApprovalContinuationText(toolName, output))
  }

  if (!handled) return { handled: false }
  return {
    handled: true,
    updatedParts,
    responseText: responseLines.filter(Boolean).join('\n\n'),
    executedToolNames,
  }
}

function formatApprovalContinuationText(toolName: string, output: unknown): string {
  const data = output as {
    event?: { title?: string; status?: string }
    cancelledCount?: number
  }
  if (toolName === 'cancel_show') {
    const title = data.event?.title ? ` ${data.event.title}` : ''
    return `Done — I cancelled${title}.`
  }
  if (toolName === 'cancel_show_series') {
    const count = typeof data.cancelledCount === 'number' ? data.cancelledCount : undefined
    return count
      ? `Done — I cancelled ${count} future show${count === 1 ? '' : 's'} in that series.`
      : 'Done — I cancelled that recurring show series.'
  }
  return 'Done — I made that approved change.'
}

export async function POST(request: Request) {
  const runId = randomUUID()
  const runStartedAt = Date.now()
  const responseHeaders = { 'x-nic-nac-run-id': runId }
  const modelPolicy = getNicNacModelPolicy('human_default')

  let ctx
  try {
    ctx = await getPaidNicNacContext()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: 'unauthenticated' },
        { status: 401, headers: responseHeaders }
      )
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.userMessage, code: err.code },
        { status: err.statusCode, headers: responseHeaders },
      )
    }
    await logIncident({
      errorType: 'auth_unexpected',
      severity: 'error',
      details: { runId, message: (err as Error).message },
    })
    throw err
  }
  const { repId, rep, supabase } = ctx
  const supportContext = getOperatorSupportRequestContext()
  const supportScope = supportContext
    ? {
        supportSessionId: supportContext.session.id,
        operatorRepId: supportContext.actor.operatorRepId,
        targetRepId: supportContext.actor.subjectRepId,
      }
    : null
  const productContext = supportContext
    ? createSuiteOperatorSupportProductContext({
        targetRepId: repId,
        targetUserId: rep.auth_user_id,
        operatorRepId: supportContext.actor.operatorRepId,
        supportSessionId: supportContext.session.id,
      })
    : createSuiteRepWorkspaceProductContext({
        repId,
        userId: rep.auth_user_id,
      })

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: responseHeaders }
    )
  }

  if (!body.conversationId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'missing_fields' },
      { status: 400, headers: responseHeaders }
    )
  }

  const { conversationId, messages } = body
  if (supportScope) {
    try {
      assertOperatorSupportConversationId(conversationId, supportScope)
    } catch {
      return NextResponse.json(
        { error: 'support_conversation_mismatch' },
        { status: 403, headers: responseHeaders },
      )
    }
  }
  const mode = body.mode === 'required_setup' ? 'required_setup' : 'workspace'

  console.info('[nic-nac] run', { runId, conversationId, repId })

  // Ownership probe — admin client, NOT RLS-filtered. RLS would return null
  // for cross-tenant conversations and silently let cross-tenant injection
  // through (red-team attack #7). Parallelized with the canonical-history load
  // since neither depends on the other; saves ~one round-trip of pre-stream
  // latency.
  let existingOwner: string | null = null
  let existingHistory: Awaited<ReturnType<typeof loadCanonicalHistory>>
  try {
    ;[existingOwner, existingHistory] = await Promise.all([
      probeConversationOwner(conversationId),
      supportScope
        ? loadOperatorSupportConversation(supabase, supportScope)
        : loadCanonicalHistory(supabase, conversationId),
    ])
  } catch (err) {
    const message = (err as Error).message
    await logIncident({
      errorType: 'pre_stream_setup_failed',
      repId,
      conversationId,
      severity: 'error',
      details: { runId, message },
    })
    if (mode === 'required_setup') {
      return NextResponse.json(
        {
          error: 'Required setup chat failed.',
          code: 'REQUIRED_SETUP_CHAT_CONTEXT_MISSING',
          detail:
            'Nic-Nac could not load this required setup conversation context.',
        },
        { status: 500, headers: responseHeaders },
      )
    }
    throw err
  }
  if (existingOwner && existingOwner !== repId) {
    return NextResponse.json(
      { error: 'forbidden' },
      { status: 403, headers: responseHeaders }
    )
  }

  const missionScope = classifyNicNacMissionScopeForMessages(messages)

  if (missionScope.action === 'redirect') {
    const existingIds = new Set(existingHistory.map((m) => m.id))
    for (const m of messages) {
      if (m.role !== 'user') continue
      if (existingIds.has(m.id)) continue
      if (supportScope) {
        await insertOperatorSupportConversationMessage(supabase, supportScope, m)
      } else {
        await insertUserMessage(supabase, {
          conversationId,
          repId,
          messageId: m.id,
          parts: m.parts,
        })
      }
    }

    const assistantMessageId = randomUUID()
    if (supportScope) {
      await insertOperatorSupportConversationMessage(supabase, supportScope, {
        id: assistantMessageId,
        role: 'assistant',
        parts: [],
        status: 'pending',
      })
    } else {
      await reserveAssistantMessage(supabase, {
        conversationId,
        repId,
        messageId: assistantMessageId,
      })
    }
    await completeAssistant(supabase, {
      conversationId,
      messageId: assistantMessageId,
      parts: [{ type: 'text', text: missionScope.message }],
    })
    await logNicNacRun({
      runId,
      repId,
      conversationId,
      model: 'mission_redirect',
      status: 'complete',
      latencyMs: Date.now() - runStartedAt,
      intents: [],
      toolNames: [],
      productContext,
      modelContext: {
        originalMessageCount: messages.length,
        modelMessageCount: 0,
        droppedMessageCount: 0,
        estimatedTokens: 0,
        wasCompacted: false,
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostCents: 0,
      },
      errorMessage: `mission_redirect:${missionScope.reason}`,
    })

    return createNicNacStaticTextStreamResponse({
      message: missionScope.message,
      messageId: assistantMessageId,
      headers: responseHeaders,
    })
  }

  const personalizedGreeting = buildPersonalizedRepGreeting({
    latestUserText: readTextFromMessage(
      [...messages].reverse().find((message) => message.role === 'user'),
    ),
    repDisplayName: rep.display_name,
  })
  if (mode === 'workspace' && personalizedGreeting) {
    const existingIds = new Set(existingHistory.map((message) => message.id))
    for (const message of messages) {
      if (message.role !== 'user' || existingIds.has(message.id)) continue
      if (supportScope) {
        await insertOperatorSupportConversationMessage(
          supabase,
          supportScope,
          message,
        )
      } else {
        await insertUserMessage(supabase, {
          conversationId,
          repId,
          messageId: message.id,
          parts: message.parts,
        })
      }
    }

    const assistantMessageId = randomUUID()
    if (supportScope) {
      await insertOperatorSupportConversationMessage(supabase, supportScope, {
        id: assistantMessageId,
        role: 'assistant',
        parts: [],
        status: 'pending',
      })
    } else {
      await reserveAssistantMessage(supabase, {
        conversationId,
        repId,
        messageId: assistantMessageId,
      })
    }
    await completeAssistant(supabase, {
      conversationId,
      messageId: assistantMessageId,
      parts: [{ type: 'text', text: personalizedGreeting }],
    })
    await logNicNacRun({
      runId,
      repId,
      conversationId,
      model: 'personalized_greeting',
      status: 'complete',
      latencyMs: Date.now() - runStartedAt,
      intents: [],
      toolNames: [],
      productContext,
      modelContext: {
        originalMessageCount: messages.length,
        modelMessageCount: 0,
        droppedMessageCount: 0,
        estimatedTokens: 0,
        wasCompacted: false,
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostCents: 0,
      },
      errorMessage: 'personalized_greeting',
    })

    return createNicNacStaticTextStreamResponse({
      message: personalizedGreeting,
      messageId: assistantMessageId,
      headers: responseHeaders,
    })
  }

  const repMemoryCards = await loadSuiteRepMemoryCards({
    repId,
    supabase,
    onError: async (err) => {
      await logIncident({
        errorType: 'rep_memory_context_failed',
        repId,
        conversationId,
        severity: 'warn',
        details: { runId, message: err.message },
      })
    },
  })
  const assembledContext = assembleNicNacContext({
    productContext,
    memoryCards: repMemoryCards,
  })

  // Approval replay protection. UNIQUE(approval_id) is the durable backstop.
  const approvals = extractApprovalResponses(messages)
  for (const a of approvals) {
    const { replayed } = supportScope
      ? await recordOperatorSupportApprovalEvent(supabase, supportScope, a)
      : await recordApprovalEvent(supabase, {
          conversationId,
          repId,
          approvalId: a.approvalId,
          toolName: a.toolName,
          approved: a.approved,
        })
    if (replayed) {
      return NextResponse.json(
        { error: 'approval_replayed', approvalId: a.approvalId },
        { status: 400, headers: responseHeaders }
      )
    }
  }

  // Idempotent persist of any new user-role messages from the client array.
  const existingIds = new Set(existingHistory.map((m) => m.id))
  for (const m of messages) {
    if (m.role !== 'user') continue
    if (existingIds.has(m.id)) continue
    if (supportScope) {
      await insertOperatorSupportConversationMessage(supabase, supportScope, m)
    } else {
      await insertUserMessage(supabase, {
        conversationId,
        repId,
        messageId: m.id,
        parts: m.parts,
      })
    }
  }

  // Reserve assistant row before streamText starts. Same ID is wired to the
  // SDK via generateMessageId so the DB row and SDK-emitted message stay in
  // sync even if the stream aborts.
  //
  // For HITL continuation (last message is an assistant turn carrying an
  // approval-responded part), reuse that turn's id instead of generating a
  // new one — this matches the AI SDK's continuation pattern and keeps the
  // resume's output-available state on the original DB row, not a parallel
  // one that would resurrect a dead approval card on reload.
  const { messageId: assistantMessageId, isContinuation } =
    decideAssistantMessageId(messages, () => randomUUID())
  if (!isContinuation) {
    if (supportScope) {
      await insertOperatorSupportConversationMessage(supabase, supportScope, {
        id: assistantMessageId,
        role: 'assistant',
        parts: [],
        status: 'pending',
      })
    } else {
      await reserveAssistantMessage(supabase, {
        conversationId,
        repId,
        messageId: assistantMessageId,
      })
    }
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user')
  const previousAssistantMessage = [...messages]
    .slice(0, -1)
    .reverse()
    .find((message) => message.role === 'assistant')
  const latestUserText = readTextFromMessage(latestUserMessage)
  const previousAssistantText = readTextFromMessage(previousAssistantMessage)
  const latestToolIntents: NicNacToolIntent[] =
    mode === 'required_setup'
      ? ['required_setup']
      : getToolIntentsForMessages(messages)
  const tradeBoardWorkflowContext = await getOrCreateTradeBoardIntakeContext({
    supabase,
    workflowSupabase: createAdminClient(),
    repId,
    conversationId,
    messages,
    latestUserMessageId: latestUserMessage?.id,
    mode,
    nowIso: new Date().toISOString(),
  })
  const activeTradeBoardWorkflow = tradeBoardWorkflowContext.sessionAfter
  const activeWorkflowContexts: ActiveNicNacWorkflowContext[] = []
  if (
    tradeBoardWorkflowContext.sessionAfter?.status === 'active' &&
    tradeBoardWorkflowContext.workflowIntents.length
  ) {
    activeWorkflowContexts.push({
      workflowId: tradeBoardWorkflowContext.sessionAfter.id,
      workflowType: 'trade_board_add_listing',
      status: 'active',
      phase: tradeBoardWorkflowContext.sessionAfter.phase,
      workflowIntents: tradeBoardWorkflowContext.workflowIntents,
      toolPolicySource: 'active_workflow',
      promptState: tradeBoardWorkflowContext.workflowPromptState,
    })
  }
  const tradeWorkflowContext = await getOrCreateTradeWorkflowContext({
    supabase: createAdminClient(),
    repId,
    conversationId,
    latestUserText,
    latestToolIntents,
    messages,
    latestUserMessageId: latestUserMessage?.id,
    mode,
    nowIso: new Date().toISOString(),
  })
  if (tradeWorkflowContext.activeWorkflow) {
    activeWorkflowContexts.push(tradeWorkflowContext.activeWorkflow)
  }
  const calendarWorkflowContext = await getOrCreateCalendarWorkflowContext({
    supabase,
    workflowSupabase: supabase,
    repId,
    conversationId,
    messages,
    latestUserMessageId: latestUserMessage?.id,
    mode,
    nowIso: new Date().toISOString(),
  })
  if (calendarWorkflowContext.activeWorkflow) {
    activeWorkflowContexts.push(calendarWorkflowContext.activeWorkflow)
  }
  const routedToolIntents: NicNacToolIntent[] =
    mode === 'required_setup'
      ? latestToolIntents
      : mergeActiveWorkflowToolIntents(latestToolIntents, activeWorkflowContexts)
  const requestedToolIntents: NicNacToolIntent[] =
    mode === 'required_setup'
      ? routedToolIntents
      : addWorkspaceBaselineToolIntents(routedToolIntents)
  const toolPolicy = filterNicNacToolIntentsForContext(
    productContext,
    requestedToolIntents,
  )
  const toolIntents = toolPolicy.allowedIntents
  const toolPolicySource =
    mode === 'required_setup'
      ? 'mode_required_setup'
      : activeWorkflowContexts.length > 0
        ? 'active_workflow'
        : latestToolIntents.includes('resources')
          ? 'fallback_resources'
          : latestToolIntents.includes('memory')
            ? 'fallback_memory'
            : 'latest_turn_intent'
  const requireToolCall =
    shouldRequireToolCallForMessages(messages, routedToolIntents) ||
    activeWorkflowRequiresToolCall(activeWorkflowContexts)
  const tools = buildToolsForIntents(
    {
      repId,
      supabase,
      conversationId,
      runId,
      latestUserText,
      activeTradeBoardWorkflow,
      activeTradeWorkflow: tradeWorkflowContext.sessionAfter,
      activeCalendarWorkflow: calendarWorkflowContext.sessionAfter,
      operatorSupport: supportContext
        ? {
            supportSessionId: supportContext.session.id,
            operatorRepId: supportContext.actor.operatorRepId,
            capabilities: supportContext.session.capabilities,
          }
        : undefined,
    },
    toolIntents,
  )
  const activeToolNames = Object.keys(tools)
  console.info('[nic-nac] tool routing', {
    runId,
    conversationId,
    product: productContext.product,
    surface: productContext.surface,
    requestedIntents: requestedToolIntents,
    intents: toolIntents,
    blockedIntents: toolPolicy.blockedIntents,
    toolCount: activeToolNames.length,
    tools: activeToolNames,
    requireToolCall,
  })

  const modelContext = selectMessagesForModel(messages)
  if (modelContext.wasCompacted) {
    console.info('[nic-nac] model context compacted', {
      runId,
      conversationId,
      originalMessageCount: messages.length,
      modelMessageCount: modelContext.messages.length,
      droppedMessageCount: modelContext.droppedMessageCount,
      estimatedTokens: modelContext.estimatedTokens,
    })
  }

  if (isContinuation && approvals.length > 0) {
    const continuation = await executeApprovedToolContinuations({ messages, tools })
    if (continuation.handled && continuation.updatedParts) {
      const textId = randomUUID()
      const responseText =
        continuation.responseText?.trim() || 'Done — I made that approved change.'
      const finalParts = normalizeNicNacAssistantParts([
        ...continuation.updatedParts,
        { type: 'text', text: responseText },
      ] as UIMessage['parts'])

      await checkpointAssistant(supabase, {
        conversationId,
        messageId: assistantMessageId,
        parts: finalParts,
      })
      await logNicNacRun({
        runId,
        repId,
        conversationId,
        model: modelPolicy.modelId,
        modelPolicy: modelPolicy.key,
        modelProvider: modelPolicy.provider,
        reasoningLevel: modelPolicy.reasoning,
        productContext,
        status: 'complete',
        latencyMs: Date.now() - runStartedAt,
        intents: toolIntents,
        toolNames: continuation.executedToolNames?.length
          ? continuation.executedToolNames
          : activeToolNames,
        modelContext: {
          originalMessageCount: messages.length,
          modelMessageCount: modelContext.messages.length,
          droppedMessageCount: modelContext.droppedMessageCount,
          estimatedTokens: modelContext.estimatedTokens,
          wasCompacted: modelContext.wasCompacted,
        },
        contextAssembly: assembledContext.telemetry,
      })

      const approvedIds = new Set(approvals.map((approval) => approval.approvalId))
      const stream = createUIMessageStream({
        originalMessages: messages,
        generateId: () => assistantMessageId,
        execute: async ({ writer }) => {
          writer.write({ type: 'start', messageId: assistantMessageId })
          for (const part of finalParts) {
            const toolPart = part as {
              state?: string
              output?: unknown
              toolCallId?: string
              approval?: { id?: string }
            }
            if (!toolPart.toolCallId || !approvedIds.has(toolPart.approval?.id ?? '')) {
              continue
            }
            if (toolPart.state === 'output-available') {
              writer.write({
                type: 'tool-output-available',
                toolCallId: toolPart.toolCallId,
                output: toolPart.output,
              })
            } else if (toolPart.state === 'output-denied') {
              writer.write({
                type: 'tool-output-denied',
                toolCallId: toolPart.toolCallId,
              })
            }
          }
          writer.write({ type: 'text-start', id: textId })
          writer.write({ type: 'text-delta', id: textId, delta: responseText })
          writer.write({ type: 'text-end', id: textId })
          writer.write({ type: 'finish', finishReason: 'stop' })
        },
      })

      return createUIMessageStreamResponse({
        stream,
        headers: responseHeaders,
      })
    }
  }

  const modelMessages = await convertToModelMessages(modelContext.messages)
  const systemPrompt = buildNicNacSystemPrompt({
    intents: toolIntents,
    activeToolNames,
    repDisplayName: rep.display_name,
    mode,
    workflowPromptState: renderActiveWorkflowPromptStates(activeWorkflowContexts),
    productContext,
    blockedToolIntents: toolPolicy.blockedIntents,
    memoryContextPrompt: assembledContext.promptText,
  })
  let runUsage: NicNacRunUsage | undefined
  let streamErrorMessage: string | undefined
  let emptyOutputRecovered = false

  // Server-owned ThinkingIndicator phase stream. The route emits transient
  // `data-thinking` signals so the client never has to sniff `parts`. State:
  //   activeToolCalls — depth (handles parallel/nested tool calls)
  //   currentlyVisible — server's belief about whether the rabbit should show
  //   toolEverFired   — distinguishes preamble→hide('plain-text') from
  //                     post-tool→hide('final-text')
  // No global `toolConfirmed` / `hideSent` latches: confirm re-fires on every
  // depth 0→1 transition so tool→text→tool sequences re-show correctly.
  const stream = createUIMessageStream({
    originalMessages: messages,
    generateId: () => assistantMessageId,
    execute: async ({ writer }) => {
      let activeToolCalls = 0
      let currentlyVisible = false
      let toolEverFired = false
      let sawRenderableOutput = false
      let streamAborted = false
      let pendingFinishChunk: Extract<UIMessageChunk, { type: 'finish' }> | null = null

      const emitHide = (reason: 'plain-text' | 'final-text' | 'finish' | 'error') => {
        if (!currentlyVisible) return
        currentlyVisible = false
        writer.write({
          type: 'data-thinking',
          data: { phase: 'hide', messageId: assistantMessageId, reason },
          transient: true,
        })
      }

      // Explicit assistant start chunk so the client has an assistant row to
      // render during TTFT, plus provisional show. The reserved
      // assistantMessageId is wired via createUIMessageStream's generateId.
      writer.write({ type: 'start', messageId: assistantMessageId })
      writer.write({
        type: 'data-thinking',
        data: { phase: 'show', messageId: assistantMessageId },
        transient: true,
      })
      currentlyVisible = true

      const result = streamText({
        model: getNicNacLanguageModel(modelPolicy),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        prepareStep: ({ steps }) => ({
          toolChoice: chooseNicNacToolChoiceForStep({
            requireToolCall,
            stepsLength: steps.length,
            activeToolNames,
            routedToolIntents,
            activeTradeBoardWorkflow,
            activeTradeWorkflow: tradeWorkflowContext.sessionAfter
              ? {
                  status: tradeWorkflowContext.sessionAfter.status,
                  workflowType: tradeWorkflowContext.sessionAfter.workflowType,
                  phase: tradeWorkflowContext.sessionAfter.phase,
                  intent: tradeWorkflowContext.sessionAfter.intent,
                  missingFields: tradeWorkflowContext.sessionAfter.missingFields,
                  blockers: tradeWorkflowContext.sessionAfter.blockers,
                }
              : null,
            activeCalendarWorkflow: calendarWorkflowContext.sessionAfter
              ? {
                  status: calendarWorkflowContext.sessionAfter.status,
                  phase: calendarWorkflowContext.sessionAfter.phase,
                  missing: calendarWorkflowContext.sessionAfter.missingFields,
                }
              : null,
            latestUserText,
            previousAssistantText,
          }),
        }),
        stopWhen: stepCountIs(5),
        providerOptions: getNicNacProviderOptions(modelPolicy),
        abortSignal: request.signal,
        experimental_onToolCallStart: () => {
          activeToolCalls += 1
          toolEverFired = true
          if (activeToolCalls === 1) {
            // 0 → 1 transition. Re-emit confirm every cycle so a hide-then-
            // tool sequence (e.g. preamble flicker, or tool→text→tool) brings
            // the rabbit back.
            writer.write({
              type: 'data-thinking',
              data: { phase: 'confirm', messageId: assistantMessageId },
              transient: true,
            })
            currentlyVisible = true
          }
        },
        experimental_onToolCallFinish: () => {
          activeToolCalls = Math.max(0, activeToolCalls - 1)
        },
        onError: async (err) => {
          streamErrorMessage = extractStreamErrorMessage(err)
          console.error('[nic-nac] streamText error:', err)
          await logIncident({
            errorType: 'streamtext_error',
            repId,
            conversationId,
            severity: 'error',
            details: { runId, message: streamErrorMessage },
          })
        },
        onFinish: (event) => {
          runUsage = normalizeRunUsage(event.totalUsage)
          runUsage.estimatedCostCents = estimateNicNacRunCostCents(
            modelPolicy,
            runUsage,
          )
          console.log('[nic-nac] streamText finish', {
            runId,
            rep: rep.email,
            conversationId,
            totalUsage: event.totalUsage,
          })
        },
      })

      // Inspect chunks before forwarding so we can hide on first visible
      // non-whitespace text. sendStart:false because we already emitted start.
      // try/finally guarantees a terminal hide even if iteration throws.
      try {
        for await (const chunk of result.toUIMessageStream({ sendStart: false })) {
          if (chunk.type === 'finish') {
            pendingFinishChunk = chunk
            continue
          }
          if (chunk.type === 'abort' || chunk.type === 'error') {
            streamAborted = true
          }
          if (isRenderableNicNacStreamChunk(chunk)) {
            sawRenderableOutput = true
          }
          if (
            chunk.type === 'text-delta' &&
            /\S/.test(chunk.delta) &&
            currentlyVisible &&
            activeToolCalls === 0
          ) {
            emitHide(toolEverFired ? 'final-text' : 'plain-text')
          }
          writer.write(chunk)
        }
        if (!streamAborted && !streamErrorMessage && !sawRenderableOutput) {
          emptyOutputRecovered = true
          const fallbackTextId = randomUUID()
          writer.write({ type: 'text-start', id: fallbackTextId })
          writer.write({
            type: 'text-delta',
            id: fallbackTextId,
            delta: NIC_NAC_EMPTY_RESPONSE_FALLBACK,
          })
          writer.write({ type: 'text-end', id: fallbackTextId })
        }
        if (pendingFinishChunk) writer.write(pendingFinishChunk)
      } finally {
        emitHide('finish')
      }
    },
    onFinish: async ({ responseMessage, isAborted, isContinuation: sdkIsContinuation }) => {
      // data-thinking parts are transient and will not appear in
      // responseMessage.parts, so persistence stays clean.
      //
      // Continuation (HITL resume): the prior turn already committed with
      // status='complete'; we're augmenting its parts with the post-approval
      // state. Use checkpointAssistant (parts-only UPDATE) and never flip
      // status to 'aborted' — that would erase the approval-asking turn
      // from canonical history (loadCanonicalHistory drops non-complete
      // assistant rows from the model's view).
      try {
        const normalizedParts = normalizeNicNacAssistantParts(responseMessage.parts)
        const hardFailSummary = summarizeHardFailDetection(
          responseMessage.parts
            .filter((part) => (part as { type?: string }).type === 'text')
            .map((part) => (part as { text?: string }).text ?? ''),
        )
        if (sdkIsContinuation) {
          if (shouldCheckpointContinuation({
            isAborted,
            streamErrorMessage,
            parts: normalizedParts,
          })) {
            await checkpointAssistant(supabase, {
              conversationId,
              messageId: responseMessage.id,
              parts: normalizedParts,
            })
          }
        } else if (isAborted || streamErrorMessage) {
          await abortAssistant(supabase, {
            conversationId,
            messageId: responseMessage.id,
            parts: normalizedParts,
          })
        } else {
          await completeAssistant(supabase, {
            conversationId,
            messageId: responseMessage.id,
            parts: normalizedParts,
          })
        }
        await logNicNacRun({
          runId,
          repId,
          conversationId,
          model: modelPolicy.modelId,
          modelPolicy: modelPolicy.key,
          modelProvider: modelPolicy.provider,
          reasoningLevel: modelPolicy.reasoning,
          productContext,
          status: streamErrorMessage ? 'error' : isAborted ? 'aborted' : 'complete',
          latencyMs: Date.now() - runStartedAt,
          intents: toolIntents,
          toolNames: activeToolNames,
          modelContext: {
            originalMessageCount: messages.length,
            modelMessageCount: modelContext.messages.length,
            droppedMessageCount: modelContext.droppedMessageCount,
            estimatedTokens: modelContext.estimatedTokens,
            wasCompacted: modelContext.wasCompacted,
          },
          contextAssembly: assembledContext.telemetry,
          usage: runUsage,
          errorMessage:
            streamErrorMessage ??
            (emptyOutputRecovered ? 'empty_model_output_recovered' : undefined),
          workflow: activeTradeBoardWorkflow
            ? {
                id: activeTradeBoardWorkflow.id,
                type: activeTradeBoardWorkflow.workflowType,
                phaseBefore:
                  tradeBoardWorkflowContext.sessionBefore?.phase ??
                  activeTradeBoardWorkflow.phase,
                phaseAfter: activeTradeBoardWorkflow.phase,
                statusBefore:
                  tradeBoardWorkflowContext.sessionBefore?.status ??
                  activeTradeBoardWorkflow.status,
                statusAfter: activeTradeBoardWorkflow.status,
                toolPolicySource,
                photoRoles: activeTradeBoardWorkflow.photos.map((photo) => ({
                  declaredRole: photo.declaredRole,
                  visualRole: photo.visualRole,
                  roleConfirmed: photo.roleConfirmed,
                  quality: photo.quality,
                })),
                hardFailPhraseCount: hardFailSummary.count,
                hardFailPhrases: hardFailSummary.phrases,
              }
            : tradeWorkflowContext.sessionAfter
              ? {
                  id: tradeWorkflowContext.sessionAfter.id,
                  type: tradeWorkflowContext.sessionAfter.workflowType,
                  phaseBefore:
                    tradeWorkflowContext.sessionBefore?.phase ??
                    tradeWorkflowContext.sessionAfter.phase,
                  phaseAfter: tradeWorkflowContext.sessionAfter.phase,
                  statusBefore:
                    tradeWorkflowContext.sessionBefore?.status ??
                    tradeWorkflowContext.sessionAfter.status,
                  statusAfter: tradeWorkflowContext.sessionAfter.status,
                  toolPolicySource,
                  photoRoles: [],
                  hardFailPhraseCount: hardFailSummary.count,
                  hardFailPhrases: hardFailSummary.phrases,
                }
              : calendarWorkflowContext.sessionAfter
                ? {
                    id: calendarWorkflowContext.sessionAfter.id,
                    type: calendarWorkflowContext.sessionAfter.workflowType,
                    phaseBefore:
                      calendarWorkflowContext.sessionBefore?.phase ??
                      calendarWorkflowContext.sessionAfter.phase,
                    phaseAfter: calendarWorkflowContext.sessionAfter.phase,
                    statusBefore:
                      calendarWorkflowContext.sessionBefore?.status ??
                      calendarWorkflowContext.sessionAfter.status,
                    statusAfter: calendarWorkflowContext.sessionAfter.status,
                    toolPolicySource,
                    photoRoles: [],
                    hardFailPhraseCount: hardFailSummary.count,
                    hardFailPhrases: hardFailSummary.phrases,
                  }
                : undefined,
        })
      } catch (err) {
        console.error('[nic-nac] persistence onFinish error:', err)
        await logIncident({
          errorType: 'persistence_finish_failed',
          repId,
          conversationId,
          severity: 'error',
          details: { runId, message: (err as Error).message, isAborted },
        })
      }
    },
  })

  return createUIMessageStreamResponse({
    stream,
    headers: responseHeaders,
    consumeSseStream: async ({ stream }) => {
      const reader = stream.getReader()
      try {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      } catch (err) {
        console.error('[nic-nac] consumeSseStream error:', err)
      } finally {
        reader.releaseLock()
      }
    },
  })
}
