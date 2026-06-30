import { z } from 'zod'
import { tool } from 'ai'
import { reportJewelryCatalogIssue } from '@/lib/services/jewelry-catalog-corrections'
import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolContext, ToolDefinition } from './types'

const inputSchema = z.object({
  itemNumber: z.string(),
  issueType: z.enum([
    'wrong_item_number',
    'wrong_collection',
    'wrong_collection_year',
    'wrong_design_name',
    'wrong_msrp',
    'wrong_jewelry_type',
    'wrong_material',
    'wrong_stone',
    'wrong_tags',
    'bad_photo',
    'duplicate',
    'other',
  ]),
  reason: z.string(),
  correction: z
    .object({
      designName: z.string().optional(),
      collectionName: z.string().optional(),
      collectionYear: z.number().int().min(2020).max(2040).nullable().optional(),
      material: z.string().nullable().optional(),
      mainStone: z.string().nullable().optional(),
      bpMsrp: z.number().nullable().optional(),
      specialFeatures: z.string().nullable().optional(),
      lengthInfo: z.string().nullable().optional(),
      searchTags: z.array(z.string()).max(8).optional(),
      canonicalPhotoUrl: z.string().optional(),
    })
    .optional(),
})

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

export const reportJewelryCatalogIssueTool: ToolDefinition = {
  name: 'report_jewelry_catalog_issue',
  readOnly: false,
  build: (ctx: ToolContext) =>
    tool({
      description:
        'Report and, when the rep provides corrected information, fix inaccurate shared jewelry catalog data. Use for wrong collection, bad photo, wrong MSRP, wrong name, wrong stone/material, duplicates, or other catalog quality issues. Canonical catalog photo replacement must use an approved jewelry-front image; never replace the canonical catalog photo with a label/details or back-of-card photo. Nic-Nac applies the correction; Louis is not the default review queue.',
      inputSchema,
      execute: async (input) => {
        const admin = createAdminClient()
        try {
          return await reportJewelryCatalogIssue(admin, {
            itemNumber: input.itemNumber,
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            issueType: input.issueType,
            reason: input.reason,
            correction: input.correction,
          })
        } catch (err) {
          explainServiceError(err)
        }
      },
    }),
}
