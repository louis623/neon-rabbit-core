import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { reportRepNetworkConversation } from '@/lib/services/workspace-rep-network'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ messageId: z.string().uuid().optional(), reason: z.enum(['spam', 'harassment', 'recruiting', 'unsafe', 'other']), details: z.string().trim().max(2000).optional() })
export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const body = schema.parse(await request.json())
    const { conversationId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    return NextResponse.json({ ok: true, report: await reportRepNetworkConversation(createAdminClient(), { repId, conversationId, ...body }) }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Check the report and try again.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
