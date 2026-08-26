import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { loadOperatorConversationReports } from '@/lib/control-center/operator-network-safety'
import { getOperatorConversation } from '@/lib/services/workspace-conversations'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    await getControlCenterAccess()
    const parsed = idSchema.safeParse((await context.params).conversationId)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Choose a valid conversation.' },
        { status: 400 },
      )
    }
    const admin = createAdminClient()
    const detail = await getOperatorConversation(admin, parsed.data)
    if (detail.conversation.type === 'rep_direct') {
      const reports = await loadOperatorConversationReports(admin, parsed.data)
      return NextResponse.json({ ok: true, detail: { ...detail, reports } })
    }
    return NextResponse.json({ ok: true, detail })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'That conversation could not be loaded.',
    )
  }
}
