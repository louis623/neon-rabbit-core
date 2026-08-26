import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { sendOperatorSupportReply } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  clientRequestId: z.string().trim().min(8).max(180),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const access = await getControlCenterAccess()
    const conversationId = z.string().uuid().safeParse(
      (await context.params).conversationId,
    )
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!conversationId.success || !body.success) {
      return NextResponse.json(
        { error: 'Write a reply and try again.' },
        { status: 400 },
      )
    }
    const message = await sendOperatorSupportReply(createAdminClient(), {
      conversationId: conversationId.data,
      operatorId: access.operator.repId,
      body: body.data.body,
      clientRequestId: body.data.clientRequestId,
    })
    return NextResponse.json({ ok: true, message }, { status: 201 })
  } catch (error) {
    return operatorCommunicationError(error, 'The reply could not be sent.')
  }
}
