import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyzeServerImageQualityMock = vi.fn()
const uploadJewelryPhotoMock = vi.fn()
const uploadStagedOriginalPhotoMock = vi.fn()
const createGuardedJewelryPhotoCropMock = vi.fn()

vi.mock('@/lib/services/server-image-quality', () => ({
  analyzeServerImageQuality: (...args: unknown[]) =>
    analyzeServerImageQualityMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadJewelryPhoto: (...args: unknown[]) => uploadJewelryPhotoMock(...args),
  uploadStagedOriginalPhoto: (...args: unknown[]) =>
    uploadStagedOriginalPhotoMock(...args),
}))

vi.mock('@/lib/services/jewelry-photo-crop', () => ({
  createGuardedJewelryPhotoCrop: (...args: unknown[]) =>
    createGuardedJewelryPhotoCropMock(...args),
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

const smallJewelryAnalysis = {
  contentType: 'image/jpeg',
  width: 1800,
  height: 1800,
  blurRisk: 0.05,
  lightingRisk: 0.05,
  detailRisk: 0.1,
  backgroundDistractionRisk: 0.08,
  subjectCoverage: 0.12,
  subjectCentered: true,
  detailConfidence: 0.9,
  backgroundUniformity: 0.96,
  backgroundCleanliness: 0.95,
}

const croppedJewelryAnalysis = {
  ...smallJewelryAnalysis,
  width: 1200,
  height: 1200,
  subjectCoverage: 0.34,
}

describe('listing/design photo semantic integration', () => {
  beforeEach(() => {
    analyzeServerImageQualityMock.mockReset()
    uploadJewelryPhotoMock.mockReset()
    uploadStagedOriginalPhotoMock.mockReset()
    createGuardedJewelryPhotoCropMock.mockReset()
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

  it('uses a guarded crop for clear small listing jewelry instead of rejecting the original framing', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(smallJewelryAnalysis)
    createGuardedJewelryPhotoCropMock.mockResolvedValueOnce({
      bytes: new Uint8Array([4, 5, 6]),
      selectedSource: 'cropped',
      analysis: croppedJewelryAnalysis,
      preflight: {
        passed: true,
        score: 90,
        issues: [],
        coachingMessages: ['crop passed'],
      },
      semantic: {
        role: 'jewelry',
        confidence: 0.82,
        reasons: ['cropped jewelry subject is clearer'],
        canAttemptCrop: false,
      },
    })
    uploadJewelryPhotoMock
      .mockResolvedValueOnce('https://cdn.example.com/original.jpg')
      .mockResolvedValueOnce('https://cdn.example.com/cropped.jpg')

    const result = await processRepListingPhotoUrl(
      {
        repId: 'rep-1',
        sourceImageUrl: 'https://images.example.com/small-jewelry.jpg',
        filenameStem: 'small-jewelry',
      },
      { fetch: vi.fn().mockResolvedValueOnce(makeImageResponse()) },
    )

    expect(createGuardedJewelryPhotoCropMock).toHaveBeenCalled()
    expect(uploadJewelryPhotoMock).toHaveBeenCalledTimes(2)
    expect(uploadJewelryPhotoMock).toHaveBeenNthCalledWith(
      2,
      'rep-1',
      expect.stringMatching(/^data:image\/jpeg;base64,/),
      'small-jewelry-cropped',
    )
    expect(result).toMatchObject({
      photoUrl: 'https://cdn.example.com/cropped.jpg',
      originalPhotoUrl: 'https://cdn.example.com/original.jpg',
      selectedSource: 'cropped',
      image: {
        subjectCoverage: 0.34,
      },
    })
  })

  it('uses a guarded crop for clear small new design photos while staging the untouched original', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(smallJewelryAnalysis)
    createGuardedJewelryPhotoCropMock.mockResolvedValueOnce({
      bytes: new Uint8Array([4, 5, 6]),
      selectedSource: 'cropped',
      analysis: croppedJewelryAnalysis,
      preflight: {
        passed: true,
        score: 90,
        issues: [],
        coachingMessages: ['crop passed'],
      },
      semantic: {
        role: 'jewelry',
        confidence: 0.82,
        reasons: ['cropped jewelry subject is clearer'],
        canAttemptCrop: false,
      },
    })
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/small-design-original.jpg',
      signedUrl: 'https://signed.example.com/small-design-original.jpg',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce('https://cdn.example.com/design-cropped.jpg')

    const result = await prepareDesignSourcePhoto({
      repId: 'rep-1',
      filenameStem: 'small-design',
      sourceImageDataUrl: 'data:image/jpeg;base64,AQID',
    })

    expect(createGuardedJewelryPhotoCropMock).toHaveBeenCalled()
    expect(result).toMatchObject({
      publicPhotoUrl: 'https://cdn.example.com/design-cropped.jpg',
      selectedSource: 'cropped',
      analysis: {
        subjectCoverage: 0.34,
      },
    })
  })
})
