export type TradeBoardIntakeWorkflowType = 'trade_board_add_listing'

export type TradeBoardIntakeStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'needs_human_review'

export type TradeBoardIntakePhase =
  | 'started'
  | 'details_capture'
  | 'photo_capture'
  | 'catalog_match'
  | 'ready_to_add'
  | 'adding'
  | 'completed'
  | 'cancelled'
  | 'needs_human_review'

export type TradeBoardPhotoDeclaredRole =
  | 'label_details'
  | 'jewelry_front'
  | 'unknown'
  | 'other'

export type TradeBoardPhotoVisualRole =
  | 'jewelry'
  | 'label_or_packaging'
  | 'uncertain'

export type TradeBoardPhotoQuality =
  | 'usable'
  | 'warning'
  | 'blocked'
  | 'unknown'

export type TradeBoardIntakeNextAction =
  | 'ask_for_item_number'
  | 'ask_for_label_details_photo'
  | 'ask_for_jewelry_front_photo'
  | 'ask_for_collection'
  | 'confirm_extracted_details'
  | 'call_search_jewelry_database'
  | 'call_add_listing'
  | 'ask_photo_role_clarification'
  | 'escalate_to_human_review'

export type TradeBoardIntakeToolPolicySource =
  | 'mode_required_setup'
  | 'active_workflow'
  | 'latest_turn_intent'
  | 'fallback_memory'
  | 'fallback_resources'

export interface TradeBoardIntakeKnownFields {
  itemNumber?: string
  quantity?: number
  designName?: string
  collectionName?: string
  collectionYear?: number
  material?: string
  mainStone?: string
  bpMsrp?: number
  ringSize?: string
  repNotes?: string
  tradePreferences?: string
}

export interface TradeBoardIntakePhotoState {
  id?: string
  conversationMessageId?: string
  attachmentIndex: number
  declaredRole: TradeBoardPhotoDeclaredRole
  visualRole: TradeBoardPhotoVisualRole
  roleConfirmed: boolean
  imageUrl?: string
  quality: TradeBoardPhotoQuality
  qualityScore?: number
  qualityIssues: string[]
  notes: string[]
}

export interface TradeBoardIntakeSessionState {
  id: string
  repId: string
  conversationId: string
  workflowType: TradeBoardIntakeWorkflowType
  status: TradeBoardIntakeStatus
  phase: TradeBoardIntakePhase
  known: TradeBoardIntakeKnownFields
  missing: string[]
  blockers: string[]
  warnings: string[]
  photos: TradeBoardIntakePhotoState[]
  createdListingIds?: string[]
  createdDesignId?: string
  lastUserMessageId?: string
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
}

export interface TradeBoardIntakePromptState {
  workflow: {
    id: string
    type: TradeBoardIntakeWorkflowType
    status: TradeBoardIntakeStatus
    phase: TradeBoardIntakePhase
  }
  known: TradeBoardIntakeKnownFields
  photos: Array<{
    index: number
    declaredRole: TradeBoardPhotoDeclaredRole
    visualRole: TradeBoardPhotoVisualRole
    roleConfirmed: boolean
    quality: TradeBoardPhotoQuality
    notes: string[]
  }>
  missing: string[]
  blockers: string[]
  nextAction: TradeBoardIntakeNextAction
  hardRules: string[]
}
