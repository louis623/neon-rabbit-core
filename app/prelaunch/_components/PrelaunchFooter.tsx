import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchFooter() {
  return (
    <footer className="bg-[var(--prelaunch-plum-ink)] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-4">
        <p className="text-sm font-semibold tracking-[0.28em] uppercase text-[var(--prelaunch-soft-gold)]">
          {prelaunchContent.footerNote}
        </p>
        <h2 className="font-amethyst-display text-3xl sm:text-4xl">
          {prelaunchContent.footerHeadline}
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[color:rgba(255,255,255,0.84)]">
          {prelaunchContent.footerBody}
        </p>
      </div>
    </footer>
  )
}
