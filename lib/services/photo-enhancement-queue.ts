import type { SupabaseClient } from '@supabase/supabase-js'

import { executePhotoEnhancement } from '@/lib/services/photo-enhancement'
import { decideCanonicalEnhancedPhoto } from '@/lib/services/photo-enhancement-qa'
import { assessJewelryPhotoPreflight } from '@/lib/services/jewelry-photo-preflight'
import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'
import {
  getStagedOriginalPhotoSignedUrl,
  publishApprovedPhoto,
} from '@/lib/services/storage'
import {
  updateCanonicalPhoto,
  updatePhotoPipelineState,
} from '@/lib/services/jewelry-database'
import { getPhotoroomConfig } from '@/lib/photoroom/config'

interface ReadyDesignRow {
  id: string
  item_number: string
  photo_pipeline_original_path: string | null
  photo_pipeline_status: string
}

export interface PhotoEnhancementQueueItemResult {
  designId: string
  itemNumber: string
  finalStatus: 'published' | 'qa_review' | 'rejected' | 'error' | 'skipped'
  qaDecision: 'approve' | 'review' | 'hold' | null
  enhancedPhotoUrl: string | null
  errorMessage?: string
}

export interface PhotoEnhancementQueueBatchResult {
  processedCount: number
  publishedCount: number
  reviewCount: number
  rejectedCount: number
  errorCount: number
  skippedCount: number
  items: PhotoEnhancementQueueItemResult[]
}

async function fetchBinary(
  url: string,
  fetchImpl: typeof fetch,
): Promise<Uint8Array> {
  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new Error(`source photo fetch failed with status ${response.status}`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

function toSourceAnalysis(metadata: Awaited<ReturnType<typeof analyzeServerImageQuality>>) {
  return {
    blurRisk: metadata.blurRisk,
    lightingRisk: metadata.lightingRisk,
    detailRisk: metadata.detailRisk,
    backgroundDistractionRisk: metadata.backgroundDistractionRisk,
    subjectCoverage: metadata.subjectCoverage,
    subjectCentered: metadata.subjectCentered,
  }
}

function buildSourcePreflight(
  metadata: Awaited<ReturnType<typeof analyzeServerImageQuality>>,
) {
  return assessJewelryPhotoPreflight({
    width: metadata.width,
    height: metadata.height,
    blurRisk: metadata.blurRisk,
    lightingRisk: metadata.lightingRisk,
    detailRisk: metadata.detailRisk,
    backgroundDistractionRisk: metadata.backgroundDistractionRisk,
    subjectCoverage: metadata.subjectCoverage,
    subjectCentered: metadata.subjectCentered,
  })
}

export async function processReadyPhotoEnhancementQueue(
  supabase: SupabaseClient,
  options: {
    limit?: number
    fetch?: typeof fetch
  } = {},
): Promise<PhotoEnhancementQueueBatchResult> {
  const photoroomConfig = getPhotoroomConfig()
  if (!photoroomConfig) {
    return {
      processedCount: 0,
      publishedCount: 0,
      reviewCount: 0,
      rejectedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      items: [],
    }
  }

  const fetchImpl = options.fetch ?? fetch
  const limit = options.limit ?? 25

  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(
      'id, item_number, photo_pipeline_original_path, photo_pipeline_status',
    )
    .eq('photo_pipeline_status', 'ready')
    .not('photo_pipeline_original_path', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  const items: PhotoEnhancementQueueItemResult[] = []

  for (const row of ((data ?? []) as ReadyDesignRow[])) {
    if (!row.photo_pipeline_original_path) {
      items.push({
        designId: row.id,
        itemNumber: row.item_number,
        finalStatus: 'skipped',
        qaDecision: null,
        enhancedPhotoUrl: null,
        errorMessage: 'missing original path',
      })
      continue
    }

    try {
      const signedUrl = await getStagedOriginalPhotoSignedUrl(
        row.photo_pipeline_original_path,
      )
      const sourceBytes = await fetchBinary(signedUrl, fetchImpl)
      const sourceMetadata = await analyzeServerImageQuality(sourceBytes)
      const sourcePreflight = buildSourcePreflight(sourceMetadata)

      await updatePhotoPipelineState(supabase, row.id, {
        provider: 'photoroom',
        status: 'processing',
        preflightScore: sourcePreflight.score,
        preflightIssues: sourcePreflight.issues,
      })

      const enhanced = await executePhotoEnhancement(
        {
          assetId: `${row.id}:${row.item_number}`,
          sourceImageUrl: signedUrl,
          output: {
            format: 'png',
            background: 'white',
          },
          operations: {
            removeBackground: true,
            relight: 'preserve-hue-and-saturation',
          },
        },
        {
          provider: photoroomConfig,
          fetch: fetchImpl,
        },
      )
      const outputMetadata = await analyzeServerImageQuality(enhanced.output.bytes)
      const outputPreflight = buildSourcePreflight(outputMetadata)
      const outputQa = decideCanonicalEnhancedPhoto({
        assetId: `${row.id}:${row.item_number}`,
        provider: 'photoroom',
        sourcePreflight,
        sourceAnalysis: toSourceAnalysis(sourceMetadata),
        outputPreflight,
        outputAnalysis: toSourceAnalysis(outputMetadata),
        sourceWidth: sourceMetadata.width,
        sourceHeight: sourceMetadata.height,
        outputWidth: outputMetadata.width,
        outputHeight: outputMetadata.height,
        contentType:
          outputMetadata.contentType ??
          enhanced.response.contentType ??
          'application/octet-stream',
      })

      if (outputQa.decision === 'hold') {
        await updatePhotoPipelineState(supabase, row.id, {
          provider: 'photoroom',
          status: 'rejected',
          qaDecision: outputQa.qaDecision,
          processedAt: new Date().toISOString(),
        })
        items.push({
          designId: row.id,
          itemNumber: row.item_number,
          finalStatus: 'rejected',
          qaDecision: outputQa.qaDecision,
          enhancedPhotoUrl: null,
        })
        continue
      }

      const enhancedPhotoUrl = await publishApprovedPhoto(
        row.id,
        enhanced.output.bytes,
        {
          contentType: outputMetadata.contentType,
          filename: `${row.item_number}-enhanced`,
        },
      )

      if (outputQa.decision === 'promote_canonical') {
        await updateCanonicalPhoto(supabase, row.id, enhancedPhotoUrl)
        await updatePhotoPipelineState(supabase, row.id, {
          provider: 'photoroom',
          enhancedUrl: enhancedPhotoUrl,
          status: 'published',
          qaDecision: outputQa.qaDecision,
          processedAt: new Date().toISOString(),
        })
        items.push({
          designId: row.id,
          itemNumber: row.item_number,
          finalStatus: 'published',
          qaDecision: outputQa.qaDecision,
          enhancedPhotoUrl,
        })
        continue
      }

      await updatePhotoPipelineState(supabase, row.id, {
        provider: 'photoroom',
        enhancedUrl: enhancedPhotoUrl,
        status: 'qa_review',
        qaDecision: outputQa.qaDecision,
        processedAt: new Date().toISOString(),
      })
      items.push({
        designId: row.id,
        itemNumber: row.item_number,
        finalStatus: 'qa_review',
        qaDecision: outputQa.qaDecision,
        enhancedPhotoUrl,
      })
    } catch (error) {
      await updatePhotoPipelineState(supabase, row.id, {
        provider: 'photoroom',
        status: 'error',
        processedAt: new Date().toISOString(),
      })
      items.push({
        designId: row.id,
        itemNumber: row.item_number,
        finalStatus: 'error',
        qaDecision: null,
        enhancedPhotoUrl: null,
        errorMessage: error instanceof Error ? error.message : 'unknown error',
      })
    }
  }

  return {
    processedCount: items.length,
    publishedCount: items.filter((item) => item.finalStatus === 'published').length,
    reviewCount: items.filter((item) => item.finalStatus === 'qa_review').length,
    rejectedCount: items.filter((item) => item.finalStatus === 'rejected').length,
    errorCount: items.filter((item) => item.finalStatus === 'error').length,
    skippedCount: items.filter((item) => item.finalStatus === 'skipped').length,
    items,
  }
}
