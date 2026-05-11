import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrivacyPolicyPage, { metadata } from '@/app/privacy-policy/page'

describe('Sparkle Suite privacy policy page', () => {
  it('renders the public privacy policy with required SMS compliance language', () => {
    const html = renderToStaticMarkup(createElement(PrivacyPolicyPage))

    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Last Updated:')
    expect(html).toContain('May 9, 2026')
    expect(html).toContain('Neon Rabbit Digital Services')
    expect(html).toContain('Sparkle Suite Live Queue Chrome Extension')
    expect(html).toContain('Message frequency may vary.')
    expect(html).toContain('Message and data rates may apply.')
    expect(html).toContain('Consent is not a condition of purchase.')
    expect(html).toContain('replying STOP')
    expect(html).toContain('replying HELP')
    expect(html).toContain('href="/prelaunch"')
    expect(html).toContain('href="/terms-and-conditions"')
  })

  it('exports SEO metadata for the privacy policy route', () => {
    expect(metadata.title).toBe(
      'Sparkle Suite Privacy Policy | Neon Rabbit Digital Services',
    )
    expect(metadata.description).toBe(
      'Privacy Policy for Sparkle Suite, the Live Queue Chrome Extension, Sparkle Suite websites, and Sparkle Suite SMS and email updates.',
    )
  })
})
