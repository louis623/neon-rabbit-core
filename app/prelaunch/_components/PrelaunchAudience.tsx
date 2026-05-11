import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchAudience() {
  return (
    <section className="prelaunch-section bg-white">
      <div className="prelaunch-shell grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <h2 className="prelaunch-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
          Who it&apos;s for
        </h2>
        <div>
          <p className="text-2xl leading-10 text-[var(--prelaunch-ink)]">
            {prelaunchContent.audience}
          </p>
          <p className="mt-5 leading-8 text-[var(--prelaunch-muted)]">
            If customers are bouncing between posts, messages, reminders, and
            unclear next steps, Sparkle Suite is being built for the version of
            your business that feels easier to follow.
          </p>
        </div>
      </div>
    </section>
  )
}
