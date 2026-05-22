export default function PrelaunchPaymentSuccessPage() {
  return (
    <main className="prelaunch-page">
      <section className="prelaunch-section">
        <div className="prelaunch-shell">
          <a className="prelaunch-link text-sm font-semibold" href="/prelaunch">
            Sparkle Suite
          </a>
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
          </div>
        </div>
      </section>
    </main>
  )
}
