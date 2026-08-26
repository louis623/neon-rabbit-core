import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { sendRepConversationMessage } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ body: z.string().trim().min(1).max(10000), clientRequestId: z.string().trim().min(1).max(180) })
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const body = schema.parse(await request.json())
    const { conversationId } = await params
    const auth = await getAuthenticatedNicNacContext()
    const message = await sendRepConversationMessage(createAdminClient(), {
      repId: auth.repId,
      repDisplayName: auth.rep.business_name || auth.rep.display_name,
      conversationId,
      ...body,
    })
    return NextResponse.json({ ok: true, message }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Check the message and try again.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
