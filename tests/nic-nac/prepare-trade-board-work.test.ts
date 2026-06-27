import { beforeEach, describe, expect, it, vi } from 'vitest'

const searchJewelryDatabaseMock = vi.fn()
const getMyBoardMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/services/jewelry-database', () => ({
  normalizeJewelryMaterialKey: (value: string | null | undefined) =>
    value?.trim().replace(/\s+/g, ' ').toLowerCase() || null,
  searchJewelryDatabase: (...args: unknown[]) => searchJewelryDatabaseMock(...args),
}))

vi.mock('@/lib/services/trade-board', () => ({
  getMyBoard: (...args: unknown[]) => getMyBoardMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

import { makePrepareTradeBoardWorkTool } from '@/lib/nic-nac/tools/prepare-trade-board-work'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeTool(): ToolDef {
  return makePrepareTradeBoardWorkTool({
    repId: 'rep-1',
    supabase: { marker: 'rep-client' } as never,
  }) as unknown as ToolDef
}

beforeEach(() => {
  searchJewelryDatabaseMock.mockReset()
  getMyBoardMock.mockReset()
  createAdminClientMock.mockReset()
  createAdminClientMock.mockReturnValue({ marker: 'admin-client' })
})

describe('prepare_trade_board_work', () => {
  it('routes a known catalog add to the database-backed fast path with no new photo required', async () => {
    searchJewelryDatabaseMock.mockResolvedValueOnce([
      {
        designId: 'design-er13229',
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        typePrefix: 'ER',
        collectionName: 'July Birthday 2026',
        collectionYear: 2026,
        canonicalPhotoUrl: 'https://cdn.example.com/er13229.png',
        isOnMyBoard: false,
        activeListingsCount: 3,
      },
    ])

    const result = await makeTool().execute({
      action: 'add_piece',
      itemNumber: 'ER13229',
    })

    expect(searchJewelryDatabaseMock).toHaveBeenCalledWith(
      { marker: 'admin-client' },
      'rep-1',
      { query: 'ER13229', limit: 5 },
    )
    expect(result).toMatchObject({
      action: 'add_piece',
      catalogStatus: 'found',
      allowedPath: 'add_existing_catalog_design',
      design: {
        designId: 'design-er13229',
        itemNumber: 'ER13229',
        designName: 'The Florence Earrings',
        canonicalPhotoUrl: 'https://cdn.example.com/er13229.png',
      },
      requiredBeforeAction: [],
      nextTool: 'add_listing',
    })
    expect(result.guidance).toContain('Do not ask for a new jewelry photo')
  })

  it('asks only for ring size when an existing catalog ring is missing rep-specific size', async () => {
    searchJewelryDatabaseMock.mockResolvedValueOnce([
      {
        designId: 'design-rg100',
        itemNumber: 'RG100',
        designName: 'Aurora Ring',
        typePrefix: 'RG',
        collectionName: 'Lustre',
        collectionYear: 2026,
        canonicalPhotoUrl: 'https://cdn.example.com/rg100.png',
        isOnMyBoard: false,
        activeListingsCount: 1,
      },
    ])

    const result = await makeTool().execute({
      action: 'add_piece',
      itemNumber: 'RG100',
    })

    expect(result).toMatchObject({
      catalogStatus: 'found',
      allowedPath: 'add_existing_catalog_design',
      requiredBeforeAction: ['ringSize'],
      nextQuestion: 'What ring size is this physical piece?',
    })
  })

  it('asks for plating when an item number resolves to multiple catalog variants', async () => {
    searchJewelryDatabaseMock.mockResolvedValueOnce([
      {
        designId: 'design-rhodium',
        itemNumber: 'NK12032',
        designName: 'Reveal Necklace',
        material: 'Rhodium Plating',
        mainStone: 'Lab-Created Ruby',
        typePrefix: 'NK',
        collectionName: 'July Birthday 2026',
        collectionYear: 2026,
        canonicalPhotoUrl: 'https://cdn.example.com/nk12032-rhodium.png',
        isOnMyBoard: true,
        activeListingsCount: 1,
      },
      {
        designId: 'design-hematite',
        itemNumber: 'NK12032',
        designName: 'Reveal Necklace',
        material: 'Hematite Plating',
        mainStone: 'Lab-Created Ruby',
        typePrefix: 'NK',
        collectionName: 'July Birthday 2026',
        collectionYear: 2026,
        canonicalPhotoUrl: 'https://cdn.example.com/nk12032-hematite.png',
        isOnMyBoard: false,
        activeListingsCount: 0,
      },
    ])

    const result = await makeTool().execute({
      action: 'add_piece',
      itemNumber: 'NK12032',
    })

    expect(result).toMatchObject({
      catalogStatus: 'variant_ambiguous',
      allowedPath: 'ask_for_variant_material',
      nextQuestion: 'Which plating or material is this one?',
      candidates: [
        {
          designId: 'design-rhodium',
          itemNumber: 'NK12032',
          material: 'Rhodium Plating',
          isOnMyBoard: true,
        },
        {
          designId: 'design-hematite',
          itemNumber: 'NK12032',
          material: 'Hematite Plating',
          isOnMyBoard: false,
        },
      ],
    })
  })

  it('treats a new plating for a known item number as a new catalog variant', async () => {
    searchJewelryDatabaseMock.mockResolvedValueOnce([
      {
        designId: 'design-rhodium',
        itemNumber: 'NK12032',
        designName: 'Reveal Necklace',
        material: 'Rhodium Plating',
        mainStone: 'Lab-Created Ruby',
        typePrefix: 'NK',
        collectionName: 'July Birthday 2026',
        collectionYear: 2026,
        canonicalPhotoUrl: 'https://cdn.example.com/nk12032-rhodium.png',
        isOnMyBoard: true,
        activeListingsCount: 1,
      },
    ])

    const result = await makeTool().execute({
      action: 'add_piece',
      itemNumber: 'NK12032',
      material: 'Hematite Plating',
    })

    expect(searchJewelryDatabaseMock).toHaveBeenCalledWith(
      { marker: 'admin-client' },
      'rep-1',
      { query: 'NK12032', limit: 5 },
    )
    expect(result).toMatchObject({
      catalogStatus: 'variant_not_found',
      allowedPath: 'create_catalog_variant_then_add_listing',
      existingVariants: [
        {
          designId: 'design-rhodium',
          itemNumber: 'NK12032',
          material: 'Rhodium Plating',
        },
      ],
      requiredBeforeAction: [
        'itemNumber',
        'designName',
        'collectionName',
        'jewelryFrontPhoto',
      ],
      nextTool: 'add_listing',
    })
    expect(result.guidance).toContain('different plating is a new catalog variant')
    expect(result.guidance).not.toContain('catalog correction')
  })

  it('routes unknown catalog adds into new-design intake with photo and details requirements', async () => {
    searchJewelryDatabaseMock.mockResolvedValueOnce([])

    const result = await makeTool().execute({
      action: 'add_piece',
      query: 'blue necklace from the label photo',
    })

    expect(result).toMatchObject({
      action: 'add_piece',
      catalogStatus: 'not_found',
      allowedPath: 'create_catalog_design_then_add_listing',
      requiredBeforeAction: ['itemNumber', 'designName', 'collectionName', 'jewelryFrontPhoto'],
      nextTool: 'add_listing',
    })
    expect(result.guidance).toContain('label/details photos are facts only')
  })

  it('keeps remove work board-scoped and says catalog deletion is not available', async () => {
    getMyBoardMock.mockResolvedValueOnce({
      listings: [
        {
          id: 'listing-1',
          status: 'available',
          ring_size: null,
          trade_preferences: null,
          rep_notes: null,
          listed_at: '2026-06-22T00:00:00.000Z',
          design: {
            item_number: 'ER13229',
            design_name: 'The Florence Earrings',
            type_prefix: 'ER',
            material: null,
            main_stone: null,
            bp_msrp: 160,
            collection: { name: 'July Birthday 2026' },
          },
        },
      ],
      summary: {
        totalMsrp: 160,
        typeBreakdown: { ER: 1, RG: 0, NK: 0, ST: 0, BR: 0 },
        pendingRequestCount: 0,
      },
    })

    const result = await makeTool().execute({
      action: 'remove_piece',
      itemNumber: 'ER13229',
    })

    expect(getMyBoardMock).toHaveBeenCalledWith(
      { marker: 'rep-client' },
      'rep-1',
      { statusFilter: 'available', limit: 50 },
    )
    expect(result).toMatchObject({
      action: 'remove_piece',
      allowedPath: 'remove_rep_trade_board_listing',
      nextTool: 'remove_listing',
      requiresApproval: true,
      catalogDeletionAllowed: false,
    })
    expect(result.guidance).toContain('Do not remove or delete the shared jewelry database record')
  })
})
