import { getPhotoroomConfig } from '@/lib/photoroom/config'
import { errors, ServiceError } from '@/lib/services/errors'
import { assessJewelryPhotoPreflight } from '@/lib/services/jewelry-photo-preflight'
import { executePhotoEnhancement } from '@/lib/services/photo-enhancement'
import { inspectEnhancedPhotoOutput } from '@/lib/services/photo-enhancement-qa'
import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'
import { uploadJewelryPhoto } from '@/lib/services/storage'

export interface ProcessRepListingPhotoUrlInput {
  repId: string
  sourceImageUrl: string
  filenameStem: string
}

export interface ProcessRepListingPhotoUrlResult {
  photoUrl: string
  originalPhotoUrl: string
  enhancedPhotoUrl: string | null
  selectedSource: 'original' | 'enhanced'
  preflight: ReturnType<typeof assessJewelryPhotoPreflight>
  image: {
    contentType: string
    width: number
    height: number
    blurRisk: number
    lightingRisk: number
    detailRisk: number
    backgroundDistractionRisk: number
    subjectCoverage: number
    subjectCentered: boolean
    detailConfidence: number
    backgroundUniformity: number
    backgroundCleanliness: number
  }
  enhancement: {
    attempted: boolean
    selected?: boolean
    decision?: 'review' | 'hold' | 'error'
    errorMessage?: string
    preflight?: ReturnType<typeof assessJewelryPhotoPreflight>
  }
}

function toDataUrl(contentType: string, bytes: Uint8Array): string {
  return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`
}

async function fetchImageBytes(
  input: ProcessRepListingPhotoUrlInput,
  fetchImpl: typeof fetch,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const response = await fetchImpl(input.sourceImageUrl)
  if (!response.ok) {
    throw new ServiceError({
      code: 'LISTING_PHOTO_FETCH_FAILED',
      message: `listing photo fetch failed with status ${response.status}`,
      userMessage:
        "I couldn't fetch that listing photo URL. Try uploading it again or use a direct image link.",
      statusCode: 422,
    })
  }

  const buffer = await response.arrayBuffer()
  return {
    bytes: new Uint8Array(buffer),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}

export async function processRepListingPhotoUrl(
  input: ProcessRepListingPhotoUrlInput,
  options: { fetch?: typeof fetch } = {},
): Promise<ProcessRepListingPhotoUrlResult> {
  const fetchImpl = options.fetch ?? fetch
  const fetched = await fetchImageBytes(input, fetchImpl)
  const metadata = await analyzeServerImageQuality(fetched.bytes)

  const preflight = assessJewelryPhotoPreflight({
    width: metadata.width,
    height: metadata.height,
    blurRisk: metadata.blurRisk,
    lightingRisk: metadata.lightingRisk,
    detailRisk: metadata.detailRisk,
    backgroundDistractionRisk: metadata.backgroundDistractionRisk,
    subjectCoverage: metadata.subjectCoverage,
    subjectCentered: metadata.subjectCentered,
  })
  if (!preflight.passed) {
    throw errors.LISTING_PHOTO_PREFLIGHT_FAILED(preflight.coachingMessages)
  }

  const originalPhotoUrl = await uploadJewelryPhoto(
    input.repId,
    toDataUrl(metadata.contentType, fetched.bytes),
    `${input.filenameStem}-source`,
  )

  const baseResult: ProcessRepListingPhotoUrlResult = {
    photoUrl: originalPhotoUrl,
    originalPhotoUrl,
    enhancedPhotoUrl: null,
    selectedSource: 'original',
    preflight,
    image: {
      contentType: metadata.contentType,
      width: metadata.width,
      height: metadata.height,
      blurRisk: metadata.blurRisk,
      lightingRisk: metadata.lightingRisk,
      detailRisk: metadata.detailRisk,
      backgroundDistractionRisk: metadata.backgroundDistractionRisk,
      subjectCoverage: metadata.subjectCoverage,
      subjectCentered: metadata.subjectCentered,
      detailConfidence: metadata.detailConfidence,
      backgroundUniformity: metadata.backgroundUniformity,
      backgroundCleanliness: metadata.backgroundCleanliness,
    },
    enhancement: {
      attempted: false,
    },
  }

  const photoroomConfig = getPhotoroomConfig()
  if (!photoroomConfig) {
    return baseResult
  }

  try {
    const enhanced = await executePhotoEnhancement(
      {
        assetId: `${input.repId}:${input.filenameStem}`,
        sourceImageUrl: originalPhotoUrl,
        output: {
          format: 'png',
          background: 'white',
        },
        operations: {
          removeBackground: true,
          relight: 'preserve-hue-and-saturation',
        },
        context: {
          repId: input.repId,
        },
      },
      {
        provider: photoroomConfig,
        fetch: fetchImpl,
      },
    )

    const outputMetadata = await analyzeServerImageQuality(enhanced.output.bytes)
    const outputQa = inspectEnhancedPhotoOutput({
      assetId: `${input.repId}:${input.filenameStem}`,
      provider: 'photoroom',
      outputWidth: outputMetadata.width,
      outputHeight: outputMetadata.height,
      contentType:
        outputMetadata.contentType ??
        enhanced.response.contentType ??
        'application/octet-stream',
      blurRisk: outputMetadata.blurRisk,
      lightingRisk: outputMetadata.lightingRisk,
      detailRisk: outputMetadata.detailRisk,
      backgroundDistractionRisk: outputMetadata.backgroundDistractionRisk,
      subjectCoverage: outputMetadata.subjectCoverage,
      subjectCentered: outputMetadata.subjectCentered,
    })
    const outputPreflight = assessJewelryPhotoPreflight({
      width: outputMetadata.width,
      height: outputMetadata.height,
      blurRisk: outputMetadata.blurRisk,
      lightingRisk: outputMetadata.lightingRisk,
      detailRisk: outputMetadata.detailRisk,
      backgroundDistractionRisk: outputMetadata.backgroundDistractionRisk,
      subjectCoverage: outputMetadata.subjectCoverage,
      subjectCentered: outputMetadata.subjectCentered,
    })

    if (outputQa.decision !== 'review' || !outputPreflight.passed) {
      return {
        ...baseResult,
        enhancement: {
          attempted: true,
          selected: false,
          decision: outputQa.decision,
          preflight: outputPreflight,
        },
      }
    }

    const enhancedPhotoUrl = await uploadJewelryPhoto(
      input.repId,
      toDataUrl(outputMetadata.contentType, enhanced.output.bytes),
      `${input.filenameStem}-enhanced`,
    )

    return {
      ...baseResult,
      photoUrl: enhancedPhotoUrl,
      enhancedPhotoUrl,
      selectedSource: 'enhanced',
      enhancement: {
        attempted: true,
        selected: true,
        decision: outputQa.decision,
        preflight: outputPreflight,
      },
    }
  } catch (error) {
    return {
      ...baseResult,
      enhancement: {
        attempted: true,
        selected: false,
        decision: 'error',
        errorMessage: error instanceof Error ? error.message : 'unknown enhancement error',
      },
    }
  }
}

export const processRepCustomListingPhotoUrl = processRepListingPhotoUrl
