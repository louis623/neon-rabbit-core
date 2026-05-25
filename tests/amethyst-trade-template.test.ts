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
  it('ships mobile sticky and coarse pointer CSS safeguards for the trade board', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )

    expect(css).toMatch(/@media\s+\(max-width:\s*900px\)[\s\S]*?\.tp-drawer[\s\S]*?top:\s*var\(--hp-mobile-sticky-drawer-top\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*900px\)[\s\S]*?\.tp-filters[\s\S]*?top:\s*var\(--hp-mobile-sticky-filters-top\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*700px\)[\s\S]*?\.tp-filters[\s\S]*?position:\s*static;/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.tp-filter-pill[\s\S]*?min-height:\s*44px;/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.tp-card-close[\s\S]*?min-width:\s*44px;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tp-card-expand-mask[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tp-faq-a[\s\S]*?transition:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-title[\s\S]*?font-size:\s*clamp\(32px,\s*9\.6vw,\s*44px\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-inner[\s\S]*?width:\s*100vw;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-inner[\s\S]*?margin-inline:\s*calc\(50% - 50vw\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-title[\s\S]*?max-width:\s*10ch;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-title[\s\S]*?overflow-wrap:\s*anywhere;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-sub[\s\S]*?width:\s*100%;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-sub[\s\S]*?max-width:\s*24ch;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.tp-hero-sub[\s\S]*?overflow-wrap:\s*anywhere;/)
  })

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
      photoSource: 'listing',
    })
    expect(mapped.note).toContain('Item-for-item only')
  })

  it('marks canonical and missing photo source without exposing internal labels on the customer card', () => {
    expect(
      mapTradeListingToAmethystTradeBoardListing(
        makeTradeListing({
          listing_photo_url: null,
          uses_canonical_photo: true,
        }),
      ),
    ).toMatchObject({
      photoUrl: 'https://cdn.example.com/canonical-photo.jpg',
      photoSource: 'canonical',
    })

    expect(
      mapTradeListingToAmethystTradeBoardListing(
        makeTradeListing({
          listing_photo_url: null,
          uses_canonical_photo: true,
          design: {
            ...makeTradeListing().design,
            canonical_photo_url: null,
          },
        }),
      ),
    ).toMatchObject({
      photoUrl: null,
      photoSource: 'missing',
    })
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
      '<meta name="description" content="Browse Jane\'s Sparkle Party trade board listings and request fair jewelry trades from live reveal customers." />',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Trade.html" />',
    )
    expect(html).toContain('<meta name="robots" content="index,follow" />')
    expect(html).toContain(
      '<meta property="og:title" content="Jane\'s Sparkle Party - Trade Board" />',
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

  it('ships the Sparkle Suite/Morganite skin in the local trade preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(jsx).toContain('sparkle_suite_morganite')
    expect(jsx).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Black Diamond skin in the local trade preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(jsx).toContain('black_diamond')
    expect(jsx).toContain('Black Diamond')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Rose Gold skin in the local trade preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(jsx).toContain('rose_gold')
    expect(jsx).toContain('Rose Gold')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the approved batch skins in the local trade preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Trade.html'),
      'utf8',
    )

    expect(jsx).toContain('garnet')
    expect(jsx).toContain('Garnet')
    expect(jsx).toContain('amber')
    expect(jsx).toContain('Amber')
    expect(jsx).toContain('velvet')
    expect(jsx).toContain('Velvet')
    expect(jsx).toContain('rose_quartz')
    expect(jsx).toContain('Rose Quartz')
    expect(html).toContain('Bitter')
    expect(html).toContain('Nunito')
  })

  it('does not ship legacy placeholder skins in the local trade preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )

    expect(jsx).not.toContain('value: "editorial"')
    expect(jsx).not.toContain('value: "softGlam"')
    expect(jsx).not.toContain('value: "sparkleParty"')
    expect(jsx).not.toContain('value: "maximum", label: "Maximum"')
    expect(jsx).not.toContain('label: "Editorial"')
    expect(jsx).not.toContain('label: "Soft Glam"')
    expect(jsx).not.toContain('label: "Sparkle Party"')
  })

  it('wires the customer trade request submission flow without a trade checkbox', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )

    expect(jsx).toContain('function RequestSheet')
    expect(jsx).toContain('<label>Your name</label>')
    expect(jsx).toContain('<label>Describe your revealed piece</label>')
    expect(jsx).toContain('placeholder="Collection, jewelry type, and any details you know."')
    expect(jsx).toContain('/api/amethyst/trade-requests')
    expect(jsx).toContain('/api/amethyst/trade-board')
    expect(jsx).toContain('function fetchTradeBoardListings')
    expect(jsx).toContain('await refreshTradeBoardListings()')
    expect(jsx).toContain('TRADE_BOARD_REFRESH_MS')
    expect(jsx).toContain('window.setInterval(refreshIfVisible')
    expect(jsx).toContain('window.clearInterval')
    expect(jsx).not.toContain('clickwrapAcknowledged')
    expect(jsx).not.toContain('acceptedTerms')
    expect(jsx).not.toContain('tp-sheet-consent')
    expect(jsx).toContain('setSubmittedListingIds')
    expect(jsx).not.toContain('type="file"')
  })
})
