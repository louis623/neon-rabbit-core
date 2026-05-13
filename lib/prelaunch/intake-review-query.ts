import {
  normalizePrelaunchIntakeReviewRows,
  type PrelaunchIntakeReviewRow,
  type PrelaunchScoutRunReviewSummary,
  type PrelaunchScribeTranscriptRunReviewSummary,
  type PrelaunchIntakeReviewSubmission,
} from './intake-review'
import type { PrelaunchScribeBrief } from '@/lib/prelaunch/scribe'
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
  'handoff_status',
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
  error_message: string | null
  created_at: string
  metadata: {
    synthesis_status?: unknown
    synthesis_confidence?: unknown
    captured_evidence_count?: unknown
    evidence_source_statuses?: unknown
    reused_lesson_count?: unknown
    reused_lesson_status?: unknown
  } | null
  output: {
    publicFunnel?: unknown
    researchSynthesis?: unknown
    reusedLessons?: unknown
  } | null
}

interface PrelaunchScribeTranscriptRunReviewRow {
  intake_submission_id: string | null
  run_key: string
  status: string
  trigger_source: string
  model: string | null
  summary: string | null
  error_message: string | null
  created_at: string
  metadata: {
    drive_file_id?: unknown
    drive_file_url?: unknown
    meet_url?: unknown
    meeting_title?: unknown
    transcript_char_count?: unknown
    speaker_count?: unknown
    decision_count?: unknown
    action_item_count?: unknown
    client_preference_count?: unknown
    scribe_status?: unknown
  } | null
  output: {
    status?: unknown
    transcript?: unknown
    signals?: unknown
    scribeBrief?: unknown
  } | null
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function normalizeEvidenceSourceStatuses(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const record = item as {
        label?: unknown
        status?: unknown
        url?: unknown
      }

      if (
        typeof record.label !== 'string' ||
        typeof record.status !== 'string'
      ) {
        return null
      }

      return {
        label: record.label,
        status: record.status,
        url: typeof record.url === 'string' ? record.url : null,
      }
    })
    .filter((item): item is { label: string; status: string; url: string | null } =>
      Boolean(item),
    )
}

function normalizeReusedLessons(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const record = item as {
        sourceRunKey?: unknown
        lesson?: unknown
        similarityReasons?: unknown
      }

      if (
        typeof record.sourceRunKey !== 'string' ||
        typeof record.lesson !== 'string'
      ) {
        return null
      }

      const similarityReasons = normalizeStringArray(record.similarityReasons)

      return {
        sourceRunKey: record.sourceRunKey,
        lesson: record.lesson,
        ...(similarityReasons.length > 0 ? { similarityReasons } : {}),
      }
    })
    .filter(
      (
        item,
      ): item is {
        sourceRunKey: string
        lesson: string
        similarityReasons?: string[]
      } => Boolean(item),
    )
}

function normalizePublicFunnel(value: unknown) {
  if (!value || typeof value !== 'object') return null

  const record = value as {
    shape?: unknown
    summary?: unknown
    primaryLinks?: unknown
    concerns?: unknown
  }
  const validShapes = new Set(['direct_site_first', 'hub_first', 'unclear'])

  if (
    typeof record.shape !== 'string' ||
    !validShapes.has(record.shape) ||
    typeof record.summary !== 'string'
  ) {
    return null
  }

  return {
    shape: record.shape as 'direct_site_first' | 'hub_first' | 'unclear',
    summary: record.summary,
    primaryLinks: Array.isArray(record.primaryLinks)
      ? normalizeStringArray(record.primaryLinks)
      : [],
    concerns: Array.isArray(record.concerns)
      ? normalizeStringArray(record.concerns)
      : [],
  }
}

function normalizeResearchSynthesis(value: unknown) {
  if (!value || typeof value !== 'object') return null

  const record = value as {
    status?: unknown
    discoveryAngle?: unknown
    summaryBullets?: unknown
    followUpQuestions?: unknown
    evidenceBackedObservations?: unknown
    manualVerificationNeeded?: unknown
    contradictions?: unknown
    confidence?: unknown
  }
  const validStatuses = new Set([
    'not_available',
    'deterministic_fallback',
    'model_generated',
  ])
  const validConfidence = new Set(['low', 'medium', 'high'])

  if (
    typeof record.status !== 'string' ||
    !validStatuses.has(record.status) ||
    typeof record.confidence !== 'string' ||
    !validConfidence.has(record.confidence)
  ) {
    return null
  }

  return {
    status: record.status as
      | 'not_available'
      | 'deterministic_fallback'
      | 'model_generated',
    discoveryAngle:
      typeof record.discoveryAngle === 'string' ? record.discoveryAngle : null,
    summaryBullets: normalizeStringArray(record.summaryBullets),
    followUpQuestions: normalizeStringArray(record.followUpQuestions),
    evidenceBackedObservations: normalizeStringArray(
      record.evidenceBackedObservations,
    ),
    manualVerificationNeeded: normalizeStringArray(
      record.manualVerificationNeeded,
    ),
    contradictions: normalizeStringArray(record.contradictions),
    confidence: record.confidence as 'low' | 'medium' | 'high',
  }
}

function normalizeScoutRunReviewRow(
  row: PrelaunchScoutRunReviewRow,
): PrelaunchScoutRunReviewSummary {
  const reusedLessons = normalizeReusedLessons(row.output?.reusedLessons)
  const publicFunnel = normalizePublicFunnel(row.output?.publicFunnel)
  const researchSynthesis = normalizeResearchSynthesis(
    row.output?.researchSynthesis,
  )

  return {
    runKey: row.run_key,
    status: row.status,
    triggerSource: row.trigger_source,
    model: row.model,
    summary: row.summary,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    synthesisStatus:
      typeof row.metadata?.synthesis_status === 'string'
        ? row.metadata.synthesis_status
        : null,
    synthesisConfidence:
      typeof row.metadata?.synthesis_confidence === 'string'
        ? row.metadata.synthesis_confidence
        : null,
    capturedEvidenceCount:
      typeof row.metadata?.captured_evidence_count === 'number'
        ? row.metadata.captured_evidence_count
        : null,
    evidenceSourceStatuses: normalizeEvidenceSourceStatuses(
      row.metadata?.evidence_source_statuses,
    ),
    reusedLessonCount:
      typeof row.metadata?.reused_lesson_count === 'number'
        ? row.metadata.reused_lesson_count
        : null,
    reusedLessonStatus:
      typeof row.metadata?.reused_lesson_status === 'string'
        ? row.metadata.reused_lesson_status
        : null,
    ...(researchSynthesis ? { researchSynthesis } : {}),
    ...(publicFunnel ? { publicFunnel } : {}),
    ...(reusedLessons.length > 0 ? { reusedLessons } : {}),
  }
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeScribeTranscriptSignals(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {
      decisions: [],
      clientPreferences: [],
      actionItems: [],
      openQuestions: [],
    }
  }

  const record = value as {
    decisions?: unknown
    clientPreferences?: unknown
    actionItems?: unknown
    openQuestions?: unknown
  }

  return {
    decisions: normalizeStringArray(record.decisions),
    clientPreferences: normalizeStringArray(record.clientPreferences),
    actionItems: normalizeStringArray(record.actionItems),
    openQuestions: normalizeStringArray(record.openQuestions),
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function normalizeScribeBrief(value: unknown): PrelaunchScribeBrief | null {
  if (!value || typeof value !== 'object') return null

  const record = value as PrelaunchScribeBrief & {
    manualReviewWarnings?: unknown
  }

  if (
    record.status !== 'draft_ready' ||
    typeof record.sourceRunKey !== 'string' ||
    typeof record.summary !== 'string' ||
    !record.meeting ||
    typeof record.meeting !== 'object' ||
    !isNullableString(record.meeting.title) ||
    !isNullableString(record.meeting.startedAt) ||
    !isStringArray(record.meeting.speakerNames) ||
    !record.profileDraft ||
    typeof record.profileDraft !== 'object' ||
    typeof record.profileDraft.intakeId !== 'string' ||
    typeof record.profileDraft.ownerName !== 'string' ||
    typeof record.profileDraft.businessName !== 'string' ||
    !isStringArray(record.profileDraft.confirmedDecisions) ||
    !isStringArray(record.profileDraft.styleAndSetupSignals) ||
    !isStringArray(record.profileDraft.actionItems) ||
    !isStringArray(record.profileDraft.openQuestions) ||
    !isStringArray(record.operatorChecklist) ||
    !record.provenance ||
    typeof record.provenance !== 'object' ||
    record.provenance.meetingProvider !== 'google_meet' ||
    record.provenance.transcriptionProvider !== 'gemini' ||
    typeof record.provenance.driveFileId !== 'string' ||
    !isNullableString(record.provenance.driveFileUrl) ||
    !isNullableString(record.provenance.meetUrl) ||
    typeof record.provenance.transcriptCharCount !== 'number' ||
    !Number.isFinite(record.provenance.transcriptCharCount)
  ) {
    return null
  }

  return {
    status: record.status,
    sourceRunKey: record.sourceRunKey,
    summary: record.summary,
    meeting: {
      title: record.meeting.title,
      startedAt: record.meeting.startedAt,
      speakerNames: record.meeting.speakerNames,
    },
    profileDraft: {
      intakeId: record.profileDraft.intakeId,
      ownerName: record.profileDraft.ownerName,
      businessName: record.profileDraft.businessName,
      confirmedDecisions: record.profileDraft.confirmedDecisions,
      styleAndSetupSignals: record.profileDraft.styleAndSetupSignals,
      actionItems: record.profileDraft.actionItems,
      openQuestions: record.profileDraft.openQuestions,
    },
    operatorChecklist: record.operatorChecklist,
    manualReviewWarnings: normalizeStringArray(record.manualReviewWarnings),
    provenance: {
      meetingProvider: record.provenance.meetingProvider,
      transcriptionProvider: record.provenance.transcriptionProvider,
      driveFileId: record.provenance.driveFileId,
      driveFileUrl: record.provenance.driveFileUrl,
      meetUrl: record.provenance.meetUrl,
      transcriptCharCount: record.provenance.transcriptCharCount,
    },
  }
}

function normalizeScribeTranscriptRunReviewRow(
  row: PrelaunchScribeTranscriptRunReviewRow,
): PrelaunchScribeTranscriptRunReviewSummary {
  const transcript =
    row.output?.transcript && typeof row.output.transcript === 'object'
      ? (row.output.transcript as {
          speakerNames?: unknown
          preview?: unknown
        })
      : null
  const scribeBrief = normalizeScribeBrief(row.output?.scribeBrief)

  return {
    runKey: row.run_key,
    status: row.status,
    triggerSource: row.trigger_source,
    model: row.model,
    summary: row.summary,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    driveFileId: normalizeNullableString(row.metadata?.drive_file_id),
    driveFileUrl: normalizeNullableString(row.metadata?.drive_file_url),
    meetUrl: normalizeNullableString(row.metadata?.meet_url),
    meetingTitle: normalizeNullableString(row.metadata?.meeting_title),
    transcriptCharCount: normalizeNullableNumber(
      row.metadata?.transcript_char_count,
    ),
    speakerCount: normalizeNullableNumber(row.metadata?.speaker_count),
    decisionCount: normalizeNullableNumber(row.metadata?.decision_count),
    actionItemCount: normalizeNullableNumber(row.metadata?.action_item_count),
    clientPreferenceCount: normalizeNullableNumber(
      row.metadata?.client_preference_count,
    ),
    scribeStatus: normalizeNullableString(row.metadata?.scribe_status),
    statusForScribe: normalizeNullableString(row.output?.status),
    speakerNames: normalizeStringArray(transcript?.speakerNames),
    preview: normalizeNullableString(transcript?.preview),
    signals: normalizeScribeTranscriptSignals(row.output?.signals),
    ...(scribeBrief ? { scribeBrief } : {}),
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
        'intake_submission_id, run_key, status, trigger_source, model, summary, error_message, created_at, metadata, output',
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

async function loadLatestScribeTranscriptRunsByIntakeId(
  admin: AdminClient,
  intakeIds: string[],
) {
  const runsByIntakeId = new Map<
    string,
    PrelaunchScribeTranscriptRunReviewSummary
  >()

  if (intakeIds.length === 0) return runsByIntakeId

  try {
    const { data, error } = await admin
      .from('agent_runs')
      .select(
        'intake_submission_id, run_key, status, trigger_source, model, summary, error_message, created_at, metadata, output',
      )
      .eq('agent_name', 'Scribe')
      .eq('agent_kind', 'post_meeting_transcript_hook')
      .in('intake_submission_id', intakeIds)
      .order('created_at', { ascending: false })
      .limit(intakeIds.length * 3)

    if (error) throw error

    for (const row of (data ?? []) as PrelaunchScribeTranscriptRunReviewRow[]) {
      if (
        !row.intake_submission_id ||
        runsByIntakeId.has(row.intake_submission_id)
      ) {
        continue
      }

      runsByIntakeId.set(
        row.intake_submission_id,
        normalizeScribeTranscriptRunReviewRow(row),
      )
    }
  } catch (error) {
    console.warn(
      '[prelaunch/intake-review] Scribe transcript run history unavailable:',
      error,
    )
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
  const latestScribeTranscriptRunsByIntakeId =
    await loadLatestScribeTranscriptRunsByIntakeId(
      admin,
      submissions.map((submission) => submission.id),
    )

  return submissions.map((submission) => ({
    ...submission,
    latestScoutRun: latestScoutRunsByIntakeId.get(submission.id) ?? null,
    latestScribeTranscriptRun:
      latestScribeTranscriptRunsByIntakeId.get(submission.id) ?? null,
  }))
}
