import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import type { getControlCenterNicNacUsage } from '@/lib/remy-communications/nic-nac-usage'
import type { getControlCenterOperatorHealth } from '@/lib/remy-communications/operator-health'

type HealthSnapshot = Awaited<ReturnType<typeof getControlCenterOperatorHealth>>
type UsageSnapshot = Awaited<ReturnType<typeof getControlCenterNicNacUsage>>

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(cents / 100)
}

function label(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function Metric({ label: metricLabel, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {metricLabel}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function EndpointCard({
  name,
  endpoint,
}: {
  name: string
  endpoint: HealthSnapshot['production']['suite']
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{name}</h2>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
            endpoint?.healthy
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {endpoint?.healthy ? 'Answering' : 'Needs attention'}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="HTTP status" value={endpoint?.statusCode?.toString() ?? 'No response'} />
        <Metric label="5xx" value={endpoint?.fiveXx ? 'Detected' : 'Not detected'} />
        <Metric label="Response" value={endpoint?.responseTimeMs === null || endpoint?.responseTimeMs === undefined ? 'Unavailable' : `${endpoint.responseTimeMs} ms`} />
        <Metric label="Checked" value={endpoint?.checkedAt ?? 'Not checked'} />
      </dl>
    </article>
  )
}

export function GuardianPage({
  health,
  usage,
}: {
  health: HealthSnapshot
  usage: UsageSnapshot
}) {
  const holes = [...health.coverageHoles, ...usage.coverageHoles]

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="border-b border-slate-200 pb-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
            href="/control-center"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Control Center
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-violet-700" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Hale · flag only
              </p>
              <h1 className="text-3xl font-semibold tracking-normal">Guardian</h1>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            The same read-only production health, Nic-Nac usage, and coverage holes available to Hale through the shared Control Center MCP.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Guardian status" value={label(health.status)} />
          <Metric label="Red flags" value={String(health.redFlagCount)} />
          <Metric label="Nic-Nac runs · 24h" value={String(usage.totals.runCount)} />
          <Metric label="Known estimated spend · 24h" value={formatMoney(usage.totals.knownEstimatedSpendCents)} />
        </section>

        <section>
          <h2 className="text-lg font-semibold">Production health</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <EndpointCard endpoint={health.production.suite} name="Sparkle Suite" />
            <EndpointCard endpoint={health.production.finder} name="Sparkle Finder" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Support & safety</h2>
            <dl className="mt-4 grid gap-3">
              <Metric label="Support · last 24h" value={String(health.support.createdLast24Hours)} />
              <Metric label="Urgent open" value={String(health.support.urgentOpenCount)} />
              <Metric label="Reported Network Safety" value={String(health.safety.reportedNetworkSafetyCount)} />
            </dl>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Nic-Nac watch</h2>
            <dl className="mt-4 grid gap-3">
              <Metric label="Run spike" value={usage.totals.runSpikeDetected ? 'Detected' : 'Not detected'} />
              <Metric label="Failed or aborted" value={String(usage.totals.failedOrAbortedRunCount)} />
              <Metric label="Hard-fail matches" value={String(usage.totals.hardFailPhraseCount)} />
              <Metric label="Credit balance" value={usage.totals.creditBalance === null ? 'Not recorded' : String(usage.totals.creditBalance)} />
            </dl>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Sparkle Lab guardrails</h2>
            <dl className="mt-4 grid gap-3">
              <Metric label="Mode" value="Recommendations only" />
              <Metric label="Manual runs" value={usage.sparkleLab.manualRunsEnabled ? 'Enabled' : 'Disabled'} />
              <Metric label="Weekly runs" value={usage.sparkleLab.weeklyRunsEnabled ? 'Enabled' : 'Disabled'} />
              <Metric label="Model synthesis" value={usage.sparkleLab.modelSynthesisEnabled ? 'Enabled' : 'Disabled'} />
            </dl>
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Usage by surface</h2>
          {usage.bySurface.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Product / surface</th>
                    <th className="pb-3 pr-4">Runs</th>
                    <th className="pb-3 pr-4">Previous</th>
                    <th className="pb-3 pr-4">Spend</th>
                    <th className="pb-3 pr-4">Unknown spend</th>
                    <th className="pb-3">Spike</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usage.bySurface.map((surface) => (
                    <tr key={`${surface.product}-${surface.surface}`}>
                      <td className="py-3 pr-4 font-semibold">{label(surface.product)} / {label(surface.surface)}</td>
                      <td className="py-3 pr-4">{surface.runCount}</td>
                      <td className="py-3 pr-4">{surface.previousRunCount}</td>
                      <td className="py-3 pr-4">{formatMoney(surface.knownEstimatedSpendCents)}</td>
                      <td className="py-3 pr-4">{surface.unknownSpendRunCount}</td>
                      <td className="py-3">{surface.runSpikeDetected ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No Suite-side Nic-Nac runs were recorded in the last 48 hours.</p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Usage by model · last 24h</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {usage.byModel.map((model) => (
              <article className="rounded-md border border-slate-200 p-3" key={`${model.provider}-${model.model}`}>
                <p className="text-sm font-semibold">{model.model}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{model.provider}</p>
                <p className="mt-3 text-sm text-slate-700">{model.runCount} runs · {formatMoney(model.knownEstimatedSpendCents)} known estimate</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-lg font-semibold text-amber-900">Coverage holes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
            {holes.map((hole) => <li key={hole}>{hole}</li>)}
          </ul>
        </section>

        <p className="text-xs leading-5 text-slate-500">{health.notice} {usage.notice}</p>
      </div>
    </main>
  )
}
