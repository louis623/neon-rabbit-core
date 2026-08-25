import { getSparkleFinderCatalogItem } from '@/lib/sparkle-finder/public-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{
    designId: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { designId } = await context.params
  const item = await getSparkleFinderCatalogItem({ designId })

  if (!item) {
    return Response.json(
      { error: 'catalog item not found' },
      { status: 404, headers: noStoreHeaders() },
    )
  }

  return Response.json(
    { item: { ...item, description: null } },
    {
      headers: noStoreHeaders(),
    },
  )
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
  }
}
