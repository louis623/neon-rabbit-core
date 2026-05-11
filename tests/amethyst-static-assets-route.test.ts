import { describe, expect, it } from 'vitest'

import { GET } from '@/app/amethyst/[...asset]/route'

describe('Amethyst static asset route', () => {
  it('serves locked public Amethyst exports under the app/amethyst namespace', async () => {
    const response = await GET(
      new Request('http://localhost:3001/amethyst/Homepage.html'),
      { params: Promise.resolve({ asset: ['Homepage.html'] }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    await expect(response.text()).resolves.toContain('homepage.jsx')
  })

  it('rejects path traversal outside the public Amethyst export folder', async () => {
    const response = await GET(
      new Request('http://localhost:3001/amethyst/../package.json'),
      { params: Promise.resolve({ asset: ['..', 'package.json'] }) },
    )

    expect(response.status).toBe(404)
  })
})
