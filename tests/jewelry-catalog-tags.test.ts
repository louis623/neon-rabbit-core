import { describe, expect, it } from 'vitest'
import {
  deriveJewelryCatalogTags,
  normalizeJewelryCatalogTags,
} from '@/lib/services/jewelry-catalog-tags'

describe('normalizeJewelryCatalogTags', () => {
  it('lowercases, trims, dedupes, and caps useful tags', () => {
    expect(
      normalizeJewelryCatalogTags([
        ' Rose Gold ',
        'rose gold',
        'Heart',
        'Pink',
        'Stackable',
        'Rhodium',
        'Opal',
        'Floral',
        'Vintage',
        'Extra',
      ]),
    ).toEqual([
      'rose gold',
      'heart',
      'pink',
      'stackable',
      'rhodium',
      'opal',
      'floral',
      'vintage',
    ])
  })

  it('blocks rarity, hype, and value judgment tags by default', () => {
    expect(
      normalizeJewelryCatalogTags([
        'rare',
        'unicorn',
        'diamond',
        'valuable',
        'high demand',
        'heart',
      ]),
    ).toEqual(['heart'])
  })

  it('keeps exact rarity tags only when they were explicitly supplied', () => {
    expect(
      normalizeJewelryCatalogTags(['diamond', 'unicorn', 'diamonds', 'heart'], {
        allowExplicitRarity: true,
      }),
    ).toEqual(['diamond', 'unicorn', 'heart'])
  })

  it('derives practical tags from item context without rarity guesses', () => {
    expect(
      deriveJewelryCatalogTags({
        typePrefix: 'RG',
        designName: 'Rose Heart Ring',
        material: 'Rose gold',
        mainStone: 'Pink opal',
        collectionName: 'April Birthday',
        explicitTags: ['Unicorn', 'statement'],
      }),
    ).toEqual([
      'ring',
      'rose gold',
      'pink',
      'opal',
      'heart',
      'unicorn',
      'statement',
    ])
  })
})
