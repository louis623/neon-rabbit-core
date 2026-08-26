import { NextResponse } from 'next/server'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { getRepConversation } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    return NextResponse.json(await getRepConversation(createAdminClient(), repId, conversationId))
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
