import { redirect } from 'next/navigation'

import { SparkleLabPage } from '@/app/control-center/lab/_components/SparkleLabPage'
import { readSparkleLabControlCenterModel } from '@/lib/sparkle-lab/read-model'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SparkleLabControlCenterPage() {
  try {
    await getAuthenticatedOperator()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?redirect=%2Fcontrol-center%2Flab')
    }

    if (error instanceof OperatorAuthError) {
      return (
        <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
          <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">
              Operator access required
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sparkle Lab is limited to internal operators.
            </p>
          </section>
        </main>
      )
    }

    throw error
  }

  const model = await readSparkleLabControlCenterModel(createAdminClient())

  return <SparkleLabPage model={model} />
}
