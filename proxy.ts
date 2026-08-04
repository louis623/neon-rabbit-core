import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isAmethystPlatformHost, normalizeAmethystCustomDomainCandidate } from '@/lib/amethyst/host-routing'

const CUSTOMER_SITE_ROUTES: Record<string, string> = {
  '/': '/amethyst/Homepage.html',
  '/trade': '/amethyst/Trade.html',
  '/join': '/amethyst/Join.html',
  '/in-the-pantry': '/amethyst/Pantry.html',
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!normalizeAmethystCustomDomainCandidate(host) || isAmethystPlatformHost(host)) {
    return NextResponse.next()
  }

  const publicAssetPath = CUSTOMER_SITE_ROUTES[request.nextUrl.pathname]
  if (!publicAssetPath) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = publicAssetPath
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-sparkle-customer-site-path', request.nextUrl.pathname)

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/', '/trade', '/join', '/in-the-pantry'],
}
