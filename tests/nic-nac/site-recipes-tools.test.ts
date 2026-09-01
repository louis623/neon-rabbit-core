import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

const getPublicSiteRecipesMock = vi.fn()
const upsertPublicSiteRecipeMock = vi.fn()
const removePublicSiteRecipeMock = vi.fn()
const reorderPublicSiteRecipesMock = vi.fn()

vi.mock('@/lib/services/site-recipes', () => ({
  getPublicSiteRecipes: (...args: unknown[]) => getPublicSiteRecipesMock(...args),
  upsertPublicSiteRecipe: (...args: unknown[]) =>
    upsertPublicSiteRecipeMock(...args),
  removePublicSiteRecipe: (...args: unknown[]) =>
    removePublicSiteRecipeMock(...args),
  reorderPublicSiteRecipes: (...args: unknown[]) =>
    reorderPublicSiteRecipesMock(...args),
}))

import {
  makeListSiteRecipesTool,
  makeManageSiteRecipesTool,
} from '@/lib/nic-nac/tools/site-recipes'
import { buildAllTools, listToolNamesForIntents } from '@/lib/nic-nac/tools'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

interface ToolDef {
  description?: string
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeCtx() {
  return {
    repId: 'rep-bling',
    supabase: { marker: 'supabase' } as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

describe('site recipes Nic-Nac tools', () => {
  beforeEach(() => {
    getPublicSiteRecipesMock.mockReset()
    upsertPublicSiteRecipeMock.mockReset()
    removePublicSiteRecipeMock.mockReset()
    reorderPublicSiteRecipesMock.mockReset()
  })

  it('lists editable Pantry recipes including hidden cards and full copy', async () => {
    getPublicSiteRecipesMock.mockResolvedValueOnce([
      {
        id: 'recipe-1',
        title: 'Family Pasta Sauce',
        ingredients: ['Tomatoes'],
        steps: ['Simmer'],
        isVisible: true,
      },
    ])
    const tool = makeListSiteRecipesTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({})

    expect(getPublicSiteRecipesMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      { visibleOnly: false },
    )
    expect(result).toMatchObject({
      count: 1,
      recipes: [
        {
          id: 'recipe-1',
          title: 'Family Pasta Sauce',
          ingredients: ['Tomatoes'],
        },
      ],
    })
  })

  it('manages upsert, remove, and reorder actions for Pantry recipes', async () => {
    upsertPublicSiteRecipeMock.mockResolvedValueOnce({
      id: 'recipe-2',
      title: 'Homemade Coffee Creamer',
    })
    removePublicSiteRecipeMock.mockResolvedValueOnce({ recipeId: 'recipe-old' })
    reorderPublicSiteRecipesMock.mockResolvedValueOnce({ updatedCount: 2 })
    const tool = makeManageSiteRecipesTool(makeCtx()) as unknown as ToolDef

    const upsert = await tool.execute({
      action: 'upsert',
      recipe: {
        title: 'Homemade Coffee Creamer',
        imageUrl: 'https://cdn.example.com/creamer.jpg',
        tiktokUrl: 'https://www.tiktok.com/@blingkitchen/video/1',
        ingredients: ['Half & Half', 'Vanilla'],
        steps: ['Whisk'],
      },
    })
    const remove = await tool.execute({
      action: 'remove',
      recipeId: 'recipe-old',
    })
    const reorder = await tool.execute({
      action: 'reorder',
      recipeIds: ['recipe-a', 'recipe-b'],
    })

    expect(upsertPublicSiteRecipeMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-bling',
      expect.objectContaining({
        title: 'Homemade Coffee Creamer',
        ingredients: ['Half & Half', 'Vanilla'],
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
    expect(upsert).toMatchObject({
      action: 'upsert',
      recipe: { id: 'recipe-2' },
    })
    expect(remove).toEqual({ action: 'remove', recipeId: 'recipe-old' })
    expect(reorder).toEqual({ action: 'reorder', updatedCount: 2 })
  })

  it('translates service errors into Nic-Nac tool errors', async () => {
    upsertPublicSiteRecipeMock.mockRejectedValueOnce(
      errors.INVALID_INPUT('title required', 'I need the recipe title.'),
    )
    const tool = makeManageSiteRecipesTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({ action: 'upsert', recipe: { title: '' } }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'INVALID_INPUT',
      userMessage: 'I need the recipe title.',
    })
  })

  it('requires approval for removal but not ordinary recipe edits', () => {
    const tool = makeManageSiteRecipesTool(makeCtx()) as unknown as ToolDef & {
      needsApproval: (input: { action: string }) => boolean
    }

    expect(tool.needsApproval({ action: 'remove' })).toBe(true)
    expect(tool.needsApproval({ action: 'upsert' })).toBe(false)
    expect(tool.needsApproval({ action: 'reorder' })).toBe(false)
  })

  it('exposes recipe tools through the site tool pack and system prompt', () => {
    const tools = buildAllTools(makeCtx())
    const siteDefinitions = listToolNamesForIntents(['site'])

    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining(['list_site_recipes', 'manage_site_recipes']),
    )
    expect(siteDefinitions).toEqual(
      expect.arrayContaining(['list_site_recipes', 'manage_site_recipes']),
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('list_site_recipes')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('manage_site_recipes')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Heather')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('ingredients')
  })
})
