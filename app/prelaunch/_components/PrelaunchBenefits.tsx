import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchBenefits() {
  return (
    <section className="prelaunch-section">
      <div className="prelaunch-shell">
        <div className="max-w-2xl">
          <h2 className="prelaunch-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
            What Sparkle Suite is being built to help with
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--prelaunch-muted)]">
            The core pieces stay distinct, practical, and tied to the customer
            experience reps are trying to create.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {prelaunchContent.benefits.map((benefit) => (
            <article className="prelaunch-card p-6" key={benefit.title}>
              <h3 className="text-xl font-semibold text-[var(--prelaunch-plum-ink)]">
                {benefit.title}
              </h3>
              <p className="mt-3 leading-7 text-[var(--prelaunch-muted)]">
                {benefit.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
