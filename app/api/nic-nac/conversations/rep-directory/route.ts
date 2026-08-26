import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { listEligibleRepNetworkDirectory } from '@/lib/services/workspace-conversation-eligibility'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
})

export async function GET(request: Request) {
  try {
    const query = querySchema.parse({ limit: new URL(request.url).searchParams.get('limit') ?? undefined })
    const { repId } = await getAuthenticatedNicNacContext()
    const reps = await listEligibleRepNetworkDirectory(createAdminClient(), repId, query)
    return NextResponse.json({ reps })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Choose a directory limit from 1 to 50.' }, { status: 400 })
    if (error instanceof ServiceError) return NextResponse.json({ code: error.code, error: error.userMessage }, { status: error.statusCode })
    console.error('[rep-network/directory] load failed', error)
    return NextResponse.json({ error: 'The Rep Network directory could not be loaded right now.' }, { status: 500 })
  }
}
