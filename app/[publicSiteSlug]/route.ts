import { renderAmethystPublicAssetResponse } from '@/lib/amethyst/public-asset-response'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { validatePublicSiteSlug } from '@/lib/public-site/show-link'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicSiteSlug: string }> },
) {
  const { publicSiteSlug } = await params
  const slug = publicSiteSlug.trim().toLowerCase()
  if (!validatePublicSiteSlug(slug).ok) {
    return new Response('Not found', { status: 404 })
  }

  const admin = createAdminClient()
  const rep = await resolveAmethystPreviewRep(admin, {
    publicSiteSlug: slug,
    select: 'id, email',
  })
  if (!rep) return new Response('Not found', { status: 404 })

  return renderAmethystPublicAssetResponse(request, ['Homepage.html'], {
    repIdOverride: rep.id,
    canonicalPathOverride: `/${slug}`,
  })
}
