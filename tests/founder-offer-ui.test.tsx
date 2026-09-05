import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  FounderAvailabilityProvider,
  FounderOffer,
  FounderSpotLabel,
  FounderStrip,
} from '@/app/_components/landing-interactions'
import type { FounderAvailability } from '@/lib/sparkle-suite/founder-availability'

function renderOffer(availability: FounderAvailability, compact = false) {
  return renderToStaticMarkup(<FounderAvailabilityProvider initialAvailability={availability}>
    <FounderStrip /><FounderSpotLabel large /><FounderOffer compact={compact} />
  </FounderAvailabilityProvider>)
}
const checkedAt = '2026-09-05T15:47:10.792Z'

describe('customer-visible founder offer states', () => {
  it.each([19, 1])('shows a prominent real %i count in the sticky banner', remaining => {
    const html = renderToStaticMarkup(<FounderAvailabilityProvider initialAvailability={{ status: 'available', remaining, checkedAt }}><FounderStrip /></FounderAvailabilityProvider>)
    expect(html).toContain('aria-label="Founder availability"')
    expect(html).toContain(`<strong>${remaining}</strong>`)
    expect(html).toContain('>Only</span>')
    expect(html).toContain('Secure your first-year discount.')
    expect(html).toContain('href="#pricing"')
    expect(html).not.toMatch(/timer|of 20/)
  })

  it.each([19, 1])('renders an honest %i-slot offer with checkout terms and singular/plural grammar', remaining => {
    const html = renderOffer({ status: 'available', remaining, checkedAt })
    expect(html).toContain(`${remaining} founder ${remaining === 1 ? 'spot' : 'spots'} remaining.`)
    expect(html).not.toContain('of 20')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('Sparkle Suite founding rep pricing')
    expect(html).toContain('$49.99')
    expect(html).toContain('$99.98')
    expect(html).toContain('$74.99/month after your first 12 paid service months.')
    expect(html).toContain('+ applicable tax')
    expect(html).toContain('Setup is non-refundable. Your subscription starts at checkout.')
  })

  it('switches to standard pricing and removes scarcity/founding claims when full', () => {
    const html = renderOffer({ status: 'full', remaining: 0, checkedAt })
    expect(html).toContain('Sparkle Suite standard pricing')
    expect(html).toContain('$74.99')
    expect(html).toContain('$124.98')
    expect(html).toContain('All founder spots have been allocated.')
    expect(html).not.toContain('founder spots remaining')
    expect(html).not.toContain('Founding rep rate')
    expect(html).not.toContain('Secure your founding rate before the spots are gone.')
    expect(html).not.toContain('$99.98')
  })

  it('does not invent a number, sold-out state, or confirmed discount when availability is unconfirmed', () => {
    const html = renderOffer({ status: 'unavailable', remaining: null, checkedAt: null })
    expect(html).toContain('Now building Sparkle Suite sites.')
    expect(html).toContain('Founder availability is temporarily unconfirmed.')
    expect(html).toContain('Any eligible founding rate will be confirmed at checkout.')
    expect(html).not.toMatch(/\d+ founder spots? remaining/)
    expect(html).not.toContain('All founder spots have been allocated.')
    expect(html).not.toContain('Founding rep rate')
  })

  it.each([
    { status: 'available', remaining: 19, checkedAt },
    { status: 'full', remaining: 0, checkedAt },
    { status: 'unavailable', remaining: null, checkedAt: null },
  ] satisfies FounderAvailability[])('keeps signup separate from reserving or buying a founder slot: $status', availability => {
    const html = renderOffer(availability)
    expect(html).toContain('Joining the queue does not reserve a founder rate. Eligibility is confirmed at checkout.')
    expect(html).toContain('href="/prelaunch#waitlist"')
    expect(html).toContain('Join the build queue')
    expect(html).not.toMatch(/checkout\.stripe|buy\.stripe|create-checkout/)
    const compact = renderOffer(availability, true)
    expect(compact).toContain('Joining the queue does not reserve a founder rate.')
    expect(compact).not.toContain('href="/prelaunch#waitlist"')
  })
})
