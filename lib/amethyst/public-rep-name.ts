export function getPublicRepName(
  value: string | null | undefined,
  fallback = 'Your rep',
) {
  const cleaned = value?.trim().replace(/\s+/g, ' ')
  if (!cleaned) return fallback

  return cleaned.split(' ')[0] || fallback
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function redactPublicRepFullName(
  text: string | null | undefined,
  repName: string | null | undefined,
  fallback = 'Your rep',
) {
  const value = text ?? ''
  const cleanedRepName = repName?.trim().replace(/\s+/g, ' ')
  if (!cleanedRepName || !cleanedRepName.includes(' ')) return value

  const publicName = getPublicRepName(cleanedRepName, fallback)
  return value.replace(new RegExp(escapeRegExp(cleanedRepName), 'g'), publicName)
}
