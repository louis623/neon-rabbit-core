import { timingSafeEqual } from 'node:crypto'

import type { SparkleSuiteAccountingProjection } from '@/lib/control-center/accounting'

export type AccountingAgentProduct = 'suite' | 'finder'

export function parseAccountingAgentProduct(value: string | null): AccountingAgentProduct | null {
  if (value === 'suite' || value === 'finder') return value
  return null
}

export function matchesAccountingAgentToken(
  authorization: string | null,
  expectedToken: string | undefined,
) {
  const suppliedToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const token = expectedToken?.trim() ?? ''
  if (!suppliedToken || !token) return false

  const supplied = Buffer.from(suppliedToken)
  const expected = Buffer.from(token)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

export function buildAccountingAgentSummary(args: {
  product: AccountingAgentProduct
  suiteProjection?: SparkleSuiteAccountingProjection | null
  now?: Date
}) {
  const isSuite = args.product === 'suite'
  const projection = isSuite ? args.suiteProjection ?? null : null
  const now = args.now ?? new Date()
  const easternDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    easternDate.find((entry) => entry.type === type)?.value ?? ''
  const year = part('year')
  const month = part('month')
  const nextMonth = month === '12' ? '01' : String(Number(month) + 1).padStart(2, '0')
  const nextYear = month === '12' ? String(Number(year) + 1) : year

  return {
    schemaVersion: 1,
    product: args.product === 'suite' ? 'sparkle_suite' : 'sparkle_finder',
    periodStart: `${year}-${month}-01`,
    periodEndExclusive: `${nextYear}-${nextMonth}-01`,
    asOf: {
      instant: now.toISOString(),
      timeZone: 'America/New_York',
    },
    access: {
      mode: 'read_only',
      customerDetail: 'not_exposed',
      financialWriteAccess: false,
    },
    projected: projection
      ? {
          recurringCents: Math.round(projection.monthlyRevenue * 100),
          activeClientCount: projection.activeClientCount,
          pastDueClientCount: projection.pastDueClientCount,
          cancelledClientCount: projection.cancelledClientCount,
          pricedActiveClientCount: projection.pricedActiveClientCount,
          clientsMissingMonthlyAmount: projection.clientsMissingMonthlyAmount,
          source: 'active_customer_subscriptions_with_positive_stored_monthly_amount',
        }
      : {
          recurringCents: null,
          activeClientCount: null,
          pastDueClientCount: null,
          cancelledClientCount: null,
          pricedActiveClientCount: null,
          clientsMissingMonthlyAmount: null,
          source: isSuite ? 'unavailable' : 'finder_projection_source_not_connected',
        },
    actuals: {
      revenueCollectedCents: null,
      refundsCents: null,
      creditsCents: null,
      disputesCents: null,
      pastDueBalanceCents: null,
      processorAvailableCents: null,
      payoutsInTransitCents: null,
      paymentHistory: 'not_connected',
      sourceStatus: 'not_connected',
      note: 'Actuals require approved, reconciled payment and expense sources. Subscription amounts are not treated as paid revenue.',
    },
    sourceStatus: {
      productDb: projection ? 'connected' : 'not_connected',
      stripe: 'not_connected',
      bluevine: 'not_connected',
    },
    lastReconciledAt: null,
    nextIntegrationRequirements: [
      'approved payment or invoice source with payment-cleared timing',
      'refund and credit handling',
      'separate expense source or controlled ledger',
      'month-end reconciliation rules',
      'explicit authorization before enabling any financial write action',
    ],
  }
}
