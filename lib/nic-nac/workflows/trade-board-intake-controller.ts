import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import { mergeTradeBoardKnownFields } from './trade-board-known-fields'
import type {
  TradeBoardIntakeNextAction,
  TradeBoardIntakePhase,
  TradeBoardIntakePromptState,
  TradeBoardIntakeSessionState,
} from './trade-board-intake-types'

export function createEmptyTradeBoardIntakeState(args: {
  id: string
  repId: string
  conversationId: string
}): TradeBoardIntakeSessionState {
  const state: TradeBoardIntakeSessionState = {
    id: args.id,
    repId: args.repId,
    conversationId: args.conversationId,
    workflowType: 'trade_board_add_listing',
    status: 'active',
    phase: 'started',
    known: {},
    missing: [],
    blockers: [],
    warnings: [],
    photos: [],
  }
  const readiness = computeTradeBoardIntakeReadiness(state)
  return {
    ...state,
    missing: readiness.missing,
    blockers: readiness.blockers,
  }
}

export function computeTradeBoardIntakeReadiness(
  state: TradeBoardIntakeSessionState,
): {
  ready: boolean
  missing: string[]
  blockers: string[]
  nextAction: TradeBoardIntakeNextAction
} {
  const missing: string[] = []
  const blockers: string[] = []
  const known = state.known
  const labelDetailsPhoto = state.photos.find(
    (photo) => photo.declaredRole === 'label_details',
  )
  const jewelryFrontPhoto = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' && photo.quality !== 'blocked',
  )
  const blockedLabel = state.photos.find(
    (photo) =>
      photo.declaredRole === 'label_details' && photo.quality === 'blocked',
  )
  const blockedJewelry = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' && photo.quality === 'blocked',
  )

  if (!known.itemNumber) missing.push('itemNumber')
  if (!known.designName) missing.push('designName')
  if (!known.collectionName) missing.push('collectionName')
  if (!labelDetailsPhoto && !known.itemNumber) missing.push('labelDetailsPhoto')
  if (!jewelryFrontPhoto) missing.push('jewelryFrontPhoto')
  if (blockedLabel) blockers.push('labelPhotoUnreadable')
  if (blockedJewelry) blockers.push('jewelryPhotoUnusable')

  const ready = missing.length === 0 && blockers.length === 0
  return {
    ready,
    missing,
    blockers,
    nextAction: chooseNextAction({ ready, missing, blockers }),
  }
}

export function computeTradeBoardAddAttemptReadiness(
  state: TradeBoardIntakeSessionState,
  input: {
    itemNumber?: string
    designName?: string
    collectionName?: string
    collectionYear?: number
  },
): {
  ready: boolean
  missing: string[]
  blockers: string[]
  nextAction: TradeBoardIntakeNextAction
} {
  const known = mergeTradeBoardKnownFields(state.known, {
    itemNumber: normalizeOptionalText(input.itemNumber)?.toUpperCase(),
    designName: normalizeOptionalText(input.designName),
    collectionName: normalizeOptionalText(input.collectionName),
    collectionYear: input.collectionYear,
  })
  const missing: string[] = []
  const blockers: string[] = []

  const jewelryFrontPhoto = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' && photo.quality !== 'blocked',
  )
  const blockedLabel = state.photos.find(
    (photo) =>
      photo.declaredRole === 'label_details' && photo.quality === 'blocked',
  )
  const blockedJewelry = state.photos.find(
    (photo) =>
      photo.declaredRole === 'jewelry_front' && photo.quality === 'blocked',
  )

  if (!known.itemNumber) missing.push('itemNumber')
  if (!jewelryFrontPhoto) missing.push('jewelryFrontPhoto')
  if (blockedLabel) blockers.push('labelPhotoUnreadable')
  if (blockedJewelry) blockers.push('jewelryPhotoUnusable')

  const ready = missing.length === 0 && blockers.length === 0
  return {
    ready,
    missing,
    blockers,
    nextAction: chooseNextAction({ ready, missing, blockers }),
  }
}

export function transitionTradeBoardIntake(
  state: TradeBoardIntakeSessionState,
  event:
    | { type: 'cancel' }
    | { type: 'expire' }
    | { type: 'escalate' }
    | { type: 'authorize_add_listing' }
    | { type: 'mark_completed'; listingIds: string[]; designId?: string },
): TradeBoardIntakeSessionState {
  if (event.type === 'cancel') {
    return { ...state, status: 'cancelled', phase: 'cancelled' }
  }
  if (event.type === 'expire') {
    return { ...state, status: 'expired' }
  }
  if (event.type === 'escalate') {
    return {
      ...state,
      status: 'needs_human_review',
      phase: 'needs_human_review',
    }
  }
  if (event.type === 'authorize_add_listing') {
    const readiness = computeTradeBoardIntakeReadiness(state)
    if (!readiness.ready) {
      return {
        ...state,
        phase: inferPhase({
          ...state,
          missing: readiness.missing,
          blockers: readiness.blockers,
        }),
        missing: readiness.missing,
        blockers: readiness.blockers,
      }
    }
    return { ...state, phase: 'adding', missing: [], blockers: [] }
  }
  return {
    ...state,
    status: 'completed',
    phase: 'completed',
    createdListingIds: event.listingIds,
    createdDesignId: event.designId,
  }
}

export function getTradeBoardIntakeToolsRequired(
  state: TradeBoardIntakeSessionState | null,
): NicNacToolIntent[] {
  if (!state || state.status !== 'active') return []
  return ['trade_board', 'catalog']
}

export function buildTradeBoardIntakePromptState(
  state: TradeBoardIntakeSessionState,
): TradeBoardIntakePromptState {
  const readiness = computeTradeBoardIntakeReadiness(state)
  const normalized = {
    ...state,
    missing: readiness.missing,
    blockers: readiness.blockers,
  }
  return {
    workflow: {
      id: state.id,
      type: state.workflowType,
      status: state.status,
      phase: inferPhase(normalized),
    },
    known: state.known,
    photos: state.photos.map((photo, index) => ({
      index: index + 1,
      declaredRole: photo.declaredRole,
      visualRole: photo.visualRole,
      roleConfirmed: photo.roleConfirmed,
      quality: photo.quality,
      notes: photo.notes,
    })),
    missing: readiness.missing,
    blockers: readiness.blockers,
    nextAction: readiness.nextAction,
    hardRules: [
      'label_details photos cannot satisfy jewelry_front',
      'visible jewelry in a label_details photo does not change its declared role',
      'boxed display jewelry photos are acceptable when centered, close, clear, and website-worthy',
      'do not ask for unboxed jewelry, plain background, or no packaging for a usable boxed display photo',
    ],
  }
}

function inferPhase(state: TradeBoardIntakeSessionState): TradeBoardIntakePhase {
  if (state.status !== 'active') {
    if (state.status === 'completed') return 'completed'
    if (state.status === 'cancelled') return 'cancelled'
    if (state.status === 'needs_human_review') return 'needs_human_review'
    return state.phase
  }
  if (state.phase === 'adding') return 'adding'
  if (state.blockers.length > 0) return 'photo_capture'
  if (
    state.missing.includes('itemNumber') ||
    state.missing.includes('collectionName') ||
    state.missing.includes('designName')
  ) {
    return 'details_capture'
  }
  if (state.missing.includes('jewelryFrontPhoto')) return 'photo_capture'
  if (state.known.itemNumber) return 'ready_to_add'
  return 'started'
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function chooseNextAction(args: {
  ready: boolean
  missing: string[]
  blockers: string[]
}): TradeBoardIntakeNextAction {
  if (args.blockers.includes('labelPhotoUnreadable')) {
    return 'ask_for_label_details_photo'
  }
  if (args.blockers.includes('jewelryPhotoUnusable')) {
    return 'ask_for_jewelry_front_photo'
  }
  if (args.ready) return 'call_add_listing'
  if (args.missing.includes('itemNumber')) return 'ask_for_item_number'
  if (args.missing.includes('collectionName')) return 'ask_for_collection'
  if (args.missing.includes('labelDetailsPhoto')) {
    return 'ask_for_label_details_photo'
  }
  if (args.missing.includes('jewelryFrontPhoto')) {
    return 'ask_for_jewelry_front_photo'
  }
  return 'confirm_extracted_details'
}
