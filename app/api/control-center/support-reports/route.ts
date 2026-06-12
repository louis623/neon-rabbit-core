import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  listOperatorSupportReports,
  updateOperatorSupportReportStatus,
} from '@/lib/services/support-reports'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const statuses = ['open', 'reviewing', 'planned', 'resolved', 'closed'] as const

const querySchema = z.object({
  status: z.enum(statuses).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

const patchSchema = z.object({
  reportId: z.string().trim().min(1),
  status: z.enum(statuses),
})

function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  if (error instanceof OperatorAuthError) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(request: Request) {
  try {
    await getAuthenticatedOperator()
    const url = new URL(request.url)
    const query = querySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    })

    const reports = await listOperatorSupportReports(createAdminClient(), query)

    return NextResponse.json({ ok: true, reports })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Check the report filters and try again.' },
        { status: 400 },
      )
    }

    console.error('[control-center/support-reports] list failed', error)
    return NextResponse.json(
      { error: 'Support reports could not be loaded right now.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    await getAuthenticatedOperator()
    const body = patchSchema.parse(await request.json())
    const report = await updateOperatorSupportReportStatus(createAdminClient(), {
      reportId: body.reportId,
      status: body.status,
    })

    return NextResponse.json({ ok: true, report })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Check the report status and try again.' },
        { status: 400 },
      )
    }

    console.error('[control-center/support-reports] status update failed', error)
    return NextResponse.json(
      { error: 'Support report status could not be saved right now.' },
      { status: 500 },
    )
  }
}
