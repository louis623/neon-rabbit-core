import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import {
  getConversationOwner,
  insertConversationMessages,
  loadConversationForClient,
} from '@/lib/nic-nac/persistence'
import { findActionableApproval } from '@/lib/nic-nac/hitl-state'
import { buildNicNacRolloverMessages } from '@/lib/nic-nac/rollover'
import { logNicNacRollover } from '@/lib/nic-nac/rollover-telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let ctx
  try {
    ctx = await getAuthenticatedNicNacContext()
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw err
  }

  const body = (await request.json().catch(() => null)) as {
    conversationId?: string
  } | null
  const sourceConversationId = body?.conversationId
  if (!sourceConversationId) {
    return NextResponse.json({ error: 'missing_conversation_id' }, { status: 400 })
  }

  const { repId, supabase } = ctx
  const owner = await getConversationOwner(supabase, sourceConversationId)
  if (!owner) {
    return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 })
  }
  if (owner !== repId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const sourceMessages = await loadConversationForClient(supabase, sourceConversationId)
  if (findActionableApproval(sourceMessages)) {
    return NextResponse.json({ error: 'pending_approval' }, { status: 409 })
  }

  const conversationId = randomUUID()
  const messages = buildNicNacRolloverMessages(sourceMessages)
  await insertConversationMessages(supabase, {
    conversationId,
    repId,
    messages,
  })
  await logNicNacRollover({
    repId,
    sourceConversationId,
    destinationConversationId: conversationId,
    carriedMessageCount: messages.length,
  })

  return NextResponse.json({
    conversationId,
    messages,
    carriedMessageCount: messages.length,
  })
}
