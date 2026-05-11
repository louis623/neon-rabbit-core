import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const orderMock = vi.fn()
const limitMock = vi.fn(() => ({ order: orderMock }))
const selectMock = vi.fn(() => ({ limit: limitMock }))
const fromMock = vi.fn(() => ({ select: selectMock }))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import { GET } from '@/app/api/prelaunch/intake/review/route'

describe('GET /api/prelaunch/intake/review', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    fromMock.mockClear()
    selectMock.mockClear()
    limitMock.mockClear()
    orderMock.mockReset()
  })

  it('returns normalized intake submissions for Louis', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    orderMock.mockResolvedValueOnce({
      data: [
        {
          id: 'intake-1',
          full_name: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          business_name: 'Jamie Hart Jewelry',
          tiktok_handle: '@jamieh',
          instagram_handle: null,
          facebook_url: null,
          team_name: null,
          team_size: '1-5',
          primary_platform: 'tiktok',
          streaming_frequency: 'weekly',
          current_setup: 'Bio link',
          setup_goal: 'Cleaner hub',
          device_setup: 'phone_and_computer',
          brand_vibe: null,
          color_preferences: null,
          special_requests: null,
          intake_status: 'submitted',
          prequalification_status: 'qualified',
          fit_flags: [],
          waitlist_id: 'waitlist-1',
          scout_input_status: 'ready',
          created_at: '2026-05-09T18:00:00Z',
          updated_at: '2026-05-09T18:00:00Z',
        },
      ],
      error: null,
    })

    const response = await GET()

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_intake_submissions')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      submissions: [
        {
          id: 'intake-1',
          email: 'jamie@example.com',
          scoutInputStatus: 'ready',
        },
      ],
    })
  })

  it('returns 403 for authenticated non-operator reps', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-2',
      rep: { email: 'rep@example.com' },
    })

    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })
})
