const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

const PREVIEW_HOST_SUFFIXES = ['.vercel.app', '.vercel.sh', '.now.sh']

const PLATFORM_HOSTS = new Set([
  'yoursparklesuite.com',
  'www.yoursparklesuite.com',
])

function firstHost(value: string | null | undefined) {
  return value?.split(',')[0]?.trim() || null
}

export function normalizeAmethystHost(value: string | null | undefined) {
  const candidate = firstHost(value)
  if (!candidate) return null

  try {
    const url = new URL(
      /^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)
        ? candidate
        : `https://${candidate}`,
    )
    return url.hostname.trim().toLowerCase().replace(/\.$/, '') || null
  } catch {
    return null
  }
}

export function isAmethystLocalOrPreviewHost(value: string | null | undefined) {
  const host = normalizeAmethystHost(value)
  if (!host) return true
  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) return true
  return PREVIEW_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  )
}

export function isAmethystPlatformHost(value: string | null | undefined) {
  const host = normalizeAmethystHost(value)
  if (!host) return false
  return PLATFORM_HOSTS.has(host)
}

export function normalizeAmethystCustomDomainCandidate(
  value: string | null | undefined,
) {
  const host = normalizeAmethystHost(value)
  if (
    !host ||
    isAmethystLocalOrPreviewHost(host) ||
    isAmethystPlatformHost(host) ||
    !host.includes('.')
  ) {
    return null
  }

  return host
}

export function getAmethystCustomDomainCandidates(
  value: string | null | undefined,
) {
  const host = normalizeAmethystCustomDomainCandidate(value)
  if (!host) return []

  const alternates = host.startsWith('www.')
    ? [host.slice(4)]
    : [`www.${host}`]

  return Array.from(new Set([host, ...alternates]))
}

export function resolveAmethystRequestCustomDomainHost(request: Request) {
  const requestUrl = new URL(request.url)
  const candidates = [
    request.headers.get('host'),
    request.headers.get('x-forwarded-host'),
    requestUrl.host,
  ]

  for (const candidate of candidates) {
    const host = normalizeAmethystCustomDomainCandidate(candidate)
    if (host) return host
  }

  return null
}
