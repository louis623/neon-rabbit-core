import { redirect } from 'next/navigation'

import { CostCapacityPage } from './_components/CostCapacityPage'
import { getNicNacCostCapacity } from '@/lib/remy-communications/nic-nac-cost-capacity'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function NicNacCostCapacityPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) redirect('/control-center/login')
    if (error instanceof OperatorAuthError) {
      return (
        <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">Owner access required</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Cost &amp; Capacity includes internal spend data and is limited to the owner.</p>
          </section>
        </main>
      )
    }
    throw error
  }

  const { month } = await searchParams
  const snapshot = await getNicNacCostCapacity(createAdminClient(), month)
  return <CostCapacityPage snapshot={snapshot} />
}
