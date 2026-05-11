import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage from '@/app/prelaunch/page'

describe('Sparkle Suite prelaunch page', () => {
  it('renders the approved coming-soon homepage shell', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Coming Soon')
    expect(html).toContain('A better customer experience starts with a better rep setup.')
    expect(html).toContain('Join the Waitlist')
    expect(html).toContain('What Is Sparkle Suite?')
    expect(html).toContain('application/ld+json')
  })

  it('renders the approved feature sections and waitlist fields', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('smoother live shows, less patchwork')
    expect(html).toContain('What Sparkle Suite is being built to help with')
    expect(html).toContain('Trade board')
    expect(html).toContain('Live queue')
    expect(html).toContain('Live event calendar')
    expect(html).toContain('Email updates')
    expect(html).toContain('SMS updates')
    expect(html).toContain('Nic-Nac')
    expect(html).toContain('We&#x27;re building this carefully.')
    expect(html).toContain('Name')
    expect(html).toContain('Email')
    expect(html).toContain('Phone')
    expect(html).toContain('TikTok handle')
    expect(html).toContain('Team rep name')
    expect(html).toContain('I agree to get launch updates by text')
    expect(html).toContain('I agree to get launch updates by email')
    expect(html).toContain('Message frequency may vary')
    expect(html).toContain('Reply STOP to unsubscribe')
    expect(html).toContain('HELP for help')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('mailto:louis@neonrabbit.net')
  })

  it('renders the native intake and Nic-Nac pre-qualification form', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Start Intake')
    expect(html).toContain('Nic-Nac pre-qualification')
    expect(html).toContain('Want launch updates without starting intake yet?')
    expect(html).toContain('Start with the intake form if you want us to review fit')
    expect(html).toContain('Business name')
    expect(html).toContain('Primary live platform')
    expect(html).toContain('How often are you live right now?')
    expect(html).toContain('What are you using online today?')
    expect(html).toContain('Do you use a computer or tablet while you stream?')
    expect(html).toContain('I agree to get intake follow-up by text')
    expect(html).toContain('I agree to get intake follow-up by email')
  })
})
