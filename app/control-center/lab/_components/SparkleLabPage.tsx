import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import type {
  SparkleLabControlCenterModel,
  SparkleLabFindingSummary,
  SparkleLabRunSummary,
  SparkleLabSectionSummary,
} from '@/lib/sparkle-lab/read-model'

interface SparkleLabPageProps {
  model: SparkleLabControlCenterModel
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(cents / 100)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not run yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not run yet'
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function label(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusClass(value: string) {
  if (value === 'urgent' || value === 'failed') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (value === 'high' || value === 'running' || value === 'stopped_by_limit') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (value === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function Pill({ value }: { value: string }) {
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

function SectionSummary({ section }: { section: SparkleLabSectionSummary }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{section.label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {section.description}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Findings
          </p>
          <p className="mt-1 text-2xl font-semibold">{section.findingCount}</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Artifacts
          </p>
          <p className="mt-1 text-2xl font-semibold">{section.artifactCount}</p>
        </div>
      </div>
    </article>
  )
}

function RunSummary({ run }: { run: SparkleLabRunSummary }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Pill value={run.runType} />
        <Pill value={run.status} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950">
        Created {formatDate(run.createdAt)}
      </p>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">
        Usage & Limits
      </h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="Cost" value={`${formatMoney(run.estimatedCostCents)} / ${formatMoney(run.costCapCents)}`} />
        <Metric label="Model calls" value={`${run.modelCallCount} / ${run.modelCallCap}`} />
        <Metric label="Premium calls" value={`${run.premiumCallCount} / ${run.premiumCallCap}`} />
        <Metric label="Candidate records" value={`${run.candidateRecordCount} / ${run.candidateRecordCap}`} />
        <Metric label="Deep items" value={`${run.deepItemCount} / ${run.deepItemCap}`} />
        <Metric label="Headline findings" value={`${run.headlineFindingCount} / ${run.headlineFindingCap}`} />
        <Metric label="Active priorities" value={`${run.activePriorityCount} / ${run.activePriorityCap}`} />
      </dl>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Limits hit: {run.limitsHit.length ? run.limitsHit.map(label).join(', ') : 'None'}
      </p>
    </article>
  )
}

function Finding({ finding }: { finding: SparkleLabFindingSummary }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Pill value={finding.section} />
        <Pill value={finding.severity} />
        <Pill value={finding.confidence} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-950">
        {finding.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {finding.summary}
      </p>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Recommended action
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
          {finding.recommendedAction}
        </p>
      </div>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

export function SparkleLabPage({ model }: SparkleLabPageProps) {
  const latestRun = model.latestRuns[0] ?? null

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
              href="/control-center"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Control Center
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white">
                <FlaskConical aria-hidden="true" className="h-5 w-5 text-slate-700" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Sparkle Suite
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                  Sparkle Lab
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Internal lab results, replay candidates, research notes, and bounded
              improvement priorities for Nic-Nac, Sparkle Suite, and Sparkle Finder.
            </p>
          </div>
        </header>

        {model.accessIssue ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Sparkle Lab data is not available yet: {model.accessIssue}
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              Recommendations only
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              No production self-mutation
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sparkle Lab can record findings, artifacts, usage, and limits for operator review. It does not change production prompts, tools, pricing, code, customer data, or account behavior.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Weekly cap
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatMoney(model.caps.weekly.costCapCents)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {model.caps.weekly.modelCallCap} calls, {model.caps.weekly.premiumCallCap} premium.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Monthly scheduled cap
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatMoney(model.caps.weekly.monthlyScheduledCapCents ?? 0)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Applies to weekly scheduled Lab runs.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Manual cap
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatMoney(model.caps.manual.costCapCents)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {model.caps.manual.modelCallCap} calls, {model.caps.manual.premiumCallCap} premium.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Active priorities
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {model.activePriorities.length}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Limit is {model.caps.weekly.activePriorityCap} per weekly report.
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {model.sections.map((section) => (
            <SectionSummary key={section.id} section={section} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Latest Run</h2>
            {latestRun ? (
              <RunSummary run={latestRun} />
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                No lab runs have been recorded yet.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Headline Findings</h2>
            {model.headlineFindings.length > 0 ? (
              model.headlineFindings.map((finding) => (
                <Finding finding={finding} key={finding.id} />
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                No findings are available yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Artifacts</h2>
          {model.recentArtifacts.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {model.recentArtifacts.map((artifact) => (
                <article className="rounded-md border border-slate-200 p-3" key={artifact.id}>
                  <div className="flex flex-wrap gap-2">
                    <Pill value={artifact.section} />
                    <Pill value={artifact.artifactType} />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{artifact.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {artifact.bodyMarkdown || 'No artifact body recorded.'}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No lab artifacts have been recorded yet.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
