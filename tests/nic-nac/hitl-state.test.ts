// Unit tests for the HITL state helpers shared between the route and client,
// plus the loadConversationForClient persistence normalization.
//
// These cover the three layers that fix the stale-approval / stuck-input bug:
//   1. decideAssistantMessageId — controls whether a POST to /api/nic-nac
//      generates a fresh assistant id or reuses the prior one (HITL resume).
//   2. approvalRequestedInLastStep / findActionableApproval — gate the
//      client's hasPendingApproval and HITLBlock rendering so historical
//      approval-requested parts cannot resurrect dead cards.
//   3. loadConversationForClient — downgrades stuck approval-requested parts
//      to terminal states (output-available / output-denied) on hydrate so
//      pre-existing conversations from before the route fix get unblocked.

import { describe, it, expect, vi } from 'vitest'
import type { UIMessage } from 'ai'
import {
  decideAssistantMessageId,
  approvalRequestedInLastStep,
  findActionableApproval,
} from '@/lib/nic-nac/hitl-state'
import { loadConversationForClient } from '@/lib/nic-nac/persistence'

// -- decideAssistantMessageId --------------------------------------------

describe('decideAssistantMessageId', () => {
  const fakeId = 'fresh-uuid-0000'
  const gen = () => fakeId

  it('returns a fresh id with isContinuation=false when last message is a user turn', () => {
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'hi' }] } as UIMessage,
    ]
    expect(decideAssistantMessageId(messages, gen)).toEqual({
      messageId: fakeId,
      isContinuation: false,
    })
  })

  it('reuses the assistant id with isContinuation=true when last message is an assistant turn (HITL resume)', () => {
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'remove RG31452' }] } as UIMessage,
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          {
            type: 'tool-remove_listing',
            state: 'approval-responded',
            toolName: 'remove_listing',
            input: { itemNumber: 'RG31452', reason: 'sold' },
            approval: { id: 'app-1', approved: true },
          },
        ],
      } as unknown as UIMessage,
    ]
    expect(decideAssistantMessageId(messages, gen)).toEqual({
      messageId: 'a1',
      isContinuation: true,
    })
  })

  it('returns a fresh id with isContinuation=false on an empty messages array', () => {
    expect(decideAssistantMessageId([], gen)).toEqual({
      messageId: fakeId,
      isContinuation: false,
    })
  })
})

// -- approvalRequestedInLastStep -----------------------------------------

describe('approvalRequestedInLastStep', () => {
  it('returns approval metadata when an approval-requested part lives in the last step', () => {
    const m: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-1' },
          approval: { id: 'app-1' },
        },
      ],
    } as unknown as UIMessage
    expect(approvalRequestedInLastStep(m)).toEqual({
      approvalId: 'app-1',
      toolName: 'approve_trade',
      input: { requestId: 'req-1' },
    })
  })

  it('returns null when an approval-requested part carries the __historicalApproval marker (resolved in a prior turn)', () => {
    // approval_events recorded the click, but the tool's execute() may or may
    // not have actually run. We must NOT claim success — just suppress the
    // dead live card. Same suppression for approved=true and approved=false.
    const m: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-1' },
          approval: { id: 'app-1' },
          __historicalApproval: { approved: true },
        },
      ],
    } as unknown as UIMessage
    expect(approvalRequestedInLastStep(m)).toBeNull()

    const denied: UIMessage = {
      id: 'a2',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-remove_listing',
          state: 'approval-requested',
          toolName: 'remove_listing',
          input: { itemNumber: 'NK66139' },
          approval: { id: 'app-2' },
          __historicalApproval: { approved: false },
        },
      ],
    } as unknown as UIMessage
    expect(approvalRequestedInLastStep(denied)).toBeNull()
  })

  it('returns null when approval-requested lives BEFORE the last step-start (resolved on a later step)', () => {
    const m: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-1' },
          approval: { id: 'app-1' },
        },
        // A later step started — the approval-requested above is now historical.
        { type: 'step-start' },
        { type: 'text', text: 'Done. Trade approved.' },
      ],
    } as unknown as UIMessage
    expect(approvalRequestedInLastStep(m)).toBeNull()
  })

  it('returns null on a user message', () => {
    const m: UIMessage = {
      id: 'u1',
      role: 'user',
      parts: [{ type: 'text', text: 'hi' }],
    } as UIMessage
    expect(approvalRequestedInLastStep(m)).toBeNull()
  })

  it('falls back to deriving toolName from the part type when toolName is missing', () => {
    const m: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-remove_listing',
          state: 'approval-requested',
          input: { itemNumber: 'NK66139' },
          approval: { id: 'app-2' },
        },
      ],
    } as unknown as UIMessage
    expect(approvalRequestedInLastStep(m)?.toolName).toBe('remove_listing')
  })

  it('returns null when there is no step-start and no approval-requested part', () => {
    const m: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'plain answer' }],
    } as UIMessage
    expect(approvalRequestedInLastStep(m)).toBeNull()
  })
})

// -- findActionableApproval ----------------------------------------------

describe('findActionableApproval', () => {
  function approvalAssistant(id: string, approvalId: string): UIMessage {
    return {
      id,
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-x' },
          approval: { id: approvalId },
        },
      ],
    } as unknown as UIMessage
  }

  it('finds the approval on the LAST assistant message', () => {
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'do it' }] } as UIMessage,
      approvalAssistant('a1', 'app-1'),
    ]
    const found = findActionableApproval(messages)
    expect(found?.messageId).toBe('a1')
    expect(found?.approval.approvalId).toBe('app-1')
  })

  it('does NOT resurrect approval-requested on an EARLIER assistant message when a later assistant message exists', () => {
    // This is the exact stuck-card scenario the bug produced before the
    // continuation fix landed: an old assistant row stuck at
    // approval-requested with a fresh assistant reply created beneath it.
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'do it' }] } as UIMessage,
      approvalAssistant('a1', 'app-stuck'),
      {
        id: 'a2',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          { type: 'text', text: 'Approved.' },
        ],
      } as unknown as UIMessage,
    ]
    expect(findActionableApproval(messages)).toBeNull()
  })

  it('returns null when the conversation has no assistant messages yet', () => {
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'hi' }] } as UIMessage,
    ]
    expect(findActionableApproval(messages)).toBeNull()
  })

  it('returns null when the last assistant message is hydrate-marked historical (recorded approval, unproven execution)', () => {
    // Conservative UX: stuck conversation reload — input must unlock without
    // claiming the tool succeeded. The gate sees the historical marker and
    // suppresses the live card.
    const messages: UIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'remove it' }] } as UIMessage,
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          {
            type: 'tool-remove_listing',
            state: 'approval-requested',
            toolName: 'remove_listing',
            input: { itemNumber: 'NK66139' },
            approval: { id: 'app-stuck' },
            __historicalApproval: { approved: true },
          },
        ],
      } as unknown as UIMessage,
    ]
    expect(findActionableApproval(messages)).toBeNull()
  })
})

// -- loadConversationForClient normalization -----------------------------

describe('loadConversationForClient', () => {
  // Fake supabase that returns a fixed nic_nac_conversations row set and a
  // fixed approval_events row set. Mirrors loadCanonicalHistory's expected
  // shape (.from().select().eq().order().order()) and approval_events
  // (.from().select().eq().in()).
  function makeFakeSupabase({
    convRows,
    approvalRows,
  }: {
    convRows: Array<{
      message_id: string
      role: 'user' | 'assistant'
      parts: unknown
      status: 'pending' | 'complete' | 'aborted'
      created_at: string
    }>
    approvalRows: Array<{ approval_id: string; approved: boolean }>
  }) {
    const conversationsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: undefined,
    }
    // loadCanonicalHistory awaits the chain after the second .order() — emulate
    // by making the builder thenable at that point.
    const conversationsThenable = {
      ...conversationsBuilder,
      then(resolve: (value: { data: typeof convRows; error: null }) => void) {
        resolve({ data: convRows, error: null })
      },
    }
    conversationsBuilder.order = vi.fn().mockReturnValue(conversationsThenable)
    conversationsBuilder.eq = vi.fn().mockReturnValue(conversationsBuilder)
    conversationsBuilder.select = vi.fn().mockReturnValue(conversationsBuilder)

    const approvalsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnValue(
        Promise.resolve({ data: approvalRows, error: null })
      ),
    }

    const from = vi.fn((table: string) => {
      if (table === 'nic_nac_conversations') return conversationsBuilder
      if (table === 'approval_events') return approvalsBuilder
      throw new Error(`unexpected table: ${table}`)
    })

    return { from } as unknown as Parameters<typeof loadConversationForClient>[0]
  }

  function approvalAssistantRow(approvalId: string) {
    return {
      message_id: 'a1',
      role: 'assistant' as const,
      parts: [
        { type: 'step-start' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-1' },
          approval: { id: approvalId },
        },
      ],
      status: 'complete' as const,
      created_at: '2026-04-30T10:00:00Z',
    }
  }

  it('attaches __historicalApproval marker without mutating state when approval_events records approved=true', async () => {
    // Critical: approval_events is recorded BEFORE streamText starts, so an
    // approved row only proves the click — NOT that the tool's execute()
    // actually ran. Hydrate must NOT upgrade the part to output-available
    // (would claim a fake success) or fabricate output payloads (would
    // pollute model history when round-tripped through useChat).
    const supabase = makeFakeSupabase({
      convRows: [approvalAssistantRow('app-1')],
      approvalRows: [{ approval_id: 'app-1', approved: true }],
    })

    const result = await loadConversationForClient(supabase, 'conv-1')

    expect(result).toHaveLength(1)
    const part = (result[0].parts as Array<Record<string, unknown>>)[1]
    // State is preserved — the truthful persisted state.
    expect(part.state).toBe('approval-requested')
    // No fabricated output payload.
    expect(part.output).toBeUndefined()
    // The approval object stays in its pre-click shape (no synthesized
    // approved=true field that the SDK would interpret as a response).
    expect(part.approval).toEqual({ id: 'app-1' })
    // Non-SDK marker is attached for the client gate to read.
    expect(part.__historicalApproval).toEqual({ approved: true })
  })

  it('attaches __historicalApproval marker for denied rows too — same contract, no fabricated output-denied state', async () => {
    const supabase = makeFakeSupabase({
      convRows: [approvalAssistantRow('app-2')],
      approvalRows: [{ approval_id: 'app-2', approved: false }],
    })

    const result = await loadConversationForClient(supabase, 'conv-1')
    const part = (result[0].parts as Array<Record<string, unknown>>)[1]
    expect(part.state).toBe('approval-requested')
    expect(part.approval).toEqual({ id: 'app-2' })
    expect(part.__historicalApproval).toEqual({ approved: false })
  })

  it('leaves approval-requested entirely unannotated when no matching approval_event exists (still actionable)', async () => {
    const supabase = makeFakeSupabase({
      convRows: [approvalAssistantRow('app-3')],
      approvalRows: [], // user has not clicked anything yet
    })

    const result = await loadConversationForClient(supabase, 'conv-1')
    const part = (result[0].parts as Array<Record<string, unknown>>)[1]
    expect(part.state).toBe('approval-requested')
    expect(part.__historicalApproval).toBeUndefined()
  })

  it('preserves non-approval parts verbatim while marking the approval part only', async () => {
    const mixedRow = {
      message_id: 'a1',
      role: 'assistant' as const,
      parts: [
        { type: 'step-start' },
        { type: 'text', text: 'Sure — confirming first.' },
        {
          type: 'tool-approve_trade',
          state: 'approval-requested',
          toolName: 'approve_trade',
          input: { requestId: 'req-1' },
          approval: { id: 'app-4' },
        },
      ],
      status: 'complete' as const,
      created_at: '2026-04-30T10:00:00Z',
    }
    const supabase = makeFakeSupabase({
      convRows: [mixedRow],
      approvalRows: [{ approval_id: 'app-4', approved: true }],
    })

    const result = await loadConversationForClient(supabase, 'conv-1')
    const parts = result[0].parts as Array<Record<string, unknown>>
    expect(parts[0]).toEqual({ type: 'step-start' })
    expect(parts[1]).toEqual({ type: 'text', text: 'Sure — confirming first.' })
    expect(parts[2].state).toBe('approval-requested')
    expect(parts[2].__historicalApproval).toEqual({ approved: true })
  })

  it('hydrate output never carries a fabricated tool-result body that could pollute future model history', async () => {
    // Direct assertion against the regression: re-posting the hydrated
    // history through useChat → /api/nic-nac → convertToModelMessages
    // must not contain any invented tool output for the stuck approval.
    const supabase = makeFakeSupabase({
      convRows: [approvalAssistantRow('app-5')],
      approvalRows: [{ approval_id: 'app-5', approved: true }],
    })
    const result = await loadConversationForClient(supabase, 'conv-1')
    for (const m of result) {
      for (const part of (m.parts ?? []) as Array<Record<string, unknown>>) {
        // The regression created `output: { resolved: true, note: ... }`
        // on stuck approve_trade / remove_listing parts. None of those
        // shapes are real tool outputs — assert they cannot appear.
        expect(part.output).toBeUndefined()
        if (typeof part.state === 'string') {
          expect(part.state).not.toBe('output-available')
          expect(part.state).not.toBe('output-denied')
        }
      }
    }
  })

  it('skips the approval_events query entirely when no approval-requested parts are present', async () => {
    const plainRow = {
      message_id: 'a1',
      role: 'assistant' as const,
      parts: [{ type: 'text', text: 'plain reply' }],
      status: 'complete' as const,
      created_at: '2026-04-30T10:00:00Z',
    }
    const supabase = makeFakeSupabase({
      convRows: [plainRow],
      approvalRows: [],
    })

    const result = await loadConversationForClient(supabase, 'conv-1')

    expect(result).toHaveLength(1)
    // approval_events table should never have been queried — the fake from()
    // tracks calls and we only expect the conversations table.
    const fromCalls = (supabase as unknown as { from: { mock: { calls: string[][] } } }).from.mock.calls
    expect(fromCalls.flat()).not.toContain('approval_events')
  })
})
