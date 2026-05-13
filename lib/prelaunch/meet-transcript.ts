import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

interface PrelaunchMeetTranscriptIntakeRow {
  id: string
  full_name: string
  business_name: string
  waitlist_id: string | null
}

export interface RecordPrelaunchMeetTranscriptOptions {
  admin?: AdminClient
  intakeId: string
  operatorRepId?: string | null
  driveFileId: string
  driveFileUrl?: string | null
  meetUrl?: string | null
  meetingTitle?: string | null
  meetingStartedAt?: string | null
  transcriptText: string
  now?: Date
}

export interface PrelaunchMeetTranscriptSignals {
  decisions: string[]
  clientPreferences: string[]
  actionItems: string[]
  openQuestions: string[]
}

export interface PrelaunchMeetTranscriptHookOutput {
  status: 'ready_for_scribe'
  transcript: {
    source: {
      meetingProvider: 'google_meet'
      transcriptionProvider: 'gemini'
      driveFileId: string
      driveFileUrl: string | null
      meetUrl: string | null
      meetingTitle: string | null
      meetingStartedAt: string | null
    }
    charCount: number
    preview: string
    speakerNames: string[]
  }
  signals: PrelaunchMeetTranscriptSignals
  nextAgent: {
    name: 'Scribe'
    status: 'queued'
    requiredManualChecks: string[]
  }
}

const TRANSCRIPT_PREVIEW_CHARS = 500

function requireText(value: string, code: string, message: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new ServiceError({
      code,
      message,
      userMessage: message,
      statusCode: 400,
    })
  }

  return trimmed
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildTranscriptRunKey(intakeId: string, driveFileId: string) {
  const safeDriveFileId = driveFileId
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120)

  return `scribe_hook:${intakeId}:${safeDriveFileId}`
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function stripSpeakerPrefix(line: string) {
  return line.replace(/^[^:\n]{1,60}:\s*/, '').trim()
}

function stripSignalPrefix(line: string, pattern: RegExp) {
  return stripSpeakerPrefix(line).replace(pattern, '').trim()
}

function getTranscriptLines(transcriptText: string) {
  return transcriptText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractSpeakerNames(lines: string[]) {
  return dedupeStrings(
    lines
      .map((line) => line.match(/^([^:\n]{1,60}):\s+/)?.[1] ?? null)
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 12)
}

export function extractPrelaunchMeetTranscriptSignals(
  transcriptText: string,
): PrelaunchMeetTranscriptSignals {
  const lines = getTranscriptLines(transcriptText)

  return {
    decisions: dedupeStrings(
      lines
        .filter((line) =>
          /\b(key decision|decision|decided|approved)\b/i.test(line),
        )
        .map((line) =>
          stripSignalPrefix(line, /^(key decision|decision|decided|approved):?\s*/i),
        ),
    ).slice(0, 8),
    clientPreferences: dedupeStrings(
      lines
        .filter((line) =>
          /\b(i prefer|i want|i need|brand vibe|aesthetic|color|team name)\b/i.test(
            line,
          ),
        )
        .map(stripSpeakerPrefix),
    ).slice(0, 10),
    actionItems: dedupeStrings(
      lines
        .filter((line) =>
          /\b(action item|todo|follow up|next step)\b/i.test(line),
        )
        .map((line) =>
          stripSignalPrefix(line, /^(action item|todo|follow up|next step):?\s*/i),
        ),
    ).slice(0, 10),
    openQuestions: dedupeStrings(
      lines
        .filter((line) => line.includes('?'))
        .map(stripSpeakerPrefix),
    ).slice(0, 8),
  }
}

function buildTranscriptHookOutput({
  driveFileId,
  driveFileUrl,
  meetUrl,
  meetingTitle,
  meetingStartedAt,
  transcriptText,
}: {
  driveFileId: string
  driveFileUrl: string | null
  meetUrl: string | null
  meetingTitle: string | null
  meetingStartedAt: string | null
  transcriptText: string
}): PrelaunchMeetTranscriptHookOutput {
  const lines = getTranscriptLines(transcriptText)

  return {
    status: 'ready_for_scribe',
    transcript: {
      source: {
        meetingProvider: 'google_meet',
        transcriptionProvider: 'gemini',
        driveFileId,
        driveFileUrl,
        meetUrl,
        meetingTitle,
        meetingStartedAt,
      },
      charCount: transcriptText.length,
      preview: transcriptText.slice(0, TRANSCRIPT_PREVIEW_CHARS),
      speakerNames: extractSpeakerNames(lines),
    },
    signals: extractPrelaunchMeetTranscriptSignals(transcriptText),
    nextAgent: {
      name: 'Scribe',
      status: 'queued',
      requiredManualChecks: [
        'Confirm the Drive transcript belongs to this intake before running Scribe.',
        'Run Scribe transcript interpretation before treating profile fields as final.',
      ],
    },
  }
}

async function loadTranscriptIntake(admin: AdminClient, intakeId: string) {
  const { data, error } = await admin
    .from('sparkle_suite_intake_submissions')
    .select('id, full_name, business_name, waitlist_id')
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    throw new ServiceError({
      code: 'INTAKE_NOT_FOUND',
      message: `prelaunch intake not found: ${intakeId}`,
      userMessage: "I couldn't find that prelaunch intake.",
      statusCode: 404,
      cause: error,
    })
  }

  return data as PrelaunchMeetTranscriptIntakeRow
}

export async function recordPrelaunchMeetTranscript({
  admin = createAdminClient(),
  intakeId,
  operatorRepId = null,
  driveFileId,
  driveFileUrl,
  meetUrl,
  meetingTitle,
  meetingStartedAt,
  transcriptText,
  now = new Date(),
}: RecordPrelaunchMeetTranscriptOptions) {
  const normalizedIntakeId = requireText(
    intakeId,
    'INTAKE_ID_REQUIRED',
    'intakeId is required.',
  )
  const normalizedDriveFileId = requireText(
    driveFileId,
    'DRIVE_FILE_ID_REQUIRED',
    'driveFileId is required.',
  )
  const normalizedTranscriptText = requireText(
    transcriptText,
    'TRANSCRIPT_REQUIRED',
    'transcriptText is required.',
  )
  const intake = await loadTranscriptIntake(admin, normalizedIntakeId)
  const timestamp = now.toISOString()
  const runKey = buildTranscriptRunKey(normalizedIntakeId, normalizedDriveFileId)
  const normalizedDriveFileUrl = normalizeOptionalText(driveFileUrl)
  const normalizedMeetUrl = normalizeOptionalText(meetUrl)
  const normalizedMeetingTitle = normalizeOptionalText(meetingTitle)
  const normalizedMeetingStartedAt = normalizeOptionalText(meetingStartedAt)
  const output = buildTranscriptHookOutput({
    driveFileId: normalizedDriveFileId,
    driveFileUrl: normalizedDriveFileUrl,
    meetUrl: normalizedMeetUrl,
    meetingTitle: normalizedMeetingTitle,
    meetingStartedAt: normalizedMeetingStartedAt,
    transcriptText: normalizedTranscriptText,
  })

  const { error: runError } = await admin.from('agent_runs').upsert(
    {
      run_key: runKey,
      agent_name: 'Scribe',
      agent_kind: 'post_meeting_transcript_hook',
      subject_type: 'prelaunch_intake',
      subject_id: normalizedIntakeId,
      rep_id: operatorRepId,
      intake_submission_id: normalizedIntakeId,
      waitlist_id: intake.waitlist_id,
      status: 'queued',
      trigger_source: 'google_meet_gemini_transcript',
      model: 'gemini_transcript_hook_v1',
      summary: `Gemini transcript captured for ${intake.business_name}; Scribe processing is queued.`,
      input: {
        intake: {
          id: intake.id,
          name: intake.full_name,
          businessName: intake.business_name,
        },
        transcript: {
          text: normalizedTranscriptText,
          source: output.transcript.source,
        },
      },
      output,
      metadata: {
        source: 'google_meet_gemini_transcript',
        drive_file_id: normalizedDriveFileId,
        drive_file_url: normalizedDriveFileUrl,
        meet_url: normalizedMeetUrl,
        meeting_title: normalizedMeetingTitle,
        meeting_started_at: normalizedMeetingStartedAt,
        transcript_char_count: normalizedTranscriptText.length,
        speaker_count: output.transcript.speakerNames.length,
        decision_count: output.signals.decisions.length,
        action_item_count: output.signals.actionItems.length,
        client_preference_count: output.signals.clientPreferences.length,
        scribe_status: 'queued',
      },
      started_at: timestamp,
      finished_at: timestamp,
    },
    { onConflict: 'run_key' },
  )

  if (runError) throw runError

  const { error: updateError } = await admin
    .from('sparkle_suite_intake_submissions')
    .update({ handoff_status: 'meeting_ready' })
    .eq('id', normalizedIntakeId)

  if (updateError) throw updateError

  return {
    runKey,
    output,
  }
}
