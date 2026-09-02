import type {
  StreamingDestination,
  StreamingDestinationInput,
} from './types'

export const MAX_STREAMING_DESTINATIONS = 5

const PLATFORM_LABELS = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  whatnot: 'Whatnot',
} as const

export type SupportedStreamingPlatform = keyof typeof PLATFORM_LABELS

export class StreamingDestinationValidationError extends Error {}

function normalizePlatform(value: string): SupportedStreamingPlatform | 'custom' {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (normalized === 'tiktok') return 'tiktok'
  if (normalized === 'instagram' || normalized === 'ig') return 'instagram'
  if (normalized === 'youtube' || normalized === 'youtu') return 'youtube'
  if (normalized === 'facebook' || normalized === 'facebooklive' || normalized === 'fb') return 'facebook'
  if (normalized === 'whatnot') return 'whatnot'
  return 'custom'
}

function normalizeHttpsUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new StreamingDestinationValidationError('Each streaming destination needs a URL.')
  }

  let parsed: URL
  try {
    parsed = new URL(value.trim())
  } catch {
    throw new StreamingDestinationValidationError('Each streaming destination needs a valid HTTPS URL.')
  }

  if (parsed.protocol !== 'https:') {
    throw new StreamingDestinationValidationError('Streaming destination URLs must use HTTPS.')
  }

  return parsed.toString()
}

export function normalizeStreamingDestinations(value: unknown): StreamingDestination[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new StreamingDestinationValidationError('streamingDestinations must be a list.')
  }
  if (value.length > MAX_STREAMING_DESTINATIONS) {
    throw new StreamingDestinationValidationError(
      `A show can have at most ${MAX_STREAMING_DESTINATIONS} streaming destinations.`,
    )
  }

  const destinations: StreamingDestination[] = []
  const seen = new Set<string>()
  for (const candidate of value as StreamingDestinationInput[]) {
    if (!candidate || typeof candidate !== 'object') {
      throw new StreamingDestinationValidationError('Each streaming destination must include a platform and URL.')
    }
    if (typeof candidate.platform !== 'string' || !candidate.platform.trim()) {
      throw new StreamingDestinationValidationError('Each streaming destination needs a platform.')
    }

    const platform = normalizePlatform(candidate.platform)
    const url = normalizeHttpsUrl(candidate.url)
    const suppliedLabel = typeof candidate.label === 'string' ? candidate.label.trim() : ''
    if (platform === 'custom' && !suppliedLabel) {
      throw new StreamingDestinationValidationError('A custom streaming destination needs a display label.')
    }

    const label = platform === 'custom' ? suppliedLabel : undefined
    const duplicateKey = `${platform}|${url}`
    if (seen.has(duplicateKey)) continue
    seen.add(duplicateKey)
    destinations.push(label ? { platform, url, label } : { platform, url })
  }

  return destinations
}

export function streamingDestinationLabel(destination: StreamingDestination): string {
  if (destination.platform === 'custom') return destination.label ?? 'Live stream'
  return PLATFORM_LABELS[destination.platform]
}
