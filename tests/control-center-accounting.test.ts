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
        pastDueClientCount: 0,
        cancelledClientCount: 0,
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

  it('shows Lane-supplied projected expenses and reconciliation totals without making a page editor', () => {
    const html = renderToStaticMarkup(createElement(AccountingDashboard, {
      product: 'finder',
      snapshot: {
        product: 'finder',
        periodStart: '2026-09-01',
        periodEndExclusive: '2026-10-01',
        asOf: '2026-09-03T12:00:00.000Z',
        recordedAt: '2026-09-03T12:01:00.000Z',
        reason: 'initial',
        sourceStatus: { stripe: 'connected', bluevine: 'connected', productDb: 'not_connected' },
        activeClientCount: 3,
        pastDueClientCount: 1,
        cancelledClientCount: 0,
        projectedRecurringCents: 12000,
        projectedExpensesCents: 2500,
        actualCollectedCents: 11000,
        refundsCents: 300,
        creditsCents: 200,
        disputesCents: 0,
        pastDueBalanceCents: 1000,
        processorAvailableCents: 8000,
        payoutsInTransitCents: 3000,
        expensesCents: 1800,
        netCents: 9200,
      },
    }))
    expect(html).toContain('Projected monthly expenses')
    expect(html).toContain('Lane’s latest reconciled expected recurring revenue')
    expect(html).toContain('$120')
    expect(html).toContain('$25')
    expect(html).toContain('Refunds and credits')
    expect(html).toContain('$5')
    expect(html).toContain('Payouts in transit')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('<textarea')
  })
})
