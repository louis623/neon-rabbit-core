import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TradeBoardWorkspaceCard } from '@/app/nic-nac/components/TradeBoardWorkspaceCard'

const TRADE_BOARD_READY_STATE = {
  status: 'ready' as const,
  board: {
    summary: {
      totalPieces: 2,
      totalMsrp: 78,
      typeBreakdown: { RG: 1, NK: 0, ER: 0, ST: 1, BR: 0 },
      pendingRequestCount: 0,
    },
    listings: [
      {
        id: 'listing-1',
        rep_id: 'rep-1',
        status: 'available' as const,
        rep_notes: null,
        trade_preferences: null,
        listing_photo_url: 'https://cdn.example.com/sapphire-halo.jpg',
        uses_canonical_photo: false,
        listed_at: '2026-05-05T12:00:00Z',
        removal_reason: null,
        deleted_at: null,
        created_at: '2026-05-05T12:00:00Z',
        updated_at: '2026-05-05T12:00:00Z',
        design: {
          id: 'design-1',
          item_number: 'RG100',
          design_name: 'Sapphire Halo',
          material: 'Sterling',
          main_stone: 'Sapphire',
          bp_msrp: 39,
          canonical_photo_url: null,
          type_prefix: 'RG' as const,
          collection: { id: 'collection-1', name: 'Birthday' },
        },
      },
      {
        id: 'listing-2',
        rep_id: 'rep-1',
        status: 'available' as const,
        rep_notes: null,
        trade_preferences: null,
        listing_photo_url: null,
        uses_canonical_photo: true,
        listed_at: '2026-05-06T12:00:00Z',
        removal_reason: null,
        deleted_at: null,
        created_at: '2026-05-06T12:00:00Z',
        updated_at: '2026-05-06T12:00:00Z',
        design: {
          id: 'design-2',
          item_number: 'ST200',
          design_name: 'Rose Quartz Stack',
          material: 'Rose gold',
          main_stone: 'Quartz',
          bp_msrp: 39,
          canonical_photo_url: null,
          type_prefix: 'ST' as const,
          collection: { id: 'collection-2', name: 'OG' },
        },
      },
    ],
  },
}

describe('Nic-Nac trade board surface reset', () => {
  it('uses shared workspace primitives instead of DashboardPlaceholder shell styles', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/TradeBoardWorkspaceCard.tsx',
      ),
      'utf8',
    )

    expect(source).toContain(
      "import surfaceStyles from './WorkspaceSurface.module.css'",
    )
    expect(source).not.toContain("from './DashboardPlaceholder.module.css'")
  })

  it('puts today, quick add, and browse ahead of queue detail sections', () => {
    const html = renderToStaticMarkup(
      createElement(TradeBoardWorkspaceCard, {
        tradeBoardState: TRADE_BOARD_READY_STATE,
        tradeRequestsState: {
          status: 'ready',
          requests: [
            {
              id: 'request-1',
              customerName: 'Jamie Lane',
              customerDescription: 'Swap in the sapphire ring instead.',
              revealScreenshot: null,
              listing: {
                id: 'listing-1',
                repFacingNote: null,
                design: {
                  itemNumber: 'RG100',
                  designName: 'Sapphire Halo',
                  collectionName: 'Birthday',
                  typePrefix: 'RG',
                },
              },
            },
          ],
        },
        fulfillmentQueueState: {
          status: 'ready',
          items: [
            {
              fulfillmentId: 'fulfillment-1',
              requestId: 'request-1',
              status: 'approved',
              customerName: 'Jamie Lane',
              itemNumber: 'RG100',
              designName: 'Sapphire Halo',
              daysSinceLastUpdate: 1,
            },
          ],
        },
        tradeSwapCleanupState: {
          status: 'ready',
          items: [
            {
              swapId: 'swap-1',
              customerName: 'Jamie Lane',
              revealedItemNumber: 'RG200',
              replacementStatus: 'needs_ring_size',
            },
          ],
        },
        tradeBoardSearchQuery: '',
        onTradeBoardSearchQueryChange: () => {},
        quickAddItemNumber: '',
        onQuickAddItemNumberChange: () => {},
        actionState: { pendingKey: null, error: null, helperMessage: null },
        onQuickAddListing: () => {},
        onRemoveListing: () => {},
        onApproveRequest: () => {},
        onRejectRequest: () => {},
        onAdvanceFulfillment: () => {},
      }),
    )
    expect(html.indexOf('Today&#x27;s trade work')).toBeGreaterThan(-1)
    expect(html.indexOf('Quick add')).toBeGreaterThan(-1)
    expect(html.indexOf('Browse board')).toBeGreaterThan(-1)
    expect(html.indexOf('Request inbox')).toBeGreaterThan(-1)
    expect(html.indexOf('Swap cleanup')).toBeGreaterThan(-1)
    expect(html.indexOf('Fulfillment queue')).toBeGreaterThan(-1)
    expect(html.indexOf('Today&#x27;s trade work')).toBeLessThan(
      html.indexOf('Quick add'),
    )
    expect(html.indexOf('Quick add')).toBeLessThan(html.indexOf('Browse board'))
    expect(html.indexOf('Browse board')).toBeLessThan(html.indexOf('Request inbox'))
    expect(html.indexOf('Request inbox')).toBeLessThan(html.indexOf('Swap cleanup'))
    expect(html.indexOf('Swap cleanup')).toBeLessThan(
      html.indexOf('Fulfillment queue'),
    )
  })
})
