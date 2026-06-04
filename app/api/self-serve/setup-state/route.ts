import { NextResponse } from 'next/server'
import {
  ensureLiveQueueSyncCodeForRep,
  getLiveQueueSyncCodeForRep,
} from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const admin = createAdminClient()
    const state = await getRequiredSetupState(repId)
    const existingLiveQueueSyncCode = await getLiveQueueSyncCodeForRep(admin, repId)
    const liveQueueSyncCode =
      existingLiveQueueSyncCode ??
      (state.status === 'required_setup' || state.status === 'setup_blocked'
        ? (await ensureLiveQueueSyncCodeForRep(admin, { repId })).syncCode
        : null)
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
