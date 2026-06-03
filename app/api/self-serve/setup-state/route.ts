import { NextResponse } from 'next/server'
import { getRequiredSetupState } from '@/lib/self-serve/required-setup'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const state = await getRequiredSetupState(repId)
    return NextResponse.json({ state })
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
