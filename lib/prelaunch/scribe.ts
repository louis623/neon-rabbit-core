import type { PrelaunchMeetTranscriptHookOutput } from '@/lib/prelaunch/meet-transcript'

interface PrelaunchScribeBriefIntake {
  id: string
  name: string
  businessName: string
}

interface BuildPrelaunchScribeBriefOptions {
  intake: PrelaunchScribeBriefIntake
  transcriptRunKey: string
  transcriptHookOutput: PrelaunchMeetTranscriptHookOutput
}

export interface PrelaunchScribeBrief {
  status: 'draft_ready'
  sourceRunKey: string
  summary: string
  meeting: {
    title: string | null
    startedAt: string | null
    speakerNames: string[]
  }
  profileDraft: {
    intakeId: string
    ownerName: string
    businessName: string
    confirmedDecisions: string[]
    styleAndSetupSignals: string[]
    actionItems: string[]
    openQuestions: string[]
  }
  operatorChecklist: string[]
  manualReviewWarnings: string[]
  provenance: {
    meetingProvider: 'google_meet'
    transcriptionProvider: 'gemini'
    driveFileId: string
    driveFileUrl: string | null
    meetUrl: string | null
    transcriptCharCount: number
  }
}

const GATE_REVIEW_PATTERN =
  /\b(signwell|agreement|contract|legal|attorney|price|pricing|payment|fee|stripe|checkout|start work|launch fee|launch approval|launch gate)\b/i

function formatCount(
  value: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${value} ${value === 1 ? singular : plural}`
}

export function buildPrelaunchScribeBrief({
  intake,
  transcriptRunKey,
  transcriptHookOutput,
}: BuildPrelaunchScribeBriefOptions): PrelaunchScribeBrief {
  const { transcript, signals, nextAgent } = transcriptHookOutput
  const signalValues = [
    ...signals.decisions,
    ...signals.clientPreferences,
    ...signals.actionItems,
    ...signals.openQuestions,
  ]
  const manualReviewWarnings = signalValues.some((item) =>
    GATE_REVIEW_PATTERN.test(item),
  )
    ? [
        'Transcript signals mention legal, agreement, payment, pricing, or launch-gate work. Keep those items operator-only until the matching gate is configured and approved.',
      ]
    : []

  return {
    status: 'draft_ready',
    sourceRunKey: transcriptRunKey,
    summary: `Scribe draft for ${intake.businessName} is ready for operator review: ${formatCount(
      signals.decisions.length,
      'decision',
    )}, ${formatCount(
      signals.clientPreferences.length,
      'client preference',
    )}, ${formatCount(
      signals.actionItems.length,
      'action item',
    )}, and ${formatCount(
      signals.openQuestions.length,
      'open question',
    )} captured.`,
    meeting: {
      title: transcript.source.meetingTitle,
      startedAt: transcript.source.meetingStartedAt,
      speakerNames: transcript.speakerNames,
    },
    profileDraft: {
      intakeId: intake.id,
      ownerName: intake.name,
      businessName: intake.businessName,
      confirmedDecisions: signals.decisions,
      styleAndSetupSignals: signals.clientPreferences,
      actionItems: signals.actionItems,
      openQuestions: signals.openQuestions,
    },
    operatorChecklist: [
      ...nextAgent.requiredManualChecks,
      'Review all Scribe draft fields before copying them into onboarding or Builder work.',
      'Do not treat this draft as legal, payment, or launch approval.',
    ],
    manualReviewWarnings,
    provenance: {
      meetingProvider: transcript.source.meetingProvider,
      transcriptionProvider: transcript.source.transcriptionProvider,
      driveFileId: transcript.source.driveFileId,
      driveFileUrl: transcript.source.driveFileUrl,
      meetUrl: transcript.source.meetUrl,
      transcriptCharCount: transcript.charCount,
    },
  }
}
