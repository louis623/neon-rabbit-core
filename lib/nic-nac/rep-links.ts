export function formatExtensionRepId(repId?: string | null) {
  const rawId = repId?.trim()
  if (!rawId) return 'Waiting for code'
  if (/^\d{6}$/.test(rawId)) return rawId

  let hash = 2166136261
  for (const char of rawId) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return String(hash % 1_000_000).padStart(6, '0')
}

type RepLinkTarget =
  | string
  | {
      repId?: string | null
      publicSiteSlug?: string | null
    }
  | null
  | undefined

function getRepId(target: RepLinkTarget) {
  return typeof target === 'string' ? target.trim() : target?.repId?.trim()
}

function getPublicSiteSlug(target: RepLinkTarget) {
  if (!target || typeof target === 'string') return null

  const cleanedSlug = target.publicSiteSlug?.trim().toLowerCase()
  return cleanedSlug || null
}

export function buildCustomerTradeBoardHref(target?: RepLinkTarget) {
  const publicSiteSlug = getPublicSiteSlug(target)
  if (publicSiteSlug) return `/${encodeURIComponent(publicSiteSlug)}/trade`

  const cleanedRepId = getRepId(target)
  if (!cleanedRepId) return '/amethyst/Trade.html'
  return `/amethyst/Trade.html?c=${encodeURIComponent(cleanedRepId)}`
}

export function buildCustomerSparkleSiteHref(target?: RepLinkTarget) {
  const publicSiteSlug = getPublicSiteSlug(target)
  if (publicSiteSlug) return `/${encodeURIComponent(publicSiteSlug)}`

  const cleanedRepId = getRepId(target)
  if (!cleanedRepId) return '/amethyst/Homepage.html'
  return `/amethyst/Homepage.html?c=${encodeURIComponent(cleanedRepId)}`
}
