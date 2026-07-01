import { listMyShows } from '@/lib/services/calendar'
import type { CalendarEvent } from '@/lib/services/types'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'

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
  timeZone: string
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

function demoLiveEventTime() {
  return new Date(Date.now() - 10 * 60 * 1000).toISOString()
}

export const defaultAmethystHomepageEvents: AmethystHomepageEventCard[] = [
  {
    id: 'default-homepage-event-1',
    title: 'Live Now Demo Reveal',
    description: 'Local preview live-state demo',
    eventTime: demoLiveEventTime(),
    timeZone: 'America/New_York',
    durationMinutes: 90,
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
    timeZone: 'America/New_York',
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

const BLING_KITCHEN_SHOW_DAYS = [1, 3, 5] as const
const BLING_KITCHEN_SHOW_HOUR_ET = 19

function isBlingKitchenTarget(
  publicSiteSlug: string | null,
  email?: string | null,
) {
  return (
    publicSiteSlug === BLING_KITCHEN_PROFILE.publicSiteSlug ||
    email?.trim().toLowerCase() === BLING_KITCHEN_PROFILE.email
  )
}

function getEasternParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  }
}

function easternDateToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
) {
  const initial = new Date(Date.UTC(year, month - 1, day, hour, 0, 0))
  const eastern = getEasternParts(initial)
  const offsetMs =
    Date.UTC(
      eastern.year,
      eastern.month - 1,
      eastern.day,
      eastern.hour,
      eastern.minute,
      eastern.second,
    ) - initial.getTime()

  return new Date(initial.getTime() - offsetMs).toISOString()
}

function buildBlingKitchenFallbackEvents(
  limit: number,
  now = new Date(),
): AmethystHomepageEventCard[] {
  const easternNow = getEasternParts(now)
  const cursor = new Date(
    Date.UTC(easternNow.year, easternNow.month - 1, easternNow.day, 12, 0, 0),
  )
  const events: AmethystHomepageEventCard[] = []

  for (let offset = 0; offset < 21 && events.length < limit; offset += 1) {
    const candidate = new Date(cursor)
    candidate.setUTCDate(cursor.getUTCDate() + offset)
    const dayOfWeek = candidate.getUTCDay()
    if (!BLING_KITCHEN_SHOW_DAYS.includes(dayOfWeek as 1 | 3 | 5)) continue

    const year = candidate.getUTCFullYear()
    const month = candidate.getUTCMonth() + 1
    const day = candidate.getUTCDate()
    const eventTime = easternDateToUtcIso(
      year,
      month,
      day,
      BLING_KITCHEN_SHOW_HOUR_ET,
    )
    if (Date.parse(eventTime) <= now.getTime()) continue

    events.push({
      id: `bling-kitchen-fallback-${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      title: 'BlingKitchen Live Reveal',
      description:
        'Join Heather for BlingKitchen live jewelry reveals from the heart of the home.',
      eventTime,
      timeZone: 'America/New_York',
      durationMinutes: 90,
      featured: events.length === 0,
      codes: [],
      collections: [],
      platforms: [
        {
          kind: 'tt',
          label: 'Join me on TikTok',
          href: BLING_KITCHEN_PROFILE.tiktokUrl,
        },
        {
          kind: 'fb',
          label: 'Watch on Facebook Live',
          href: BLING_KITCHEN_PROFILE.facebookVipUrl,
        },
      ],
    })
  }

  return events
}

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
    timeZone: event.timeZone,
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
  publicSiteSlug?: string | null
  targeted?: boolean
}

export async function loadAmethystHomepageUpcomingShows(
  options: LoadAmethystHomepageUpcomingShowsOptions | number = {},
): Promise<AmethystHomepageEventCard[]> {
  const limit = typeof options === 'number' ? options : options.limit ?? 2
  const repId = typeof options === 'number' ? null : options.repId?.trim() ?? null
  const publicSiteSlug =
    typeof options === 'number'
      ? null
      : options.publicSiteSlug?.trim().toLowerCase() ?? null
  const targeted =
    typeof options === 'number'
      ? false
      : Boolean(options.targeted || repId || publicSiteSlug)

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    if (targeted && isBlingKitchenTarget(publicSiteSlug)) {
      return buildBlingKitchenFallbackEvents(limit)
    }
    return targeted ? [] : defaultAmethystHomepageEvents
  }

  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      publicSiteSlug,
      repId,
      select: 'id, email, streaming_links',
    })

    const isBlingKitchen = isBlingKitchenTarget(publicSiteSlug, rep?.email)

    if (!rep?.id) {
      if (isBlingKitchen) return buildBlingKitchenFallbackEvents(limit)
      return targeted ? [] : defaultAmethystHomepageEvents
    }

    const result = await listMyShows(admin as never, rep.id as string, {
      upcoming: true,
      limit,
    })

    if (!result.events.length) {
      if (isBlingKitchen) return buildBlingKitchenFallbackEvents(limit)
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
