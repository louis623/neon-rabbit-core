import { NextResponse } from 'next/server'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getConversationOwner,
  getLatestConversationId,
  loadConversationForClient,
} from '@/lib/nic-nac/persistence'
import { getLatestNicNacRunHealth } from '@/lib/nic-nac/run-telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  let ctx
  try {
    ctx = await getPaidNicNacContext()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.userMessage, code: err.code },
        { status: err.statusCode },
      )
    }
    throw err
  }

  const { repId, supabase } = ctx
  const url = new URL(request.url)
  const conversationId = url.searchParams.get('conversationId')?.trim() ?? ''

  if (!conversationId) {
    const latestConversationId = await getLatestConversationId(supabase, repId)
    return NextResponse.json({ conversationId: latestConversationId })
  }

  const owner = await getConversationOwner(supabase, conversationId)
  if (owner && owner !== repId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const [messages, runHealth] = await Promise.all([
    loadConversationForClient(supabase, conversationId),
    getLatestNicNacRunHealth(repId, conversationId),
  ])
  return NextResponse.json({ conversationId, messages, runHealth })
}
