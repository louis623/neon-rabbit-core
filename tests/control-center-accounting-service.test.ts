import { describe, expect, it } from 'vitest'

import { summarizeSparkleSuiteProjectedRevenue } from '@/lib/control-center/accounting'
import type { OperatorCustomerProfile } from '@/lib/services/client-account-profiles'

function customer(overrides: Partial<OperatorCustomerProfile>): OperatorCustomerProfile {
  return {
    repId: 'rep-1',
    accountClassification: 'customer',
    clientName: 'Jane Roberts',
    showName: "Jane's Sparkle Party",
    primaryContactName: 'Jane Roberts',
    email: 'jane@example.com',
    phone: null,
    referral: { code: null, usageCount: 0 },
    accountStatus: 'active',
    subscriptionStatus: 'active',
    supportTier: 'founder',
    publicSiteSlug: null,
    customDomain: null,
    shopLink: null,
    streamingLinks: {},
    socialHandles: {},
    liveQueueSyncCode: null,
    internalNotes: null,
    setupStatus: null,
    setupCurrentStep: null,
    billing: {
      status: 'active',
      planTier: 'monthly',
      pricingTier: 'founder',
      monthlyAmount: 49,
      currentPeriodEnd: null,
      stripeCustomerId: null,
    },
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

describe('Sparkle Suite projected accounting', () => {
  it('counts only active customer subscriptions with a positive stored monthly amount', () => {
    const summary = summarizeSparkleSuiteProjectedRevenue([
      customer({ clientName: 'Active customer' }),
      customer({
        repId: 'rep-2',
        clientName: 'Missing amount',
        billing: {
          status: 'active',
          planTier: 'monthly',
          pricingTier: 'standard',
          monthlyAmount: null,
          currentPeriodEnd: null,
          stripeCustomerId: null,
        },
      }),
      customer({
        repId: 'rep-3',
        clientName: 'Past due',
        billing: {
          status: 'past_due',
          planTier: 'monthly',
          pricingTier: 'founder',
          monthlyAmount: 49,
          currentPeriodEnd: null,
          stripeCustomerId: null,
        },
      }),
      customer({
        repId: 'rep-4',
        accountClassification: 'demo',
        clientName: 'Demo account',
      }),
    ])

    expect(summary).toEqual({
      monthlyRevenue: 49,
      activeClientCount: 2,
      pricedActiveClientCount: 1,
      clientsMissingMonthlyAmount: 1,
      clientBilling: [
        { clientName: 'Active customer', plan: 'founder', monthlyAmount: 49 },
      ],
    })
  })
})
