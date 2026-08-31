import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage from '@/app/prelaunch/page'
import { prelaunchContent } from '@/lib/prelaunch/content'

describe('Sparkle Suite prelaunch page', () => {
  it('renders the approved coming-soon shell without internal preview labels', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Sparkle Suite - Coming Soon')
    expect(prelaunchContent.headline).toBe(
      'A better customer experience starts with a better rep setup.',
    )
    expect(html).toContain('A better customer experience starts with a better rep setup.')
    expect(html).toContain(
      'Sparkle Suite gives reps a more polished website, standout live show tools, and built-in support that helps customers feel the difference.',
    )
    expect(html).toContain('Join the Waitlist')
    expect(html).toContain('What Is Sparkle Suite?')
    expect(html).not.toContain('Sales snippets')
    expect(html).not.toContain('Short TikTok-style previews')
    expect('salesVideoHeading' in prelaunchContent).toBe(false)
    expect(html).not.toContain('Self-Serve Launch Flow')
    expect(html).not.toContain('Get Launch Access')
    expect(html).not.toContain('Buy your workspace')
    expect(html).not.toContain('self-serve launch access')
    expect(html).not.toContain('launch flow')
    expect(html).not.toContain('backend')
    expect(html).not.toContain('setup walkthrough')
    expect(html).not.toContain('how-to walkthrough')
    expect(html).toContain('Inside the suite')
    expect(html).not.toContain('V1 preview')
    expect(html).not.toContain('class="ss-card__meta"')
    expect(html).not.toContain('class="ss-feat__num"')
    expect(html).not.toContain('class="ss-audience__num"')
    expect(html).toContain('Why it stands out')
    expect(html).toContain('application/ld+json')
  })

  it('renders the workspace sign-in action in the prelaunch header', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))
    const headerHtml = html.slice(0, html.indexOf('class="ss-hero"'))

    expect(headerHtml).toContain('Log in to your Sparkle Suite workspace')
    expect(headerHtml).toContain('href="/login?redirect=%2Fnic-nac"')
    expect(headerHtml).not.toContain('Already have Sparkle Suite?')
    expect(headerHtml).not.toContain('Sign in here.')
  })

  it('renders the official waitlist sections with compliance copy', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Dance Floor people actually want to use')
    expect(html).toContain('Live queue customers can follow')
    expect(html).toContain('Live event calendar that stays current')
    expect(html).toContain('Email updates from one home base')
    expect(html).toContain('SMS reminders when timing matters')
    expect(html).toContain('Nic-Nac behind the scenes')
    expect(prelaunchContent.audienceSubheading).toBe(
      'Built for reps who want to stand out.',
    )
    expect(html).toContain('Built for reps who want to')
    expect(html).toContain('stand out.')
    expect(html).toContain('Founder pricing')
    expect(html).toContain('Join the waitlist while founder pricing is still in reach.')
    expect(html).toContain('Sparkle Suite setup fee')
    expect(html).toContain('Founding rep monthly')
    expect(html).toContain('First 20 paid reps')
    expect(html).toContain('$49.99/month')
    expect(html).toContain('Standard monthly')
    expect(html).toContain('$74.99/month')
    expect(html).toContain('$99.98 first checkout before taxes')
    expect(html).toContain('$124.98 first checkout before taxes')
    expect(html).toContain('Founder pricing is limited to the first 20 paid reps.')
    expect(html).toContain('class="ss-pricing-card ss-pricing-card--founder"')
    expect(html).toContain('class="ss-pricing-card ss-pricing-card--standard"')
    expect(html).toContain('href="#waitlist"')
    expect(prelaunchContent.waitlistHeading).toBe(
      'Be first in line when Sparkle Suite opens.',
    )
    expect(html).toContain('Be first in line when Sparkle Suite opens.')
    expect(html).toContain('Name')
    expect(html).toContain('Email')
    expect(html).toContain('Phone')
    expect(html).toContain('TikTok handle')
    expect(html).toContain('Team rep name')
    expect(html).toContain('What part of your current setup feels the most patchwork?')
    expect(html).toContain('Text me updates.')
    expect(html).toContain('Email me updates.')
    expect(html).toContain('optional SMS consent box is unchecked by default')
    expect(html).toContain('Message frequency may vary')
    expect(html).toContain('Reply STOP to')
    expect(html).toContain('HELP for help')
    expect(html).toContain('href="/privacy-policy"')
    expect(html).toContain('href="/terms-and-conditions"')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('id="waitlist-sms-consent"')
    expect(html).not.toContain('id="waitlist-sms-consent" required')
    expect(prelaunchContent.waitlistSuccessTitle).toBe(
      "Thank you, friend. We've got you.",
    )
    expect(prelaunchContent.footerHeading).toBe("We're building this carefully.")
    expect(html).toContain('building this carefully.')
    expect(html).not.toContain('Built to sell first, train after purchase.')
    expect(html).not.toContain('The new handoff')
    expect(html).not.toContain('buy, login, and setup flow')
    expect(html).not.toContain('No setup meeting required')
    expect(html).not.toContain('One easier home for your Bomb Party business')
    expect(html).not.toContain('A polished website and rep-friendly tools designed to help you look professional')
    expect(html).not.toContain('Tell us where to send launch updates')
    expect(html).not.toContain('Thank you, Louis Chapman')
    expect(html).not.toContain('Nic-Nac pre-qualification')
  })
})
