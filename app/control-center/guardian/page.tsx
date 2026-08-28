import { redirect } from 'next/navigation'

import { GuardianPage } from '@/app/control-center/guardian/_components/GuardianPage'
import { getControlCenterNicNacUsage } from '@/lib/remy-communications/nic-nac-usage'
import { getControlCenterOperatorHealth } from '@/lib/remy-communications/operator-health'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ControlCenterGuardianPage() {
  try {
    await getControlCenterAccess()
  } catch (error) {
    if (error instanceof AuthError) redirect('/control-center/login')
    if (error instanceof OperatorAuthError) {
      return (
        <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">Operator access required</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Guardian is limited to internal operators.
            </p>
          </section>
        </main>
      )
    }
    throw error
  }

  const admin = createAdminClient()
  const [health, usage] = await Promise.all([
    getControlCenterOperatorHealth(admin),
    getControlCenterNicNacUsage(admin),
  ])

  return <GuardianPage health={health} usage={usage} />
}
