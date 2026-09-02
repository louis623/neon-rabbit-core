import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Bot,
  Download,
  Gauge,
} from 'lucide-react'
import Link from 'next/link'

import { RefreshButton } from './RefreshButton'
import type { CostCapacitySnapshot } from '@/lib/remy-communications/nic-nac-cost-capacity'

function money(cents: number | null, fallback = 'Unavailable') {
  if (cents === null) return fallback
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(cents / 100)
}

function number(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

function timestamp(value: string | null) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(value))
}

function label(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function modelDecision(fit: CostCapacitySnapshot['byModel'][number]['modelFit']) {
  if (fit === 'static') return 'Right-sized · no model needed'
  if (fit === 'drift') return 'Review · differs from current policy'
  if (fit === 'unknown') return 'Review · telemetry incomplete'
  return 'Matches policy · validate with evals'
}

function Metric({
  eyebrow,
  value,
  detail,
}: {
  eyebrow: string
  value: string
  detail: string
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{eyebrow}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  )
}

export function CostCapacityPage({ snapshot }: { snapshot: CostCapacitySnapshot }) {
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
          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50">
                  <Gauge aria-hidden="true" className="h-5 w-5 text-violet-700" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Nic-Nac operations</p>
                  <h1 className="text-3xl font-semibold tracking-tight">Cost &amp; Capacity</h1>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Read-only AI usage, estimated run cost, and provider-reported actual cost for Sparkle Suite and Sparkle Finder. This is an operations view, not the accounting ledger.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
                href={`/api/control-center/nic-nac-usage/export?month=${encodeURIComponent(snapshot.month)}`}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Monthly CSV
              </a>
              <RefreshButton />
            </div>
          </div>
        </header>

        <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dashboard refreshed</p>
            <p className="mt-1 font-semibold">{timestamp(snapshot.generatedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Latest telemetry</p>
            <p className="mt-1 font-semibold">{timestamp(snapshot.telemetryAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Latest provider costs fetch</p>
            <p className="mt-1 font-semibold">{timestamp(snapshot.providerCostsAt)}</p>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <form className="flex items-end gap-2" method="get">
            <label className="text-sm font-semibold text-slate-700">
              Calendar month
              <input
                className="mt-1 block min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                defaultValue={snapshot.month}
                name="month"
                type="month"
              />
            </label>
            <button className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100" type="submit">
              View
            </button>
          </form>
          <p className="text-sm text-slate-500">Showing {snapshot.monthLabel} · America/New_York reporting</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            detail="OpenAI Costs API; available only when a read-only admin key and product project mapping are configured."
            eyebrow="Actual provider spend"
            value={money(snapshot.totals.actualCents)}
          />
          <Metric
            detail={`${snapshot.totals.unknownEstimatedCostRuns} run(s) have unknown estimate pricing.`}
            eyebrow="Estimated telemetry spend"
            value={money(snapshot.totals.estimatedCents)}
          />
          <Metric
            detail={`${number(snapshot.rates.tokensPerDay)} input + output tokens/day.`}
            eyebrow="Usage rate"
            value={`${number(snapshot.rates.runsPerDay)} runs/day`}
          />
          <Metric
            detail="Estimated burn from per-run telemetry. Provider actuals can lag."
            eyebrow="Spend rate"
            value={`${money(Math.round(snapshot.rates.estimatedCentsPerDay))}/day`}
          />
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Banknote aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
            <div>
              <h2 className="font-semibold text-amber-950">Prepaid credits</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">{snapshot.providerBalance.note}</p>
              <a
                className="mt-2 inline-flex text-sm font-semibold text-amber-950 underline underline-offset-4"
                href={snapshot.providerBalance.billingUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open OpenAI Billing
              </a>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Spend classes</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {snapshot.products.map((product) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={product.productClass}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bot aria-hidden="true" className="h-5 w-5 text-violet-700" />
                    <h3 className="text-lg font-semibold">Sparkle {label(product.productClass)}</h3>
                  </div>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">Separate class</span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div><dt className="text-xs text-slate-500">Actual</dt><dd className="mt-1 font-semibold">{money(product.actualCents)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Estimated</dt><dd className="mt-1 font-semibold">{money(product.estimatedCents)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Runs</dt><dd className="mt-1 font-semibold">{product.runs}</dd></div>
                  <div><dt className="text-xs text-slate-500">Customer-facing estimate</dt><dd className="mt-1 font-semibold">{money(product.customerFacingEstimatedCents)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Lab / utility estimate</dt><dd className="mt-1 font-semibold">{money(product.internalEstimatedCents)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Successful workflows</dt><dd className="mt-1 font-semibold">{product.successfulWorkflows}</dd></div>
                  <div><dt className="text-xs text-slate-500">Hard failures</dt><dd className="mt-1 font-semibold">{product.hardFails}</dd></div>
                  <div><dt className="text-xs text-slate-500">Cost / success</dt><dd className="mt-1 font-semibold">{money(product.costPerSuccessfulWorkflowCents)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Bot aria-hidden="true" className="h-5 w-5 text-violet-700" />
            <h2 className="text-lg font-semibold">What each model tier is for</h2>
          </div>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
            These are current product-specific policies, not historical policy-at-run-time assertions. Finder uses a separately maintained reporting baseline; changing Suite does not change Finder. Proving that a different model is better requires the same workflow replayed against both models, with quality, tool correctness, latency, and cost scored together.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="pb-3 pr-4">Policy tier</th><th className="pb-3 pr-4">Work it is for</th><th className="pb-3 pr-4">Configured model</th><th className="pb-3 pr-4">Reasoning</th><th className="pb-3">Optimization status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.modelPolicies.map((policy) => (
                  <tr key={`${policy.productClass}-${policy.policyKey}`}>
                    <td className="py-3 pr-4"><span className="font-semibold">{label(policy.productClass)} · {label(policy.purpose)}</span><span className="block text-xs text-slate-500">{policy.policyKey}</span></td>
                    <td className="py-3 pr-4">{policy.job}</td>
                    <td className="py-3 pr-4 font-semibold">{policy.model}</td>
                    <td className="py-3 pr-4">{label(policy.reasoning)}</td>
                    <td className="py-3">Needs comparative replay evidence</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity aria-hidden="true" className="h-5 w-5 text-violet-700" />
            <h2 className="text-lg font-semibold">Model fit by workload</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="pb-3 pr-4">Class</th><th className="pb-3 pr-4">Workload</th><th className="pb-3 pr-4">Actual / expected model</th><th className="pb-3 pr-4">Policy tier</th><th className="pb-3 pr-4">Runs</th><th className="pb-3 pr-4">Tokens in / out / cached</th><th className="pb-3 pr-4">Estimated</th><th className="pb-3 pr-4">Cost / success</th><th className="pb-3">Decision</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.byModel.map((row) => (
                  <tr key={`${row.productClass}-${row.model}-${row.purpose}-${row.workload}`}>
                    <td className="py-3 pr-4 font-semibold">{label(row.productClass)}</td>
                    <td className="py-3 pr-4 font-semibold">{row.workload}</td>
                    <td className="py-3 pr-4"><span className="font-semibold">{row.model}</span><span className="block text-xs text-slate-500">Expected: {row.expectedModel ?? 'No model'}</span></td>
                    <td className="py-3 pr-4"><span className="font-semibold">{label(row.purpose)}</span><span className="block text-xs text-slate-500">Reasoning: {row.reasoningLevel ? label(row.reasoningLevel) : '—'} / {row.expectedReasoning ? label(row.expectedReasoning) : '—'}</span></td>
                    <td className="py-3 pr-4">{row.runs}</td>
                    <td className="py-3 pr-4">{row.inputTokens} / {row.outputTokens} / {row.cachedTokens}</td>
                    <td className="py-3 pr-4">{money(row.estimatedCents)}</td>
                    <td className="py-3 pr-4">{money(row.costPerSuccessfulWorkflowCents)}</td>
                    <td className="py-3">{row.unknownPrice ? 'Review · unknown price' : modelDecision(row.modelFit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Recent run evidence</h2>
          <p className="mt-1 text-sm text-slate-500">Latest 50 rows for the selected month. Actual provider cost remains aggregate and is never fabricated per run.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1420px] text-left text-xs">
              <thead className="uppercase tracking-wide text-slate-500">
                <tr><th className="pb-3 pr-3">Started · ET</th><th className="pb-3 pr-3">Class / surface</th><th className="pb-3 pr-3">Workload</th><th className="pb-3 pr-3">Actual / expected model</th><th className="pb-3 pr-3">Policy tier</th><th className="pb-3 pr-3">Run ID</th><th className="pb-3 pr-3">In</th><th className="pb-3 pr-3">Out</th><th className="pb-3 pr-3">Cached</th><th className="pb-3 pr-3">Est.</th><th className="pb-3">Outcome</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.recentRuns.map((row) => (
                  <tr key={`${row.productClass}-${row.runId}`}>
                    <td className="py-3 pr-3 whitespace-nowrap">{timestamp(row.startedAt)}</td>
                    <td className="py-3 pr-3"><span className="font-semibold">{label(row.productClass)}</span><span className="block text-slate-500">{label(row.surface)} · {label(row.costClass)}</span></td>
                    <td className="py-3 pr-3 font-semibold">{row.workload}</td>
                    <td className="py-3 pr-3"><span className="font-semibold">{row.model}</span><span className="block text-slate-500">Expected: {row.expectedModel ?? 'No model'}</span></td>
                    <td className="py-3 pr-3"><span className="font-semibold">{label(row.purpose)}</span><span className="block text-slate-500">{row.policyKey ?? 'Static application action'}</span></td>
                    <td className="max-w-52 truncate py-3 pr-3 font-mono" title={row.runId}>{row.runId}</td>
                    <td className="py-3 pr-3">{row.inputTokens ?? '—'}</td>
                    <td className="py-3 pr-3">{row.outputTokens ?? '—'}</td>
                    <td className="py-3 pr-3">{row.cachedTokens ?? '—'}</td>
                    <td className="py-3 pr-3">{money(row.estimatedCents, '—')}</td>
                    <td className="py-3">{row.hardFail ? 'Hard fail' : row.successful ? 'Success' : 'Incomplete'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {(snapshot.alerts.length > 0 || snapshot.coverageHoles.length > 0) && (
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-center gap-2"><AlertTriangle aria-hidden="true" className="h-5 w-5 text-rose-700" /><h2 className="font-semibold text-rose-950">Actionable alerts</h2></div>
              {snapshot.alerts.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-rose-900">{snapshot.alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul> : <p className="mt-3 text-sm text-rose-900">No model, price, or failure alerts.</p>}
            </article>
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold text-amber-950">Coverage &amp; source notes</h2>
              {snapshot.coverageHoles.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900">{snapshot.coverageHoles.map((hole) => <li key={hole}>{hole}</li>)}</ul> : <p className="mt-3 text-sm text-amber-900">All configured data sources answered.</p>}
            </article>
          </section>
        )}
      </div>
    </main>
  )
}
