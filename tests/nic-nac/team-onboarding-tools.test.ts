import { describe, expect, it } from 'vitest'

import { createTeamOnboardingSite } from '@/lib/nic-nac/tools/create-team-onboarding-site'

describe('team onboarding tools', () => {
  it('creates a private draft onboarding site config starter', () => {
    const result = createTeamOnboardingSite({
      slug: 'britt-with-bling',
      teamName: 'Britt with Bling',
      repDisplayName: 'Britt',
    })

    expect(result).toEqual({
      status: 'draft',
      config: {
        site: {
          slug: 'britt-with-bling',
          title: 'Start Strong with Britt with Bling',
          teamName: 'Britt with Bling',
          repDisplayName: 'Britt',
          customDomain: null,
        },
        resources: [],
        steps: [],
      },
    })
  })

  it('rejects invalid slugs before creating a starter config', () => {
    expect(() =>
      createTeamOnboardingSite({
        slug: 'Britt With Bling',
        teamName: 'Britt with Bling',
        repDisplayName: 'Britt',
      }),
    ).toThrow()
  })
})
