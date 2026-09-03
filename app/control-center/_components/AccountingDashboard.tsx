import Link from 'next/link'

import type { SparkleSuiteAccountingProjection } from '@/lib/control-center/accounting'

import { ControlCenterProductSwitcher } from './ControlCenterProductSwitcher'

type AccountingProduct = 'suite' | 'finder'

type Metric = {
  title: string
  description: string
  value: string
  status: string
  connected: boolean
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function Status({ children, connected }: { children: React.ReactNode; connected: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {children}
    </span>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className={`rounded-lg border p-4 shadow-sm ${metric.connected ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-bold uppercase tracking-wide ${metric.connected ? 'text-slate-700' : 'text-amber-900'}`}>{metric.title}</p>
        <Status connected={metric.connected}>{metric.status}</Status>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${metric.connected ? 'text-slate-950' : 'text-amber-950'}`}>{metric.value}</p>
      <p className={`mt-2 text-sm leading-5 ${metric.connected ? 'text-slate-600' : 'text-amber-900'}`}>{metric.description}</p>
    </article>
  )
}

export function AccountingDashboard({
  product,
  suiteProjection,
}: {
  product: AccountingProduct
  suiteProjection?: SparkleSuiteAccountingProjection | null
}) {
  const productName = product === 'suite' ? 'Sparkle Suite' : 'Sparkle Finder'
  const productQuery = product === 'finder' ? '?product=finder' : ''
  const projectedRevenue =
    product === 'suite' && suiteProjection
      ? {
          title: 'Projected monthly revenue',
          description: `${suiteProjection.pricedActiveClientCount} of ${suiteProjection.activeClientCount} active clients have a recurring monthly amount.`,
          value: formatMoney(suiteProjection.monthlyRevenue),
          status: 'From client list',
          connected: true,
        }
      : {
          title: 'Projected monthly revenue',
          description: 'Active clients’ recurring monthly amounts need a Finder-specific source.',
          value: '—',
          status: 'Not connected',
          connected: false,
        }
  const metrics: Metric[] = [
    projectedRevenue,
    {
      title: 'Actual revenue collected',
      description: 'Confirmed payments received this month, including late payments when they clear.',
      value: '—',
      status: 'Not connected',
      connected: false,
    },
    {
      title: 'Projected monthly expenses',
      description: 'Expected recurring business costs for the month.',
      value: '—',
      status: 'Not connected',
      connected: false,
    },
    {
      title: 'Actual expenses paid',
      description: 'Business costs actually paid this month.',
      value: '—',
      status: 'Not connected',
      connected: false,
    },
    {
      title: 'Actual net for the month',
      description: 'Actual revenue collected minus actual expenses paid.',
      value: '—',
      status: 'Not connected',
      connected: false,
    },
    {
      title: 'Past-due balance',
      description: 'Invoices still unpaid after their due date.',
      value: '—',
      status: 'Not connected',
      connected: false,
    },
  ]

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{productName}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">Accounting</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Projected numbers come from the current client list. Actual numbers must come from confirmed payments and paid expenses, so late payments, cancellations, and refunds remain visible instead of being hidden.
            </p>
          </div>
          <ControlCenterProductSwitcher active={product} />
        </header>

        <div className="flex flex-wrap gap-3">
          <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={`/control-center${productQuery}`}>
            Back to {productName} Control Center
          </Link>
          <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={`/control-center/accounting${product === 'finder' ? '' : '?product=finder'}`}>
            View Sparkle {product === 'suite' ? 'Finder' : 'Suite'} accounting
          </Link>
        </div>

        <section aria-label={`${productName} monthly accounting overview`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => <MetricCard key={metric.title} metric={metric} />)}
        </section>

        <section className={`rounded-lg border p-5 shadow-sm ${product === 'suite' && suiteProjection ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div><h2 className="text-lg font-semibold text-slate-950">Customer billing and payment history</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">Projected billing shows each active client’s stored recurring amount. Actual payment history will separately show invoices, payments, refunds, and any balance when a verified source is connected.</p></div>
            <Status connected={product === 'suite' && Boolean(suiteProjection)}>{product === 'suite' && suiteProjection ? 'Client list connected' : 'Billing source needed'}</Status>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Projected monthly amount</th><th className="px-4 py-3">Latest actual payment</th><th className="px-4 py-3">Actual balance</th><th className="px-4 py-3">History</th></tr></thead><tbody>{product === 'suite' && suiteProjection?.clientBilling.length ? suiteProjection.clientBilling.map((client) => <tr className="border-t border-slate-100" key={client.clientName}><td className="px-4 py-3 font-medium text-slate-900">{client.clientName}</td><td className="px-4 py-3 text-slate-700">{client.plan ?? 'Not set'}</td><td className="px-4 py-3 text-slate-700">{formatMoney(client.monthlyAmount)}</td><td className="px-4 py-3 text-amber-800">Not connected</td><td className="px-4 py-3 text-amber-800">Not connected</td><td className="px-4 py-3 text-amber-800">Not connected</td></tr>) : <tr><td className="px-4 py-5 text-slate-600" colSpan={6}>Not connected yet — no projected client billing is available for this product.</td></tr>}</tbody></table></div>
          {product === 'suite' && suiteProjection && suiteProjection.clientsMissingMonthlyAmount > 0 ? <p className="mt-3 text-sm text-amber-800">{suiteProjection.clientsMissingMonthlyAmount} active client{suiteProjection.clientsMissingMonthlyAmount === 1 ? '' : 's'} do not yet have a stored monthly amount, so they are not included in the projection.</p> : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Expense ledger</h2><p className="mt-1 text-sm leading-6 text-slate-700">Track expected and paid operating costs by date, vendor, category, amount, receipt/reference, and whether the cost repeats monthly.</p></div><Status connected={false}>Expense source needed</Status></div><p className="mt-5 rounded-md border border-amber-200 bg-white p-4 text-sm text-slate-600">Not connected yet — projected and actual expenses will remain unavailable until we choose an approved source or manual-entry workflow.</p></article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Month-end checks</h2><p className="mt-1 text-sm leading-6 text-slate-700">Compare projection to actuals, then review late payments, cancellations, refunds, credits, taxes, and manual adjustments before closing the month.</p></div><Status connected={false}>Reconciliation source needed</Status></div><p className="mt-5 rounded-md border border-amber-200 bg-white p-4 text-sm text-slate-600">Not connected yet — this will become the monthly review list once actual payment and expense sources are connected.</p></article>
        </section>
      </div>
    </main>
  )
}
