import { describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_AMETHYST_PREVIEW_EMAIL,
  resolveAmethystPreviewRep,
} from '@/lib/amethyst/preview-rep'

function makeAdminClient({
  repsByEmail = {},
  repsById = {},
  repsByCustomDomain = {},
  latestLaunchRepId = null,
  paidRepIds = [],
  readyLaunchRepIds = [],
}: {
  repsByEmail?: Record<string, { id: string; email: string; streaming_links?: unknown }>
  repsById?: Record<string, { id: string; email: string; streaming_links?: unknown }>
  repsByCustomDomain?: Record<string, { id: string; email: string; streaming_links?: unknown }>
  latestLaunchRepId?: string | null
  paidRepIds?: string[]
  readyLaunchRepIds?: string[]
}) {
  const repEq = vi.fn((column: string, value: string) => {
    if (column === 'email') {
      return {
        maybeSingle: vi.fn().mockResolvedValue({
          data: repsByEmail[value] ?? null,
          error: null,
        }),
      }
    }

    if (column === 'custom_domain') {
      return {
        maybeSingle: vi.fn().mockResolvedValue({
          data: repsByCustomDomain[value] ?? null,
          error: null,
        }),
      }
    }

    expect(column).toBe('id')
    return {
      maybeSingle: vi.fn().mockResolvedValue({
        data: repsById[value] ?? null,
        error: null,
      }),
    }
  })

  const launchMaybeSingle = vi.fn().mockResolvedValue({
    data: latestLaunchRepId ? { rep_id: latestLaunchRepId } : null,
    error: null,
  })
  const launchLimit = vi.fn(() => ({ maybeSingle: launchMaybeSingle }))
  const launchOrder = vi.fn(() => ({ limit: launchLimit }))
  const launchNot = vi.fn(() => ({ order: launchOrder }))
  const launchStatusEq = vi.fn(() => ({ not: launchNot }))
  const launchStageEq = vi.fn(() => ({ eq: launchStatusEq }))

  const publicLaunchMaybeSingle = vi.fn((repId: string) =>
    Promise.resolve({
      data: readyLaunchRepIds.includes(repId) ? { id: 'launch-ready' } : null,
      error: null,
    }),
  )
  const publicLaunchLimit = vi.fn((repId: string) => ({
    maybeSingle: () => publicLaunchMaybeSingle(repId),
  }))
  const publicLaunchOrder = vi.fn((repId: string) => ({
    limit: () => publicLaunchLimit(repId),
  }))
  const publicLaunchStatusEq = vi.fn((repId: string) => ({
    order: () => publicLaunchOrder(repId),
  }))
  const publicLaunchStageEq = vi.fn((repId: string) => ({
    eq: () => publicLaunchStatusEq(repId),
  }))
  const publicLaunchRepEq = vi.fn((_column: string, repId: string) => ({
    eq: () => publicLaunchStageEq(repId),
  }))

  const subscriptionMaybeSingle = vi.fn((repId: string) =>
    Promise.resolve({
      data: paidRepIds.includes(repId) ? { id: 'sub-1', status: 'active' } : null,
      error: null,
    }),
  )
  const subscriptionLimit = vi.fn((repId: string) => ({
    maybeSingle: () => subscriptionMaybeSingle(repId),
  }))
  const subscriptionOrder = vi.fn((repId: string) => ({
    limit: () => subscriptionLimit(repId),
  }))
  const subscriptionIn = vi.fn((repId: string) => ({
    order: () => subscriptionOrder(repId),
  }))
  const subscriptionEq = vi.fn((_column: string, repId: string) => ({
    in: () => subscriptionIn(repId),
  }))

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: vi.fn(() => ({ eq: repEq })),
      }
    }

    if (table === 'sparkle_suite_launch_builds') {
      return {
        select: vi.fn((columns: string) => ({
          eq: columns === 'rep_id' ? launchStageEq : publicLaunchRepEq,
        })),
      }
    }

    if (table === 'subscriptions') {
      return {
        select: vi.fn(() => ({ eq: subscriptionEq })),
      }
    }

    throw new Error(`Unexpected table ${table}`)
  })

  return { from } as never
}

describe('Amethyst preview rep resolver', () => {
  it('uses an explicit rep id before preview email fallbacks', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        'preview@example.com': {
          id: 'rep-preview',
          email: 'preview@example.com',
        },
      },
      repsById: {
        'rep-target': {
          id: 'rep-target',
          email: 'target@example.com',
        },
      },
      paidRepIds: ['rep-target'],
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: {
          AMETHYST_HOMEPAGE_PREVIEW_EMAIL: 'preview@example.com',
        },
        repId: 'rep-target',
      }),
    ).resolves.toEqual({
      id: 'rep-target',
      email: 'target@example.com',
    })
  })

  it('uses a matching custom domain before preview email fallbacks', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        'preview@example.com': {
          id: 'rep-preview',
          email: 'preview@example.com',
        },
      },
      repsByCustomDomain: {
        'sparklebysasha.example': {
          id: 'rep-domain',
          email: 'sasha@example.com',
        },
      },
      paidRepIds: ['rep-domain'],
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: {
          AMETHYST_HOMEPAGE_PREVIEW_EMAIL: 'preview@example.com',
        },
        repId: 'SparkleBySasha.example',
      }),
    ).resolves.toEqual({
      id: 'rep-domain',
      email: 'sasha@example.com',
    })
  })

  it('falls back to preview reps when a host has no custom-domain match', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        'preview@example.com': {
          id: 'rep-preview',
          email: 'preview@example.com',
        },
      },
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: {
          AMETHYST_HOMEPAGE_PREVIEW_EMAIL: 'preview@example.com',
        },
        repId: 'unknown.example',
      }),
    ).resolves.toEqual({
      id: 'rep-preview',
      email: 'preview@example.com',
    })
  })

  it('prefers explicit Amethyst preview email over the demo rep email', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        'preview@example.com': {
          id: 'rep-preview',
          email: 'preview@example.com',
          streaming_links: { tiktok: 'https://tiktok.com/@preview' },
        },
      },
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: {
          AMETHYST_HOMEPAGE_PREVIEW_EMAIL: 'preview@example.com',
          DEMO_REP_EMAIL: 'demo@example.com',
        },
        select: 'id, email, streaming_links',
      }),
    ).resolves.toEqual({
      id: 'rep-preview',
      email: 'preview@example.com',
      streaming_links: { tiktok: 'https://tiktok.com/@preview' },
    })
  })

  it('uses the latest ready launch build rep when preview emails do not resolve', async () => {
    const admin = makeAdminClient({
      repsById: {
        'rep-launch': {
          id: 'rep-launch',
          email: 'launch@example.com',
        },
      },
      latestLaunchRepId: 'rep-launch',
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: { DEMO_REP_EMAIL: 'missing@example.com' },
      }),
    ).resolves.toEqual({
      id: 'rep-launch',
      email: 'launch@example.com',
    })
  })

  it('does not expose an unpaid explicit rep id as a public customer site', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        'preview@example.com': {
          id: 'rep-preview',
          email: 'preview@example.com',
        },
      },
      repsById: {
        'rep-unpaid': {
          id: 'rep-unpaid',
          email: 'unpaid@example.com',
        },
      },
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        env: {
          AMETHYST_HOMEPAGE_PREVIEW_EMAIL: 'preview@example.com',
        },
        repId: 'rep-unpaid',
      }),
    ).resolves.toBeNull()
  })

  it('allows an explicit rep id with a ready launch build before subscription', async () => {
    const admin = makeAdminClient({
      repsById: {
        'rep-demo-ready': {
          id: 'rep-demo-ready',
          email: 'demo-ready@example.com',
        },
      },
      readyLaunchRepIds: ['rep-demo-ready'],
    })

    await expect(
      resolveAmethystPreviewRep(admin, {
        repId: 'rep-demo-ready',
      }),
    ).resolves.toEqual({
      id: 'rep-demo-ready',
      email: 'demo-ready@example.com',
    })
  })

  it('falls back to the locked default preview rep', async () => {
    const admin = makeAdminClient({
      repsByEmail: {
        [DEFAULT_AMETHYST_PREVIEW_EMAIL]: {
          id: 'rep-default',
          email: DEFAULT_AMETHYST_PREVIEW_EMAIL,
        },
      },
    })

    await expect(resolveAmethystPreviewRep(admin)).resolves.toEqual({
      id: 'rep-default',
      email: DEFAULT_AMETHYST_PREVIEW_EMAIL,
    })
  })
})
