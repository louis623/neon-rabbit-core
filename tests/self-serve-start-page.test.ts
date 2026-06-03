import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import StartPage, { metadata } from '@/app/start/page'

describe('Sparkle Suite self-serve start page', () => {
  it('renders a polished account-start step without backend-facing reassurance copy', () => {
    const html = renderToStaticMarkup(createElement(StartPage))

    expect(metadata.title).toEqual({ absolute: 'Start Sparkle Suite' })
    expect(html).toContain('Start your Sparkle Suite')
    expect(html).not.toContain('Self-serve setup')
    expect(html).toContain('Create your Sparkle Suite account')
    expect(html).toContain('Agree to the Sparkle Suite terms')
    expect(html).toContain('Confirm payment in Stripe')
    expect(html).toContain('Finish setup with Nic-Nac')
    expect(html).toContain('customer-facing website')
    expect(html).toContain('dancefloor/trade board')
    expect(html).toContain('live show calendar')
    expect(html).toContain('SMS and email updates')
    expect(html).not.toContain('customer site')
    expect(html).not.toContain('Private account start')
    expect(html).not.toContain('Create your rep account')
    expect(html).not.toContain('No card is needed on this step.')
    expect(html).not.toContain('posts to live or social channels')
    expect(html).not.toContain('private workspace')
  })

  it('carries the landing-page header and footer onto the start page', () => {
    const html = renderToStaticMarkup(createElement(StartPage))

    expect(html).toContain('class="sl2-header"')
    expect(html).toContain('aria-label="Sparkle Suite home"')
    expect(html).toContain('Already have Sparkle Suite?')
    expect(html).toContain('class="sl2-footer"')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
  })

  it('keeps Google primary while moving email signup into a secondary panel', () => {
    const html = renderToStaticMarkup(createElement(StartPage))

    expect(html).toContain('name="agreementAccepted"')
    expect(html).toContain('Let&#x27;s get started')
    expect(html).toContain('Account creation')
    expect(html).toContain('Continue with Google')
    expect(html).toContain('Create account with a different email')
    expect(html).toContain('href="/terms-and-conditions"')
    expect(html).toContain('I agree to the')
    expect(html).toContain('Sparkle Suite Terms')
    expect(html).not.toContain('name="displayName"')
    expect(html).not.toContain('name="email"')
    expect(html).not.toContain('name="password"')
    expect(html).not.toContain('No card is needed on this step. Your checkout review comes next.')
    expect(html).not.toContain('name="businessName"')
    expect(html).not.toContain('name="phone"')
    expect(html).not.toContain('name="primarySocialUrl"')
    expect(html).not.toContain('name="shopUrl"')
    expect(html).not.toContain('Business name')
    expect(html).not.toContain('Primary live/social link')
    expect(html).not.toContain('Shop link')
    expect(html).not.toContain('name="emailConsent"')
    expect(html).not.toContain(
      'Email me Sparkle Suite account and setup updates. I will accept the Sparkle Suite terms before checkout.',
    )
  })

  it('contains the checkout and Google OAuth client flow', () => {
    const source = readFileSync('app/start/StartSparkleSuiteForm.tsx', 'utf8')

    expect(source).toContain('/api/stripe/create-checkout')
    expect(source).toContain("planType: 'monthly'")
    expect(source).toContain('agreementAccepted: true')
    expect(source).toContain('signInWithOAuth')
    expect(source).toContain("provider: 'google'")
    expect(source).toContain("form.get('passwordConfirm')")
    expect(source).toContain('setEmailSignupOpen(true)')
    expect(source).toContain(
      '/api/auth/callback?next=/nic-nac?onboarding=checkout-required',
    )
  })

  it('keeps mobile form controls at comfortable tap-target sizes', () => {
    const css = readFileSync('app/start/start.module.css', 'utf8')

    expect(css).toMatch(/\.form input\s*{[\s\S]*?min-height:\s*48px/)
    expect(css).toMatch(/\.form button\s*{[\s\S]*?min-height:\s*52px/)
    expect(css).toMatch(/@media \(max-width:\s*860px\)\s*{[\s\S]*?\.copy\s*{[\s\S]*?display:\s*contents/)
    expect(css).toMatch(/@media \(max-width:\s*860px\)\s*{[\s\S]*?\.form\s*{[\s\S]*?order:\s*3/)
  })
})
