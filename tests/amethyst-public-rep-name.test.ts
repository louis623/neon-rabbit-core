import { describe, expect, it } from 'vitest'

import {
  getPublicRepName,
  redactPublicRepFullName,
} from '@/lib/amethyst/public-rep-name'

describe('public rep names', () => {
  it('uses only the first name for customer-facing rep identity', () => {
    expect(getPublicRepName('Sasha Rivera')).toBe('Sasha')
    expect(getPublicRepName('  Jordan   Avery  ')).toBe('Jordan')
    expect(getPublicRepName('Sasha')).toBe('Sasha')
    expect(getPublicRepName('')).toBe('Your rep')
  })

  it('redacts exact full rep names inside editable public copy', () => {
    expect(
      redactPublicRepFullName(
        'Join Jordan Avery for live reveals with Jordan Avery.',
        'Jordan Avery',
      ),
    ).toBe('Join Jordan for live reveals with Jordan.')
    expect(
      redactPublicRepFullName('Sparkle by Sasha stays untouched.', 'Sasha'),
    ).toBe('Sparkle by Sasha stays untouched.')
  })
})
