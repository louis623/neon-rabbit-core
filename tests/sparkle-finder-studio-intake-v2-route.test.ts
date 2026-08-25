import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()
const createAdminClientMock = vi.fn(() => ({ rpc: rpcMock }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

import { POST } from '@/app/api/internal/finder/jewelry-intake/v2/route'

describe('Sparkle Finder Studio intake v2 route', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    rpcMock.mockReset()
    createAdminClientMock.mockClear()
  })

  it('fails closed when the server-to-server token is absent or wrong', async () => {
    const notConfigured = await POST(request('{}'))
    expect(notConfigured.status).toBe(503)
    expect(createAdminClientMock).not.toHaveBeenCalled()

    vi.stubEnv('SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN', 'finder-token')
    const unauthorized = await POST(request('{}', 'wrong-token'))
    expect(unauthorized.status).toBe(401)
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON and oversized bodies before creating an admin client', async () => {
    vi.stubEnv('SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN', 'finder-token')

    const malformed = await POST(request('{not-json', 'finder-token'))
    expect(malformed.status).toBe(400)
    await expect(malformed.json()).resolves.toMatchObject({
      schemaVersion: 2,
      ok: false,
      status: 'invalid_details',
      errorCode: 'invalid_json',
    })

    const oversized = await POST(request(`{"padding":"${'x'.repeat(70_000)}"}`, 'finder-token'))
    expect(oversized.status).toBe(413)
    await expect(oversized.json()).resolves.toMatchObject({ errorCode: 'request_too_large' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('maps strict contract failures to stable HTTP statuses and disables caching', async () => {
    vi.stubEnv('SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN', 'finder-token')

    const invalid = await POST(
      request(
        JSON.stringify({
          schemaVersion: 3,
          sourceProduct: 'sparkle_finder',
          action: 'resolve',
        }),
        'finder-token',
      ),
    )
    expect(invalid.status).toBe(400)
    expect(invalid.headers.get('cache-control')).toBe('no-store')
    expect(createAdminClientMock).toHaveBeenCalledTimes(1)

    rpcMock.mockResolvedValueOnce({ data: { decision: 'missing' }, error: null })
    const missing = await POST(
      request(
        JSON.stringify({
          schemaVersion: 2,
          sourceProduct: 'sparkle_finder',
          finderSubmissionId: '11111111-1111-4111-8111-111111111111',
          action: 'resume',
        }),
        'finder-token',
      ),
    )
    expect(missing.status).toBe(409)
    await expect(missing.json()).resolves.toMatchObject({
      ok: false,
      status: 'invalid_selection',
      errorCode: 'submission_not_resolved',
    })
  })

  it('converts admin-client setup failures into a typed no-store database failure', async () => {
    vi.stubEnv('SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN', 'finder-token')
    createAdminClientMock.mockImplementationOnce(() => {
      throw new Error('private service-role configuration')
    })

    const response = await POST(request(JSON.stringify({
      schemaVersion: 2,
      sourceProduct: 'sparkle_finder',
      finderSubmissionId: '11111111-1111-4111-8111-111111111111',
      action: 'resume',
    }), 'finder-token'))

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const result = await response.json()
    expect(result).toMatchObject({
      schemaVersion: 2,
      ok: false,
      status: 'database_failed',
      retryable: true,
      errorCode: 'intake_service_unavailable',
    })
    expect(JSON.stringify(result)).not.toContain('service-role')
  })
})

function request(body: string, token?: string) {
  return new Request('http://localhost/api/internal/finder/jewelry-intake/v2', {
    body,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}
