import { describe, expect, it } from 'vitest'

import {
  buildPartySummaries,
  buildVisibleQueue,
} from '../chrome-extension/queue-filter.js'

describe('live queue party filtering', () => {
  it('includes newly detected parties by default and removes excluded parties only', () => {
    const rows = [
      { firstName: 'Future', partyId: '2222', revealed: false, orderDateMs: 30 },
      { firstName: 'Current Next', partyId: '1111', revealed: false, orderDateMs: 20 },
      { firstName: 'Already Done', partyId: '1111', revealed: true, orderDateMs: 15 },
      { firstName: 'Current Now', partyId: '1111', revealed: false, orderDateMs: 10 },
    ]

    expect(buildVisibleQueue(rows, [])).toEqual([
      'Current Now',
      'Current Next',
      'Future',
    ])

    expect(buildVisibleQueue(rows, ['2222'])).toEqual([
      'Current Now',
      'Current Next',
    ])
  })

  it('summarizes detected parties for the popup without requiring rep configuration', () => {
    const rows = [
      { firstName: 'Mara', partyId: '2222', revealed: false, orderDateMs: 40 },
      { firstName: 'Lindsey', partyId: '1111', revealed: false, orderDateMs: 30 },
      { firstName: 'Brittany', partyId: '2222', revealed: true, orderDateMs: 20 },
      { firstName: 'Heather', partyId: '1111', revealed: false, orderDateMs: 10 },
    ]

    expect(buildPartySummaries(rows)).toEqual([
      {
        partyId: '2222',
        orderCount: 2,
        unrevealedCount: 1,
        latestOrderDateMs: 40,
        sampleNames: ['Mara', 'Brittany'],
      },
      {
        partyId: '1111',
        orderCount: 2,
        unrevealedCount: 2,
        latestOrderDateMs: 30,
        sampleNames: ['Lindsey', 'Heather'],
      },
    ])
  })
})
