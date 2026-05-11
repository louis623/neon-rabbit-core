import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TermsAndConditionsPage, { metadata } from '@/app/terms-and-conditions/page'

describe('Sparkle Suite terms and conditions page', () => {
  it('renders the public terms with required SMS compliance language', () => {
    const html = renderToStaticMarkup(createElement(TermsAndConditionsPage))

    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('Last Updated:')
    expect(html).toContain('May 9, 2026')
    expect(html).toContain('Program name: Sparkle Suite / Neon Rabbit Digital Services.')
    expect(html).toContain('Message frequency may vary.')
    expect(html).toContain('Message and data rates may apply.')
    expect(html).toContain('Consent to receive SMS messages is not a condition of purchase.')
    expect(html).toContain('You can opt out at any time by replying STOP.')
    expect(html).toContain('You can request help at any time by replying HELP.')
    expect(html).toContain('Wireless carriers are not liable for delayed or undelivered messages.')
    expect(html).toContain('href="/privacy-policy"')
    expect(html).toContain('href="/prelaunch"')
  })

  it('exports SEO metadata for the terms route', () => {
    expect(metadata.title).toBe(
      'Sparkle Suite Terms and Conditions | Neon Rabbit Digital Services',
    )
    expect(metadata.description).toBe(
      'Terms and Conditions for Sparkle Suite, the Live Queue Chrome Extension, Sparkle Suite websites, and Sparkle Suite SMS and email updates.',
    )
  })
})
