import {
  normalizePrelaunchIntakeReviewRows,
  type PrelaunchIntakeReviewRow,
  type PrelaunchScoutRunReviewSummary,
  type PrelaunchIntakeReviewSubmission,
} from './intake-review'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export const PRELAUNCH_INTAKE_REVIEW_SELECT = [
  'id',
  'full_name',
  'email',
  'phone',
  'business_name',
  'tiktok_handle',
  'instagram_handle',
  'facebook_url',
  'team_name',
  'team_size',
  'primary_platform',
  'streaming_frequency',
  'current_setup',
  'setup_goal',
  'device_setup',
  'brand_vibe',
  'color_preferences',
  'special_requests',
  'intake_status',
  'prequalification_status',
  'fit_flags',
  'waitlist_id',
  'scout_input_status',
  'created_at',
  'updated_at',
].join(', ')

interface PrelaunchScoutRunReviewRow {
  intake_submission_id: string | null
  run_key: string
  status: string
  trigger_source: string
  model: string | null
  summary: string | null
  created_at: string
  metadata: {
    synthesis_status?: unknown
    captured_evidence_count?: unknown
  } | null
}

function normalizeScoutRunReviewRow(
  row: PrelaunchScoutRunReviewRow,
): PrelaunchScoutRunReviewSummary {
  return {
    runKey: row.run_key,
    status: row.status,
    triggerSource: row.trigger_source,
    model: row.model,
    summary: row.summary,
    createdAt: row.created_at,
    synthesisStatus:
      typeof row.metadata?.synthesis_status === 'string'
        ? row.metadata.synthesis_status
        : null,
    capturedEvidenceCount:
      typeof row.metadata?.captured_evidence_count === 'number'
        ? row.metadata.captured_evidence_count
        : null,
  }
}

async function loadLatestScoutRunsByIntakeId(
  admin: AdminClient,
  intakeIds: string[],
) {
  const runsByIntakeId = new Map<string, PrelaunchScoutRunReviewSummary>()

  if (intakeIds.length === 0) return runsByIntakeId

  try {
    const { data, error } = await admin
      .from('agent_runs')
      .select(
        'intake_submission_id, run_key, status, trigger_source, model, summary, created_at, metadata',
      )
      .eq('agent_name', 'Scout')
      .in('intake_submission_id', intakeIds)
      .order('created_at', { ascending: false })
      .limit(intakeIds.length * 3)

    if (error) throw error

    for (const row of (data ?? []) as PrelaunchScoutRunReviewRow[]) {
      if (!row.intake_submission_id || runsByIntakeId.has(row.intake_submission_id)) {
        continue
      }

      runsByIntakeId.set(
        row.intake_submission_id,
        normalizeScoutRunReviewRow(row),
      )
    }
  } catch (error) {
    console.warn('[prelaunch/intake-review] Scout run history unavailable:', error)
  }

  return runsByIntakeId
}

export async function loadPrelaunchIntakeReviewSubmissions(
  admin: AdminClient = createAdminClient(),
  limit = 50,
): Promise<PrelaunchIntakeReviewSubmission[]> {
  const { data, error } = await admin
    .from('sparkle_suite_intake_submissions')
    .select(PRELAUNCH_INTAKE_REVIEW_SELECT)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) throw error

  const submissions = normalizePrelaunchIntakeReviewRows(
    (data ?? []) as unknown as PrelaunchIntakeReviewRow[],
  )
  const latestScoutRunsByIntakeId = await loadLatestScoutRunsByIntakeId(
    admin,
    submissions.map((submission) => submission.id),
  )

  return submissions.map((submission) => ({
    ...submission,
    latestScoutRun: latestScoutRunsByIntakeId.get(submission.id) ?? null,
  }))
}
