import Link from 'next/link'
import { syncPrelaunchPaymentGateFromCheckoutSession } from '@/lib/prelaunch/payment-gate-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PrelaunchPaymentSuccessPageProps {
  searchParams?: Promise<{
    session_id?: string | string[]
  }>
}

function readSessionId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PrelaunchPaymentSuccessPage({
  searchParams,
}: PrelaunchPaymentSuccessPageProps) {
  const query = searchParams ? await searchParams : {}
  const sessionId = readSessionId(query.session_id)
  const syncResult = sessionId
    ? await syncPrelaunchPaymentGateFromCheckoutSession(sessionId).catch(
        (error) => {
          console.error('[prelaunch/payment/success] Sync failed:', error)
          return null
        },
      )
    : null

  return (
    <main className="prelaunch-page">
      <section className="prelaunch-section">
        <div className="prelaunch-shell">
          <Link className="prelaunch-link text-sm font-semibold" href="/prelaunch">
            Sparkle Suite
          </Link>
          <div className="mt-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--prelaunch-muted)]">
              Payment received
            </p>
            <h1 className="prelaunch-display mt-3 text-5xl leading-tight text-[var(--prelaunch-plum-ink)]">
              You are in the build lane.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--prelaunch-muted)]">
              Your Sparkle Suite checkout is complete. We will confirm the
              agreement, build checks, and launch handoff before your account
              goes live.
            </p>
            <p className="mt-4 text-sm font-semibold text-[var(--prelaunch-muted)]">
              {syncResult?.ok
                ? 'Payment gate confirmed.'
                : 'Payment is processing. We will confirm it before build work continues.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
