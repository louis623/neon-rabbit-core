import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { GET } from '@/app/amethyst/[...asset]/route'

describe('Amethyst static asset route', () => {
  it('serves locked public Amethyst exports under the app/amethyst namespace', async () => {
    const response = await GET(
      new Request('http://localhost:3001/amethyst/Homepage.html'),
      { params: Promise.resolve({ asset: ['Homepage.html'] }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    await expect(response.text()).resolves.toContain(
      'homepage.jsx?v=20260725-emerald-garden',
    )
  })

  it('rewrites public HTML canonicals and share URLs for custom domains', async () => {
    const response = await GET(
      new Request('https://sparklebysasha.example/amethyst/Homepage.html'),
      { params: Promise.resolve({ asset: ['Homepage.html'] }) },
    )
    const html = await response.text()

    expect(html).toContain(
      '<link rel="canonical" href="https://sparklebysasha.example/amethyst/Homepage.html" />',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://sparklebysasha.example/amethyst/Homepage.html" />',
    )
    expect(html).toContain(
      '<meta name="twitter:image" content="https://sparklebysasha.example/opengraph-image" />',
    )
  })

  it('keeps local and preview Amethyst HTML on the default Sparkle Suite canonical origin', async () => {
    const localResponse = await GET(
      new Request('http://localhost:3001/amethyst/Trade.html'),
      { params: Promise.resolve({ asset: ['Trade.html'] }) },
    )
    const previewResponse = await GET(
      new Request('https://sparkle-suite-git-wave-3.vercel.app/amethyst/Join.html'),
      { params: Promise.resolve({ asset: ['Join.html'] }) },
    )

    await expect(localResponse.text()).resolves.toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Trade.html" />',
    )
    await expect(previewResponse.text()).resolves.toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Join.html" />',
    )
  })

  it('injects host-aware JSON-LD into public Amethyst HTML responses', async () => {
    const response = await GET(
      new Request('https://sparklebysasha.example/amethyst/Join.html'),
      { params: Promise.resolve({ asset: ['Join.html'] }) },
    )
    const html = await response.text()

    expect(html).toContain('<script type="application/ld+json">')
    expect(html).toContain(
      '"@id":"https://sparklebysasha.example/amethyst/Join.html#webpage"',
    )
    expect(html).not.toContain('<script>alert')
  })

  it('uses the public custom-domain path for canonicals after a customer-site proxy rewrite', async () => {
    const response = await GET(
      new Request(
        'https://sparklebysasha.example/amethyst/Trade.html?__sparkle_customer_site_path=%2Ftrade',
      ),
      { params: Promise.resolve({ asset: ['Trade.html'] }) },
    )
    const html = await response.text()

    expect(html).toContain(
      '<link rel="canonical" href="https://sparklebysasha.example/trade" />',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://sparklebysasha.example/trade" />',
    )
  })

  it('carries customer targets into the unsubscribe bootstrap script', async () => {
    const response = await GET(
      new Request('https://preview.example/amethyst/Unsubscribe.html?c=rep-clean'),
      { params: Promise.resolve({ asset: ['Unsubscribe.html'] }) },
    )
    const html = await response.text()

    expect(html).toContain('/api/amethyst/homepage-template?c=rep-clean')
  })

  it.each([
    ['Homepage.html', 'homepage-template'],
    ['Trade.html', 'trade-template'],
    ['Join.html', 'join-template'],
  ])(
    'forwards preview rep targets through the %s template loader',
    async (assetName, endpoint) => {
      const response = await GET(
        new Request(
          `https://preview.example/amethyst/${assetName}?c=rep-clean&previewRefresh=7`,
        ),
        { params: Promise.resolve({ asset: [assetName] }) },
      )
      const html = await response.text()

      expect(html).toContain('src="/amethyst/template-loader.js"')
      expect(html).toContain('src="/amethyst/tweaks-panel.jsx?v=20260725-emerald-garden"')
      expect(html).toContain(
        `data-template-src="/api/amethyst/${endpoint}?c=rep-clean"`,
      )
      expect(html).not.toContain(`src="/api/amethyst/${endpoint}"></script>`)
    },
  )

  it('ships the template loader that merges page query params before React renders', async () => {
    const response = await GET(
      new Request('https://preview.example/amethyst/template-loader.js'),
      { params: Promise.resolve({ asset: ['template-loader.js'] }) },
    )
    const script = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/javascript')
    expect(script).toContain('window.location.search')
    expect(script).toContain('document.write')
    expect(script).toContain(`"></scr' + 'ipt>'`)
    expect(script).not.toContain('<\\\\/script>')
    expect(script).toContain('data-template-src')
  })

  it('rejects path traversal outside the public Amethyst export folder', async () => {
    const response = await GET(
      new Request('http://localhost:3001/amethyst/../package.json'),
      { params: Promise.resolve({ asset: ['..', 'package.json'] }) },
    )

    expect(response.status).toBe(404)
  })

  it('keeps file tracing scoped to the public Amethyst export folder', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/amethyst/public-asset-response.ts'),
      'utf8',
    )

    expect(source).toContain("join(process.cwd(), 'public', 'amethyst', assetPath)")
    expect(source).not.toContain('../../../public')
  })
})
