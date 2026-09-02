import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: () => createClientMock(),
}))

import { GET } from '@/app/api/internal/finder/control-center-nic-nac-usage/route'

const routeSource = readFileSync(
  'app/api/internal/finder/control-center-nic-nac-usage/route.ts',
  'utf8',
)

function request(token = 'usage-token', query = 'start=2026-09-01T00%3A00%3A00.000Z&end=2026-09-03T00%3A00%3A00.000Z') {
  return new Request(`https://finder.test/api/internal/finder/control-center-nic-nac-usage?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

function readClient(rows: unknown[]) {
  const result = Promise.resolve({ data: rows, error: null })
  const builder = {
    gte: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(() => result),
  }
  builder.gte.mockReturnValue(builder)
  builder.lt.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  return {
    from: vi.fn(() => ({ select: vi.fn(() => builder) })),
  }
}

describe('Finder Control Center usage bridge', () => {
  beforeEach(() => {
    vi.stubEnv('SPARKLE_FINDER_CONTROL_CENTER_USAGE_TOKEN', 'usage-token')
    createClientMock.mockReset()
  })

  it('fails closed when the bearer token is wrong', async () => {
    const response = await GET(request('wrong-token'))
    expect(response.status).toBe(401)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns only bounded cost telemetry fields with no-store headers', async () => {
    createClientMock.mockReturnValue(readClient([{ id: 'run-1', status: 'completed' }]))
    const response = await GET(request())
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(payload.rows).toEqual([{ id: 'run-1', status: 'completed' }])
    expect(routeSource).toContain('reasoning_effort,requested_intents')
  })

  it('rejects oversized reporting windows', async () => {
    const response = await GET(request('usage-token', 'start=2026-01-01T00%3A00%3A00.000Z&end=2026-09-01T00%3A00%3A00.000Z'))
    expect(response.status).toBe(400)
  })
})
