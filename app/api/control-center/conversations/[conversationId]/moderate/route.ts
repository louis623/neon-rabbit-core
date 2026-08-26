import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { moderateRepNetworkConversation } from '@/lib/services/workspace-rep-network'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z
  .object({
    action: z.enum([
      'dismiss_report',
      'remove_message',
      'close_conversation',
      'suspend_sender',
    ]),
    reason: z.string().trim().min(3).max(2000),
    reportId: z.string().uuid().optional(),
    messageId: z.string().uuid().optional(),
  })
  .superRefine((value, context) => {
    if (value.action === 'dismiss_report' && !value.reportId) {
      context.addIssue({
        code: 'custom',
        path: ['reportId'],
        message: 'A report is required.',
      })
    }
    if (
      ['remove_message', 'suspend_sender'].includes(value.action) &&
      !value.messageId
    ) {
      context.addIssue({
        code: 'custom',
        path: ['messageId'],
        message: 'A message is required.',
      })
    }
  })

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const access = await getControlCenterAccess()
    const conversationId = z.string().uuid().safeParse(
      (await context.params).conversationId,
    )
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!conversationId.success || !body.success) {
      return NextResponse.json(
        { error: 'Choose an action and add a private reason.' },
        { status: 400 },
      )
    }
    const result = await moderateRepNetworkConversation(createAdminClient(), {
      conversationId: conversationId.data,
      operatorId: access.operator.repId,
      action: body.data.action,
      reason: body.data.reason,
      reportId: body.data.reportId,
      messageId: body.data.messageId,
    })
    return NextResponse.json({ ok: true, moderation: result })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'The moderation action could not be saved.',
    )
  }
}
