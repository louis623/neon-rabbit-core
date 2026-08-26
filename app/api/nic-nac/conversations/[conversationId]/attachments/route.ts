import { NextResponse } from 'next/server'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { createSupportConversationAttachment } from '@/lib/services/workspace-conversation-attachments'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const clientRequestIdValue = form.get('clientRequestId')
    const clientRequestId = typeof clientRequestIdValue === 'string' ? clientRequestIdValue.trim() : undefined
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a screenshot first.' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Choose an image smaller than 8 MB.' }, { status: 413 })
    if (clientRequestId && clientRequestId.length > 180) return NextResponse.json({ error: 'That screenshot request is not valid.' }, { status: 400 })
    const { conversationId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    const attachment = await createSupportConversationAttachment(createAdminClient(), { repId, conversationId, file: Buffer.from(await file.arrayBuffer()), clientRequestId })
    return NextResponse.json({ ok: true, attachment }, { status: attachment.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
