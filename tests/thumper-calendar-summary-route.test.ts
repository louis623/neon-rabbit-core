import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedThumperContextMock = vi.fn()
const listMyShowsMock = vi.fn()

vi.mock('@/lib/thumper/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedThumperContext: (...args: unknown[]) =>
    getAuthenticatedThumperContextMock(...args),
}))

vi.mock('@/lib/services/calendar', () => ({
  listMyShows: (...args: unknown[]) => listMyShowsMock(...args),
}))

import { GET } from '@/app/api/thumper/calendar-summary/route'
import { AuthError } from '@/lib/thumper/auth'

describe('GET /api/thumper/calendar-summary', () => {
  beforeEach(() => {
    getAuthenticatedThumperContextMock.mockReset()
    listMyShowsMock.mockReset()
  })

  it('returns upcoming and recent shows for the authenticated rep', async () => {
    getAuthenticatedThumperContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    listMyShowsMock
      .mockResolvedValueOnce({
        events: [{ id: 'show-1', title: 'Thursday reveal' }],
        totalCount: 1,
      })
      .mockResolvedValueOnce({
        events: [{ id: 'show-2', title: 'Launch party' }],
        totalCount: 1,
      })

    const response = await GET(
      new Request(
        'http://localhost/api/thumper/calendar-summary?upcoming=8&history=4',
      ),
    )

    expect(listMyShowsMock).toHaveBeenNthCalledWith(
      1,
      { marker: 'supabase' },
      'rep-1',
      {
        upcoming: true,
        limit: 8,
      },
    )
    expect(listMyShowsMock).toHaveBeenNthCalledWith(
      2,
      { marker: 'supabase' },
      'rep-1',
      {
        upcoming: false,
        limit: 4,
        status: ['completed', 'cancelled'],
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      upcomingEvents: [{ id: 'show-1', title: 'Thursday reveal' }],
      recentEvents: [{ id: 'show-2', title: 'Launch party' }],
    })
  })

  it('returns 400 for an invalid upcoming limit', async () => {
    const response = await GET(
      new Request('http://localhost/api/thumper/calendar-summary?upcoming=nope'),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'upcoming must be a whole number.',
    })
  })

  it('returns 400 for an invalid history limit', async () => {
    const response = await GET(
      new Request('http://localhost/api/thumper/calendar-summary?history=nope'),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'history must be a whole number.',
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedThumperContextMock.mockRejectedValueOnce(
      new AuthError('Not authenticated'),
    )

    const response = await GET(
      new Request('http://localhost/api/thumper/calendar-summary'),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })
})
