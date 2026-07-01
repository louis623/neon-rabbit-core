import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildSiteRecipeDraftFromImages,
  type SiteRecipeDraftImage,
} from '@/lib/nic-nac/site-recipe-draft-builder'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import {
  uploadPublicSiteMedia,
  uploadStagedOriginalPhoto,
} from '@/lib/services/storage'
import type { ToolDefinition } from './types'

const photoIndexSchema = z.number().int().min(1).max(10)

const inputSchema = z.object({
  title: z.string(),
  displayPhotoIndexes: z.array(photoIndexSchema).max(2).optional(),
  recipeCardImageIndexes: z.array(photoIndexSchema).min(1).max(6),
})

type ToolInput = z.infer<typeof inputSchema>

type ConversationImage = {
  index: number
  dataUrl: string
  mediaType: string
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim().slice(0, 160)
}

function filenameStem(title: string) {
  return (
    normalizeTitle(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'recipe'
  )
}

async function loadRecentConversationImages(ctx: {
  supabase: SupabaseClient
  conversationId: string
}): Promise<ConversationImage[]> {
  const { data, error } = await ctx.supabase
    .from('nic_nac_conversations')
    .select('message_id, parts, created_at')
    .eq('conversation_id', ctx.conversationId)
    .eq('role', 'user')
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error

  return (data ?? [])
    .slice()
    .reverse()
    .flatMap((row) => {
      const parts = row.parts as
        | Array<{ type?: string; mediaType?: string; url?: string }>
        | null
      return (parts ?? [])
        .filter(
          (part) =>
            part?.type === 'file' &&
            typeof part.mediaType === 'string' &&
            part.mediaType.startsWith('image/') &&
            typeof part.url === 'string',
        )
        .map((part) => ({
          dataUrl: part.url as string,
          mediaType: part.mediaType as string,
        }))
    })
    .map((image, index) => ({ ...image, index: index + 1 }))
}

function chooseImages(images: ConversationImage[], indexes: number[]) {
  return indexes.map((index) => {
    const image = images[index - 1]
    if (!image) {
      throw new NicNacToolError({
        code: 'RECIPE_PHOTO_CHOICE_REQUIRED',
        userMessage: `I found ${images.length} recent recipe photo${
          images.length === 1 ? '' : 's'
        }, so I couldn't use photo ${index}. Tell me which attached images are the food photo and recipe-card photo.`,
      })
    }
    return image
  })
}

async function uploadDraftImages(input: {
  repId: string
  title: string
  displayPhotos: ConversationImage[]
  recipeCardPhotos: ConversationImage[]
}) {
  const stem = filenameStem(input.title)
  const displayPhotoUrls = await Promise.all(
    input.displayPhotos.map((image, index) =>
      uploadPublicSiteMedia(input.repId, image.dataUrl, {
        folder: 'recipes',
        filename: `${stem}-display-${image.index || index + 1}`,
      }),
    ),
  )
  const recipeCardSignedUrls = await Promise.all(
    input.recipeCardPhotos.map((image) =>
      uploadStagedOriginalPhoto(
        input.repId,
        image.dataUrl,
        `${stem}-recipe-card-${image.index}`,
      ).then((result) => result.signedUrl),
    ),
  )

  const draftImages: SiteRecipeDraftImage[] = [
    ...displayPhotoUrls.map((url) => ({
      role: 'display_photo' as const,
      url,
    })),
    ...recipeCardSignedUrls.map((url) => ({
      role: 'recipe_card' as const,
      url,
    })),
  ]

  return { displayPhotoUrls, draftImages }
}

export function makeBuildSiteRecipeDraftTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
}) {
  return tool({
    description:
      "Builds a BlingKitchen Pantry recipe draft from recent chat image uploads without saving it. Use recipeCardImageIndexes for photos of the handwritten/printed recipe card or ingredient/instruction source. Use displayPhotoIndexes for finished food photos that should appear publicly. Indexes are 1-based in recent chat photo order. Recipe-card photos are source material only; do not reject them for being plain or handwritten if readable. If photo roles are unclear, ask which images are the food photos and which are recipe cards. After this returns a draft, summarize it and ask the rep to approve before calling manage_site_recipes.",
    inputSchema,
    execute: async (input: ToolInput) => {
      const title = normalizeTitle(input.title)
      if (!title) {
        throw new NicNacToolError({
          code: 'RECIPE_TITLE_REQUIRED',
          userMessage: 'I need the recipe title before I can build the draft.',
        })
      }

      const images = await loadRecentConversationImages({
        supabase: ctx.supabase,
        conversationId: ctx.conversationId,
      })
      if (images.length === 0) {
        throw new NicNacToolError({
          code: 'RECIPE_IMAGES_REQUIRED',
          userMessage:
            "I don't see recipe photos in this chat yet. Send the food photo and recipe-card photo, then I can build it.",
        })
      }

      const recipeCardPhotos = chooseImages(images, input.recipeCardImageIndexes)
      const displayPhotos = chooseImages(images, input.displayPhotoIndexes ?? [])
      const { displayPhotoUrls, draftImages } = await uploadDraftImages({
        repId: ctx.repId,
        title,
        displayPhotos,
        recipeCardPhotos,
      })

      try {
        const draft = await buildSiteRecipeDraftFromImages({
          title,
          images: draftImages,
        })
        const primaryDisplayPhotoUrl = displayPhotoUrls[0] ?? ''
        const modalDisplayPhotoUrl = displayPhotoUrls[1] ?? primaryDisplayPhotoUrl

        return {
          ok: true,
          action: 'draft',
          draft: {
            ...draft,
            imageUrl: primaryDisplayPhotoUrl,
            modalImageUrl: modalDisplayPhotoUrl,
          },
          source: {
            displayPhotoIndexes: input.displayPhotoIndexes ?? [],
            recipeCardImageIndexes: input.recipeCardImageIndexes,
            displayPhotoUrls,
            recipeCardImageCount: recipeCardPhotos.length,
          },
          message:
            'Draft built only. Ask the rep to approve the recipe details before saving with manage_site_recipes.',
        }
      } catch {
        return {
          ok: false,
          code: 'MODEL_UNAVAILABLE',
          message:
            'Nic-Nac can see and store the uploaded photos, but the recipe builder needs the OpenAI billing/quota issue cleared before it can read recipe-card images.',
          source: {
            displayPhotoIndexes: input.displayPhotoIndexes ?? [],
            recipeCardImageIndexes: input.recipeCardImageIndexes,
            displayPhotoUrls,
            recipeCardImageCount: recipeCardPhotos.length,
          },
        }
      }
    },
  })
}

export const buildSiteRecipeDraftTool: ToolDefinition = {
  name: 'build_site_recipe_draft',
  readOnly: false,
  build: (ctx) =>
    makeBuildSiteRecipeDraftTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
    }),
}
