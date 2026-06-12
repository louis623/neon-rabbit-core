import { ControlCenterThemeToggle } from '@/app/internal/prelaunch/intake/_components/ControlCenterThemeToggle'

type SupportReportRecord = {
  id: string
  source?: string | null
  report_type?: string | null
  urgency?: string | null
  status?: string | null
  audit_status?: string | null
  page_or_workflow?: string | null
  title?: string | null
  details?: string | null
  expected_result?: string | null
  actual_result?: string | null
  client_snapshot?: Record<string, unknown> | null
  created_at?: string | null
  support_audits?: Array<Record<string, unknown>> | null
}

interface SupportCommandCenterProps {
  reports: SupportReportRecord[]
}

function label(value: string | null | undefined) {
  return value
    ? value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Not provided'
}

function snapshotText(
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
  fallback = 'Not provided',
) {
  const value = snapshot?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not dated'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not dated'
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusClass(value: string | null | undefined) {
  if (value === 'showtime_urgent' || value === 'failed' || value === 'timed_out') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (value === 'blocking' || value === 'running' || value === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (value === 'completed' || value === 'resolved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function Pill({ value }: { value: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(
        value,
      )}`}
    >
      {label(value)}
    </span>
  )
}

export function SupportCommandCenter({ reports }: SupportCommandCenterProps) {
  const activeReport = reports[0] ?? null
  const activeSnapshot = activeReport?.client_snapshot ?? null
  const activeAudit = activeReport?.support_audits?.[0] ?? null
  const findings = Array.isArray(activeAudit?.findings)
    ? activeAudit.findings
    : []
  const recommendedAction =
    typeof activeAudit?.recommended_first_action === 'string'
      ? activeAudit.recommended_first_action
      : 'Review the submitted details and account profile, then move the report into reviewing.'

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Sparkle Suite
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              Support Command Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Triage incoming support reports, review Support Auditor findings,
              and capture reusable lessons when an issue is resolved.
            </p>
          </div>
          <ControlCenterThemeToggle />
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Open reports
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {reports.filter((report) => report.status !== 'closed').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Audit pending
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {
                reports.filter((report) =>
                  ['pending', 'running'].includes(report.audit_status ?? ''),
                ).length
              }
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Urgent
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {
                reports.filter(
                  (report) => report.urgency === 'showtime_urgent',
                ).length
              }
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Lessons ready
            </p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold">Support Inbox</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <p className="px-4 py-8 text-sm text-slate-500">
                  No support reports are waiting.
                </p>
              ) : (
                reports.map((report) => (
                  <article className="px-4 py-4" key={report.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill value={report.urgency} />
                      <Pill value={report.audit_status} />
                      <Pill value={report.status} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {snapshotText(report.client_snapshot, 'clientName')} /{' '}
                      {snapshotText(report.client_snapshot, 'showName')}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label(report.report_type)} · {label(report.source)} ·{' '}
                      {formatDate(report.created_at)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-lg font-semibold">Report Detail</h2>
              </div>
              {activeReport ? (
                <div className="space-y-5 p-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill value={activeReport.urgency} />
                      <Pill value={activeReport.audit_status} />
                      <Pill value={activeReport.status} />
                    </div>
                    <h3 className="mt-3 text-xl font-semibold">
                      {activeReport.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {activeReport.details}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Workflow
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {activeReport.page_or_workflow ?? 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Submitted
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(activeReport.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Support Auditor summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {typeof activeAudit?.ai_summary === 'string'
                        ? activeAudit.ai_summary
                        : typeof activeAudit?.template_summary === 'string'
                          ? activeAudit.template_summary
                          : 'Audit details will appear here after Support Auditor finishes.'}
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Key findings
                    </p>
                    {findings.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {findings.slice(0, 5).map((finding, index) => (
                          <li key={`${activeReport.id}-finding-${index}`}>
                            {String(finding)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">
                        No findings recorded yet.
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Recommended first action
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                      {recommendedAction}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="p-4 text-sm text-slate-500">
                  Select a report to view details.
                </p>
              )}
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Client Profile</h2>
              <dl className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  ['Client', snapshotText(activeSnapshot, 'clientName')],
                  ['Show', snapshotText(activeSnapshot, 'showName')],
                  ['Phone', snapshotText(activeSnapshot, 'phone')],
                  ['Email', snapshotText(activeSnapshot, 'email')],
                ].map(([term, value]) => (
                  <div className="rounded-md border border-slate-200 p-3" key={term}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {term}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Resolution / Lesson</h2>
              <form
                action="/api/control-center/support-reports"
                className="mt-4 grid gap-3"
                method="post"
              >
                <input name="reportId" type="hidden" value={activeReport?.id ?? ''} />
                <label className="grid gap-1 text-sm font-semibold">
                  Root cause
                  <textarea
                    className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    name="rootCause"
                    placeholder="What caused the issue?"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Fix or workaround
                  <textarea
                    className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    name="fixOrWorkaround"
                    placeholder="What fixed it, or what should we try next?"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    type="submit"
                  >
                    Save resolution
                  </button>
                  <button
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    type="button"
                  >
                    Approve lesson
                  </button>
                </div>
              </form>
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}
