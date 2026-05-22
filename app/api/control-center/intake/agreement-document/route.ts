import { NextResponse } from 'next/server'

import {
  createPrelaunchAgreementDraftTracker,
  createPrelaunchSignWellSandboxDraftForBuild,
  isPrelaunchSignWellSandboxDraftCreateEnabled,
} from '@/lib/prelaunch/agreement-documents'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readProviderStatus(value: unknown) {
  const raw = readString(value)
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readBoolean(value: unknown) {
  return value === true || readString(value) === 'true'
}

function isJsonRequest(request: Request) {
  return (
    request.headers.get('content-type')?.includes('application/json') ?? false
  )
}

function sanitizeReturnTo(value: string) {
  if (value.startsWith('/control-center/intake')) return value
  return '/control-center/intake'
}

async function parsePayload(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>

    return {
      launchBuildId: readString(body.launchBuildId),
      providerDocumentId: readString(body.providerDocumentId),
      providerStatus: readProviderStatus(body.providerStatus),
      createSandboxDraft: readBoolean(body.createSandboxDraft),
      notes: readString(body.notes),
      returnTo: '/control-center/intake',
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    launchBuildId: readString(form.get('launchBuildId')),
    providerDocumentId: readString(form.get('providerDocumentId')),
    providerStatus: readProviderStatus(form.get('providerStatus')),
    createSandboxDraft: readBoolean(form.get('createSandboxDraft')),
    notes: readString(form.get('notes')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const payload = await parsePayload(request)

    if (!payload.launchBuildId) {
      return NextResponse.json(
        { error: 'launchBuildId is required.' },
        { status: 400 },
      )
    }

    if (payload.createSandboxDraft) {
      if (!isPrelaunchSignWellSandboxDraftCreateEnabled()) {
        return NextResponse.json(
          {
            code: 'SIGNWELL_SANDBOX_DRAFT_BLOCKED',
            error:
              'SignWell sandbox draft creation requires SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED=true.',
          },
          { status: 403 },
        )
      }

      const { agreementDocument, providerResult } =
        await createPrelaunchSignWellSandboxDraftForBuild({
          launchBuildId: payload.launchBuildId,
          operatorRepId: operator.repId,
          notes: payload.notes,
        })

      if (!payload.wantsJson) {
        return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
      }

      return NextResponse.json({
        ok: true,
        code: 'SIGNWELL_SANDBOX_DRAFT_CREATED',
        agreementDocument,
        providerResult,
      })
    }

    const agreementDocument = await createPrelaunchAgreementDraftTracker({
      launchBuildId: payload.launchBuildId,
      operatorRepId: operator.repId,
      providerDocumentId: payload.providerDocumentId,
      providerStatus: payload.providerStatus,
      notes: payload.notes,
    })

    if (!payload.wantsJson) {
      return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
    }

    return NextResponse.json({ ok: true, agreementDocument })
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

    console.error('[control-center/intake/agreement-document] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record this agreement draft.' },
      { status: 500 },
    )
  }
}
