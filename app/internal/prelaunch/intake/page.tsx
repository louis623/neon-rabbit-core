import { redirect } from 'next/navigation'

import {
  normalizePrelaunchIntakeReviewLane,
  PrelaunchIntakeReviewPageContent,
} from './_components/PrelaunchIntakeReviewPageContent'
import { loadPrelaunchIntakeReviewSubmissions } from '@/lib/prelaunch/intake-review-query'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface InternalPrelaunchIntakePageProps {
  searchParams?: Promise<{ lane?: string | string[] }>
}

export default async function InternalPrelaunchIntakePage({
  searchParams,
}: InternalPrelaunchIntakePageProps) {
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
            <h1 className="text-2xl font-semibold">Operator access required</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This Sparkle Suite intake review page is limited to internal
              operators.
            </p>
          </section>
        </main>
      )
    }

    throw error
  }

  const query = searchParams ? await searchParams : {}
  const activeLane = normalizePrelaunchIntakeReviewLane(query.lane)
  const submissions = await loadPrelaunchIntakeReviewSubmissions()
  return (
    <PrelaunchIntakeReviewPageContent
      activeLane={activeLane}
      submissions={submissions}
    />
  )
}
