import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDesign,
  resolveJewelryTypeFromItemNumber,
  updateCanonicalPhoto,
} from '@/lib/services/jewelry-database'

function makeCreateDesignSupabase() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: 'design-1',
      item_number: 'RG100',
      type_prefix: 'RG',
    },
    error: null,
  })

  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single }),
  })

  return {
    insertMock: insert,
    from: vi.fn((table: string) => {
      if (table === 'jewelry_designs') {
        return { insert }
      }

      throw new Error(`unexpected table ${table}`)
    }),
  }
}

function makeUpdateCanonicalSupabase() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: 'design-1',
      canonical_photo_url:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    },
    error: null,
  })
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })

  return {
    from: vi.fn((table: string) => {
      if (table !== 'jewelry_designs') {
        throw new Error(`unexpected table ${table}`)
      }

      return { update }
    }),
  }
}

function makeLegacyDesignSupabase() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: 'design-rbp5902',
      item_number: 'RBP5902',
      type_prefix: 'NK',
    },
    error: null,
  })
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single }),
  })

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'jewelry_designs') return { insert }
        throw new Error(`unexpected table ${table}`)
      }),
    },
    insert,
  }
}

describe('jewelry-database photo pipeline guards', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('blocks createDesign when staged photo pipeline metadata is missing', async () => {
    const supabase = makeCreateDesignSupabase()

    await expect(
      createDesign(supabase as never, {
        itemNumber: 'RG100',
        designName: 'Celeste Ring',
        piecePhotoUrl: 'https://cdn.example.com/raw-ring.png',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage:
        'I need to run that piece photo through the image pipeline before I can create the design.',
    })
  })

  it('allows createDesign when staged source metadata is present', async () => {
    const supabase = makeCreateDesignSupabase()

    await expect(
      createDesign(supabase as never, {
        itemNumber: 'RG100',
        designName: 'Celeste Ring',
        piecePhotoUrl:
          'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/RG100-source.png',
        photoPipeline: {
          originalPath: 'rep-1/original.png',
          originalUrl: 'https://example.supabase.co/storage/v1/object/sign/jewelry-photo-staging/rep-1/original.png',
          status: 'ready',
          preflightScore: 0.94,
          preflightIssues: [],
        },
      }),
    ).resolves.toMatchObject({
      designId: 'design-1',
      itemNumber: 'RG100',
      typePrefix: 'RG',
    })
  })

  it('inserts the preallocated internal variant id without changing the vendor item number', async () => {
    const supabase = makeCreateDesignSupabase()

    await createDesign(supabase as never, {
      designId: 'design-ruby',
      itemNumber: 'ER59000',
      designName: 'Baguette Braid Sparkle',
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Ruby',
      piecePhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/designs/design-ruby/ER59000-source.jpg',
      photoPipeline: {
        originalPath:
          'rep-1/designs/design-ruby/uuid-ER59000-original.jpg',
        originalUrl:
          'https://example.supabase.co/storage/v1/object/sign/jewelry-photo-staging/rep-1/designs/design-ruby/uuid-ER59000-original.jpg',
        status: 'ready',
      },
    })

    expect(supabase.insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'design-ruby',
        item_number: 'ER59000',
        material: 'Rhodium Plating',
        main_stone: 'Lab-Created Ruby',
      }),
    )
  })

  it('maps legacy RBP item numbers to the necklace catalog type without changing the item number', async () => {
    expect(resolveJewelryTypeFromItemNumber('RBP5902')).toBe('NK')
    expect(resolveJewelryTypeFromItemNumber(' rbp5902 ')).toBe('NK')
    expect(resolveJewelryTypeFromItemNumber('RB5902')).toBeNull()

    const { supabase, insert } = makeLegacyDesignSupabase()
    await expect(
      createDesign(supabase as never, {
        itemNumber: 'RBP5902',
        designName: 'One More Chapter',
        piecePhotoUrl:
          'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/RBP5902-source.png',
        photoPipeline: {
          originalPath: 'rep-1/RBP5902-original.png',
          originalUrl:
            'https://example.supabase.co/storage/v1/object/sign/jewelry-photo-staging/rep-1/RBP5902-original.png',
          status: 'ready',
          preflightScore: 0.94,
          preflightIssues: [],
        },
      }),
    ).resolves.toMatchObject({
      designId: 'design-rbp5902',
      itemNumber: 'RBP5902',
      typePrefix: 'NK',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        item_number: 'RBP5902',
        type_prefix: 'NK',
      }),
    )
  })

  it('blocks canonical promotion when the photo URL is not an approved pipeline asset', async () => {
    const supabase = makeUpdateCanonicalSupabase()

    await expect(
      updateCanonicalPhoto(
        supabase as never,
        'design-1',
        'https://cdn.example.com/design-1/enhanced.png',
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage:
        'I can only promote an approved photo-pipeline image as the canonical design photo.',
    })
  })

  it('allows canonical promotion for approved pipeline assets', async () => {
    const supabase = makeUpdateCanonicalSupabase()

    await expect(
      updateCanonicalPhoto(
        supabase as never,
        'design-1',
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
      ),
    ).resolves.toMatchObject({
      designId: 'design-1',
    })
  })
})
