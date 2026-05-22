import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'

export async function GET(request: Request) {
  const listings = await loadAmethystTradeBoardPreviewListings({
    repId: resolveAmethystRequestRepId(request),
  })

  return Response.json(
    { listings },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
