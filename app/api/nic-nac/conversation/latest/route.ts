import { NextResponse } from 'next/server'
import { getAuthenticatedNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { getLatestConversationId } from '@/lib/nic-nac/persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  let ctx
  try {
    ctx = await getAuthenticatedNicNacContext()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw err
  }
  const { repId, supabase } = ctx
  const conversationId = await getLatestConversationId(supabase, repId)
  return NextResponse.json({ conversationId })
}
