import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isAmethystPlatformHost, normalizeAmethystCustomDomainCandidate } from '@/lib/amethyst/host-routing'

const CUSTOMER_SITE_ROUTES: Record<string, string> = {
  '/': '/customer-site/home',
  '/trade': '/customer-site/trade',
  '/join': '/customer-site/join',
  '/in-the-pantry': '/customer-site/in-the-pantry',
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

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/', '/trade', '/join', '/in-the-pantry'],
}
