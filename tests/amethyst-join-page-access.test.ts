import { describe, expect, it, vi } from 'vitest'

import { canServeTargetedAmethystJoinPage } from '@/lib/amethyst/join-page-access'
import type { AmethystRequestTarget } from '@/lib/amethyst/request-rep-target'

const untargeted: AmethystRequestTarget = {
  repId: null,
  publicSiteSlug: null,
  customDomain: null,
  source: null,
  targeted: false,
}

const targeted: AmethystRequestTarget = {
  repId: null,
  publicSiteSlug: 'goforthebling',
  customDomain: null,
  source: 'query-public-site-slug',
  targeted: true,
}

describe('Amethyst Join page access', () => {
  it('keeps the untargeted generic design export available', async () => {
    await expect(canServeTargetedAmethystJoinPage(untargeted)).resolves.toBe(true)
  })

  it.each([
    [true, true, true],
    [true, false, false],
    [true, null, false],
    [false, true, false],
    [false, false, false],
  ])(
    'requires operator access=%s and rep visibility=%s',
    async (joinTeamAccessEnabled, showJoinPage, expected) => {
      const resolveRep = vi.fn(async () => ({ id: 'rep-1', email: 'rep@example.com' }))
      const loadSettings = vi.fn(async () => ({
        joinTeamAccessEnabled,
        showJoinPage,
      }))

      await expect(
        canServeTargetedAmethystJoinPage(targeted, {
          createAdminClient: vi.fn(() => ({ marker: 'admin' }) as never),
          resolveAmethystPreviewRep: resolveRep as never,
          getTargetedJoinPageAccessFlags: loadSettings as never,
        }),
      ).resolves.toBe(expected)
      expect(resolveRep).toHaveBeenCalledWith(
        { marker: 'admin' },
        expect.objectContaining({
          publicSiteSlug: 'goforthebling',
          strict: true,
        }),
      )
    },
  )

  it('fails closed for an unknown targeted rep or custom domain', async () => {
    const loadSettings = vi.fn()
    const unknownCustomDomain: AmethystRequestTarget = {
      repId: null,
      publicSiteSlug: null,
      customDomain: 'unknown.example',
      source: 'custom-domain',
      targeted: true,
    }

    await expect(
      canServeTargetedAmethystJoinPage(unknownCustomDomain, {
        createAdminClient: vi.fn(() => ({ marker: 'admin' }) as never),
        resolveAmethystPreviewRep: vi.fn(async () => null) as never,
        getTargetedJoinPageAccessFlags: loadSettings as never,
      }),
    ).resolves.toBe(false)
    expect(loadSettings).not.toHaveBeenCalled()
  })

  it('keeps an explicit custom-domain tenant ahead of a rewritten /join slug', async () => {
    const resolveRep = vi.fn(async () => ({
      id: 'rep-britt',
      email: 'rep@example.com',
    }))
    const loadSettings = vi.fn(async () => ({
      joinTeamAccessEnabled: true,
      showJoinPage: true,
    }))
    const rewrittenCustomDomain: AmethystRequestTarget = {
      repId: 'brittwithbling.com',
      publicSiteSlug: 'join',
      customDomain: null,
      source: 'query-rep-id',
      targeted: true,
    }

    await expect(
      canServeTargetedAmethystJoinPage(rewrittenCustomDomain, {
        createAdminClient: vi.fn(() => ({ marker: 'admin' }) as never),
        resolveAmethystPreviewRep: resolveRep as never,
        getTargetedJoinPageAccessFlags: loadSettings as never,
      }),
    ).resolves.toBe(true)
    expect(resolveRep).toHaveBeenCalledWith(
      { marker: 'admin' },
      expect.objectContaining({
        repId: 'brittwithbling.com',
        publicSiteSlug: null,
        strict: true,
      }),
    )
  })
})
