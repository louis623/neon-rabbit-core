import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage, { metadata } from '@/app/prelaunch/page'
import { PrelaunchWaitlistForm } from '@/app/prelaunch/_components/PrelaunchWaitlistForm'
import { prelaunchContent } from '@/lib/prelaunch/content'

describe('Sparkle Suite build-queue intake', () => {
  it('renders a compact active-build intake without dormant or internal copy', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))
    expect(html).toContain('Now building Sparkle Suite sites')
    expect(html).toContain('Your spot in line starts here.')
    expect(html).toContain('Sign up to get your spot in line.')
    expect(html).toContain('Join the build queue')
    expect(html).toContain('No payment to join.')
    expect(html).toContain('application/ld+json')
    expect(html).not.toContain('Coming Soon')
    expect(html).not.toContain('Join the Waitlist')
    expect(html).not.toContain('V1 preview')
    expect(html).not.toContain('backend')
    expect(html).not.toContain('launch flow')
    expect(html).not.toContain('Thank you, Louis Chapman')
    expect(metadata.title).toEqual({ absolute: 'Join the build queue | Sparkle Suite' })
    expect(metadata.alternates?.canonical).toBe('/prelaunch')
  })

  it('preserves navigation, account utility, signup anchor, and legal destinations', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'))
    expect(header).toContain('href="/"')
    expect(header).toContain('href="/#customer-site-proof"')
    expect(header).toContain('href="/#workspace-proof"')
    expect(header).toContain('href="/#pricing"')
    expect(header).toContain('aria-label="Account links"')
    expect(header).toContain('Sparkle Suite account')
    expect(html).toContain('href="#waitlist"')
    expect(html).toContain('id="waitlist"')
    expect(html).toContain('href="/privacy-policy"')
    expect(html).toContain('href="/terms-and-conditions"')
    expect(html).not.toContain('href="#"')
    const formSource = readFileSync(join(process.cwd(), 'app/prelaunch/_components/PrelaunchWaitlistForm.tsx'), 'utf8')
    expect(formSource).toContain("fetch('/api/prelaunch/waitlist'")
    expect(formSource.indexOf('if (!response.ok)')).toBeLessThan(formSource.indexOf('setIsSubmitted(true)'))
  })

  it('shows the shared honest offer while availability is unconfirmed', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))
    expect(html).toContain('aria-label="Included in Sparkle Suite"')
    expect(html).toContain('Sparkle Suite Standard')
    expect(html).toContain('$74.99')
    expect(html).toContain('$49.99')
    expect(html).toContain('$124.98')
    expect(html).toContain('applicable tax')
    expect(html).toContain('Setup is non-refundable.')
    expect(html).toContain('Founder availability is temporarily unconfirmed.')
    expect(html).toContain('Joining the queue does not reserve a founder rate.')
    expect(html).not.toContain('19 founder spots remaining')
    expect(html).not.toContain('19 of 20')
    expect(html).toContain('Message frequency may vary')
    expect(html).toContain('Reply STOP to')
    expect(html).toContain('HELP for help')
    expect(html).toContain('not sold, rented, traded, or shared for third-party')
  })

  it('preserves intake fields, consent defaults, and honest build-queue confirmation', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchWaitlistForm))
    const field = (name: string) => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? ''

    expect(html).toContain('id="waitlist"')
    expect(field('name')).toContain('required=""')
    expect(field('email')).toContain('required=""')
    for (const name of ['phone', 'tiktokHandle', 'teamRepName']) {
      expect(field(name)).not.toBe('')
      expect(field(name)).not.toContain('required=""')
    }
    expect(html.match(/ss-field__opt/g)).toHaveLength(4)
    expect(html).toContain('name="setupPain"')
    expect(field('website')).toContain('hidden=""')
    expect(field('smsConsent')).not.toContain('checked=""')
    expect(field('smsConsent')).not.toContain('required=""')
    expect(field('emailConsent')).toContain('checked=""')
    expect(field('emailConsent')).toContain('required=""')
    expect(html).toContain('Consent is not a condition of purchase.')
    expect(html).toContain('not sold, rented, traded, or shared for third-party')
    expect(prelaunchContent.waitlistSuccessBody).toContain('text only if you chose SMS updates')
    expect(prelaunchContent.waitlistSuccessBody).toContain('founder pricing is confirmed separately')
    expect(prelaunchContent.pricing.founder.term).toBe('Founder rate for the first 12 paid service months.')
    expect(prelaunchContent.pricing.founder.afterTerm).toBe('Then moves to the standard $74.99/month rate.')
  })
})
