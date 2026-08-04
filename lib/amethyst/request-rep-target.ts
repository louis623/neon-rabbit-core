import { resolveAmethystRequestCustomDomainHost } from './host-routing'
import { validatePublicSiteSlug } from '@/lib/public-site/show-link'

export type AmethystRequestTargetSource =
  | 'query-rep-id'
  | 'query-public-site-slug'
  | 'referer-rep-id'
  | 'referer-public-site-slug'
  | 'custom-domain'
  | null

export interface AmethystRequestTarget {
  repId: string | null
  publicSiteSlug: string | null
  customDomain: string | null
  source: AmethystRequestTargetSource
  targeted: boolean
}

function emptyTarget(): AmethystRequestTarget {
  return {
    customDomain: null,
    publicSiteSlug: null,
    repId: null,
    source: null,
    targeted: false,
  }
}

function readRepIdFromUrl(url: URL) {
  return (
    url.searchParams.get('c')?.trim() ||
    url.searchParams.get('repId')?.trim() ||
    null
  )
}

export function readPublicSiteSlugFromUrl(url: URL) {
  const querySlug = url.searchParams.get('publicSiteSlug')?.trim().toLowerCase()
  if (querySlug && validatePublicSiteSlug(querySlug).ok) return querySlug

  const firstSegment = url.pathname.split('/').filter(Boolean)[0]
  if (!firstSegment) return null

  // API paths are not customer-site slugs. On a custom domain, treating
  // `/api/...` as a slug would hide the host-based customer target.
  if (firstSegment.toLowerCase() === 'api') return null

  let decodedSegment = ''
  try {
    decodedSegment = decodeURIComponent(firstSegment).trim().toLowerCase()
  } catch {
    return null
  }

  return validatePublicSiteSlug(decodedSegment).ok ? decodedSegment : null
}

function targetFromRepId(
  repId: string,
  source: Extract<AmethystRequestTargetSource, 'query-rep-id' | 'referer-rep-id'>,
  publicSiteSlug: string | null = null,
): AmethystRequestTarget {
  return {
    customDomain: null,
    publicSiteSlug,
    repId,
    source,
    targeted: true,
  }
}

function targetFromPublicSiteSlug(
  publicSiteSlug: string,
  source: Extract<
    AmethystRequestTargetSource,
    'query-public-site-slug' | 'referer-public-site-slug'
  >,
): AmethystRequestTarget {
  return {
    customDomain: null,
    publicSiteSlug,
    repId: null,
    source,
    targeted: true,
  }
}

function targetFromCustomDomain(customDomain: string): AmethystRequestTarget {
  return {
    customDomain,
    publicSiteSlug: null,
    repId: null,
    source: 'custom-domain',
    targeted: true,
  }
}

export function resolveAmethystRequestTarget(request: Request): AmethystRequestTarget {
  const requestUrl = new URL(request.url)
  const directRepId = readRepIdFromUrl(requestUrl)
  const directPublicSiteSlug = readPublicSiteSlugFromUrl(requestUrl)

  if (directRepId) {
    return targetFromRepId(directRepId, 'query-rep-id', directPublicSiteSlug)
  }

  if (directPublicSiteSlug) {
    return targetFromPublicSiteSlug(
      directPublicSiteSlug,
      'query-public-site-slug',
    )
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererRepId = readRepIdFromUrl(refererUrl)
      const refererPublicSiteSlug = readPublicSiteSlugFromUrl(refererUrl)
      if (refererRepId) {
        return targetFromRepId(
          refererRepId,
          'referer-rep-id',
          refererPublicSiteSlug,
        )
      }
      if (refererPublicSiteSlug) {
        return targetFromPublicSiteSlug(
          refererPublicSiteSlug,
          'referer-public-site-slug',
        )
      }
    } catch {
      const customDomain = resolveAmethystRequestCustomDomainHost(request)
      return customDomain ? targetFromCustomDomain(customDomain) : emptyTarget()
    }
  }

  const customDomain = resolveAmethystRequestCustomDomainHost(request)
  return customDomain ? targetFromCustomDomain(customDomain) : emptyTarget()
}

export function resolveAmethystRequestRepId(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  return target.repId ?? target.customDomain
}
