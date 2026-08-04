import { describe, expect, it } from 'vitest'
import { getRewrittenUrl, isRewrite } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'

import { proxy } from '@/proxy'

describe('custom-domain customer site proxy', () => {
  it.each([
    ['/', '/amethyst/Homepage.html'],
    ['/trade', '/amethyst/Trade.html'],
    ['/join', '/amethyst/Join.html'],
    ['/in-the-pantry', '/amethyst/Pantry.html'],
  ])('rewrites %s to its customer-site asset on a custom domain', (path, assetPath) => {
    const response = proxy(
      new NextRequest(`https://brisglowtique.com${path}`, {
        headers: { host: 'brisglowtique.com' },
      }),
    )

    expect(isRewrite(response)).toBe(true)
    expect(getRewrittenUrl(response)).toBe(
      `https://brisglowtique.com${assetPath}?__sparkle_customer_site_path=${encodeURIComponent(path)}`,
    )
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      `https://brisglowtique.com${assetPath}?__sparkle_customer_site_path=${encodeURIComponent(path)}`,
    )
  })

  it('leaves the Sparkle Suite platform host alone', () => {
    const response = proxy(
      new NextRequest('https://www.yoursparklesuite.com/', {
        headers: { host: 'www.yoursparklesuite.com' },
      }),
    )

    expect(isRewrite(response)).toBe(false)
  })

  it('leaves non-customer-site routes alone', () => {
    const response = proxy(
      new NextRequest('https://brisglowtique.com/login', {
        headers: { host: 'brisglowtique.com' },
      }),
    )

    expect(isRewrite(response)).toBe(false)
  })
})
