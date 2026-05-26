import { describe, expect, it, vi } from 'vitest'

import { runMultiRepIsolationSmoke } from '@/lib/launch-readiness/multi-rep-isolation-smoke'

const repSnapshots = {
  'rep-a': {
    workspace: {
      repId: 'rep-a',
      route: '/api/nic-nac/trade-requests',
      listingIds: ['listing-a'],
      tradeRequestIds: ['request-a'],
      audienceMemberIds: ['audience-a'],
      showSessionIds: ['show-a'],
    },
    publicSite: {
      repId: 'rep-a',
      route: '/api/amethyst/customer-audience',
      host: 'rep-a.sparkle.test',
      listingIds: ['listing-a'],
      audienceSignupIds: ['signup-a'],
    },
  },
  'rep-b': {
    workspace: {
      repId: 'rep-b',
      route: '/api/nic-nac/trade-requests',
      listingIds: ['listing-b'],
      tradeRequestIds: ['request-b'],
      audienceMemberIds: ['audience-b'],
      showSessionIds: ['show-b'],
    },
    publicSite: {
      repId: 'rep-b',
      route: '/api/amethyst/customer-audience',
      host: 'rep-b.sparkle.test',
      listingIds: ['listing-b'],
      audienceSignupIds: ['signup-b'],
    },
  },
}

function makeDependencies(
  snapshots: typeof repSnapshots = repSnapshots,
) {
  return {
    loadWorkspaceRoute: vi.fn(async ({ repId }: { repId: string }) => {
      return snapshots[repId as keyof typeof snapshots].workspace
    }),
    loadPublicSiteRoute: vi.fn(async ({ repId }: { repId: string }) => {
      return snapshots[repId as keyof typeof snapshots].publicSite
    }),
  }
}

describe('multi-rep isolation smoke', () => {
  it('proves workspace and public route data stay scoped to each rep', async () => {
    const dependencies = makeDependencies()

    const report = await runMultiRepIsolationSmoke({
      reps: [
        { repId: 'rep-a', publicHost: 'rep-a.sparkle.test' },
        { repId: 'rep-b', publicHost: 'rep-b.sparkle.test' },
      ],
      now: new Date('2026-05-26T18:00:00.000Z'),
      dependencies,
    })

    expect(dependencies.loadWorkspaceRoute).toHaveBeenCalledTimes(2)
    expect(dependencies.loadPublicSiteRoute).toHaveBeenCalledTimes(2)
    expect(dependencies.loadWorkspaceRoute).toHaveBeenCalledWith({
      repId: 'rep-a',
      now: new Date('2026-05-26T18:00:00.000Z'),
      providerFree: true,
    })
    expect(dependencies.loadPublicSiteRoute).toHaveBeenCalledWith({
      repId: 'rep-b',
      publicHost: 'rep-b.sparkle.test',
      now: new Date('2026-05-26T18:00:00.000Z'),
      providerFree: true,
    })
    expect(report).toMatchObject({
      ok: true,
      isolationState: 'isolated',
      providerActions: {
        sendSms: false,
        sendEmail: false,
        chargeStripe: false,
        sendSignWellLiveAgreement: false,
        callPhotoroom: false,
        callPostHog: false,
      },
    })
    expect(report.steps.map((step) => step.id)).toEqual([
      'workspace_rep_a',
      'public_site_rep_a',
      'workspace_rep_b',
      'public_site_rep_b',
      'cross_rep_leak_check',
    ])
    expect(report.steps.every((step) => step.providerAction === false)).toBe(true)
    expect(report.steps.at(-1)?.details).toMatchObject({
      leakCount: 0,
      checkedRepIds: ['rep-a', 'rep-b'],
    })
  })

  it('flags cross-rep workspace or public data leakage in the smoke report', async () => {
    const dependencies = makeDependencies({
      ...repSnapshots,
      'rep-a': {
        workspace: {
          ...repSnapshots['rep-a'].workspace,
          listingIds: ['listing-a', 'listing-b'],
        },
        publicSite: {
          ...repSnapshots['rep-a'].publicSite,
          audienceSignupIds: ['signup-a', 'signup-b'],
        },
      },
    })

    const report = await runMultiRepIsolationSmoke({
      reps: [
        {
          repId: 'rep-a',
          publicHost: 'rep-a.sparkle.test',
          ownedWorkspaceIds: ['listing-a', 'request-a', 'audience-a', 'show-a'],
          ownedPublicSiteIds: ['listing-a', 'signup-a'],
        },
        {
          repId: 'rep-b',
          publicHost: 'rep-b.sparkle.test',
          ownedWorkspaceIds: ['listing-b', 'request-b', 'audience-b', 'show-b'],
          ownedPublicSiteIds: ['listing-b', 'signup-b'],
        },
      ],
      dependencies,
    })

    expect(report.ok).toBe(false)
    expect(report.isolationState).toBe('leak_detected')
    expect(report.steps.at(-1)?.ok).toBe(false)
    expect(report.steps.at(-1)?.details).toMatchObject({
      leakCount: 2,
    })
    expect(report.leaks).toEqual([
      {
        ownerRepId: 'rep-b',
        exposedInRepId: 'rep-a',
        surface: 'workspace',
        value: 'listing-b',
      },
      {
        ownerRepId: 'rep-b',
        exposedInRepId: 'rep-a',
        surface: 'public_site',
        value: 'signup-b',
      },
    ])
  })
})
