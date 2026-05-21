import { describe, expect, it } from 'vitest'

import {
  buildDemoPrelaunchSeedPlan,
  DEMO_PRELAUNCH_SEED_CONFIRM_ENV,
  DEMO_PRELAUNCH_SOURCE,
} from '@/scripts/seed-demo-prelaunch'

describe('demo prelaunch seed plan', () => {
  it('builds a provider-free fake lead plan from demo env', () => {
    const plan = buildDemoPrelaunchSeedPlan({
      DEMO_REP_EMAIL: 'demo@example.com',
    })

    expect(plan.lead).toMatchObject({
      name: 'Sparkle Demo Lead',
      email: 'demo@example.com',
      phone: '202-555-0142',
      source: DEMO_PRELAUNCH_SOURCE,
    })
    expect(plan.setupProfile.businessName).toBe('Sparkle Demo Shop')
    expect(plan.providerActions).toEqual({
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    })
  })

  it('refuses the reserved phone and obvious real-customer names', () => {
    expect(() =>
      buildDemoPrelaunchSeedPlan({
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_PRELAUNCH_LEAD_PHONE: '+19044383050',
      }),
    ).toThrow('DEMO_PRELAUNCH_LEAD_PHONE must not be +19044383050.')

    expect(() =>
      buildDemoPrelaunchSeedPlan({
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_PRELAUNCH_LEAD_NAME: 'Kim Goforth',
      }),
    ).toThrow('Demo prelaunch seed cannot use Kim Goforth.')
  })

  it('requires an explicit confirmation env before a write run can proceed', () => {
    expect(DEMO_PRELAUNCH_SEED_CONFIRM_ENV).toBe(
      'DEMO_PRELAUNCH_SEED_CONFIRMED',
    )
  })
})
