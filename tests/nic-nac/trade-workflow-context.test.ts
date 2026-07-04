import { beforeEach, describe, expect, it, vi } from 'vitest'

const getActiveTradeWorkflowSessionMock = vi.fn()
const createTradeWorkflowSessionMock = vi.fn()
const updateTradeWorkflowSessionMock = vi.fn()

vi.mock('@/lib/nic-nac/workflows/trade-workflow-store', () => ({
  getActiveTradeWorkflowSession: (...args: unknown[]) =>
    getActiveTradeWorkflowSessionMock(...args),
  createTradeWorkflowSession: (...args: unknown[]) =>
    createTradeWorkflowSessionMock(...args),
  updateTradeWorkflowSession: (...args: unknown[]) =>
    updateTradeWorkflowSessionMock(...args),
  isMissingTradeWorkflowSchemaError: () => false,
}))

import { getOrCreateTradeWorkflowContext } from '@/lib/nic-nac/workflows/trade-workflow-context'

beforeEach(() => {
  getActiveTradeWorkflowSessionMock.mockReset()
  createTradeWorkflowSessionMock.mockReset()
  updateTradeWorkflowSessionMock.mockReset()
})

describe('generic Trade workflow context', () => {
  it('starts a durable remove-listing workflow and retains Trade Board tools', async () => {
    getActiveTradeWorkflowSessionMock.mockResolvedValueOnce(null)
    createTradeWorkflowSessionMock.mockResolvedValueOnce({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conversation-1',
      workflowType: 'trade_board_remove_listing',
      status: 'active',
      phase: 'started',
      intent: 'remove_listing',
      knownFields: {},
      missingFields: [],
      blockers: [],
      candidates: [],
      approvalState: 'not_required',
    })
    updateTradeWorkflowSessionMock.mockImplementation((_client, state) =>
      Promise.resolve(state),
    )

    const result = await getOrCreateTradeWorkflowContext({
      supabase: {} as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      latestUserText: 'remove ER13229 from my trade board',
      latestToolIntents: ['trade_board'],
      latestUserMessageId: 'message-1',
      mode: 'workspace',
      nowIso: '2026-07-04T12:00:00.000Z',
    })

    expect(createTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        workflowType: 'trade_board_remove_listing',
        intent: 'remove_listing',
      }),
    )
    expect(result.activeWorkflow).toMatchObject({
      workflowType: 'trade_board_remove_listing',
      workflowIntents: ['trade_board'],
      toolPolicySource: 'active_workflow',
    })
    expect(result.activeWorkflow?.promptState).toContain(
      'Active Nic-Nac Trade workflow',
    )
  })

  it('resumes an existing trade swap workflow even when the latest turn is terse', async () => {
    getActiveTradeWorkflowSessionMock.mockResolvedValueOnce({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conversation-1',
      workflowType: 'trade_swap_capture',
      status: 'active',
      phase: 'details_capture',
      intent: 'approve_trade_swap',
      knownFields: { requestId: 'request-1' },
      missingFields: ['revealedItemNumber'],
      blockers: [],
      candidates: [],
      approvalState: 'required',
    })

    const result = await getOrCreateTradeWorkflowContext({
      supabase: {} as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      latestUserText: 'yes',
      latestToolIntents: ['memory'],
      mode: 'workspace',
      nowIso: '2026-07-04T12:00:00.000Z',
    })

    expect(createTradeWorkflowSessionMock).not.toHaveBeenCalled()
    expect(result.activeWorkflow).toMatchObject({
      workflowType: 'trade_swap_capture',
      workflowIntents: ['trade_requests', 'trade_board', 'catalog'],
    })
  })

  it('does not start a catalog correction workflow for a read-only lookup', async () => {
    getActiveTradeWorkflowSessionMock.mockResolvedValueOnce(null)

    const result = await getOrCreateTradeWorkflowContext({
      supabase: {} as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      latestUserText: 'look up ER13229 in the jewelry database',
      latestToolIntents: ['catalog'],
      mode: 'workspace',
      nowIso: '2026-07-04T12:00:00.000Z',
    })

    expect(createTradeWorkflowSessionMock).not.toHaveBeenCalled()
    expect(result.activeWorkflow).toBeNull()
  })

  it('does not start a trade request decision workflow for read-only listing', async () => {
    getActiveTradeWorkflowSessionMock.mockResolvedValueOnce(null)

    const result = await getOrCreateTradeWorkflowContext({
      supabase: {} as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      latestUserText: 'show me pending trade requests',
      latestToolIntents: ['trade_requests'],
      mode: 'workspace',
      nowIso: '2026-07-04T12:00:00.000Z',
    })

    expect(createTradeWorkflowSessionMock).not.toHaveBeenCalled()
    expect(result.activeWorkflow).toBeNull()
  })

  it('captures a single swap cleanup candidate from get_trade_swap_cleanup output', async () => {
    getActiveTradeWorkflowSessionMock.mockResolvedValueOnce({
      id: 'workflow-1',
      repId: 'rep-1',
      conversationId: 'conversation-1',
      workflowType: 'trade_swap_cleanup',
      status: 'active',
      phase: 'details_capture',
      intent: 'resolve_swap_cleanup',
      knownFields: {},
      missingFields: ['swapId', 'revealedItemNumber'],
      blockers: [],
      candidates: [],
      approvalState: 'not_required',
    })
    updateTradeWorkflowSessionMock.mockImplementation((_client, state) =>
      Promise.resolve(state),
    )

    const result = await getOrCreateTradeWorkflowContext({
      supabase: {} as never,
      repId: 'rep-1',
      conversationId: 'conversation-1',
      latestUserText: 'add that one back to my board',
      latestToolIntents: ['trade_board'],
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          parts: [
            {
              type: 'tool-get_trade_swap_cleanup',
              state: 'output-available',
              output: {
                items: [
                  {
                    swapId: 'swap-1',
                    requestId: 'request-1',
                    customerName: 'Jamie',
                    outgoingListingId: 'outgoing-listing-1',
                    revealedItemNumber: 'er00001',
                    revealedRingSize: null,
                    replacementStatus: 'needs_catalog_details',
                  },
                ],
              },
            },
          ],
        } as never,
      ],
      mode: 'workspace',
      nowIso: '2026-07-04T12:00:00.000Z',
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        workflowType: 'trade_swap_cleanup',
        phase: 'ready_to_update',
        missingFields: [],
        knownFields: expect.objectContaining({
          swapId: 'swap-1',
          requestId: 'request-1',
          itemNumber: 'ER00001',
          revealedItemNumber: 'ER00001',
        }),
        candidates: [
          expect.objectContaining({
            id: 'swap-1',
            kind: 'swap',
            itemNumber: 'ER00001',
          }),
        ],
      }),
    )
    expect(result.activeWorkflow).toMatchObject({
      workflowType: 'trade_swap_cleanup',
      workflowIntents: ['trade_requests', 'trade_board', 'catalog'],
    })
  })
})
