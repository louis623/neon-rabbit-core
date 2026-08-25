import { describe, expect, it, vi } from 'vitest'

import {
  finalizeSparkleFinderStudioReviewV2,
  listSparkleFinderStudioReviewQueue,
  processSparkleFinderStudioIntakeV2,
  loadStudioCandidates,
  type SparkleFinderStudioCandidate,
  type SparkleFinderStudioCatalogDraft,
  type SparkleFinderStudioIntakeV2Deps,
} from '@/lib/sparkle-finder/studio-intake-v2'

const submissionId = '11111111-1111-4111-8111-111111111111'
const labelAssetId = '22222222-2222-4222-8222-222222222222'
const jewelryAssetId = '33333333-3333-4333-8333-333333333333'

const roseCandidate: SparkleFinderStudioCandidate = {
  designId: '44444444-4444-4444-8444-444444444444',
  itemNumber: 'ER59000',
  designName: 'Baguette Braid Sparkle',
  material: 'Rhodium Plating',
  mainStone: 'Rose Quartz Cubic Zirconia',
  jewelryType: 'earrings',
  collectionName: 'July Birthday 2026',
  collectionYear: 2026,
  canonicalPhotoUrl: 'https://cdn.example.com/rose.png',
  description: null,
}

const rubyCandidate: SparkleFinderStudioCandidate = {
  ...roseCandidate,
  designId: '55555555-5555-4555-8555-555555555555',
  mainStone: 'Lab-Created Ruby',
  canonicalPhotoUrl: 'https://cdn.example.com/ruby.png',
}

describe('Sparkle Finder Studio intake v2', () => {
  it('returns deterministic exact candidates without collapsing variants by item number', async () => {
    const deps = makeDeps()
    deps.loadCandidates.mockResolvedValueOnce([rubyCandidate, roseCandidate])

    const result = await processSparkleFinderStudioIntakeV2(resolveRequest(), deps)

    expect(result).toEqual({
      schemaVersion: 2,
      ok: true,
      status: 'needs_variant_confirmation',
      retryable: false,
      mutationReplayed: false,
      variantCandidates: [roseCandidate, rubyCandidate],
    })
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'resolve',
        candidateIds: [roseCandidate.designId, rubyCandidate.designId],
      }),
    )
  })

  it('uses stone and material evidence to accept one exact existing design', async () => {
    const deps = makeDeps()
    deps.loadCandidates.mockResolvedValueOnce([roseCandidate, rubyCandidate])

    const result = await processSparkleFinderStudioIntakeV2(
      resolveRequest({
        labelDetails: {
          itemNumber: 'er59000',
          material: ' rhodium  plating ',
          mainStone: 'lab-created ruby',
        },
      }),
      deps,
    )

    expect(result).toEqual({
      schemaVersion: 2,
      ok: true,
      status: 'accepted',
      retryable: false,
      mutationReplayed: false,
      suiteDesignId: rubyCandidate.designId,
      resolvedDesign: rubyCandidate,
    })
  })

  it('preserves a legacy RBP item number unchanged', async () => {
    const deps = makeDeps()
    const rbpCandidate: SparkleFinderStudioCandidate = {
      ...roseCandidate,
      designId: '66666666-6666-4666-8666-666666666666',
      itemNumber: 'RBP5902',
      designName: 'One More Chapter',
      jewelryType: 'necklace',
    }
    deps.loadCandidates.mockResolvedValueOnce([rbpCandidate])

    const result = await processSparkleFinderStudioIntakeV2(
      resolveRequest({ labelDetails: { itemNumber: ' rbp5902 ' } }),
      deps,
    )

    expect(result).toMatchObject({
      ok: true,
      status: 'accepted',
      resolvedDesign: { itemNumber: 'RBP5902', jewelryType: 'necklace' },
    })
    expect(deps.loadCandidates).toHaveBeenCalledWith(expect.anything(), 'RBP5902')
  })

  it('queues a missing design without creating or publishing a catalog row', async () => {
    const deps = makeDeps()
    deps.loadCandidates.mockResolvedValueOnce([])

    const result = await processSparkleFinderStudioIntakeV2(
      resolveRequest({
        labelDetails: {
          itemNumber: 'RBP5902',
          designName: 'One More Chapter',
          mainStone: 'Crystal',
        },
      }),
      deps,
    )

    expect(result).toEqual({
      schemaVersion: 2,
      ok: true,
      status: 'publish_queued',
      retryable: false,
      mutationReplayed: false,
      catalogDraft: {
        itemNumber: 'RBP5902',
        designName: 'One More Chapter',
        mainStone: 'Crystal',
      },
    })
    expect(deps.resolveExact).not.toHaveBeenCalled()
  })

  it('rejects malformed item numbers without querying or queuing catalog work', async () => {
    const deps = makeDeps()

    const result = await processSparkleFinderStudioIntakeV2(
      resolveRequest({ labelDetails: { itemNumber: 'RG-not-real', designName: 'Nope' } }),
      deps,
    )

    expect(result).toMatchObject({
      ok: false,
      status: 'invalid_details',
      errorCode: 'invalid_item_number',
    })
    expect(deps.loadCandidates).not.toHaveBeenCalled()
  })

  it('confirms only the exact candidate stored for the resolve stage', async () => {
    const deps = makeDeps()
    deps.claim.mockResolvedValueOnce({
      kind: 'claimed',
      action: 'confirm',
      operationToken: '77777777-7777-4777-8777-777777777777',
      resolveResult: {
        schemaVersion: 2,
        ok: true,
        status: 'needs_variant_confirmation',
        retryable: false,
        mutationReplayed: false,
        variantCandidates: [roseCandidate, rubyCandidate],
      },
    })
    deps.resolveExact.mockResolvedValueOnce({
      found: true,
      design: {
        id: rubyCandidate.designId,
        itemNumber: rubyCandidate.itemNumber,
        designName: rubyCandidate.designName,
        material: rubyCandidate.material,
        mainStone: rubyCandidate.mainStone,
        typePrefix: 'ER',
        collectionName: rubyCandidate.collectionName,
        collectionYear: rubyCandidate.collectionYear,
        canonicalPhotoUrl: rubyCandidate.canonicalPhotoUrl,
      },
    })

    const result = await processSparkleFinderStudioIntakeV2(
      {
        schemaVersion: 2,
        sourceProduct: 'sparkle_finder',
        finderSubmissionId: submissionId,
        action: 'confirm',
        selectedDesignId: rubyCandidate.designId,
      },
      deps,
    )

    expect(deps.resolveExact).toHaveBeenCalledWith(expect.anything(), 'ER59000', {
      designId: rubyCandidate.designId,
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Ruby',
    })
    expect(result).toEqual({
      schemaVersion: 2,
      ok: true,
      status: 'accepted',
      retryable: false,
      mutationReplayed: false,
      suiteDesignId: rubyCandidate.designId,
      resolvedDesign: rubyCandidate,
    })
  })

  it('fails closed when live catalog facts no longer match the stored selected candidate', async () => {
    const deps = makeDeps()
    deps.claim.mockResolvedValueOnce({
      kind: 'claimed',
      action: 'confirm',
      operationToken: '77777777-7777-4777-8777-777777777777',
      resolveResult: {
        schemaVersion: 2,
        ok: true,
        status: 'needs_variant_confirmation',
        retryable: false,
        mutationReplayed: false,
        variantCandidates: [roseCandidate, rubyCandidate],
      },
    })
    deps.resolveExact.mockResolvedValueOnce({ found: false, itemNumber: 'ER59000' })

    const result = await processSparkleFinderStudioIntakeV2(
      {
        schemaVersion: 2,
        sourceProduct: 'sparkle_finder',
        finderSubmissionId: submissionId,
        action: 'confirm',
        selectedDesignId: rubyCandidate.designId,
      },
      deps,
    )

    expect(result).toMatchObject({
      ok: false,
      status: 'invalid_selection',
      retryable: false,
      errorCode: 'selected_design_changed',
    })
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'confirm', result }),
    )
  })

  it('returns stored resolve, confirm, and resume receipts as replays', async () => {
    const stored = {
      schemaVersion: 2 as const,
      ok: true as const,
      status: 'accepted' as const,
      retryable: false as const,
      mutationReplayed: false,
      suiteDesignId: rubyCandidate.designId,
      resolvedDesign: rubyCandidate,
    }

    for (const action of ['resolve', 'confirm', 'resume'] as const) {
      const deps = makeDeps()
      deps.claim.mockResolvedValueOnce({ kind: 'replay', result: stored })
      const request = action === 'resolve'
        ? resolveRequest()
        : action === 'confirm'
          ? {
              schemaVersion: 2,
              sourceProduct: 'sparkle_finder',
              finderSubmissionId: submissionId,
              action,
              selectedDesignId: rubyCandidate.designId,
            }
          : {
              schemaVersion: 2,
              sourceProduct: 'sparkle_finder',
              finderSubmissionId: submissionId,
              action,
            }

      const result = await processSparkleFinderStudioIntakeV2(request, deps)

      expect(result).toEqual({ ...stored, mutationReplayed: true })
      expect(deps.loadCandidates).not.toHaveBeenCalled()
      expect(deps.resolveExact).not.toHaveBeenCalled()
      expect(deps.reviewEvidence).not.toHaveBeenCalled()
    }
  })

  it('returns typed conflicting replay and in-progress outcomes', async () => {
    const conflictDeps = makeDeps()
    conflictDeps.claim.mockResolvedValueOnce({ kind: 'conflict' })
    await expect(processSparkleFinderStudioIntakeV2(resolveRequest(), conflictDeps)).resolves.toMatchObject({
      ok: false,
      status: 'conflicting_replay',
      retryable: false,
    })

    const busyDeps = makeDeps()
    busyDeps.claim.mockResolvedValueOnce({ kind: 'in_progress' })
    await expect(processSparkleFinderStudioIntakeV2(resolveRequest(), busyDeps)).resolves.toMatchObject({
      ok: false,
      status: 'temporary_failure',
      retryable: true,
    })
  })

  it('requires one label and one jewelry asset with internally consistent submission claims', async () => {
    const deps = makeDeps()
    const wrongOwner = resolveRequest()
    wrongOwner.photoEvidence[1].finderSubmissionId = '88888888-8888-4888-8888-888888888888'

    const wrongOwnerResult = await processSparkleFinderStudioIntakeV2(wrongOwner, deps)
    expect(wrongOwnerResult).toMatchObject({
      ok: false,
      status: 'invalid_details',
      errorCode: 'photo_identity_mismatch',
    })
    expect(deps.claim).not.toHaveBeenCalled()

    const duplicateKind = resolveRequest()
    duplicateKind.photoEvidence[1].claimedKind = 'label'
    const duplicateResult = await processSparkleFinderStudioIntakeV2(duplicateKind, deps)
    expect(duplicateResult).toMatchObject({
      ok: false,
      status: 'invalid_details',
      errorCode: 'invalid_photo_evidence',
    })
  })

  it('rejects temporary URLs unless their HTTPS origin is explicitly allowlisted and never stores them', async () => {
    const rejectedDeps = makeDeps()
    const unsafe = resolveRequest()
    unsafe.photoEvidence[0].temporaryReadUrl = 'http://127.0.0.1/private'

    await expect(processSparkleFinderStudioIntakeV2(unsafe, rejectedDeps)).resolves.toMatchObject({
      ok: false,
      status: 'photo_rejected',
      errorCode: 'unsafe_photo_url',
      photoFeedback: expect.any(Array),
    })
    expect(rejectedDeps.claim).not.toHaveBeenCalled()

    const allowedDeps = makeDeps()
    allowedDeps.allowedAssetOrigins = ['https://assets.yoursparklefinder.com']
    const safe = resolveRequest()
    safe.photoEvidence[0].temporaryReadUrl =
      'https://assets.yoursparklefinder.com/signed/temporary-label'
    await processSparkleFinderStudioIntakeV2(safe, allowedDeps)

    expect(allowedDeps.claim).toHaveBeenCalledWith(
      expect.objectContaining({
        resolveInput: expect.objectContaining({
          photoEvidence: expect.objectContaining({
            trust: 'untrusted_manual_review',
            canonicalPhotoEligible: false,
            reviewMode: 'manual_review',
          }),
        }),
      }),
    )
    expect(JSON.stringify(allowedDeps.claim.mock.calls[0][0])).not.toContain('temporary-label')
  })

  it('stores photo rejection distinctly and keeps evidence storage failure retryable', async () => {
    const rejectedDeps = makeDeps()
    rejectedDeps.reviewEvidence = vi.fn().mockResolvedValue({
      status: 'photo_rejected',
      errorCode: 'photo_too_blurry',
      customerMessage: 'Please retake the label photo.',
      photoFeedback: ['Keep the item number in focus.'],
    })
    await expect(processSparkleFinderStudioIntakeV2(resolveRequest(), rejectedDeps)).resolves.toMatchObject({
      ok: false,
      status: 'photo_rejected',
      errorCode: 'photo_too_blurry',
      photoFeedback: ['Keep the item number in focus.'],
    })
    expect(rejectedDeps.complete).toHaveBeenCalledWith(expect.objectContaining({
      action: 'resolve',
      result: expect.objectContaining({ status: 'photo_rejected', retryable: false }),
    }))

    const storageDeps = makeDeps()
    storageDeps.reviewEvidence = vi.fn().mockRejectedValue(new Error('private bucket path'))
    const storageResult = await processSparkleFinderStudioIntakeV2(resolveRequest(), storageDeps)
    expect(storageResult).toMatchObject({
      ok: false,
      status: 'storage_failed',
      retryable: true,
      errorCode: 'evidence_storage_unavailable',
    })
    expect(JSON.stringify(storageResult)).not.toContain('private bucket')
    expect(storageDeps.complete).toHaveBeenCalledWith(expect.objectContaining({
      action: 'resolve',
      result: expect.objectContaining({ status: 'storage_failed', retryable: true }),
    }))
  })

  it('maps the dedicated candidate query with stable ID ordering and a cap sentinel', async () => {
    const rows = [
      {
        id: roseCandidate.designId,
        item_number: roseCandidate.itemNumber,
        design_name: roseCandidate.designName,
        material: roseCandidate.material,
        main_stone: roseCandidate.mainStone,
        canonical_photo_url: roseCandidate.canonicalPhotoUrl,
        type_prefix: 'ER',
        collection: {
          name: roseCandidate.collectionName,
          collection_year: roseCandidate.collectionYear,
        },
      },
    ]
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null })
    const order = vi.fn().mockReturnValue({ limit })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    const result = await loadStudioCandidates({ from } as never, ' er59000 ')

    expect(from).toHaveBeenCalledWith('jewelry_designs')
    expect(eq).toHaveBeenCalledWith('item_number', 'ER59000')
    expect(order).toHaveBeenCalledWith('id', { ascending: true })
    expect(limit).toHaveBeenCalledWith(51)
    expect(result).toEqual([roseCandidate])
  })

  it('fails safely instead of silently truncating more than fifty candidates', async () => {
    const deps = makeDeps()
    deps.loadCandidates.mockResolvedValueOnce(
      Array.from({ length: 51 }, (_, index) => ({
        ...roseCandidate,
        designId: `${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
      })),
    )

    await expect(processSparkleFinderStudioIntakeV2(resolveRequest(), deps)).resolves.toMatchObject({
      ok: false,
      status: 'temporary_failure',
      retryable: false,
      errorCode: 'candidate_set_too_large',
    })
  })

  it('returns typed database failures without exposing provider errors', async () => {
    const deps = makeDeps()
    deps.claim.mockRejectedValueOnce(new Error('postgres password secret-host'))

    const result = await processSparkleFinderStudioIntakeV2(resolveRequest(), deps)

    expect(result).toEqual({
      schemaVersion: 2,
      ok: false,
      status: 'database_failed',
      retryable: true,
      errorCode: 'intake_ledger_unavailable',
      customerMessage: 'Showcase Studio could not save this step right now. Please try again.',
    })
    expect(JSON.stringify(result)).not.toContain('secret-host')
  })

  it('records a retryable typed failure when catalog resolution fails after the ledger claim', async () => {
    const deps = makeDeps()
    deps.loadCandidates.mockRejectedValueOnce(new Error('private database host'))

    const result = await processSparkleFinderStudioIntakeV2(resolveRequest(), deps)

    expect(result).toMatchObject({
      ok: false,
      status: 'database_failed',
      retryable: true,
    })
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resolve', result }),
    )
  })

  it('rejects malformed or unknown v2 request shapes before touching the ledger', async () => {
    const deps = makeDeps()

    const result = await processSparkleFinderStudioIntakeV2(
      { schemaVersion: 3, sourceProduct: 'sparkle_finder', action: 'resolve' },
      deps,
    )

    expect(result).toMatchObject({
      ok: false,
      status: 'invalid_details',
      errorCode: 'invalid_request',
    })
    expect(deps.claim).not.toHaveBeenCalled()
  })

  it('fails closed when a stored ledger receipt is not a strict discriminated result', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        decision: 'replay',
        result: { schemaVersion: 2, ok: true, status: 'unknown_terminal_status' },
      },
      error: null,
    })

    await expect(processSparkleFinderStudioIntakeV2({
      schemaVersion: 2,
      sourceProduct: 'sparkle_finder',
      finderSubmissionId: submissionId,
      action: 'resume',
    }, { supabase: { rpc } as never })).resolves.toMatchObject({
      ok: false,
      status: 'database_failed',
      retryable: true,
    })
  })

  it('finalizes queued manual review from a service-only exact Suite receipt and replays monotonically', async () => {
    const reviewed = {
      schemaVersion: 2 as const,
      ok: true as const,
      status: 'accepted' as const,
      retryable: false as const,
      mutationReplayed: false,
      suiteDesignId: roseCandidate.designId,
      resolvedDesign: roseCandidate,
      reviewReceipt: {
        status: 'review_completed' as const,
        reviewedAt: '2026-08-25T16:00:00.000Z',
        canonicalPhotoControl: 'not_automatically_verified' as const,
      },
    }
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: { decision: 'finalized', result: reviewed }, error: null })
      .mockResolvedValueOnce({ data: { decision: 'replay', result: reviewed }, error: null })
    const supabase = { rpc } as never

    await expect(finalizeSparkleFinderStudioReviewV2({
      supabase,
      finderSubmissionId: submissionId,
      suiteDesignId: roseCandidate.designId,
      reviewerEmail: 'operator@example.com',
      reviewerRepId: '99999999-9999-4999-8999-999999999999',
      reviewNote: 'Matched against the original label and jewelry photos.',
    })).resolves.toEqual(reviewed)
    await expect(finalizeSparkleFinderStudioReviewV2({
      supabase,
      finderSubmissionId: submissionId,
      suiteDesignId: roseCandidate.designId,
      reviewerEmail: 'operator@example.com',
      reviewerRepId: '99999999-9999-4999-8999-999999999999',
      reviewNote: 'Matched against the original label and jewelry photos.',
    })).resolves.toEqual({ ...reviewed, mutationReplayed: true })
    expect(rpc).toHaveBeenCalledWith('rpc_finalize_finder_studio_review_v2', {
      p_finder_submission_id: submissionId,
      p_suite_design_id: roseCandidate.designId,
      p_reviewed_by_email: 'operator@example.com',
      p_reviewed_by_rep_id: '99999999-9999-4999-8999-999999999999',
      p_review_note: 'Matched against the original label and jewelry photos.',
    })

    const resumeRpc = vi.fn().mockResolvedValue({
      data: { decision: 'replay', result: reviewed },
      error: null,
    })
    await expect(processSparkleFinderStudioIntakeV2({
      schemaVersion: 2,
      sourceProduct: 'sparkle_finder',
      finderSubmissionId: submissionId,
      action: 'resume',
    }, { supabase: { rpc: resumeRpc } as never })).resolves.toEqual({
      ...reviewed,
      mutationReplayed: true,
    })
  })

  it('returns typed finalizer conflict, stale selection, invalid terminal stage, and malformed receipt failures', async () => {
    const cases = [
      [{ decision: 'conflict' }, 'conflicting_replay', 'review_already_finalized_differently'],
      [{ decision: 'invalid_selection' }, 'invalid_selection', 'review_design_not_exact'],
      [{ decision: 'invalid_stage' }, 'invalid_selection', 'review_stage_invalid'],
      [{ decision: 'missing' }, 'invalid_selection', 'submission_not_resolved'],
      [{
        decision: 'finalized',
        result: { schemaVersion: 2, ok: true, status: 'published' },
      }, 'database_failed', 'intake_ledger_unavailable'],
    ] as const

    for (const [data, status, errorCode] of cases) {
      const rpc = vi.fn().mockResolvedValue({ data, error: null })
      await expect(finalizeSparkleFinderStudioReviewV2({
        supabase: { rpc } as never,
        finderSubmissionId: submissionId,
        suiteDesignId: roseCandidate.designId,
        reviewerEmail: 'operator@example.com',
        reviewerRepId: '99999999-9999-4999-8999-999999999999',
      })).resolves.toMatchObject({ ok: false, status, errorCode })
    }
  })

  it('lists a bounded operator queue with stable untrusted evidence metadata only', async () => {
    const rows = [{
      finder_submission_id: submissionId,
      resolve_input: {
        labelDetails: { itemNumber: 'ER59000', designName: 'Baguette Braid Sparkle' },
        photoEvidence: {
          trust: 'untrusted_manual_review',
          canonicalPhotoEligible: false,
          reviewMode: 'manual_review',
          assets: [
            { finderSubmissionId: submissionId, finderAssetId: labelAssetId, claimedKind: 'label' },
            { finderSubmissionId: submissionId, finderAssetId: jewelryAssetId, claimedKind: 'jewelry' },
          ],
        },
        customerNoteHash: null,
      },
      resolve_result: {
        schemaVersion: 2,
        ok: true,
        status: 'publish_queued',
        retryable: false,
        mutationReplayed: false,
        catalogDraft: { itemNumber: 'ER59000', designName: 'Baguette Braid Sparkle' },
      },
      created_at: '2026-08-25T15:00:00.000Z',
      updated_at: '2026-08-25T15:01:00.000Z',
    }]
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null })
    const secondOrder = vi.fn().mockReturnValue({ limit })
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder })
    const is = vi.fn().mockReturnValue({ order: firstOrder })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    const result = await listSparkleFinderStudioReviewQueue({
      supabase: { from } as never,
      limit: 10,
    })

    expect(limit).toHaveBeenCalledWith(11)
    expect(result).toEqual({
      items: [{
        finderSubmissionId: submissionId,
        submittedAt: '2026-08-25T15:00:00.000Z',
        updatedAt: '2026-08-25T15:01:00.000Z',
        catalogDraft: { itemNumber: 'ER59000', designName: 'Baguette Braid Sparkle' },
        photoEvidence: {
          trust: 'untrusted_manual_review',
          canonicalPhotoEligible: false,
          assets: [
            { finderAssetId: labelAssetId, claimedKind: 'label' },
            { finderAssetId: jewelryAssetId, claimedKind: 'jewelry' },
          ],
        },
      }],
      hasMore: false,
    })
    expect(JSON.stringify(result)).not.toMatch(/temporaryReadUrl|customerNoteHash/i)
  })
})

function resolveRequest(
  overrides: {
    labelDetails?: SparkleFinderStudioCatalogDraft
    photoEvidence?: ReturnType<typeof baseResolveRequest>['photoEvidence']
  } = {},
) {
  const base = baseResolveRequest()
  return {
    ...base,
    ...overrides,
    labelDetails: overrides.labelDetails ?? base.labelDetails,
    photoEvidence: overrides.photoEvidence ?? base.photoEvidence,
  }
}

function baseResolveRequest() {
  return {
    schemaVersion: 2 as const,
    sourceProduct: 'sparkle_finder' as const,
    finderSubmissionId: submissionId,
    action: 'resolve' as const,
    labelDetails: { itemNumber: 'ER59000' },
    photoEvidence: [
      {
        finderSubmissionId: submissionId,
        finderAssetId: labelAssetId,
        claimedKind: 'label' as const,
        temporaryReadUrl: undefined as string | undefined,
      },
      {
        finderSubmissionId: submissionId,
        finderAssetId: jewelryAssetId,
        claimedKind: 'jewelry' as const,
        temporaryReadUrl: undefined as string | undefined,
      },
    ],
  }
}

function makeDeps() {
  type Claim = NonNullable<SparkleFinderStudioIntakeV2Deps['claim']>
  type Complete = NonNullable<SparkleFinderStudioIntakeV2Deps['complete']>
  type ReviewEvidence = NonNullable<SparkleFinderStudioIntakeV2Deps['reviewEvidence']>
  type LoadCandidates = NonNullable<SparkleFinderStudioIntakeV2Deps['loadCandidates']>
  type ResolveExact = NonNullable<SparkleFinderStudioIntakeV2Deps['resolveExact']>

  const claim = vi.fn<Claim>().mockResolvedValue({
    kind: 'claimed',
    action: 'resolve',
    operationToken: '77777777-7777-4777-8777-777777777777',
  })
  const complete = vi.fn<Complete>().mockResolvedValue(undefined)
  const reviewEvidence = vi.fn<ReviewEvidence>().mockResolvedValue({ status: 'manual_review_required' })
  const loadCandidates = vi.fn<LoadCandidates>().mockResolvedValue([roseCandidate, rubyCandidate])
  const resolveExact = vi.fn<ResolveExact>()

  return {
    supabase: {} as never,
    allowedAssetOrigins: [] as string[],
    claim,
    complete,
    reviewEvidence,
    loadCandidates,
    resolveExact,
  }
}
