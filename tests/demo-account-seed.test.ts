import { describe, expect, it } from 'vitest'

import {
  buildDemoSeedPlan,
  buildDemoCalendarEventRows,
  getDemoRepPassword,
  shouldUpdateExistingDemoPassword,
  getRequiredDemoRepEmail,
} from '@/scripts/seed-demo-rep'

describe('demo account seed plan', () => {
  const now = new Date('2026-05-18T14:00:00.000Z')

  it('builds a realistic launch demo account plan without live provider actions', () => {
    const plan = buildDemoSeedPlan({
      email: 'launch-demo@example.com',
      now,
    })

    expect(plan.rep.email).toBe('launch-demo@example.com')
    expect(plan.rep.displayName).toMatch(/demo/i)
    expect(plan.rep.businessName).toMatch(/sparkle/i)

    expect(plan.siteSettings.tagline).toContain('Sparkle')
    expect(plan.siteSettings.bannerVisible).toBe(true)
    expect(plan.siteSettings.showJoinPage).toBe(true)

    expect(plan.upcomingShows).toHaveLength(2)
    expect(plan.upcomingShows.every((show) => show.eventTime > now)).toBe(true)
    expect(plan.upcomingShows.every((show) => show.status === 'scheduled')).toBe(true)

    expect(plan.designs).toHaveLength(10)
    expect(new Set(plan.designs.map((design) => design.itemNumber)).size).toBe(10)
    expect(plan.listings).toHaveLength(10)
    expect(plan.listings.every((listing) => listing.status === 'available')).toBe(true)

    expect(plan.audienceMembers).toHaveLength(5)
    expect(plan.audienceMembers.some((member) => member.smsConsent)).toBe(true)
    expect(plan.audienceMembers.some((member) => member.emailConsent)).toBe(true)

    expect(plan.providerActions).toEqual({
      sendSms: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
    })
  })

  it('requires DEMO_REP_EMAIL for CLI execution', () => {
    expect(() => getRequiredDemoRepEmail({})).toThrow(/DEMO_REP_EMAIL/)
    expect(getRequiredDemoRepEmail({ DEMO_REP_EMAIL: 'demo@example.com' })).toBe(
      'demo@example.com',
    )
  })

  it('uses a provided demo password without resetting existing users by default', () => {
    expect(getDemoRepPassword({})).toBe('SparkleDemo2026!')
    expect(getDemoRepPassword({ DEMO_REP_PASSWORD: 'SharedDemo2026!' })).toBe(
      'SharedDemo2026!',
    )
    expect(shouldUpdateExistingDemoPassword({})).toBe(false)
    expect(
      shouldUpdateExistingDemoPassword({ DEMO_REP_PASSWORD: 'SharedDemo2026!' }),
    ).toBe(true)
  })

  it('keeps seeded show descriptions realistic in calendar rows', () => {
    const plan = buildDemoSeedPlan({
      email: 'launch-demo@example.com',
      now,
    })

    const rows = buildDemoCalendarEventRows('rep-123', plan)

    expect(rows).toHaveLength(2)
    expect(rows[0].description).toBe(plan.upcomingShows[0].description)
    expect(rows[0].description).not.toContain('__sparkle_demo_seed')
    expect(rows.every((row) => row.recurrence_group_id === null)).toBe(true)
  })
})
