import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import PrelaunchPage from '@/app/prelaunch/page'

describe('Sparkle Suite prelaunch page', () => {
  it('renders the restored approved coming-soon homepage shell', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Coming Soon')
    expect(html).toContain('One easier home for your Bomb Party business.')
    expect(html).toContain('A polished website and rep-friendly tools')
    expect(html).toContain('Join the Waitlist')
    expect(html).toContain('What Is Sparkle Suite?')
    expect(html).toContain('application/ld+json')
  })

  it('renders the restored approved waitlist sections with compliance copy', () => {
    const html = renderToStaticMarkup(createElement(PrelaunchPage))

    expect(html).toContain('Look more professional online')
    expect(html).toContain('Stop relying on scattered links and social-media chaos')
    expect(html).toContain('Independent Bomb Party reps')
    expect(html).toContain('Join the Sparkle Suite waitlist')
    expect(html).toContain('Your name')
    expect(html).toContain('Best email')
    expect(html).toContain('Phone number')
    expect(html).toContain('TikTok handle')
    expect(html).toContain('Team rep name')
    expect(html).toContain('What feels the most patchwork right now?')
    expect(html).toContain('Yes, you can text me when Sparkle Suite is ready.')
    expect(html).toContain('Yes, you can email me when Sparkle Suite is ready.')
    expect(html).toContain('Message frequency may vary')
    expect(html).toContain('Reply STOP to')
    expect(html).toContain('HELP for help')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('A more polished home base is on the way.')
    expect(html).toContain('genuinely helpful for real rep life')
    expect(html).not.toContain('Be first in line when Sparkle Suite opens')
    expect(html).not.toContain('Tell us where to send launch updates')
    expect(html).not.toContain('Nic-Nac pre-qualification')
  })
})
