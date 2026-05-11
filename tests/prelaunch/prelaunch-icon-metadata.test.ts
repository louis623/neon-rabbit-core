import { describe, expect, it } from 'vitest'

import { contentType as appleIconContentType, size as appleIconSize } from '@/app/apple-icon'
import { contentType as iconContentType, size as iconSize } from '@/app/icon'

describe('Sparkle Suite app icons', () => {
  it('defines a search-friendly generated favicon/app icon', () => {
    expect(iconContentType).toBe('image/png')
    expect(iconSize).toEqual({
      width: 192,
      height: 192,
    })
  })

  it('defines an Apple touch icon for saved/mobile surfaces', () => {
    expect(appleIconContentType).toBe('image/png')
    expect(appleIconSize).toEqual({
      width: 180,
      height: 180,
    })
  })
})
