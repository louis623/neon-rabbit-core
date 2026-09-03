import { redirect } from 'next/navigation'

import { AccountingDashboard } from '@/app/control-center/_components/AccountingDashboard'
import { AuthError, getControlCenterAccess, OperatorAuthError } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ControlCenterAccountingPage({ searchParams }: { searchParams?: Promise<{ product?: string | string[] }> } = {}) {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) redirect('/control-center/login')
    if (error instanceof OperatorAuthError) return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950"><section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-semibold">Operator access required</h1><p className="mt-3 text-sm leading-6 text-slate-600">Accounting is limited to internal owners.</p></section></main>
    throw error
  }
  const product = (await searchParams)?.product === 'finder' ? 'finder' : 'suite'
  return <AccountingDashboard product={product} />
}
