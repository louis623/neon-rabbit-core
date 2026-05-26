import { resolveAmethystRequestCustomDomainHost } from './host-routing'

export function resolveAmethystRequestRepId(request: Request) {
  const requestUrl = new URL(request.url)
  const directRepId =
    requestUrl.searchParams.get('c') ?? requestUrl.searchParams.get('repId')

  if (directRepId?.trim()) return directRepId.trim()

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererRepId =
        refererUrl.searchParams.get('c')?.trim() ||
        refererUrl.searchParams.get('repId')?.trim()
      if (refererRepId) return refererRepId
    } catch {
      return resolveAmethystRequestCustomDomainHost(request)
    }
  }

  return resolveAmethystRequestCustomDomainHost(request)
}
