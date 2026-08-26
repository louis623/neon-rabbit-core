import { NextResponse } from 'next/server'
import { z } from 'zod'
import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { createSupportAttachmentSignedRead } from '@/lib/services/workspace-conversation-attachments'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
  attachmentId: z.string().uuid(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string; attachmentId: string }> },
) {
  try {
    await getControlCenterAccess()
    const parsed = paramsSchema.safeParse(await context.params)
    if (!parsed.success) return NextResponse.json({ error: 'Choose a valid screenshot.' }, { status: 400 })
    return NextResponse.json(await createSupportAttachmentSignedRead(createAdminClient(), {
      conversationId: parsed.data.conversationId,
      attachmentId: parsed.data.attachmentId,
      operatorAuthorized: true,
    }))
  } catch (error) {
    return operatorCommunicationError(error, 'That screenshot could not be opened right now.')
  }
}
