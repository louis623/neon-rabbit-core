import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { resolveSupportReport } from '@/lib/services/support-lessons'
import { transitionSupportConversationStatus } from '@/lib/services/workspace-support-conversations'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  status: z.enum(['open', 'reviewing', 'planned', 'resolved', 'closed']),
  clientAccountProfileId: z.string().uuid().optional(),
  affectedArea: z.string().trim().min(2).max(80).optional(),
  symptom: z.string().trim().min(10).max(1200).optional(),
  rootCause: z.string().trim().min(5).max(1200).optional(),
  fixOrWorkaround: z.string().trim().min(5).max(1200).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  approvedForReuse: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.status !== 'resolved') return
  for (const field of ['affectedArea', 'symptom', 'rootCause', 'fixOrWorkaround'] as const) {
    if (!value[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'Resolution details are required.',
      })
    }
  }
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  try {
    const access = await getControlCenterAccess()
    const reportId = z.string().uuid().safeParse((await context.params).reportId)
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!reportId.success || !body.success) {
      return NextResponse.json(
        { error: 'Choose a valid support status.' },
        { status: 400 },
      )
    }
    const admin = createAdminClient()
    let lesson: unknown = null
    if (body.data.status === 'resolved') {
      const resolution = await resolveSupportReport(admin, {
        reportId: reportId.data,
        clientAccountProfileId: body.data.clientAccountProfileId,
        affectedArea: body.data.affectedArea!,
        symptom: body.data.symptom!,
        rootCause: body.data.rootCause!,
        fixOrWorkaround: body.data.fixOrWorkaround!,
        tags: body.data.tags,
        approvedForReuse: body.data.approvedForReuse,
        createdBy: access.operator.email,
      })
      lesson = resolution.lesson
    }
    const result = await transitionSupportConversationStatus(admin, {
        reportId: reportId.data,
        status: body.data.status,
        operatorId: access.operator.repId,
    })
    return NextResponse.json({ ok: true, ...result, lesson })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'The support status could not be saved.',
    )
  }
}
