import { NextResponse } from 'next/server'

import { recordPrelaunchMeetTranscript } from '@/lib/prelaunch/meet-transcript'
import { ServiceError } from '@/lib/services/errors'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : null
}

function parseTranscriptPayload(body: unknown) {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  const intakeId = readString(record, 'intakeId')
  const driveFileId = readString(record, 'driveFileId')
  const transcriptText = readString(record, 'transcriptText')

  if (!intakeId) {
    return {
      error: 'intakeId is required.',
    }
  }

  if (!driveFileId || !transcriptText) {
    return {
      error: 'driveFileId and transcriptText are required.',
    }
  }

  return {
    intakeId,
    driveFileId,
    transcriptText,
    driveFileUrl: readString(record, 'driveFileUrl'),
    meetUrl: readString(record, 'meetUrl'),
    meetingTitle: readString(record, 'meetingTitle'),
    meetingStartedAt: readString(record, 'meetingStartedAt'),
  }
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const body = await request.json()
    const payload = parseTranscriptPayload(body)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const result = await recordPrelaunchMeetTranscript({
      ...payload,
      operatorRepId: operator.repId,
    })

    return NextResponse.json({
      ok: true,
      runKey: result.runKey,
      output: result.output,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }

    console.error('[prelaunch/meet-transcript] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record this meeting transcript.' },
      { status: 500 },
    )
  }
}
