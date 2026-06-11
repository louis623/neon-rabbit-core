import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const approveTradeWithRevealedItemCaptureMock = vi.fn()
const getTradeSwapCleanupQueueMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/trade-swaps', () => ({
  approveTradeWithRevealedItemCapture: (...args: unknown[]) =>
    approveTradeWithRevealedItemCaptureMock(...args),
  getTradeSwapCleanupQueue: (...args: unknown[]) =>
    getTradeSwapCleanupQueueMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ admin: true }),
}))

vi.mock('@/lib/nic-nac/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
}))

import { makeApproveTradeSwapTool } from '@/lib/nic-nac/tools/approve-trade-swap'
import { makeGetTradeSwapCleanupTool } from '@/lib/nic-nac/tools/get-trade-swap-cleanup'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
  needsApproval?: boolean
  description?: string
}

function makeApproveTool(): ToolDef {
  return makeApproveTradeSwapTool({
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as ToolDef
}

function makeCleanupTool(): ToolDef {
  return makeGetTradeSwapCleanupTool({
    repId: 'rep-1',
    supabase: {} as never,
  }) as unknown as ToolDef
}

beforeEach(() => {
  approveTradeWithRevealedItemCaptureMock.mockReset()
  getTradeSwapCleanupQueueMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('approve_trade_swap', () => {
  it('captures the revealed item number while approving the trade', async () => {
    approveTradeWithRevealedItemCaptureMock.mockResolvedValueOnce({
      requestId: 'req-1',
      fulfillmentId: 'ful-1',
      outgoingListingId: 'outgoing-listing-1',
      customerName: 'Jamie',
      revealedItemNumber: 'NK12345',
      revealedDesignId: 'design-1',
      replacementListingId: 'replacement-listing-1',
      replacementStatus: 'added_to_board',
    })

    const tool = makeApproveTool()
    const result = await tool.execute({
      requestId: '11111111-1111-1111-1111-111111111111',
      revealedItemNumber: ' nk12345 ',
      repNotes: 'approved live',
    })

    expect(approveTradeWithRevealedItemCaptureMock).toHaveBeenCalledWith(
      { admin: true },
      'rep-1',
      {
        requestId: '11111111-1111-1111-1111-111111111111',
        revealedItemNumber: ' nk12345 ',
        revealedRingSize: undefined,
        repNotes: 'approved live',
      },
    )
    expect(writeTradeActionAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'trade_swap_approved',
        repId: 'rep-1',
        targetListingId: 'outgoing-listing-1',
        details: expect.objectContaining({
          runId: 'run-1',
          conversationId: 'conv-1',
          replacementStatus: 'added_to_board',
        }),
      }),
    )
    expect(result).toMatchObject({
      requestId: 'req-1',
      fulfillmentId: 'ful-1',
      outgoingListingId: 'outgoing-listing-1',
      revealedItemNumber: 'NK12345',
      replacementStatus: 'added_to_board',
    })
  })

  it('includes the exact live-show prompt wording in the tool description', () => {
    const tool = makeApproveTool()

    expect(tool.description).toContain(
      'Which item number was just revealed for the customer?',
    )
    expect(tool.needsApproval).toBe(true)
  })

  it('translates ServiceError into NicNacToolError without auditing', async () => {
    approveTradeWithRevealedItemCaptureMock.mockRejectedValueOnce(
      errors.REQUEST_NOT_PENDING(),
    )

    const tool = makeApproveTool()

    await expect(
      tool.execute({
        requestId: '11111111-1111-1111-1111-111111111111',
        revealedItemNumber: 'NK12345',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'REQUEST_NOT_PENDING',
    })
    expect(writeTradeActionAuditMock).not.toHaveBeenCalled()
  })
})

describe('get_trade_swap_cleanup', () => {
  it('returns unresolved swap cleanup items for the rep', async () => {
    getTradeSwapCleanupQueueMock.mockResolvedValueOnce([
      {
        swapId: 'swap-1',
        requestId: 'req-1',
        customerName: 'Jamie',
        outgoingListingId: 'listing-1',
        revealedItemNumber: 'ER00001',
        revealedRingSize: null,
        replacementStatus: 'needs_catalog_details',
        createdAt: '2026-06-11T20:00:00.000Z',
      },
    ])

    const tool = makeCleanupTool()
    const result = await tool.execute({})

    expect(getTradeSwapCleanupQueueMock).toHaveBeenCalledWith(
      {},
      'rep-1',
    )
    expect(result).toEqual({
      count: 1,
      items: [
        expect.objectContaining({
          swapId: 'swap-1',
          customerName: 'Jamie',
          revealedItemNumber: 'ER00001',
          replacementStatus: 'needs_catalog_details',
        }),
      ],
    })
  })

  it('translates ServiceError into NicNacToolError', async () => {
    getTradeSwapCleanupQueueMock.mockRejectedValueOnce(
      errors.UNAUTHORIZED('foreign repId'),
    )

    const tool = makeCleanupTool()

    await expect(tool.execute({})).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'UNAUTHORIZED',
    })
  })
})
