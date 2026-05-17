import { NextResponse } from 'next/server'
import { getAuthenticatedNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { loadConversationForClient, getConversationOwner } from '@/lib/nic-nac/persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
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
  const { conversationId } = await params

  if (!conversationId) {
    return NextResponse.json({ error: 'missing_conversation_id' }, { status: 400 })
  }

  const owner = await getConversationOwner(supabase, conversationId)
  if (owner && owner !== repId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const messages = await loadConversationForClient(supabase, conversationId)
  return NextResponse.json({ conversationId, messages })
}
