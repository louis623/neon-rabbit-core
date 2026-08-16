import { NextResponse } from 'next/server'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { clearConversation } from '@/lib/nic-nac/persistence'
import { ServiceError } from '@/lib/services/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown
  } | null
  const conversationId =
    typeof body?.conversationId === 'string' ? body.conversationId.trim() : ''
  if (!conversationId) {
    return NextResponse.json({ error: 'missing_conversation_id' }, { status: 400 })
  }

  await clearConversation(ctx.supabase, { conversationId, repId: ctx.repId })
  return NextResponse.json({ cleared: true })
}
