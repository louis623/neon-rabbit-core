import { getAppUrl } from './config'

function parseOrigin(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function isSafeCheckoutReturnOrigin(origin: string, configuredOrigin: string) {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }

  if (url.protocol !== 'https:' && !isLocalhost(url.hostname)) return false
  if (origin === configuredOrigin) return true
  if (isLocalhost(url.hostname)) return true
  if (url.hostname === 'yoursparklesuite.com') return true
  if (url.hostname === 'www.yoursparklesuite.com') return true
  if (url.hostname.endsWith('.vercel.app')) return true

  return false
}

export function resolveCheckoutReturnOrigin(request: Request) {
  const configuredOrigin = parseOrigin(getAppUrl()) ?? 'http://localhost:3000'
  const requestOrigin = parseOrigin(request.url)
  const candidates = [
    parseOrigin(request.headers.get('origin')),
    requestOrigin,
  ]

  for (const candidate of candidates) {
    if (candidate && isSafeCheckoutReturnOrigin(candidate, configuredOrigin)) {
      return candidate
    }
  }

  return configuredOrigin
}
