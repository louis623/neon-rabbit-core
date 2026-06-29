import { describe, expect, it } from 'vitest'
import packageJson from '@/package.json'
import {
  buildNonItemNumberPressureSummary,
  findForbiddenPublicSourceLanguage,
  publicPreviewListingsHaveIds,
} from '@/scripts/pressure-non-item-number-trade-listings'

describe('non-item-number Trade Board pressure script', () => {
  it('is registered as an explicit pressure command', () => {
    expect(packageJson.scripts['pressure:non-item-number-trade-listings']).toBe(
      'tsx scripts/pressure-non-item-number-trade-listings.ts',
    )
  })

  it('summarizes pressure results without exposing environment secrets', () => {
    const summary = buildNonItemNumberPressureSummary({
      marker: 'non_item_pressure_test',
      repId: 'rep-123',
      listingsCreated: 2,
      boardRowsVerified: 2,
      requestsSubmitted: 1,
      requestsRejected: 1,
      removedAndRestored: true,
      jewelryDesignCountBefore: 42,
      jewelryDesignCountAfter: 42,
      publicPayloadLeaks: [],
      cleanupResiduals: 0,
    })

    expect(summary).toBe(
      '[non-item-pressure] marker=non_item_pressure_test rep=rep-123 listings=2 board=2 requests=1 rejected=1 remove_restore=true designs_before=42 designs_after=42 public_leaks=0 cleanup_residuals=0',
    )
    expect(summary).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('flags customer-facing source wording that should never leak', () => {
    expect(
      findForbiddenPublicSourceLanguage(
        'Show the undocumented Board Pieces miscellaneous section.',
      ),
    ).toEqual(['miscellaneous', 'undocumented', 'Board Pieces'])
  })

  it('requires every created listing to appear in public preview rows', () => {
    expect(
      publicPreviewListingsHaveIds(
        [{ id: 'listing-1' }, { id: 'listing-2' }],
        ['listing-1', 'listing-2'],
      ),
    ).toBe(true)
    expect(
      publicPreviewListingsHaveIds([{ id: 'listing-1' }], [
        'listing-1',
        'listing-2',
      ]),
    ).toBe(false)
  })
})
