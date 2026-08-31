import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError, errors } from '@/lib/services/errors'

const getPaidNicNacContextMock = vi.fn()
const getPublicSiteRecipesMock = vi.fn()
const upsertPublicSiteRecipeMock = vi.fn()
const removePublicSiteRecipeMock = vi.fn()
const reorderPublicSiteRecipesMock = vi.fn()
const uploadPublicSiteMediaMock = vi.fn()
const buildSiteRecipeDraftFromImagesMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: (...args: unknown[]) =>
    getPaidNicNacContextMock(...args),
}))

vi.mock('@/lib/services/site-recipes', () => ({
  getPublicSiteRecipes: (...args: unknown[]) => getPublicSiteRecipesMock(...args),
  upsertPublicSiteRecipe: (...args: unknown[]) =>
    upsertPublicSiteRecipeMock(...args),
  removePublicSiteRecipe: (...args: unknown[]) =>
    removePublicSiteRecipeMock(...args),
  reorderPublicSiteRecipes: (...args: unknown[]) =>
    reorderPublicSiteRecipesMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadPublicSiteMedia: (...args: unknown[]) => uploadPublicSiteMediaMock(...args),
}))

vi.mock('@/lib/nic-nac/site-recipe-draft-builder', () => ({
  buildSiteRecipeDraftFromImages: (...args: unknown[]) =>
    buildSiteRecipeDraftFromImagesMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/site-recipes/route'
import { POST as POST_DRAFT } from '@/app/api/nic-nac/site-recipes/draft/route'
import { POST as POST_IMAGE } from '@/app/api/nic-nac/site-recipes/image/route'
import { POST as POST_SITE_MEDIA } from '@/app/api/nic-nac/site-settings/media/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('/api/nic-nac/site-recipes', () => {
  beforeEach(() => {
    getPaidNicNacContextMock.mockReset()
    getPublicSiteRecipesMock.mockReset()
    upsertPublicSiteRecipeMock.mockReset()
    removePublicSiteRecipeMock.mockReset()
    reorderPublicSiteRecipesMock.mockReset()
    uploadPublicSiteMediaMock.mockReset()
    buildSiteRecipeDraftFromImagesMock.mockReset()
  })

  it('lists all visible and hidden Pantry recipes for the paid rep context', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    getPublicSiteRecipesMock.mockResolvedValueOnce([
      {
        id: 'recipe-1',
        title: 'Family Pasta Sauce',
        isVisible: true,
      },
    ])

    const response = await GET()

    expect(getPublicSiteRecipesMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      { visibleOnly: false },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      recipes: [
        {
          id: 'recipe-1',
          title: 'Family Pasta Sauce',
          isVisible: true,
        },
      ],
    })
  })

  it('upserts a Pantry recipe with copy, images, TikTok, ingredients, and steps', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    upsertPublicSiteRecipeMock.mockResolvedValueOnce({
      id: 'recipe-2',
      title: 'Homemade Coffee Creamer',
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/site-recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          recipe: {
            title: 'Homemade Coffee Creamer',
            description: 'Morning favorite.',
            imageUrl: 'https://cdn.example.com/creamer.jpg',
            tiktokUrl: 'https://www.tiktok.com/@blingkitchen/video/1',
            ingredients: ['Half & Half', 'Vanilla'],
            steps: ['Whisk'],
          },
        }),
      }),
    )

    expect(upsertPublicSiteRecipeMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      expect.objectContaining({
        title: 'Homemade Coffee Creamer',
        imageUrl: 'https://cdn.example.com/creamer.jpg',
        tiktokUrl: 'https://www.tiktok.com/@blingkitchen/video/1',
        ingredients: ['Half & Half', 'Vanilla'],
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      recipe: {
        id: 'recipe-2',
        title: 'Homemade Coffee Creamer',
      },
    })
  })

  it('removes and reorders Pantry recipes by explicit actions', async () => {
    getPaidNicNacContextMock
      .mockResolvedValueOnce({
        repId: 'rep-bling',
        supabase: { marker: 'supabase' },
      })
      .mockResolvedValueOnce({
        repId: 'rep-bling',
        supabase: { marker: 'supabase' },
      })
    removePublicSiteRecipeMock.mockResolvedValueOnce({ recipeId: 'recipe-old' })
    reorderPublicSiteRecipesMock.mockResolvedValueOnce({ updatedCount: 2 })

    const removeResponse = await POST(
      new Request('http://localhost/api/nic-nac/site-recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'remove', recipeId: 'recipe-old' }),
      }),
    )
    const reorderResponse = await POST(
      new Request('http://localhost/api/nic-nac/site-recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          recipeIds: ['recipe-a', 'recipe-b'],
        }),
      }),
    )

    expect(removePublicSiteRecipeMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      'recipe-old',
    )
    expect(reorderPublicSiteRecipesMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      { recipeIds: ['recipe-a', 'recipe-b'] },
    )
    await expect(removeResponse.json()).resolves.toEqual({
      ok: true,
      recipeId: 'recipe-old',
    })
    await expect(reorderResponse.json()).resolves.toEqual({
      ok: true,
      updatedCount: 2,
    })
  })

  it('uploads recipe images through paid context', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    uploadPublicSiteMediaMock.mockResolvedValueOnce(
      'https://cdn.example.com/recipe.jpg',
    )

    const response = await POST_IMAGE(
      new Request('http://localhost/api/nic-nac/site-recipes/image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          base64Data: 'data:image/jpeg;base64,Zm9v',
          filename: 'recipe.jpg',
        }),
      }),
    )

    expect(uploadPublicSiteMediaMock).toHaveBeenCalledWith(
      'rep-bling',
      'data:image/jpeg;base64,Zm9v',
      {
        filename: 'recipe.jpg',
        folder: 'recipes',
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      imageUrl: 'https://cdn.example.com/recipe.jpg',
    })
  })

  it('uploads homepage media through paid context', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    uploadPublicSiteMediaMock.mockResolvedValueOnce(
      'https://cdn.example.com/homepage.jpg',
    )

    const response = await POST_SITE_MEDIA(
      new Request('http://localhost/api/nic-nac/site-settings/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          base64Data: 'data:image/jpeg;base64,Zm9v',
          filename: 'homepage.jpg',
        }),
      }),
    )

    expect(uploadPublicSiteMediaMock).toHaveBeenCalledWith(
      'rep-bling',
      'data:image/jpeg;base64,Zm9v',
      {
        filename: 'homepage.jpg',
        folder: 'profile',
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      imageUrl: 'https://cdn.example.com/homepage.jpg',
    })
  })

  it('builds a draft from display and recipe-card images without saving it', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    buildSiteRecipeDraftFromImagesMock.mockResolvedValueOnce({
      title: 'Chocolate-Dipped Strawberries',
      description: 'A polished Heather-style recipe.',
      category: 'Dessert',
      prepTime: '20 minutes',
      servings: 12,
      ingredients: ['Strawberries', 'Chocolate'],
      steps: ['Melt chocolate', 'Dip strawberries'],
      note: 'Dry the berries well first.',
      imageAlt: 'Chocolate dipped strawberries with white drizzle',
      warnings: [],
    })

    const response = await POST_DRAFT(
      new Request('http://localhost/api/nic-nac/site-recipes/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Chocolate-Dipped Strawberries',
          images: [
            {
              role: 'display_photo',
              url: 'https://cdn.example.com/strawberries.jpg',
            },
            {
              role: 'recipe_card',
              url: 'https://cdn.example.com/strawberry-card.jpg',
            },
          ],
        }),
      }),
    )

    expect(buildSiteRecipeDraftFromImagesMock).toHaveBeenCalledWith({
      title: 'Chocolate-Dipped Strawberries',
      images: [
        {
          role: 'display_photo',
          url: 'https://cdn.example.com/strawberries.jpg',
        },
        {
          role: 'recipe_card',
          url: 'https://cdn.example.com/strawberry-card.jpg',
        },
      ],
    })
    expect(upsertPublicSiteRecipeMock).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      draft: {
        title: 'Chocolate-Dipped Strawberries',
        ingredients: ['Strawberries', 'Chocolate'],
      },
    })
  })

  it('requires a title and at least one recipe-card image for draft building', async () => {
    getPaidNicNacContextMock
      .mockResolvedValueOnce({
        repId: 'rep-bling',
        supabase: { marker: 'supabase' },
      })
      .mockResolvedValueOnce({
        repId: 'rep-bling',
        supabase: { marker: 'supabase' },
      })

    const missingTitle = await POST_DRAFT(
      new Request('http://localhost/api/nic-nac/site-recipes/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: '',
          images: [{ role: 'recipe_card', url: 'https://cdn.example.com/card.jpg' }],
        }),
      }),
    )
    const missingCard = await POST_DRAFT(
      new Request('http://localhost/api/nic-nac/site-recipes/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Brownies',
          images: [
            { role: 'display_photo', url: 'https://cdn.example.com/brownies.jpg' },
          ],
        }),
      }),
    )

    expect(missingTitle.status).toBe(400)
    expect(missingCard.status).toBe(400)
    expect(buildSiteRecipeDraftFromImagesMock).not.toHaveBeenCalled()
  })

  it('returns a friendly model-unavailable response when draft building fails', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    buildSiteRecipeDraftFromImagesMock.mockRejectedValueOnce(
      new Error('provider returned an unexpected OpenAI quota shape'),
    )

    const response = await POST_DRAFT(
      new Request('http://localhost/api/nic-nac/site-recipes/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Chocolate-Dipped Strawberries',
          images: [
            {
              role: 'recipe_card',
              url: 'https://cdn.example.com/strawberry-card.jpg',
            },
          ],
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'MODEL_UNAVAILABLE',
      error:
        'The uploaded photos are saved, but recipe photo reading is temporarily unavailable. Please try again later.',
    })
    expect(upsertPublicSiteRecipeMock).not.toHaveBeenCalled()
  })

  it('returns auth, syntax, validation, and service errors safely', async () => {
    getPaidNicNacContextMock.mockRejectedValueOnce(new AuthError('nope'))

    const authResponse = await GET()

    expect(authResponse.status).toBe(401)
    await expect(authResponse.json()).resolves.toEqual({
      error: 'unauthenticated',
    })

    const syntaxResponse = await POST(
      new Request('http://localhost/api/nic-nac/site-recipes', {
        method: 'POST',
        body: '{bad json',
      }),
    )
    expect(syntaxResponse.status).toBe(400)

    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    upsertPublicSiteRecipeMock.mockRejectedValueOnce(
      errors.INVALID_INPUT('title required', 'I need the recipe title.'),
    )

    const serviceResponse = await POST(
      new Request('http://localhost/api/nic-nac/site-recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', recipe: { title: '' } }),
      }),
    )

    expect(serviceResponse.status).toBe(400)
    await expect(serviceResponse.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'I need the recipe title.',
    })

    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-bling',
      supabase: { marker: 'supabase' },
    })
    getPublicSiteRecipesMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'PUBLIC_SITE_RECIPES_LOOKUP_FAILED',
        message: 'database exploded',
        userMessage: "I couldn't load the Pantry recipes right now.",
        statusCode: 503,
      }),
    )

    const lookupResponse = await GET()
    expect(lookupResponse.status).toBe(503)
    await expect(lookupResponse.json()).resolves.toEqual({
      code: 'PUBLIC_SITE_RECIPES_LOOKUP_FAILED',
      error: "I couldn't load the Pantry recipes right now.",
    })
  })
})
