import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

export interface ScribeReadinessItem {
  label: string
  detail: string
  status: 'missing' | 'review' | 'ready'
}

export interface ScribeReadinessSummary {
  label: string
  status: 'missing' | 'review' | 'ready'
  items: ScribeReadinessItem[]
  guardrails: string[]
}

const SCRIBE_READINESS_GUARDRAILS = [
  'No autonomous profile writeback.',
  'No legal, payment, or launch approval.',
  'No live SignWell send.',
]

function formatCount(
  value: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${value} ${value === 1 ? singular : plural}`
}

export function buildScribeReadiness(
  submission: PrelaunchIntakeReviewSubmission,
): ScribeReadinessSummary {
  const transcriptRun = submission.latestScribeTranscriptRun

  if (!transcriptRun) {
    return {
      label:
        submission.handoffStatus === 'meeting_ready'
          ? 'Transcript handoff needed'
          : 'Scribe transcript not started',
      status: 'missing',
      items: [
        {
          label: 'Attach transcript hook output',
          detail:
            submission.handoffStatus === 'meeting_ready'
              ? 'This intake is meeting-ready, but no Meet/Gemini transcript run is visible yet.'
              : 'No Meet/Gemini transcript run is visible for this intake yet.',
          status: 'missing',
        },
      ],
      guardrails: SCRIBE_READINESS_GUARDRAILS,
    }
  }

  const speakerCount =
    transcriptRun.speakerCount ?? transcriptRun.speakerNames.length
  const transcriptState =
    transcriptRun.statusForScribe ?? transcriptRun.scribeStatus ?? transcriptRun.status
  const items: ScribeReadinessItem[] = [
    {
      label: 'Transcript captured',
      detail: `${transcriptRun.driveFileId ?? transcriptRun.runKey} is ${transcriptState} with ${formatCount(
        speakerCount,
        'speaker',
      )}.`,
      status: 'ready',
    },
  ]

  if (!transcriptRun.scribeBrief) {
    const transcriptOpenQuestionCount = transcriptRun.signals.openQuestions.length

    if (transcriptOpenQuestionCount > 0) {
      items.push({
        label: 'Transcript open questions need operator follow-up',
        detail: `${formatCount(
          transcriptOpenQuestionCount,
          'open question',
        )} ${
          transcriptOpenQuestionCount === 1 ? 'is' : 'are'
        } visible before Scribe brief generation.`,
        status: 'review',
      })
    }

    items.push({
      label: 'Scribe brief missing',
      detail:
        'Transcript signals are visible, but no follow-up brief is ready yet.',
      status: 'review',
    })

    return {
      label: 'Scribe processing review needed',
      status: 'review',
      items,
      guardrails: SCRIBE_READINESS_GUARDRAILS,
    }
  }

  items.push({
    label: 'Brief ready for operator review',
    detail: `${transcriptRun.scribeBrief.summary} Review before copying anything into onboarding or Builder work.`,
    status: 'ready',
  })

  const openQuestionCount =
    transcriptRun.scribeBrief.profileDraft.openQuestions.length
  const warningCount = transcriptRun.scribeBrief.manualReviewWarnings.length

  if (openQuestionCount > 0) {
    items.push({
      label: 'Open questions need operator follow-up',
      detail: `${formatCount(
        openQuestionCount,
        'open question',
      )} remains in the Scribe profile draft.`,
      status: 'review',
    })
  }

  if (warningCount > 0) {
    items.push({
      label: 'Manual review warnings',
      detail: `${formatCount(
        warningCount,
        'Scribe guardrail warning',
      )} needs operator review.`,
      status: 'review',
    })
  }

  const needsReview = items.some((item) => item.status === 'review')

  return {
    label: needsReview
      ? 'Scribe follow-up incomplete'
      : 'Scribe follow-up review ready',
    status: needsReview ? 'review' : 'ready',
    items,
    guardrails: SCRIBE_READINESS_GUARDRAILS,
  }
}
