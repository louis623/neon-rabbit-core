import Link from 'next/link'

export default function PrelaunchPaymentCancelledPage() {
  return (
    <main className="prelaunch-page">
      <section className="prelaunch-section">
        <div className="prelaunch-shell">
          <Link className="prelaunch-link text-sm font-semibold" href="/prelaunch">
            Sparkle Suite
          </Link>
          <div className="mt-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--prelaunch-muted)]">
              Checkout cancelled
            </p>
            <h1 className="prelaunch-display mt-3 text-5xl leading-tight text-[var(--prelaunch-plum-ink)]">
              No payment was recorded.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--prelaunch-muted)]">
              You can return to your Sparkle Suite contact thread when you are
              ready to continue.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
