import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildAmethystTradeBootstrapScript,
  buildAmethystTradeTweakDefaults,
  defaultAmethystTradeTemplateData,
} from '@/lib/amethyst/trade-template-data'
import {
  mapTradeListingToAmethystTradeBoardListing,
  type AmethystTradeBoardListing,
} from '@/lib/amethyst/trade-board-listings'
import type { TradeListingWithDesign } from '@/lib/services/types'

function makeTradeListing(
  overrides: Partial<TradeListingWithDesign> = {},
): TradeListingWithDesign {
  return {
    id: 'listing-1',
    rep_id: 'rep-1',
    status: 'available',
    rep_notes: 'Diamond-worthy shimmer for birthday trades.',
    trade_preferences: 'Item-for-item only.',
    listing_photo_url: 'https://cdn.example.com/listing-photo.jpg',
    uses_canonical_photo: false,
    listed_at: '2026-05-05T12:00:00.000Z',
    removal_reason: null,
    deleted_at: null,
    created_at: '2026-05-05T12:00:00.000Z',
    updated_at: '2026-05-05T12:00:00.000Z',
    design: {
      id: 'design-1',
      item_number: 'RG31452',
      design_name: 'Diamond Birthday Bloom',
      material: 'Sterling silver',
      main_stone: 'Diamond accent',
      bp_msrp: 88,
      canonical_photo_url: 'https://cdn.example.com/canonical-photo.jpg',
      type_prefix: 'RG',
      collection: { id: 'collection-1', name: 'Birthday' },
    },
    ...overrides,
  }
}

describe('Amethyst trade page template wiring', () => {
  it('maps structured editable content into the locked trade-page tweak defaults', () => {
    const defaults = buildAmethystTradeTweakDefaults(
      defaultAmethystTradeTemplateData,
    )

    expect(defaults.repName).toBe(defaultAmethystTradeTemplateData.repName)
    expect(defaults.businessName).toBe(
      defaultAmethystTradeTemplateData.businessName,
    )
    expect(defaults.tickerTopText).toBe(
      defaultAmethystTradeTemplateData.tickerTopText,
    )
    expect(defaults.tradeHeroTitle).toBe(
      defaultAmethystTradeTemplateData.tradeHeroTitle,
    )
    expect(defaults.tradeHeroSub).toBe(
      defaultAmethystTradeTemplateData.tradeHeroSub,
    )
  })

  it('serializes the full editable trade payload for the locked export runtime', () => {
    const script = buildAmethystTradeBootstrapScript(
      defaultAmethystTradeTemplateData,
    )

    expect(script).toContain('window.AMETHYST_TRADE_TEMPLATE_DATA')
    expect(script).toContain('window.AMETHYST_TRADE_BOARD_LISTINGS')
    expect(script).toContain('"tradeRules"')
    expect(script).toContain('"faqAnswers"')
    expect(script).toContain('"legalDisclaimer"')
    expect(script).toContain('"shopUrl"')
    expect(script).toContain('"socialLinks"')
    expect(script).toContain('"footerLinks"')
    expect(script).toContain('"material"')
    expect(script).toContain('"photoUrl"')
    expect(script).toContain('"/amethyst/Homepage.html"')
    expect(script).toContain('"/amethyst/Join.html"')
  })

  it('maps service-layer trade listings into customer-facing trade card data', () => {
    const mapped = mapTradeListingToAmethystTradeBoardListing(makeTradeListing())

    expect(mapped).toMatchObject<Partial<AmethystTradeBoardListing>>({
      id: 'listing-1',
      name: 'Diamond Birthday Bloom',
      collection: 'Birthday',
      type: 'Ring',
      material: 'Sterling silver',
      stone: 'Diamond accent',
      msrp: 88,
      tier: 'diamond',
      photoUrl: 'https://cdn.example.com/listing-photo.jpg',
    })
    expect(mapped.note).toContain('Item-for-item only')
  })

  it('loads the runtime bootstrap script before the locked trade-page export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(html).toContain('<script src="/api/amethyst/trade-template"></script>')
  })

  it('ships crawl and sharing metadata with the locked trade export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(html).toContain(
      '<meta name="description" content="Browse Sparkle by Sasha trade board listings and request fair jewelry trades from live reveal customers." />',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Trade.html" />',
    )
    expect(html).toContain('<meta name="robots" content="index,follow" />')
    expect(html).toContain(
      '<meta property="og:title" content="Sparkle by Sasha - Trade Board" />',
    )
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('uses shared route wiring, real listing payloads, and filter wiring on the locked trade export', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-header-nav"')
    expect(jsx).toContain('window.AMETHYST_TRADE_BOARD_LISTINGS')
    expect(jsx).toContain('deriveTradeBoardFilterOptions')
    expect(jsx).toContain('filterTradeBoardListings')
    expect(jsx).toContain('collectionSearch')
    expect(jsx).toContain('new URLSearchParams(window.location.search)')
    expect(jsx).toContain('More filters')
    expect(jsx).toContain('"/amethyst/Homepage.html"')
    expect(jsx).toContain('"/amethyst/Join.html"')
    expect(jsx).toContain('piece.material')
    expect(jsx).toContain('piece.photoUrl')
    expect(jsx).toContain('same collection')
    expect(jsx).toContain('same jewelry type')
    expect(jsx).not.toContain('Buy Now')
    expect(jsx).not.toContain('Next to reveal')
    expect(jsx).not.toContain('Rare finds')
    expect(css).toContain('.tp-filter-panel')
    expect(css).toContain('.tp-filter-search')
  })

  it('uses the shared sticky live reveal queue strip and modal trigger on trade', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('function LiveQueueStrip')
    expect(jsx).toContain('function LiveQueueModal')
    expect(jsx).toContain('View full queue')
    expect(jsx).toContain('const LIVE_QUEUE_NAMES = [')
    expect(jsx).toContain('"Nicole V."')
    expect(jsx).not.toContain('function LRQRail')
    expect(jsx).not.toContain('function MobileDrawer')
    expect(jsx).not.toContain('tp-lrq-rail')
    expect(jsx).not.toContain('tp-drawer')
    expect(jsx).not.toContain('Ã‚')
    expect(jsx).not.toContain('Ãƒ')
    expect(css).toContain('.hp-queue-modal-mask')
    expect(css).toContain('@keyframes hp-modal-rise')
    expect(css).toContain('.hp-trade-preview-link:active')
  })

  it('wires the customer trade request submission flow with request-time clickwrap', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )

    expect(jsx).toContain('function RequestSheet')
    expect(jsx).toContain('<label>Your name</label>')
    expect(jsx).toContain('<label>Describe your revealed piece</label>')
    expect(jsx).toContain('placeholder="Collection, jewelry type, and any details you know."')
    expect(jsx).toContain('type="checkbox"')
    expect(jsx).toContain('/api/amethyst/trade-requests')
    expect(jsx).toContain('clickwrapAcknowledged')
    expect(jsx).toContain('setSubmittedListingIds')
    expect(jsx).not.toContain('type="file"')
  })
})
