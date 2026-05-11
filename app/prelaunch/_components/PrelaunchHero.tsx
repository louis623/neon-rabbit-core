import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchHero() {
  return (
    <section className="bg-[var(--prelaunch-pearl-blush)] px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <p className="font-semibold tracking-[0.28em] text-[var(--prelaunch-plum-ink)] uppercase">
          {prelaunchContent.brand}
        </p>
        <p className="text-sm font-medium tracking-[0.24em] text-[var(--prelaunch-plum-ink)] uppercase">
          {prelaunchContent.eyebrow}
        </p>
        <h1 className="max-w-3xl font-amethyst-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
          {prelaunchContent.headline}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-[color:rgba(90,52,92,0.86)]">
          {prelaunchContent.body}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            className="rounded-full bg-[var(--prelaunch-plum-ink)] px-6 py-3 text-center font-semibold text-white"
            href="#waitlist"
          >
            {prelaunchContent.primaryCtaLabel}
          </a>
          <a
            className="rounded-full border border-[color:rgba(90,52,92,0.22)] bg-white px-6 py-3 text-center font-semibold text-[var(--prelaunch-plum-ink)]"
            href="#video"
          >
            {prelaunchContent.secondaryCtaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
