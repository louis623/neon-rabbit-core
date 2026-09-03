import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccountingDashboard } from '@/app/control-center/_components/AccountingDashboard'

describe('Control Center accounting foundations', () => {
  it('keeps Suite financial values visibly unavailable until a verified source is connected', () => {
    const html = renderToStaticMarkup(createElement(AccountingDashboard, { product: 'suite' }))
    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Monthly revenue')
    expect(html).toContain('Monthly expenses')
    expect(html).toContain('Net for the month')
    expect(html).toContain('Customer billing and payment history')
    expect(html).toContain('Expense ledger')
    expect(html).toContain('Not connected')
    expect(html).toContain('bg-amber-50')
  })

  it('keeps Sparkle Finder accounting independent', () => {
    const html = renderToStaticMarkup(createElement(AccountingDashboard, { product: 'finder' }))
    expect(html).toContain('Sparkle Finder')
    expect(html).toContain('Back to Sparkle Finder Control Center')
    expect(html).toContain('href="/control-center?product=finder"')
    expect(html).toContain('href="/control-center/accounting"')
  })
})
