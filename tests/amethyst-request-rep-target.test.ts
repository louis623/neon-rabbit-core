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
})
