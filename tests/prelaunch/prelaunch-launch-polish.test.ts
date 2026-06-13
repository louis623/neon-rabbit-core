import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import NotFound from '@/app/not-found'
import { GET as health } from '@/app/api/prelaunch/health/route'
import manifest from '@/app/manifest'
import nextConfig from '@/next.config'

describe('Sparkle Suite launch polish', () => {
  it('renders a branded not-found page with a path back to prelaunch', () => {
    const html = renderToStaticMarkup(createElement(NotFound))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('This page is not available yet.')
    expect(html).toContain('Back to Sparkle Suite')
    expect(html).toContain('href="/prelaunch"')
  })

  it('defines app manifest data that points launch surfaces to prelaunch', () => {
    expect(manifest()).toEqual(
      expect.objectContaining({
        name: 'Sparkle Suite',
        short_name: 'Sparkle Suite',
        start_url: '/prelaunch',
        display: 'browser',
        theme_color: '#ee2c9b',
        icons: expect.arrayContaining([
          expect.objectContaining({
            src: '/icon',
            sizes: '192x192',
            type: 'image/png',
          }),
        ]),
      }),
    )
  })

  it('exposes a lightweight prelaunch health endpoint for uptime monitoring', async () => {
    const response = await health()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        service: 'sparkle-suite-prelaunch',
        status: 'ready',
        readiness: expect.objectContaining({
          liveActionsEnabled: false,
          qrAssets: expect.objectContaining({
            approvedFlyerPath:
              '/sparkle-suite-social/exports/sparkle-suite-qr-flyer-tiktok-brand-image-v1.png',
          }),
          gates: expect.arrayContaining([
            expect.objectContaining({
              key: 'agreement',
              displayStatus: 'SignWell not configured',
            }),
          ]),
        }),
      }),
    )
  })

  it('sets conservative launch security headers globally', async () => {
    expect(nextConfig.headers).toBeTypeOf('function')

    const rules = await nextConfig.headers?.()
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/:path*',
          headers: expect.arrayContaining([
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
            },
          ]),
        }),
      ]),
    )
  })
})
