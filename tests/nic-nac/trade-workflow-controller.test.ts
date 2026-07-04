import { describe, expect, it } from 'vitest'
import { computeTradeWorkflowReadiness } from '@/lib/nic-nac/workflows/trade-workflow-controller'
import { getTradeWorkflowToolIntents } from '@/lib/nic-nac/workflows/trade-workflow-types'

describe('trade workflow controller', () => {
  it('keeps remove-listing workflows from mutating ambiguous item-number candidates', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_board_remove_listing',
      knownFields: { itemNumber: 'ER13229' },
      candidateCount: 2,
      approvalState: 'required',
    })

    expect(readiness.phase).toBe('identify_target')
    expect(readiness.missingFields).toEqual(['listingId'])
    expect(readiness.blockers).toEqual(['ambiguousListingCandidate'])
  })

  it('requires approval before a selected listing can be removed', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_board_remove_listing',
      knownFields: { listingId: 'listing-1', itemNumber: 'ER13229' },
      candidateCount: 1,
      approvalState: 'required',
    })

    expect(readiness.phase).toBe('approval_required')
    expect(readiness.missingFields).toEqual([])
    expect(readiness.blockers).toEqual([])
  })

  it('blocks ambiguous trade request decisions before approving or rejecting', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_request_decision',
      knownFields: {},
      candidateCount: 2,
    })

    expect(readiness.phase).toBe('identify_target')
    expect(readiness.missingFields).toEqual(['requestId'])
    expect(readiness.blockers).toEqual(['ambiguousTradeRequestCandidate'])
  })

  it('treats approved removal as ready to remove', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_board_remove_listing',
      knownFields: { listingId: 'listing-1', itemNumber: 'ER13229' },
      candidateCount: 1,
      approvalState: 'approved',
    })

    expect(readiness.phase).toBe('ready_to_remove')
  })

  it('requires revealed item details or an explicit skip for live swap capture', () => {
    expect(
      computeTradeWorkflowReadiness({
        workflowType: 'trade_swap_capture',
        knownFields: { requestId: 'request-1' },
        approvalState: 'required',
      }),
    ).toMatchObject({
      phase: 'details_capture',
      missingFields: ['revealedItemNumber'],
    })

    expect(
      computeTradeWorkflowReadiness({
        workflowType: 'trade_swap_capture',
        knownFields: { requestId: 'request-1', skipReplacementCapture: true },
        approvalState: 'required',
      }),
    ).toMatchObject({
      phase: 'approval_required',
      missingFields: [],
    })
  })

  it('blocks ambiguous fulfillment updates before changing status', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_fulfillment_update',
      knownFields: { nextFulfillmentStatus: 'shipped' },
      candidateCount: 2,
    })

    expect(readiness.phase).toBe('identify_target')
    expect(readiness.missingFields).toEqual(['requestId'])
    expect(readiness.blockers).toEqual(['ambiguousFulfillmentCandidate'])
  })

  it('requires ring size for ring swap cleanup', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_swap_cleanup',
      knownFields: { swapId: 'swap-1', revealedItemNumber: 'RG12345' },
    })

    expect(readiness.phase).toBe('details_capture')
    expect(readiness.missingFields).toEqual(['revealedRingSize'])
  })

  it('blocks ambiguous swap cleanup candidates before linking replacement listings', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_swap_cleanup',
      knownFields: { revealedItemNumber: 'ER13229' },
      candidateCount: 2,
    })

    expect(readiness.phase).toBe('details_capture')
    expect(readiness.missingFields).toEqual(['swapId'])
    expect(readiness.blockers).toEqual(['ambiguousSwapCandidate'])
  })

  it('requires approval for shared catalog correction fields', () => {
    const readiness = computeTradeWorkflowReadiness({
      workflowType: 'trade_catalog_correction',
      knownFields: {
        itemNumber: 'ER13229',
        catalogIssueType: 'bad_canonical_photo',
        catalogCorrectionFields: { canonicalPhotoUrl: 'https://example.com/approved/photo.jpg' },
      },
      approvalState: 'required',
    })

    expect(readiness.phase).toBe('approval_required')
  })

  it('maps active trade workflows to the tool packs that must stay available', () => {
    expect(
      getTradeWorkflowToolIntents({
        status: 'active',
        workflowType: 'trade_swap_capture',
        intent: 'approve_trade_swap',
      }),
    ).toEqual(['trade_requests', 'trade_board', 'catalog'])

    expect(
      getTradeWorkflowToolIntents({
        status: 'completed',
        workflowType: 'trade_swap_capture',
        intent: 'approve_trade_swap',
      }),
    ).toEqual([])
  })
})
