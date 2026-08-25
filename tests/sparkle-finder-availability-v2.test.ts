import { describe, expect, it } from 'vitest'

import {
  FinderAvailabilityCursorError,
  buildFinderAvailabilityPage,
  decodeFinderAvailabilityCursor,
  encodeFinderAvailabilityCursor,
} from '@/lib/sparkle-finder/availability-v2'

const secret = 'availability-test-secret'

describe('Sparkle Finder availability v2 pagination', () => {
  it('creates a stable next cursor while keeping authoritative lead and dancer totals', () => {
    const page = buildFinderAvailabilityPage({
      bucket: 'exact',
      designId: 'design-1',
      limit: 2,
      rows: [
        {
          listingId: 'listing-3',
          listedAt: '2026-08-25T15:00:00.000Z',
          quantityAvailable: 2,
        },
        {
          listingId: 'listing-2',
          listedAt: '2026-08-25T15:00:00.000Z',
          quantityAvailable: 3,
        },
        {
          listingId: 'listing-1',
          listedAt: null,
          quantityAvailable: 1,
        },
      ],
      totalLeadCount: 3,
      totalDancerCount: 6,
      secret,
    })

    expect(page.matches.map((row) => row.listingId)).toEqual([
      'listing-3',
      'listing-2',
    ])
    expect(page.pageInfo).toMatchObject({
      totalLeadCount: 3,
      totalDancerCount: 6,
      hasMore: true,
    })
    expect(page.pageInfo.nextCursor).toEqual(expect.any(String))
    expect(
      decodeFinderAvailabilityCursor({
        cursor: page.pageInfo.nextCursor!,
        designId: 'design-1',
        bucket: 'exact',
        secret,
      }),
    ).toEqual({
      listedAt: '2026-08-25T15:00:00.000Z',
      listingId: 'listing-2',
    })
  })

  it('supports null listed-at cursors without losing the listing-id tie-breaker', () => {
    const cursor = encodeFinderAvailabilityCursor({
      designId: 'design-1',
      bucket: 'similar',
      listedAt: null,
      listingId: 'listing-null-2',
      secret,
    })

    expect(
      decodeFinderAvailabilityCursor({
        cursor,
        designId: 'design-1',
        bucket: 'similar',
        secret,
      }),
    ).toEqual({ listedAt: null, listingId: 'listing-null-2' })
  })

  it('rejects tampered, bucket-mismatched, and design-mismatched cursors', () => {
    const cursor = encodeFinderAvailabilityCursor({
      designId: 'design-1',
      bucket: 'exact',
      listedAt: '2026-08-25T15:00:00.000Z',
      listingId: 'listing-2',
      secret,
    })

    const tampered = `${cursor.slice(0, -1)}${cursor.endsWith('a') ? 'b' : 'a'}`
    for (const input of [
      { cursor: tampered, designId: 'design-1', bucket: 'exact' as const },
      { cursor, designId: 'design-1', bucket: 'similar' as const },
      { cursor, designId: 'design-2', bucket: 'exact' as const },
    ]) {
      expect(() =>
        decodeFinderAvailabilityCursor({ ...input, secret }),
      ).toThrow(FinderAvailabilityCursorError)
    }
  })

  it('rejects expired cursors', () => {
    const issuedAt = Date.parse('2026-08-24T00:00:00.000Z')
    const cursor = encodeFinderAvailabilityCursor({
      designId: 'design-1',
      bucket: 'exact',
      listedAt: null,
      listingId: 'listing-1',
      issuedAt,
      secret,
    })

    expect(() =>
      decodeFinderAvailabilityCursor({
        cursor,
        designId: 'design-1',
        bucket: 'exact',
        now: issuedAt + 24 * 60 * 60 * 1000 + 1,
        secret,
      }),
    ).toThrow('availability cursor has expired')
  })

  it('fails closed on duplicate listing ids or invalid net quantities', () => {
    expect(() =>
      buildFinderAvailabilityPage({
        bucket: 'exact',
        designId: 'design-1',
        limit: 2,
        rows: [
          { listingId: 'same', listedAt: null, quantityAvailable: 1 },
          { listingId: 'same', listedAt: null, quantityAvailable: 1 },
        ],
        totalLeadCount: 2,
        totalDancerCount: 2,
        secret,
      }),
    ).toThrow('duplicate listing id')

    expect(() =>
      buildFinderAvailabilityPage({
        bucket: 'exact',
        designId: 'design-1',
        limit: 1,
        rows: [{ listingId: 'listing-1', listedAt: null, quantityAvailable: 0 }],
        totalLeadCount: 1,
        totalDancerCount: 0,
        secret,
      }),
    ).toThrow('invalid net quantity')
  })

  it('rejects totals smaller than the returned page', () => {
    expect(() =>
      buildFinderAvailabilityPage({
        bucket: 'exact',
        designId: 'design-1',
        rows: [
          {
            listingId: 'listing-1',
            listedAt: '2026-08-25T12:00:00.000Z',
            quantityAvailable: 2,
          },
        ],
        limit: 1,
        totalLeadCount: 1,
        totalDancerCount: 1,
        secret,
      }),
    ).toThrow('smaller than the current page')
  })
})
