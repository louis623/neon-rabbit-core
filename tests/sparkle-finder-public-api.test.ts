import { describe, expect, it } from 'vitest'
import {
  mapSparkleFinderAvailabilityListingRow,
  mapSparkleFinderDesignRow,
  parseSparkleFinderLimit,
} from '@/lib/sparkle-finder/public-api'

describe('Sparkle Finder public API contract helpers', () => {
  it('maps canonical jewelry rows with collection year and safe search tags', () => {
    const item = mapSparkleFinderDesignRow(
      {
        id: 'design-1',
        item_number: 'RG100',
        design_name: 'Aurora Ring',
        material: 'Rose gold',
        main_stone: 'Pink opal',
        bp_msrp: 39.95,
        canonical_photo_url: 'https://cdn.example.test/rg100.png',
        type_prefix: 'RG',
        search_tags: ['ring', 'rose gold', 'opal'],
        collection: { name: 'April Birthday', collection_year: 2026 },
      },
      3,
    )

    expect(item).toEqual({
      designId: 'design-1',
      itemNumber: 'RG100',
      designName: 'Aurora Ring',
      collectionName: 'April Birthday',
      collectionYear: 2026,
      jewelryType: 'ring',
      material: 'Rose gold',
      mainStone: 'Pink opal',
      bpMsrp: 39.95,
      canonicalPhotoUrl: 'https://cdn.example.test/rg100.png',
      searchTags: ['ring', 'rose gold', 'opal'],
      availableListingCount: 3,
    })
  })

  it('maps public availability without leaking private listing fields', () => {
    const match = mapSparkleFinderAvailabilityListingRow(
      {
        id: 'listing-1',
        rep_id: 'rep-1',
        design_id: 'design-1',
        listing_photo_url: 'https://cdn.example.test/listing.png',
        uses_canonical_photo: false,
        listed_at: '2026-06-05T15:00:00.000Z',
        status: 'available',
        rep_notes: 'private rep note',
        trade_preferences: 'private trade preference',
        design: {
          id: 'design-1',
          item_number: 'RG100',
          design_name: 'Aurora Ring',
          material: 'Rose gold',
          main_stone: 'Pink opal',
          bp_msrp: 39.95,
          canonical_photo_url: 'https://cdn.example.test/canonical.png',
          type_prefix: 'RG',
          search_tags: ['ring'],
          collection: { name: 'April Birthday', collection_year: 2026 },
        },
        rep: {
          id: 'rep-1',
          display_name: 'Gracie',
          business_name: 'Gracie Test Studio',
          profile_photo_url: 'https://cdn.example.test/gracie.png',
          custom_domain: null,
          status: 'active',
        },
      } as never,
      {
        showId: 'show-1',
        repId: 'rep-1',
        platform: 'TikTok',
        startsAt: '2026-06-06T01:00:00.000Z',
        durationMinutes: 90,
        title: 'Friday Reveal',
        description: 'Public show description',
        status: 'scheduled',
      },
    )

    expect(match).toMatchObject({
      listingId: 'listing-1',
      photoUrl: 'https://cdn.example.test/listing.png',
      photoSource: 'listing',
      rep: {
        repId: 'rep-1',
        businessName: 'Gracie Test Studio',
        customerSitePath: '/amethyst?c=rep-1',
        tradeBoardPath: '/amethyst/trade?c=rep-1',
      },
      nextShow: {
        showId: 'show-1',
        platform: 'TikTok',
      },
    })
    expect(JSON.stringify(match)).not.toContain('private rep note')
    expect(JSON.stringify(match)).not.toContain('private trade preference')
    expect(JSON.stringify(match)).not.toContain('customerName')
  })

  it('normalizes public limit inputs', () => {
    expect(parseSparkleFinderLimit(null, 24, 50)).toBe(24)
    expect(parseSparkleFinderLimit('500', 24, 50)).toBe(50)
    expect(parseSparkleFinderLimit('0', 24, 50)).toBeNull()
    expect(parseSparkleFinderLimit('abc', 24, 50)).toBeNull()
  })
})
