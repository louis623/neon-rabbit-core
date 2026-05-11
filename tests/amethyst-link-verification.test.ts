import { describe, expect, it } from 'vitest'

import { buildAmethystLinkChecks } from '@/lib/amethyst/link-verification'

describe('buildAmethystLinkChecks', () => {
  it('checks only local Amethyst links by default', () => {
    const checks = buildAmethystLinkChecks({
      localBaseUrl: 'http://localhost:3001',
      productionBaseUrl: 'https://sparkle-suite.vercel.app',
    })

    expect(checks.map((check) => check.url)).toEqual([
      'http://localhost:3001/amethyst/Homepage.html',
      'http://localhost:3001/amethyst/Trade.html',
      'http://localhost:3001/amethyst/Join.html',
    ])
    expect(checks.every((check) => check.kind === 'local')).toBe(true)
  })

  it('includes production Amethyst links only when requested', () => {
    const checks = buildAmethystLinkChecks({
      includeProduction: true,
      localBaseUrl: 'http://localhost:3001',
      productionBaseUrl: 'https://sparkle-suite.vercel.app',
    })

    expect(checks.map((check) => check.url)).toContain(
      'https://sparkle-suite.vercel.app/amethyst/Homepage.html',
    )
    expect(checks.filter((check) => check.kind === 'production')).toHaveLength(3)
  })
})
