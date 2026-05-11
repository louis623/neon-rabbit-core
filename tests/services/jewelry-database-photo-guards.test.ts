import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDesign,
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

  return {
    from: vi.fn((table: string) => {
      if (table === 'jewelry_designs') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single }),
          }),
        }
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
