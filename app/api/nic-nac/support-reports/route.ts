import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupportReport } from '@/lib/services/support-reports'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

const requestSchema = z.object({
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).optional(),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  contactOk: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedRep()
    const body = requestSchema.parse(await request.json())
    const result = await createSupportReport(createAdminClient(), {
      repId: auth.repId,
      repEmail: auth.rep.email,
      source: 'help_form',
      reportType: body.reportType,
      urgency: body.urgency,
      pageOrWorkflow: body.pageOrWorkflow,
      title: body.title,
      details: body.details,
      expectedResult: body.expectedResult,
      actualResult: body.actualResult,
      contactOk: body.contactOk,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Check the report details and try again.' },
        { status: 400 },
      )
    }

    console.error('[support-reports] create route failed', error)
    return NextResponse.json(
      { error: 'Support report could not be saved right now.' },
      { status: 500 },
    )
  }
}
