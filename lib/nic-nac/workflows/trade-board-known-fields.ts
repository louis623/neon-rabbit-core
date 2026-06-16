import type { UIMessage } from 'ai'
import type { TradeBoardIntakeKnownFields } from './trade-board-intake-types'

type CatalogToolPart = {
  type?: string
  state?: string
  output?: {
    results?: Array<Record<string, unknown>>
  }
}

export function mergeTradeBoardKnownFields(
  current: TradeBoardIntakeKnownFields,
  next: TradeBoardIntakeKnownFields,
): TradeBoardIntakeKnownFields {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).filter(([, value]) => value !== undefined),
    ),
  }
}

export function extractKnownFieldsFromText(
  text: string,
): TradeBoardIntakeKnownFields {
  const known: TradeBoardIntakeKnownFields = {}
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  const itemNumber = normalizedText.match(/\b[A-Z]{1,4}\d{3,}\b/i)?.[0]
  if (itemNumber) known.itemNumber = itemNumber.toUpperCase()

  const designName = itemNumber
    ? extractDesignNameNearItemNumber(normalizedText, itemNumber)
    : null
  if (designName) known.designName = designName

  const collection = extractCollectionFields(normalizedText)
  if (collection.collectionName) known.collectionName = collection.collectionName
  if (collection.collectionYear) known.collectionYear = collection.collectionYear

  const mainStone = normalizedText.match(
    /\b(Lab[-\s]?Created\s+[A-Z][A-Za-z]+)\b/i,
  )?.[1]
  if (mainStone) known.mainStone = normalizeCapitalizedPhrase(mainStone)

  const material = normalizedText.match(
    /\b((?:Rhodium|Rose Gold|Gold|Silver|Sterling Silver)\s+Plating)\b/i,
  )?.[1]
  if (material) known.material = normalizeCapitalizedPhrase(material)

  const msrp = normalizedText.match(/\$\s*(\d+(?:\.\d{1,2})?)\s*(?:MSRP)?\b/i)
  if (msrp?.[1]) known.bpMsrp = Number(msrp[1])

  const quantity = normalizedText.match(
    /\b(?:qty|quantity|count)\s*(?:is|:|-)?\s*(\d+)\b/i,
  )
  if (quantity?.[1]) known.quantity = Number(quantity[1])

  return known
}

export function extractKnownFieldsFromCatalogToolOutputs(
  messages: UIMessage[],
): TradeBoardIntakeKnownFields {
  const parts = messages.flatMap(
    (message) => (message.parts ?? []) as CatalogToolPart[],
  )
  const toolParts = parts
    .filter((part) => part.type === 'tool-search_jewelry_database')
    .filter((part) => part.state === 'output-available')
    .reverse()

  for (const part of toolParts) {
    const result = part.output?.results?.[0]
    if (!result) continue
    const known = knownFieldsFromCatalogResult(result)
    if (known.itemNumber && known.designName) return known
  }

  return {}
}

export function knownFieldsFromCatalogResult(
  result: Record<string, unknown>,
): TradeBoardIntakeKnownFields {
  const known: TradeBoardIntakeKnownFields = {}
  if (typeof result.itemNumber === 'string' && result.itemNumber.trim()) {
    known.itemNumber = result.itemNumber.trim().toUpperCase()
  }
  if (typeof result.designName === 'string' && result.designName.trim()) {
    known.designName = result.designName.trim()
  }
  if (typeof result.collectionName === 'string' && result.collectionName.trim()) {
    known.collectionName = normalizeCollectionName(result.collectionName)
  }
  if (typeof result.collectionYear === 'number') {
    known.collectionYear = result.collectionYear
  }
  if (typeof result.material === 'string' && result.material.trim()) {
    known.material = normalizeCapitalizedPhrase(result.material)
  }
  if (typeof result.mainStone === 'string' && result.mainStone.trim()) {
    known.mainStone = normalizeCapitalizedPhrase(result.mainStone)
  }
  if (typeof result.bpMsrp === 'number') {
    known.bpMsrp = result.bpMsrp
  }
  return known
}

export function normalizeCollectionName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bcollection\b$/i, '')
    .trim()
}

function extractCollectionFields(text: string): {
  collectionName?: string
  collectionYear?: number
} {
  const prefix = text.match(
    /\b(?:collection|coll)\b\s*(?:is|:|-)\s*([A-Za-z][A-Za-z\s]*?)(?:\s+Collection)?(?:[,\s]+(20\d{2}))?(?=\.|,|$)/i,
  )
  if (prefix?.[1]) {
    return {
      collectionName: normalizeCollectionName(prefix[1]),
      collectionYear: prefix[2] ? Number(prefix[2]) : undefined,
    }
  }

  const suffix = text.match(
    /\b([A-Za-z]+(?:\s+(?:Birthday|Originals|Luxe|Stacks?))?)\s+collection\b(?:,?\s*(20\d{2}))?/i,
  )
  if (suffix?.[1]) {
    return {
      collectionName: normalizeCollectionName(suffix[1]),
      collectionYear: suffix[2] ? Number(suffix[2]) : undefined,
    }
  }

  return {}
}

function extractDesignNameNearItemNumber(
  text: string,
  itemNumber: string,
): string | null {
  const escapedItemNumber = escapeRegExp(itemNumber)
  const match = text.match(
    new RegExp(`\\b${escapedItemNumber}\\b\\s*(?:[,;:\\-=]|is)?\\s*([^.;\\n]+)`, 'i'),
  )
  const rawCandidate = match?.[1]?.split(/\s*,\s*/)[0]?.trim() ?? ''
  const candidate = rawCandidate.replace(/^["']|["']$/g, '').trim()
  if (!candidate) return null
  if (
    !/\b(rings?|earrings?|necklaces?|bracelets?|pendants?|stacks?|hoops?|studs?)\b/i.test(
      candidate,
    )
  ) {
    return null
  }
  return candidate
}

function normalizeCapitalizedPhrase(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) =>
          part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part,
        )
        .join('-'),
    )
    .join(' ')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
