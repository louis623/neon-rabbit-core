import { NextResponse } from 'next/server'
import { getLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const admin = createAdminClient()
    const state = await getRequiredSetupState(repId)
    const liveQueueSyncCode = await getLiveQueueSyncCodeForRep(admin, repId)
    return NextResponse.json({
      state: {
        ...state,
        liveQueueSyncCode,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[self-serve/setup-state] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load setup state' },
      { status: 500 },
    )
  }
}
