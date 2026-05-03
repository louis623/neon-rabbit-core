import type { ReactNode } from 'react'

import type {
  AmethystNavLink,
  AmethystSiteContent,
  AmethystTier,
} from '@/lib/amethyst/site-content'

function repeatItems<T>(items: T[], copies = 3): T[] {
  return Array.from({ length: copies }, () => items).flat()
}

function tierChipClass(tier: AmethystTier) {
  if (tier === 'unicorn') {
    return 'bg-[linear-gradient(135deg,var(--amethyst-primary),var(--amethyst-accent),#ffd86b)] text-white shadow-[0_0_20px_rgba(210,9,227,0.25)]'
  }

  if (tier === 'diamond') {
    return 'bg-[linear-gradient(135deg,#dceeff,#b0e0ff)] text-[#234464]'
  }

  return 'bg-white/85 text-[var(--amethyst-fg)]'
}

function platformClass(platform: string) {
  if (platform === 'tiktok') {
    return 'bg-[linear-gradient(135deg,#25f4ee,#fe2c55)]'
  }

  if (platform === 'facebook') {
    return 'bg-[#1877f2]'
  }

  return 'bg-[linear-gradient(135deg,var(--amethyst-primary),var(--amethyst-accent))]'
}

function renderLink(
  key: string,
  link: { href: string; external?: boolean },
  children: ReactNode,
  className: string,
) {
  if (link.external) {
    return (
      <a
        className={className}
        href={link.href}
        key={key}
        rel="noreferrer noopener"
        target="_blank"
      >
        {children}
      </a>
    )
  }

  return (
    <a className={className} href={link.href} key={key}>
      {children}
    </a>
  )
}

function HeaderNav({ links }: { links: AmethystNavLink[] }) {
  return (
    <nav className="flex flex-wrap items-center justify-end gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 md:gap-8">
      {links.map((link) =>
        renderLink(
          link.label,
          link,
          <>
            {link.label}
            {link.external ? <span aria-hidden="true"> ↗</span> : null}
          </>,
          'transition hover:text-white',
        ),
      )}
    </nav>
  )
}

function AmethystTicker({ content }: { content: AmethystSiteContent }) {
  const announcementItems = repeatItems(content.announcementItems)
  const tradeItems = repeatItems(content.tradeBoardListings)

  return (
    <div className="border-b border-[var(--amethyst-border)] bg-white">
      <div className="relative flex h-10 items-center overflow-hidden border-b border-[var(--amethyst-border)]">
        <div className="absolute inset-y-0 left-0 z-10 flex min-w-40 items-center bg-[linear-gradient(90deg,white_0%,white_75%,transparent_100%)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-fg-muted)]">
          Announcements
        </div>
        <div
          className="amethyst-ticker-track pl-44"
          style={{ animation: 'amethyst-scroll 44s linear infinite' }}
        >
          {announcementItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[var(--amethyst-fg)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amethyst-primary)]" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="relative flex h-11 items-center overflow-hidden bg-[var(--amethyst-header-bg)] text-white">
        <div className="absolute inset-y-0 left-0 z-10 flex min-w-40 items-center bg-[linear-gradient(90deg,var(--amethyst-header-bg)_0%,var(--amethyst-header-bg)_75%,transparent_100%)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Trade Board
        </div>
        <div
          className="amethyst-ticker-track pl-44"
          style={{ animation: 'amethyst-scroll 54s linear infinite reverse' }}
        >
          {tradeItems.map((listing, index) => {
            const href = listing.href ?? `#trade-${listing.id}`

            return (
              <a
                key={`${listing.id}-${index}`}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm font-medium transition hover:border-[var(--amethyst-primary)] hover:bg-[var(--amethyst-primary)] hover:text-white"
                href={href}
              >
                <span className={`h-2.5 w-2.5 rotate-45 rounded-[2px] ${tierChipClass(listing.tier)}`} />
                <span className="whitespace-nowrap">
                  {listing.title} · {listing.msrpLabel}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AmethystSiteShell({
  content,
  children,
}: {
  content: AmethystSiteContent
  children: ReactNode
}) {
  const year = new Date().getFullYear()

  return (
    <div
      className="min-h-screen bg-[var(--amethyst-bg)] text-[var(--amethyst-fg)]"
      id="top"
    >
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[var(--amethyst-header-bg)] text-white shadow-[0_10px_30px_rgba(12,6,26,0.28)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <a className="flex items-center gap-3 self-start" href="#top">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[linear-gradient(135deg,var(--amethyst-primary),var(--amethyst-accent))] shadow-[0_6px_20px_rgba(210,9,227,0.25)]">
              <span className="h-3 w-3 rotate-45 rounded-[2px] border border-white/45" />
            </span>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-amethyst-display)] text-xl font-semibold tracking-[-0.02em] text-white">
                {content.businessName}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Live jewelry reveals
              </span>
            </div>
          </a>
          <HeaderNav links={content.navLinks} />
        </div>
        <AmethystTicker content={content} />
      </header>

      <main>{children}</main>

      <footer className="bg-[var(--amethyst-header-bg)] px-6 pb-8 pt-16 text-white/72">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))]">
          <div>
            <div className="font-[family-name:var(--font-amethyst-display)] text-2xl font-semibold tracking-[-0.02em] text-white">
              {content.businessName}
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/68">
              {content.footerTagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {content.socialLinks.map((link) => (
                <a
                  key={link.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-white transition hover:bg-white hover:text-[var(--amethyst-header-bg)]"
                  href={link.href}
                >
                  {link.shortLabel}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={content.footerShopLinks} />
          <FooterColumn title="About" links={content.footerAboutLinks} />
          <FooterColumn title={content.footerColumn.title} links={content.footerColumn.links} />
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs leading-6 text-white/48">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© {year} {content.businessName} · Powered by Sparkle Suite</p>
            <div className="flex flex-wrap gap-4">
              <a href="#signup">Privacy</a>
              <a href="#signup">Terms</a>
              <a href="#signup">Accessibility</a>
            </div>
          </div>
          <p className="mt-3 max-w-5xl">{content.legalDisclaimer}</p>
        </div>
      </footer>
    </div>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string; external?: boolean }>
}) {
  return (
    <div>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
        {title}
      </h2>
      <ul className="space-y-3 text-sm">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {renderLink(
              `${title}-${link.label}`,
              link,
              <>
                {link.label}
                {link.external ? <span aria-hidden="true"> ↗</span> : null}
              </>,
              'transition hover:text-white',
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { platformClass, tierChipClass }
