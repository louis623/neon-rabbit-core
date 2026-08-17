import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'
import {
  getPublicSiteRecipes,
  removePublicSiteRecipe,
  reorderPublicSiteRecipes,
  slugifyRecipeTitle,
  upsertPublicSiteRecipe,
} from '@/lib/services/site-recipes'

function makeSelectQuery(rows: unknown[], error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (
      resolve: (value: { data: unknown[]; error: unknown }) => unknown,
    ) => resolve({ data: rows, error }),
  }
  return query
}

function makeWriteQuery(row: unknown, error: unknown = null) {
  const query = {
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve({ data: row, error })),
    then: (
      resolve: (value: { error: unknown }) => unknown,
    ) => resolve({ error }),
  }
  return query
}

type MockSupabaseClient = Parameters<typeof getPublicSiteRecipes>[0] & {
  from: ReturnType<typeof vi.fn>
}

function makeSupabaseClient(query?: unknown): MockSupabaseClient {
  return { from: vi.fn(() => query) } as unknown as MockSupabaseClient
}

describe('site recipes service', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('normalizes recipe rows and orders visible recipes by sort order then title', async () => {
    const query = makeSelectQuery([
      {
        id: 'recipe-1',
        rep_id: 'rep-1',
        title: 'Family Pasta Sauce',
        slug: 'family-pasta-sauce',
        description: 'Low and slow.',
        category: 'Italian Classics',
        prep_time: '2+ hours',
        servings: 12,
        image_url: 'https://cdn.example.com/sauce.jpg',
        image_alt: 'Sauce',
        image_position: 'center 20%',
        modal_image_url: '',
        modal_image_position: '',
        tiktok_url: 'https://www.tiktok.com/@blingkitchen/video/1',
        ingredients: [' Tomatoes ', '', 'Garlic'],
        steps: ['Simmer'],
        note: 'Freezer friendly',
        sort_order: 2,
        is_visible: true,
        source_recipe_id: '3',
        recipe_source_image_urls: ['https://cdn.example.com/sauce-card.jpg'],
        created_at: '2026-06-19T12:00:00.000Z',
        updated_at: null,
      },
    ])
    const supabase = makeSupabaseClient(query)

    const recipes = await getPublicSiteRecipes(supabase, 'rep-1')

    expect(supabase.from).toHaveBeenCalledWith('public_site_recipes')
    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining('modal_image_position'),
    )
    expect(query.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(query.eq).toHaveBeenCalledWith('is_visible', true)
    expect(query.order).toHaveBeenNthCalledWith(1, 'sort_order', {
      ascending: true,
    })
    expect(query.order).toHaveBeenNthCalledWith(2, 'title', {
      ascending: true,
    })
    expect(recipes).toEqual([
      expect.objectContaining({
        id: 'recipe-1',
        repId: 'rep-1',
        title: 'Family Pasta Sauce',
        ingredients: ['Tomatoes', 'Garlic'],
        imagePosition: 'center 20%',
        modalImagePosition: 'center',
        recipeSourceImageUrls: ['https://cdn.example.com/sauce-card.jpg'],
      }),
    ])
  })

  it('saves recipe copy, arrays, generated slug, links, and visibility', async () => {
    vi.setSystemTime(new Date('2026-06-19T13:00:00.000Z'))
    const query = makeWriteQuery({
      id: 'recipe-2',
      rep_id: 'rep-1',
      title: 'Homemade Coffee Creamer',
      slug: 'homemade-coffee-creamer',
      description: 'Morning favorite.',
      category: 'Drinks & Extras',
      prep_time: '10 minutes',
      servings: 16,
      image_url: 'https://cdn.example.com/creamer.jpg',
      image_alt: '',
      image_position: 'center',
      modal_image_url: '',
      modal_image_position: 'center',
      tiktok_url: '',
      ingredients: ['Half & Half', 'Vanilla'],
      steps: ['Whisk'],
      note: '',
      sort_order: 1,
      is_visible: true,
      source_recipe_id: '2',
      recipe_source_image_urls: ['https://cdn.example.com/creamer-card.jpg'],
      created_at: null,
      updated_at: '2026-06-19T13:00:00.000Z',
    })
    const supabase = makeSupabaseClient(query)

    const recipe = await upsertPublicSiteRecipe(supabase, 'rep-1', {
      title: 'Homemade Coffee Creamer',
      description: 'Morning favorite.',
      category: 'Drinks & Extras',
      prepTime: '10 minutes',
      servings: 16,
      imageUrl: 'https://cdn.example.com/creamer.jpg',
      ingredients: [' Half & Half ', '', 'Vanilla'],
      steps: ['Whisk'],
      sortOrder: 1,
      sourceRecipeId: '2',
      recipeSourceImageUrls: [' https://cdn.example.com/creamer-card.jpg '],
    })

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        title: 'Homemade Coffee Creamer',
        slug: 'homemade-coffee-creamer',
        ingredients: ['Half & Half', 'Vanilla'],
        steps: ['Whisk'],
        image_url: 'https://cdn.example.com/creamer.jpg',
        source_recipe_id: '2',
        recipe_source_image_urls: ['https://cdn.example.com/creamer-card.jpg'],
      }),
    )
    expect(recipe).toMatchObject({
      id: 'recipe-2',
      slug: 'homemade-coffee-creamer',
      ingredients: ['Half & Half', 'Vanilla'],
    })
  })

  it('consolidates legacy baking and dessert labels into Baking & Sweets', async () => {
    const query = makeWriteQuery({
      id: 'recipe-4',
      rep_id: 'rep-1',
      title: 'Peanut Butter Cookies',
      slug: 'peanut-butter-cookies',
      description: '',
      category: 'Baking & Sweets',
      prep_time: '',
      servings: null,
      image_url: '',
      image_alt: '',
      image_position: 'center',
      modal_image_url: '',
      modal_image_position: 'center',
      tiktok_url: '',
      ingredients: [],
      steps: [],
      note: '',
      sort_order: 0,
      is_visible: true,
      source_recipe_id: '',
      recipe_source_image_urls: [],
      created_at: null,
      updated_at: null,
    })
    const supabase = makeSupabaseClient(query)

    await upsertPublicSiteRecipe(supabase, 'rep-1', {
      title: 'Peanut Butter Cookies',
      category: 'Dessert',
    })

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Baking & Sweets' }),
    )
  })

  it('patches existing recipes by rep and id', async () => {
    vi.setSystemTime(new Date('2026-06-19T13:30:00.000Z'))
    const query = makeWriteQuery({
      id: 'recipe-3',
      rep_id: 'rep-1',
      title: 'Updated Sauce',
      slug: 'updated-sauce',
      description: '',
      category: '',
      prep_time: '',
      servings: null,
      image_url: '',
      image_alt: '',
      image_position: 'center',
      modal_image_url: '',
      modal_image_position: 'center',
      tiktok_url: '',
      ingredients: [],
      steps: [],
      note: '',
      sort_order: 0,
      is_visible: false,
      source_recipe_id: '',
      recipe_source_image_urls: [],
      created_at: null,
      updated_at: '2026-06-19T13:30:00.000Z',
    })
    const supabase = makeSupabaseClient(query)

    await upsertPublicSiteRecipe(supabase, 'rep-1', {
      id: 'recipe-3',
      title: 'Updated Sauce',
      isVisible: false,
    })

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Sauce',
        updated_at: '2026-06-19T13:30:00.000Z',
        is_visible: false,
      }),
    )
    expect(query.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(query.eq).toHaveBeenCalledWith('id', 'recipe-3')
    expect(query.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ recipe_source_image_urls: expect.anything() }),
    )
  })

  it('rejects invalid titles, servings, and non-http links', async () => {
    const supabase = makeSupabaseClient()

    await expect(
      upsertPublicSiteRecipe(supabase, 'rep-1', { title: '' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage: 'I need the recipe title before I can save that Pantry card.',
    })
    await expect(
      upsertPublicSiteRecipe(supabase, 'rep-1', {
        title: 'Sauce',
        servings: 0,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage: 'Recipe servings need to be a positive number, or blank.',
    })
    await expect(
      upsertPublicSiteRecipe(supabase, 'rep-1', {
        title: 'Sauce',
        imageUrl: 'not-a-url',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage: 'Recipe image and TikTok links need to be full http or https URLs.',
    })
    await expect(
      upsertPublicSiteRecipe(supabase, 'rep-1', {
        title: 'Sauce',
        recipeSourceImageUrls: ['javascript:alert(1)'],
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage: 'Recipe image and TikTok links need to be full http or https URLs.',
    })
  })

  it('removes and reorders recipes by rep ownership', async () => {
    const removeQuery = makeWriteQuery(null)
    const reorderQuery = makeWriteQuery(null)
    const supabase = {
      from: vi
        .fn()
        .mockReturnValueOnce(removeQuery)
        .mockReturnValueOnce(reorderQuery)
        .mockReturnValueOnce(reorderQuery),
    } as unknown as MockSupabaseClient

    await expect(
      removePublicSiteRecipe(supabase, 'rep-1', 'recipe-old'),
    ).resolves.toEqual({ recipeId: 'recipe-old' })
    await expect(
      reorderPublicSiteRecipes(supabase, 'rep-1', {
        recipeIds: ['recipe-a', 'recipe-b'],
      }),
    ).resolves.toEqual({ updatedCount: 2 })

    expect(removeQuery.delete).toHaveBeenCalled()
    expect(removeQuery.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(removeQuery.eq).toHaveBeenCalledWith('id', 'recipe-old')
    expect(reorderQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ sort_order: 0 }),
    )
    expect(reorderQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ sort_order: 1 }),
    )
  })

  it('translates database failures into service errors', async () => {
    const query = makeSelectQuery([], { message: 'database down' })
    const supabase = makeSupabaseClient(query)

    await expect(getPublicSiteRecipes(supabase, 'rep-1')).rejects.toMatchObject({
      code: 'PUBLIC_SITE_RECIPES_LOOKUP_FAILED',
      userMessage: "I couldn't load the Pantry recipes right now.",
    })
  })

  it('generates stable readable recipe slugs', () => {
    expect(slugifyRecipeTitle("Heather's Family Pasta Sauce!")).toBe(
      'heathers-family-pasta-sauce',
    )
    expect(errors.INVALID_INPUT).toBeTypeOf('function')
  })
})
