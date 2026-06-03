export function safeRelativeRedirectPath(path: string | null | undefined) {
  const candidate = path ?? ''
  let decodedCandidate = ''
  try {
    decodedCandidate = decodeURIComponent(candidate)
  } catch {
    return '/nic-nac'
  }

  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    decodedCandidate.includes('\\')
  ) {
    return '/nic-nac'
  }

  const origin = 'http://localhost'
  const parsed = new URL(candidate, origin)
  if (parsed.origin !== origin) {
    return '/nic-nac'
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}
