import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import {
  publishApprovedPhoto,
  uploadJewelryPhoto,
  uploadStagedOriginalPhoto,
} from '@/lib/services/storage'

function makeStorageBucket() {
  return {
    upload: vi.fn(),
    createSignedUrl: vi.fn(),
    getPublicUrl: vi.fn(),
  }
}

describe('storage service', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    vi.spyOn(global.Math, 'random').mockRestore()
  })

  it('uploads a staged original to the private bucket and returns object metadata for provider use', async () => {
    const stagedBucket = makeStorageBucket()
    stagedBucket.upload.mockResolvedValue({ error: null })
    stagedBucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/original' },
      error: null,
    })

    createAdminClientMock.mockReturnValue({
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === 'jewelry-photo-staging') {
            return stagedBucket
          }
          throw new Error(`Unexpected bucket ${bucket}`)
        }),
      },
    })

    const result = await uploadStagedOriginalPhoto(
      'rep-42',
      'data:image/png;base64,Zm9v',
      'Original ring!!.png',
    )

    expect(stagedBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(
        /^rep-42\/[0-9a-f-]+-Original_ring_+\.png$/,
      ),
      Buffer.from('foo'),
      {
        contentType: 'image/png',
        upsert: false,
      },
    )
    expect(stagedBucket.createSignedUrl).toHaveBeenCalledWith(
      expect.stringMatching(
        /^rep-42\/[0-9a-f-]+-Original_ring_+\.png$/,
      ),
      60 * 60,
    )
    expect(result).toEqual({
      objectPath: expect.stringMatching(
        /^rep-42\/[0-9a-f-]+-Original_ring_+\.png$/,
      ),
      signedUrl: 'https://signed.example.com/original',
    })
  })

  it('publishes an approved photo to the public bucket and returns the public URL', async () => {
    const publicBucket = makeStorageBucket()
    publicBucket.upload.mockResolvedValue({ error: null })
    publicBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/approved.jpg' },
    })

    createAdminClientMock.mockReturnValue({
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === 'jewelry-photos') {
            return publicBucket
          }
          throw new Error(`Unexpected bucket ${bucket}`)
        }),
      },
    })

    const result = await publishApprovedPhoto('design-9', Buffer.from('bar'), {
      filename: 'enhanced shot',
      contentType: 'image/jpeg',
    })

    expect(publicBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(
        /^approved\/design-9\/enhanced_shot\.jpg$/,
      ),
      Buffer.from('bar'),
      {
        contentType: 'image/jpeg',
        upsert: true,
      },
    )
    expect(publicBucket.getPublicUrl).toHaveBeenCalledWith(
      expect.stringMatching(
        /^approved\/design-9\/enhanced_shot\.jpg$/,
      ),
    )
    expect(result).toBe('https://cdn.example.com/approved.jpg')
  })

  it('keeps the legacy jewelry photo upload behavior for public rep folders', async () => {
    const publicBucket = makeStorageBucket()
    publicBucket.upload.mockResolvedValue({ error: null })
    publicBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/rep-photo.jpg' },
    })

    createAdminClientMock.mockReturnValue({
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === 'jewelry-photos') {
            return publicBucket
          }
          throw new Error(`Unexpected bucket ${bucket}`)
        }),
      },
    })

    const result = await uploadJewelryPhoto(
      'rep-7',
      'data:image/jpeg;base64,YmF6',
      'fresh-shot',
    )

    expect(publicBucket.upload).toHaveBeenCalledWith(
      'rep-7/fresh-shot.jpg',
      Buffer.from('baz'),
      {
        contentType: 'image/jpeg',
        upsert: false,
      },
    )
    expect(result).toBe('https://cdn.example.com/rep-photo.jpg')
  })
})
