import { NextResponse } from 'next/server'
import { z } from 'zod'

import { operatorCommunicationError } from '@/lib/control-center/operator-communication-route'
import { listOperatorMessagingSuspensions } from '@/lib/control-center/operator-network-safety'
import { setRepNetworkSuspension } from '@/lib/services/workspace-rep-network'
import { createAdminClient } from '@/lib/supabase/admin'
import { getControlCenterAccess } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z
  .object({
    repId: z.string().uuid(),
    suspended: z.boolean(),
    reason: z.string().trim().max(2000).default(''),
  })
  .superRefine((value, context) => {
    if (value.suspended && value.reason.length < 3) {
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'A suspension reason is required.',
      })
    }
  })

export async function GET(request: Request) {
  try {
    await getControlCenterAccess()
    const includeHistory = new URL(request.url).searchParams.get('history') === 'true'
    const suspensions = await listOperatorMessagingSuspensions(
      createAdminClient(),
      { activeOnly: !includeHistory },
    )
    return NextResponse.json({ ok: true, suspensions })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'Messaging suspensions could not be loaded.',
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await getControlCenterAccess()
    const body = patchSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) {
      return NextResponse.json(
        { error: 'Check the rep and suspension reason.' },
        { status: 400 },
      )
    }
    const suspension = await setRepNetworkSuspension(createAdminClient(), {
      repId: body.data.repId,
      operatorId: access.operator.repId,
      suspended: body.data.suspended,
      reason:
        body.data.reason ||
        (body.data.suspended
          ? 'Operator safety review'
          : 'Operator restored messaging access'),
    })
    return NextResponse.json({ ok: true, suspension })
  } catch (error) {
    return operatorCommunicationError(
      error,
      'The messaging suspension could not be saved.',
    )
  }
}
