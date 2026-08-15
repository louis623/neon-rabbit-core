import { NextResponse } from 'next/server'

import { runSparkleLabManualScan } from '@/lib/sparkle-lab/runner'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RequestBody = {
  runType?: 'manual' | 'urgent'
}

export async function POST(request: Request) {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    throw error
  }

  if (process.env.SPARKLE_LAB_MANUAL_RUNS_ENABLED !== 'true') {
    return NextResponse.json(
      {
        error: 'sparkle_lab_manual_runs_disabled',
        detail:
          'Manual Sparkle Lab runs are feature-flagged off until the lab tables and operator review flow are ready.',
      },
      { status: 423 },
    )
  }

  let body: RequestBody = {}
  try {
    body = (await request.json()) as RequestBody
  } catch {
    body = {}
  }

  const runType = body.runType === 'urgent' ? 'urgent' : 'manual'
  const result = await runSparkleLabManualScan({
    supabase: createAdminClient(),
    runType,
  })

  return NextResponse.json({
    runId: result.runId,
    runType: result.runType,
    usage: result.usage,
    limitsHit: result.limitsHit,
    findingCount: result.findings.length,
    artifactCount: result.artifacts.length,
    mutationMode: 'recommendations_only',
    modelSynthesisEnabled:
      process.env.SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED === 'true',
    findings: result.findings.map((finding) => ({
      section: finding.section,
      severity: finding.severity,
      confidence: finding.confidence,
      title: finding.title,
      recommendedAction: finding.recommendedAction,
      priorityRank: finding.priorityRank,
    })),
    artifacts: result.artifacts.map((artifact) => ({
      section: artifact.section,
      artifactType: artifact.artifactType,
      title: artifact.title,
    })),
  })
}
