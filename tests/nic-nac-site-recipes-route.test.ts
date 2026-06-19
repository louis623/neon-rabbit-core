import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError, errors } from '@/lib/services/errors'

const getPaidNicNacContextMock = vi.fn()
const getPublicSiteRecipesMock = vi.fn()
const upsertPublicSiteRecipeMock = vi.fn()
const removePublicSiteRecipeMock = vi.fn()
const reorderPublicSiteRecipesMock = vi.fn()
const uploadPublicSiteMediaMock = vi.fn()

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

import { GET, POST } from '@/app/api/nic-nac/site-recipes/route'
import { POST as POST_IMAGE } from '@/app/api/nic-nac/site-recipes/image/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('/api/nic-nac/site-recipes', () => {
  beforeEach(() => {
    getPaidNicNacContextMock.mockReset()
    getPublicSiteRecipesMock.mockReset()
    upsertPublicSiteRecipeMock.mockReset()
    removePublicSiteRecipeMock.mockReset()
    reorderPublicSiteRecipesMock.mockReset()
    uploadPublicSiteMediaMock.mockReset()
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
