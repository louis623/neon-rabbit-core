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
import type { TradeWorkflowSessionState } from '@/lib/nic-nac/workflows/trade-workflow-types'

function workflow(
  overrides: Partial<TradeWorkflowSessionState>,
): TradeWorkflowSessionState {
  return {
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
    ...overrides,
  }
}

function assistantToolPart(type: string, output: unknown) {
  return {
    id: `assistant-${type}`,
    role: 'assistant',
    parts: [
      {
        type,
        state: 'output-available',
        output,
      },
    ],
  } as never
}

async function replay(args: {
  active: TradeWorkflowSessionState
  latestUserText: string
  messages?: never[]
  latestToolIntents?: Array<'trade_board' | 'trade_requests' | 'fulfillment' | 'catalog'>
}) {
  getActiveTradeWorkflowSessionMock.mockResolvedValueOnce(args.active)
  updateTradeWorkflowSessionMock.mockImplementation((_client, state) =>
    Promise.resolve(state),
  )

  return getOrCreateTradeWorkflowContext({
    supabase: {} as never,
    repId: 'rep-1',
    conversationId: 'conversation-1',
    latestUserText: args.latestUserText,
    latestToolIntents: args.latestToolIntents ?? ['trade_board'],
    messages: args.messages ?? [],
    latestUserMessageId: 'latest-message',
    mode: 'workspace',
    nowIso: '2026-07-04T12:00:00.000Z',
  })
}

beforeEach(() => {
  getActiveTradeWorkflowSessionMock.mockReset()
  createTradeWorkflowSessionMock.mockReset()
  updateTradeWorkflowSessionMock.mockReset()
})

describe('Nic-Nac Trade workflow replay matrix', () => {
  it('selects the exact board listing from prior list_my_trade_board output before removal', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_board_remove_listing',
        intent: 'remove_listing',
      }),
      latestUserText: 'Take down ER13229 from the board.',
      messages: [
        assistantToolPart('tool-list_my_trade_board', {
          listings: [
            {
              listingId: 'listing-1',
              itemNumber: 'ER13229',
              designName: 'The Florence Earrings',
              status: 'available',
            },
            {
              listingId: 'listing-2',
              itemNumber: 'NK18149',
              designName: 'The Harper Necklace',
              status: 'available',
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'ready_to_remove',
        missingFields: [],
        blockers: [],
        knownFields: expect.objectContaining({
          listingId: 'listing-1',
          itemNumber: 'ER13229',
        }),
      }),
    )
  })

  it('blocks duplicate physical listing removal until the app has one listing id', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_board_remove_listing',
        intent: 'remove_listing',
      }),
      latestUserText: 'Remove ER13229.',
      messages: [
        assistantToolPart('tool-list_my_trade_board', {
          listings: [
            {
              listingId: 'listing-1',
              itemNumber: 'ER13229',
              designName: 'The Florence Earrings',
              status: 'available',
            },
            {
              listingId: 'listing-2',
              itemNumber: 'ER13229',
              designName: 'The Florence Earrings',
              status: 'available',
              ringSize: 'duplicate physical piece',
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'identify_target',
        missingFields: ['listingId'],
        blockers: ['ambiguousListingCandidate'],
        knownFields: expect.objectContaining({ itemNumber: 'ER13229' }),
      }),
    )
  })

  it('turns a terse reject correction into a reject_trade workflow target', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_request_decision',
        intent: 'approve_trade',
      }),
      latestUserText: "Actually reject Jamie's request.",
      latestToolIntents: ['trade_requests'],
      messages: [
        assistantToolPart('tool-get_trade_requests', {
          requests: [
            {
              requestId: 'request-1',
              status: 'pending',
              customerName: 'Jamie',
              customerDescription: 'Offering a July ring',
              listing: {
                listingId: 'listing-1',
                design: {
                  itemNumber: 'ER13229',
                  designName: 'The Florence Earrings',
                },
              },
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        intent: 'reject_trade',
        phase: 'ready_to_reject',
        knownFields: expect.objectContaining({
          requestId: 'request-1',
          itemNumber: 'ER13229',
        }),
      }),
    )
  })

  it('captures a live swap request, revealed item number, and ring size from replay context', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_swap_capture',
        intent: 'approve_trade_swap',
      }),
      latestUserText: 'The item just revealed was RG12345, size 7.',
      latestToolIntents: ['trade_requests'],
      messages: [
        assistantToolPart('tool-get_trade_requests', {
          requests: [
            {
              requestId: 'request-1',
              status: 'pending',
              customerName: 'Jamie',
              listing: {
                listingId: 'listing-1',
                design: {
                  itemNumber: 'NK18149',
                  designName: 'The Harper Necklace',
                },
              },
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'ready_to_approve',
        knownFields: expect.objectContaining({
          requestId: 'request-1',
          itemNumber: 'NK18149',
          revealedItemNumber: 'RG12345',
          revealedRingSize: '7',
        }),
      }),
    )
  })

  it('does not treat the outgoing listing item as the revealed item before capture', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_swap_capture',
        intent: 'approve_trade_swap',
      }),
      latestUserText:
        'Open request request-1 from Jamie for NK18149 before I approve the live swap.',
      latestToolIntents: ['trade_requests'],
      messages: [
        assistantToolPart('tool-get_trade_requests', {
          requests: [
            {
              requestId: 'request-1',
              status: 'pending',
              customerName: 'Jamie',
              listing: {
                listingId: 'listing-1',
                design: {
                  itemNumber: 'NK18149',
                  designName: 'The Harper Necklace',
                },
              },
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'details_capture',
        knownFields: expect.objectContaining({
          requestId: 'request-1',
          itemNumber: 'NK18149',
        }),
        missingFields: ['revealedItemNumber'],
      }),
    )
    expect(updateTradeWorkflowSessionMock.mock.calls.at(-1)?.[1].knownFields)
      .not.toHaveProperty('revealedItemNumber')
  })

  it('uses the explicit just-revealed item when outgoing and revealed items are both present', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_swap_capture',
        intent: 'approve_trade_swap',
        knownFields: {
          requestId: 'request-1',
          itemNumber: 'NK18149',
          revealedItemNumber: 'NK18149',
        },
      }),
      latestUserText:
        'Approve live-show swap request request-1 for NK18149. The item number just revealed for the customer is ER13229.',
      latestToolIntents: ['trade_requests'],
      messages: [
        assistantToolPart('tool-get_trade_requests', {
          requests: [
            {
              requestId: 'request-1',
              status: 'pending',
              customerName: 'Jamie',
              listing: {
                listingId: 'listing-1',
                design: {
                  itemNumber: 'NK18149',
                  designName: 'The Harper Necklace',
                },
              },
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'ready_to_approve',
        knownFields: expect.objectContaining({
          requestId: 'request-1',
          itemNumber: 'NK18149',
          revealedItemNumber: 'ER13229',
        }),
      }),
    )
  })

  it('selects the fulfillment row and shipped status from queue replay', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_fulfillment_update',
        intent: 'update_fulfillment_status',
      }),
      latestUserText: 'Mark Jamie shipped.',
      latestToolIntents: ['fulfillment'],
      messages: [
        assistantToolPart('tool-get_fulfillment_queue', {
          queue: [
            {
              fulfillmentId: 'fulfillment-1',
              requestId: 'request-1',
              status: 'approved',
              customerName: 'Jamie',
              itemNumber: 'ER13229',
              designName: 'The Florence Earrings',
              suggestedNextAction: 'mark_shipped',
            },
            {
              fulfillmentId: 'fulfillment-2',
              requestId: 'request-2',
              status: 'approved',
              customerName: 'Alex',
              itemNumber: 'NK18149',
              designName: 'The Harper Necklace',
              suggestedNextAction: 'mark_shipped',
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'ready_to_update',
        knownFields: expect.objectContaining({
          fulfillmentRequestId: 'fulfillment-1',
          requestId: 'request-1',
          nextFulfillmentStatus: 'shipped',
        }),
      }),
    )
  })

  it('keeps fulfillment update blocked when multiple queue rows remain ambiguous', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_fulfillment_update',
        intent: 'update_fulfillment_status',
      }),
      latestUserText: 'Mark it shipped.',
      latestToolIntents: ['fulfillment'],
      messages: [
        assistantToolPart('tool-get_fulfillment_queue', {
          queue: [
            {
              fulfillmentId: 'fulfillment-1',
              requestId: 'request-1',
              status: 'approved',
              customerName: 'Jamie',
              itemNumber: 'ER13229',
            },
            {
              fulfillmentId: 'fulfillment-2',
              requestId: 'request-2',
              status: 'approved',
              customerName: 'Alex',
              itemNumber: 'NK18149',
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'identify_target',
        missingFields: ['requestId'],
        blockers: ['ambiguousFulfillmentCandidate'],
      }),
    )
  })

  it('selects catalog correction target from prior search results', async () => {
    await replay({
      active: workflow({
        workflowType: 'trade_catalog_correction',
        intent: 'report_catalog_issue',
      }),
      latestUserText: 'ER13229 has the wrong photo.',
      latestToolIntents: ['catalog'],
      messages: [
        assistantToolPart('tool-search_jewelry_database', {
          results: [
            {
              designId: 'design-1',
              itemNumber: 'ER13229',
              designName: 'The Florence Earrings',
              collectionName: 'July Birthday 2026',
              type: 'ER',
            },
          ],
        }),
      ],
    })

    expect(updateTradeWorkflowSessionMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        phase: 'ready_to_report',
        knownFields: expect.objectContaining({
          itemNumber: 'ER13229',
          catalogIssueType: 'bad_photo',
        }),
      }),
    )
  })
})
