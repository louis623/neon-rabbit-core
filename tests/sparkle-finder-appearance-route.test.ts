import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAccess = vi.fn()
const loadAppearance = vi.fn()
const saveAppearance = vi.fn()
const createAdmin = vi.fn(() => ({ marker: 'admin' }))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: class AuthError extends Error {},
  OperatorAuthError: class OperatorAuthError extends Error {},
  getControlCenterAccess: (...args: unknown[]) => getAccess(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => createAdmin() }))
vi.mock('@/lib/sparkle-finder/appearance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/sparkle-finder/appearance')>()),
  loadSparkleFinderAppearanceSetting: (...args: unknown[]) => loadAppearance(...args),
  saveSparkleFinderAppearanceSetting: (...args: unknown[]) => saveAppearance(...args),
}))

import { GET as getPublicAppearance } from '@/app/api/public/finder/appearance/route'
import { PATCH } from '@/app/api/control-center/finder-appearance/route'
import { AuthError } from '@/lib/supabase/operator-auth'

describe('Sparkle Finder appearance routes', () => {
  beforeEach(() => {
    getAccess.mockReset()
    loadAppearance.mockReset()
    saveAppearance.mockReset()
    createAdmin.mockClear()
    getAccess.mockResolvedValue({
      operator: { email: 'operator@example.com', repId: 'operator-1' },
    })
    loadAppearance.mockResolvedValue({ schemaVersion: 1, preset: 'amethyst' })
    saveAppearance.mockResolvedValue({ schemaVersion: 1, preset: 'amethyst' })
  })

  it('publishes the selected appearance without exposing operator data', async () => {
    const response = await getPublicAppearance()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ schemaVersion: 1, preset: 'amethyst' })
    expect(response.headers.get('cache-control')).toContain('s-maxage=30')
  })

  it('requires Control Center access before changing Finder appearance', async () => {
    const response = await PATCH(new Request(
      'http://localhost/api/control-center/finder-appearance',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appearancePreset: 'amethyst' }),
      },
    ))

    expect(response.status).toBe(200)
    expect(saveAppearance).toHaveBeenCalledWith(
      { marker: 'admin' },
      'amethyst',
      'operator@example.com',
    )

    getAccess.mockRejectedValueOnce(new AuthError('sign in'))
    const unauthorized = await PATCH(new Request(
      'http://localhost/api/control-center/finder-appearance',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appearancePreset: 'moonstone' }),
      },
    ))
    expect(unauthorized.status).toBe(401)
  })

  it.each(['not-a-skin', 'gnome_garden'])('rejects unsupported Finder preset %s', async (appearancePreset) => {
    const response = await PATCH(new Request(
      'http://localhost/api/control-center/finder-appearance',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appearancePreset }),
      },
    ))

    expect(response.status).toBe(400)
    expect(saveAppearance).not.toHaveBeenCalled()
  })
})
