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

export function buildCustomerTradeBoardHref(repId?: string | null) {
  const cleanedRepId = repId?.trim()
  if (!cleanedRepId) return '/amethyst/Trade.html'
  return `/amethyst/Trade.html?c=${encodeURIComponent(cleanedRepId)}`
}

export function buildCustomerSparkleSiteHref(repId?: string | null) {
  const cleanedRepId = repId?.trim()
  if (!cleanedRepId) return '/amethyst/Homepage.html'
  return `/amethyst/Homepage.html?c=${encodeURIComponent(cleanedRepId)}`
}
