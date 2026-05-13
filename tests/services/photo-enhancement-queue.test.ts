import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPhotoroomConfigMock = vi.fn()
const getStagedOriginalPhotoSignedUrlMock = vi.fn()
const publishApprovedPhotoMock = vi.fn()
const executePhotoEnhancementMock = vi.fn()
const analyzeServerImageQualityMock = vi.fn()
const decideCanonicalEnhancedPhotoMock = vi.fn()
const updateCanonicalPhotoMock = vi.fn()
const updatePhotoPipelineStateMock = vi.fn()

vi.mock('@/lib/photoroom/config', () => ({
  getPhotoroomConfig: (...args: unknown[]) => getPhotoroomConfigMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  getStagedOriginalPhotoSignedUrl: (...args: unknown[]) =>
    getStagedOriginalPhotoSignedUrlMock(...args),
  publishApprovedPhoto: (...args: unknown[]) => publishApprovedPhotoMock(...args),
}))

vi.mock('@/lib/services/photo-enhancement', () => ({
  executePhotoEnhancement: (...args: unknown[]) =>
    executePhotoEnhancementMock(...args),
}))

vi.mock('@/lib/services/server-image-quality', () => ({
  analyzeServerImageQuality: (...args: unknown[]) =>
    analyzeServerImageQualityMock(...args),
}))

vi.mock('@/lib/services/photo-enhancement-qa', () => ({
  decideCanonicalEnhancedPhoto: (...args: unknown[]) =>
    decideCanonicalEnhancedPhotoMock(...args),
}))

vi.mock('@/lib/services/jewelry-database', () => ({
  updateCanonicalPhoto: (...args: unknown[]) => updateCanonicalPhotoMock(...args),
  updatePhotoPipelineState: (...args: unknown[]) =>
    updatePhotoPipelineStateMock(...args),
}))

import { processReadyPhotoEnhancementQueue } from '@/lib/services/photo-enhancement-queue'

function makeCleanAnalysis(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    contentType: 'image/png',
    width: 1800,
    height: 1800,
    blurRisk: 0.05,
    lightingRisk: 0.05,
    detailRisk: 0.04,
    backgroundDistractionRisk: 0.06,
    subjectCoverage: 0.42,
    subjectCentered: true,
    detailConfidence: 0.96,
    backgroundUniformity: 0.94,
    backgroundCleanliness: 0.94,
    ...overrides,
  }
}

function makeSupabaseRows(rows: unknown[]) {
  const result = { data: rows, error: null as unknown }
  const chain: Record<string, unknown> = { ...result }
  const passthrough = () => chain
  chain.select = passthrough
  chain.eq = passthrough
  chain.not = passthrough
  chain.order = passthrough
  chain.limit = () => result

  return {
    from: (table: string) => {
      if (table !== 'jewelry_designs') {
        throw new Error(`unexpected table ${table}`)
      }
      return chain
    },
  }
}

describe('processReadyPhotoEnhancementQueue', () => {
  beforeEach(() => {
    getPhotoroomConfigMock.mockReset()
    getStagedOriginalPhotoSignedUrlMock.mockReset()
    publishApprovedPhotoMock.mockReset()
    executePhotoEnhancementMock.mockReset()
    analyzeServerImageQualityMock.mockReset()
    decideCanonicalEnhancedPhotoMock.mockReset()
    updateCanonicalPhotoMock.mockReset()
    updatePhotoPipelineStateMock.mockReset()
  })

  it('returns an empty batch when Photoroom is not configured', async () => {
    getPhotoroomConfigMock.mockReturnValue(null)

    const result = await processReadyPhotoEnhancementQueue(
      makeSupabaseRows([]) as never,
    )

    expect(result).toEqual({
      processedCount: 0,
      publishedCount: 0,
      reviewCount: 0,
      rejectedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      items: [],
    })
  })

  it('publishes a ready staged original when enhancement clears canonical promotion', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(Buffer.from([1, 2, 3]), { status: 200 }))
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    getStagedOriginalPhotoSignedUrlMock.mockResolvedValueOnce(
      'https://signed.example.com/original',
    )
    analyzeServerImageQualityMock
      .mockResolvedValueOnce(makeCleanAnalysis())
      .mockResolvedValueOnce(makeCleanAnalysis())
    executePhotoEnhancementMock.mockResolvedValueOnce({
      provider: 'photoroom',
      output: { bytes: new Uint8Array([9, 9, 9]) },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 3,
        requestId: 'req-1',
      },
    })
    decideCanonicalEnhancedPhotoMock.mockReturnValueOnce({
      assetId: 'design-1:RG-100',
      provider: 'photoroom',
      decision: 'promote_canonical',
      qaDecision: 'approve',
      flaggedChecks: [],
      reasons: ['promote'],
    })
    publishApprovedPhotoMock.mockResolvedValueOnce(
      'https://cdn.example.com/design-1/enhanced.png',
    )

    const result = await processReadyPhotoEnhancementQueue(
      makeSupabaseRows([
        {
          id: 'design-1',
          item_number: 'RG-100',
          photo_pipeline_original_path: 'rep-1/source.png',
          photo_pipeline_status: 'ready',
        },
      ]) as never,
      { fetch: fetchMock },
    )

    expect(result.processedCount).toBe(1)
    expect(result.publishedCount).toBe(1)
    expect(result.items[0]).toMatchObject({
      designId: 'design-1',
      itemNumber: 'RG-100',
      finalStatus: 'published',
      qaDecision: 'approve',
      enhancedPhotoUrl: 'https://cdn.example.com/design-1/enhanced.png',
    })
    expect(updatePhotoPipelineStateMock.mock.calls[0][2]).toMatchObject({
      status: 'processing',
      provider: 'photoroom',
    })
    expect(updateCanonicalPhotoMock).toHaveBeenCalledWith(
      expect.anything(),
      'design-1',
      'https://cdn.example.com/design-1/enhanced.png',
    )
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      status: 'published',
      qaDecision: 'approve',
      enhancedUrl: 'https://cdn.example.com/design-1/enhanced.png',
    })
  })

  it('keeps a ready staged original in rejected when enhancement QA holds it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(Buffer.from([1, 2, 3]), { status: 200 }))
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    getStagedOriginalPhotoSignedUrlMock.mockResolvedValueOnce(
      'https://signed.example.com/original',
    )
    analyzeServerImageQualityMock
      .mockResolvedValueOnce(makeCleanAnalysis())
      .mockResolvedValueOnce(
        makeCleanAnalysis({
          width: 900,
          height: 900,
          blurRisk: 0.9,
          lightingRisk: 0.8,
          detailRisk: 0.88,
          backgroundDistractionRisk: 0.83,
          subjectCoverage: 0.12,
          subjectCentered: false,
        }),
      )
    executePhotoEnhancementMock.mockResolvedValueOnce({
      provider: 'photoroom',
      output: { bytes: new Uint8Array([9, 9, 9]) },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 3,
        requestId: 'req-1',
      },
    })
    decideCanonicalEnhancedPhotoMock.mockReturnValueOnce({
      assetId: 'design-1:RG-100',
      provider: 'photoroom',
      decision: 'hold',
      qaDecision: 'hold',
      flaggedChecks: ['resolution'],
      reasons: ['hold'],
    })

    const result = await processReadyPhotoEnhancementQueue(
      makeSupabaseRows([
        {
          id: 'design-1',
          item_number: 'RG-100',
          photo_pipeline_original_path: 'rep-1/source.png',
          photo_pipeline_status: 'ready',
        },
      ]) as never,
      { fetch: fetchMock },
    )

    expect(result.processedCount).toBe(1)
    expect(result.rejectedCount).toBe(1)
    expect(result.items[0]).toMatchObject({
      designId: 'design-1',
      finalStatus: 'rejected',
      qaDecision: 'hold',
      enhancedPhotoUrl: null,
    })
    expect(publishApprovedPhotoMock).not.toHaveBeenCalled()
    expect(updateCanonicalPhotoMock).not.toHaveBeenCalled()
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      status: 'rejected',
      qaDecision: 'hold',
    })
  })

  it('marks an item errored when the provider enhancement request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(Buffer.from([1, 2, 3]), { status: 200 }))
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    getStagedOriginalPhotoSignedUrlMock.mockResolvedValueOnce(
      'https://signed.example.com/original',
    )
    analyzeServerImageQualityMock.mockResolvedValueOnce(makeCleanAnalysis())
    executePhotoEnhancementMock.mockRejectedValueOnce(
      new Error('photoroom request failed with status 422'),
    )

    const result = await processReadyPhotoEnhancementQueue(
      makeSupabaseRows([
        {
          id: 'design-1',
          item_number: 'RG-100',
          photo_pipeline_original_path: 'rep-1/source.png',
          photo_pipeline_status: 'ready',
        },
      ]) as never,
      { fetch: fetchMock },
    )

    expect(result.processedCount).toBe(1)
    expect(result.errorCount).toBe(1)
    expect(result.publishedCount).toBe(0)
    expect(result.rejectedCount).toBe(0)
    expect(result.items[0]).toMatchObject({
      designId: 'design-1',
      itemNumber: 'RG-100',
      finalStatus: 'error',
      qaDecision: null,
      enhancedPhotoUrl: null,
      errorMessage: 'photoroom request failed with status 422',
    })
    expect(publishApprovedPhotoMock).not.toHaveBeenCalled()
    expect(updateCanonicalPhotoMock).not.toHaveBeenCalled()
    expect(updatePhotoPipelineStateMock.mock.calls[0][2]).toMatchObject({
      status: 'processing',
      provider: 'photoroom',
    })
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      status: 'error',
      provider: 'photoroom',
    })
  })
})
