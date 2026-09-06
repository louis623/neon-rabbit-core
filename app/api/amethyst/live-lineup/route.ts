import { NextResponse } from 'next/server'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { buildPublicLiveLineup } from '@/lib/amethyst/public-live-lineup'
import { getLiveQueueSnapshot, getLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  if (!target.targeted) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      repId: target.repId ?? target.customDomain,
      publicSiteSlug: target.publicSiteSlug,
      select: 'id, email, public_site_slug', strict: true,
    })
    // Tonight's behavior change is confined to Brittany; shared terminology is separate.
    if (!rep || rep.public_site_slug !== 'brittwithbling') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const syncCode = await getLiveQueueSyncCodeForRep(admin, rep.id)
    const snapshot = await getLiveQueueSnapshot(admin, { repId: rep.id, syncCode })
    if (!snapshot) return NextResponse.json({ error: 'temporarily_unavailable' }, { status: 503 })
    return NextResponse.json(buildPublicLiveLineup(snapshot), {
      headers: { 'cache-control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'temporarily_unavailable' }, { status: 503 })
  }
}
