import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'
import {
  getPublicSiteRecipes,
  removePublicSiteRecipe,
  reorderPublicSiteRecipes,
  upsertPublicSiteRecipe,
} from '@/lib/services/site-recipes'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  prepTime: z.string().optional(),
  servings: z.number().nullable().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  imagePosition: z.string().optional(),
  modalImageUrl: z.string().optional(),
  modalImagePosition: z.string().optional(),
  tiktokUrl: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  note: z.string().optional(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
  sourceRecipeId: z.string().optional(),
})

const manageSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('upsert'),
    recipe: recipeSchema,
  }),
  z.object({
    action: z.literal('remove'),
    recipeId: z.string(),
  }),
  z.object({
    action: z.literal('reorder'),
    recipeIds: z.array(z.string()).min(1),
  }),
])

function throwToolError(error: unknown): never {
  if (error instanceof ServiceError) {
    throw new NicNacToolError({
      code: error.code,
      userMessage: error.userMessage,
      cause: error,
    })
  }

  throw error
}

export function makeListSiteRecipesTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      'List the authenticated rep public site Pantry recipes, including hidden recipes, copy, images, TikTok URLs, ingredients, steps, notes, categories, and sort order.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const recipes = await getPublicSiteRecipes(ctx.supabase, ctx.repId, {
          visibleOnly: false,
        })
        return {
          count: recipes.length,
          recipes,
        }
      } catch (error) {
        throwToolError(error)
      }
    },
  })
}

export function makeManageSiteRecipesTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      'Add, update, remove, hide/show, or reorder public site Pantry recipe cards for the authenticated rep. Removing a recipe requires visible rep approval before it executes. Editable fields include title, description, category, prep time, servings, card image, modal image, TikTok URL, ingredients, steps, notes, and sort order. Recipe-card photos are source material for ingredients and steps; only reject unreadable recipe cards or genuinely bad public display photos.',
    inputSchema: manageSchema,
    needsApproval: (input) => input.action === 'remove',
    execute: async (input) => {
      try {
        if (input.action === 'remove') {
          return {
            action: 'remove',
            ...(await removePublicSiteRecipe(ctx.supabase, ctx.repId, input.recipeId)),
          }
        }

        if (input.action === 'reorder') {
          return {
            action: 'reorder',
            ...(await reorderPublicSiteRecipes(ctx.supabase, ctx.repId, {
              recipeIds: input.recipeIds,
            })),
          }
        }

        return {
          action: 'upsert',
          recipe: await upsertPublicSiteRecipe(ctx.supabase, ctx.repId, input.recipe),
        }
      } catch (error) {
        throwToolError(error)
      }
    },
  })
}

export const listSiteRecipesTool: ToolDefinition = {
  name: 'list_site_recipes',
  readOnly: true,
  build: (ctx) =>
    makeListSiteRecipesTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}

export const manageSiteRecipesTool: ToolDefinition = {
  name: 'manage_site_recipes',
  readOnly: false,
  build: (ctx) =>
    makeManageSiteRecipesTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
