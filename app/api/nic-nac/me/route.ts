import { NextResponse } from 'next/server'
import { getAuthenticatedNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { getLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId, rep, supabase } = await getAuthenticatedNicNacContext()
    const liveQueueSyncCode = await getLiveQueueSyncCodeForRep(supabase, repId)
    return NextResponse.json({
      rep: {
        id: rep.id,
        email: rep.email,
        display_name: rep.display_name,
        public_site_slug: rep.public_site_slug,
        time_zone: rep.time_zone,
        live_queue_sync_code: liveQueueSyncCode,
      },
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw err
  }
}
