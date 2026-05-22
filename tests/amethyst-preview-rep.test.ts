import { describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_AMETHYST_PREVIEW_EMAIL,
  resolveAmethystPreviewRep,
} from '@/lib/amethyst/preview-rep'

function makeAdminClient({
  repsByEmail = {},
  repsById = {},
  latestLaunchRepId = null,
}: {
  repsByEmail?: Record<string, { id: string; email: string; streaming_links?: unknown }>
  repsById?: Record<string, { id: string; email: string; streaming_links?: unknown }>
  latestLaunchRepId?: string | null
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

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: vi.fn(() => ({ eq: repEq })),
      }
    }

    if (table === 'sparkle_suite_launch_builds') {
      return {
        select: vi.fn(() => ({ eq: launchStageEq })),
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
