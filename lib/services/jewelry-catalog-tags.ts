import type { JewelryType } from './types'

const MAX_TAGS = 8

const TYPE_TAGS: Record<JewelryType, string> = {
  RG: 'ring',
  NK: 'necklace',
  ER: 'earrings',
  ST: 'stack',
  BR: 'bracelet',
}

const BLOCKED_TAGS = new Set([
  'rare',
  'rarity',
  'unicorn',
  'diamond',
  'diamonds',
  'valuable',
  'value',
  'high demand',
  'hard to find',
  'grail',
  'limited',
  'scarce',
])

const PHRASE_TAGS = [
  'rose gold',
  'yellow gold',
  'gold tone',
  'silver tone',
  'white stone',
  'pink stone',
  'blue stone',
  'green stone',
  'purple stone',
]

const TOKEN_TAGS = [
  'pink',
  'blue',
  'purple',
  'green',
  'red',
  'black',
  'white',
  'clear',
  'rhodium',
  'sterling',
  'opal',
  'amethyst',
  'sapphire',
  'ruby',
  'pearl',
  'quartz',
  'crystal',
  'heart',
  'butterfly',
  'floral',
  'flower',
  'moon',
  'star',
  'simple',
  'statement',
  'stackable',
  'vintage',
  'glam',
]

function normalizeOneTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
}

function hasWord(source: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`).test(source)
}

export function normalizeJewelryCatalogTags(tags: readonly string[] = []): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const raw of tags) {
    const tag = normalizeOneTag(raw)
    if (!tag) continue
    if (tag.length < 2 || tag.length > 32) continue
    if (BLOCKED_TAGS.has(tag)) continue
    if (seen.has(tag)) continue

    seen.add(tag)
    normalized.push(tag)
    if (normalized.length >= MAX_TAGS) break
  }

  return normalized
}

export function deriveJewelryCatalogTags(input: {
  typePrefix: JewelryType
  designName?: string | null
  material?: string | null
  mainStone?: string | null
  collectionName?: string | null
  explicitTags?: readonly string[] | null
}): string[] {
  const sourceText = [
    input.designName,
    input.material,
    input.mainStone,
    input.collectionName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const candidates = [TYPE_TAGS[input.typePrefix]]

  for (const phrase of PHRASE_TAGS) {
    if (sourceText.includes(phrase)) candidates.push(phrase)
  }

  for (const token of TOKEN_TAGS) {
    if (hasWord(sourceText, token)) candidates.push(token)
  }

  candidates.push(...(input.explicitTags ?? []))

  return normalizeJewelryCatalogTags(candidates)
}
