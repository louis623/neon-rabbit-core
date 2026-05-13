import {
  buildPrelaunchScoutInput,
  type PrelaunchIntakeReviewSubmission,
} from '@/lib/prelaunch/intake-review'
import { PrelaunchScoutRunButton } from './PrelaunchScoutRunButton'

interface PrelaunchIntakeReviewPageContentProps {
  submissions: PrelaunchIntakeReviewSubmission[]
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

export function PrelaunchIntakeReviewPageContent({
  submissions,
}: PrelaunchIntakeReviewPageContentProps) {
  const total = submissions.length
  const needsReview = submissions.filter(
    (submission) => submission.prequalificationStatus === 'needs_review',
  ).length
  const qualified = submissions.filter(
    (submission) => submission.prequalificationStatus === 'qualified',
  ).length
  const scoutReady = submissions.filter(
    (submission) => submission.scoutInputStatus === 'ready',
  ).length

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Sparkle Suite
          </p>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Prelaunch intake review
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review submitted rep fit checks, spot handoff blockers, and
                copy Scout-ready context for the next onboarding step.
              </p>
            </div>
            <a
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
              href="/prelaunch"
            >
              View public page
            </a>
          </div>
        </header>

        <section
          aria-label="Intake summary"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            [`${total} total`, 'Submitted intake forms'],
            [`${needsReview} needs review`, 'Fit flags or incomplete setup'],
            [`${qualified} qualified`, 'No current fit flags'],
            [`${scoutReady} Scout ready`, 'Ready for agent handoff'],
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

        {submissions.length === 0 ? (
          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              No intake submissions yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              New /prelaunch intake forms will appear here after reps submit
              their fit check.
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-4" aria-label="Submissions">
            {submissions.map((submission) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={submission.id}
              >
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
                      {submission.scoutInputStatus === 'ready'
                        ? 'Scout ready'
                        : submission.scoutInputStatus}
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
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
