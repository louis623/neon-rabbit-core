// Tool: add_listing — write. Adds one or more pieces to the rep's trade board.
// Two modes: single (one item number) and batch (an array of items). Handles
// NEEDS_FULL_INFO (unknown design) by creating the design first when the rep
// supplies the new-design fields on a follow-up call. Clickwrap acceptance is
// the rep's confirmation gate (no HITL approval dialog).
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
import type { ToolDefinition } from './types'

const itemBaseShape = {
  itemNumber: z.string(),
  repNotes: z.string().optional(),
  tradePreferences: z.string().optional(),
  listingPhotoUrl: z.string().optional(),
}

const newDesignShape = {
  designName: z.string().optional(),
  piecePhotoUrl: z.string().optional(),
  material: z.string().optional(),
  mainStone: z.string().optional(),
  bpMsrp: z.number().optional(),
  collectionName: z.string().optional(),
  specialFeatures: z.string().optional(),
  lengthInfo: z.string().optional(),
}

const batchItem = z.object({
  ...itemBaseShape,
  ...newDesignShape,
})

const inputSchema = z.object({
  mode: z.enum(['single', 'batch']),
  clickwrapAccepted: z.boolean(),
  // Single-mode top-level fields. itemNumber is optional in the schema so
  // batch-mode calls can omit it; runtime validates presence per mode.
  itemNumber: z.string().optional(),
  repNotes: z.string().optional(),
  tradePreferences: z.string().optional(),
  listingPhotoUrl: z.string().optional(),
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

// Look up the most recent user-uploaded image part in this conversation and
// return its client-compressed data URL plus any persisted dimensions. Returns
// null if no image part is found in any complete user message — caller is
// responsible for surfacing MISSING_PIECE_PHOTO. Mirrors the persistence.ts
// pattern of ordering by created_at DESC with id as the deterministic
// tiebreaker so timestamp collisions don't pick the wrong message.
async function resolvePhotoFromConversation(ctx: {
  supabase: SupabaseClient
  conversationId: string
}): Promise<{
  imageDataUrl: string
} | null> {
  const { data, error } = await ctx.supabase
    .from('nic_nac_conversations')
    .select('parts')
    .eq('conversation_id', ctx.conversationId)
    .eq('role', 'user')
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  for (const row of data ?? []) {
    const parts = row.parts as Array<{
      type?: string
      mediaType?: string
      url?: string
    }> | null
    if (!parts) continue
    const imagePart = parts.find(
      (p) =>
        p?.type === 'file' &&
        typeof p.mediaType === 'string' &&
        p.mediaType.startsWith('image/') &&
        typeof p.url === 'string',
    )
    if (imagePart?.url) {
      return {
        imageDataUrl: imagePart.url,
      }
    }
  }
  return null
}

async function runSingle(
  input: ToolInput,
  ctx: {
    repId: string
    conversationId: string
    runId: string
    supabase: SupabaseClient
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

  let createdNewDesign = false
  let photoPreflight:
    | ReturnType<typeof assessJewelryPhotoPreflight>
    | null = null
  let photoPipelineStatus: string | null = null
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

  // New-design recovery: rep is retrying after a prior NEEDS_FULL_INFO.
  // Require collectionName here even though the service layer accepts a
  // null collection — addListing rejects any design without a collection,
  // so creating one without it would dead-end on the very next call.
  // The photo URL is resolved server-side: prefer the manual fallback if the
  // model passed one, otherwise upload the most recent chat image.
  if (designName) {
    if (!collectionName) {
      throw new NicNacToolError({
        code: 'NEEDS_COLLECTION_FOR_NEW_DESIGN',
        userMessage:
          "I also need a collection name for new pieces — without a collection I can create the design but can't list it.",
      })
    }

    let resolvedPhotoUrl: string | null = piecePhotoUrl?.trim() || null
    let stagedOriginal:
      | {
          objectPath: string
          signedUrl: string
        }
      | null = null
    if (resolvedPhotoUrl) {
      let preparedSource: Awaited<ReturnType<typeof prepareDesignSourcePhoto>>
      try {
        preparedSource = await prepareDesignSourcePhoto({
          repId: ctx.repId,
          sourceImageUrl: resolvedPhotoUrl,
          filenameStem: itemNumber,
        })
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
      photoPipelineStatus = 'ready'
    } else {
      const resolvedPhoto = await resolvePhotoFromConversation({
        supabase: ctx.supabase,
        conversationId: ctx.conversationId,
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
        preparedSource = await prepareDesignSourcePhoto({
          repId: ctx.repId,
          sourceImageDataUrl: resolvedPhoto.imageDataUrl,
          filenameStem: itemNumber,
        })
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
      photoPipelineStatus = 'ready'
    }

    let createResult: Awaited<ReturnType<typeof createDesign>>
    try {
      createResult = await createDesign(admin, {
        itemNumber,
        designName,
        piecePhotoUrl: resolvedPhotoUrl,
        collectionName,
        material: input.material,
        mainStone: input.mainStone,
        bpMsrp: input.bpMsrp,
        specialFeatures: input.specialFeatures,
        lengthInfo: input.lengthInfo,
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
    if (stagedOriginal) {
      const photoroomConfig = getPhotoroomConfig()
      if (photoroomConfig) {
        try {
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
              photoPipelineStatus = 'published'
            } else {
              await updatePhotoPipelineState(admin, createResult.designId, {
                provider: 'photoroom',
                enhancedUrl: enhancedPhotoUrl,
                status: 'qa_review',
                qaDecision: outputQa.qaDecision,
                processedAt: new Date().toISOString(),
              })
              photoPipelineStatus = 'qa_review'
            }
          } else {
            await updatePhotoPipelineState(admin, createResult.designId, {
              provider: 'photoroom',
              status: 'rejected',
              qaDecision: outputQa.qaDecision,
              processedAt: new Date().toISOString(),
            })
            photoPipelineStatus = 'rejected'
          }
        } catch (photoErr) {
          photoPipelineStatus = 'error'
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

  let result: Awaited<ReturnType<typeof addListing>>
  let processedListingPhotoUrl: string | undefined
  if (input.listingPhotoUrl) {
    try {
      processedListingPhotoUrl = (
        await processRepListingPhotoUrl({
          repId: ctx.repId,
          sourceImageUrl: input.listingPhotoUrl,
          filenameStem: `${itemNumber}-listing-photo`,
        })
      ).photoUrl
    } catch (err) {
      explainServiceError(err)
    }
  }
  try {
    result = await addListing(admin, ctx.repId, {
      itemNumber,
      clickwrapAccepted: true,
      collectionName: input.collectionName,
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
            'piecePhotoUrl',
            'material',
            'mainStone',
            'bpMsrp',
            'specialFeatures',
            'lengthInfo',
          ],
          message: `${itemNumber} isn't in our database yet. Use vision on the rep's photos to extract designName and any optional metadata you can read. Then ask the rep to confirm or provide collectionName before retrying — never extract or autofill the collection from vision alone (collections match by exact-string and a vision guess creates a junk row). The handler uploads the photo from chat automatically — do NOT ask the rep for a URL or include piecePhotoUrl unless they explicitly volunteered a real one.`,
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
    ...(photoPipelineStatus ? { photoPipelineStatus } : {}),
    ...(photoPreflight ? { photoPreflight } : {}),
  }
}

async function runBatch(
  input: ToolInput,
  ctx: { repId: string; conversationId: string; runId: string },
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
      repNotes: item.repNotes,
      tradePreferences: item.tradePreferences,
      listingPhotoUrl,
    })
  }

  let result: Awaited<ReturnType<typeof addListingBatch>>
  try {
    result = await addListingBatch(admin, ctx.repId, {
      items: processedItems,
      clickwrapAccepted: true,
    })
  } catch (err) {
    explainServiceError(err)
  }

  // Audit each successful add. Loop, not Promise.all — one audit failure
  // must not cascade to siblings, and each call is already isolated.
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
    added: result.added.map((r) => ({
      listingId: r.listingId,
      itemNumber: r.itemNumber,
      designName: r.designName,
      status: r.status,
    })),
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
      addedCount: result.added.length,
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
}) {
  return tool({
    description:
      "Adds one or more pieces to the authenticated rep's trade board. Supports single + batch. " +
      "Requires clickwrap acceptance — the rep must confirm in conversation that they own the piece, the listing details are accurate, and that final trade decisions stay with them before this is set true. MSRP is reference data, not the trade-parity engine. " +
      "Three entry paths are supported: item number, label photo, or item number + label photo. When photos are attached to the conversation, extract the item number and supporting fields from the reveal box via vision before calling — don't ask the rep to type fields you can read off the photo. " +
      "If the resolved item exists in the jewelry database, pass mode:'single', itemNumber, clickwrapAccepted for one piece, or mode:'batch', items[], clickwrapAccepted for several pieces at once. " +
      "If the item isn't in the database, the tool returns needsAction:'create_design'. Use vision to extract designName, then confirm collectionName with the rep before retrying — never autofill the collection from vision alone. The handler uploads the photo from chat automatically; only include piecePhotoUrl if the rep volunteered a real URL. " +
      "If the item exists but has no collection assigned, the tool returns needsAction:'provide_collection' (NEEDS_COLLECTION). Ask the rep for the exact collection name, then retry with collectionName. Do not guess it from vision. " +
      "Batch mode sorts results into ready adds plus pending needCollection and needFullInfo buckets.",
    inputSchema,
    execute: async (input) => {
      const admin = createAdminClient()

      if (!input.clickwrapAccepted) {
        throw new NicNacToolError({
          code: 'CLICKWRAP_REQUIRED',
          userMessage:
            'Before I list this, I need you to confirm you own the piece, the listing details are accurate, and that final trade decisions stay with you. MSRP is reference data, not the trade-parity engine.',
        })
      }

      if (input.mode === 'single') {
        return await runSingle(input, ctx, admin)
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
    }),
}
