import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { createRepMessageRequest } from '@/lib/services/workspace-rep-network'
import { getRepConversation } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z
  .object({
    recipientRepId: z.string().uuid(),
    body: z.string().trim().min(1).max(10000),
    clientRequestId: z.string().trim().min(1).max(180),
    subject: z.string().trim().max(160).optional(),
    contextType: z
      .enum(['dance_floor_dancer', 'trade_request', 'rep_profile'])
      .optional(),
    contextId: z.string().uuid().optional(),
  })
  .strict()

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const auth = await getAuthenticatedNicNacContext()
    const admin = createAdminClient()
    const result = await createRepMessageRequest(admin, { senderRepId: auth.repId, senderDisplayName: auth.rep.business_name || auth.rep.display_name, ...body })
    const detail = await getRepConversation(admin, auth.repId, result.conversationId)
    return NextResponse.json({ ok: true, ...result, conversation: detail.conversation, messages: detail.messages }, { status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Check the message request and try again.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
