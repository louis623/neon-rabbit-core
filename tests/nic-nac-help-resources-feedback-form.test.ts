import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { HelpResourcesCard } from '@/app/nic-nac/components/DashboardPlaceholder'
import { getHelpResources } from '@/lib/services/help-resources'

describe('HelpResourcesCard support report form', () => {
  it('renders a compact support report form in the Support Path', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'ready', resources: getHelpResources() },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Support Path')
    expect(html).toContain('Send a report to support')
    expect(html).toContain('Start report')
    expect(html).toContain('Report an issue or suggest an upgrade')
    expect(html).toContain('Site issue')
    expect(html).toContain('Bug')
    expect(html).toContain('Suggested upgrade')
    expect(html).toContain('Workflow idea')
    expect(html).toContain('Normal')
    expect(html).toContain('Blocking me')
    expect(html).toContain('Show-time urgent')
    expect(html).toContain('Page or workflow')
    expect(html).toContain('Short title')
    expect(html).toContain('Details')
    expect(html).toContain('Expected result')
    expect(html).toContain('Actual result')
    expect(html).toContain('Okay to contact me')
    expect(html).toContain('Send report')
  })

  it('keeps the report form available when help resources fail to load', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'error' },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Help resources are temporarily unavailable.')
    expect(html).toContain('Report an issue or suggest an upgrade')
    expect(html).toContain('Send report')
  })

  it('posts normalized support report values and handles notification attention copy', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('supportReportTitleRef')
    expect(source).toContain('focusSupportReportForm')
    expect(source).toContain('<details className={styles.supportPath} open>')
    expect(source).toContain('Start report')
    expect(source).not.toContain("className={styles.timelineItem}>\n                      {action}")
    expect(source).toContain("fetch('/api/nic-nac/support-reports'")
    expect(source).toContain("reportType: reportForm.reportType")
    expect(source).toContain("urgency: reportForm.urgency")
    expect(source).toContain("value: 'site_issue'")
    expect(source).toContain("value: 'suggested_upgrade'")
    expect(source).toContain("value: 'workflow_idea'")
    expect(source).toContain("value: 'showtime_urgent'")
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
