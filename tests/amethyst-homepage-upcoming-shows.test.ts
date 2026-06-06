import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const listMyShowsMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/calendar', () => ({
  listMyShows: (...args: unknown[]) => listMyShowsMock(...args),
}))

import type { CalendarEvent } from '@/lib/services/types'
import {
  defaultAmethystHomepageEvents,
  loadAmethystHomepageUpcomingShows,
  mapCalendarEventToHomepageEvent,
} from '@/lib/amethyst/homepage-upcoming-shows'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    repId: 'rep-1',
    platform: 'TikTok',
    eventTime: '2099-05-01T20:00:00.000Z',
    timeZone: 'America/New_York',
    durationMinutes: 60,
    title: 'Friday Sparkles',
    description: 'Main show',
    discountCodes: [{ code: 'SPARKLE10', description: 'Ten percent off' }],
    featuredCollections: ['Birthday', 'OG'],
    isRecurring: false,
    recurrenceGroupId: null,
    recurrenceRule: null,
    status: 'scheduled',
    createdAt: '2099-04-01T12:00:00.000Z',
    updatedAt: '2099-04-01T12:00:00.000Z',
    ...overrides,
  }
}

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

beforeEach(() => {
  createAdminClientMock.mockReset()
  listMyShowsMock.mockReset()
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
})

describe('Amethyst homepage upcoming shows', () => {
  it('maps calendar events into homepage cards with collection links and stream buttons', () => {
    const mapped = mapCalendarEventToHomepageEvent(
      makeEvent({
        title: null,
        description: 'Friday Night Fizz',
        durationMinutes: 90,
      }),
      {
        tiktok: 'https://tiktok.com/@demo',
        facebook: '',
        youtube: 'https://youtube.com/@demo',
      },
      0,
    )

    expect(mapped).toMatchObject({
      id: 'event-1',
      title: 'Friday Night Fizz',
      eventTime: '2099-05-01T20:00:00.000Z',
      timeZone: 'America/New_York',
      durationMinutes: 90,
      featured: true,
      codes: [{ code: 'SPARKLE10', desc: 'Ten percent off' }],
      collections: [
        {
          label: 'Birthday',
          href: '/amethyst/Trade.html?collection=Birthday',
        },
        {
          label: 'OG',
          href: '/amethyst/Trade.html?collection=OG',
        },
      ],
      platforms: [
        {
          kind: 'tt',
          label: 'Join me on TikTok',
          href: 'https://tiktok.com/@demo',
        },
      ],
    })
  })

  it('loads the next two upcoming shows from the preview rep and keeps the first card featured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'rep-1',
        streaming_links: {
          tiktok: 'https://tiktok.com/@demo',
          facebook: 'https://facebook.com/demo',
        },
      },
      error: null,
    })
    const eq = vi.fn(() => ({ maybeSingle }))
    const select = vi.fn(() => ({ eq }))
    const admin = {
      from: vi.fn(() => ({ select })),
    }

    createAdminClientMock.mockReturnValue(admin)
    listMyShowsMock.mockResolvedValue({
      events: [
        makeEvent({ id: 'event-1', platform: 'TikTok' }),
        makeEvent({
          id: 'event-2',
          platform: 'Facebook',
          title: 'Sunday Sparkle Session',
        }),
        makeEvent({
          id: 'event-3',
          title: 'Should not render',
        }),
      ],
      totalCount: 3,
    })

    const result = await loadAmethystHomepageUpcomingShows()

    expect(createAdminClientMock).toHaveBeenCalledTimes(1)
    expect(listMyShowsMock).toHaveBeenCalledWith(admin, 'rep-1', {
      upcoming: true,
      limit: 2,
    })
    expect(result).toHaveLength(2)
    expect(result[0].featured).toBe(true)
    expect(result[1].featured).toBe(false)
    expect(result[1].platforms[0]).toMatchObject({
      kind: 'fb',
      href: 'https://facebook.com/demo',
    })
  })

  it('falls back to default homepage events when preview data cannot load', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const result = await loadAmethystHomepageUpcomingShows()

    expect(result).toEqual(defaultAmethystHomepageEvents)
    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(listMyShowsMock).not.toHaveBeenCalled()
  })

  it('returns empty events instead of demo events for targeted reps without data', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const result = await loadAmethystHomepageUpcomingShows({
      repId: 'rep-clean',
      targeted: true,
    })

    expect(result).toEqual([])
    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(listMyShowsMock).not.toHaveBeenCalled()
  })
})
