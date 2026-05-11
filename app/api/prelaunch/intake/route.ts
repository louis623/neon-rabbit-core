import { NextResponse } from 'next/server'

import {
  buildPrelaunchIntakeInsert,
  parsePrelaunchIntakeInput,
} from '@/lib/prelaunch/intake'
import { assertPrelaunchRequestAllowed } from '@/lib/prelaunch/request-guard'
import { runPrelaunchScoutForIntake } from '@/lib/prelaunch/scout'
import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'

async function findMatchingWaitlistId(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const { data, error } = await admin
    .from('sparkle_suite_waitlist')
    .select('id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

async function findExistingIntakeId(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const { data, error } = await admin
    .from('sparkle_suite_intake_submissions')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

async function recordWaitlistHandoff(
  admin: ReturnType<typeof createAdminClient>,
  waitlistId: string | null,
  intakeSubmissionId: string,
) {
  if (!waitlistId) return

  const { error } = await admin
    .from('sparkle_suite_waitlist')
    .update({
      intake_submission_id: intakeSubmissionId,
      handoff_status: 'intake_received',
      warmup_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', waitlistId)

  if (error) {
    console.warn('[prelaunch/intake] Waitlist handoff update failed:', error)
  }
}

async function runAutomaticScout(
  admin: ReturnType<typeof createAdminClient>,
  intakeId: string,
) {
  try {
    const result = await runPrelaunchScoutForIntake({
      admin,
      intakeId,
      operatorRepId: null,
      triggerSource: 'intake_submission',
    })

    return {
      status: 'completed' as const,
      runKey: result.runKey,
    }
  } catch (error) {
    console.warn('[prelaunch/intake] Automatic Scout run failed:', error)
    return {
      status: 'failed' as const,
    }
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    assertPrelaunchRequestAllowed({
      formName: 'intake',
      payload,
      request,
    })
    const parsed = parsePrelaunchIntakeInput(payload)
    const admin = createAdminClient()
    const baseInsert = buildPrelaunchIntakeInsert(parsed)
    const waitlistId = await findMatchingWaitlistId(admin, baseInsert.email)
    const insert = buildPrelaunchIntakeInsert(parsed, { waitlistId })
    const existingIntakeId = await findExistingIntakeId(admin, insert.email)

    let intakeSubmissionId = existingIntakeId
    const { data, error } = existingIntakeId
      ? await admin
          .from('sparkle_suite_intake_submissions')
          .update(insert)
          .eq('id', existingIntakeId)
          .select('id')
          .single()
      : await admin
          .from('sparkle_suite_intake_submissions')
          .insert(insert)
          .select('id')
          .single()

    if (error) throw error
    intakeSubmissionId = data?.id ?? intakeSubmissionId

    if (intakeSubmissionId) {
      await recordWaitlistHandoff(admin, waitlistId, intakeSubmissionId)
    }
    const scoutRun = intakeSubmissionId
      ? await runAutomaticScout(admin, intakeSubmissionId)
      : { status: 'failed' as const }

    return NextResponse.json(
      {
        ok: true,
        mode: existingIntakeId ? 'updated' : 'created',
        waitlistLinked: Boolean(waitlistId && intakeSubmissionId),
        prequalificationStatus: insert.prequalification_status,
        fitFlags: insert.fit_flags,
        scoutRun,
      },
      { status: existingIntakeId ? 200 : 201 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }

    console.error('[prelaunch/intake] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save your intake right now.' },
      { status: 500 },
    )
  }
}
