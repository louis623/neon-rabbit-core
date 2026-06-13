import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { contentType as appleIconContentType, size as appleIconSize } from '@/app/apple-icon'
import { contentType as iconContentType, size as iconSize } from '@/app/icon'

describe('Sparkle Suite app icons', () => {
  const iconSource = readFileSync(resolve(process.cwd(), 'app/icon.tsx'), 'utf8')
  const appleIconSource = readFileSync(
    resolve(process.cwd(), 'app/apple-icon.tsx'),
    'utf8',
  )

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

  it('uses the approved circular Sparkle Suite S seal instead of the retired purple square', () => {
    const combinedSource = `${iconSource}\n${appleIconSource}`

    expect(combinedSource).toContain('#ee2c9b')
    expect(combinedSource).toContain('#ffffff')
    expect(combinedSource).toContain("borderRadius: '999px'")
    expect(combinedSource).toContain("fontStyle: 'italic'")
    expect(combinedSource).toContain('skewX(-10deg)')
    expect(combinedSource).not.toContain('#5a345c')
    expect(combinedSource).not.toContain('#f3cfa8')
  })
})
