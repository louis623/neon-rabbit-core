import { describe, expect, it } from 'vitest'

import { GET } from '@/app/llms.txt/route'

describe('GET /llms.txt', () => {
  it('serves Markdown-for-agents text from a custom request host', async () => {
    const response = await GET(
      new Request('https://sparklebysasha.example/llms.txt'),
    )

    await expect(response.text()).resolves.toContain(
      'Canonical origin: https://sparklebysasha.example',
    )
    expect(response.headers.get('content-type')).toContain(
      'text/plain; charset=utf-8',
    )
  })

  it('keeps local and preview hosts on the default Sparkle Suite origin', async () => {
    const localResponse = await GET(
      new Request('http://localhost:3001/llms.txt'),
    )
    const previewResponse = await GET(
      new Request('https://sparkle-suite-git-wave-3.vercel.app/llms.txt'),
    )

    await expect(localResponse.text()).resolves.toContain(
      'Canonical origin: https://www.yoursparklesuite.com',
    )
    await expect(previewResponse.text()).resolves.toContain(
      'Canonical origin: https://www.yoursparklesuite.com',
    )
  })
})
