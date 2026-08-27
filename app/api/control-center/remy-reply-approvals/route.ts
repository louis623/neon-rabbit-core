import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  decideRemyReplyApproval,
  listRemyReplyApprovals,
} from '@/lib/remy-communications/reply-approvals'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const decisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approve', 'decline']),
  note: z.string().trim().max(500).optional(),
})

function accessError(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  if (error instanceof OperatorAuthError) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  return null
}

export async function GET() {
  try {
    await getControlCenterAccess()
    const approvals = await listRemyReplyApprovals(createAdminClient(), { status: 'requested' })
    return NextResponse.json({ ok: true, approvals })
  } catch (error) {
    const response = accessError(error)
    if (response) return response
    console.error('[control-center/remy-reply-approvals] list failed', error)
    return NextResponse.json({ error: 'Reply approvals could not be loaded.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { operator } = await getControlCenterAccess()
    const input = decisionSchema.parse(await request.json())
    const approval = await decideRemyReplyApproval(createAdminClient(), {
      ...input,
      operatorId: operator.repId,
      operatorEmail: operator.email,
    })
    return NextResponse.json({ ok: true, approval })
  } catch (error) {
    const response = accessError(error)
    if (response) return response
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Check the approval decision and try again.' }, { status: 400 })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Reply approval could not be saved.' }, { status: 409 })
  }
}
