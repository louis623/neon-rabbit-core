import { beforeEach, describe, expect, it, vi } from 'vitest'

const { readAvailability } = vi.hoisted(() => ({ readAvailability: vi.fn() }))
vi.mock('@/lib/sparkle-suite/founder-availability-service', () => ({ getFounderAvailability: readAvailability }))
import { GET } from '@/app/api/public/founder-availability/route'

describe('anonymous founder availability route', () => {
  beforeEach(() => vi.clearAllMocks())
  it.each(['available', 'full'] as const)('returns the aggregate without caching for %s', async status => {
    const body = { status, remaining: status === 'full' ? 0 : 19, checkedAt: '2026-09-05T16:00:00.000Z' }
    readAvailability.mockResolvedValue(body)
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual(body)
  })
  it('returns a generic unavailable contract, not an invented number', async () => {
    readAvailability.mockResolvedValue({ status: 'unavailable', remaining: null, checkedAt: null })
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable', remaining: null, checkedAt: null })
  })
})
