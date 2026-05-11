import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchBenefits() {
  return (
    <section className="bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_100%)] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-amethyst-display text-3xl text-[var(--prelaunch-plum-ink)] sm:text-4xl">
          {prelaunchContent.benefitsHeading}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {prelaunchContent.benefits.map((benefit) => (
            <article
              key={benefit.id}
              className="rounded-[1.5rem] border border-[color:rgba(90,52,92,0.14)] bg-white p-6 shadow-[0_20px_60px_rgba(90,52,92,0.06)]"
            >
              <p className="text-lg font-semibold text-[var(--prelaunch-plum-ink)]">
                {benefit.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
