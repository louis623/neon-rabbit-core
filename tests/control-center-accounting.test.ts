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
    expect(html).toContain('$98.00')
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
        projectedRecurringCents: 12799,
        projectedExpensesCents: 6,
        actualCollectedCents: 9998,
        refundsCents: 0,
        creditsCents: null,
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
    expect(html).toContain('$127.99')
    expect(html).toContain('$0.06')
    expect(html).toContain('$99.98')
    expect(html).toContain('>Refunds</dt><dd class="mt-1 text-lg font-semibold">$0.00</dd>')
    expect(html).toContain('>Credits</dt><dd class="mt-1 text-lg font-semibold">—</dd>')
    expect(html).toContain('Payouts in transit')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('<textarea')
  })

  it('formats a cents snapshot identically for Suite and Finder', () => {
    const snapshot = {
      product: 'suite' as const,
      periodStart: '2026-09-01', periodEndExclusive: '2026-10-01', asOf: '2026-09-03T12:00:00.000Z', recordedAt: '2026-09-03T12:01:00.000Z', reason: 'initial' as const,
      sourceStatus: { stripe: 'connected' as const, bluevine: 'connected' as const, productDb: 'not_connected' as const },
      activeClientCount: null, pastDueClientCount: null, cancelledClientCount: null,
      projectedRecurringCents: 12799, projectedExpensesCents: null, actualCollectedCents: null,
      refundsCents: null, creditsCents: null, disputesCents: null, pastDueBalanceCents: null,
      processorAvailableCents: null, payoutsInTransitCents: null, expensesCents: null, netCents: null,
    }
    const suite = renderToStaticMarkup(createElement(AccountingDashboard, { product: 'suite', snapshot }))
    const finder = renderToStaticMarkup(createElement(AccountingDashboard, { product: 'finder', snapshot: { ...snapshot, product: 'finder' } }))
    expect(suite).toContain('$127.99')
    expect(finder).toContain('$127.99')
  })
})
