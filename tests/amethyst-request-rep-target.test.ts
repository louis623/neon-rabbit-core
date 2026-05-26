import { describe, expect, it } from 'vitest'

import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'

describe('Amethyst request rep target', () => {
  it('reads an explicit customer target from the API query string', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost/api/amethyst/homepage-template?c=rep-1'),
      ),
    ).toBe('rep-1')
  })

  it('reads the customer target from the public page referer', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost/api/amethyst/homepage-template', {
          headers: {
            referer: 'http://localhost/amethyst/Homepage.html?c=rep-2',
          },
        }),
      ),
    ).toBe('rep-2')
  })

  it('normalizes a custom-domain request host when there is no explicit target', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('https://SparkleBySasha.example:443/api/amethyst/homepage-template'),
      ),
    ).toBe('sparklebysasha.example')
  })

  it('ignores local and preview hosts so demo fallbacks still apply', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost:3000/api/amethyst/homepage-template'),
      ),
    ).toBeNull()

    expect(
      resolveAmethystRequestRepId(
        new Request('https://sparkle-suite-git-wave-1.vercel.app/api/amethyst/homepage-template'),
      ),
    ).toBeNull()
  })

  it('keeps an explicit target ahead of a custom-domain host', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request(
          'https://sparklebysasha.example/api/amethyst/homepage-template?repId=rep-override',
        ),
      ),
    ).toBe('rep-override')
  })
})
