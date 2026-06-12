import { redirect } from 'next/navigation'

import {
  SupportCommandCenter,
  type SupportReportRecord,
} from '@/app/control-center/_components/SupportCommandCenter'
import { listOperatorSupportReports } from '@/lib/services/support-reports'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SparkleSuiteControlCenterPage() {
  try {
    await getAuthenticatedOperator()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login')
    }

    if (error instanceof OperatorAuthError) {
      return (
        <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">
              Operator access required
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The Sparkle Suite Control Center is limited to internal
              operators.
            </p>
          </section>
        </main>
      )
    }

    throw error
  }

  const reports = await listOperatorSupportReports(createAdminClient(), {
    limit: 50,
  })

  return (
    <SupportCommandCenter reports={reports as unknown as SupportReportRecord[]} />
  )
}
