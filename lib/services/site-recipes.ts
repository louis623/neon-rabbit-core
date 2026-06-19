import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError, errors } from '@/lib/services/errors'
import type {
  PublicSiteRecipe,
  ReorderPublicSiteRecipesInput,
  UpsertPublicSiteRecipeInput,
} from '@/lib/services/types'

const PUBLIC_SITE_RECIPE_SELECT =
  'id, rep_id, title, slug, description, category, prep_time, servings, image_url, image_alt, image_position, modal_image_url, modal_image_position, tiktok_url, ingredients, steps, note, sort_order, is_visible, source_recipe_id, created_at, updated_at'

type PublicSiteRecipeRow = {
  id: string
  rep_id: string
  title: string
  slug: string
  description: string | null
  category: string | null
  prep_time: string | null
  servings: number | null
  image_url: string | null
  image_alt: string | null
  image_position: string | null
  modal_image_url: string | null
  modal_image_position: string | null
  tiktok_url: string | null
  ingredients: unknown
  steps: unknown
  note: string | null
  sort_order: number | null
  is_visible: boolean | null
  source_recipe_id: string | null
  created_at: string | null
  updated_at: string | null
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalUrl(
  value: string | null | undefined,
  field: 'imageUrl' | 'modalImageUrl' | 'tiktokUrl',
) {
  const cleaned = normalizeText(value)
  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) return cleaned

  throw errors.INVALID_INPUT(
    `${field} must be blank or an http(s) URL`,
    'Recipe image and TikTok links need to be full http or https URLs.',
  )
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => normalizeText(typeof item === 'string' ? item : String(item ?? '')))
    .filter(Boolean)
}

function normalizeSortOrder(value: number | undefined) {
  return Number.isFinite(value) ? Math.trunc(value as number) : undefined
}

function normalizeServings(value: number | null | undefined) {
  if (value === null) return null
  if (value === undefined) return undefined
  if (!Number.isFinite(value) || Math.trunc(value) <= 0) {
    throw errors.INVALID_INPUT(
      'recipe servings must be a positive integer or null',
      'Recipe servings need to be a positive number, or blank.',
    )
  }
  return Math.trunc(value)
}

export function slugifyRecipeTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toServiceError(
  code: string,
  message: string,
  userMessage: string,
  cause: unknown,
  statusCode = 500,
) {
  return new ServiceError({
    code,
    message,
    userMessage,
    cause,
    statusCode,
  })
}

function mapRow(row: PublicSiteRecipeRow): PublicSiteRecipe {
  return {
    id: row.id,
    repId: row.rep_id,
    title: row.title,
    slug: row.slug,
    description: normalizeText(row.description),
    category: normalizeText(row.category),
    prepTime: normalizeText(row.prep_time),
    servings: row.servings,
    imageUrl: normalizeText(row.image_url),
    imageAlt: normalizeText(row.image_alt),
    imagePosition: normalizeText(row.image_position) || 'center',
    modalImageUrl: normalizeText(row.modal_image_url),
    modalImagePosition: normalizeText(row.modal_image_position) || 'center',
    tiktokUrl: normalizeText(row.tiktok_url),
    ingredients: normalizeStringArray(row.ingredients),
    steps: normalizeStringArray(row.steps),
    note: normalizeText(row.note),
    sortOrder: row.sort_order ?? 0,
    isVisible: row.is_visible ?? true,
    sourceRecipeId: normalizeText(row.source_recipe_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function buildPatch(repId: string, input: UpsertPublicSiteRecipeInput) {
  const title = normalizeText(input.title)
  if (!title) {
    throw errors.INVALID_INPUT(
      'recipe title is required',
      'I need the recipe title before I can save that Pantry card.',
    )
  }

  const slug = normalizeText(input.slug) || slugifyRecipeTitle(title)
  if (!slug) {
    throw errors.INVALID_INPUT(
      'recipe slug is required',
      'I need a usable recipe title before I can save that Pantry card.',
    )
  }

  const servings = normalizeServings(input.servings)
  const sortOrder = normalizeSortOrder(input.sortOrder)

  return {
    rep_id: repId,
    title,
    slug,
    description: normalizeText(input.description),
    category: normalizeText(input.category),
    prep_time: normalizeText(input.prepTime),
    ...(servings !== undefined ? { servings } : {}),
    image_url: normalizeOptionalUrl(input.imageUrl, 'imageUrl'),
    image_alt: normalizeText(input.imageAlt),
    image_position: normalizeText(input.imagePosition) || 'center',
    modal_image_url: normalizeOptionalUrl(input.modalImageUrl, 'modalImageUrl'),
    modal_image_position: normalizeText(input.modalImagePosition) || 'center',
    tiktok_url: normalizeOptionalUrl(input.tiktokUrl, 'tiktokUrl'),
    ingredients: normalizeStringArray(input.ingredients),
    steps: normalizeStringArray(input.steps),
    note: normalizeText(input.note),
    ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    ...(input.isVisible !== undefined ? { is_visible: input.isVisible } : {}),
    source_recipe_id: normalizeText(input.sourceRecipeId),
  }
}

export async function getPublicSiteRecipes(
  supabase: SupabaseClient,
  repId: string,
  options: { visibleOnly?: boolean } = {},
): Promise<PublicSiteRecipe[]> {
  let query = supabase
    .from('public_site_recipes')
    .select(PUBLIC_SITE_RECIPE_SELECT)
    .eq('rep_id', repId)

  if (options.visibleOnly !== false) {
    query = query.eq('is_visible', true)
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    throw toServiceError(
      'PUBLIC_SITE_RECIPES_LOOKUP_FAILED',
      'failed to load public site recipes',
      "I couldn't load the Pantry recipes right now.",
      error,
    )
  }

  return ((data ?? []) as PublicSiteRecipeRow[]).map(mapRow)
}

export async function upsertPublicSiteRecipe(
  supabase: SupabaseClient,
  repId: string,
  input: UpsertPublicSiteRecipeInput,
): Promise<PublicSiteRecipe> {
  const patch = buildPatch(repId, input)

  const query = input.id
    ? supabase
        .from('public_site_recipes')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('rep_id', repId)
        .eq('id', input.id)
    : supabase.from('public_site_recipes').insert(patch)

  const { data, error } = await query.select(PUBLIC_SITE_RECIPE_SELECT).single()

  if (error || !data) {
    throw toServiceError(
      'PUBLIC_SITE_RECIPE_SAVE_FAILED',
      'failed to save public site recipe',
      "I couldn't save that Pantry recipe right now.",
      error ?? new Error('public site recipe save returned no row'),
    )
  }

  return mapRow(data as PublicSiteRecipeRow)
}

export async function removePublicSiteRecipe(
  supabase: SupabaseClient,
  repId: string,
  recipeId: string,
): Promise<{ recipeId: string }> {
  const normalizedId = normalizeText(recipeId)
  if (!normalizedId) {
    throw errors.INVALID_INPUT(
      'recipe id is required',
      'Which Pantry recipe should I remove?',
    )
  }

  const { error } = await supabase
    .from('public_site_recipes')
    .delete()
    .eq('rep_id', repId)
    .eq('id', normalizedId)

  if (error) {
    throw toServiceError(
      'PUBLIC_SITE_RECIPE_REMOVE_FAILED',
      'failed to remove public site recipe',
      "I couldn't remove that Pantry recipe right now.",
      error,
    )
  }

  return { recipeId: normalizedId }
}

export async function reorderPublicSiteRecipes(
  supabase: SupabaseClient,
  repId: string,
  input: ReorderPublicSiteRecipesInput,
): Promise<{ updatedCount: number }> {
  if (!Array.isArray(input.recipeIds) || input.recipeIds.length === 0) {
    throw errors.INVALID_INPUT(
      'recipeIds must include at least one id',
      'Tell me the Pantry recipe order you want to save.',
    )
  }

  for (const [index, recipeId] of input.recipeIds.entries()) {
    const normalizedId = normalizeText(recipeId)
    if (!normalizedId) continue

    const { error } = await supabase
      .from('public_site_recipes')
      .update({
        sort_order: index,
        updated_at: new Date().toISOString(),
      })
      .eq('rep_id', repId)
      .eq('id', normalizedId)

    if (error) {
      throw toServiceError(
        'PUBLIC_SITE_RECIPES_REORDER_FAILED',
        'failed to reorder public site recipes',
        "I couldn't reorder the Pantry recipes right now.",
        error,
      )
    }
  }

  return { updatedCount: input.recipeIds.length }
}
