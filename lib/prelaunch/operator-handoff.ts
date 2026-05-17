import type { PrelaunchGateReadinessItem } from '@/lib/prelaunch/gate-readiness'
import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

export interface PrelaunchOperatorHandoffBrief {
  title: 'Operator handoff brief'
  status: 'Blocked fit review' | 'Operator review'
  lines: string[]
  nextReviewBullets: string[]
  guardrails: string[]
}

interface BuildPrelaunchOperatorHandoffBriefInput {
  submission: PrelaunchIntakeReviewSubmission
  gateReadiness: PrelaunchGateReadinessItem[]
  nextReviewBullets?: string[]
}

const OPERATOR_HANDOFF_GUARDRAILS = [
  'No live SMS send.',
  'No live SignWell send.',
  'No payment collection.',
  'No kit fulfillment approval.',
]

function formatLabel(value: string | null | undefined) {
  return value?.replaceAll('_', ' ') || 'not provided'
}

function formatWaitlistStatus(submission: PrelaunchIntakeReviewSubmission) {
  return submission.waitlistId ? 'waitlist linked' : 'waitlist not linked'
}

function formatScoutStatus(submission: PrelaunchIntakeReviewSubmission) {
  const scoutRun = submission.latestScoutRun

  if (!scoutRun) {
    return 'Scout: not run yet'
  }

  const status = formatLabel(scoutRun.status)
  const detail = scoutRun.summary ?? scoutRun.errorMessage

  return detail ? `Scout: ${status} - ${detail}` : `Scout: ${status}`
}

function formatScribeStatus(submission: PrelaunchIntakeReviewSubmission) {
  const transcriptRun = submission.latestScribeTranscriptRun

  if (!transcriptRun) {
    return null
  }

  const status = [
    formatLabel(transcriptRun.status),
    formatLabel(
      transcriptRun.statusForScribe ?? transcriptRun.scribeStatus ?? null,
    ),
  ]
    .filter(
      (value, index, values) =>
        value !== 'not provided' && values.indexOf(value) === index,
    )
    .join(' / ')
  const detail = transcriptRun.scribeBrief?.summary ?? transcriptRun.summary

  return detail ? `Scribe: ${status} - ${detail}` : `Scribe: ${status}`
}

function buildDefaultNextReviewBullets(
  submission: PrelaunchIntakeReviewSubmission,
) {
  const bullets: string[] = []

  if (
    submission.prequalificationStatus === 'needs_review' ||
    submission.fitFlags.length > 0
  ) {
    bullets.push(
      submission.fitFlags.length > 0
        ? `Resolve fit flags: ${submission.fitFlags.join(', ')}.`
        : 'Resolve prequalification review before handoff.',
    )
  }

  if (!submission.latestScoutRun) {
    bullets.push('Confirm whether Scout needs to be run before the next review.')
  } else if (submission.latestScoutRun.status === 'failed') {
    bullets.push('Review the failed Scout run before using the handoff.')
  }

  const scribeWarnings =
    submission.latestScribeTranscriptRun?.scribeBrief?.manualReviewWarnings ?? []

  for (const warning of scribeWarnings) {
    bullets.push(`Review Scribe warning: ${warning}`)
  }

  if (!submission.waitlistId) {
    bullets.push('Link the matching waitlist lead before launch handoff.')
  }

  return bullets.length > 0
    ? bullets
    : ['Review the brief manually before copying into the next operator step.']
}

export function buildPrelaunchOperatorHandoffBrief({
  submission,
  gateReadiness,
  nextReviewBullets,
}: BuildPrelaunchOperatorHandoffBriefInput): PrelaunchOperatorHandoffBrief {
  const scribeStatus = formatScribeStatus(submission)
  const gateReminder = gateReadiness
    .map((gate) => `${gate.label} - ${gate.displayStatus}`)
    .join('; ')

  return {
    title: 'Operator handoff brief',
    status:
      submission.prequalificationStatus === 'needs_review' ||
      submission.fitFlags.length > 0
        ? 'Blocked fit review'
        : 'Operator review',
    lines: [
      `Owner/business: ${submission.name} - ${submission.businessName}`,
      `Contact: ${submission.email} - ${submission.phone}`,
      `Current status: ${formatLabel(
        submission.prequalificationStatus,
      )} / ${formatLabel(submission.handoffStatus)} / ${formatWaitlistStatus(
        submission,
      )}`,
      formatScoutStatus(submission),
      ...(scribeStatus ? [scribeStatus] : []),
      `Gate reminder: ${gateReminder}`,
    ],
    nextReviewBullets:
      nextReviewBullets && nextReviewBullets.length > 0
        ? nextReviewBullets
        : buildDefaultNextReviewBullets(submission),
    guardrails: OPERATOR_HANDOFF_GUARDRAILS,
  }
}
