import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { listReportedOperatorConversations } from '@/lib/control-center/operator-network-safety'
import { listOperatorConversations } from '@/lib/services/workspace-conversations'
import type {
  WorkspaceConversationState,
  WorkspaceConversationType,
} from '@/lib/services/workspace-conversation-permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  type: z.enum(['support', 'rep_network', 'team']).optional(),
  state: z.enum(['pending', 'open', 'resolved', 'closed', 'blocked']).optional(),
  reportedOnly: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

function conversationType(
  value: z.infer<typeof querySchema>['type'],
): WorkspaceConversationType | undefined {
  if (value === 'rep_network') return 'rep_direct'
  if (value === 'team') return 'team_onboarding'
  return value
}

export async function GET(request: Request) {
  try {
    await getControlCenterAccess()
    const url = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Check the conversation filters and try again.' },
        { status: 400 },
      )
    }
    const admin = createAdminClient()
    const result = parsed.data.reportedOnly === 'true'
      ? await listReportedOperatorConversations(admin, {
          limit: parsed.data.limit,
        })
      : await listOperatorConversations(admin, {
      type: conversationType(parsed.data.type),
      state: parsed.data.state as WorkspaceConversationState | undefined,
      reportedOnly: false,
      limit: parsed.data.limit,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'Conversations could not be loaded.',
    )
  }
}
