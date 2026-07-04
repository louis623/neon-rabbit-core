import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

export type TradeWorkflowType =
  | 'trade_board_add_listing'
  | 'trade_board_remove_listing'
  | 'trade_request_decision'
  | 'trade_swap_capture'
  | 'trade_swap_cleanup'
  | 'trade_fulfillment_update'
  | 'trade_catalog_correction'

export type TradeWorkflowStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'needs_human_review'

export type TradeWorkflowPhase =
  | 'started'
  | 'identify_target'
  | 'details_capture'
  | 'photo_capture'
  | 'approval_required'
  | 'ready_to_add'
  | 'ready_to_remove'
  | 'ready_to_approve'
  | 'ready_to_reject'
  | 'ready_to_update'
  | 'ready_to_report'
  | 'mutating'
  | 'completed'
  | 'cancelled'
  | 'needs_human_review'

export type TradeWorkflowIntent =
  | 'add_listing'
  | 'remove_listing'
  | 'approve_trade'
  | 'approve_trade_swap'
  | 'reject_trade'
  | 'resolve_swap_cleanup'
  | 'update_fulfillment_status'
  | 'report_catalog_issue'
  | 'unknown'

export type TradeWorkflowApprovalState =
  | 'not_required'
  | 'required'
  | 'approved'
  | 'denied'

export interface TradeWorkflowKnownFields {
  itemNumber?: string
  material?: string
  listingId?: string
  removalReason?: 'sold' | 'keeping' | 'mistake' | 'other'
  requestId?: string
  swapId?: string
  fulfillmentRequestId?: string
  decision?: 'approve' | 'reject'
  revealedItemNumber?: string
  revealedMaterial?: string
  revealedRingSize?: string
  nextFulfillmentStatus?: 'approved' | 'shipped' | 'completed'
  catalogIssueType?:
    | 'wrong_item_number'
    | 'wrong_collection_year'
    | 'wrong_design_name'
    | 'wrong_msrp'
    | 'wrong_jewelry_type'
    | 'wrong_material'
    | 'wrong_stone'
    | 'wrong_tags'
    | 'wrong_details'
    | 'wrong_collection'
    | 'bad_canonical_photo'
    | 'bad_photo'
    | 'duplicate'
    | 'missing_variant'
    | 'other'
  catalogCorrectionFields?: Record<string, unknown>
  duplicatePhysicalConfirmed?: boolean
  skipReplacementCapture?: boolean
}

export interface TradeWorkflowCandidate {
  id: string
  kind: 'listing' | 'trade_request' | 'swap' | 'fulfillment' | 'catalog_design'
  itemNumber?: string
  designName?: string
  status?: string
  summary: string
  risk?: 'low' | 'medium' | 'high'
}

export interface TradeWorkflowMutationId {
  kind:
    | 'listing'
    | 'trade_request'
    | 'trade_swap'
    | 'fulfillment'
    | 'catalog_design'
    | 'catalog_issue'
  id: string
}

export interface TradeWorkflowSessionState {
  id: string
  repId: string
  conversationId: string
  workflowType: TradeWorkflowType
  status: TradeWorkflowStatus
  phase: TradeWorkflowPhase
  intent: TradeWorkflowIntent
  knownFields: TradeWorkflowKnownFields
  missingFields: string[]
  blockers: string[]
  candidates: TradeWorkflowCandidate[]
  approvalState: TradeWorkflowApprovalState
  dbAssertions?: Record<string, unknown>
  publicProof?: Record<string, unknown>
  createdMutationIds?: TradeWorkflowMutationId[]
  lastUserMessageId?: string
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
}

export function getTradeWorkflowToolIntents(
  state: Pick<TradeWorkflowSessionState, 'status' | 'workflowType' | 'intent'>,
): NicNacToolIntent[] {
  if (state.status !== 'active') return []

  switch (state.workflowType) {
    case 'trade_board_add_listing':
      return ['trade_board', 'catalog']
    case 'trade_board_remove_listing':
      return ['trade_board']
    case 'trade_request_decision':
      return ['trade_requests']
    case 'trade_swap_capture':
      return ['trade_requests', 'trade_board', 'catalog']
    case 'trade_swap_cleanup':
      return ['trade_requests', 'trade_board', 'catalog']
    case 'trade_fulfillment_update':
      return ['fulfillment', 'trade_board']
    case 'trade_catalog_correction':
      return ['catalog', 'trade_board']
    default:
      return []
  }
}
