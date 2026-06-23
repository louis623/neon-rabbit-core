import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { HelpResourcesCard } from '@/app/nic-nac/components/DashboardPlaceholder'
import { getHelpResources } from '@/lib/services/help-resources'

describe('HelpResourcesCard support report form', () => {
  it('renders a one-field support report form in the Support Path', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'ready', resources: getHelpResources() },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Support Path')
    expect(html).toContain('Send a quick report')
    expect(html).toContain('Tell us what happened')
    expect(html).toContain('Start report')
    expect(html).toContain('Send report')
    expect(html).not.toContain('Report type')
    expect(html).not.toContain('Urgency')
    expect(html).not.toContain('Expected result')
    expect(html).not.toContain('Actual result')
    expect(html).not.toContain('I started at the top of Help')
  })

  it('keeps the report form available when help resources fail to load', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'error' },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Help resources are temporarily unavailable.')
    expect(html).toContain('Send a quick report')
    expect(html).toContain('Tell us what happened')
    expect(html).toContain('Send report')
  })

  it('posts normalized one-field support report values and handles notification attention copy', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('focusSupportReportForm')
    expect(source).toContain('<details className={styles.supportPath} open>')
    expect(source).toContain('supportReportDetailsRef')
    expect(source).toContain('buildSupportReportPayload')
    expect(source).toContain('Start report')
    expect(source).not.toContain("className={styles.timelineItem}>\n                      {action}")
    expect(source).toContain("fetch('/api/nic-nac/support-reports'")
    expect(source).toContain("reportType: inferSupportReportType")
    expect(source).toContain("urgency: inferSupportReportUrgency")
    expect(source).toContain('contactOk: true')
    expect(source).toContain('Report saved.')
    expect(source).toContain('automatic Google Chat notification needs attention')
    expect(source).toContain("notificationStatus === 'not_configured'")
    expect(source).toContain("notificationStatus === 'failed'")
  })

  it('keeps the support form compact and stacked on mobile', () => {
    const styles = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    expect(styles).toContain('.supportReportForm')
    expect(styles).toContain('.supportReportChoiceGrid')
    expect(styles).toContain('.supportReportFieldGrid')
    expect(styles).toMatch(/@media\s+\(max-width:\s*840px\)[\s\S]*?\.supportReportFieldGrid[\s\S]*?grid-template-columns:\s*1fr;/)
  })
})
