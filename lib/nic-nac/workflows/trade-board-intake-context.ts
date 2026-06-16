import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import {
  extractKnownFieldsFromCatalogToolOutputs,
  extractKnownFieldsFromText,
  mergeTradeBoardKnownFields,
} from './trade-board-known-fields'
import {
  buildTradeBoardIntakePromptState,
  computeTradeBoardIntakeReadiness,
  getTradeBoardIntakeToolsRequired,
} from './trade-board-intake-controller'
import { renderTradeBoardIntakePromptState } from './trade-board-intake-prompt'
import type {
  TradeBoardIntakeSessionState,
  TradeBoardIntakeToolPolicySource,
  TradeBoardPhotoDeclaredRole,
  TradeBoardPhotoVisualRole,
} from './trade-board-intake-types'
import {
  createTradeBoardIntakeSession,
  getActiveTradeBoardIntakeSession,
  updateTradeBoardIntakeSession,
  upsertTradeBoardIntakePhoto,
} from './trade-board-intake-store'

export function inferDeclaredPhotoRoleFromConversation(
  messages: UIMessage[],
  attachmentIndex: number,
): TradeBoardPhotoDeclaredRole {
  const latestUserIndex = findLatestUserMessageIndex(messages)
  if (latestUserIndex === -1) return 'unknown'
  const latestUser = messages[latestUserIndex]
  const fileParts = (latestUser.parts ?? []).filter(
    (part) =>
      (part as { type?: string; mediaType?: string }).type === 'file' &&
      (part as { mediaType?: string }).mediaType?.startsWith('image/'),
  )
  if (!fileParts[attachmentIndex]) return 'unknown'

  const latestText = getMessageText(latestUser)
  const latestRole = inferRoleFromText(latestText)
  if (latestRole !== 'unknown') return latestRole

  const previousAssistant = messages
    .slice(0, latestUserIndex)
    .reverse()
    .find((message) => message.role === 'assistant')
  return inferRoleFromText(getMessageText(previousAssistant))
}

export function mergeWorkflowToolIntents(
  latestIntents: NicNacToolIntent[],
  workflowIntents: NicNacToolIntent[],
): NicNacToolIntent[] {
  const merged: NicNacToolIntent[] = []
  for (const intent of [...latestIntents, ...workflowIntents]) {
    if (!merged.includes(intent)) merged.push(intent)
  }
  return merged
}

export async function getOrCreateTradeBoardIntakeContext(args: {
  supabase: SupabaseClient
  workflowSupabase?: SupabaseClient
  repId: string
  conversationId: string
  messages: UIMessage[]
  latestUserMessageId?: string
  mode: 'workspace' | 'required_setup'
  nowIso: string
}): Promise<{
  sessionBefore: TradeBoardIntakeSessionState | null
  sessionAfter: TradeBoardIntakeSessionState | null
  workflowIntents: NicNacToolIntent[]
  toolPolicySource: TradeBoardIntakeToolPolicySource
  workflowPromptState: string
}> {
  if (args.mode !== 'workspace') {
    return emptyWorkflowContext('mode_required_setup')
  }

  try {
    const workflowSupabase = args.workflowSupabase ?? args.supabase
    const existing = await getActiveTradeBoardIntakeSession(workflowSupabase, {
      repId: args.repId,
      conversationId: args.conversationId,
      nowIso: args.nowIso,
    })
    const shouldStart = existing !== null || hasTradeBoardIntakeSignal(args.messages)
    if (!shouldStart) {
      return emptyWorkflowContext('latest_turn_intent')
    }

    const baseSession =
      existing ??
      (await createTradeBoardIntakeSession(workflowSupabase, {
        repId: args.repId,
        conversationId: args.conversationId,
        lastUserMessageId: args.latestUserMessageId,
      }))
    const ingested = await ingestLatestTradeBoardIntakeTurn(workflowSupabase, {
      session: baseSession,
      messages: args.messages,
      latestUserMessageId: args.latestUserMessageId,
    })
    const promptState = buildTradeBoardIntakePromptState(ingested)

    return {
      sessionBefore: existing,
      sessionAfter: ingested,
      workflowIntents: getTradeBoardIntakeToolsRequired(ingested),
      toolPolicySource: 'active_workflow',
      workflowPromptState: renderTradeBoardIntakePromptState(promptState),
    }
  } catch (err) {
    if (isMissingWorkflowSchemaError(err)) {
      console.warn('[nic-nac] Trade Board intake workflow schema is unavailable', {
        conversationId: args.conversationId,
      })
      return emptyWorkflowContext('latest_turn_intent')
    }
    throw err
  }
}

export function hasTradeBoardIntakeSignal(messages: UIMessage[]): boolean {
  const latestUser = [...messages].reverse().find((message) => message.role === 'user')
  const text = getMessageText(latestUser)
  const previousAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')
  const assistantText = getMessageText(previousAssistant)

  return (
    /\badd\b[\s\S]{0,80}\b(trade board|board|listing|piece|item)\b/i.test(text) ||
    /\b[A-Z]{1,4}\d{3,}\b/.test(text) ||
    (hasImagePart(latestUser) &&
      /\b(label|details|tag|jewelry|customer-facing|trade board|add a piece)\b/i.test(
        assistantText,
      ))
  )
}

export async function ingestLatestTradeBoardIntakeTurn(
  supabase: SupabaseClient,
  args: {
    session: TradeBoardIntakeSessionState
    messages: UIMessage[]
    latestUserMessageId?: string
  },
): Promise<TradeBoardIntakeSessionState> {
  const latestUserIndex = findLatestUserMessageIndex(args.messages)
  if (latestUserIndex === -1) return args.session
  const latestUser = args.messages[latestUserIndex]
  const latestUserText = getMessageText(latestUser)
  const known = mergeTradeBoardKnownFields(
    mergeTradeBoardKnownFields(
      args.session.known,
      extractKnownFieldsFromCatalogToolOutputs(args.messages),
    ),
    extractKnownFieldsFromText(latestUserText),
  )
  const photos = [...args.session.photos]
  const fileParts = (latestUser.parts ?? []).filter(
    (part) =>
      (part as { type?: string; mediaType?: string }).type === 'file' &&
      (part as { mediaType?: string }).mediaType?.startsWith('image/'),
  ) as Array<{ type?: string; mediaType?: string; url?: string }>

  for (const [index, filePart] of fileParts.entries()) {
    const declaredRole = inferDeclaredPhotoRoleFromConversation(
      args.messages,
      index,
    )
    const visualRole = inferVisualRole(declaredRole)
    const photo = {
      conversationMessageId: args.latestUserMessageId ?? latestUser.id,
      attachmentIndex: index + 1,
      declaredRole,
      visualRole,
      roleConfirmed: declaredRole !== 'unknown',
      imageUrl: filePart.url,
      quality: 'unknown' as const,
      qualityIssues: [],
      notes:
        declaredRole === 'label_details'
          ? ['declared as label/details source']
          : declaredRole === 'jewelry_front'
            ? ['declared as customer-facing jewelry photo']
            : [],
    }
    photos.push(photo)
    await upsertTradeBoardIntakePhoto(supabase, {
      sessionId: args.session.id,
      repId: args.session.repId,
      conversationId: args.session.conversationId,
      conversationMessageId: photo.conversationMessageId,
      attachmentIndex: photo.attachmentIndex,
      declaredRole: photo.declaredRole,
      visualRole: photo.visualRole,
      roleConfirmed: photo.roleConfirmed,
      imageUrl: photo.imageUrl,
      quality: photo.quality,
      qualityIssues: photo.qualityIssues,
      notes: photo.notes,
    })
  }

  if (fileParts.length === 0) {
    const confirmedPhoto = maybeConfirmLatestJewelryFrontPhoto({
      photos,
      latestUserText,
      previousAssistantText: getMessageText(
        args.messages
          .slice(0, latestUserIndex)
          .reverse()
          .find((message) => message.role === 'assistant'),
      ),
    })
    if (confirmedPhoto) {
      await upsertTradeBoardIntakePhoto(supabase, {
        sessionId: args.session.id,
        repId: args.session.repId,
        conversationId: args.session.conversationId,
        conversationMessageId: confirmedPhoto.conversationMessageId,
        attachmentIndex: confirmedPhoto.attachmentIndex,
        declaredRole: confirmedPhoto.declaredRole,
        visualRole: confirmedPhoto.visualRole,
        roleConfirmed: confirmedPhoto.roleConfirmed,
        imageUrl: confirmedPhoto.imageUrl,
        quality: confirmedPhoto.quality,
        qualityIssues: confirmedPhoto.qualityIssues,
        notes: confirmedPhoto.notes,
      })
    }
  }

  const updated: TradeBoardIntakeSessionState = {
    ...args.session,
    known,
    photos,
    lastUserMessageId: args.latestUserMessageId ?? latestUser.id,
  }
  const readiness = computeTradeBoardIntakeReadiness(updated)
  const normalized: TradeBoardIntakeSessionState = {
    ...updated,
    missing: readiness.missing,
    blockers: readiness.blockers,
    phase:
      readiness.ready && updated.status === 'active'
        ? 'ready_to_add'
        : buildTradeBoardIntakePromptState(updated).workflow.phase,
  }

  await updateTradeBoardIntakeSession(supabase, {
    sessionId: args.session.id,
    patch: {
      item_number: known.itemNumber ?? null,
      quantity: known.quantity ?? null,
      design_name: known.designName ?? null,
      collection_name: known.collectionName ?? null,
      collection_year: known.collectionYear ?? null,
      material: known.material ?? null,
      main_stone: known.mainStone ?? null,
      bp_msrp: known.bpMsrp ?? null,
      ring_size: known.ringSize ?? null,
      rep_notes: known.repNotes ?? null,
      trade_preferences: known.tradePreferences ?? null,
      current_phase: normalized.phase,
      missing_fields: normalized.missing,
      hard_blockers: normalized.blockers,
      soft_warnings: normalized.warnings,
      last_user_message_id: normalized.lastUserMessageId ?? null,
    },
  })

  return normalized
}

function emptyWorkflowContext(
  toolPolicySource: TradeBoardIntakeToolPolicySource,
) {
  return {
    sessionBefore: null,
    sessionAfter: null,
    workflowIntents: [],
    toolPolicySource,
    workflowPromptState: '',
  }
}

function isMissingWorkflowSchemaError(err: unknown): boolean {
  const error = err as { code?: string; message?: string } | null
  return (
    error?.code === '42P01' ||
    /\brelation\s+"?(?:public\.)?trade_board_intake_(?:sessions|photos)"?\s+does\s+not\s+exist\b/i.test(
      error?.message ?? '',
    ) ||
    /\bcould\s+not\s+find\s+the\s+table\b[\s\S]{0,120}\btrade_board_intake_(?:sessions|photos)\b/i.test(
      error?.message ?? '',
    )
  )
}

function inferRoleFromText(text: string): TradeBoardPhotoDeclaredRole {
  const asksForJewelryPhoto =
    /\b(?:need|needs|send|upload|snap|take|provide|use|show|get|got)\b[\s\S]{0,120}\b(?:jewelry|customer-facing|front\s+(?:photo|shot|image)|boxed display|piece photo|listing photo|earrings themselves|just the earrings|actual jewelry)\b/i.test(
      text,
    ) ||
    /\b(?:jewelry|customer-facing|front\s+(?:photo|shot|image)|boxed display|piece photo|listing photo|earrings themselves|just the earrings|actual jewelry)\b[\s\S]{0,80}\b(?:photo|shot|image|front and center|clear|close)\b/i.test(
      text,
    )
  const asksForLabelPhoto =
    /\b(?:need|needs|send|upload|snap|take|provide|use|show|get|got)\b[\s\S]{0,120}\b(?:label|details|tag|back.of.card|item-info|item info)\b/i.test(
      text,
    ) ||
    /\b(?:label|details|tag|back.of.card|item-info|item info)\b[\s\S]{0,80}\b(?:photo|shot|image|source)\b/i.test(
      text,
    )
  const rejectsLabelAsListingPhoto =
    /\blabel(?:\/details)?\s+photo\b[\s\S]{0,80}\b(?:doesn'?t|does not|isn'?t|is not|won'?t|will not|can'?t|cannot)\b[\s\S]{0,120}\b(?:listing|jewelry|earrings|front|photo|shot|image)\b/i.test(
      text,
    )
  const treatsLabelAsDetailsSource =
    /\blabel(?:\/details)?\s+photo\b[\s\S]{0,120}\b(?:helpful|details|source|read|got\s+the\s+details|shows\s+the\s+info|super\s+helpful)\b/i.test(
      text,
    ) ||
    /\blabel(?:\/details)?\s+photo\b[\s\S]{0,160}\bbut\b[\s\S]{0,160}\b(?:need|see|show|get|use)\b[\s\S]{0,120}\b(?:earrings|jewelry|customer-facing|front|boxed display|listing)\b/i.test(
      text,
    )

  if (
    asksForJewelryPhoto &&
    (rejectsLabelAsListingPhoto ||
      treatsLabelAsDetailsSource ||
      !asksForLabelPhoto)
  ) {
    return 'jewelry_front'
  }
  if (asksForLabelPhoto && !asksForJewelryPhoto) {
    return 'label_details'
  }
  if (asksForJewelryPhoto && asksForLabelPhoto) {
    return 'unknown'
  }
  if (
    /\b(jewelry|customer-facing|front photo|boxed display|piece photo)\b/i.test(
      text,
    )
  ) {
    return 'jewelry_front'
  }
  return 'unknown'
}

function maybeConfirmLatestJewelryFrontPhoto(args: {
  photos: TradeBoardIntakeSessionState['photos']
  latestUserText: string
  previousAssistantText: string
}): TradeBoardIntakeSessionState['photos'][number] | null {
  if (!isPositiveConfirmation(args.latestUserText)) return null
  if (
    !assistantAskedToConfirmJewelryFront(args.previousAssistantText) &&
    !assistantIdentifiedJewelryFront(args.previousAssistantText)
  ) {
    return null
  }

  for (let index = args.photos.length - 1; index >= 0; index--) {
    const photo = args.photos[index]
    if (!photo) continue
    if (photo.declaredRole === 'label_details') continue
    if (photo.quality === 'blocked') continue
    if (!photo.imageUrl) continue
    if (photo.declaredRole === 'jewelry_front' && photo.roleConfirmed) {
      return photo
    }
    if (photo.declaredRole !== 'unknown' && photo.declaredRole !== 'other') {
      continue
    }

    const confirmed = {
      ...photo,
      declaredRole: 'jewelry_front' as const,
      visualRole: 'jewelry' as const,
      roleConfirmed: true,
      notes: [
        ...photo.notes,
        'confirmed by rep as customer-facing jewelry photo',
      ],
    }
    args.photos[index] = confirmed
    return confirmed
  }

  return null
}

function isPositiveConfirmation(text: string): boolean {
  return /\b(?:confirmed|confirm|yes|yep|yeah|correct|that'?s right|that is right|that is correct|exactly|use it|use that|good enough)\b/i.test(
    text,
  )
}

function assistantAskedToConfirmJewelryFront(text: string): boolean {
  return (
    /\bconfirm\b[\s\S]{0,160}\b(?:jewelry[-\s]?front|customer-facing|listing|photo|shot|image)\b/i.test(
      text,
    ) ||
    /\b(?:jewelry[-\s]?front|customer-facing|boxed display|listing)\b[\s\S]{0,160}\bconfirm\b/i.test(
      text,
    )
  )
}

function assistantIdentifiedJewelryFront(text: string): boolean {
  return (
    /\b(?:great|clear|usable|perfect|good|solid)\b[\s\S]{0,80}\bboxed\s+display\s+photo\b[\s\S]{0,120}\b(?:earrings|jewelry)\b/i.test(
      text,
    ) ||
    /\bboxed\s+display\s+photo\b[\s\S]{0,120}\b(?:earrings|jewelry)\b[\s\S]{0,120}\b(?:clearly|clear|usable|counts|customer-facing)\b/i.test(
      text,
    ) ||
    /\b(?:earrings|jewelry)\b[\s\S]{0,120}\b(?:clearly|clear|usable|customer-facing)\b[\s\S]{0,120}\bboxed\s+display\b/i.test(
      text,
    )
  )
}

function inferVisualRole(
  declaredRole: TradeBoardPhotoDeclaredRole,
): TradeBoardPhotoVisualRole {
  if (declaredRole === 'label_details') return 'label_or_packaging'
  if (declaredRole === 'jewelry_front') return 'jewelry'
  return 'uncertain'
}

function findLatestUserMessageIndex(messages: UIMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return index
  }
  return -1
}

function getMessageText(message: UIMessage | undefined): string {
  return (
    message?.parts
      ?.filter((part) => (part as { type?: string }).type === 'text')
      .map((part) => (part as { text?: string }).text ?? '')
      .join('\n') ?? ''
  )
}

function hasImagePart(message: UIMessage | undefined): boolean {
  return (
    message?.parts?.some(
      (part) =>
        (part as { type?: string }).type === 'file' &&
        (part as { mediaType?: string }).mediaType?.startsWith('image/'),
    ) ?? false
  )
}
