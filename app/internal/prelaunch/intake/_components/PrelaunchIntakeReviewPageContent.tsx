import {
  buildPrelaunchScoutInput,
  type PrelaunchIntakeReviewSubmission,
} from '@/lib/prelaunch/intake-review'
import type { PrelaunchWaitlistReviewLead } from '@/lib/prelaunch/waitlist-review'
import {
  getPrelaunchGateReadiness,
  type PrelaunchGateReadinessItem,
} from '@/lib/prelaunch/gate-readiness'
import { buildCameraQualityPrep } from '@/lib/prelaunch/camera-quality-prep'
import { buildPhotographyKitPrep } from '@/lib/prelaunch/photography-kit-prep'
import { getApprovedPrelaunchQrManifest } from '@/lib/prelaunch/qr-assets'
import { buildScribeReadiness } from '@/lib/prelaunch/scribe-readiness'
import { buildPrelaunchOperatorHandoffBrief } from '@/lib/prelaunch/operator-handoff'
import { PrelaunchScoutRunButton } from './PrelaunchScoutRunButton'

interface PrelaunchIntakeReviewPageContentProps {
  submissions: PrelaunchIntakeReviewSubmission[]
  waitlistLeads?: PrelaunchWaitlistReviewLead[]
  activeLane?: PrelaunchIntakeReviewLane | null
  basePath?: string
  surface?: 'prelaunch_review' | 'control_center'
}

interface OperatorReadinessItem {
  label: string
  detail: string
  status: 'blocked' | 'review' | 'ready'
}

export type PrelaunchIntakeReviewLane =
  | 'needs_review'
  | 'failed_scout'
  | 'missing_transcript'
  | 'meeting_ready'
  | 'gate_blocked'

const PRELAUNCH_INTAKE_LANES: Array<{
  key: PrelaunchIntakeReviewLane
  label: string
  detail: string
}> = [
  {
    key: 'needs_review',
    label: 'Needs review',
    detail: 'Fit or setup review',
  },
  {
    key: 'failed_scout',
    label: 'Failed Scout',
    detail: 'Scout error review',
  },
  {
    key: 'missing_transcript',
    label: 'Missing transcript',
    detail: 'Meeting-ready without Scribe',
  },
  {
    key: 'meeting_ready',
    label: 'Meeting ready',
    detail: 'Transcript handoff queued',
  },
  {
    key: 'gate_blocked',
    label: 'Gate blocked',
    detail: 'Launch gates still blocked',
  },
]

export function normalizePrelaunchIntakeReviewLane(
  value: string | string[] | undefined,
): PrelaunchIntakeReviewLane | null {
  const lane = Array.isArray(value) ? value[0] : value
  return PRELAUNCH_INTAKE_LANES.some((candidate) => candidate.key === lane)
    ? (lane as PrelaunchIntakeReviewLane)
    : null
}

function formatValue(value: string | null | undefined) {
  return value?.trim() || 'Not provided'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatLabel(value: string | null | undefined) {
  return value?.replaceAll('_', ' ') ?? 'Not provided'
}

function formatScoutInputStatus(value: string) {
  if (value === 'ready') return 'Scout input ready'
  if (value === 'generated') return 'Scout generated'
  return formatLabel(value)
}

function formatLaneHref(lane: PrelaunchIntakeReviewLane | null, basePath: string) {
  return lane ? `${basePath}?lane=${lane}` : basePath
}

function hasBlockedGate(gateReadiness: PrelaunchGateReadinessItem[]) {
  return gateReadiness.some((gate) => gate.status === 'blocked')
}

function submissionMatchesLane(
  submission: PrelaunchIntakeReviewSubmission,
  lane: PrelaunchIntakeReviewLane,
  gateReadiness: PrelaunchGateReadinessItem[],
) {
  if (lane === 'needs_review') {
    return (
      submission.prequalificationStatus === 'needs_review' ||
      submission.fitFlags.length > 0
    )
  }

  if (lane === 'failed_scout') {
    return submission.latestScoutRun?.status === 'failed'
  }

  if (lane === 'missing_transcript') {
    return (
      submission.handoffStatus === 'meeting_ready' &&
      !submission.latestScribeTranscriptRun
    )
  }

  if (lane === 'meeting_ready') {
    return submission.handoffStatus === 'meeting_ready'
  }

  return hasBlockedGate(gateReadiness)
}

function formatCount(
  value: number | null | undefined,
  singular: string,
  plural = `${singular}s`,
) {
  const count = value ?? 0
  return `${count} ${count === 1 ? singular : plural}`
}

function gateStatusClass(status: string) {
  if (status === 'blocked') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function operatorStepClass(status: string) {
  if (status === 'blocked') return 'border-red-200 bg-red-50 text-red-900'
  if (status === 'review') return 'border-amber-200 bg-amber-50 text-amber-900'

  return 'border-emerald-200 bg-emerald-50 text-emerald-900'
}

function photographyPrepClass(status: string) {
  if (status === 'required') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }

  return 'border-sky-200 bg-sky-50 text-sky-900'
}

function scribeReadinessClass(status: string) {
  if (status === 'missing') return 'border-red-200 bg-red-50 text-red-900'
  if (status === 'review') return 'border-amber-200 bg-amber-50 text-amber-900'

  return 'border-emerald-200 bg-emerald-50 text-emerald-900'
}

function welcomeEmailStatusClass(status: string) {
  if (status === 'sent') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-900'
  if (status === 'skipped') return 'border-amber-200 bg-amber-50 text-amber-900'

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function formatWelcomeEmailStatus(status: string) {
  if (status === 'sent') return 'Confirmation sent'
  if (status === 'failed') return 'Confirmation failed'
  if (status === 'skipped') return 'Confirmation skipped'

  return 'Confirmation pending'
}

function buildOperatorReadiness(
  submission: PrelaunchIntakeReviewSubmission,
  gates: PrelaunchGateReadinessItem[],
) {
  const items: OperatorReadinessItem[] = []

  if (
    submission.prequalificationStatus === 'needs_review' ||
    submission.fitFlags.length > 0
  ) {
    items.push({
      label: 'Resolve fit review',
      detail:
        submission.fitFlags.length > 0
          ? `Open fit flags: ${submission.fitFlags.join(', ')}.`
          : 'Prequalification still needs operator review.',
      status: 'blocked',
    })
  } else {
    items.push({
      label: 'Fit review clear',
      detail: 'No current fit flags are attached to this intake.',
      status: 'ready',
    })
  }

  items.push(
    submission.waitlistId
      ? {
          label: 'Waitlist linked',
          detail: 'The intake is connected to a waitlist lead.',
          status: 'ready',
        }
      : {
          label: 'Link waitlist lead',
          detail: 'Connect the intake to the matching waitlist row before handoff.',
          status: 'blocked',
        },
  )

  if (!submission.latestScoutRun) {
    items.push({
      label: 'Run Scout',
      detail: 'No saved Scout run is visible for this intake yet.',
      status: 'review',
    })
  } else if (submission.latestScoutRun.status === 'failed') {
    items.push({
      label: 'Review failed Scout run',
      detail:
        submission.latestScoutRun.errorMessage ??
        'The latest Scout run failed and needs operator review.',
      status: 'blocked',
    })
  } else {
    items.push({
      label: 'Scout run saved',
      detail: `Latest Scout status: ${formatLabel(
        submission.latestScoutRun.status,
      )}.`,
      status: 'ready',
    })
  }

  const scribeWarnings =
    submission.latestScribeTranscriptRun?.scribeBrief?.manualReviewWarnings ?? []

  if (scribeWarnings.length > 0) {
    items.push({
      label: 'Review Scribe guardrails',
      detail: scribeWarnings[0],
      status: 'blocked',
    })
  } else if (submission.latestScribeTranscriptRun?.scribeBrief) {
    items.push({
      label: 'Scribe brief ready',
      detail: 'Scribe has a read-only follow-up brief ready for operator review.',
      status: 'ready',
    })
  } else if (submission.handoffStatus === 'meeting_ready') {
    items.push({
      label: 'Review transcript handoff',
      detail: 'The intake is marked meeting-ready, but no Scribe brief is visible yet.',
      status: 'review',
    })
  }

  items.push({
    label: 'Keep launch gates disabled',
    detail: gates
      .map((gate) => `${gate.label}: ${gate.displayStatus}`)
      .join('; '),
    status: 'review',
  })

  return {
    label: items.some((item) => item.status === 'blocked')
      ? 'Handoff blocked'
      : 'Operator review needed',
    items,
  }
}

function BriefList({
  items,
  title,
}: {
  items: string[]
  title: string
}) {
  if (items.length === 0) return null

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function PrelaunchIntakeReviewPageContent({
  activeLane = null,
  basePath = '/internal/prelaunch/intake',
  submissions,
  surface = 'prelaunch_review',
  waitlistLeads = [],
}: PrelaunchIntakeReviewPageContentProps) {
  const isControlCenter = surface === 'control_center'
  const total = submissions.length
  const confirmationSent = waitlistLeads.filter(
    (lead) => lead.welcomeEmailStatus === 'sent',
  ).length
  const needsReview = submissions.filter(
    (submission) => submission.prequalificationStatus === 'needs_review',
  ).length
  const qualified = submissions.filter(
    (submission) => submission.prequalificationStatus === 'qualified',
  ).length
  const scoutGenerated = submissions.filter(
    (submission) => submission.scoutInputStatus === 'generated',
  ).length
  const meetingReady = submissions.filter(
    (submission) => submission.handoffStatus === 'meeting_ready',
  ).length
  const gateReadiness = getPrelaunchGateReadiness()
  const activeLaneConfig =
    PRELAUNCH_INTAKE_LANES.find((lane) => lane.key === activeLane) ?? null
  const visibleSubmissions = activeLaneConfig
    ? submissions.filter((submission) =>
        submissionMatchesLane(submission, activeLaneConfig.key, gateReadiness),
      )
    : submissions
  const laneSummaries = PRELAUNCH_INTAKE_LANES.map((lane) => ({
    ...lane,
    count: submissions.filter((submission) =>
      submissionMatchesLane(submission, lane.key, gateReadiness),
    ).length,
  }))
  const qrManifest = getApprovedPrelaunchQrManifest({
    baseUrl: process.env.NEXT_PUBLIC_APP_URL,
  })
  const pipelineStages = [
    {
      label: 'New intake',
      count: submissions.filter(
        (submission) => submission.intakeStatus === 'submitted',
      ).length,
      detail: 'Fresh client profiles',
    },
    {
      label: 'Needs review',
      count: needsReview,
      detail: 'Fit flags or incomplete setup',
    },
    {
      label: 'Meeting ready',
      count: meetingReady,
      detail: 'Discovery call handoff',
    },
    {
      label: 'Start work ready',
      count: submissions.filter(
        (submission) => submission.handoffStatus === 'converted',
      ).length,
      detail: 'Operator-approved next step',
    },
    {
      label: 'Payment pending',
      count: 0,
      detail: 'Stripe test slice next',
    },
    {
      label: 'Agreement pending',
      count: 0,
      detail: 'SignWell sandbox slice next',
    },
    {
      label: 'Build ready',
      count: 0,
      detail: 'After payment and agreement',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {isControlCenter ? 'Sparkle Suite Control Center' : 'Sparkle Suite'}
          </p>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {isControlCenter ? 'Client intake' : 'Prelaunch intake review'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isControlCenter
                  ? 'Start at the beginning of the client pipeline: review new leads, confirm the next human action, and keep provider gates visible before start work.'
                  : 'Review submitted rep fit checks, spot handoff blockers, and copy Scout-ready context for the next onboarding step.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isControlCenter ? (
                <a
                  className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:border-slate-700 hover:bg-slate-700"
                  href="/prelaunch/intake"
                >
                  Open intake form
                </a>
              ) : null}
              <a
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
                href="/prelaunch"
              >
                View public page
              </a>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-pink-100 bg-pink-50 p-4 text-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-700">
                Approved QR flyer
              </p>
              <p className="mt-2 max-w-3xl leading-6 text-slate-700">
                Use this approved image-first flyer for QR promotion work. It
                points to the public waitlist target below.
              </p>
              <p className="mt-3 break-all rounded-md bg-white p-3 text-xs font-semibold text-slate-700">
                Canonical waitlist target: {qrManifest.targetUrl}
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pink-700">
                    QR verification steps
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
                    {qrManifest.verificationSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pink-700">
                    Provider status
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-700">
                    No external QR provider is required. Use{' '}
                    {qrManifest.displayUrl} with the approved static PNG.
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
                    {qrManifest.blockedActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <a
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-pink-200 bg-white px-4 text-sm font-semibold text-pink-800 shadow-sm transition hover:border-pink-300 hover:bg-pink-100"
              href={qrManifest.approvedFlyer.path}
              rel="noreferrer"
              target="_blank"
            >
              Open approved flyer
            </a>
          </div>
        </section>

        <section
          aria-label="Intake summary"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            [`${total} total`, 'Submitted intake forms'],
            [`${needsReview} needs review`, 'Fit flags or incomplete setup'],
            [`${qualified} qualified`, 'No current fit flags'],
            [`${scoutGenerated} Scout generated`, 'Saved Scout output'],
            [`${meetingReady} meeting ready`, 'Transcript handoff queued'],
          ].map(([value, label]) => (
            <div
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              key={label}
            >
              <p className="text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        {isControlCenter ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Client intake pipeline
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Intake is the first launch-path chapter
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-slate-600">
                Later stages stay visible here as placeholders until their
                Stripe, SignWell, and build-readiness slices are wired to real
                status.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pipelineStages.map((stage) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  key={stage.label}
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {stage.count} {stage.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {stage.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Waitlist signups
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {formatCount(waitlistLeads.length, 'waitlist lead')}
              </h2>
            </div>
            <p className="text-sm font-semibold text-emerald-700">
              {formatCount(confirmationSent, 'confirmation')} sent
            </p>
          </div>
          {waitlistLeads.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              New waitlist form submissions will appear here as soon as the
              signup automation saves them.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {waitlistLeads.map((lead) => (
                <article
                  className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm"
                  key={lead.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {lead.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {lead.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {lead.tiktokHandle} / Team rep: {lead.teamRepName}
                      </p>
                    </div>
                    <div
                      className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${welcomeEmailStatusClass(
                        lead.welcomeEmailStatus,
                      )}`}
                    >
                      {lead.welcomeEmailStatus === 'sent' ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full bg-current"
                        />
                      ) : null}
                      <span>{formatWelcomeEmailStatus(lead.welcomeEmailStatus)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <span>Lead status: {formatLabel(lead.leadStatus)}</span>
                    <span>Handoff: {formatLabel(lead.handoffStatus)}</span>
                    <span>SMS consent: {lead.smsConsent ? 'yes' : 'no'}</span>
                    <span>
                      Intake:{' '}
                      {lead.intakeSubmissionId ? 'linked' : 'not started'}
                    </span>
                  </div>
                  {lead.setupPain ? (
                    <p className="mt-3 rounded-md bg-white p-3 text-xs leading-5 text-slate-700">
                      {lead.setupPain}
                    </p>
                  ) : null}
                  {lead.welcomeEmailError ? (
                    <p className="mt-3 rounded-md border border-red-100 bg-white p-3 text-xs leading-5 text-red-700">
                      {lead.welcomeEmailError}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Joined {formatDate(lead.createdAt)}
                    {lead.welcomeEmailSentAt
                      ? ` / Confirmation ${formatDate(lead.welcomeEmailSentAt)}`
                      : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Priority lanes
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {activeLaneConfig
                  ? `Showing ${activeLaneConfig.label} lane`
                  : 'All operator lanes'}
              </h2>
            </div>
            {activeLaneConfig ? (
              <a
                className="text-sm font-semibold text-slate-600 hover:text-slate-950"
                href={formatLaneHref(null, basePath)}
              >
                Clear lane
              </a>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {laneSummaries.map((lane) => (
              <a
                className={`rounded-md border p-3 text-left transition ${
                  activeLaneConfig?.key === lane.key
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                }`}
                href={formatLaneHref(lane.key, basePath)}
                key={lane.key}
              >
                <p className="text-sm font-semibold">
                  {lane.count} {lane.label}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    activeLaneConfig?.key === lane.key
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {lane.detail}
                </p>
              </a>
            ))}
          </div>
        </section>

        {visibleSubmissions.length === 0 ? (
          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              {activeLaneConfig
                ? `No ${activeLaneConfig.label.toLowerCase()} submissions`
                : 'No intake submissions yet'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {activeLaneConfig
                ? 'Choose another lane or clear the lane filter to see the full queue.'
                : 'New /prelaunch intake forms will appear here after reps submit their fit check.'}
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-4" aria-label="Submissions">
            {visibleSubmissions.map((submission) => {
              const operatorReadiness = buildOperatorReadiness(
                submission,
                gateReadiness,
              )
              const operatorHandoffBrief = buildPrelaunchOperatorHandoffBrief({
                submission,
                gateReadiness,
                nextReviewBullets: operatorReadiness.items.map(
                  (item) => `${item.label}: ${item.detail}`,
                ),
              })
              const photographyKitPrep = buildPhotographyKitPrep(submission)
              const cameraQualityPrep = buildCameraQualityPrep(submission)
              const scribeReadiness = buildScribeReadiness(submission)
              const shouldShowScribeReadiness =
                submission.handoffStatus === 'meeting_ready' ||
                Boolean(submission.latestScribeTranscriptRun)

              return (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  key={submission.id}
                >
                  <section className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Next operator steps
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-slate-950">
                            {operatorReadiness.label}
                          </h3>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {operatorReadiness.items.map((item) => (
                          <div
                            className={`rounded-md border p-3 ${operatorStepClass(
                              item.status,
                            )}`}
                            key={item.label}
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs leading-5">
                              {item.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {operatorHandoffBrief.title}
                    </p>
                    <h3 className="font-semibold text-slate-950">
                      {operatorHandoffBrief.status}
                    </h3>
                  </div>
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-800">
                    {operatorHandoffBrief.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    <p className="mt-3 font-sans font-semibold text-slate-600">
                      Next review
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 font-sans">
                      {operatorHandoffBrief.nextReviewBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                    <p className="mt-3 font-sans font-semibold text-slate-600">
                      Guardrails
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 font-sans">
                      {operatorHandoffBrief.guardrails.map((guardrail) => (
                        <li key={guardrail}>{guardrail}</li>
                      ))}
                    </ul>
                  </div>
                </section>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Submitted {formatDate(submission.createdAt)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      {submission.businessName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {submission.name} - {submission.email} -{' '}
                      {submission.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                      {submission.prequalificationStatus.replace('_', ' ')}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
                      {formatScoutInputStatus(submission.scoutInputStatus)}
                    </span>
                    <span className="rounded-md bg-fuchsia-50 px-3 py-1 text-xs font-semibold uppercase text-fuchsia-700">
                      {submission.handoffStatus === 'meeting_ready'
                        ? 'Meeting ready'
                        : formatLabel(submission.handoffStatus)}
                    </span>
                    <span className="rounded-md bg-violet-50 px-3 py-1 text-xs font-semibold uppercase text-violet-700">
                      {submission.waitlistId
                        ? 'Waitlist linked'
                        : 'No waitlist link'}
                    </span>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="font-semibold text-slate-500">
                      Primary platform
                    </dt>
                    <dd className="mt-1 text-slate-900">
                      {submission.primaryPlatform}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">
                      Streaming cadence
                    </dt>
                    <dd className="mt-1 text-slate-900">
                      {submission.streamingFrequency}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">
                      Device setup
                    </dt>
                    <dd className="mt-1 text-slate-900">
                      {submission.deviceSetup}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Team</dt>
                    <dd className="mt-1 text-slate-900">
                      {formatValue(submission.team.name)} -{' '}
                      {submission.team.size}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 grid gap-4 text-sm lg:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-slate-500">
                      Setup goal
                    </h3>
                    <p className="mt-1 leading-6 text-slate-800">
                      {submission.setupGoal}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-500">
                      Current setup
                    </h3>
                    <p className="mt-1 leading-6 text-slate-800">
                      {submission.currentSetup}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {submission.fitFlags.length > 0 ? (
                    submission.fitFlags.map((flag) => (
                      <span
                        className="rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                        key={flag}
                      >
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      No fit flags
                    </span>
                  )}
                </div>

                <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Photography kit prep
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">
                      Hardware decision stays operator-only
                    </h3>
                    <p className="mt-1 leading-5 text-slate-600">
                      Read-only hardware-decision checklist. This does not
                      select a vendor, show pricing, create shipments, or change
                      hardware automatically.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {photographyKitPrep.items.map((item) => (
                      <div
                        className={`rounded-md border p-3 ${photographyPrepClass(
                          item.status,
                        )}`}
                        key={item.label}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photographyKitPrep.guardrails.map((guardrail) => (
                      <span
                        className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                        key={guardrail}
                      >
                        {guardrail}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Camera quality prep
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">
                      Sample-photo quality needs human review
                    </h3>
                    <p className="mt-1 leading-5 text-slate-600">
                      Operator-only sample-photo screening for blur, lighting,
                      framing, and white-background quality. This does not
                      approve hardware, shipping, pricing, or fulfillment.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {cameraQualityPrep.items.map((item) => (
                      <div
                        className={`rounded-md border p-3 ${photographyPrepClass(
                          item.status,
                        )}`}
                        key={item.label}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cameraQualityPrep.guardrails.map((guardrail) => (
                      <span
                        className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                        key={guardrail}
                      >
                        {guardrail}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Gate readiness
                      </h3>
                      <p className="mt-1 leading-5 text-slate-600">
                        No live send or payment action is enabled here yet.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {gateReadiness.map((gate) => (
                      <div
                        className={`rounded-md border p-3 ${gateStatusClass(
                          gate.status,
                        )}`}
                        key={gate.key}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {gate.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {gate.displayStatus}
                        </p>
                        <p className="mt-1 text-xs leading-5">{gate.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {submission.latestScoutRun ? (
                  <section className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                          Latest saved Scout run
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatLabel(submission.latestScoutRun.status)} via{' '}
                          {formatLabel(submission.latestScoutRun.triggerSource)}
                        </p>
                        {submission.latestScoutRun.summary ? (
                          <p className="mt-2 leading-6 text-slate-700">
                            {submission.latestScoutRun.summary}
                          </p>
                        ) : null}
                        {submission.latestScoutRun.errorMessage ? (
                          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Scout run error
                            </p>
                            <p className="mt-1 leading-6 text-red-900">
                              {submission.latestScoutRun.errorMessage}
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500 lg:text-right">
                        <span>{formatDate(submission.latestScoutRun.createdAt)}</span>
                        <span>{formatLabel(submission.latestScoutRun.model)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {submission.latestScoutRun.capturedEvidenceCount != null ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                          {submission.latestScoutRun.capturedEvidenceCount}{' '}
                          captured evidence items
                        </span>
                      ) : null}
                      {submission.latestScoutRun.synthesisStatus ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                          {formatLabel(
                            submission.latestScoutRun.synthesisStatus,
                          )}{' '}
                          synthesis
                        </span>
                      ) : null}
                      {submission.latestScoutRun.synthesisConfidence ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                          {formatLabel(
                            submission.latestScoutRun.synthesisConfidence,
                          )}{' '}
                          confidence
                        </span>
                      ) : null}
                      {submission.latestScoutRun.reusedLessonCount != null ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                          {submission.latestScoutRun.reusedLessonCount}{' '}
                          reused{' '}
                          {submission.latestScoutRun.reusedLessonCount === 1
                            ? 'lesson'
                            : 'lessons'}
                        </span>
                      ) : null}
                      {submission.latestScoutRun.reusedLessonStatus ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                          lesson reuse{' '}
                          {formatLabel(
                            submission.latestScoutRun.reusedLessonStatus,
                          )}
                        </span>
                      ) : null}
                    </div>
                    {submission.latestScoutRun.researchSynthesis &&
                    submission.latestScoutRun.researchSynthesis.status !==
                      'not_available' ? (
                      <div className="mt-3 rounded-md border border-violet-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                          Saved synthesis
                        </p>
                        {submission.latestScoutRun.researchSynthesis
                          .discoveryAngle ? (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                            {
                              submission.latestScoutRun.researchSynthesis
                                .discoveryAngle
                            }
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs font-semibold uppercase text-violet-700">
                          Confidence:{' '}
                          {
                            submission.latestScoutRun.researchSynthesis
                              .confidence
                          }
                        </p>
                        {submission.latestScoutRun.researchSynthesis
                          .summaryBullets.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              What stands out
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.researchSynthesis.summaryBullets.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScoutRun.researchSynthesis
                          .evidenceBackedObservations.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Grounded observations
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.researchSynthesis.evidenceBackedObservations.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScoutRun.researchSynthesis
                          .manualVerificationNeeded.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Manual verification needed
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.researchSynthesis.manualVerificationNeeded.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScoutRun.researchSynthesis
                          .contradictions.length > 0 ? (
                          <div className="mt-3 rounded-md bg-violet-50 p-2">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Contradictions or tensions
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.researchSynthesis.contradictions.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScoutRun.researchSynthesis
                          .followUpQuestions.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Follow-up questions
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.researchSynthesis.followUpQuestions.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {(submission.latestScoutRun.evidenceSourceStatuses ?? [])
                      .length > 0 ? (
                      <div className="mt-3 rounded-md border border-sky-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                          Saved source checks
                        </p>
                        <ul className="mt-2 space-y-2 text-xs text-slate-700">
                          {(
                            submission.latestScoutRun.evidenceSourceStatuses ?? []
                          ).map((item) => (
                            <li key={`${item.label}:${item.url ?? item.status}`}>
                              <span className="font-semibold text-slate-900">
                                {item.label}: {formatLabel(item.status)}
                              </span>
                              {item.url ? (
                                <a
                                  className="ml-2 break-all font-semibold text-sky-700 underline"
                                  href={item.url}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {item.url}
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {submission.latestScoutRun.publicFunnel ? (
                      <div className="mt-3 rounded-md border border-sky-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                          Saved public funnel
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {formatLabel(
                            submission.latestScoutRun.publicFunnel.shape,
                          )}
                        </p>
                        <p className="mt-1 leading-6 text-slate-700">
                          {submission.latestScoutRun.publicFunnel.summary}
                        </p>
                        {submission.latestScoutRun.publicFunnel.primaryLinks
                          .length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Primary public links
                            </p>
                            <ul className="mt-2 space-y-1 text-xs">
                              {submission.latestScoutRun.publicFunnel.primaryLinks.map(
                                (link) => (
                                  <li key={link}>
                                    <a
                                      className="break-all font-semibold text-sky-700 underline"
                                      href={link}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      {link}
                                    </a>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScoutRun.publicFunnel.concerns
                          .length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Funnel checks
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScoutRun.publicFunnel.concerns.map(
                                (concern) => (
                                  <li key={concern}>{concern}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {(submission.latestScoutRun.reusedLessons ?? []).length >
                    0 ? (
                      <div className="mt-3 rounded-md border border-amber-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                          Saved reused lessons
                        </p>
                        <ul className="mt-2 space-y-3 text-xs text-slate-700">
                          {(submission.latestScoutRun.reusedLessons ?? []).map(
                            (lesson) => (
                              <li
                                className="rounded-md border border-amber-100 bg-amber-50 p-3"
                                key={lesson.sourceRunKey}
                              >
                                <p className="text-sm leading-6 text-slate-800">
                                  {lesson.lesson}
                                </p>
                                {lesson.similarityReasons &&
                                lesson.similarityReasons.length > 0 ? (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold uppercase text-amber-700">
                                      Why Scout reused this
                                    </p>
                                    <ul className="mt-1 space-y-1 text-amber-900">
                                      {lesson.similarityReasons.map((reason) => (
                                        <li key={reason}>{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                <p className="mt-2 break-all text-xs font-semibold text-slate-500">
                                  {lesson.sourceRunKey}
                                </p>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : null}
                    <p className="mt-3 break-all text-xs font-semibold text-slate-500">
                      {submission.latestScoutRun.runKey}
                    </p>
                  </section>
                ) : null}

                {shouldShowScribeReadiness ? (
                  <section className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                        Scribe handoff readiness
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-950">
                        {scribeReadiness.label}
                      </h3>
                      <p className="mt-1 leading-5 text-slate-600">
                        Operator-only transcript and follow-up readiness. This
                        does not write profile fields, approve launch gates, or
                        send agreements.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {scribeReadiness.items.map((item) => (
                        <div
                          className={`rounded-md border p-3 ${scribeReadinessClass(
                            item.status,
                          )}`}
                          key={item.label}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs leading-5">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scribeReadiness.guardrails.map((guardrail) => (
                        <span
                          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                          key={guardrail}
                        >
                          {guardrail}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {submission.latestScribeTranscriptRun ? (
                  <section className="mt-5 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-700">
                          Latest Meet transcript
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatLabel(
                            submission.latestScribeTranscriptRun.status,
                          )}{' '}
                          via{' '}
                          {formatLabel(
                            submission.latestScribeTranscriptRun.triggerSource,
                          )}
                        </p>
                        {submission.latestScribeTranscriptRun.summary ? (
                          <p className="mt-2 leading-6 text-slate-700">
                            {submission.latestScribeTranscriptRun.summary}
                          </p>
                        ) : null}
                        {submission.latestScribeTranscriptRun.meetingTitle ? (
                          <p className="mt-2 text-xs font-semibold text-slate-600">
                            {submission.latestScribeTranscriptRun.meetingTitle}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500 lg:text-right">
                        <span>
                          {formatDate(
                            submission.latestScribeTranscriptRun.createdAt,
                          )}
                        </span>
                        <span>
                          {formatLabel(
                            submission.latestScribeTranscriptRun.model,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {submission.latestScribeTranscriptRun.statusForScribe ? (
                        <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-fuchsia-800">
                          {formatLabel(
                            submission.latestScribeTranscriptRun
                              .statusForScribe,
                          )}
                        </span>
                      ) : null}
                      <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-fuchsia-800">
                        {formatCount(
                          submission.latestScribeTranscriptRun.speakerCount,
                          'speaker',
                        )}
                      </span>
                      <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-fuchsia-800">
                        {formatCount(
                          submission.latestScribeTranscriptRun.decisionCount,
                          'decision',
                        )}
                      </span>
                      <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-fuchsia-800">
                        {formatCount(
                          submission.latestScribeTranscriptRun.actionItemCount,
                          'action item',
                        )}
                      </span>
                      <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-fuchsia-800">
                        {formatCount(
                          submission.latestScribeTranscriptRun
                            .clientPreferenceCount,
                          'client preference',
                        )}
                      </span>
                    </div>
                    {submission.latestScribeTranscriptRun.speakerNames.length >
                    0 ? (
                      <p className="mt-3 text-xs font-semibold text-slate-600">
                        Speakers:{' '}
                        {submission.latestScribeTranscriptRun.speakerNames.join(
                          ', ',
                        )}
                      </p>
                    ) : null}
                    {submission.latestScribeTranscriptRun.preview ? (
                      <p className="mt-3 rounded-md border border-fuchsia-100 bg-white p-3 text-xs leading-5 text-slate-700">
                        {submission.latestScribeTranscriptRun.preview}
                      </p>
                    ) : null}
                    {submission.latestScribeTranscriptRun.signals.decisions
                      .length > 0 ||
                    submission.latestScribeTranscriptRun.signals
                      .clientPreferences.length > 0 ||
                    submission.latestScribeTranscriptRun.signals.actionItems
                      .length > 0 ||
                    submission.latestScribeTranscriptRun.signals.openQuestions
                      .length > 0 ? (
                      <div className="mt-3 rounded-md border border-fuchsia-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fuchsia-700">
                          Transcript signals
                        </p>
                        {submission.latestScribeTranscriptRun.signals.decisions
                          .length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Decisions
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScribeTranscriptRun.signals.decisions.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScribeTranscriptRun.signals
                          .clientPreferences.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Client preferences
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScribeTranscriptRun.signals.clientPreferences.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScribeTranscriptRun.signals
                          .actionItems.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Action items
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScribeTranscriptRun.signals.actionItems.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                        {submission.latestScribeTranscriptRun.signals
                          .openQuestions.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Open questions
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              {submission.latestScribeTranscriptRun.signals.openQuestions.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {submission.latestScribeTranscriptRun.scribeBrief ? (
                      <div className="mt-3 rounded-md border border-violet-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                          Scribe follow-up brief
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                          {submission.latestScribeTranscriptRun.scribeBrief.summary}
                        </p>
                        <div className="mt-3 rounded-md bg-violet-50 p-3">
                          <p className="text-xs font-semibold uppercase text-violet-700">
                            Profile draft
                          </p>
                          <BriefList
                            items={
                              submission.latestScribeTranscriptRun.scribeBrief
                                .profileDraft.confirmedDecisions
                            }
                            title="Confirmed decisions"
                          />
                          <BriefList
                            items={
                              submission.latestScribeTranscriptRun.scribeBrief
                                .profileDraft.styleAndSetupSignals
                            }
                            title="Style and setup signals"
                          />
                          <BriefList
                            items={
                              submission.latestScribeTranscriptRun.scribeBrief
                                .profileDraft.actionItems
                            }
                            title="Action items"
                          />
                          <BriefList
                            items={
                              submission.latestScribeTranscriptRun.scribeBrief
                                .profileDraft.openQuestions
                            }
                            title="Open questions"
                          />
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Operator review checks
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-700">
                            {submission.latestScribeTranscriptRun.scribeBrief.operatorChecklist.map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>
                        {submission.latestScribeTranscriptRun.scribeBrief
                          .manualReviewWarnings.length > 0 ? (
                          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-semibold uppercase text-amber-800">
                              Scribe guardrails
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-amber-900">
                              {submission.latestScribeTranscriptRun.scribeBrief.manualReviewWarnings.map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-col gap-1 text-xs font-semibold text-slate-500">
                      {submission.latestScribeTranscriptRun.driveFileUrl ? (
                        <a
                          className="break-all text-fuchsia-700 underline"
                          href={submission.latestScribeTranscriptRun.driveFileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {submission.latestScribeTranscriptRun.driveFileUrl}
                        </a>
                      ) : null}
                      {submission.latestScribeTranscriptRun.meetUrl ? (
                        <a
                          className="break-all text-fuchsia-700 underline"
                          href={submission.latestScribeTranscriptRun.meetUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {submission.latestScribeTranscriptRun.meetUrl}
                        </a>
                      ) : null}
                      <span className="break-all">
                        {submission.latestScribeTranscriptRun.runKey}
                      </span>
                    </div>
                  </section>
                ) : null}

                <PrelaunchScoutRunButton intakeId={submission.id} />

                <details className="mt-5 rounded-lg border border-slate-200 bg-slate-950 text-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                    Scout input JSON
                  </summary>
                  <pre className="overflow-x-auto border-t border-white/10 p-4 text-xs leading-5 text-slate-100">
                    {JSON.stringify(buildPrelaunchScoutInput(submission), null, 2)}
                  </pre>
                </details>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
