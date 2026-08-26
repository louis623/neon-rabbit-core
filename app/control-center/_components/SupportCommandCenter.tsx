import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { ControlCenterThemeToggle } from '@/app/internal/prelaunch/intake/_components/ControlCenterThemeToggle'
import { CustomerWaitlistPanel } from '@/app/control-center/_components/CustomerWaitlistPanel'
import { BugHuntPanel } from '@/app/control-center/_components/BugHuntPanel'
import { ControlCenterProductSwitcher } from '@/app/control-center/_components/ControlCenterProductSwitcher'
import type { BugHuntItem } from '@/lib/control-center/bug-hunt'
import type { CustomerWaitlistLead } from '@/lib/prelaunch/customer-waitlist'

export type SupportReportRecord = {
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

export type OperatorCustomerRecord = {
  repId: string
  clientName: string
  showName: string
  primaryContactName: string | null
  email: string
  phone: string | null
  referral: {
    code: string | null
    usageCount: number
  }
  accountStatus: string | null
  subscriptionStatus: string | null
  supportTier: string | null
  publicSiteSlug: string | null
  customDomain: string | null
  shopLink: string | null
  streamingLinks: Record<string, unknown>
  socialHandles: Record<string, unknown>
  internalNotes: string | null
  setupStatus: string | null
  setupCurrentStep: string | null
  billing: {
    status: string | null
    planTier: string | null
    pricingTier: string | null
    monthlyAmount: number | null
    currentPeriodEnd: string | null
    stripeCustomerId: string | null
  }
  createdAt?: string | null
  updatedAt?: string | null
}

interface SupportCommandCenterProps {
  reports: SupportReportRecord[]
  customers: OperatorCustomerRecord[]
  waitlist: CustomerWaitlistLead[]
  bugHuntItems: BugHuntItem[]
}

const CUSTOMER_DATABASE_KEYS = ['milehighfizz', 'brittwithbling', 'blingkitchen']

function label(value: string | null | undefined) {
  return value
    ? value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Not provided'
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function normalizeAccountKey(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isCustomerDatabaseAccount(customer: OperatorCustomerRecord) {
  const candidates = [
    customer.publicSiteSlug,
    customer.customDomain,
    customer.clientName,
    customer.showName,
    customer.email,
  ].map(normalizeAccountKey)

  return candidates.some((candidate) =>
    CUSTOMER_DATABASE_KEYS.some(
      (knownCustomer) =>
        candidate === knownCustomer || candidate.includes(knownCustomer),
    ),
  )
}

function snapshotText(
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
  fallback = 'Not provided',
) {
  const value = snapshot?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function objectEntries(value: Record<string, unknown> | null | undefined) {
  return Object.entries(value ?? {}).filter(([, entry]) => {
    if (typeof entry !== 'string') return false
    return entry.trim().length > 0
  }) as Array<[string, string]>
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

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number') return 'Not provided'
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function formatCount(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : '0'
}

function statusClass(value: string | null | undefined) {
  if (value === 'showtime_urgent' || value === 'failed' || value === 'timed_out') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (
    value === 'blocking' ||
    value === 'running' ||
    value === 'pending' ||
    value === 'past_due'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (
    value === 'completed' ||
    value === 'resolved' ||
    value === 'active' ||
    value === 'dashboard_unlocked'
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (value === 'demo_account') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
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

function InfoBlock({
  className = '',
  term,
  value,
}: {
  className?: string
  term: string
  value: string
}) {
  return (
    <div className={`rounded-md border border-slate-200 p-3 ${className}`}>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {term}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  )
}

function CustomerProfile({
  customer,
  profileType = 'customer',
}: {
  customer: OperatorCustomerRecord
  profileType?: 'customer' | 'demo'
}) {
  const socialLinks = objectEntries(customer.socialHandles)
  const streamingLinks = objectEntries(customer.streamingLinks)

  return (
    <details className="group border-t border-slate-100 first:border-t-0">
      <summary
        aria-label={`Expand ${customer.clientName} profile`}
        className="grid cursor-pointer list-none gap-3 px-4 py-4 marker:hidden md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_auto]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-950">
              {customer.clientName}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
            />
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">
            {customer.showName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profileType === 'demo' ? <Pill value="demo_account" /> : null}
          <Pill value={customer.accountStatus} />
          <Pill value={customer.subscriptionStatus} />
          <Pill value={customer.supportTier} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:text-right">
          Updated {formatDate(customer.updatedAt)}
        </p>
      </summary>

      <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Contact</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoBlock
              term="Rep"
              value={customer.primaryContactName ?? customer.clientName}
            />
            <InfoBlock
              term="Phone"
              value={customer.phone ?? 'Not provided'}
            />
            <InfoBlock term="Show title" value={customer.showName} />
            <InfoBlock
              term="Promo code"
              value={customer.referral.code ?? 'Not provided'}
            />
            <InfoBlock
              term="Promo uses"
              value={formatCount(customer.referral.usageCount)}
            />
            <InfoBlock
              className="sm:col-span-2"
              term="Email"
              value={customer.email}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Billing</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoBlock term="Subscription" value={label(customer.billing.status)} />
            <InfoBlock term="Plan" value={label(customer.billing.planTier)} />
            <InfoBlock term="Pricing" value={label(customer.billing.pricingTier)} />
            <InfoBlock
              term="Monthly"
              value={formatMoney(customer.billing.monthlyAmount)}
            />
            <InfoBlock
              term="Period end"
              value={formatDate(customer.billing.currentPeriodEnd)}
            />
            <InfoBlock
              term="Stripe customer"
              value={customer.billing.stripeCustomerId ?? 'Not provided'}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Website and Social</h3>
          <dl className="mt-3 grid gap-3">
            <InfoBlock
              term="Public site"
              value={
                customer.publicSiteSlug
                  ? `/${customer.publicSiteSlug}`
                  : 'Not provided'
              }
            />
            <InfoBlock
              term="Custom domain"
              value={customer.customDomain ?? 'Not provided'}
            />
            <InfoBlock
              term="Shop link"
              value={customer.shopLink ?? 'Not provided'}
            />
          </dl>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Social
              </p>
              {socialLinks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-800">
                  {socialLinks.map(([key, value]) => (
                    <li className="break-words" key={`${customer.repId}-${key}`}>
                      {label(key)}: {value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Not provided</p>
              )}
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Streaming
              </p>
              {streamingLinks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-800">
                  {streamingLinks.map(([key, value]) => (
                    <li className="break-words" key={`${customer.repId}-${key}`}>
                      {label(key)}: {value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Not provided</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Status and Notes</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoBlock term="Setup" value={label(customer.setupStatus)} />
            <InfoBlock
              term="Current step"
              value={label(customer.setupCurrentStep)}
            />
          </dl>
          <div className="mt-3 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Internal notes
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              {customer.internalNotes ?? 'No internal notes yet.'}
            </p>
          </div>
        </section>
      </div>
    </details>
  )
}

export function SupportCommandCenter({
  customers,
  reports,
  waitlist,
  bugHuntItems,
}: SupportCommandCenterProps) {
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
  const openReports = reports.filter((report) => report.status !== 'closed')
  const customerAccounts = customers.filter(isCustomerDatabaseAccount)
  const demoAccounts = customers.filter(
    (customer) => !isCustomerDatabaseAccount(customer),
  )

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Sparkle Suite
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              Sparkle Suite Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review support tickets, customer status, billing signals, public
              site details, and operator notes from one internal workspace.
            </p>
          </div>
          <ControlCenterThemeToggle />
        </header>

        <ControlCenterProductSwitcher active="suite" />

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Control Center Options
              </p>
              <Link
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
                href="/control-center/messages"
              >
                Messages
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                  New
                </span>
              </Link>
              <Link
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
                href="/control-center/resources"
              >
                Resources
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                  Publisher
                </span>
              </Link>
              <a
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="#support-tickets"
              >
                Trouble Tickets
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {openReports.length}
                </span>
              </a>
              <a
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="#bug-hunt-updates"
              >
                Task List
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {bugHuntItems.filter((item) => item.status !== 'complete').length}
                </span>
              </a>
              <a
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="#customer-waitlist"
              >
                Customer Waitlist
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {waitlist.filter((lead) => !lead.accountActivatedAt).length}
                </span>
              </a>
              <a
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="#customer-database"
              >
                Customer Database
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {customerAccounts.length}
                </span>
              </a>
              <a
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="#demo-database"
              >
                Demo Database
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {demoAccounts.length}
                </span>
              </a>
              <Link
                className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="/control-center/lab"
              >
                Sparkle Lab
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  New
                </span>
              </Link>
            </nav>
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Open reports
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {openReports.length}
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
                  Active accounts
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {customerAccounts.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Demo accounts
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {demoAccounts.length}
                </p>
              </div>
            </section>

            <details className="group/support control-center-panel scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="support-tickets">
              <summary aria-label="Expand Trouble Tickets" className="control-center-summary flex cursor-pointer list-none flex-col gap-3 px-4 py-4 marker:hidden md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Trouble Tickets</h2>
                    <ChevronDown aria-hidden="true" className="h-5 w-5 text-slate-500 transition group-open/support:rotate-180" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Review reported issues, account details, and audit guidance.</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{openReports.length} open</p>
              </summary>
              <div className="grid gap-5 border-t border-slate-200 p-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
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
                            {snapshotText(report.client_snapshot, 'clientName')}{' '}
                            / {snapshotText(report.client_snapshot, 'showName')}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {label(report.report_type)} / {label(report.source)} /{' '}
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
                    <h2 className="text-lg font-semibold">Rep Profile</h2>
                    <dl className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        ['Client', snapshotText(activeSnapshot, 'clientName')],
                        ['Show', snapshotText(activeSnapshot, 'showName')],
                        ['Phone', snapshotText(activeSnapshot, 'phone')],
                        ['Email', snapshotText(activeSnapshot, 'email')],
                      ].map(([term, value]) => (
                        <InfoBlock key={term} term={term} value={value} />
                      ))}
                    </dl>
                  </article>

                  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-semibold">Resolution / Lesson</h2>
                    <dl className="mt-4 grid gap-3">
                      {[
                        ['Root cause', 'Waiting on resolution review'],
                        ['Fix or workaround', 'Waiting on resolution review'],
                        ['Reusable lesson', 'Not approved yet'],
                      ].map(([term, value]) => (
                        <InfoBlock key={term} term={term} value={value} />
                      ))}
                    </dl>
                  </article>
                </section>
              </div>
            </details>

            <CustomerWaitlistPanel initialLeads={waitlist} />

            <BugHuntPanel initialItems={bugHuntItems} />

            <details
              className="group/database control-center-panel scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm"
              id="customer-database"
            >
              <summary
                aria-label="Expand Customer Database"
                className="control-center-summary flex cursor-pointer list-none flex-col gap-2 px-4 py-4 marker:hidden md:flex-row md:items-end md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Customer Database</h2>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400 transition group-open/database:rotate-180"
                    />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Active customer accounts only: Mile High Fizz, Britt With
                    Bling, and BlingKitchen.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {countLabel(customerAccounts.length, 'customer account')}
                </p>
              </summary>

              {customerAccounts.length === 0 ? (
                <p className="border-t border-slate-200 px-4 py-8 text-sm text-slate-500">
                  No customer profiles are available yet.
                </p>
              ) : (
                <div className="border-t border-slate-200">
                  {customerAccounts.map((customer) => (
                    <CustomerProfile customer={customer} key={customer.repId} />
                  ))}
                </div>
              )}
            </details>

            <details
              className="group/database control-center-panel scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm"
              id="demo-database"
            >
              <summary
                aria-label="Expand Demo Database"
                className="control-center-summary flex cursor-pointer list-none flex-col gap-2 px-4 py-4 marker:hidden md:flex-row md:items-end md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Demo Database</h2>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400 transition group-open/database:rotate-180"
                    />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Demo, reviewer, smoke, and sample accounts are kept separate
                    from active customers.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {countLabel(demoAccounts.length, 'demo account')}
                </p>
              </summary>

              {demoAccounts.length === 0 ? (
                <p className="border-t border-slate-200 px-4 py-8 text-sm text-slate-500">
                  No demo profiles are available yet.
                </p>
              ) : (
                <div className="border-t border-slate-200">
                  {demoAccounts.map((customer) => (
                    <CustomerProfile
                      customer={customer}
                      key={customer.repId}
                      profileType="demo"
                    />
                  ))}
                </div>
              )}
            </details>
          </div>
        </div>
      </div>
    </main>
  )
}
