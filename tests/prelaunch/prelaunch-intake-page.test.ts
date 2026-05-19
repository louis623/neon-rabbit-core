import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import PrelaunchIntakePage, { metadata } from '@/app/prelaunch/intake/page'

describe('Sparkle Suite prelaunch intake page', () => {
  it('renders the direct client intake form without live-provider actions', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchIntakePage))

    expect(metadata.title).toEqual({
      absolute: 'Sparkle Suite | Client Intake',
    })
    expect(html).toContain('Nic-Nac pre-qualification')
    expect(html).toContain('Share enough context for a useful first review.')
    expect(html).toContain('Business name')
    expect(html).toContain('Referral code')
    expect(html).toContain('I agree to get intake follow-up by text.')
    expect(html).toContain('I agree to get intake follow-up by email.')
    expect(html).toContain('Submit Intake')
    expect(html).toContain('Back to Waitlist')
    expect(html).toContain('href="/prelaunch#waitlist"')
    expect(html).not.toContain('href="#waitlist"')
    expect(html).not.toContain('Collect payment')
    expect(html).not.toContain('Send agreement')
    expect(html).not.toContain('Send SMS')
  })
})
