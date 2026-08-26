import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { decideRepMessageRequest } from '@/lib/services/workspace-rep-network'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ decision: z.enum(['accept', 'decline', 'decline_and_block']), reason: z.string().trim().max(500).optional() })
export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const body = schema.parse(await request.json())
    const { conversationId } = await params
    const { repId } = await getAuthenticatedNicNacContext()
    return NextResponse.json({ ok: true, result: await decideRepMessageRequest(createAdminClient(), { repId, conversationId, ...body }) })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: 'Choose a valid request action.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    throw error
  }
}
