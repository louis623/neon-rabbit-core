import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="prelaunch-page">
      <section className="prelaunch-section min-h-screen">
        <div className="prelaunch-shell">
          <div className="prelaunch-card max-w-3xl p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
              Sparkle Suite
            </p>
            <h1 className="prelaunch-display mt-4 text-5xl leading-tight text-[var(--prelaunch-plum-ink)]">
              This page is not available yet.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--prelaunch-muted)]">
              Sparkle Suite is still in prelaunch, so the public site is keeping
              the path simple for now.
            </p>
            <Link className="prelaunch-button mt-8" href="/prelaunch">
              Back to Sparkle Suite
            </Link>
            <nav
              className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--prelaunch-muted)]"
              aria-label="Public pages"
            >
              <Link className="prelaunch-link" href="/privacy-policy">
                Privacy Policy
              </Link>
              <Link className="prelaunch-link" href="/terms-and-conditions">
                Terms and Conditions
              </Link>
              <Link className="prelaunch-link" href="/prelaunch#waitlist">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </section>
    </main>
  )
}
