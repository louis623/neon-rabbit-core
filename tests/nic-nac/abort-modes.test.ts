// Mocked unit tests for the persistence flow when a stream aborts.
// These do NOT run a real network or a real Supabase — they exercise the
// abort/complete branching against mocked persistence helpers and assert:
//   (a) partial reply persists with status='aborted'
//   (b) no orphaned approval_events for the aborted run
//   (c) recorded parts replay cleanly

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UIMessage } from 'ai'
import { shouldCheckpointContinuation } from '@/lib/nic-nac/hitl-state'

// Module under test mocks: we don't import the route directly because Next
// route handlers expect a Request object and full request lifecycle. Instead
// we exercise the persistence helpers directly through fake implementations
// and assert the semantic contract holds.

interface ConvRow {
  conversation_id: string
  message_id: string
  rep_id: string
  role: 'user' | 'assistant'
  parts: unknown
  status: 'pending' | 'complete' | 'aborted'
}

interface ApprovalRow {
  conversation_id: string
  approval_id: string
  approved: boolean
}

function makeFakeStore() {
  const conv: ConvRow[] = []
  const approvals: ApprovalRow[] = []
  return {
    conv,
    approvals,
    reserveAssistant: vi.fn((args: { conversationId: string; repId: string; messageId: string }) => {
      conv.push({
        conversation_id: args.conversationId,
        message_id: args.messageId,
        rep_id: args.repId,
        role: 'assistant',
        parts: [],
        status: 'pending',
      })
    }),
    completeAssistant: vi.fn((args: { conversationId: string; messageId: string; parts: unknown }) => {
      const row = conv.find(
        (r) => r.conversation_id === args.conversationId && r.message_id === args.messageId
      )
      if (row) {
        row.parts = args.parts
        row.status = 'complete'
      }
    }),
    abortAssistant: vi.fn((args: { conversationId: string; messageId: string; parts?: unknown }) => {
      const row = conv.find(
        (r) => r.conversation_id === args.conversationId && r.message_id === args.messageId
      )
      if (row) {
        if (args.parts !== undefined) row.parts = args.parts
        row.status = 'aborted'
      }
    }),
    // Continuation persistence: parts-only UPDATE, no status change. Mirrors
    // checkpointAssistant's contract — used by route.ts onFinish when an
    // existing assistant row is being augmented (HITL resume).
    checkpointAssistant: vi.fn((args: { conversationId: string; messageId: string; parts: unknown }) => {
      const row = conv.find(
        (r) => r.conversation_id === args.conversationId && r.message_id === args.messageId
      )
      if (row) row.parts = args.parts
    }),
    recordApproval: vi.fn((args: { conversationId: string; approvalId: string; approved: boolean }) => {
      approvals.push({
        conversation_id: args.conversationId,
        approval_id: args.approvalId,
        approved: args.approved,
      })
    }),
  }
}

// onFinish branching: this is the contract pulled from app/api/nic-nac/route.ts.
// Continuation (HITL resume, last incoming message was assistant) takes priority
// regardless of isAborted — the prior turn already committed; we only ever
// augment its parts. New turns: aborted → abortAssistant, else completeAssistant.
async function onFinish(
  store: ReturnType<typeof makeFakeStore>,
  args: {
    conversationId: string
    messageId: string
    parts: unknown
    isAborted: boolean
    isContinuation?: boolean
    streamErrorMessage?: string
  }
) {
  if (args.isContinuation) {
    if (
      shouldCheckpointContinuation({
        isAborted: args.isAborted,
        streamErrorMessage: args.streamErrorMessage,
        parts: args.parts as UIMessage['parts'],
      })
    ) {
      store.checkpointAssistant({
        conversationId: args.conversationId,
        messageId: args.messageId,
        parts: args.parts,
      })
    }
    return
  }
  if (args.isAborted) {
    store.abortAssistant({
      conversationId: args.conversationId,
      messageId: args.messageId,
      parts: args.parts,
    })
  } else {
    store.completeAssistant({
      conversationId: args.conversationId,
      messageId: args.messageId,
      parts: args.parts,
    })
  }
}

describe('abort-modes', () => {
  let store: ReturnType<typeof makeFakeStore>

  beforeEach(() => {
    store = makeFakeStore()
  })

  it('tab-close: partial parts persist with status=aborted, no approvals recorded', async () => {
    const conversationId = 'conv-1'
    const messageId = 'msg-1'
    const repId = 'rep-1'
    store.reserveAssistant({ conversationId, repId, messageId })

    // Stream produced two text parts before being aborted (tab close = abort signal).
    const partialParts = [
      { type: 'text', text: 'Pulling up your boa' },
    ]
    await onFinish(store, { conversationId, messageId, parts: partialParts, isAborted: true })

    const row = store.conv.find((r) => r.message_id === messageId)
    expect(row).toBeDefined()
    expect(row?.status).toBe('aborted')
    expect(row?.parts).toEqual(partialParts)
    expect(store.approvals.filter((a) => a.conversation_id === conversationId)).toHaveLength(0)
  })

  it('network-drop: aborted with empty parts is still persisted as aborted (not pending)', async () => {
    const conversationId = 'conv-2'
    const messageId = 'msg-2'
    store.reserveAssistant({ conversationId, repId: 'rep-1', messageId })

    // Network died before any parts streamed back.
    await onFinish(store, { conversationId, messageId, parts: [], isAborted: true })

    const row = store.conv.find((r) => r.message_id === messageId)
    expect(row?.status).toBe('aborted')
    expect(row?.parts).toEqual([])
  })

  it('server-kill mid HITL: approval_events row exists, assistant message is aborted, replay is consistent', async () => {
    const conversationId = 'conv-3'
    const userMessageId = 'msg-3-user'
    const assistantMessageId = 'msg-3-assistant'

    // User sent message + approval response together — approval recorded
    // BEFORE streamText started.
    store.recordApproval({
      conversationId,
      approvalId: 'approval-abc',
      approved: true,
    })
    store.reserveAssistant({
      conversationId,
      repId: 'rep-1',
      messageId: assistantMessageId,
    })

    // Stream killed mid-flight. onFinish fires with isAborted=true.
    const partialParts = [{ type: 'text', text: 'Removing the' }]
    await onFinish(store, {
      conversationId,
      messageId: assistantMessageId,
      parts: partialParts,
      isAborted: true,
    })

    // Replay: load history filtered by status — aborted assistant rows are
    // dropped from the canonical view fed back to the model. So a replay
    // should see only the user-side approval, no orphaned half-assistant.
    const canonical = store.conv.filter((r) => r.role === 'user' || r.status === 'complete')
    expect(canonical).toHaveLength(0)
    // But the durable record is preserved for the GET /conversation/[id]
    // viewer route (which surfaces aborted rows for transparency).
    const fullView = store.conv
    expect(fullView.find((r) => r.message_id === assistantMessageId)?.status).toBe('aborted')

    // Approval is durable — only one row, not duplicated.
    expect(store.approvals.filter((a) => a.approval_id === 'approval-abc')).toHaveLength(1)
  })

  it('clean finish: status=complete, parts persisted as final', async () => {
    const conversationId = 'conv-4'
    const messageId = 'msg-4'
    store.reserveAssistant({ conversationId, repId: 'rep-1', messageId })

    const finalParts = [{ type: 'text', text: 'Done. The Sapphire Cuff is off your board.' }]
    await onFinish(store, { conversationId, messageId, parts: finalParts, isAborted: false })

    const row = store.conv.find((r) => r.message_id === messageId)
    expect(row?.status).toBe('complete')
    expect(row?.parts).toEqual(finalParts)
  })

  // Continuation contract: when the route detects the incoming POST is a
  // HITL resume (last incoming message was an assistant turn), it must reuse
  // the existing assistant row's id, skip reserveAssistantMessage, and on
  // onFinish call checkpointAssistant — NOT completeAssistant or
  // abortAssistant. This keeps the original row's status='complete' intact
  // while the post-approval parts (e.g. output-available) are merged in.
  // Without this, a parallel assistant row was being created on every resume
  // and the original stayed stuck at approval-requested in the DB, which
  // resurrected dead approval cards on reload.
  it('HITL continuation: reuses existing assistant row, updates parts via checkpoint, status stays complete', async () => {
    const conversationId = 'conv-5'
    const messageId = 'msg-5-assistant'

    // Prior turn already committed: seed the row directly so the
    // completeAssistant mock counter stays clean for this test's assertions.
    // In production, reserveAssistant + completeAssistant ran in the prior POST.
    const priorParts = [
      { type: 'step-start' },
      {
        type: 'tool-approve_trade',
        state: 'approval-requested',
        toolName: 'approve_trade',
        input: { requestId: 'req-1' },
        approval: { id: 'approval-resume' },
      },
    ]
    store.conv.push({
      conversation_id: conversationId,
      message_id: messageId,
      rep_id: 'rep-1',
      role: 'assistant',
      parts: priorParts,
      status: 'complete',
    })

    // Resume POST: route detects continuation, reuses messageId, skips
    // reserveAssistant. Stream produces the post-approval merged parts:
    // approval-requested → output-available + final text appended.
    const mergedParts = [
      { type: 'step-start' },
      {
        type: 'tool-approve_trade',
        state: 'output-available',
        toolName: 'approve_trade',
        input: { requestId: 'req-1' },
        output: { fulfillmentId: 'ful-1' },
        approval: { id: 'approval-resume', approved: true },
      },
      { type: 'text', text: 'Approved — fulfillment row created.' },
    ]
    await onFinish(store, {
      conversationId,
      messageId,
      parts: mergedParts,
      isAborted: false,
      isContinuation: true,
    })

    // Existing row was updated, NOT replaced or duplicated.
    const rows = store.conv.filter((r) => r.message_id === messageId)
    expect(rows).toHaveLength(1)
    expect(rows[0].parts).toEqual(mergedParts)
    expect(rows[0].status).toBe('complete')

    // Continuation must NOT reserve a new assistant row.
    expect(store.reserveAssistant).not.toHaveBeenCalled()
    expect(store.checkpointAssistant).toHaveBeenCalledTimes(1)
    expect(store.completeAssistant).not.toHaveBeenCalled()
    expect(store.abortAssistant).not.toHaveBeenCalled()
  })

  it('HITL continuation aborted mid-resume: status stays complete and output-less approval response is not checkpointed', async () => {
    // If the resume stream dies before a tool result exists, keep the prior
    // complete row intact. Persisting a half-state approval-responded part
    // would poison the next model turn with a tool call that has no result.
    const conversationId = 'conv-6'
    const messageId = 'msg-6-assistant'
    const priorParts = [
      { type: 'step-start' },
      {
        type: 'tool-remove_listing',
        state: 'approval-requested',
        toolName: 'remove_listing',
        approval: { id: 'approval-x' },
      },
    ]
    store.conv.push({
      conversation_id: conversationId,
      message_id: messageId,
      rep_id: 'rep-1',
      role: 'assistant',
      parts: priorParts,
      status: 'complete',
    })

    const partial = [
      { type: 'step-start' },
      {
        type: 'tool-approve_trade',
        state: 'approval-responded',
        toolName: 'approve_trade',
        approval: { id: 'approval-x', approved: true },
      },
    ]
    await onFinish(store, {
      conversationId,
      messageId,
      parts: partial,
      isAborted: true,
      isContinuation: true,
    })

    const row = store.conv.find((r) => r.message_id === messageId)
    expect(row?.status).toBe('complete')
    expect(row?.parts).toEqual(priorParts)
    expect(store.checkpointAssistant).not.toHaveBeenCalled()
    expect(store.abortAssistant).not.toHaveBeenCalled()
  })

  it('HITL continuation aborted after tool output: status stays complete and terminal output can checkpoint', async () => {
    const conversationId = 'conv-7'
    const messageId = 'msg-7-assistant'
    store.conv.push({
      conversation_id: conversationId,
      message_id: messageId,
      rep_id: 'rep-1',
      role: 'assistant',
      parts: [],
      status: 'complete',
    })

    const terminalParts = [
      { type: 'step-start' },
      {
        type: 'tool-remove_listing',
        state: 'output-available',
        toolName: 'remove_listing',
        approval: { id: 'approval-y', approved: true },
        output: { status: 'removed' },
      },
    ]
    await onFinish(store, {
      conversationId,
      messageId,
      parts: terminalParts,
      isAborted: true,
      isContinuation: true,
    })

    const row = store.conv.find((r) => r.message_id === messageId)
    expect(row?.status).toBe('complete')
    expect(row?.parts).toEqual(terminalParts)
    expect(store.checkpointAssistant).toHaveBeenCalledTimes(1)
    expect(store.abortAssistant).not.toHaveBeenCalled()
  })
})
