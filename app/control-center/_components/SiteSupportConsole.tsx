import { OperatorSupportAccessPanel } from './OperatorSupportAccessPanel'

export type SiteSupportCustomer = {
  id: string
  displayName: string
  businessName: string
  email: string
  publicSiteSlug: string | null
  customDomain: string | null
}

export function SiteSupportConsole({ customers }: { customers: SiteSupportCustomer[] }) {
  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Sparkle Suite</p>
          <h1 className="mt-1 text-2xl font-semibold">Customer-site support</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This operator account can open disclosed support sessions for customer-site work only.
            Billing, account administration, communications, customer records, and product operations remain unavailable.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          {customers.map((customer) => (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={customer.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer site</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{customer.displayName}</h2>
              <p className="mt-1 text-sm text-slate-600">{customer.businessName}</p>
              <OperatorSupportAccessPanel
                customDomain={customer.customDomain}
                publicSiteSlug={customer.publicSiteSlug}
                repDisplayName={customer.displayName}
                repEmail={customer.email}
                targetRepId={customer.id}
              />
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
