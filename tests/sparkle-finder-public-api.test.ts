import { describe, expect, it } from 'vitest'
import {
  countListingsByDesignForQualifiedReps,
  deriveSparkleFinderCatalogFacets,
  filterListingsWithNextShows,
  mapFinderShowRowsToNextShows,
  mapSparkleFinderLiveShowRows,
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

  it('derives catalog facets only from existing catalog rows', () => {
    const facets = deriveSparkleFinderCatalogFacets([
      {
        id: 'design-1',
        item_number: 'RG100',
        design_name: 'Aurora Diamond Ring',
        material: 'Rose gold',
        main_stone: 'Pearl',
        bp_msrp: 39.95,
        canonical_photo_url: null,
        type_prefix: 'RG',
        search_tags: ['diamond', 'rose gold'],
        collection: { name: 'April Birthday', collection_year: 2026 },
      },
      {
        id: 'design-2',
        item_number: 'NK200',
        design_name: 'Orbit Necklace',
        material: 'Rhodium',
        main_stone: 'Citrine',
        bp_msrp: 49.95,
        canonical_photo_url: null,
        type_prefix: 'NK',
        search_tags: ['citrine'],
        collection: { name: 'Galaxy', collection_year: 2025 },
      },
      {
        id: 'design-3',
        item_number: 'ER300',
        design_name: 'Everyday Earrings',
        material: null,
        main_stone: null,
        bp_msrp: null,
        canonical_photo_url: null,
        type_prefix: 'ER',
        search_tags: [],
        collection: null,
      },
    ])

    expect(facets.collections).toEqual([
      { value: 'April Birthday', count: 1 },
      { value: 'Galaxy', count: 1 },
    ])
    expect(facets.materials).toEqual([
      { value: 'Rhodium', count: 1 },
      { value: 'Rose gold', count: 1 },
    ])
    expect(facets.stones).toEqual([
      { value: 'Citrine', count: 1 },
      { value: 'Pearl', count: 1 },
    ])
    expect(facets.types).toEqual([
      { value: 'earrings', count: 1 },
      { value: 'necklace', count: 1 },
      { value: 'ring', count: 1 },
    ])
    expect(facets.labels).toEqual([
      { value: 'diamond', count: 1 },
      { value: 'standard', count: 2 },
    ])
    expect(facets.years).toEqual([
      { value: '2025', count: 1 },
      { value: '2026', count: 1 },
    ])
    expect(JSON.stringify(facets)).not.toContain('Opal')
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
          display_name: 'Gracie Smoke',
          business_name: 'Gracie Test Studio',
          profile_photo_url: 'https://cdn.example.test/gracie.png',
          custom_domain: null,
          public_site_slug: 'gracieteststudio',
          status: 'active',
        },
      } as never,
      {
        showId: 'show-1',
        repId: 'rep-1',
        startsAt: '2026-06-06T01:00:00.000Z',
        title: 'Friday Reveal',
        status: 'scheduled',
      },
    )

    expect(match).toMatchObject({
      listingId: 'listing-1',
      photoUrl: 'https://cdn.example.test/listing.png',
      photoSource: 'listing',
      rep: {
        repId: 'rep-1',
        showName: 'Gracie Test Studio',
        repFirstName: 'Gracie',
        customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
      },
      nextShow: {
        showId: 'show-1',
        startsAt: '2026-06-06T01:00:00.000Z',
        status: 'scheduled',
      },
    })
    expect(JSON.stringify(match)).not.toContain('private rep note')
    expect(JSON.stringify(match)).not.toContain('private trade preference')
    expect(JSON.stringify(match)).not.toContain('customerName')
    expect(JSON.stringify(match)).not.toContain('businessName')
    expect(JSON.stringify(match)).not.toContain('tradeBoardPath')
    expect(JSON.stringify(match)).not.toContain('customerSitePath')
    expect(JSON.stringify(match)).not.toContain('/amethyst?c=')
  })

  it('excludes available listings when the rep has no live or future show', () => {
    const rows = [
      { id: 'listing-with-show', rep_id: 'rep-1' },
      { id: 'listing-without-show', rep_id: 'rep-2' },
    ]

    const filtered = filterListingsWithNextShows(
      rows,
      new Map([
        [
          'rep-1',
          {
            showId: 'show-1',
            repId: 'rep-1',
            startsAt: '2026-06-10T00:00:00.000Z',
            title: 'Wednesday Reveal',
            status: 'scheduled',
          },
        ],
      ]),
    )

    expect(filtered.map((row) => row.id)).toEqual(['listing-with-show'])
  })

  it('counts only available listings from reps with live or future shows', () => {
    const counts = countListingsByDesignForQualifiedReps(
      [
        { design_id: 'design-1', rep_id: 'rep-with-show' },
        { design_id: 'design-1', rep_id: 'rep-without-show' },
        { design_id: 'design-2', rep_id: 'rep-with-show' },
      ],
      new Set(['rep-with-show']),
    )

    expect(counts.get('design-1')).toBe(1)
    expect(counts.get('design-2')).toBe(1)
    expect(counts.has('design-3')).toBe(false)
  })

  it('keeps live shows that started in the past and excludes past scheduled shows', () => {
    const shows = mapFinderShowRowsToNextShows(
      [
        {
          id: 'past-scheduled',
          rep_id: 'rep-past',
          event_time: '2026-06-05T23:00:00.000Z',
          title: 'Past Scheduled',
          status: 'scheduled',
        },
        {
          id: 'live-show',
          rep_id: 'rep-live',
          event_time: '2026-06-05T23:30:00.000Z',
          title: 'Live Now',
          status: 'live',
        },
        {
          id: 'future-for-live-rep',
          rep_id: 'rep-live',
          event_time: '2026-06-10T00:00:00.000Z',
          title: 'Later Reveal',
          status: 'scheduled',
        },
        {
          id: 'future-show',
          rep_id: 'rep-future',
          event_time: '2026-06-10T01:00:00.000Z',
          title: 'Future Reveal',
          status: 'scheduled',
        },
      ],
      '2026-06-06T00:00:00.000Z',
    )

    expect(shows.has('rep-past')).toBe(false)
    expect(shows.get('rep-live')).toMatchObject({
      showId: 'live-show',
      status: 'live',
    })
    expect(shows.get('rep-future')).toMatchObject({
      showId: 'future-show',
      status: 'scheduled',
    })
  })

  it('maps live show calendar rows without requiring trade-board inventory', () => {
    const shows = mapSparkleFinderLiveShowRows(
      [
        {
          id: 'past-scheduled',
          rep_id: 'rep-1',
          event_time: '2026-06-05T23:00:00.000Z',
          title: 'Past Scheduled',
          status: 'scheduled',
          rep: {
            id: 'rep-1',
            display_name: 'Gracie Smoke',
            business_name: 'Gracie Test Studio',
            profile_photo_url: null,
            custom_domain: null,
            public_site_slug: 'gracieteststudio',
            status: 'active',
          },
        },
        {
          id: 'live-show',
          rep_id: 'rep-1',
          event_time: '2026-06-05T23:30:00.000Z',
          title: 'Live Now',
          status: 'live',
          rep: {
            id: 'rep-1',
            display_name: 'Gracie Smoke',
            business_name: 'Gracie Test Studio',
            profile_photo_url: null,
            custom_domain: null,
            public_site_slug: 'gracieteststudio',
            status: 'active',
          },
        },
        {
          id: 'future-show',
          rep_id: 'rep-2',
          event_time: '2026-06-10T01:00:00.000Z',
          title: 'Future Reveal',
          status: 'scheduled',
          rep: {
            id: 'rep-2',
            display_name: 'Mila Moon',
            business_name: 'Mila Moon Reveals',
            profile_photo_url: null,
            custom_domain: null,
            public_site_slug: 'milamoonreveals',
            status: 'active',
          },
        },
        {
          id: 'suspended-show',
          rep_id: 'rep-3',
          event_time: '2026-06-10T02:00:00.000Z',
          title: 'Suspended Reveal',
          status: 'scheduled',
          rep: {
            id: 'rep-3',
            display_name: 'Suspended Rep',
            business_name: 'Suspended Studio',
            profile_photo_url: null,
            custom_domain: null,
            public_site_slug: 'suspendedstudio',
            status: 'suspended',
          },
        },
      ] as never,
      '2026-06-06T00:00:00.000Z',
    )

    expect(shows).toEqual([
      {
        showId: 'live-show',
        showName: 'Gracie Test Studio',
        repFirstName: 'Gracie',
        startsAt: '2026-06-05T23:30:00.000Z',
        status: 'live',
        customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
      },
      {
        showId: 'future-show',
        showName: 'Mila Moon Reveals',
        repFirstName: 'Mila',
        startsAt: '2026-06-10T01:00:00.000Z',
        status: 'scheduled',
        customerSiteUrl: 'https://www.yoursparklesuite.com/milamoonreveals',
      },
    ])
    expect(JSON.stringify(shows)).not.toContain('trade')
    expect(JSON.stringify(shows)).not.toContain('businessName')
  })

  it('normalizes public limit inputs', () => {
    expect(parseSparkleFinderLimit(null, 24, 50)).toBe(24)
    expect(parseSparkleFinderLimit('500', 24, 50)).toBe(50)
    expect(parseSparkleFinderLimit('0', 24, 50)).toBeNull()
    expect(parseSparkleFinderLimit('abc', 24, 50)).toBeNull()
  })
})
