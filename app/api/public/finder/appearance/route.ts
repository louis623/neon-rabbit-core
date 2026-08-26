import { loadSparkleFinderAppearanceSetting } from '@/lib/sparkle-finder/appearance'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return Response.json(await loadSparkleFinderAppearanceSetting(), {
      headers: {
        'cache-control': 'public, s-maxage=30, stale-while-revalidate=300',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[sparkle-finder/appearance] Public appearance failed:', error)
    return Response.json(
      { error: 'Sparkle Finder appearance is temporarily unavailable.' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}
