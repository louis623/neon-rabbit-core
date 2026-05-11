import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchHero() {
  return (
    <section className="prelaunch-shell min-h-[92vh] py-6 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <a className="flex items-center gap-3" href="#top" aria-label="Sparkle Suite">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--prelaunch-soft-gold)] bg-white text-[var(--prelaunch-plum-ink)] shadow-sm">
            <span className="prelaunch-display text-2xl">S</span>
          </span>
          <span className="font-semibold tracking-[0.08em] text-[0.76rem] uppercase text-[var(--prelaunch-plum-ink)]">
            {prelaunchContent.brandName}
          </span>
        </a>
        <nav className="flex items-center gap-5 text-sm font-medium text-[var(--prelaunch-muted)]">
          <a className="hidden sm:inline hover:text-[var(--prelaunch-plum-ink)]" href="#video">
            What it is
          </a>
          <a className="hidden sm:inline hover:text-[var(--prelaunch-plum-ink)]" href="/login">
            Log in
          </a>
          <a className="prelaunch-button min-h-10 px-4 text-sm" href="#waitlist">
            Join the Waitlist
          </a>
        </nav>
      </header>

      <div className="grid min-h-[calc(92vh-76px)] items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-2xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--prelaunch-plum-ink)]">
            {prelaunchContent.eyebrow}
          </p>
          <h1 className="prelaunch-display text-5xl leading-[0.98] text-[var(--prelaunch-plum-ink)] sm:text-6xl lg:text-7xl">
            {prelaunchContent.headline}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--prelaunch-muted)]">
            {prelaunchContent.body}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="prelaunch-button" href="#waitlist">
              Join the Waitlist
            </a>
            <a className="prelaunch-button prelaunch-button-secondary" href="#video">
              What Is Sparkle Suite?
            </a>
          </div>
        </div>

        <div className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-white bg-white p-6 shadow-[0_24px_80px_rgba(90,52,92,0.16)]">
          <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-[var(--prelaunch-lilac-glow)] blur-3xl" />
          <div className="relative grid h-full min-h-[408px] content-between rounded-[20px] border border-[var(--prelaunch-border)] bg-[linear-gradient(145deg,#fff,#fff4f8)] p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
                Inside the suite
              </p>
              <h2 className="prelaunch-display mt-4 text-4xl leading-tight text-[var(--prelaunch-plum-ink)]">
                Customer-facing polish with practical rep support behind it.
              </h2>
            </div>
            <div className="space-y-3">
              {['Trade board', 'Live queue', 'Live event calendar', 'Email updates', 'SMS updates', 'Nic-Nac'].map(
                (item) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-[var(--prelaunch-border)] bg-white/78 px-4 py-3 text-sm font-semibold text-[var(--prelaunch-ink)]"
                    key={item}
                  >
                    <span>{item}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--prelaunch-soft-gold)]" />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
