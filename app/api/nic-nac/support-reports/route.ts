import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

const requestSchema = z.object({
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']).optional(),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).optional(),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160).optional(),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  contactOk: z.boolean().optional(),
})

type SupportReportBody = z.infer<typeof requestSchema>

function inferSupportReportType(details: string): NonNullable<SupportReportBody['reportType']> {
  if (/\b(idea|suggest|suggestion|upgrade|feature|improve|improvement)\b/i.test(details)) {
    return 'suggested_upgrade'
  }
  if (/\b(workflow|process|steps|guide|how do i|how to)\b/i.test(details)) {
    return 'workflow_idea'
  }
  if (/\b(site|website|page|link|customer-facing|public)\b/i.test(details)) {
    return 'site_issue'
  }
  return 'bug'
}

function inferSupportReportUrgency(details: string): NonNullable<SupportReportBody['urgency']> {
  if (/\b(live|show|showtime|right now|urgent|blocked|blocking|can't|cannot|stuck)\b/i.test(details)) {
    return 'blocking'
  }
  return 'normal'
}

function buildSupportReportTitle(details: string): string {
  const compact = details.replace(/\s+/g, ' ').trim()
  const firstSentence = compact.split(/[.!?]\s/)[0]?.trim() || compact
  const title = firstSentence.replace(/[.!?]+$/, '').slice(0, 120).trim()
  return title.length >= 3 ? title : 'Quick support report'
}

export async function POST(request: Request) {
  try {
    await getAuthenticatedRep()
    const body = requestSchema.parse(await request.json())
    const reportType = body.reportType ?? inferSupportReportType(body.details)
    const urgency = body.urgency ?? inferSupportReportUrgency(body.details)
    const title = body.title ?? buildSupportReportTitle(body.details)
    console.warn('[support-reports] legacy Help submission redirected to Message Center draft')
    return NextResponse.json({
      ok: true,
      submitted: false,
      action: 'open_support_composer',
      href: '/nic-nac?section=messages&compose=support&source=help',
      draft: {
        type: reportType,
        urgency,
        source: body.pageOrWorkflow ?? 'help',
        summary: title,
        details: body.details,
        expectedResult: body.expectedResult,
        actualResult: body.actualResult,
        contactOk: body.contactOk ?? true,
      },
    })
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
