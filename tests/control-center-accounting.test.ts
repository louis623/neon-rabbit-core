import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccountingDashboard } from '@/app/control-center/_components/AccountingDashboard'

describe('Control Center accounting foundations', () => {
  it('separates Suite projected revenue from unavailable actuals', () => {
    const html = renderToStaticMarkup(createElement(AccountingDashboard, {
      product: 'suite',
      suiteProjection: {
        monthlyRevenue: 98,
        activeClientCount: 2,
        pricedActiveClientCount: 2,
        clientsMissingMonthlyAmount: 0,
        clientBilling: [{ clientName: 'Jane Roberts', plan: 'founder', monthlyAmount: 49 }],
      },
    }))
    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Projected monthly revenue')
    expect(html).toContain('$98')
    expect(html).toContain('Actual revenue collected')
    expect(html).toContain('Actual expenses paid')
    expect(html).toContain('Customer billing and payment history')
    expect(html).toContain('Jane Roberts')
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
