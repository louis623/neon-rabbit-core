import {
  type FinderCatalogLabel,
  type FinderJewelryType,
  listSparkleFinderCatalogFacets,
} from '@/lib/sparkle-finder/public-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const collectionYear = parseCollectionYear(url.searchParams.get('year'))
  if (collectionYear === null) {
    return Response.json(
      { error: 'year must be a four-digit collection year.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }

  const facets = await listSparkleFinderCatalogFacets({
    query: url.searchParams.get('query') ?? undefined,
    jewelryType: parseJewelryType(url.searchParams.get('type')),
    collection: parseTextFilter(url.searchParams.get('collection')),
    material: parseTextFilter(url.searchParams.get('material')),
    mainStone: parseTextFilter(url.searchParams.get('stone')),
    label: parseCatalogLabel(url.searchParams.get('label')),
    collectionYear: collectionYear ?? undefined,
  })

  return Response.json({ facets }, { headers: noStoreHeaders() })
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
  }
}

const finderJewelryTypes = new Set<FinderJewelryType>([
  'ring',
  'necklace',
  'earrings',
  'stack',
  'bracelet',
])

const finderCatalogLabels = new Set<FinderCatalogLabel>([
  'diamond',
  'unicorn',
  'standard',
])

function parseTextFilter(value: string | null) {
  const trimmed = value?.trim()
  return trimmed && trimmed !== 'all' ? trimmed : undefined
}

function parseJewelryType(value: string | null): FinderJewelryType | undefined {
  const trimmed = parseTextFilter(value)
  return finderJewelryTypes.has(trimmed as FinderJewelryType)
    ? (trimmed as FinderJewelryType)
    : undefined
}

function parseCatalogLabel(value: string | null): FinderCatalogLabel | undefined {
  const trimmed = parseTextFilter(value)
  return finderCatalogLabels.has(trimmed as FinderCatalogLabel)
    ? (trimmed as FinderCatalogLabel)
    : undefined
}

function parseCollectionYear(value: string | null) {
  const trimmed = parseTextFilter(value)
  if (!trimmed) return undefined
  if (!/^\d{4}$/.test(trimmed)) return null
  const year = Number.parseInt(trimmed, 10)
  return year >= 2020 && year <= 2040 ? year : null
}
