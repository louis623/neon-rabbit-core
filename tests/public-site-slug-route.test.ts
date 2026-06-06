import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.hoisted(() => vi.fn())
const resolveAmethystPreviewRepMock = vi.hoisted(() => vi.fn())
const loadAmethystPreviewTemplateDataMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/amethyst/preview-rep', () => ({
  resolveAmethystPreviewRep: resolveAmethystPreviewRepMock,
}))

vi.mock('@/lib/amethyst/preview-template-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/amethyst/preview-template-data')>()
  return {
    ...actual,
    loadAmethystPreviewTemplateData: loadAmethystPreviewTemplateDataMock,
  }
})

import { GET } from '@/app/[publicSiteSlug]/route'
import { DEFAULT_AMETHYST_APPEARANCE_PRESET } from '@/lib/amethyst/appearance-presets'
import { defaultAmethystHomepageTemplateData } from '@/lib/amethyst/homepage-template-data'
import { defaultAmethystJoinTemplateData } from '@/lib/amethyst/join-template-data'
import { defaultAmethystTradeTemplateData } from '@/lib/amethyst/trade-template-data'

const defaultAmethystPreviewTemplateData = {
  appearancePreset: DEFAULT_AMETHYST_APPEARANCE_PRESET,
  homepage: defaultAmethystHomepageTemplateData,
  trade: defaultAmethystTradeTemplateData,
  join: defaultAmethystJoinTemplateData,
}

describe('public site slug route', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    resolveAmethystPreviewRepMock.mockReset()
    loadAmethystPreviewTemplateDataMock.mockReset()
    loadAmethystPreviewTemplateDataMock.mockResolvedValue(defaultAmethystPreviewTemplateData)
  })

  it('returns 404 for invalid public site slugs', async () => {
    const response = await GET(
      new Request('https://www.yoursparklesuite.com/gracie-sparkle-party'),
      { params: Promise.resolve({ publicSiteSlug: 'gracie-sparkle-party' }) },
    )

    expect(response.status).toBe(404)
    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(resolveAmethystPreviewRepMock).not.toHaveBeenCalled()
  })

  it('returns 404 when no rep owns the public site slug', async () => {
    const admin = { marker: 'admin' }
    createAdminClientMock.mockReturnValue(admin)
    resolveAmethystPreviewRepMock.mockResolvedValue(null)

    const response = await GET(
      new Request('https://www.yoursparklesuite.com/graciesparkleparty'),
      { params: Promise.resolve({ publicSiteSlug: 'graciesparkleparty' }) },
    )

    expect(response.status).toBe(404)
    expect(resolveAmethystPreviewRepMock).toHaveBeenCalledWith(admin, {
      publicSiteSlug: 'graciesparkleparty',
      select: 'id, email',
    })
  })

  it('renders the homepage with slug canonicals and rep-targeted template data', async () => {
    const admin = { marker: 'admin' }
    createAdminClientMock.mockReturnValue(admin)
    resolveAmethystPreviewRepMock.mockResolvedValue({
      id: 'rep-gracie',
      email: 'gracie@example.test',
    })

    const response = await GET(
      new Request('https://www.yoursparklesuite.com/GracieSparkleParty'),
      { params: Promise.resolve({ publicSiteSlug: 'GracieSparkleParty' }) },
    )
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(loadAmethystPreviewTemplateDataMock).toHaveBeenCalledWith({
      repId: 'rep-gracie',
    })
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/graciesparkleparty" />',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://www.yoursparklesuite.com/graciesparkleparty" />',
    )
    expect(html).toContain(
      '"@id":"https://www.yoursparklesuite.com/graciesparkleparty#webpage"',
    )
    expect(html).toContain('/api/amethyst/homepage-template?c=rep-gracie')
    expect(html).not.toContain('?c=graciesparkleparty')
  })
})
