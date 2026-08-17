import { describe, expect, it, vi } from 'vitest'
import {
  buildSiteRecipeDraftFromImages,
  parseSiteRecipeDraftModelText,
} from '@/lib/nic-nac/site-recipe-draft-builder'

vi.mock('@/lib/nic-nac/core/model-provider', () => ({
  getNicNacLanguageModel: () => 'mock-model',
}))

vi.mock('@/lib/nic-nac/core/model-policy', () => ({
  getNicNacModelPolicy: () => ({
    key: 'human_default',
    provider: 'openai',
    modelId: 'gpt-5.4',
    reasoning: 'medium',
    purpose: 'test',
  }),
}))

describe('site recipe draft builder', () => {
  it('parses and normalizes model JSON into a Pantry recipe draft', () => {
    expect(
      parseSiteRecipeDraftModelText(`
        {
          "title": " Chocolate-Dipped Strawberries ",
          "description": " Sweet and simple. ",
          "category": "Dessert",
          "prepTime": "20 minutes",
          "servings": 12,
          "ingredients": [" Strawberries ", "", "Chocolate"],
          "steps": [" Melt ", " Dip "],
          "note": "Dry berries first.",
          "imageAlt": "Strawberries with chocolate",
          "warnings": ["Prep time inferred."]
        }
      `),
    ).toEqual({
      title: 'Chocolate-Dipped Strawberries',
      description: 'Sweet and simple.',
      category: 'Baking & Sweets',
      prepTime: '20 minutes',
      servings: 12,
      ingredients: ['Strawberries', 'Chocolate'],
      steps: ['Melt', 'Dip'],
      note: 'Dry berries first.',
      imageAlt: 'Strawberries with chocolate',
      warnings: ['Prep time inferred.'],
    })
  })

  it('sends recipe-card and display images to the model without saving', async () => {
    const generateTextImpl = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        title: 'Family Pasta Sauce',
        description: 'Sunday sauce.',
        category: 'Dinner',
        prepTime: '1 hour',
        servings: 8,
        ingredients: ['Tomatoes'],
        steps: ['Simmer'],
        note: 'Low and slow.',
        imageAlt: 'A pot of pasta sauce',
        warnings: [],
      }),
    })

    const draft = await buildSiteRecipeDraftFromImages(
      {
        title: 'Family Pasta Sauce',
        images: [
          {
            role: 'display_photo',
            url: 'https://cdn.example.com/pasta.jpg',
          },
          {
            role: 'recipe_card',
            url: 'https://cdn.example.com/pasta-card.jpg',
          },
        ],
      },
      { generateTextImpl: generateTextImpl as never },
    )

    expect(draft.title).toBe('Family Pasta Sauce')
    expect(generateTextImpl).toHaveBeenCalledTimes(1)
    const payload = JSON.stringify(generateTextImpl.mock.calls[0]?.[0])
    expect(payload).toContain('display_photo')
    expect(payload).toContain('recipe_card')
    expect(payload).toContain('https://cdn.example.com/pasta-card.jpg')
  })

  it('requires a title and at least one recipe-card source image', async () => {
    await expect(
      buildSiteRecipeDraftFromImages({
        title: '',
        images: [{ role: 'recipe_card', url: 'https://cdn.example.com/card.jpg' }],
      }),
    ).rejects.toThrow('Recipe title is required.')

    await expect(
      buildSiteRecipeDraftFromImages({
        title: 'Brownies',
        images: [
          { role: 'display_photo', url: 'https://cdn.example.com/brownies.jpg' },
        ],
      }),
    ).rejects.toThrow('At least one recipe card image is required.')
  })
})
