import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyzeServerImageQualityMock = vi.fn()
const uploadJewelryPhotoMock = vi.fn()

vi.mock('@/lib/services/server-image-quality', () => ({
  analyzeServerImageQuality: (...args: unknown[]) =>
    analyzeServerImageQualityMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadJewelryPhoto: (...args: unknown[]) => uploadJewelryPhotoMock(...args),
}))

vi.mock('@/lib/photoroom/config', () => ({
  getPhotoroomConfig: () => null,
}))

import { processRepListingPhotoUrl } from '@/lib/services/listing-photo-processing'
import { prepareDesignSourcePhoto } from '@/lib/services/design-source-photo-processing'

function makeImageResponse(bytes = new Uint8Array([1, 2, 3])) {
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: { 'content-type': 'image/jpeg' },
  })
}

const labelCardAnalysis = {
  contentType: 'image/jpeg',
  width: 768,
  height: 1024,
  blurRisk: 0.059,
  lightingRisk: 0.235,
  detailRisk: 0,
  backgroundDistractionRisk: 0.801,
  subjectCoverage: 0.042,
  subjectCentered: false,
  detailConfidence: 1,
  backgroundUniformity: 0.231,
  backgroundCleanliness: 0.178,
}

describe('listing/design photo semantic integration', () => {
  beforeEach(() => {
    analyzeServerImageQualityMock.mockReset()
    uploadJewelryPhotoMock.mockReset()
  })

  it('rejects a listing photo that looks like packaging/card instead of jewelry', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(labelCardAnalysis)

    await expect(
      processRepListingPhotoUrl(
        {
          repId: 'rep-1',
          sourceImageUrl: 'https://images.example.com/card-back.jpg',
          filenameStem: 'card-back',
        },
        { fetch: vi.fn().mockResolvedValueOnce(makeImageResponse()) },
      ),
    ).rejects.toMatchObject({
      code: 'LISTING_PHOTO_NOT_JEWELRY',
      userMessage: expect.stringContaining('actual jewelry photo'),
    })
    expect(uploadJewelryPhotoMock).not.toHaveBeenCalled()
  })

  it('rejects a new design source photo that looks like packaging/card instead of jewelry', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(labelCardAnalysis)

    await expect(
      prepareDesignSourcePhoto({
        repId: 'rep-1',
        filenameStem: 'card-back',
        sourceImageDataUrl: 'data:image/jpeg;base64,AQID',
      }),
    ).rejects.toMatchObject({
      code: 'PIECE_PHOTO_NOT_JEWELRY',
      userMessage: expect.stringContaining('actual jewelry photo'),
    })
    expect(uploadJewelryPhotoMock).not.toHaveBeenCalled()
  })
})
