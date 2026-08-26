import { NextResponse } from 'next/server'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { createSupportAttachmentSignedRead } from '@/lib/services/workspace-conversation-attachments'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string; attachmentId: string }> }) {
  try {
    const { conversationId, attachmentId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    return NextResponse.json(await createSupportAttachmentSignedRead(createAdminClient(), { repId, conversationId, attachmentId }))
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
