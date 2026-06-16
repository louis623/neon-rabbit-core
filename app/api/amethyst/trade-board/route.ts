import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const listings = await loadAmethystTradeBoardPreviewListings({
    ...(target.publicSiteSlug ? { publicSiteSlug: target.publicSiteSlug } : {}),
    repId: target.repId ?? target.customDomain,
    targeted: target.targeted,
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
