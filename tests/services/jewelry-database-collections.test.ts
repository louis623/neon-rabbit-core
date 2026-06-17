import { describe, expect, it } from 'vitest'

import { normalizeCollectionStorageName } from '@/lib/services/jewelry-database'

describe('jewelry database collection naming', () => {
  it('keeps Birthday collection years in the stored collection name', () => {
    expect(normalizeCollectionStorageName('July Birthday', 2026)).toBe(
      'July Birthday 2026',
    )
    expect(normalizeCollectionStorageName('April Birthday 2026', 2026)).toBe(
      'April Birthday 2026',
    )
    expect(normalizeCollectionStorageName('May Birthday Collection', 2026)).toBe(
      'May Birthday 2026',
    )
  })

  it('leaves non-Birthday collections unchanged', () => {
    expect(normalizeCollectionStorageName('Lustre', 2026)).toBe('Lustre')
    expect(normalizeCollectionStorageName('Midnight Garden', null)).toBe(
      'Midnight Garden',
    )
  })
})
