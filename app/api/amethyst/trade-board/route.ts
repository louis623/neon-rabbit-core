import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'

export async function GET() {
  const listings = await loadAmethystTradeBoardPreviewListings()

  return Response.json(
    { listings },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
