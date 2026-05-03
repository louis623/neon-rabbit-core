import type { AmethystSiteContent, AmethystStreamLink } from '@/lib/amethyst/site-content'

import { AmethystSiteShell, platformClass, tierChipClass } from '@/components/amethyst/site-shell'

function streamButton(link: AmethystStreamLink, variant: 'solid' | 'glass' = 'solid') {
  const baseClass =
    variant === 'solid'
      ? 'inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--amethyst-fg)] transition hover:-translate-y-0.5'
      : 'inline-flex items-center gap-3 rounded-full border border-white/35 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-[var(--amethyst-fg)]'

  return (
    <a
      className={baseClass}
      href={link.href}
      rel={link.href.startsWith('http') ? 'noreferrer noopener' : undefined}
      target={link.href.startsWith('http') ? '_blank' : undefined}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white ${platformClass(link.platform)}`}>
        {link.label.slice(0, 2).toUpperCase()}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span>{link.label}</span>
        <span className={variant === 'solid' ? 'text-xs font-normal text-[var(--amethyst-fg-muted)]' : 'text-xs font-normal text-white/60'}>
          {link.handle}
        </span>
      </span>
    </a>
  )
}

function LiveQueueSection({ content }: { content: AmethystSiteContent }) {
  if (content.liveQueueState === 'offline') {
    return (
      <section className="border-b border-[var(--amethyst-border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-fg-muted)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--amethyst-fg-muted)]" />
            {content.liveQueueLabel}
          </div>
          <p className="text-sm text-[var(--amethyst-fg-muted)]">
            Show ended — check the trade board and come back for the next reveal.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-[var(--amethyst-border)] bg-white" id="watch-live">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-fg)]">
            <span className="amethyst-live-dot h-2.5 w-2.5 rounded-full bg-[#ff3366]" />
            {content.liveQueueLabel}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--amethyst-fg-muted)]">
            {content.liveQueueSummary}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {content.liveQueueEntries.map((entry) => (
            <div
              key={`${entry.position}-${entry.customerName}`}
              className="inline-flex items-center gap-3 rounded-full border border-[var(--amethyst-border)] bg-[var(--amethyst-bg)] px-3 py-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--amethyst-primary)] text-xs font-semibold text-white">
                {entry.position}
              </span>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
                  {entry.label}
                </div>
                <div className="text-sm font-semibold text-[var(--amethyst-fg)]">
                  {entry.customerName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeroSection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="relative overflow-hidden">
      <div className="amethyst-hero-media absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:py-28">
        <div className="max-w-3xl text-white">
          <div className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            <span className="h-px w-8 bg-white/50" />
            {content.heroEyebrow}
          </div>
          <h1 className="font-[family-name:var(--font-amethyst-display)] text-[clamp(3.4rem,7vw,6.5rem)] leading-[0.96] tracking-[-0.03em] text-balance">
            {content.heroHeadline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
            {content.heroSub}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--amethyst-fg)] transition hover:-translate-y-0.5"
              href="#trade-board"
            >
              Browse the trade board
            </a>
            {streamButton(content.streamLinks[0], 'glass')}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/12 bg-white/8 p-5 text-white shadow-[0_24px_60px_rgba(8,4,18,0.28)] backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/62">
            <span className="amethyst-live-dot h-2.5 w-2.5 rounded-full bg-[#ff3366]" />
            Watch live or shop now
          </div>
          <div className="space-y-3">
            {content.streamLinks.map((link) => (
              <div key={link.label}>{streamButton(link, 'solid')}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TradeBoardSection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="px-6 py-24" id="trade-board">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-primary)]">
            <span className="h-px w-6 bg-[var(--amethyst-primary)]" />
            Featured Trade Board
          </div>
          <h2 className="mt-4 max-w-4xl font-[family-name:var(--font-amethyst-display)] text-[clamp(2.4rem,4vw,3.5rem)] leading-[1.02] tracking-[-0.03em] text-balance">
            A fast preview of what customers can trade for right now.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--amethyst-fg-muted)]">
            Each card shows the collection, tier, MSRP, and current status. Customers can scan the board, find something they love, then jump into the next live reveal with context.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {content.tradeBoardListings.map((listing) => (
            <article
              className="overflow-hidden rounded-[1.15rem] border border-[var(--amethyst-border)] bg-[var(--amethyst-bg-elevated)] shadow-[0_20px_40px_rgba(42,31,64,0.08)] transition hover:-translate-y-1.5 hover:shadow-[0_28px_56px_rgba(42,31,64,0.16)]"
              id={`trade-${listing.id}`}
              key={listing.id}
            >
              <div className="relative aspect-square bg-[linear-gradient(135deg,var(--amethyst-bg-deep),var(--amethyst-bg-elevated))]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_45%),radial-gradient(circle_at_75%_75%,rgba(72,13,223,0.18),transparent_55%)]" />
                <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tierChipClass(listing.tier)}`}>
                  <span className="h-2 w-2 rounded-full bg-current/75" />
                  {listing.tier}
                </span>
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    listing.statusLabel === 'Available'
                      ? 'bg-black/60 text-white'
                      : listing.statusLabel === 'Reserved'
                        ? 'bg-[#f5d670] text-[var(--amethyst-fg)]'
                        : 'bg-zinc-500/70 text-white'
                  }`}
                >
                  {listing.statusLabel}
                </span>
                <div className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-amethyst-display)] text-5xl tracking-[0.2em] text-[color-mix(in_oklab,var(--amethyst-primary)_32%,var(--amethyst-fg-muted))] opacity-60">
                  {listing.title.slice(0, 1)}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--amethyst-primary)]">
                    {listing.collection}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-amethyst-display)] text-2xl leading-tight tracking-[-0.02em]">
                    {listing.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--amethyst-fg-muted)]">
                    {listing.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--amethyst-border)] pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--amethyst-fg-muted)]">
                    MSRP <span className="ml-2 text-base normal-case tracking-normal text-[var(--amethyst-fg)]">{listing.msrpLabel}</span>
                  </div>
                  <a className="text-sm font-semibold text-[var(--amethyst-primary)]" href={listing.href ?? `#trade-${listing.id}`}>
                    View piece →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function EventsSection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="bg-[var(--amethyst-bg-elevated)] px-6 py-24" id="events">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-primary)]">
          <span className="h-px w-6 bg-[var(--amethyst-primary)]" />
          Upcoming Shows
          <span className="h-px w-6 bg-[var(--amethyst-primary)]" />
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-amethyst-display)] text-[clamp(2.2rem,4vw,3.3rem)] leading-[1.03] tracking-[-0.03em] text-balance">
          Mark your calendar. The next two reveals.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[var(--amethyst-fg-muted)]">
          Times are written for the customer-facing site, discount codes are front and center, and each show keeps its featured collections easy to scan before people join live.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
        {content.events.map((event) => (
          <article
            className={`relative rounded-[1.15rem] border p-5 text-left ${
              event.featured
                ? 'border-[var(--amethyst-primary)] bg-[linear-gradient(180deg,var(--amethyst-bg-elevated),var(--amethyst-bg-deep))]'
                : 'border-[var(--amethyst-border)] bg-[var(--amethyst-bg)]'
            }`}
            key={event.id}
          >
            {event.featured ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-[var(--amethyst-primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                <span className="amethyst-live-dot h-1.5 w-1.5 rounded-full bg-white" />
                Featured
              </span>
            ) : null}

            <h3 className="pr-24 font-[family-name:var(--font-amethyst-display)] text-2xl leading-tight tracking-[-0.02em]">
              {event.title}
            </h3>
            <div className="mt-4 space-y-2 text-sm font-medium text-[var(--amethyst-fg-muted)]">
              <p>{event.dateLabel}</p>
              <p>{event.timeLabel}</p>
            </div>

            <div className="mt-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
                Discounts
              </div>
              <div className="mt-3 space-y-3">
                {event.discounts.map((discount) => (
                  <div
                    className="rounded-2xl border border-dashed border-[var(--amethyst-accent)] bg-white/60 px-4 py-3"
                    key={discount.code}
                  >
                    <div className="font-mono text-sm font-semibold tracking-[0.12em] text-[var(--amethyst-accent)]">
                      {discount.code}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--amethyst-fg-muted)]">
                      {discount.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
                Featured Collections
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {event.featuredCollections.map((collection) => (
                  <a
                    className="rounded-full border border-[var(--amethyst-border)] bg-white px-3 py-1.5 text-sm text-[var(--amethyst-fg)] transition hover:border-[var(--amethyst-primary)] hover:text-[var(--amethyst-primary)]"
                    href="#trade-board"
                    key={collection}
                  >
                    {collection}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {event.platforms.map((platform) => (
                <a
                  className="inline-flex items-center gap-3 rounded-xl bg-[var(--amethyst-fg)] px-4 py-3 text-sm font-medium text-[var(--amethyst-bg)] transition hover:bg-[var(--amethyst-accent)]"
                  href={platform.href}
                  key={`${event.id}-${platform.label}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold text-white ${platformClass(platform.platform)}`}>
                    {platform.label.slice(0, 2).toUpperCase()}
                  </span>
                  {platform.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function BombPartySection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="px-6 py-24" id="bomb-party">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.15rem] border border-[var(--amethyst-border)] bg-[var(--amethyst-bg-elevated)] p-9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--amethyst-primary)]">
            First time here?
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-amethyst-display)] text-[clamp(2.2rem,3.4vw,3rem)] leading-[1.08] tracking-[-0.03em]">
            {content.whatIsBombPartyTitle}
          </h2>
          <p className="mt-4 text-base leading-8 text-[var(--amethyst-fg-muted)]">
            {content.whatIsBombPartyBody}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard label="Order" number="1" description="Pick a box, claim a spot, and get ready for the reveal." />
            <StepCard label="Watch Live" number="2" description="Join the stream and see what opens in real time." />
            <StepCard label="Receive" number="3" description="Your jewelry ships to your door after the show." />
          </div>
        </article>

        <div className="relative isolate flex min-h-[420px] items-end overflow-hidden rounded-[1.15rem] border border-[var(--amethyst-border)] bg-[linear-gradient(180deg,#0e0820_0%,#1a1034_100%)] p-6 text-white shadow-[0_24px_60px_rgba(14,8,32,0.24)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(210,9,227,0.38),transparent_55%),radial-gradient(ellipse_at_70%_70%,rgba(72,13,223,0.4),transparent_55%)]" />
          <div className="relative z-10 flex w-full flex-col items-center justify-center gap-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/92 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25f4ee]" />
              Showcase video
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl text-[var(--amethyst-fg)]">
              ▶
            </div>
            <p className="max-w-xs text-sm leading-6 text-white/72">
              Swap in a rep clip, a live reveal highlight, or a short Bomb Party explainer reel here.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({
  number,
  label,
  description,
}: {
  number: string
  label: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-[var(--amethyst-border)] bg-[var(--amethyst-bg)] p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amethyst-primary)] text-sm font-semibold text-white">
        {number}
      </div>
      <div className="mt-3 text-sm font-semibold text-[var(--amethyst-fg)]">{label}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--amethyst-fg-muted)]">{description}</div>
    </div>
  )
}

function SignupSection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="bg-[var(--amethyst-bg-elevated)] px-6 py-24" id="signup">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.4rem] border border-[var(--amethyst-border)] bg-[var(--amethyst-bg)] p-8 shadow-[0_28px_60px_rgba(42,31,64,0.08)] md:p-12">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--amethyst-primary)]">
            {content.signupEyebrow}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-amethyst-display)] text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]">
            {content.signupTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[var(--amethyst-fg-muted)]">
            {content.signupSub}
          </p>
        </div>

        <form className="mt-10 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
                Email
              </span>
              <input
                className="w-full rounded-xl border border-[var(--amethyst-border)] bg-white px-4 py-3 text-[15px] text-[var(--amethyst-fg)] outline-none transition focus:border-[var(--amethyst-primary)] focus:shadow-[0_0_0_3px_rgba(210,9,227,0.12)]"
                placeholder="you@example.com"
                type="email"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
                Phone <span className="normal-case tracking-normal text-[var(--amethyst-fg-muted)]/70">(optional)</span>
              </span>
              <input
                className="w-full rounded-xl border border-[var(--amethyst-border)] bg-white px-4 py-3 text-[15px] text-[var(--amethyst-fg)] outline-none transition focus:border-[var(--amethyst-primary)] focus:shadow-[0_0_0_3px_rgba(210,9,227,0.12)]"
                placeholder="(555) 555-5555"
                type="tel"
              />
            </label>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[var(--amethyst-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--amethyst-accent)]"
              type="button"
            >
              Sign me up
            </button>
            <p className="max-w-2xl text-center text-xs leading-6 text-[var(--amethyst-fg-muted)]">
              {content.signupConsent}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

function JoinTeamSection({ content }: { content: AmethystSiteContent }) {
  return (
    <section className="relative overflow-hidden bg-[var(--amethyst-fg)] px-6 py-24 text-center text-white" id="join-team">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(210,9,227,0.22),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(72,13,223,0.24),transparent_42%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
          {content.joinTeamEyebrow} · {content.teamName}
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-amethyst-display)] text-[clamp(2.5rem,4vw,3.8rem)] leading-[1.04] tracking-[-0.03em]">
          {content.joinTeamTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/72">
          {content.joinTeamSub}
        </p>
        <a
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[var(--amethyst-fg)] transition hover:-translate-y-0.5"
          href={content.joinTeamUrl}
          rel={content.joinTeamUrl.startsWith('http') ? 'noreferrer noopener' : undefined}
          target={content.joinTeamUrl.startsWith('http') ? '_blank' : undefined}
        >
          See what&apos;s in it for you
        </a>
      </div>
    </section>
  )
}

export function AmethystHomepage({
  content,
}: {
  content: AmethystSiteContent
}) {
  return (
    <AmethystSiteShell content={content}>
      <LiveQueueSection content={content} />
      <HeroSection content={content} />
      <TradeBoardSection content={content} />
      <EventsSection content={content} />
      <BombPartySection content={content} />
      <SignupSection content={content} />
      <JoinTeamSection content={content} />
    </AmethystSiteShell>
  )
}
