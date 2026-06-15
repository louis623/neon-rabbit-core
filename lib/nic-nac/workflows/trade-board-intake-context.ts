import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import {
  buildTradeBoardIntakePromptState,
  computeTradeBoardIntakeReadiness,
  getTradeBoardIntakeToolsRequired,
} from './trade-board-intake-controller'
import { renderTradeBoardIntakePromptState } from './trade-board-intake-prompt'
import type {
  TradeBoardIntakeKnownFields,
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

  const existing = await getActiveTradeBoardIntakeSession(args.supabase, {
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
    (await createTradeBoardIntakeSession(args.supabase, {
      repId: args.repId,
      conversationId: args.conversationId,
      lastUserMessageId: args.latestUserMessageId,
    }))
  const ingested = await ingestLatestTradeBoardIntakeTurn(args.supabase, {
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
  const known = mergeKnownFields(
    args.session.known,
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

function inferRoleFromText(text: string): TradeBoardPhotoDeclaredRole {
  if (/\b(label|details|tag|back.of.card|item-info|item info)\b/i.test(text)) {
    return 'label_details'
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

function inferVisualRole(
  declaredRole: TradeBoardPhotoDeclaredRole,
): TradeBoardPhotoVisualRole {
  if (declaredRole === 'label_details') return 'label_or_packaging'
  if (declaredRole === 'jewelry_front') return 'jewelry'
  return 'uncertain'
}

function extractKnownFieldsFromText(text: string): TradeBoardIntakeKnownFields {
  const known: TradeBoardIntakeKnownFields = {}
  const itemNumber = text.match(/\b[A-Z]{1,4}\d{3,}\b/i)?.[0]
  if (itemNumber) known.itemNumber = itemNumber.toUpperCase()
  const collection = text.match(
    /\b(?:collection|coll)\s*(?:is|:|-)?\s*([A-Za-z]+(?:\s+(?:Birthday|Collection|Originals|Luxe|Stacks?))?)(?:\s+(20\d{2}))?/i,
  )
  if (collection?.[1]) {
    known.collectionName = normalizeCollectionName(collection[1])
    if (collection[2]) known.collectionYear = Number(collection[2])
  }
  const quantity = text.match(/\b(?:qty|quantity|count)\s*(?:is|:|-)?\s*(\d+)\b/i)
  if (quantity?.[1]) known.quantity = Number(quantity[1])
  return known
}

function mergeKnownFields(
  current: TradeBoardIntakeKnownFields,
  next: TradeBoardIntakeKnownFields,
): TradeBoardIntakeKnownFields {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).filter(([, value]) => value !== undefined),
    ),
  }
}

function normalizeCollectionName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bcollection\b$/i, '')
    .trim()
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
