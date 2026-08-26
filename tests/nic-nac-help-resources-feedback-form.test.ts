import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { HelpResourcesCard } from '@/app/nic-nac/components/DashboardPlaceholder'
import { getHelpResources } from '@/lib/services/help-resources'

describe('HelpResourcesCard Message Center handoff', () => {
  it('keeps Help self-service and points support communication to Messages', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'ready', resources: getHelpResources() },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Support Path')
    expect(html).toContain('Using the Message Center')
    expect(html).toContain('Where to find it')
    expect(html).toContain('Choose the view you need')
    expect(html).toContain('Rep Network')
    expect(html).toContain('Those announcements are read-only.')
    expect(html).toContain('Start or continue a conversation')
    expect(html).toContain('Still need help?')
    expect(html).toContain('Contact Sparkle Suite Support')
    expect(html).toContain('Message Center')
    expect(html).not.toContain('Tell us what happened')
    expect(html).not.toContain('<form')
  })

  it('keeps the Message Center support action available when guides fail to load', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'error' },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Help resources are temporarily unavailable.')
    expect(html).toContain('Still need help?')
    expect(html).toContain('Contact Sparkle Suite Support')
    expect(html).not.toContain('<form')
  })

  it('opens the Support composer with safe Help context instead of posting from Help', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('<details className={styles.supportPath} open>')
    expect(source).toContain('onContactSupport')
    expect(source).toContain("composeSupport: true")
    expect(source).toContain("source: 'help'")
    expect(source).not.toContain("fetch('/api/nic-nac/support-reports'")
  })

  it('keeps the Message Center Support composer stacked on mobile', () => {
    const styles = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/messages/MessageCenter.module.css',
      ),
      'utf8',
    )

    expect(styles).toContain('.supportComposer')
    expect(styles).toContain('.supportTypeGrid')
    expect(styles).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.supportTypeGrid[\s\S]*?grid-template-columns:\s*1fr;/)
  })
})
