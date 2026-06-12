import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  listOperatorSupportReports,
  updateOperatorSupportReportStatus,
} from '@/lib/services/support-reports'
import { resolveSupportReport } from '@/lib/services/support-lessons'
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
  clientAccountProfileId: z.string().trim().min(1).optional(),
  affectedArea: z.string().trim().min(2).max(80).optional(),
  symptom: z.string().trim().min(10).max(1200).optional(),
  rootCause: z.string().trim().min(5).max(1200).optional(),
  fixOrWorkaround: z.string().trim().min(5).max(1200).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  approvedForReuse: z.boolean().optional(),
})

const resolvedPatchSchema = patchSchema.extend({
  status: z.literal('resolved'),
  affectedArea: z.string().trim().min(2).max(80),
  symptom: z.string().trim().min(10).max(1200),
  rootCause: z.string().trim().min(5).max(1200),
  fixOrWorkaround: z.string().trim().min(5).max(1200),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  approvedForReuse: z.boolean().default(false),
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
    const operator = await getAuthenticatedOperator()
    const body = patchSchema.parse(await request.json())
    const admin = createAdminClient()

    if (body.status === 'resolved') {
      const resolvedBody = resolvedPatchSchema.parse(body)
      const result = await resolveSupportReport(admin, {
        reportId: resolvedBody.reportId,
        clientAccountProfileId: resolvedBody.clientAccountProfileId,
        affectedArea: resolvedBody.affectedArea,
        symptom: resolvedBody.symptom,
        rootCause: resolvedBody.rootCause,
        fixOrWorkaround: resolvedBody.fixOrWorkaround,
        tags: resolvedBody.tags,
        approvedForReuse: resolvedBody.approvedForReuse,
        createdBy: operator.rep.email,
      })

      return NextResponse.json({
        ok: true,
        report: result.report,
        lesson: result.lesson,
      })
    }

    const report = await updateOperatorSupportReportStatus(admin, {
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
