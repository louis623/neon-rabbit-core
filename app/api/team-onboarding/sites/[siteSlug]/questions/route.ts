import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertQuestionText } from '@/lib/team-onboarding/access'
import { createQuestion } from '@/lib/team-onboarding/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  let body: unknown

  try {
    body = await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }

    throw error
  }

  let questionText: string

  try {
    questionText = assertQuestionText(
      typeof body === 'object' && body !== null && 'questionText' in body
        ? body.questionText
        : undefined,
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Question text is required.' },
      { status: 400 },
    )
  }

  const { siteSlug } = await params
  const admin = createAdminClient()
  const { data: siteData, error: siteError } = await admin
    .from('ss_team_onboarding_sites')
    .select('id')
    .eq('slug', siteSlug)
    .eq('status', 'published')
    .maybeSingle()

  if (siteError || !siteData) {
    return NextResponse.json(
      { error: 'Onboarding site not found.' },
      { status: 404 },
    )
  }

  try {
    const receipt = await createQuestion(admin, {
      siteId: String(siteData.id),
      memberId: null,
      stepId:
        typeof body === 'object' &&
        body !== null &&
        'stepId' in body &&
        typeof body.stepId === 'string'
          ? body.stepId
          : null,
      questionText,
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('[team-onboarding/questions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit onboarding question.' },
      { status: 500 },
    )
  }
}
