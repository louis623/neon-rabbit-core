import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { updateRepConversationState } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ read: z.boolean().optional(), archived: z.boolean().optional(), muted: z.boolean().optional() }).refine((value) => value.read !== undefined || value.archived !== undefined || value.muted !== undefined)

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const body = schema.parse(await request.json())
    const { conversationId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    return NextResponse.json({ ok: true, result: await updateRepConversationState(createAdminClient(), { repId, conversationId, ...body }) })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Choose a valid message state.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
