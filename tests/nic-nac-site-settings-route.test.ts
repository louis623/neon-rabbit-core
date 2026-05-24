import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getSiteSettingsDashboardMock = vi.fn()
const updateSiteSettingsDashboardMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/site-settings', () => ({
  getSiteSettingsDashboard: (...args: unknown[]) =>
    getSiteSettingsDashboardMock(...args),
  updateSiteSettingsDashboard: (...args: unknown[]) =>
    updateSiteSettingsDashboardMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/site-settings/route'
import { AuthError } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'

describe('site settings route', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getSiteSettingsDashboardMock.mockReset()
    updateSiteSettingsDashboardMock.mockReset()
  })

  it('returns the authenticated rep site settings dashboard payload', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getSiteSettingsDashboardMock.mockResolvedValueOnce({
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      bannerText: 'Going live tonight',
      bannerVisible: true,
      tickerText: '',
      tickerVisible: false,
      tagline: 'Live sparkle, zero stress.',
      heroImageUrl: '',
      heroAnimationType: 'zoom',
      teamName: 'Moonstone Squad',
      showJoinPage: true,
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'amethyst',
      socialHandles: { instagram: '@sparklebysasha' },
    })

    const response = await GET()

    expect(getSiteSettingsDashboardMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      bannerText: 'Going live tonight',
      bannerVisible: true,
      tickerText: '',
      tickerVisible: false,
      tagline: 'Live sparkle, zero stress.',
      heroImageUrl: '',
      heroAnimationType: 'zoom',
      teamName: 'Moonstone Squad',
      showJoinPage: true,
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'amethyst',
      socialHandles: { instagram: '@sparklebysasha' },
    })
  })

  it('saves site settings changes for the authenticated rep', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    updateSiteSettingsDashboardMock.mockResolvedValueOnce({
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      bannerText: 'Going live tonight',
      bannerVisible: true,
      tickerText: '',
      tickerVisible: false,
      tagline: 'Live sparkle, zero stress.',
      heroImageUrl: '',
      heroAnimationType: 'zoom',
      teamName: 'Moonstone Squad',
      showJoinPage: true,
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'sparkle_suite_morganite',
      socialHandles: { instagram: '@sparklebysasha' },
    })

    const payload = {
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      bannerText: 'Going live tonight',
      bannerVisible: true,
      tickerText: '',
      tickerVisible: false,
      tagline: 'Live sparkle, zero stress.',
      heroImageUrl: '',
      heroAnimationType: 'zoom',
      teamName: 'Moonstone Squad',
      showJoinPage: true,
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'sparkle_suite_morganite',
      socialHandles: { instagram: '@sparklebysasha' },
    }

    const response = await POST(
      new Request('http://localhost/api/nic-nac/site-settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    )

    expect(updateSiteSettingsDashboardMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      payload,
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      settings: {
        displayName: 'Louis',
        businessName: 'Sparkle by Sasha',
        email: 'hello@sparklebysasha.com',
        phone: '+19045551234',
        bannerText: 'Going live tonight',
        bannerVisible: true,
        tickerText: '',
        tickerVisible: false,
        tagline: 'Live sparkle, zero stress.',
        heroImageUrl: '',
        heroAnimationType: 'zoom',
        teamName: 'Moonstone Squad',
        showJoinPage: true,
        customerSiteTemplate: 'amethyst',
        appearancePreset: 'sparkle_suite_morganite',
        socialHandles: { instagram: '@sparklebysasha' },
      },
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedNicNacContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })

  it('returns a service error payload when a save is rejected', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    updateSiteSettingsDashboardMock.mockRejectedValueOnce(
      new ServiceError({
        code: 'INVALID_INPUT',
        message: 'invalid input',
        userMessage: 'Instagram handle is too long.',
        statusCode: 400,
      }),
    )

    const response = await POST(
      new Request('http://localhost/api/nic-nac/site-settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ socialHandles: { instagram: 'x'.repeat(300) } }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'Instagram handle is too long.',
    })
  })
})
