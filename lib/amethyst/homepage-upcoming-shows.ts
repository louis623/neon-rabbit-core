import { listMyShows } from '@/lib/services/calendar'
import type { CalendarEvent } from '@/lib/services/types'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AmethystHomepageEventCode {
  code: string
  desc: string
}

export interface AmethystHomepageEventCollectionLink {
  label: string
  href: string
}

export interface AmethystHomepageEventPlatformLink {
  kind: 'tt' | 'fb'
  label: string
  href: string
}

export interface AmethystHomepageEventCard {
  id: string
  title: string
  description: string | null
  eventTime: string
  durationMinutes: number
  featured: boolean
  codes: AmethystHomepageEventCode[]
  collections: AmethystHomepageEventCollectionLink[]
  platforms: AmethystHomepageEventPlatformLink[]
}

const PLATFORM_LINKS = {
  tiktok: { kind: 'tt', label: 'Join me on TikTok' },
  facebook: { kind: 'fb', label: 'Watch on Facebook Live' },
} as const

export const defaultAmethystHomepageEvents: AmethystHomepageEventCard[] = [
  {
    id: 'default-homepage-event-1',
    title: 'Unicorn Magic Drop',
    description: 'Main live reveal',
    eventTime: '2099-11-12T20:00:00.000Z',
    durationMinutes: 60,
    featured: true,
    codes: [
      { code: 'UNICORN15', desc: '15% off Unicorn tier boxes' },
      { code: 'FREESHIP75', desc: 'Free shipping on orders $75+' },
    ],
    collections: [
      {
        label: 'Citrine Sun Series',
        href: '/amethyst/Trade.html?collection=Citrine%20Sun%20Series',
      },
      {
        label: 'Holiday Gift Guide',
        href: '/amethyst/Trade.html?collection=Holiday%20Gift%20Guide',
      },
    ],
    platforms: [
      {
        kind: 'tt',
        label: 'Join me on TikTok',
        href: '#',
      },
      {
        kind: 'fb',
        label: 'Watch on Facebook Live',
        href: '#',
      },
    ],
  },
  {
    id: 'default-homepage-event-2',
    title: 'Saturday Sparkle Brunch',
    description: 'Weekend bonus show',
    eventTime: '2099-11-16T13:00:00.000Z',
    durationMinutes: 60,
    featured: false,
    codes: [{ code: 'BRUNCH10', desc: '10% off Saturday show purchases' }],
    collections: [
      {
        label: 'Diamond Territory',
        href: '/amethyst/Trade.html?collection=Diamond%20Territory',
      },
    ],
    platforms: [
      {
        kind: 'tt',
        label: 'Join me on TikTok',
        href: '#',
      },
    ],
  },
]

function normalizeStreamingLinks(
  streamingLinks: unknown,
): Record<string, string> {
  if (!streamingLinks || typeof streamingLinks !== 'object') {
    return {}
  }

  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(streamingLinks)) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed) continue
    normalized[key.toLowerCase()] = trimmed
  }

  return normalized
}

function normalizePlatformKey(platform: string | null): 'tiktok' | 'facebook' | null {
  const normalized = platform?.trim().toLowerCase() ?? ''
  if (normalized.includes('tik')) return 'tiktok'
  if (normalized.includes('face')) return 'facebook'
  return null
}

function buildPlatformLinks(
  primaryPlatform: string | null,
  streamingLinks: Record<string, string>,
): AmethystHomepageEventPlatformLink[] {
  const primaryKey = normalizePlatformKey(primaryPlatform)
  const orderedKeys = primaryKey
    ? [
        primaryKey,
        ...Object.keys(PLATFORM_LINKS).filter((key) => key !== primaryKey),
      ]
    : Object.keys(PLATFORM_LINKS)

  return orderedKeys.flatMap((key) => {
    const href = streamingLinks[key]
    if (!href) return []

    const config = PLATFORM_LINKS[key as keyof typeof PLATFORM_LINKS]
    return [
      {
        kind: config.kind,
        label: config.label,
        href,
      },
    ]
  })
}

function mapCollectionLinks(collections: string[] | null | undefined) {
  return (collections ?? []).map((collection) => ({
    label: collection,
    href: `/amethyst/Trade.html?collection=${encodeURIComponent(collection)}`,
  }))
}

function normalizeEventTitle(event: CalendarEvent) {
  const title = event.title?.trim()
  if (title) return title

  const description = event.description?.trim()
  if (description) return description

  return 'Upcoming live reveal'
}

export function mapCalendarEventToHomepageEvent(
  event: CalendarEvent,
  streamingLinks: unknown,
  index: number,
): AmethystHomepageEventCard {
  const normalizedLinks = normalizeStreamingLinks(streamingLinks)

  return {
    id: event.id,
    title: normalizeEventTitle(event),
    description: event.description,
    eventTime: event.eventTime,
    durationMinutes: event.durationMinutes,
    featured: index === 0,
    codes: event.discountCodes.map((discount) => ({
      code: discount.code,
      desc: discount.description,
    })),
    collections: mapCollectionLinks(event.featuredCollections),
    platforms: buildPlatformLinks(event.platform, normalizedLinks),
  }
}

interface LoadAmethystHomepageUpcomingShowsOptions {
  limit?: number
  repId?: string | null
  targeted?: boolean
}

export async function loadAmethystHomepageUpcomingShows(
  options: LoadAmethystHomepageUpcomingShowsOptions | number = {},
): Promise<AmethystHomepageEventCard[]> {
  const limit = typeof options === 'number' ? options : options.limit ?? 2
  const repId = typeof options === 'number' ? null : options.repId
  const targeted = typeof options === 'number' ? false : Boolean(options.targeted || repId)

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return targeted ? [] : defaultAmethystHomepageEvents
  }

  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      repId,
      select: 'id, email, streaming_links',
    })

    if (!rep?.id) {
      return targeted ? [] : defaultAmethystHomepageEvents
    }

    const result = await listMyShows(admin as never, rep.id as string, {
      upcoming: true,
      limit,
    })

    if (!result.events.length) {
      return targeted ? [] : defaultAmethystHomepageEvents
    }

    return result.events
      .slice(0, limit)
      .map((event, index) =>
        mapCalendarEventToHomepageEvent(
          event,
          (rep as { streaming_links?: unknown }).streaming_links,
          index,
        ),
      )
  } catch {
    return targeted ? [] : defaultAmethystHomepageEvents
  }
}
