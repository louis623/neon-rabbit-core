import { beforeEach, describe, expect, it, vi } from 'vitest'

const addListingMock = vi.fn()
const addListingBatchMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()

vi.mock('@/lib/services/trade-board', () => ({
  addListing: (...args: unknown[]) => addListingMock(...args),
  addListingBatch: (...args: unknown[]) => addListingBatchMock(...args),
}))

vi.mock('@/lib/services/jewelry-database', () => ({
  createDesign: vi.fn(),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadJewelryPhoto: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({}),
}))

vi.mock('@/lib/nic-nac/audit', () => ({
  writeTradeActionAudit: (...args: unknown[]) =>
    writeTradeActionAuditMock(...args),
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: (...args: unknown[]) => logIncidentMock(...args),
}))

import { makeAddListingTool } from '@/lib/nic-nac/tools/add-listing'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeTool(): ToolDef {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: {
                        parts: [{ type: 'text', text: 'Add ER76003 to my board' }],
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  }

  return makeAddListingTool({
    repId: 'rep-1',
    supabase: supabase as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as ToolDef
}

beforeEach(() => {
  addListingMock.mockReset()
  addListingBatchMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
})

describe('add_listing — batch mode', () => {
  it('calls addListingBatch and returns ready/need-collection/need-full-info buckets', async () => {
    addListingBatchMock.mockResolvedValueOnce({
      added: [
        {
          listingId: 'listing-1',
          designId: 'design-1',
          itemNumber: 'RG31452',
          designName: 'Celeste Ring',
          status: 'available',
          usesCanonicalPhoto: true,
        },
      ],
      pending: {
        needCollection: [
          {
            itemNumber: 'NK66139',
            designId: 'design-2',
            designName: 'Orbit Necklace',
          },
        ],
        needFullInfo: [{ itemNumber: 'ER99999' }],
      },
    })

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'batch',
      clickwrapAccepted: true,
      items: [
        { itemNumber: 'RG31452' },
        { itemNumber: 'NK66139' },
        { itemNumber: 'ER99999' },
      ],
    })

    expect(addListingBatchMock).toHaveBeenCalledTimes(1)
    expect(addListingBatchMock.mock.calls[0][1]).toBe('rep-1')
    expect(addListingBatchMock.mock.calls[0][2]).toEqual({
      items: [
        {
          itemNumber: 'RG31452',
          listingPhotoUrl: undefined,
          repNotes: undefined,
          tradePreferences: undefined,
        },
        {
          itemNumber: 'NK66139',
          listingPhotoUrl: undefined,
          repNotes: undefined,
          tradePreferences: undefined,
        },
        {
          itemNumber: 'ER99999',
          listingPhotoUrl: undefined,
          repNotes: undefined,
          tradePreferences: undefined,
        },
      ],
    })

    expect(result).toMatchObject({
      mode: 'batch',
      added: [
        {
          listingId: 'listing-1',
          itemNumber: 'RG31452',
          designName: 'Celeste Ring',
          status: 'available',
        },
      ],
      pending: {
        needCollection: [
          {
            itemNumber: 'NK66139',
            designId: 'design-2',
            designName: 'Orbit Necklace',
          },
        ],
        needFullInfo: [
          {
            itemNumber: 'ER99999',
          },
        ],
      },
      summary: {
        addedCount: 1,
        needCollectionCount: 1,
        needFullInfoCount: 1,
      },
    })
  })

  it('forwards ring size to the trade listing service for ring entries', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'RG31452',
      designName: 'Celeste Ring',
      status: 'available',
      usesCanonicalPhoto: true,
    })

    const tool = makeTool()
    await tool.execute({
      mode: 'single',
      itemNumber: 'RG31452',
      collectionName: 'Lustre',
      ringSize: '8',
    })

    expect(addListingMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      expect.objectContaining({
        itemNumber: 'RG31452',
        collectionName: 'Lustre',
        ringSize: '8',
      }),
    )
  })

  it('writes one audit row per successfully added listing in batch mode', async () => {
    addListingBatchMock.mockResolvedValueOnce({
      added: [
        {
          listingId: 'listing-1',
          designId: 'design-1',
          itemNumber: 'RG31452',
          designName: 'Celeste Ring',
          status: 'available',
          usesCanonicalPhoto: true,
        },
        {
          listingId: 'listing-2',
          designId: 'design-2',
          itemNumber: 'NK66139',
          designName: 'Orbit Necklace',
          status: 'available',
          usesCanonicalPhoto: false,
        },
      ],
      pending: {
        needCollection: [],
        needFullInfo: [],
      },
    })

    const tool = makeTool()
    await tool.execute({
      mode: 'batch',
      clickwrapAccepted: true,
      items: [{ itemNumber: 'RG31452' }, { itemNumber: 'NK66139' }],
    })

    expect(writeTradeActionAuditMock).toHaveBeenCalledTimes(2)
    expect(writeTradeActionAuditMock.mock.calls[0][0]).toMatchObject({
      actionType: 'add_listing',
      repId: 'rep-1',
      targetListingId: 'listing-1',
    })
    expect(writeTradeActionAuditMock.mock.calls[1][0]).toMatchObject({
      actionType: 'add_listing',
      repId: 'rep-1',
      targetListingId: 'listing-2',
    })
  })

  it('collapses repeated same-item batches when the latest rep message has no quantity', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'ER76003',
      designName: 'The Elodie Luxe',
      status: 'available',
      usesCanonicalPhoto: true,
    })

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'batch',
      items: [{ itemNumber: 'ER76003' }, { itemNumber: 'ER76003' }],
    })

    expect(addListingMock).toHaveBeenCalledTimes(1)
    expect(addListingBatchMock).not.toHaveBeenCalled()
    expect(addListingMock.mock.calls[0][2]).toMatchObject({
      itemNumber: 'ER76003',
    })
    expect(result).toMatchObject({
      mode: 'single',
      listingId: 'listing-1',
      itemNumber: 'ER76003',
    })
  })
})
