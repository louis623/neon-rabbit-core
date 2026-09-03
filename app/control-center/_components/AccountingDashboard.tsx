import Link from 'next/link'

import { ControlCenterProductSwitcher } from './ControlCenterProductSwitcher'

type AccountingProduct = 'suite' | 'finder'

const METRICS = [
  ['Monthly revenue', 'Payments actually received this month.'],
  ['Monthly expenses', 'Business costs paid this month.'],
  ['Net for the month', 'Revenue received minus expenses paid.'],
  ['Expected monthly revenue', 'Active recurring subscriptions expected this month.'],
  ['Past-due balance', 'Invoices still unpaid after their due date.'],
  ['Refunds and credits', 'Money returned or credited this month.'],
] as const

function NotConnected({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
      {children}
    </span>
  )
}

export function AccountingDashboard({ product }: { product: AccountingProduct }) {
  const productName = product === 'suite' ? 'Sparkle Suite' : 'Sparkle Finder'
  const productQuery = product === 'finder' ? '?product=finder' : ''

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{productName}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">Accounting</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Keep revenue, expenses, customer billing, and payment history separate for {productName}. Orange areas are ready for a source, but are not connected yet.
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
          {METRICS.map(([title, description]) => (
            <article className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm" key={title}>
              <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-900">{title}</p><NotConnected>Not connected</NotConnected></div>
              <p className="mt-3 text-3xl font-semibold text-amber-950">—</p>
              <p className="mt-2 text-sm leading-5 text-amber-900">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Customer billing and payment history</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">This will show what each customer pays, their plan, invoice history, latest payment, next billing date, and any remaining balance.</p></div><NotConnected>Billing source needed</NotConnected></div>
          <div className="mt-4 overflow-x-auto rounded-md border border-amber-200 bg-white"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-amber-100 text-xs font-bold uppercase tracking-wide text-amber-900"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Monthly amount</th><th className="px-4 py-3">Latest payment</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">History</th></tr></thead><tbody><tr><td className="px-4 py-5 text-slate-600" colSpan={6}>Not connected yet — no payment or invoice history is being shown until a verified source is selected.</td></tr></tbody></table></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Expense ledger</h2><p className="mt-1 text-sm leading-6 text-slate-700">Track operating costs by date, vendor, category, amount, receipt/reference, and whether the cost repeats monthly.</p></div><NotConnected>Expense source needed</NotConnected></div><p className="mt-5 rounded-md border border-amber-200 bg-white p-4 text-sm text-slate-600">Not connected yet — expenses will remain unavailable until we choose an approved source or manual-entry workflow.</p></article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Month-end checks</h2><p className="mt-1 text-sm leading-6 text-slate-700">Review refunds, credits, failed payments, taxes, and any manual adjustments before closing the month.</p></div><NotConnected>Reconciliation source needed</NotConnected></div><p className="mt-5 rounded-md border border-amber-200 bg-white p-4 text-sm text-slate-600">Not connected yet — this will become the monthly review list once revenue and expense sources are connected.</p></article>
        </section>
      </div>
    </main>
  )
}
