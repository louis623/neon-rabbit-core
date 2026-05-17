import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage from '@/app/prelaunch/page'
import { prelaunchContent } from '@/lib/prelaunch/content'

describe('Sparkle Suite prelaunch page', () => {
  it('renders the official V1 preview public page shell', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Coming Soon')
    expect(prelaunchContent.headline).toBe(
      'A better customer experience starts with a better rep setup.',
    )
    expect(html).toContain('A better customer experience starts with a')
    expect(html).toContain('better rep setup')
    expect(html).toContain(
      'Sparkle Suite gives reps a more polished website, standout live show tools',
    )
    expect(html).toContain('Join the Waitlist')
    expect(html).toContain('What Is Sparkle Suite?')
    expect(html).toContain('Inside the suite')
    expect(html).toContain('V1 preview')
    expect(html).toContain('Why it stands out')
    expect(html).toContain('application/ld+json')
  })

  it('renders the official waitlist sections with compliance copy', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Trade board people actually want to use')
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
    expect(prelaunchContent.waitlistHeading).toBe(
      'Be first in line when Sparkle Suite opens.',
    )
    expect(html).toContain('Be first in line when')
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
    expect(html).not.toContain('One easier home for your Bomb Party business')
    expect(html).not.toContain('A polished website and rep-friendly tools designed to help you look professional')
    expect(html).not.toContain('Tell us where to send launch updates')
    expect(html).not.toContain('Thank you, Louis Chapman')
    expect(html).not.toContain('Nic-Nac pre-qualification')
  })
})
