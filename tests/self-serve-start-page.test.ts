import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import StartPage, { metadata } from '@/app/start/page'

describe('Sparkle Suite self-serve start page', () => {
  it('renders a premium account-start step with checkout reassurance before payment', () => {
    const html = renderToStaticMarkup(createElement(StartPage))

    expect(metadata.title).toEqual({ absolute: 'Start Sparkle Suite' })
    expect(html).toContain('Start your Sparkle Suite')
    expect(html).not.toContain('Self-serve setup')
    expect(html).toContain('No card is needed on this step.')
    expect(html).toContain(
      'Nothing here texts or emails customers, posts to live or social channels, changes provider settings, or charges you.',
    )
    expect(html).toContain(
      'Review your plan, renewal details, and Sparkle Suite terms before Stripe asks for payment.',
    )
    expect(html).toContain('Create your rep account')
    expect(html).toContain('Review plan and terms')
    expect(html).toContain('Confirm payment in Stripe')
    expect(html).toContain('Open Nic-Nac and finish setup')
    expect(html).toContain('name="displayName"')
    expect(html).toContain('name="businessName"')
    expect(html).toContain('name="email"')
    expect(html).toContain('name="password"')
    expect(html).not.toContain('name="emailConsent"')
    expect(html).toContain(
      'Sparkle Suite sends account and setup updates for this private workspace.',
    )
    expect(html).toContain(
      'Terms are reviewed separately in the checkout review before payment.',
    )
    expect(html).not.toContain(
      'Email me Sparkle Suite account and setup updates. I will accept the Sparkle Suite terms before checkout.',
    )
    expect(html).toContain('Create account and continue')
  })

  it('keeps mobile form controls at comfortable tap-target sizes', () => {
    const css = readFileSync('app/start/start.module.css', 'utf8')

    expect(css).toMatch(/\.form input\s*{[\s\S]*?min-height:\s*48px/)
    expect(css).toMatch(/\.form button\s*{[\s\S]*?min-height:\s*52px/)
    expect(css).toMatch(/@media \(max-width:\s*860px\)\s*{[\s\S]*?\.copy\s*{[\s\S]*?display:\s*contents/)
    expect(css).toMatch(/@media \(max-width:\s*860px\)\s*{[\s\S]*?\.form\s*{[\s\S]*?order:\s*3/)
  })
})
