import { redirect } from 'next/navigation'

import {
  SupportCommandCenter,
  type OperatorCustomerRecord,
  type SupportReportRecord,
} from '@/app/control-center/_components/SupportCommandCenter'
import { listOperatorCustomerProfiles } from '@/lib/services/client-account-profiles'
import { listOperatorSupportReports } from '@/lib/services/support-reports'
import { loadCustomerWaitlist } from '@/lib/prelaunch/customer-waitlist'
import { loadBugHuntItems } from '@/lib/control-center/bug-hunt'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SparkleSuiteControlCenterPage() {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/control-center/login')
    }

    if (error instanceof OperatorAuthError) {
      return (
        <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">Operator access required</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The Sparkle Suite Control Center is limited to internal operators.
            </p>
          </section>
        </main>
      )
    }

    throw error
  }

  const admin = createAdminClient()
  const [reports, customers, waitlist, bugHuntItems] = await Promise.all([
    listOperatorSupportReports(admin, {
      limit: 50,
    }),
    listOperatorCustomerProfiles(admin, {
      limit: 200,
    }),
    loadCustomerWaitlist(admin),
    loadBugHuntItems(admin),
  ])

  return (
    <SupportCommandCenter
      customers={customers as unknown as OperatorCustomerRecord[]}
      reports={reports as unknown as SupportReportRecord[]}
      waitlist={waitlist}
      bugHuntItems={bugHuntItems}
    />
  )
}
