import { NextResponse } from 'next/server'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { getLatestConversationId } from '@/lib/nic-nac/persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
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
  const conversationId = await getLatestConversationId(supabase, repId)
  return NextResponse.json({ conversationId })
}
