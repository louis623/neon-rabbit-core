import { legalFooterLinks } from '@/lib/prelaunch/legal-content'

export function PrelaunchFooter() {
  return (
    <footer className="bg-[var(--prelaunch-plum-ink)] py-14 text-white">
      <div className="prelaunch-shell flex flex-col gap-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="prelaunch-display text-4xl">We&apos;re building this carefully.</h2>
            <p className="mt-3 max-w-xl leading-7 text-white/76">
              Join the list and we&apos;ll let you know when Sparkle Suite is ready.
              No countdowns. No fake urgency.
            </p>
          </div>
          <a className="prelaunch-button border-white bg-white text-[var(--prelaunch-plum-ink)]" href="#waitlist">
            Join the Waitlist
          </a>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/16 pt-6 text-sm text-white/68 sm:flex-row sm:items-center sm:justify-between">
          <p>Sparkle Suite is developed by Neon Rabbit Digital Services in Jacksonville, FL.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Legal pages">
            <a
              className="underline underline-offset-4 hover:text-white"
              href="mailto:louis@neonrabbit.net"
            >
              Contact
            </a>
            {legalFooterLinks.map((link) => (
              <a className="underline underline-offset-4 hover:text-white" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
