// Tool: add_listing — write. Adds one or more pieces to the rep's trade board.
// Two modes: single (one item number) and batch (an array of items). Handles
// NEEDS_FULL_INFO (unknown design) by creating the design first when the rep
// supplies the new-design fields on a follow-up call.
//
// Service-role client: addListing/addListingBatch/createDesign all require
// admin permissions for jewelry_designs.times_listed UPDATE and INSERT on
// jewelry_designs/collections. We obtain createAdminClient() inside execute
// and pass it to every service call. ctx.repId stays closure-bound from the
// authenticated session — the model never supplies it.

import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addListing, addListingBatch } from '@/lib/services/trade-board'
import {
  createDesign,
  resolveItemNumber,
  updateCanonicalPhoto,
  updatePhotoPipelineState,
} from '@/lib/services/jewelry-database'
import { prepareDesignSourcePhoto } from '@/lib/services/design-source-photo-processing'
import { assessJewelryPhotoPreflight } from '@/lib/services/jewelry-photo-preflight'
import { executePhotoEnhancement } from '@/lib/services/photo-enhancement'
import { decideCanonicalEnhancedPhoto } from '@/lib/services/photo-enhancement-qa'
import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'
import { processRepListingPhotoUrl } from '@/lib/services/listing-photo-processing'
import { ServiceError } from '@/lib/services/errors'
import { publishApprovedPhoto } from '@/lib/services/storage'
import { getPhotoroomConfig } from '@/lib/photoroom/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import {
  computeTradeBoardAddAttemptReadiness,
  transitionTradeBoardIntake,
} from '@/lib/nic-nac/workflows/trade-board-intake-controller'
import { updateTradeBoardIntakeSession } from '@/lib/nic-nac/workflows/trade-board-intake-store'
import type { ToolContext, ToolDefinition } from './types'

const itemBaseShape = {
  itemNumber: z.string(),
  ringSize: z.string().optional(),
  repNotes: z.string().optional(),
  tradePreferences: z.string().optional(),
  listingPhotoUrl: z.string().optional(),
  listingPhotoIndex: z.number().int().min(1).max(10).optional(),
}

const newDesignShape = {
  designName: z.string().optional(),
  piecePhotoUrl: z.string().optional(),
  piecePhotoIndex: z.number().int().min(1).max(10).optional(),
  material: z.string().optional(),
  mainStone: z.string().optional(),
  bpMsrp: z.number().optional(),
  collectionName: z.string().optional(),
  collectionYear: z.number().int().min(2020).max(2040).optional(),
  searchTags: z.array(z.string()).max(8).optional(),
  specialFeatures: z.string().optional(),
  lengthInfo: z.string().optional(),
}

const batchItem = z.object({
  ...itemBaseShape,
  ...newDesignShape,
})

const inputSchema = z.object({
  mode: z.enum(['single', 'batch']),
  // Single-mode top-level fields. itemNumber is optional in the schema so
  // batch-mode calls can omit it; runtime validates presence per mode.
  itemNumber: z.string().optional(),
  ringSize: z.string().optional(),
  repNotes: z.string().optional(),
  tradePreferences: z.string().optional(),
  listingPhotoUrl: z.string().optional(),
  listingPhotoIndex: z.number().int().min(1).max(10).optional(),
  // New-design recovery fields (single-mode follow-up after NEEDS_FULL_INFO).
  ...newDesignShape,
  // Batch-mode array.
  items: z.array(batchItem).optional(),
})

type ToolInput = z.infer<typeof inputSchema>

function explainServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    throw new NicNacToolError({
      code: err.code,
      userMessage: err.userMessage,
      cause: err,
    })
  }
  throw err
}

async function writeAuditIsolated(args: {
  actionType: string
  repId: string
  targetListingId?: string | null
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  conversationId: string
  runId: string
}) {
  // Audit write is observability, not business logic. The mutation has
  // already succeeded; audit failure must NEVER reverse the rep's view of
  // success. writeTradeActionAudit already swallows its own errors, so this
  // outer try/catch is defense-in-depth — matches remove-listing.ts.
  try {
    await writeTradeActionAudit({
      actionType: args.actionType,
      repId: args.repId,
      targetListingId: args.targetListingId ?? null,
      beforeState: args.beforeState,
      afterState: args.afterState,
      details: { runId: args.runId, conversationId: args.conversationId },
    })
  } catch (auditErr) {
    console.error('[nic-nac] trade_action_audit write failed', {
      actionType: args.actionType,
      auditErr,
    })
    try {
      await logIncident({
        errorType: 'audit_write_failed',
        repId: args.repId,
        conversationId: args.conversationId,
        severity: 'warn',
        details: {
          toolName: 'add_listing',
          runId: args.runId,
          actionType: args.actionType,
          message: (auditErr as Error)?.message,
        },
      })
    } catch {
      /* swallow — observability must not affect outcome */
    }
  }
}

// Look up a user-uploaded image part in this conversation and return its
// client-compressed data URL. Explicit photo indexes are treated as 1-based
// numbers across recent conversation photos in normal conversation order, which
// matches how reps and Nic-Nac talk about "the second photo" across a guided
// add flow. Without an explicit index, choose the most recent user turn that
// contains exactly one image; still ask for a choice when a single turn includes
// multiple images and the model did not identify which one is jewelry-front.
async function resolvePhotoFromConversation(ctx: {
  supabase: SupabaseClient
  conversationId: string
  latestUserMessageOnly?: boolean
  photoIndex?: number
}): Promise<{
  imageDataUrl: string
} | null> {
  const { data, error } = await ctx.supabase
    .from('nic_nac_conversations')
    .select('message_id, parts, created_at')
    .eq('conversation_id', ctx.conversationId)
    .eq('role', 'user')
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  const rows = ctx.latestUserMessageOnly ? (data ?? []).slice(0, 1) : (data ?? [])
  const rowsWithImages = rows
    .map((row) => {
      const parts = row.parts as Array<{
        type?: string
        mediaType?: string
        url?: string
      }> | null
      const imageParts = (parts ?? []).filter(
        (p) =>
          p?.type === 'file' &&
          typeof p.mediaType === 'string' &&
          p.mediaType.startsWith('image/') &&
          typeof p.url === 'string',
      )
      return { imageParts }
    })
    .filter((row) => row.imageParts.length > 0)

  if (ctx.photoIndex !== undefined) {
    const conversationPhotos = [...rowsWithImages]
      .reverse()
      .flatMap((row) => row.imageParts)
    const imagePart = conversationPhotos[ctx.photoIndex - 1]
    if (!imagePart?.url) {
      throw new NicNacToolError({
        code: 'PHOTO_CHOICE_REQUIRED',
        userMessage: `I found ${conversationPhotos.length} recent photo${
          conversationPhotos.length === 1 ? '' : 's'
        } in this add flow, so I couldn't use photo ${ctx.photoIndex}. Tell me which attached image is the jewelry-front photo.`,
      })
    }
    return {
      imageDataUrl: imagePart.url,
    }
  }

  for (const row of rowsWithImages) {
    const imageParts = row.imageParts
    if (imageParts.length > 1) {
      throw new NicNacToolError({
        code: 'PHOTO_CHOICE_REQUIRED',
        userMessage:
          'I see more than one photo here, so I need the actual jewelry photo before I save anything to the board. Send just the jewelry-front photo, or tell me which attached image is the jewelry photo.',
      })
    }
    const imagePart = imageParts[0]
    if (imagePart?.url) {
      return {
        imageDataUrl: imagePart.url,
      }
    }
  }
  return null
}

function batchRepeatsOneItem(input: ToolInput) {
  if (input.mode !== 'batch' || !input.items || input.items.length < 2) return false
  const firstItemNumber = input.items[0]?.itemNumber?.trim().toUpperCase()
  if (!firstItemNumber) return false
  return input.items.every(
    (item) => item.itemNumber?.trim().toUpperCase() === firstItemNumber,
  )
}

function textHasExplicitQuantity(text: string) {
  return (
    /\b(qty|quantity|count|copies|pieces|units|all|both|pair|several|multiple)\b/i.test(
      text,
    ) ||
    /\b(two|three|four|five|six|seven|eight|nine|ten)\b/i.test(text) ||
    /\b\d+\b/.test(text.replace(/[A-Z]{1,3}\d{3,}/gi, ''))
  )
}

async function latestUserMessageHasExplicitQuantity(ctx: {
  supabase: SupabaseClient
  conversationId: string
}): Promise<boolean | null> {
  let data: { parts?: unknown } | null | undefined
  let error: unknown
  try {
    ;({ data, error } = await ctx.supabase
      .from('nic_nac_conversations')
      .select('parts')
      .eq('conversation_id', ctx.conversationId)
      .eq('role', 'user')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle())
  } catch (err) {
    if (err instanceof TypeError) return null
    throw err
  }
  if (error) throw error

  const parts = data?.parts as Array<{ type?: string; text?: string }> | null
  const text = (parts ?? [])
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
  return textHasExplicitQuantity(text)
}

function textConfirmsAdditionalPhysicalPiece(text: string) {
  return (
    textHasExplicitQuantity(text) ||
    /\b(another|additional|extra|second|third|fourth|fifth|copy|duplicate|same\s+one|again)\b/i.test(
      text,
    )
  )
}

function textIsAffirmative(text: string) {
  return /\b(yes|yep|yeah|yup|correct|right|exactly|please|do\s+it|go\s+ahead)\b/i.test(
    text,
  )
}

function textAsksDuplicatePhysicalPieceQuestion(text: string) {
  return (
    text.includes('already on your Trade Board') &&
    text.includes('another physical piece')
  )
}

function readTextFromParts(parts: unknown) {
  if (!Array.isArray(parts)) return ''
  return parts
    .filter(
      (part): part is { type?: string; text?: string } =>
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'text' &&
        typeof (part as { text?: unknown }).text === 'string',
    )
    .map((part) => part.text)
    .join('\n')
}

async function latestConversationConfirmsAdditionalPhysicalPiece(ctx: {
  supabase: SupabaseClient
  conversationId: string
}): Promise<boolean | null> {
  let data:
    | Array<{ role?: unknown; parts?: unknown }>
    | null
    | undefined
  let error: unknown
  try {
    ;({ data, error } = await ctx.supabase
      .from('nic_nac_conversations')
      .select('role,parts')
      .eq('conversation_id', ctx.conversationId)
      .eq('status', 'complete')
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(4))
  } catch (err) {
    if (err instanceof TypeError) return null
    throw err
  }
  if (error) throw error

  const messages = (data ?? []).map((row) => ({
    role: typeof row.role === 'string' ? row.role : '',
    text: readTextFromParts(row.parts),
  }))
  const latestUserIndex = messages.findIndex((message) => message.role === 'user')
  const latestUser = messages[latestUserIndex]
  if (!latestUser) return false
  if (textConfirmsAdditionalPhysicalPiece(latestUser.text)) return true

  const priorAssistant = messages
    .slice(latestUserIndex + 1)
    .find((message) => message.role === 'assistant')

  return Boolean(
    priorAssistant &&
      textIsAffirmative(latestUser.text) &&
      textAsksDuplicatePhysicalPieceQuestion(priorAssistant.text),
  )
}

async function repAlreadyHasActiveListingForItem(input: {
  admin: SupabaseClient
  repId: string
  itemNumber: string
  designId?: string
}) {
  let designId = input.designId
  if (!designId) {
    const resolved = await resolveItemNumber(input.admin, input.itemNumber)
    if (!resolved?.found) return false
    designId = resolved.design.id
  }

  const { data, error } = await input.admin
    .from('trade_listings')
    .select('id')
    .eq('rep_id', input.repId)
    .eq('design_id', designId)
    .neq('status', 'removed')
    .limit(1)

  if (error) throw error
  return (data ?? []).length > 0
}

async function requireDuplicatePhysicalPieceConfirmationIfNeeded(input: {
  admin: SupabaseClient
  supabase: SupabaseClient
  repId: string
  conversationId: string
  itemNumber: string
  designId?: string
}) {
  const alreadyListed = await repAlreadyHasActiveListingForItem({
    admin: input.admin,
    repId: input.repId,
    itemNumber: input.itemNumber,
    designId: input.designId,
  })
  if (!alreadyListed) return

  const confirmed = await latestConversationConfirmsAdditionalPhysicalPiece({
    supabase: input.supabase,
    conversationId: input.conversationId,
  })
  if (confirmed) return

  throw new NicNacToolError({
    code: 'DUPLICATE_PHYSICAL_CONFIRMATION_REQUIRED',
    userMessage:
      'That item number is already on your Trade Board. Are we adding another physical piece of the same design?',
  })
}

function getConfirmedJewelryFrontPhotos(
  workflow: ToolContext['activeTradeBoardWorkflow'] | undefined,
) {
  if (workflow?.status !== 'active') return []
  return workflow.photos.filter(isConfirmedJewelryFrontPhoto)
}

function isConfirmedJewelryFrontPhoto(
  photo:
    | NonNullable<ToolContext['activeTradeBoardWorkflow']>['photos'][number]
    | undefined,
): boolean {
  return (
    photo?.declaredRole === 'jewelry_front' &&
    photo.roleConfirmed &&
    photo.quality !== 'blocked'
  )
}

function getWorkflowPhotoByModelIndex(
  workflow: ToolContext['activeTradeBoardWorkflow'] | undefined,
  photoIndex: number | undefined,
) {
  if (workflow?.status !== 'active' || photoIndex === undefined) return null
  const photo = workflow.photos[photoIndex - 1]
  return isConfirmedJewelryFrontPhoto(photo) ? photo : null
}

function workflowConfirmsJewelryFrontPhoto(
  workflow: ToolContext['activeTradeBoardWorkflow'] | undefined,
  photoIndex?: number,
): boolean {
  const confirmedPhotos = getConfirmedJewelryFrontPhotos(workflow)
  if (confirmedPhotos.length === 0) return false
  if (photoIndex === undefined) return confirmedPhotos.length === 1
  if (getWorkflowPhotoByModelIndex(workflow, photoIndex)) return true
  return (
    confirmedPhotos.some((photo) => photo.attachmentIndex === photoIndex) ||
    confirmedPhotos.length === 1
  )
}

function getWorkflowConfirmedJewelryFrontImageUrl(
  workflow: ToolContext['activeTradeBoardWorkflow'] | undefined,
  photoIndex?: number,
): string | null {
  const confirmedPhotos = getConfirmedJewelryFrontPhotos(workflow)
  if (confirmedPhotos.length === 0) return null

  if (photoIndex !== undefined) {
    const modelIndexedPhoto = getWorkflowPhotoByModelIndex(workflow, photoIndex)
    if (modelIndexedPhoto?.imageUrl) return modelIndexedPhoto.imageUrl

    const matchingPhoto = confirmedPhotos.find(
      (photo) => photo.attachmentIndex === photoIndex,
    )
    if (matchingPhoto?.imageUrl) return matchingPhoto.imageUrl
  }

  if (confirmedPhotos.length === 1) {
    return confirmedPhotos[0]?.imageUrl ?? null
  }

  return null
}

async function processListingPhotoForAdd(input: {
  listingPhotoUrl?: string
  listingPhotoIndex?: number
  itemNumber?: string
  activeTradeBoardWorkflow?: ToolContext['activeTradeBoardWorkflow']
  repId: string
  supabase: SupabaseClient
  conversationId: string
  photoIndex?: number
  allowImplicitConversationPhoto?: boolean
}): Promise<string | undefined> {
  const itemNumber = input.itemNumber ?? 'listing'
  const photoIndex = input.photoIndex ?? input.listingPhotoIndex
  const workflowPhotoUrl = getWorkflowConfirmedJewelryFrontImageUrl(
    input.activeTradeBoardWorkflow,
    photoIndex,
  )
  if (input.listingPhotoUrl) {
    try {
      const processInput = {
        repId: input.repId,
        sourceImageUrl: input.listingPhotoUrl,
        filenameStem: `${itemNumber}-listing-photo`,
      }
      const processed =
        workflowPhotoUrl === input.listingPhotoUrl
          ? await processRepListingPhotoUrl(processInput, {
              confirmedJewelryFront: true,
            })
          : await processRepListingPhotoUrl(processInput)
      return processed.photoUrl
    } catch (err) {
      explainServiceError(err)
    }
  }

  if (workflowPhotoUrl) {
    try {
      return (
        await processRepListingPhotoUrl(
          {
            repId: input.repId,
            sourceImageUrl: workflowPhotoUrl,
            filenameStem: `${itemNumber}-listing-photo`,
          },
          { confirmedJewelryFront: true },
        )
      ).photoUrl
    } catch (err) {
      explainServiceError(err)
    }
  }

  if (photoIndex === undefined && !input.allowImplicitConversationPhoto) {
    return undefined
  }

  const resolvedListingPhoto = await resolvePhotoFromConversation({
    supabase: input.supabase,
    conversationId: input.conversationId,
    photoIndex,
  })
  if (!resolvedListingPhoto) return undefined

  try {
    const processInput = {
      repId: input.repId,
      sourceImageUrl: resolvedListingPhoto.imageDataUrl,
      filenameStem: `${itemNumber}-listing-photo`,
    }
    const isWorkflowConfirmed = workflowConfirmsJewelryFrontPhoto(
      input.activeTradeBoardWorkflow,
      photoIndex,
    )
    const processed = isWorkflowConfirmed
      ? await processRepListingPhotoUrl(processInput, {
          confirmedJewelryFront: true,
        })
      : await processRepListingPhotoUrl(processInput)
    return processed.photoUrl
  } catch (err) {
    explainServiceError(err)
  }
}

async function markActiveTradeBoardWorkflowCompleted(input: {
  workflow?: ToolContext['activeTradeBoardWorkflow']
  admin: SupabaseClient
  listingId: string
  designId: string
  repId: string
  conversationId: string
  runId: string
}) {
  const workflow = input.workflow
  if (workflow?.status !== 'active') return

  const completed = transitionTradeBoardIntake(workflow, {
    type: 'mark_completed',
    listingIds: [input.listingId],
    designId: input.designId,
  })

  try {
    await updateTradeBoardIntakeSession(input.admin, {
      sessionId: workflow.id,
      patch: {
        status: completed.status,
        current_phase: completed.phase,
        created_listing_ids: completed.createdListingIds ?? [input.listingId],
        created_design_id: completed.createdDesignId ?? input.designId,
        missing_fields: [],
        hard_blockers: [],
        soft_warnings: [],
      },
    })
  } catch (error) {
    try {
      await logIncident({
        errorType: 'trade_board_intake_completion_failed',
        repId: input.repId,
        conversationId: input.conversationId,
        severity: 'warn',
        details: {
          toolName: 'add_listing',
          runId: input.runId,
          workflowId: workflow.id,
          listingId: input.listingId,
          message:
            error instanceof Error
              ? error.message
              : 'unknown workflow completion error',
        },
      })
    } catch {
      /* swallow - workflow telemetry must not undo a successful listing */
    }
  }
}

async function shouldCollapseRepeatedBatchToSingle(
  input: ToolInput,
  ctx: { supabase: SupabaseClient; conversationId: string },
) {
  if (!batchRepeatsOneItem(input)) return false
  const latestHasQuantity = await latestUserMessageHasExplicitQuantity(ctx)
  if (latestHasQuantity === null) return false
  return !latestHasQuantity
}

async function runSingle(
  input: ToolInput,
  ctx: {
    repId: string
    conversationId: string
    runId: string
    supabase: SupabaseClient
    activeTradeBoardWorkflow?: ToolContext['activeTradeBoardWorkflow']
  },
  admin: SupabaseClient,
) {
  const { itemNumber, designName, piecePhotoUrl, collectionName } = input

  if (!itemNumber) {
    throw new NicNacToolError({
      code: 'MISSING_ITEM_INPUT',
      userMessage: 'I need an item number to add a piece to your board.',
    })
  }

  const activeWorkflow = ctx.activeTradeBoardWorkflow
  if (activeWorkflow?.status === 'active') {
    const readiness = computeTradeBoardAddAttemptReadiness(activeWorkflow, {
      itemNumber,
      designName: input.designName,
      collectionName: input.collectionName,
      collectionYear: input.collectionYear,
    })
    if (!readiness.ready) {
      const needsJewelryPhoto = readiness.missing.includes('jewelryFrontPhoto')
      const missing = readiness.missing.join(', ')
      throw new NicNacToolError({
        code: 'WORKFLOW_NOT_READY',
        userMessage: needsJewelryPhoto
          ? 'I still need the customer-facing jewelry photo before I can save this listing.'
          : `I still need these details before I can save this listing: ${missing}.`,
      })
    }
  }

  let createdNewDesign = false
  let photoPreflight:
    | ReturnType<typeof assessJewelryPhotoPreflight>
    | null = null
  let sourcePhotoWidth = 0
  let sourcePhotoHeight = 0
  let sourcePhotoAnalysis:
    | {
        blurRisk: number
        lightingRisk: number
        detailRisk: number
        backgroundDistractionRisk: number
        subjectCoverage: number
        subjectCentered: boolean
      }
    | null = null
  let newDesignListingPhotoUrl: string | undefined

  // New-design recovery: rep is retrying after a prior NEEDS_FULL_INFO.
  // Require collectionName here even though the service layer accepts a
  // null collection — addListing rejects any design without a collection,
  // so creating one without it would dead-end on the very next call.
  // Photo uploads are resolved server-side from workflow state or recent chat
  // images; a manual source remains accepted only when explicitly provided.
  if (designName) {
    if (!collectionName) {
      throw new NicNacToolError({
        code: 'NEEDS_COLLECTION_FOR_NEW_DESIGN',
        userMessage:
          "I also need a collection name for new pieces — without a collection I can create the design but can't list it.",
      })
    }

    // Recovery fields can arrive after the design has already been created by
    // another attempt. Use a read-only catalog lookup before creating so stale
    // retries do not duplicate catalog designs.
    try {
      const existingDesign = await resolveItemNumber(admin, itemNumber)
      if (existingDesign.found) {
        await requireDuplicatePhysicalPieceConfirmationIfNeeded({
          admin,
          supabase: ctx.supabase,
          repId: ctx.repId,
          conversationId: ctx.conversationId,
          itemNumber,
          designId: existingDesign.design.id,
        })
        const existingListingPhotoUrl = await processListingPhotoForAdd({
          listingPhotoUrl: input.listingPhotoUrl,
          listingPhotoIndex: input.listingPhotoIndex,
          itemNumber,
          activeTradeBoardWorkflow: activeWorkflow,
          repId: ctx.repId,
          supabase: ctx.supabase,
          conversationId: ctx.conversationId,
          photoIndex: input.listingPhotoIndex ?? input.piecePhotoIndex,
        })
        const existingResult = await addListing(admin, ctx.repId, {
          itemNumber,
          collectionName,
          ringSize: input.ringSize,
          repNotes: input.repNotes,
          tradePreferences: input.tradePreferences,
          listingPhotoUrl: existingListingPhotoUrl,
        })
        await markActiveTradeBoardWorkflowCompleted({
          workflow: activeWorkflow,
          admin,
          listingId: existingResult.listingId,
          designId: existingResult.designId,
          repId: ctx.repId,
          conversationId: ctx.conversationId,
          runId: ctx.runId,
        })
        await writeAuditIsolated({
          actionType: 'add_listing',
          repId: ctx.repId,
          targetListingId: existingResult.listingId,
          beforeState: { itemNumber, repId: ctx.repId, status: '' },
          afterState: {
            listingId: existingResult.listingId,
            designId: existingResult.designId,
            itemNumber: existingResult.itemNumber,
            repId: ctx.repId,
            status: existingResult.status,
          },
          conversationId: ctx.conversationId,
          runId: ctx.runId,
        })
        return {
          mode: 'single' as const,
          listingId: existingResult.listingId,
          designId: existingResult.designId,
          itemNumber: existingResult.itemNumber,
          designName: existingResult.designName,
          status: existingResult.status,
          usesCanonicalPhoto: existingResult.usesCanonicalPhoto,
          createdNewDesign: false,
        }
      }
    } catch (err) {
      explainServiceError(err)
    }

    let resolvedPhotoUrl: string | null = piecePhotoUrl?.trim() || null
    const designSourcePhotoIndex = input.piecePhotoIndex ?? input.listingPhotoIndex
    const workflowConfirmedDesignPhoto = workflowConfirmsJewelryFrontPhoto(
      activeWorkflow,
      designSourcePhotoIndex,
    )
    const workflowConfirmedPhotoUrl = getWorkflowConfirmedJewelryFrontImageUrl(
      activeWorkflow,
      designSourcePhotoIndex,
    )
    let stagedOriginal:
      | {
          objectPath: string
          signedUrl: string
        }
      | null = null
    if (resolvedPhotoUrl) {
      let preparedSource: Awaited<ReturnType<typeof prepareDesignSourcePhoto>>
      try {
        preparedSource = await prepareDesignSourcePhoto(
          {
            repId: ctx.repId,
            sourceImageUrl: resolvedPhotoUrl,
            filenameStem: itemNumber,
          },
          {
            confirmedJewelryFront:
              workflowConfirmedDesignPhoto &&
              workflowConfirmedPhotoUrl === resolvedPhotoUrl,
          },
        )
      } catch (err) {
        explainServiceError(err)
      }
      resolvedPhotoUrl = preparedSource.publicPhotoUrl
      stagedOriginal = preparedSource.stagedOriginal
      photoPreflight = preparedSource.preflight
      sourcePhotoWidth = preparedSource.analysis.width
      sourcePhotoHeight = preparedSource.analysis.height
      sourcePhotoAnalysis = {
        blurRisk: preparedSource.analysis.blurRisk,
        lightingRisk: preparedSource.analysis.lightingRisk,
        detailRisk: preparedSource.analysis.detailRisk,
        backgroundDistractionRisk:
          preparedSource.analysis.backgroundDistractionRisk,
        subjectCoverage: preparedSource.analysis.subjectCoverage,
        subjectCentered: preparedSource.analysis.subjectCentered,
      }
    } else if (workflowConfirmedPhotoUrl) {
      let preparedSource: Awaited<ReturnType<typeof prepareDesignSourcePhoto>>
      try {
        preparedSource = await prepareDesignSourcePhoto(
          {
            repId: ctx.repId,
            sourceImageUrl: workflowConfirmedPhotoUrl,
            filenameStem: itemNumber,
          },
          { confirmedJewelryFront: true },
        )
      } catch (err) {
        explainServiceError(err)
      }
      stagedOriginal = preparedSource.stagedOriginal
      resolvedPhotoUrl = preparedSource.publicPhotoUrl
      photoPreflight = preparedSource.preflight
      sourcePhotoWidth = preparedSource.analysis.width
      sourcePhotoHeight = preparedSource.analysis.height
      sourcePhotoAnalysis = {
        blurRisk: preparedSource.analysis.blurRisk,
        lightingRisk: preparedSource.analysis.lightingRisk,
        detailRisk: preparedSource.analysis.detailRisk,
        backgroundDistractionRisk:
          preparedSource.analysis.backgroundDistractionRisk,
        subjectCoverage: preparedSource.analysis.subjectCoverage,
        subjectCentered: preparedSource.analysis.subjectCentered,
      }
    } else {
      const resolvedPhoto = await resolvePhotoFromConversation({
        supabase: ctx.supabase,
        conversationId: ctx.conversationId,
        photoIndex: designSourcePhotoIndex,
      })
      if (!resolvedPhoto) {
        throw new NicNacToolError({
          code: 'MISSING_PIECE_PHOTO',
          userMessage:
            "I don't see a photo of this piece in our conversation. Send me a photo and I'll add it.",
        })
      }
      let preparedSource: Awaited<ReturnType<typeof prepareDesignSourcePhoto>>
      try {
        preparedSource = await prepareDesignSourcePhoto(
          {
            repId: ctx.repId,
            sourceImageDataUrl: resolvedPhoto.imageDataUrl,
            filenameStem: itemNumber,
          },
          {
            confirmedJewelryFront: workflowConfirmedDesignPhoto,
          },
        )
      } catch (err) {
        explainServiceError(err)
      }
      stagedOriginal = preparedSource.stagedOriginal
      resolvedPhotoUrl = preparedSource.publicPhotoUrl
      photoPreflight = preparedSource.preflight
      sourcePhotoWidth = preparedSource.analysis.width
      sourcePhotoHeight = preparedSource.analysis.height
      sourcePhotoAnalysis = {
        blurRisk: preparedSource.analysis.blurRisk,
        lightingRisk: preparedSource.analysis.lightingRisk,
        detailRisk: preparedSource.analysis.detailRisk,
        backgroundDistractionRisk:
          preparedSource.analysis.backgroundDistractionRisk,
        subjectCoverage: preparedSource.analysis.subjectCoverage,
        subjectCentered: preparedSource.analysis.subjectCentered,
      }
    }

    let createResult: Awaited<ReturnType<typeof createDesign>>
    try {
      createResult = await createDesign(admin, {
        itemNumber,
        designName,
        piecePhotoUrl: resolvedPhotoUrl,
        collectionName,
        collectionYear: input.collectionYear,
        searchTags: input.searchTags,
        material: input.material,
        mainStone: input.mainStone,
        bpMsrp: input.bpMsrp,
        specialFeatures: input.specialFeatures,
        lengthInfo: input.lengthInfo,
        createdByRepId: ctx.repId,
        conversationId: ctx.conversationId,
        photoPipeline: stagedOriginal
          ? {
              originalPath: stagedOriginal.objectPath,
              originalUrl: stagedOriginal.signedUrl,
              status: 'ready',
              preflightScore: photoPreflight?.score ?? null,
              preflightIssues: photoPreflight?.issues ?? [],
            }
          : undefined,
      })
    } catch (err) {
      explainServiceError(err)
    }
    createdNewDesign = true
    if (workflowConfirmedDesignPhoto && resolvedPhotoUrl) {
      newDesignListingPhotoUrl = resolvedPhotoUrl
    }
    if (stagedOriginal) {
      try {
        const photoroomConfig = getPhotoroomConfig()
        if (photoroomConfig) {
          await updatePhotoPipelineState(admin, createResult.designId, {
            provider: 'photoroom',
            status: 'processing',
          })
          const enhanced = await executePhotoEnhancement(
            {
              assetId: `${createResult.designId}:${itemNumber}`,
              sourceImageUrl: stagedOriginal.signedUrl,
              output: {
                format: 'png',
                background: 'white',
              },
              operations: {
                removeBackground: true,
                relight: 'preserve-hue-and-saturation',
              },
              context: {
                repId: ctx.repId,
                traceId: ctx.runId,
              },
            },
            {
              provider: photoroomConfig,
            },
          )
          const outputMetadata = await analyzeServerImageQuality(
            enhanced.output.bytes,
          )
          const outputPreflight = assessJewelryPhotoPreflight({
            width: outputMetadata.width,
            height: outputMetadata.height,
            blurRisk: outputMetadata.blurRisk,
            lightingRisk: outputMetadata.lightingRisk,
            detailRisk: outputMetadata.detailRisk,
            backgroundDistractionRisk:
              outputMetadata.backgroundDistractionRisk,
            subjectCoverage: outputMetadata.subjectCoverage,
            subjectCentered: outputMetadata.subjectCentered,
          })
          const outputQa = decideCanonicalEnhancedPhoto({
            assetId: `${createResult.designId}:${itemNumber}`,
            provider: 'photoroom',
            sourcePreflight: photoPreflight,
            sourceAnalysis: sourcePhotoAnalysis,
            outputPreflight,
            outputAnalysis: {
              blurRisk: outputMetadata.blurRisk,
              lightingRisk: outputMetadata.lightingRisk,
              detailRisk: outputMetadata.detailRisk,
              backgroundDistractionRisk:
                outputMetadata.backgroundDistractionRisk,
              subjectCoverage: outputMetadata.subjectCoverage,
              subjectCentered: outputMetadata.subjectCentered,
            },
            sourceWidth: sourcePhotoWidth,
            sourceHeight: sourcePhotoHeight,
            outputWidth: outputMetadata.width,
            outputHeight: outputMetadata.height,
            contentType:
              outputMetadata.contentType ??
              enhanced.response.contentType ??
              'application/octet-stream',
          })

          if (outputQa.decision !== 'hold') {
            const enhancedPhotoUrl = await publishApprovedPhoto(
              createResult.designId,
              enhanced.output.bytes,
              {
                contentType: outputMetadata.contentType,
                filename: `${itemNumber}-enhanced`,
              },
            )
            if (outputQa.decision === 'promote_canonical') {
              await updateCanonicalPhoto(
                admin,
                createResult.designId,
                enhancedPhotoUrl,
              )
              await updatePhotoPipelineState(admin, createResult.designId, {
                provider: 'photoroom',
                enhancedUrl: enhancedPhotoUrl,
                status: 'published',
                qaDecision: outputQa.qaDecision,
                processedAt: new Date().toISOString(),
              })
            } else {
              await updatePhotoPipelineState(admin, createResult.designId, {
                provider: 'photoroom',
                enhancedUrl: enhancedPhotoUrl,
                status: 'qa_review',
                qaDecision: outputQa.qaDecision,
                processedAt: new Date().toISOString(),
              })
            }
          } else {
            await updatePhotoPipelineState(admin, createResult.designId, {
              provider: 'photoroom',
              status: 'rejected',
              qaDecision: outputQa.qaDecision,
              processedAt: new Date().toISOString(),
            })
          }
        }
      } catch (photoErr) {
        try {
          await updatePhotoPipelineState(admin, createResult.designId, {
            provider: 'photoroom',
            status: 'error',
            processedAt: new Date().toISOString(),
          })
        } catch {
          /* swallow - listing itself already succeeded */
        }
        try {
          await logIncident({
            errorType: 'photo_pipeline_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'add_listing',
              runId: ctx.runId,
              itemNumber,
              designId: createResult.designId,
              message: (photoErr as Error)?.message,
            },
          })
        } catch {
          /* swallow - observability must not affect outcome */
        }
      }
    }

    await writeAuditIsolated({
      actionType: 'create_design',
      repId: ctx.repId,
      targetListingId: null,
      beforeState: { itemNumber },
      afterState: {
        designId: createResult.designId,
        itemNumber: createResult.itemNumber,
        collectionId: createResult.collectionId ?? '',
        collectionName: createResult.collectionName ?? '',
      },
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    })
  }

  if (!designName) {
    await requireDuplicatePhysicalPieceConfirmationIfNeeded({
      admin,
      supabase: ctx.supabase,
      repId: ctx.repId,
      conversationId: ctx.conversationId,
      itemNumber,
    })
  }

  let result: Awaited<ReturnType<typeof addListing>>
  let processedListingPhotoUrl: string | undefined = newDesignListingPhotoUrl
  if (input.listingPhotoUrl || !designName) {
    processedListingPhotoUrl =
      (await processListingPhotoForAdd({
        listingPhotoUrl: input.listingPhotoUrl,
        listingPhotoIndex: input.listingPhotoIndex,
        itemNumber,
        activeTradeBoardWorkflow: activeWorkflow,
        repId: ctx.repId,
        supabase: ctx.supabase,
        conversationId: ctx.conversationId,
        photoIndex: input.listingPhotoIndex ?? input.piecePhotoIndex,
        allowImplicitConversationPhoto: !designName,
      })) ?? processedListingPhotoUrl
  }
  try {
    result = await addListing(admin, ctx.repId, {
      itemNumber,
      collectionName: input.collectionName,
      ringSize: input.ringSize,
      repNotes: input.repNotes,
      tradePreferences: input.tradePreferences,
      listingPhotoUrl: processedListingPhotoUrl,
    })
  } catch (err) {
    if (err instanceof ServiceError) {
      if (err.code === 'NEEDS_FULL_INFO') {
        return {
          needsAction: 'create_design' as const,
          itemNumber,
          requiredFields: ['designName', 'collectionName'],
          optionalFields: [
            'piecePhotoIndex',
            'listingPhotoIndex',
            'material',
            'mainStone',
            'bpMsrp',
            'collectionYear',
            'searchTags',
            'specialFeatures',
            'lengthInfo',
          ],
          message: `${itemNumber} isn't in the Sparkle Suite jewelry database yet. Use vision on the rep's photos to extract designName and any optional metadata you can read, and accept clear rep-provided details such as collectionName or collectionYear. Birthday collection names must include the year; if a box clearly shows a Birthday Collection month/year, normalize it to collectionName like "March Birthday 2026" and collectionYear like 2026. Boxed display photos with clear jewelry are acceptable as the jewelry-front photo. Do not treat label/details photos as bad jewelry photos. A label/details photo is only a label/details photo. Visible jewelry in that label/details photo does not satisfy the jewelry photo requirement. Do not ask for unboxed, no-packaging, or plain-background retakes. Do not ask for retakes without the box/card or on a plain surface. When multiple photos are attached, pass piecePhotoIndex or listingPhotoIndex using recent add-flow photo order for the jewelry-front photo instead of asking for another upload. The handler uploads the photo from chat automatically.`,
        }
      }
      if (err.code === 'NEEDS_COLLECTION') {
        return {
          needsAction: 'provide_collection' as const,
          code: 'NEEDS_COLLECTION' as const,
          itemNumber,
          requiredFields: ['collectionName'],
          message: `${itemNumber} is in our database but needs an exact collection name before I can list it. Ask the rep for the exact collection name, then retry with collectionName. Do not guess it from vision.`,
        }
      }
    }
    explainServiceError(err)
  }

  await markActiveTradeBoardWorkflowCompleted({
    workflow: activeWorkflow,
    admin,
    listingId: result.listingId,
    designId: result.designId,
    repId: ctx.repId,
    conversationId: ctx.conversationId,
    runId: ctx.runId,
  })

  await writeAuditIsolated({
    actionType: 'add_listing',
    repId: ctx.repId,
    targetListingId: result.listingId,
    beforeState: { itemNumber, repId: ctx.repId, status: '' },
    afterState: {
      listingId: result.listingId,
      designId: result.designId,
      itemNumber: result.itemNumber,
      repId: ctx.repId,
      status: result.status,
    },
    conversationId: ctx.conversationId,
    runId: ctx.runId,
  })

  return {
    mode: 'single' as const,
    listingId: result.listingId,
    designId: result.designId,
    itemNumber: result.itemNumber,
    designName: result.designName,
    status: result.status,
    usesCanonicalPhoto: result.usesCanonicalPhoto,
    createdNewDesign,
  }
}

async function runBatch(
  input: ToolInput,
  ctx: {
    repId: string
    conversationId: string
    runId: string
    supabase: SupabaseClient
    activeTradeBoardWorkflow?: ToolContext['activeTradeBoardWorkflow']
  },
  admin: SupabaseClient,
) {
  const { items } = input

  if (!items || items.length === 0) {
    throw new NicNacToolError({
      code: 'MISSING_ITEM_INPUT',
      userMessage: 'I need at least one item to add.',
    })
  }

  const processedItems = []
  for (const item of items) {
    let listingPhotoUrl: string | undefined
    if (item.listingPhotoUrl) {
      try {
        listingPhotoUrl = (
          await processRepListingPhotoUrl({
            repId: ctx.repId,
            sourceImageUrl: item.listingPhotoUrl,
            filenameStem: `${item.itemNumber}-listing-photo`,
          })
        ).photoUrl
      } catch (err) {
        explainServiceError(err)
      }
    }

    processedItems.push({
      itemNumber: item.itemNumber,
      ringSize: item.ringSize,
      repNotes: item.repNotes,
      tradePreferences: item.tradePreferences,
      listingPhotoUrl,
    })
  }

  let result: Awaited<ReturnType<typeof addListingBatch>>
  try {
    result = await addListingBatch(admin, ctx.repId, {
      items: processedItems,
    })
  } catch (err) {
    explainServiceError(err)
  }

  // Audit each successful add. Loop, not Promise.all — one audit failure
  // must not cascade to siblings, and each call is already isolated.
  const recoveredNewDesignAdds: Array<{
    listingId: string
    itemNumber: string
    designName: string
    status: string
  }> = []
  if (result.pending.needFullInfo.length > 0) {
    const pendingByItem = new Set(
      result.pending.needFullInfo.map((p) => p.itemNumber),
    )
    const recoveredItemNumbers = new Set<string>()
    const retryItems: typeof processedItems = []

    for (const itemNumber of pendingByItem) {
      const candidates = items.filter((item) => item.itemNumber === itemNumber)
      const recoveryItem = candidates.find(
        (item) => item.designName?.trim() && item.collectionName?.trim(),
      )
      if (!recoveryItem) continue

      const firstResult = await runSingle(
        {
          mode: 'single',
          itemNumber: recoveryItem.itemNumber,
          ringSize: recoveryItem.ringSize,
          repNotes: recoveryItem.repNotes,
          tradePreferences: recoveryItem.tradePreferences,
          listingPhotoUrl: recoveryItem.listingPhotoUrl,
          listingPhotoIndex: recoveryItem.listingPhotoIndex,
          designName: recoveryItem.designName,
          piecePhotoUrl: recoveryItem.piecePhotoUrl,
          piecePhotoIndex: recoveryItem.piecePhotoIndex,
          material: recoveryItem.material,
          mainStone: recoveryItem.mainStone,
          bpMsrp: recoveryItem.bpMsrp,
          collectionName: recoveryItem.collectionName,
          specialFeatures: recoveryItem.specialFeatures,
          lengthInfo: recoveryItem.lengthInfo,
        },
        ctx,
        admin,
      )

      if (typeof firstResult.listingId === 'string') {
        recoveredNewDesignAdds.push({
          listingId: firstResult.listingId,
          itemNumber: firstResult.itemNumber ?? recoveryItem.itemNumber,
          designName: firstResult.designName ?? recoveryItem.designName,
          status: firstResult.status ?? 'available',
        })
        recoveredItemNumbers.add(itemNumber)
        retryItems.push(
          ...candidates.slice(1).map((item) => ({
            itemNumber: item.itemNumber,
            ringSize: item.ringSize,
            repNotes: item.repNotes,
            tradePreferences: item.tradePreferences,
            listingPhotoUrl: undefined,
          })),
        )
      }
    }

    if (retryItems.length > 0) {
      let retryResult: Awaited<ReturnType<typeof addListingBatch>>
      try {
        retryResult = await addListingBatch(admin, ctx.repId, {
          items: retryItems,
        })
      } catch (err) {
        explainServiceError(err)
      }
      result = {
        added: [...result.added, ...retryResult.added],
        pending: {
          needCollection: [
            ...result.pending.needCollection,
            ...retryResult.pending.needCollection,
          ],
          needFullInfo: [
            ...result.pending.needFullInfo.filter(
              (p) => !recoveredItemNumbers.has(p.itemNumber),
            ),
            ...retryResult.pending.needFullInfo,
          ],
        },
      }
    } else if (recoveredItemNumbers.size > 0) {
      result = {
        ...result,
        pending: {
          ...result.pending,
          needFullInfo: result.pending.needFullInfo.filter(
            (p) => !recoveredItemNumbers.has(p.itemNumber),
          ),
        },
      }
    }
  }

  for (const r of result.added) {
    await writeAuditIsolated({
      actionType: 'add_listing',
      repId: ctx.repId,
      targetListingId: r.listingId,
      beforeState: { itemNumber: r.itemNumber, repId: ctx.repId, status: '' },
      afterState: {
        listingId: r.listingId,
        designId: r.designId,
        itemNumber: r.itemNumber,
        repId: ctx.repId,
        status: r.status,
      },
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    })
  }

  return {
    mode: 'batch' as const,
    added: [
      ...recoveredNewDesignAdds,
      ...result.added.map((r) => ({
        listingId: r.listingId,
        itemNumber: r.itemNumber,
        designName: r.designName,
        status: r.status,
      })),
    ],
    pending: {
      needCollection: result.pending.needCollection.map((p) => ({
        itemNumber: p.itemNumber,
        designId: p.designId,
        designName: p.designName,
        message:
          'Design exists but has no collection — cannot list today.',
      })),
      needFullInfo: result.pending.needFullInfo.map((p) => ({
        itemNumber: p.itemNumber,
        message:
          "Not in our database yet — we'll need design name, photo, and collection name.",
      })),
    },
    summary: {
      addedCount: recoveredNewDesignAdds.length + result.added.length,
      needCollectionCount: result.pending.needCollection.length,
      needFullInfoCount: result.pending.needFullInfo.length,
      note: 'Items already on your board are silently skipped — they are not in this report.',
    },
  }
}

export function makeAddListingTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
  activeTradeBoardWorkflow?: ToolContext['activeTradeBoardWorkflow']
}) {
  return tool({
    description:
      "Adds one or more pieces to the authenticated rep's trade board. Supports single + batch. " +
      "Three entry paths are supported: item number, label photo, or item number + label photo. When photos are attached to the conversation, extract the item number and supporting fields from the reveal box via vision before calling — don't ask the rep to type fields you can read off the photo. " +
      "For rings (RG item numbers), capture ringSize before saving. Ring size is usually printed on the box instead of the label; if you cannot read it from a box/details photo, ask the rep for the ring size. " +
      "If the resolved item exists in the jewelry database, pass mode:'single' and itemNumber for one piece, or mode:'batch' and items[] for several pieces at once. " +
      "Order does not matter; use photos and facts in whatever order the rep provides them. Only block on unreadable item details or a genuinely unusable jewelry image. Accept clear rep-provided collection, name, stone, material, MSRP, and ring size instead of requiring proof photos. " +
      "Label, box, and back-of-card photos can provide details; the saved listing/canonical image must show the jewelry clearly. Boxed display photos for earrings, rings, necklaces, and similar pieces count as jewelry-front photos when the jewelry is centered, close, and clear, even with Bomb Party packaging visible. Do not treat label/details photos as bad jewelry photos; a label/details photo is only a label/details photo, and visible jewelry in that label/details photo does not satisfy the jewelry photo requirement. If the only uploaded image is a label/details or back-of-card photo, ask for the first customer-facing jewelry photo. Do not ask for unboxed, no-packaging, or plain-background retakes. Do not ask for retakes without the box/card or on a plain surface. If multiple chat photos are present and the rep identifies the front photo by order, pass listingPhotoIndex or piecePhotoIndex as a 1-based recent add-flow photo number. Ask for another photo only when you cannot tell which attached image is the jewelry-front photo, and do not ask for a reupload when the rep has already confirmed a prior jewelry-front photo. " +
      "If the item isn't in the Sparkle Suite jewelry database, the tool returns needsAction:'create_design'. Use vision to extract designName and readable metadata, and use clear rep-provided fields. Birthday collection names must include the year. For Birthday boxes like 'Birthday Collection March 2026', use collectionName:'March Birthday 2026' and collectionYear:2026 when clear. The handler uploads the photo from chat automatically. " +
      "If the item exists but has no collection assigned, the tool returns needsAction:'provide_collection' (NEEDS_COLLECTION). Ask the rep for the exact collection name, then retry with collectionName. Do not guess it from vision. " +
      "Batch mode sorts results into ready adds plus pending needCollection and needFullInfo buckets.",
    inputSchema,
    execute: async (input) => {
      const admin = createAdminClient()

      if (input.mode === 'single') {
        return await runSingle(input, ctx, admin)
      }
      if (await shouldCollapseRepeatedBatchToSingle(input, ctx)) {
        const firstItem = input.items?.[0]
        return await runSingle(
          {
            ...firstItem,
            mode: 'single',
            itemNumber: firstItem?.itemNumber,
          },
          ctx,
          admin,
        )
      }
      return await runBatch(input, ctx, admin)
    },
  })
}

export const addListingTool: ToolDefinition = {
  name: 'add_listing',
  readOnly: false,
  build: (ctx) =>
    makeAddListingTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
      activeTradeBoardWorkflow: ctx.activeTradeBoardWorkflow,
    }),
}
