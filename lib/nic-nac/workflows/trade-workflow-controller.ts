import type {
  TradeWorkflowApprovalState,
  TradeWorkflowIntent,
  TradeWorkflowKnownFields,
  TradeWorkflowPhase,
  TradeWorkflowType,
} from './trade-workflow-types'

export function inferTradeWorkflowIntent(type: TradeWorkflowType): TradeWorkflowIntent {
  switch (type) {
    case 'trade_board_add_listing':
      return 'add_listing'
    case 'trade_board_remove_listing':
      return 'remove_listing'
    case 'trade_request_decision':
      return 'approve_trade'
    case 'trade_swap_capture':
      return 'approve_trade_swap'
    case 'trade_swap_cleanup':
      return 'resolve_swap_cleanup'
    case 'trade_fulfillment_update':
      return 'update_fulfillment_status'
    case 'trade_catalog_correction':
      return 'report_catalog_issue'
    default:
      return 'unknown'
  }
}

export function computeTradeWorkflowReadiness(args: {
  workflowType: TradeWorkflowType
  intent?: TradeWorkflowIntent
  knownFields: TradeWorkflowKnownFields
  candidateCount?: number
  approvalState?: TradeWorkflowApprovalState
}): { phase: TradeWorkflowPhase; missingFields: string[]; blockers: string[] } {
  const intent = args.intent ?? inferTradeWorkflowIntent(args.workflowType)
  const missingFields: string[] = []
  const blockers: string[] = []
  const candidateCount = args.candidateCount ?? 0
  const approvalState = args.approvalState ?? 'not_required'

  if (args.workflowType === 'trade_board_remove_listing') {
    if (!args.knownFields.listingId) missingFields.push('listingId')
    if (candidateCount > 1 && !args.knownFields.listingId) {
      blockers.push('ambiguousListingCandidate')
    }
    return readyWithApproval({
      missingFields,
      blockers,
      approvalState,
      readyPhase: 'ready_to_remove',
      identifyPhase: 'identify_target',
    })
  }

  if (args.workflowType === 'trade_request_decision') {
    if (!args.knownFields.requestId) missingFields.push('requestId')
    if (candidateCount > 1 && !args.knownFields.requestId) {
      blockers.push('ambiguousTradeRequestCandidate')
    }
    if (intent === 'reject_trade') {
      return readyWithApproval({
        missingFields,
        blockers,
        approvalState,
        readyPhase: 'ready_to_reject',
        identifyPhase: 'identify_target',
      })
    }
    return readyWithApproval({
      missingFields,
      blockers,
      approvalState,
      readyPhase: 'ready_to_approve',
      identifyPhase: 'identify_target',
    })
  }

  if (args.workflowType === 'trade_swap_capture') {
    if (!args.knownFields.requestId) missingFields.push('requestId')
    if (candidateCount > 1 && !args.knownFields.requestId) {
      blockers.push('ambiguousTradeRequestCandidate')
    }
    if (!args.knownFields.revealedItemNumber && !args.knownFields.skipReplacementCapture) {
      missingFields.push('revealedItemNumber')
    }
    return readyWithApproval({
      missingFields,
      blockers,
      approvalState,
      readyPhase: 'ready_to_approve',
      identifyPhase: 'details_capture',
    })
  }

  if (args.workflowType === 'trade_swap_cleanup') {
    if (!args.knownFields.swapId) missingFields.push('swapId')
    if (candidateCount > 1 && !args.knownFields.swapId) {
      blockers.push('ambiguousSwapCandidate')
    }
    if (!args.knownFields.revealedItemNumber) missingFields.push('revealedItemNumber')
    if (isRingItem(args.knownFields.revealedItemNumber) && !args.knownFields.revealedRingSize) {
      missingFields.push('revealedRingSize')
    }
    return {
      phase: missingFields.length ? 'details_capture' : 'ready_to_update',
      missingFields,
      blockers,
    }
  }

  if (args.workflowType === 'trade_fulfillment_update') {
    if (!args.knownFields.fulfillmentRequestId && !args.knownFields.requestId) {
      missingFields.push('requestId')
    }
    if (
      candidateCount > 1 &&
      !args.knownFields.fulfillmentRequestId &&
      !args.knownFields.requestId
    ) {
      blockers.push('ambiguousFulfillmentCandidate')
    }
    if (!args.knownFields.nextFulfillmentStatus) missingFields.push('nextFulfillmentStatus')
    return {
      phase: missingFields.length ? 'identify_target' : 'ready_to_update',
      missingFields,
      blockers,
    }
  }

  if (args.workflowType === 'trade_catalog_correction') {
    if (!args.knownFields.itemNumber) missingFields.push('itemNumber')
    if (!args.knownFields.catalogIssueType) missingFields.push('catalogIssueType')
    const appliesSharedCorrection =
      Object.keys(args.knownFields.catalogCorrectionFields ?? {}).length > 0
    return readyWithApproval({
      missingFields,
      blockers,
      approvalState: appliesSharedCorrection ? approvalState : 'not_required',
      readyPhase: 'ready_to_report',
      identifyPhase: 'details_capture',
    })
  }

  return {
    phase: 'details_capture',
    missingFields,
    blockers,
  }
}

function readyWithApproval(args: {
  missingFields: string[]
  blockers: string[]
  approvalState: TradeWorkflowApprovalState
  readyPhase: TradeWorkflowPhase
  identifyPhase: TradeWorkflowPhase
}): { phase: TradeWorkflowPhase; missingFields: string[]; blockers: string[] } {
  if (args.missingFields.length || args.blockers.length) {
    return {
      phase: args.identifyPhase,
      missingFields: args.missingFields,
      blockers: args.blockers,
    }
  }
  if (args.approvalState === 'required') {
    return {
      phase: 'approval_required',
      missingFields: args.missingFields,
      blockers: args.blockers,
    }
  }
  return {
    phase: args.readyPhase,
    missingFields: args.missingFields,
    blockers: args.blockers,
  }
}

function isRingItem(itemNumber: string | undefined): boolean {
  return /^RG/i.test(itemNumber ?? '')
}
