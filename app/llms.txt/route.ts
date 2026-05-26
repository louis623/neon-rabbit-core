import { buildDefaultSparkleLlmsText } from '@/lib/seo/llms'
import { resolveSparkleRequestOrigin } from '@/lib/seo/sparkle-crawl'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return new Response(
    buildDefaultSparkleLlmsText(resolveSparkleRequestOrigin(request)),
    {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  )
}
