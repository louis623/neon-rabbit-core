import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const getPublishedSiteConfigMock = vi.fn()
const createQuestionMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/team-onboarding/repository', () => ({
  getPublishedSiteConfig: (...args: unknown[]) =>
    getPublishedSiteConfigMock(...args),
  createQuestion: (...args: unknown[]) => createQuestionMock(...args),
}))

function makeContext(siteSlug = 'britt-with-bling') {
  return {
    params: Promise.resolve({ siteSlug }),
  }
}

function makeRequest(body: unknown) {
  return new Request(
    'http://localhost/api/team-onboarding/sites/britt-with-bling/questions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
}

function makeAdminClientForSiteLookup({
  siteId = 'site-1',
  error = null,
}: {
  siteId?: string | null
  error?: unknown
} = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: siteId ? { id: siteId } : null,
    error,
  })
  const eqStatus = vi.fn().mockReturnValue({ maybeSingle })
  const eqSlug = vi.fn().mockReturnValue({ eq: eqStatus })
  const select = vi.fn().mockReturnValue({ eq: eqSlug })
  const from = vi.fn((table: string) => {
    if (table !== 'ss_team_onboarding_sites') {
      throw new Error(`Unexpected table ${table}`)
    }

    return { select }
  })

  return {
    client: { from } as never,
    spies: {
      from,
      select,
      eqSlug,
      eqStatus,
      maybeSingle,
    },
  }
}

describe('team onboarding public API routes', () => {
  beforeEach(() => {
    vi.resetModules()
    createAdminClientMock.mockReset()
    getPublishedSiteConfigMock.mockReset()
    createQuestionMock.mockReset()
  })

  it('GET returns config when found', async () => {
    const config = {
      site: {
        slug: 'britt-with-bling',
        title: 'Britt with Bling New Rep Path',
        teamName: 'Britt with Bling',
        repDisplayName: 'Brittany',
        customDomain: null,
      },
      resources: [],
      steps: [],
    }
    const admin = { admin: true }
    createAdminClientMock.mockReturnValue(admin)
    getPublishedSiteConfigMock.mockResolvedValue(config)
    const { GET } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/route'
    )

    const response = await GET(
      new Request('http://localhost/api/team-onboarding/sites/britt-with-bling'),
      makeContext(),
    )

    expect(createAdminClientMock).toHaveBeenCalledTimes(1)
    expect(getPublishedSiteConfigMock).toHaveBeenCalledWith(
      admin,
      'britt-with-bling',
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(config)
  })

  it('GET returns 404 when config is null', async () => {
    createAdminClientMock.mockReturnValue({ admin: true })
    getPublishedSiteConfigMock.mockResolvedValue(null)
    const { GET } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/route'
    )

    const response = await GET(
      new Request('http://localhost/api/team-onboarding/sites/missing-site'),
      makeContext('missing-site'),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Onboarding site not found.',
    })
  })

  it('POST returns 201 and creates a normalized question receipt', async () => {
    const { client, spies } = makeAdminClientForSiteLookup({ siteId: 'site-1' })
    createAdminClientMock.mockReturnValue(client)
    createQuestionMock.mockResolvedValue({
      id: 'question-1',
      status: 'open',
      createdAt: '2026-06-01T14:00:00.000Z',
    })
    const { POST } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/questions/route'
    )

    const response = await POST(
      makeRequest({
        stepId: 'step-1',
        questionText: '  Where should I start?  ',
      }),
      makeContext(),
    )

    expect(spies.from).toHaveBeenCalledWith('ss_team_onboarding_sites')
    expect(spies.select).toHaveBeenCalledWith('id')
    expect(spies.eqSlug).toHaveBeenCalledWith('slug', 'britt-with-bling')
    expect(spies.eqStatus).toHaveBeenCalledWith('status', 'published')
    expect(createQuestionMock).toHaveBeenCalledWith(client, {
      siteId: 'site-1',
      memberId: null,
      stepId: 'step-1',
      questionText: 'Where should I start?',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      id: 'question-1',
      status: 'open',
      createdAt: '2026-06-01T14:00:00.000Z',
    })
  })

  it('POST invalid or short question returns 400', async () => {
    createAdminClientMock.mockReturnValue(
      makeAdminClientForSiteLookup({ siteId: 'site-1' }).client,
    )
    const { POST } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/questions/route'
    )

    const invalidJsonResponse = await POST(
      new Request(
        'http://localhost/api/team-onboarding/sites/britt-with-bling/questions',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: '{invalid',
        },
      ),
      makeContext(),
    )
    const shortResponse = await POST(
      makeRequest({ questionText: 'hi' }),
      makeContext(),
    )

    expect(createQuestionMock).not.toHaveBeenCalled()
    expect(invalidJsonResponse.status).toBe(400)
    await expect(invalidJsonResponse.json()).resolves.toEqual({
      error: 'Invalid request payload.',
    })
    expect(shortResponse.status).toBe(400)
    await expect(shortResponse.json()).resolves.toEqual({
      error: 'Question text must be at least 3 characters.',
    })
  })

  it('POST missing site returns 404', async () => {
    createAdminClientMock.mockReturnValue(
      makeAdminClientForSiteLookup({ siteId: null }).client,
    )
    const { POST } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/questions/route'
    )

    const response = await POST(
      makeRequest({ questionText: 'Where should I start?' }),
      makeContext(),
    )

    expect(createQuestionMock).not.toHaveBeenCalled()
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Onboarding site not found.',
    })
  })

  it('POST createQuestion error returns 500', async () => {
    createAdminClientMock.mockReturnValue(
      makeAdminClientForSiteLookup({ siteId: 'site-1' }).client,
    )
    createQuestionMock.mockRejectedValue(new Error('insert failed'))
    const { POST } = await import(
      '@/app/api/team-onboarding/sites/[siteSlug]/questions/route'
    )

    const response = await POST(
      makeRequest({ questionText: 'Where should I start?' }),
      makeContext(),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to submit onboarding question.',
    })
  })
})
