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
} from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

// Pin baseURL explicitly to avoid an inherited ANTHROPIC_BASE_URL env var
// (sometimes set without /v1) from steering the SDK to the wrong endpoint.
const anthropic = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' })
import { getAuthenticatedNicNacContext, AuthError } from '@/lib/nic-nac/auth'
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
  buildToolsForIntents,
  getToolIntentsForMessages,
} from '@/lib/nic-nac/tools'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'
import { probeConversationOwner } from '@/lib/nic-nac/probe-conversation-owner'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { decideAssistantMessageId } from '@/lib/nic-nac/hitl-state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface PostBody {
  conversationId: string
  messages: UIMessage[]
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

export async function POST(request: Request) {
  const runId = randomUUID()
  const responseHeaders = { 'x-nic-nac-run-id': runId }

  let ctx
  try {
    ctx = await getAuthenticatedNicNacContext()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: 'unauthenticated' },
        { status: 401, headers: responseHeaders }
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
      loadCanonicalHistory(supabase, conversationId),
    ])
  } catch (err) {
    await logIncident({
      errorType: 'pre_stream_setup_failed',
      repId,
      conversationId,
      severity: 'error',
      details: { runId, message: (err as Error).message },
    })
    throw err
  }
  if (existingOwner && existingOwner !== repId) {
    return NextResponse.json(
      { error: 'forbidden' },
      { status: 403, headers: responseHeaders }
    )
  }

  // Approval replay protection. UNIQUE(approval_id) is the durable backstop.
  const approvals = extractApprovalResponses(messages)
  for (const a of approvals) {
    const { replayed } = await recordApprovalEvent(supabase, {
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
    await insertUserMessage(supabase, {
      conversationId,
      repId,
      messageId: m.id,
      parts: m.parts,
    })
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
    await reserveAssistantMessage(supabase, {
      conversationId,
      repId,
      messageId: assistantMessageId,
    })
  }

  const toolIntents = getToolIntentsForMessages(messages)
  const tools = buildToolsForIntents(
    { repId, supabase, conversationId, runId },
    toolIntents,
  )
  const activeToolNames = Object.keys(tools)
  console.info('[nic-nac] tool routing', {
    runId,
    conversationId,
    intents: toolIntents,
    toolCount: activeToolNames.length,
    tools: activeToolNames,
  })

  const modelMessages = await convertToModelMessages(messages)
  const systemPrompt = `${NIC_NAC_SYSTEM_PROMPT}

# Active tools for this turn

Only these tools are available on this turn: ${activeToolNames.join(', ')}.
If a tool described above is not in this list, do not call it on this turn. Answer naturally or ask the rep a short follow-up.`

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
        model: anthropic('claude-haiku-4-5-20251001'),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(5),
        providerOptions: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
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
          console.error('[nic-nac] streamText error:', err)
          await logIncident({
            errorType: 'streamtext_error',
            repId,
            conversationId,
            severity: 'error',
            details: { runId, message: (err as { error?: Error })?.error?.message ?? String(err) },
          })
        },
        onFinish: (event) => {
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
        if (sdkIsContinuation) {
          await checkpointAssistant(supabase, {
            conversationId,
            messageId: responseMessage.id,
            parts: responseMessage.parts,
          })
        } else if (isAborted) {
          await abortAssistant(supabase, {
            conversationId,
            messageId: responseMessage.id,
            parts: responseMessage.parts,
          })
        } else {
          await completeAssistant(supabase, {
            conversationId,
            messageId: responseMessage.id,
            parts: responseMessage.parts,
          })
        }
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
        // eslint-disable-next-line no-constant-condition
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
