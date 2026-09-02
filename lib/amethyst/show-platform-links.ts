export type CustomerShowPlatform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'whatnot'

export interface CustomerShowPlatformLink {
  kind: CustomerShowPlatform
  label: string
  href: string
}

const PLATFORM_LABELS: Record<CustomerShowPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  whatnot: 'Whatnot',
}

const PLATFORM_MATCHERS: Array<[CustomerShowPlatform, RegExp]> = [
  ['tiktok', /\btik[\s-]?tok\b/i],
  ['instagram', /\b(?:instagram|insta|ig)\b/i],
  ['youtube', /\b(?:youtube|youtu\.be)\b/i],
  ['facebook', /\b(?:facebook|fb)(?:\s+live)?\b/i],
  ['whatnot', /\bwhatnot\b/i],
]

function asSocialHandles(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, handle]) => [key.trim().toLowerCase(), typeof handle === 'string' ? handle.trim() : ''] as const)
      .filter(([key, handle]) => Boolean(key && handle && handle !== '#')),
  )
}

function socialHandleUrl(platform: CustomerShowPlatform, value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '#') return null

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : (() => {
        const handle = trimmed.replace(/^@/, '')
        if (!/^[A-Za-z0-9._-]+$/.test(handle)) return ''
        if (platform === 'tiktok') return `https://www.tiktok.com/@${handle}`
        if (platform === 'instagram') return `https://www.instagram.com/${handle}`
        if (platform === 'facebook') return `https://www.facebook.com/${handle}`
        if (platform === 'youtube') return `https://www.youtube.com/@${handle}`
        return `https://www.whatnot.com/user/${handle}`
      })()

  try {
    const parsed = new URL(candidate)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const allowedHosts: Record<CustomerShowPlatform, string[]> = {
      tiktok: ['tiktok.com'],
      instagram: ['instagram.com'],
      youtube: ['youtube.com', 'youtu.be'],
      facebook: ['facebook.com', 'fb.com', 'fb.watch'],
      whatnot: ['whatnot.com'],
    }
    const belongsToPlatform = allowedHosts[platform].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    )
    return parsed.protocol === 'https:' && belongsToPlatform ? parsed.toString() : null
  } catch {
    return null
  }
}

export function requestedCustomerShowPlatforms(value: string): CustomerShowPlatform[] {
  const requested: CustomerShowPlatform[] = []
  for (const [platform, matcher] of PLATFORM_MATCHERS) {
    if (matcher.test(value) && !requested.includes(platform)) requested.push(platform)
  }
  return requested
}

export function resolveCustomerShowPlatformLinks(
  eventPlatform: string,
  socialHandles: unknown,
): CustomerShowPlatformLink[] {
  const handles = asSocialHandles(socialHandles)
  return requestedCustomerShowPlatforms(eventPlatform).flatMap((platform) => {
    const href = socialHandleUrl(platform, handles[platform] ?? '')
    return href
      ? [{ kind: platform, label: `Watch on ${PLATFORM_LABELS[platform]}`, href }]
      : []
  })
}

export function missingCustomerShowPlatforms(
  eventPlatform: string,
  socialHandles: unknown,
): CustomerShowPlatform[] {
  const configured = new Set(
    resolveCustomerShowPlatformLinks(eventPlatform, socialHandles).map((link) => link.kind),
  )
  return requestedCustomerShowPlatforms(eventPlatform).filter((platform) => !configured.has(platform))
}
