import { NextResponse } from 'next/server'
import { z } from 'zod'

import { BUG_HUNT_ITEM_TYPES } from '@/lib/control-center/bug-hunt'
import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { promoteSupportReportToTask } from '@/lib/services/workspace-support-conversations'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  title: z.string().trim().min(3).max(240),
  itemType: z.enum(BUG_HUNT_ITEM_TYPES),
  owner: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(4000).optional(),
  status: z.literal('planned').optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  try {
    const access = await getControlCenterAccess()
    const reportId = z.string().uuid().safeParse((await context.params).reportId)
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!reportId.success || !body.success) {
      return NextResponse.json(
        { error: 'Review the Task List details and try again.' },
        { status: 400 },
      )
    }
    const result = await promoteSupportReportToTask(createAdminClient(), {
      reportId: reportId.data,
      title: body.data.title,
      itemType: body.data.itemType,
      owner: body.data.owner,
      notes: body.data.notes,
      operatorId: access.operator.repId,
      status: body.data.status,
    })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'The support report could not be promoted.',
    )
  }
}
