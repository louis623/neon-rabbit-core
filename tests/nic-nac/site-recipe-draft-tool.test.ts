import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NicNacToolError } from '@/lib/nic-nac/errors'

const buildSiteRecipeDraftFromImagesMock = vi.fn()
const uploadPublicSiteMediaMock = vi.fn()
const uploadStagedOriginalPhotoMock = vi.fn()

vi.mock('@/lib/nic-nac/site-recipe-draft-builder', () => ({
  buildSiteRecipeDraftFromImages: (...args: unknown[]) =>
    buildSiteRecipeDraftFromImagesMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadPublicSiteMedia: (...args: unknown[]) => uploadPublicSiteMediaMock(...args),
  uploadStagedOriginalPhoto: (...args: unknown[]) =>
    uploadStagedOriginalPhotoMock(...args),
}))

import { makeBuildSiteRecipeDraftTool } from '@/lib/nic-nac/tools/build-site-recipe-draft'

type DraftTool = {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeConversationImageLookupMock(rows: Array<{ parts: unknown }>) {
  const result = { data: rows, error: null as unknown }
  const chain: Record<string, unknown> = { ...result }
  const passthrough = () => chain
  chain.select = passthrough
  chain.eq = passthrough
  chain.order = passthrough
  return {
    from: (table: string) => {
      if (table !== 'nic_nac_conversations') {
        throw new Error(`unexpected table ${table}`)
      }
      return chain
    },
  }
}

function makeTool(rows: Array<{ parts: unknown }> = []): DraftTool {
  return makeBuildSiteRecipeDraftTool({
    repId: 'rep-bling',
    conversationId: 'conv-1',
    supabase: makeConversationImageLookupMock(rows) as never,
  }) as unknown as DraftTool
}

beforeEach(() => {
  buildSiteRecipeDraftFromImagesMock.mockReset()
  uploadPublicSiteMediaMock.mockReset()
  uploadStagedOriginalPhotoMock.mockReset()
})

describe('build_site_recipe_draft tool', () => {
  it('builds a draft from recent chat photos without saving the recipe', async () => {
    uploadPublicSiteMediaMock.mockResolvedValueOnce(
      'https://cdn.example.com/public/strawberries.jpg',
    )
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-bling/recipe-card.jpg',
      signedUrl: 'https://signed.example.com/recipe-card',
    })
    buildSiteRecipeDraftFromImagesMock.mockResolvedValueOnce({
      title: 'Chocolate-Dipped Strawberries',
      description: 'Heather-style party strawberries.',
      category: 'Dessert',
      prepTime: '20 minutes',
      servings: 24,
      ingredients: ['Strawberries', 'Chocolate chips'],
      steps: ['Dry berries', 'Melt chocolate', 'Dip and chill'],
      note: 'Dry berries well so the chocolate sticks.',
      imageAlt: 'Chocolate dipped strawberries with white drizzle',
      warnings: [],
    })

    const tool = makeTool([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,RElTUExBWQ==',
          },
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,Q0FSRA==',
          },
        ],
      },
    ])

    const result = await tool.execute({
      title: 'Chocolate-Dipped Strawberries',
      displayPhotoIndexes: [1],
      recipeCardImageIndexes: [2],
    })

    expect(uploadPublicSiteMediaMock).toHaveBeenCalledWith(
      'rep-bling',
      'data:image/jpeg;base64,RElTUExBWQ==',
      {
        folder: 'recipes',
        filename: 'chocolate-dipped-strawberries-display-1',
      },
    )
    expect(uploadStagedOriginalPhotoMock).toHaveBeenCalledWith(
      'rep-bling',
      'data:image/jpeg;base64,Q0FSRA==',
      'chocolate-dipped-strawberries-recipe-card-2',
    )
    expect(buildSiteRecipeDraftFromImagesMock).toHaveBeenCalledWith({
      title: 'Chocolate-Dipped Strawberries',
      images: [
        {
          role: 'display_photo',
          url: 'https://cdn.example.com/public/strawberries.jpg',
        },
        {
          role: 'recipe_card',
          url: 'https://signed.example.com/recipe-card',
        },
      ],
    })
    expect(result).toMatchObject({
      ok: true,
      action: 'draft',
      draft: {
        title: 'Chocolate-Dipped Strawberries',
        imageUrl: 'https://cdn.example.com/public/strawberries.jpg',
        modalImageUrl: 'https://cdn.example.com/public/strawberries.jpg',
      },
      source: {
        displayPhotoIndexes: [1],
        recipeCardImageIndexes: [2],
        recipeCardImageCount: 1,
      },
    })
  })

  it('returns a model-unavailable result without saving when OpenAI is blocked', async () => {
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-bling/card.jpg',
      signedUrl: 'https://signed.example.com/card',
    })
    buildSiteRecipeDraftFromImagesMock.mockRejectedValueOnce(
      new Error('quota exceeded'),
    )

    const tool = makeTool([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,Q0FSRA==',
          },
        ],
      },
    ])

    await expect(
      tool.execute({
        title: 'Brownies',
        recipeCardImageIndexes: [1],
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: 'MODEL_UNAVAILABLE',
      source: {
        recipeCardImageIndexes: [1],
        recipeCardImageCount: 1,
      },
    })
  })

  it('asks for a clear photo choice when the requested index does not exist', async () => {
    const tool = makeTool([
      {
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,Q0FSRA==',
          },
        ],
      },
    ])

    await expect(
      tool.execute({
        title: 'Brownies',
        recipeCardImageIndexes: [2],
      }),
    ).rejects.toMatchObject({
      code: 'RECIPE_PHOTO_CHOICE_REQUIRED',
    } satisfies Partial<NicNacToolError>)
  })
})
