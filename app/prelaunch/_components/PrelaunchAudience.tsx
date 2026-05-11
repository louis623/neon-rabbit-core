import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchAudience() {
  return (
    <section className="bg-[var(--prelaunch-pearl-blush)] px-6 py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[color:rgba(90,52,92,0.12)] bg-white/80 p-8 backdrop-blur">
        <h2 className="font-amethyst-display text-3xl text-[var(--prelaunch-plum-ink)] sm:text-4xl">
          {prelaunchContent.audienceHeading}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:rgba(90,52,92,0.82)]">
          {prelaunchContent.audienceBody}
        </p>
        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {prelaunchContent.audiences.map((audience) => (
            <li
              key={audience.id}
              className="rounded-[1.25rem] bg-[var(--prelaunch-pearl-blush)] px-5 py-4 font-medium text-[var(--prelaunch-plum-ink)]"
            >
              {audience.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
