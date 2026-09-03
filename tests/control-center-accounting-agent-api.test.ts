import { describe, expect, it } from 'vitest'

import {
  buildAccountingAgentSummary,
  matchesAccountingAgentToken,
  parseAccountingAgentProduct,
} from '@/lib/control-center/accounting-agent-api'

describe('accounting agent API contract', () => {
  it('accepts only the two known products and a matching bearer token', () => {
    expect(parseAccountingAgentProduct('suite')).toBe('suite')
    expect(parseAccountingAgentProduct('finder')).toBe('finder')
    expect(parseAccountingAgentProduct('all')).toBeNull()
    expect(matchesAccountingAgentToken('Bearer correct-token', 'correct-token')).toBe(true)
    expect(matchesAccountingAgentToken('Bearer wrong-token', 'correct-token')).toBe(false)
    expect(matchesAccountingAgentToken(null, 'correct-token')).toBe(false)
  })

  it('gives an agent a read-only aggregate summary without customer detail or financial writes', () => {
    const summary = buildAccountingAgentSummary({
      product: 'suite',
      now: new Date('2026-09-03T17:00:00.000Z'),
      suiteProjection: {
        monthlyRevenue: 98,
        activeClientCount: 2,
        pastDueClientCount: 1,
        cancelledClientCount: 0,
        pricedActiveClientCount: 2,
        clientsMissingMonthlyAmount: 0,
        clientBilling: [],
      },
    })

    expect(summary).toMatchObject({
      schemaVersion: 1,
      product: 'sparkle_suite',
      periodStart: '2026-09-01',
      periodEndExclusive: '2026-10-01',
      asOf: { instant: '2026-09-03T17:00:00.000Z', timeZone: 'America/New_York' },
      access: { mode: 'read_only', customerDetail: 'not_exposed', financialWriteAccess: false },
      projected: { recurringCents: 9800, pastDueClientCount: 1, source: 'active_customer_subscriptions_with_positive_stored_monthly_amount' },
      actuals: { sourceStatus: 'not_connected' },
      sourceStatus: { productDb: 'connected', stripe: 'not_connected', bluevine: 'not_connected' },
    })
  })
})
