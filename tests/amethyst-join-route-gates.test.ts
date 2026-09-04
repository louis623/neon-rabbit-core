import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveRep = vi.fn()
const loadSettings = vi.fn()

vi.mock('@/lib/amethyst/preview-rep', () => ({
  resolveAmethystPreviewRep: (...args: unknown[]) => resolveRep(...args),
}))

vi.mock('@/lib/services/site-settings', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/site-settings')>(
    '@/lib/services/site-settings',
  )
  return {
    ...actual,
    getSiteSettingsDashboard: (...args: unknown[]) => loadSettings(...args),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ marker: 'admin' })),
}))

import { GET as getStaticAsset } from '@/app/amethyst/[...asset]/route'
import { GET as getJoinTemplate } from '@/app/api/amethyst/join-template/route'

describe('targeted Join route gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveRep.mockResolvedValue({ id: 'rep-1', email: 'rep@example.com' })
    loadSettings.mockResolvedValue({
      joinTeamAccessEnabled: true,
      showJoinPage: false,
    })
  })

  it('blocks the targeted legacy Join asset when the rep hides the page', async () => {
    const response = await getStaticAsset(
      new Request('https://preview.example/amethyst/Join.html?c=rep-1'),
      { params: Promise.resolve({ asset: ['Join.html'] }) },
    )

    expect(response.status).toBe(404)
  })

  it('blocks a custom-domain Join asset when either visibility gate is off', async () => {
    loadSettings.mockResolvedValue({
      joinTeamAccessEnabled: false,
      showJoinPage: true,
    })
    const response = await getStaticAsset(
      new Request('https://customer.example/amethyst/Join.html'),
      { params: Promise.resolve({ asset: ['Join.html'] }) },
    )

    expect(response.status).toBe(404)
  })

  it('blocks the targeted Join bootstrap API before loading customer data', async () => {
    const response = await getJoinTemplate(
      new Request('https://preview.example/api/amethyst/join-template?c=rep-1'),
    )

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Not found')
  })
})
