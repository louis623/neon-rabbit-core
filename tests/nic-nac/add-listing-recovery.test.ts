// Unit tests for add_listing recovery payloads.
//
// Covers the vision-first photo flow refactor:
//   - NEEDS_FULL_INFO returns needsAction:'create_design' with the same
//     requiredFields contract Task 1.5B established (preserves the manual
//     URL fallback) and a vision-first message that explicitly forbids
//     URL-fishing and looping without piecePhotoUrl.
//   - The create-design retry branch still wires through when a real
//     piecePhotoUrl is supplied (regression guard for the manual fallback).
//   - NEEDS_COLLECTION asks for the exact collection name, then a retry can
//     pass collectionName through to the service layer.
//
// All external collaborators are mocked — no network, no Supabase. The tests
// invoke the real tool's execute() function so the runSingle branching and
// error-translation logic are exercised end-to-end.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServiceError, errors } from '@/lib/services/errors'

const addListingMock = vi.fn()
const addListingBatchMock = vi.fn()
const createDesignMock = vi.fn()
const resolveItemNumberMock = vi.fn()
const updateCanonicalPhotoMock = vi.fn()
const uploadJewelryPhotoMock = vi.fn()
const uploadStagedOriginalPhotoMock = vi.fn()
const publishApprovedPhotoMock = vi.fn()
const updatePhotoPipelineStateMock = vi.fn()
const executePhotoEnhancementMock = vi.fn()
const getPhotoroomConfigMock = vi.fn()
const analyzeServerImageQualityMock = vi.fn()
const decideCanonicalEnhancedPhotoMock = vi.fn()
const processRepListingPhotoUrlMock = vi.fn()
const writeTradeActionAuditMock = vi.fn()
const logIncidentMock = vi.fn()
const fetchMock = vi.fn()

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

vi.mock('@/lib/services/trade-board', () => ({
  addListing: (...args: unknown[]) => addListingMock(...args),
  addListingBatch: (...args: unknown[]) => addListingBatchMock(...args),
}))

vi.mock('@/lib/services/jewelry-database', () => ({
  createDesign: (...args: unknown[]) => createDesignMock(...args),
  resolveItemNumber: (...args: unknown[]) => resolveItemNumberMock(...args),
  updateCanonicalPhoto: (...args: unknown[]) => updateCanonicalPhotoMock(...args),
  updatePhotoPipelineState: (...args: unknown[]) =>
    updatePhotoPipelineStateMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadJewelryPhoto: (...args: unknown[]) => uploadJewelryPhotoMock(...args),
  uploadStagedOriginalPhoto: (...args: unknown[]) =>
    uploadStagedOriginalPhotoMock(...args),
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

vi.mock('@/lib/services/listing-photo-processing', () => ({
  processRepListingPhotoUrl: (...args: unknown[]) =>
    processRepListingPhotoUrlMock(...args),
}))

vi.mock('@/lib/photoroom/config', () => ({
  getPhotoroomConfig: (...args: unknown[]) => getPhotoroomConfigMock(...args),
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

interface AddListingToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeTool(supabase: unknown = makeConversationLookupMock([])): AddListingToolDef {
  return makeAddListingTool({
    repId: 'rep-1',
    supabase: supabase as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }) as unknown as AddListingToolDef
}

function makeImageResponse(
  bytes: Uint8Array,
  contentType = 'image/png',
  status = 200,
) {
  return new Response(Buffer.from(bytes), {
    status,
    headers: {
      'content-type': contentType,
    },
  })
}

// Chainable supabase mock matching the call shape used by
// resolvePhotoFromConversation: from(table).select().eq().eq().eq().order().order()
function makeConversationLookupMock(rows: Array<{ parts: unknown }>) {
  const result = { data: rows, error: null as unknown }
  // Each chain method returns the same chain; the terminal `.order()` is
  // awaited for `{ data, error }`. Returning `result` from .order() works
  // because `await result` resolves to result itself (no thenable).
  const chain: Record<string, unknown> = { ...result }
  const passthrough = () => chain
  chain.select = passthrough
  chain.eq = passthrough
  chain.order = passthrough
  return {
    from: (table: string) => {
      if (table !== 'nic_nac_conversations') {
        throw new Error(`unexpected table ${table}`)
      }
      return chain
    },
  }
}

beforeEach(() => {
  addListingMock.mockReset()
  addListingBatchMock.mockReset()
  createDesignMock.mockReset()
  resolveItemNumberMock.mockReset()
  resolveItemNumberMock.mockResolvedValue({ found: false })
  updateCanonicalPhotoMock.mockReset()
  uploadJewelryPhotoMock.mockReset()
  uploadStagedOriginalPhotoMock.mockReset()
  publishApprovedPhotoMock.mockReset()
  updatePhotoPipelineStateMock.mockReset()
  executePhotoEnhancementMock.mockReset()
  getPhotoroomConfigMock.mockReset()
  analyzeServerImageQualityMock.mockReset()
  decideCanonicalEnhancedPhotoMock.mockReset()
  processRepListingPhotoUrlMock.mockReset()
  writeTradeActionAuditMock.mockReset()
  logIncidentMock.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  analyzeServerImageQualityMock.mockResolvedValue(makeCleanAnalysis())
  getPhotoroomConfigMock.mockReturnValue(null)
})

describe('add_listing — NEEDS_FULL_INFO recovery payload', () => {
  it('returns needsAction:create_design with vision-first contract (piecePhotoUrl moved to optional)', async () => {
    addListingMock.mockRejectedValueOnce(errors.NEEDS_FULL_INFO('DR-999'))

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'DR-999',
      clickwrapAccepted: true,
    })

    expect(result.needsAction).toBe('create_design')
    expect(result.itemNumber).toBe('DR-999')
    expect(result.requiredFields).toEqual(['designName', 'collectionName'])
    expect(result.optionalFields).toEqual([
      'piecePhotoUrl',
      'material',
      'mainStone',
      'bpMsrp',
      'specialFeatures',
      'lengthInfo',
    ])
  })

  it('message instructs vision-first extraction, requires rep confirmation of collection, and explains automatic photo upload', async () => {
    addListingMock.mockRejectedValueOnce(errors.NEEDS_FULL_INFO('DR-999'))

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'DR-999',
      clickwrapAccepted: true,
    })

    const message = result.message as string
    expect(message).toContain("Use vision on the rep's photos")
    expect(message).toContain('designName and any optional metadata')
    expect(message).toContain('ask the rep to confirm or provide collectionName')
    expect(message).toContain(
      'never extract or autofill the collection from vision',
    )
    expect(message).toContain('handler uploads the photo from chat automatically')
    expect(message).toContain('do NOT ask the rep for a URL')
  })
})

describe('add_listing — manual URL fallback (Task 1.5B regression guard)', () => {
  it('runs the create-design retry path when the model supplies a real piecePhotoUrl', async () => {
    fetchMock.mockResolvedValueOnce(makeImageResponse(new Uint8Array([1, 2, 3])))
    analyzeServerImageQualityMock.mockResolvedValueOnce({
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
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/manual-source.jpg',
    )
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/manual-source.jpg',
      signedUrl: 'https://signed.example.com/manual-source',
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: false,
    })

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      piecePhotoUrl: 'https://dropbox.example/photo.jpg',
      collectionName: 'Lustre',
    })

    expect(createDesignMock).toHaveBeenCalledTimes(1)
    expect(createDesignMock.mock.calls[0][1]).toMatchObject({
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      piecePhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/manual-source.jpg',
      collectionName: 'Lustre',
      photoPipeline: {
        originalPath: 'rep-1/originals/manual-source.jpg',
        originalUrl: 'https://signed.example.com/manual-source',
        status: 'ready',
        preflightScore: 100,
        preflightIssues: [],
      },
    })
    expect(createDesignMock.mock.calls[0][1].piecePhotoUrl).toBe(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/manual-source.jpg',
    )
    expect(fetchMock).toHaveBeenCalledWith('https://dropbox.example/photo.jpg')
    expect(uploadStagedOriginalPhotoMock).toHaveBeenCalledTimes(1)
    expect(uploadJewelryPhotoMock).toHaveBeenCalledTimes(1)
    expect(addListingMock).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      mode: 'single',
      listingId: 'listing-1',
      itemNumber: 'NEW-100',
      createdNewDesign: true,
      photoPipelineStatus: 'ready',
    })
    expect(processRepListingPhotoUrlMock).not.toHaveBeenCalled()
  })

  it('does not try to recreate an existing catalog design when recovery fields are present', async () => {
    resolveItemNumberMock.mockResolvedValueOnce({
      found: true,
      hasCollection: true,
      design: {
        id: 'design-existing',
        itemNumber: 'NK18149',
        designName: 'The Harper Necklace',
      },
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-existing',
      itemNumber: 'NK18149',
      designName: 'The Harper Necklace',
      status: 'available',
      usesCanonicalPhoto: true,
    })

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NK18149',
      designName: 'The Harper Necklace',
      collectionName: 'April Birthday',
    })

    expect(createDesignMock).not.toHaveBeenCalled()
    expect(addListingMock).toHaveBeenCalledTimes(1)
    expect(addListingMock.mock.calls[0][2]).toMatchObject({
      itemNumber: 'NK18149',
      collectionName: 'April Birthday',
    })
    expect(result).toMatchObject({
      mode: 'single',
      listingId: 'listing-1',
      createdNewDesign: false,
    })
  })

  it('processes a rep-level custom listing photo before creating the board listing', async () => {
    fetchMock.mockResolvedValueOnce(makeImageResponse(new Uint8Array([4, 5, 6])))
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    processRepListingPhotoUrlMock.mockResolvedValueOnce({
      photoUrl: 'https://cdn.example.com/listings/rep-1/ring-enhanced.png',
    })

    const tool = makeTool()
    await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      piecePhotoUrl: 'https://dropbox.example/photo.jpg',
      collectionName: 'Lustre',
      listingPhotoUrl: 'https://rep.example.com/raw-listing.jpg',
    })

    expect(processRepListingPhotoUrlMock).toHaveBeenCalledWith({
      repId: 'rep-1',
      sourceImageUrl: 'https://rep.example.com/raw-listing.jpg',
      filenameStem: 'NEW-100-listing-photo',
    })
    expect(addListingMock.mock.calls[0][2]).toMatchObject({
      listingPhotoUrl: 'https://cdn.example.com/listings/rep-1/ring-enhanced.png',
    })
  })

  it('uses the latest image in the current user message as the listing photo for existing designs', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'ER76003',
      designName: 'The Elodie Luxe',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    processRepListingPhotoUrlMock.mockResolvedValueOnce({
      photoUrl: 'https://cdn.example.com/listings/rep-1/elodie-jewelry.png',
    })

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          { type: 'text', text: 'Please add to my trade board' },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,SkVXRUw=',
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)

    await tool.execute({
      mode: 'single',
      itemNumber: 'ER76003',
      clickwrapAccepted: true,
    })

    expect(processRepListingPhotoUrlMock).toHaveBeenCalledWith({
      repId: 'rep-1',
      sourceImageUrl: 'data:image/jpeg;base64,SkVXRUw=',
      filenameStem: 'ER76003-listing-photo',
    })
    expect(addListingMock.mock.calls[0][2]).toMatchObject({
      listingPhotoUrl: 'https://cdn.example.com/listings/rep-1/elodie-jewelry.png',
    })
  })
})

describe('add_listing — vision-first photo extraction (Task 1.5B closure)', () => {
  it('uploads the most recent user-uploaded image from chat and passes its public URL into createDesign', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/abc.jpg',
    )
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/abc.jpg',
      signedUrl: 'https://signed.example.com/original',
    })

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          { type: 'text', text: 'add this' },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,AAAA',
            width: 1800,
            height: 1800,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      collectionName: 'Lustre',
      // no piecePhotoUrl — handler resolves it from chat history
    })

    expect(uploadJewelryPhotoMock).toHaveBeenCalledTimes(1)
    expect(uploadJewelryPhotoMock.mock.calls[0][0]).toBe('rep-1')
    expect(uploadJewelryPhotoMock.mock.calls[0][1]).toBe(
      'data:image/png;base64,AAAA',
    )
    expect(uploadStagedOriginalPhotoMock).toHaveBeenCalledWith(
      'rep-1',
      'data:image/png;base64,AAAA',
      'NEW-100-original',
    )
    expect(createDesignMock.mock.calls[0][1]).toMatchObject({
      itemNumber: 'NEW-100',
      piecePhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/abc.jpg',
      collectionName: 'Lustre',
      photoPipeline: {
        originalPath: 'rep-1/originals/abc.jpg',
        originalUrl: 'https://signed.example.com/original',
        status: 'ready',
        preflightScore: 100,
        preflightIssues: [],
      },
    })
    expect(result).toMatchObject({
      createdNewDesign: true,
      listingId: 'listing-1',
      photoPipelineStatus: 'ready',
      photoPreflight: {
        passed: true,
        score: 100,
      },
    })
  })

  it('prefers the latest image part when label and jewelry photos are uploaded together', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-101',
      designName: 'Pearl Drop Earrings',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-101',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'ER',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/jewelry.jpg',
    )
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/jewelry.jpg',
      signedUrl: 'https://signed.example.com/jewelry',
    })

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          { type: 'text', text: 'add this' },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,SkVXRUw=',
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)

    await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-101',
      clickwrapAccepted: true,
      designName: 'Pearl Drop Earrings',
      collectionName: 'Lustre',
    })

    expect(uploadJewelryPhotoMock.mock.calls[0][1]).toBe(
      'data:image/png;base64,SkVXRUw=',
    )
    expect(createDesignMock.mock.calls[0][1]).toMatchObject({
      piecePhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/jewelry.jpg',
    })
  })

  it('recovers a batch of same-item new designs by creating the design once and adding each physical unit', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NK18149',
      designName: 'The Harper Necklace',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    addListingBatchMock
      .mockResolvedValueOnce({
        added: [],
        pending: {
          needCollection: [],
          needFullInfo: [
            { itemNumber: 'NK18149' },
            { itemNumber: 'NK18149' },
            { itemNumber: 'NK18149' },
            { itemNumber: 'NK18149' },
          ],
        },
      })
      .mockResolvedValueOnce({
        added: [
          {
            listingId: 'listing-2',
            designId: 'design-1',
            itemNumber: 'NK18149',
            designName: 'The Harper Necklace',
            status: 'available',
            usesCanonicalPhoto: true,
          },
          {
            listingId: 'listing-3',
            designId: 'design-1',
            itemNumber: 'NK18149',
            designName: 'The Harper Necklace',
            status: 'available',
            usesCanonicalPhoto: true,
          },
          {
            listingId: 'listing-4',
            designId: 'design-1',
            itemNumber: 'NK18149',
            designName: 'The Harper Necklace',
            status: 'available',
            usesCanonicalPhoto: true,
          },
        ],
        pending: { needCollection: [], needFullInfo: [] },
      })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NK18149',
      collectionId: 'coll-1',
      collectionName: 'April Birthday',
      typePrefix: 'NK',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/harper.jpg',
    )
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/harper.jpg',
      signedUrl: 'https://signed.example.com/harper',
    })

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,TEFCRUw=',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,SkVXRUw=',
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    const result = await tool.execute({
      mode: 'batch',
      items: [
        {
          itemNumber: 'NK18149',
          designName: 'The Harper Necklace',
          collectionName: 'April Birthday',
        },
        {
          itemNumber: 'NK18149',
          designName: 'The Harper Necklace',
          collectionName: 'April Birthday',
        },
        {
          itemNumber: 'NK18149',
          designName: 'The Harper Necklace',
          collectionName: 'April Birthday',
        },
        {
          itemNumber: 'NK18149',
          designName: 'The Harper Necklace',
          collectionName: 'April Birthday',
        },
      ],
    })

    expect(createDesignMock).toHaveBeenCalledTimes(1)
    expect(createDesignMock.mock.calls[0][1]).toMatchObject({
      itemNumber: 'NK18149',
      designName: 'The Harper Necklace',
      collectionName: 'April Birthday',
      piecePhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/harper.jpg',
    })
    expect(addListingMock).toHaveBeenCalledTimes(1)
    expect(addListingBatchMock).toHaveBeenCalledTimes(2)
    expect(addListingBatchMock.mock.calls[1][2]).toMatchObject({
      items: [
        { itemNumber: 'NK18149' },
        { itemNumber: 'NK18149' },
        { itemNumber: 'NK18149' },
      ],
    })
    expect(result).toMatchObject({
      mode: 'batch',
      added: [
        { listingId: 'listing-1', itemNumber: 'NK18149' },
        { listingId: 'listing-2', itemNumber: 'NK18149' },
        { listingId: 'listing-3', itemNumber: 'NK18149' },
        { listingId: 'listing-4', itemNumber: 'NK18149' },
      ],
      summary: {
        addedCount: 4,
        needFullInfoCount: 0,
      },
    })
  })

  it('blocks the create-design path with coaching when the recovered chat photo is too small', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(
      makeCleanAnalysis({
        width: 640,
        height: 640,
      }),
    )
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/tiny.jpg',
    )

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,BBBB',
            width: 640,
            height: 640,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    await expect(
      tool.execute({
        mode: 'single',
        itemNumber: 'NEW-100',
        clickwrapAccepted: true,
        designName: 'Sapphire Halo',
        collectionName: 'Lustre',
      }),
    ).rejects.toMatchObject({
      code: 'PHOTO_PREFLIGHT_FAILED',
      userMessage: expect.stringContaining('That photo needs one more try'),
    })
    expect(createDesignMock).not.toHaveBeenCalled()
    expect(addListingMock).not.toHaveBeenCalled()
    expect(uploadStagedOriginalPhotoMock).not.toHaveBeenCalled()
  })

  it('blocks the create-design path when advisory blur and framing signals are poor even at decent resolution', async () => {
    analyzeServerImageQualityMock.mockResolvedValueOnce(
      makeCleanAnalysis({
        blurRisk: 0.84,
        lightingRisk: 0.76,
        detailRisk: 0.83,
        backgroundDistractionRisk: 0.86,
        subjectCoverage: 0.1,
        subjectCentered: false,
        detailConfidence: 0.12,
        backgroundUniformity: 0.35,
        backgroundCleanliness: 0.14,
      }),
    )
    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,CCCC',
            width: 1800,
            height: 1800,
            blurRisk: 0.84,
            lightingRisk: 0.76,
            subjectCoverage: 0.1,
            subjectCentered: false,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    await expect(
      tool.execute({
        mode: 'single',
        itemNumber: 'NEW-100',
        clickwrapAccepted: true,
        designName: 'Sapphire Halo',
        collectionName: 'Lustre',
      }),
    ).rejects.toMatchObject({
      code: 'PHOTO_PREFLIGHT_FAILED',
      userMessage: expect.stringContaining('That photo needs one more try'),
    })
    expect(createDesignMock).not.toHaveBeenCalled()
    expect(uploadJewelryPhotoMock).not.toHaveBeenCalled()
    expect(uploadStagedOriginalPhotoMock).not.toHaveBeenCalled()
  })

  it('throws MISSING_PIECE_PHOTO when no image part exists in any recent user message', async () => {
    const supabaseMock = makeConversationLookupMock([
      { parts: [{ type: 'text', text: 'add this' }] },
    ])
    const tool = makeTool(supabaseMock)
    await expect(
      tool.execute({
        mode: 'single',
        itemNumber: 'NEW-100',
        clickwrapAccepted: true,
        designName: 'Sapphire Halo',
        collectionName: 'Lustre',
      }),
    ).rejects.toMatchObject({ code: 'MISSING_PIECE_PHOTO' })
    expect(createDesignMock).not.toHaveBeenCalled()
    expect(uploadJewelryPhotoMock).not.toHaveBeenCalled()
  })

  it('records a qa-review enhancement candidate when the conservative decision helper requires manual review', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/abc.jpg',
      signedUrl: 'https://signed.example.com/original',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/abc.jpg',
    )
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    updatePhotoPipelineStateMock.mockResolvedValue({
      designId: 'design-1',
      photoPipelineStatus: 'qa_review',
      enhancedPhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    })
    executePhotoEnhancementMock.mockResolvedValue({
      provider: 'photoroom',
      output: { bytes: new Uint8Array([1, 2, 3]) },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 3,
        requestId: 'req-1',
      },
    })
    analyzeServerImageQualityMock.mockResolvedValue(makeCleanAnalysis({
      blurRisk: 0.08,
      lightingRisk: 0.08,
    }))
    decideCanonicalEnhancedPhotoMock.mockReturnValue({
      assetId: 'design-1:NEW-100',
      provider: 'photoroom',
      decision: 'qa_review',
      qaDecision: 'review',
      flaggedChecks: ['source-preflight'],
      reasons: ['review'],
    })
    publishApprovedPhotoMock.mockResolvedValue(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    )

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,AAAA',
            width: 1800,
            height: 1800,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      collectionName: 'Lustre',
    })

    expect(executePhotoEnhancementMock).toHaveBeenCalledTimes(1)
    expect(analyzeServerImageQualityMock).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3]),
    )
    expect(decideCanonicalEnhancedPhotoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'design-1:NEW-100',
        provider: 'photoroom',
        sourcePreflight: {
          passed: true,
          score: 100,
          issues: [],
          coachingMessages: [
            'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
          ],
        },
        outputPreflight: {
          passed: true,
          score: 100,
          issues: [],
          coachingMessages: [
            'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
          ],
        },
        outputAnalysis: {
          blurRisk: 0.08,
          lightingRisk: 0.08,
          detailRisk: 0.04,
          backgroundDistractionRisk: 0.06,
          subjectCoverage: 0.42,
          subjectCentered: true,
        },
        sourceWidth: 1800,
        sourceHeight: 1800,
        outputWidth: 1800,
        outputHeight: 1800,
        contentType: 'image/png',
      }),
    )
    expect(publishApprovedPhotoMock).toHaveBeenCalledWith(
      'design-1',
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'image/png',
        filename: 'NEW-100-enhanced',
      },
    )
    expect(updatePhotoPipelineStateMock.mock.calls[0][2]).toMatchObject({
      provider: 'photoroom',
      status: 'processing',
    })
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      provider: 'photoroom',
      status: 'qa_review',
      qaDecision: 'review',
    })
    expect(result).toMatchObject({
      createdNewDesign: true,
      photoPipelineStatus: 'qa_review',
    })
  })

  it('publishes the enhanced photo as canonical when the conservative helper explicitly approves it', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    updateCanonicalPhotoMock.mockResolvedValueOnce({
      designId: 'design-1',
      canonicalPhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    })
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/abc.jpg',
      signedUrl: 'https://signed.example.com/original',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/abc.jpg',
    )
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    updatePhotoPipelineStateMock.mockResolvedValue({
      designId: 'design-1',
      photoPipelineStatus: 'published',
      enhancedPhotoUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    })
    executePhotoEnhancementMock.mockResolvedValue({
      provider: 'photoroom',
      output: { bytes: new Uint8Array([1, 2, 3]) },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 3,
        requestId: 'req-1',
      },
    })
    analyzeServerImageQualityMock.mockResolvedValue(
      makeCleanAnalysis({
        detailRisk: 0.03,
        backgroundDistractionRisk: 0.05,
        subjectCoverage: 0.45,
        detailConfidence: 0.97,
        backgroundUniformity: 0.96,
        backgroundCleanliness: 0.95,
      }),
    )
    decideCanonicalEnhancedPhotoMock.mockReturnValue({
      assetId: 'design-1:NEW-100',
      provider: 'photoroom',
      decision: 'promote_canonical',
      qaDecision: 'approve',
      flaggedChecks: [],
      reasons: ['promote'],
    })
    publishApprovedPhotoMock.mockResolvedValue(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    )

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,AAAA',
            width: 1800,
            height: 1800,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      collectionName: 'Lustre',
    })

    expect(publishApprovedPhotoMock).toHaveBeenCalledTimes(1)
    expect(updateCanonicalPhotoMock).toHaveBeenCalledWith(
      {},
      'design-1',
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    )
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      provider: 'photoroom',
      status: 'published',
      qaDecision: 'approve',
      enhancedUrl:
        'https://example.supabase.co/storage/v1/object/public/jewelry-photos/approved/design-1/enhanced.png',
    })
    expect(result).toMatchObject({
      createdNewDesign: true,
      usesCanonicalPhoto: true,
      photoPipelineStatus: 'published',
    })
  })

  it('holds the enhancement when the conservative helper rejects auto-publish', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'NEW-100',
      designName: 'Sapphire Halo',
      status: 'available',
      usesCanonicalPhoto: false,
    })
    createDesignMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'NEW-100',
      collectionId: 'coll-1',
      collectionName: 'Lustre',
      typePrefix: 'DR',
    })
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/abc.jpg',
      signedUrl: 'https://signed.example.com/original',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://example.supabase.co/storage/v1/object/public/jewelry-photos/rep-1/abc.jpg',
    )
    getPhotoroomConfigMock.mockReturnValue({
      provider: 'photoroom',
      apiKey: 'phot_test_123',
      baseUrl: 'https://image-api.photoroom.test',
      timeoutMs: 8000,
    })
    updatePhotoPipelineStateMock.mockResolvedValue({
      designId: 'design-1',
      photoPipelineStatus: 'rejected',
      enhancedPhotoUrl: null,
    })
    executePhotoEnhancementMock.mockResolvedValue({
      provider: 'photoroom',
      output: { bytes: new Uint8Array([1, 2, 3]) },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 3,
        requestId: 'req-1',
      },
    })
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
          detailConfidence: 0.12,
          backgroundUniformity: 0.32,
          backgroundCleanliness: 0.18,
        }),
      )
    decideCanonicalEnhancedPhotoMock.mockReturnValue({
      assetId: 'design-1:NEW-100',
      provider: 'photoroom',
      decision: 'hold',
      qaDecision: 'hold',
      flaggedChecks: ['resolution'],
      reasons: ['hold'],
    })

    const supabaseMock = makeConversationLookupMock([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,AAAA',
            width: 1800,
            height: 1800,
          },
        ],
      },
    ])
    const tool = makeTool(supabaseMock)
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'NEW-100',
      clickwrapAccepted: true,
      designName: 'Sapphire Halo',
      collectionName: 'Lustre',
    })

    expect(publishApprovedPhotoMock).not.toHaveBeenCalled()
    expect(updateCanonicalPhotoMock).not.toHaveBeenCalled()
    expect(updatePhotoPipelineStateMock.mock.calls[1][2]).toMatchObject({
      provider: 'photoroom',
      status: 'rejected',
      qaDecision: 'hold',
    })
    expect(result).toMatchObject({
      createdNewDesign: true,
      photoPipelineStatus: 'rejected',
    })
  })
})

describe('add_listing — NEEDS_COLLECTION recovery payload', () => {
  it('asks for an exact collection name instead of hard-stopping', async () => {
    addListingMock.mockRejectedValueOnce(
      errors.NEEDS_COLLECTION('design-x', 'Mystery Piece'),
    )

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'EX-1',
      clickwrapAccepted: true,
    })

    expect(result.needsAction).toBe('provide_collection')
    expect(result.code).toBe('NEEDS_COLLECTION')
    expect(result.itemNumber).toBe('EX-1')
    expect(result.requiredFields).toEqual(['collectionName'])
    expect(result.message).toContain('exact collection name')
    expect(result.message).toContain('retry')
  })

  it('passes collectionName through on the retry path for existing designs', async () => {
    addListingMock.mockResolvedValueOnce({
      listingId: 'listing-1',
      designId: 'design-x',
      itemNumber: 'EX-1',
      designName: 'Mystery Piece',
      status: 'available',
      usesCanonicalPhoto: true,
    })

    const tool = makeTool()
    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'EX-1',
      collectionName: 'Lustre',
      clickwrapAccepted: true,
    })

    expect(addListingMock.mock.calls[0][2]).toMatchObject({
      itemNumber: 'EX-1',
      collectionName: 'Lustre',
    })
    expect(result).toMatchObject({
      mode: 'single',
      listingId: 'listing-1',
      itemNumber: 'EX-1',
    })
  })
})

describe('add_listing - direct listing without ownership clickwrap', () => {
  it('does not ask for ownership confirmation before touching the service layer', async () => {
    addListingMock.mockResolvedValueOnce({
      mode: 'single',
      listingId: 'listing-1',
      itemNumber: 'DR-1',
      designName: 'Demo Ring',
      status: 'available',
    })
    const tool = makeTool()

    const result = await tool.execute({
      mode: 'single',
      itemNumber: 'DR-1',
      clickwrapAccepted: false,
    })

    expect(result).toMatchObject({
      mode: 'single',
      listingId: 'listing-1',
      itemNumber: 'DR-1',
    })
    expect(addListingMock).toHaveBeenCalledWith(
      {},
      'rep-1',
      expect.not.objectContaining({ clickwrapAccepted: expect.anything() }),
    )
    expect(createDesignMock).not.toHaveBeenCalled()
  })
})

// Sanity: make sure ServiceError import resolves (avoids the test file
// silently passing if the module path was wrong).
describe('test wiring', () => {
  it('errors module exports ServiceError', () => {
    expect(typeof ServiceError).toBe('function')
  })
})
