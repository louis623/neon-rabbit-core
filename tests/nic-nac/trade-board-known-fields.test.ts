import { describe, expect, it } from 'vitest'

import { extractKnownFieldsFromText } from '@/lib/nic-nac/workflows/trade-board-known-fields'

describe('trade board known-field extraction', () => {
  it('captures standalone Birthday collection names with years', () => {
    expect(extractKnownFieldsFromText('July Birthday 2026')).toMatchObject({
      collectionName: 'July Birthday',
      collectionYear: 2026,
    })
    expect(extractKnownFieldsFromText('April birthday 2026')).toMatchObject({
      collectionName: 'April Birthday',
      collectionYear: 2026,
    })
  })
})
