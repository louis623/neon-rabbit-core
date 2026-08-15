import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildAmethystHomepageBootstrapScript,
  buildAmethystHomepageTweakDefaults,
  defaultAmethystHomepageTemplateData,
  enrichAmethystHomepageFeatureData,
} from '@/lib/amethyst/homepage-template-data'
import { AMETHYST_APPEARANCE_PRESETS } from '@/lib/amethyst/appearance-presets'

describe('Amethyst homepage template data wiring', () => {
  const tickerAssetVersion = '20260725-emerald-garden'

  it('keeps the customer-facing Nic-Nac launcher out of public Amethyst exports', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    for (const jsx of [homepage, trade, join]) {
      expect(jsx).not.toContain('aria-label="Open Nic-Nac"')
      expect(jsx).not.toContain('className="hp-nic-nac"')
      expect(jsx).not.toContain('label="Nic-Nac launcher"')
    }
    expect(css).not.toContain('.hp-nic-nac')
    expect(css).not.toContain('hp-nic-nac-spark')
  })

  it('keeps locked public fallback exports on the shared demo identity', () => {
    const files = [
      'public/amethyst/Homepage.html',
      'public/amethyst/Trade.html',
      'public/amethyst/Join.html',
      'public/amethyst/Unsubscribe.html',
      'public/amethyst/homepage.jsx',
      'public/amethyst/trade.jsx',
      'public/amethyst/join.jsx',
      'public/amethyst/unsubscribe.jsx',
    ].map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'))
    const serialized = files.join('\n')

    expect(serialized).toContain('Sparkle by Sasha')
    expect(serialized).not.toContain('Sasha Rivera')
    expect(serialized).not.toMatch(/\b(?:Rep Name|Show Name)\b/)
    expect(serialized).not.toContain("Jane's Sparkle Party")
  })

  it('loads public JSX exports with the React Babel preset', () => {
    const htmlFiles = [
      'public/amethyst/Homepage.html',
      'public/amethyst/Trade.html',
      'public/amethyst/Join.html',
      'public/amethyst/Pantry.html',
      'public/amethyst/Unsubscribe.html',
    ]

    for (const file of htmlFiles) {
      const html = readFileSync(resolve(process.cwd(), file), 'utf8')
      const jsxScripts = html.match(
        /<script type="text\/babel"[^>]+\.jsx(?:\?[^"]*)?"><\/script>/g,
      ) ?? []

      expect(jsxScripts.length, file).toBeGreaterThan(0)
      for (const script of jsxScripts) {
        expect(script, file).toContain('data-presets="react"')
        expect(script, file).toContain(`v=${tickerAssetVersion}`)
      }
    }
  })

  it('keeps the shared tweaks helper scoped while exporting controls on window', () => {
    const tweaksPanel = readFileSync(
      resolve(process.cwd(), 'public/amethyst/tweaks-panel.jsx'),
      'utf8',
    )

    expect(tweaksPanel).toContain('(function initAmethystTweaksPanel() {')
    expect(tweaksPanel).toContain('Object.assign(window, {')
    expect(tweaksPanel.trim()).toMatch(/\}\)\(\);$/)
  })

  it('marks animated ticker tracks as decorative and provides concise screen-reader summaries', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    for (const jsx of [homepage, trade, join]) {
      expect(jsx).toContain('className="hp-ticker-sr"')
      expect(jsx).toContain('aria-hidden="true"')
      expect(jsx).toContain('aria-label="Customer site updates"')
    }
    expect(css).toContain('.hp-ticker-sr')
    expect(css).toMatch(/\.hp-ticker-sr[\s\S]*?clip:\s*rect\(0 0 0 0\);/)
  })

  it('keeps customer-facing ticker speeds content-length independent', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const componentsCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/components.css'),
      'utf8',
    )
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const shell = readFileSync(
      resolve(process.cwd(), 'components/amethyst/site-shell.tsx'),
      'utf8',
    )

    expect(css).toContain('--hp-ticker-speed-pps: 46;')
    expect(css).toContain('--hp-trade-ticker-speed-pps: 55.2;')
    expect(css).toContain('animation: hp-ticker-scroll var(--hp-ticker-dynamic-duration, var(--hp-ticker-duration, 72s)) linear infinite;')
    expect(css).toContain('animation-duration: calc(var(--hp-ticker-dynamic-duration, var(--hp-ticker-duration, 72s)) / var(--ticker-speed, 1));')
    expect(css).toContain('animation-duration: calc(var(--hp-ticker-dynamic-duration, var(--hp-trade-ticker-duration, 60s)) / var(--ticker-speed, 1));')
    expect(css).toContain('transform: translateX(var(--hp-ticker-scroll-offset, -50%));')
    expect(componentsCss).toContain('--ticker-speed-pps: 46;')
    expect(componentsCss).toContain('--trade-ticker-speed-pps: 55.2;')
    expect(shell).toContain("'use client'")
    expect(shell).toContain('data-ticker-pps={ANNOUNCEMENT_TICKER_SPEED_PPS}')
    expect(shell).toContain('data-ticker-pps={TRADE_TICKER_SPEED_PPS}')
    expect(shell).toContain('useDynamicTickerMotion()')
    expect(shell).toContain('`${distance / pixelsPerSecond}s`')
    expect(shell).not.toContain('Math.max(12, distance / pixelsPerSecond)')
    expect(shell).toContain('const EMPTY_TRADE_TICKER_ITEM = {')
    expect(shell).toContain(
      'const tradeTickerSource: TradeTickerItem[] = content.tradeBoardListings.length > 0',
    )
    expect(shell).toContain(
      'const tradeItems = buildTickerLoopItems(tradeTickerSource, 15)',
    )
    expect(shell).toContain('{listing.title} - {listing.type || \'Jewelry\'} - {listing.collection || \'Collection pending\'}')
    expect(shell).not.toContain('{listing.title} · {listing.msrpLabel}')
    expect(shell).not.toContain('amethyst-scroll 72s linear infinite')
    expect(shell).not.toContain('amethyst-scroll 60s linear infinite reverse')
    expect(shell).toContain(
      'className="inline-flex items-center whitespace-nowrap text-[13px] font-bold text-[var(--amethyst-fg)]"',
    )
    expect(shell).toContain(
      'className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-bold text-[var(--amethyst-fg)] transition hover:text-[var(--amethyst-primary)]"',
    )

    for (const jsx of [homepage, trade, join]) {
      expect(jsx).toContain('tickerSpeed: 1')
      expect(jsx).toContain('`${distance / pixelsPerSecond}s`')
      expect(jsx).not.toContain('Math.max(12, distance / pixelsPerSecond)')
      expect(jsx).toContain('const EMPTY_TRADE_TICKER_ITEM = {')
      expect(jsx).toContain(
        'const tradeTickerSource = trades.length > 0 ? trades : [EMPTY_TRADE_TICKER_ITEM];',
      )
      expect(jsx).toContain(
        'const tickerTrades = buildTickerLoopItems(tradeTickerSource, 15);',
      )
      expect(jsx).not.toContain(
        '<span className="hp-ticker-empty">Trade Board listings will appear here after pieces are added.</span>',
      )
      expect(jsx).toMatch(
        /className="hp-ticker-empty"[\s\S]*?data-ticker-segment-start=[\s\S]*?data-ticker-segment-repeat-start=/,
      )
    }
    expect(css).toMatch(
      /\.hp-ticker-trade\s*\{[\s\S]*?font-weight:\s*700;/,
    )
    expect(css).toMatch(
      /\.hp-ticker-empty\s*\{[\s\S]*?font-weight:\s*700;/,
    )
    for (const preset of Object.values(AMETHYST_APPEARANCE_PRESETS)) {
      expect(preset.values.tickerSpeed).toBe(1)
    }
  })

  it('keeps Emerald Garden on the shared ticker contract with readable announcements and the standard hero composition', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const tradeCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )
    const emeraldCss = css.slice(css.indexOf('/* Emerald Garden'))
    const emeraldTradeCss = tradeCss.slice(
      tradeCss.indexOf('/* Emerald Garden trade-board continuation */'),
    )

    expect(AMETHYST_APPEARANCE_PRESETS.emerald_garden.values.tickerSpeed).toBe(1)
    expect(emeraldCss).not.toContain('--ticker-speed')
    expect(emeraldCss).not.toContain('animation-duration')
    expect(emeraldCss).toMatch(
      /body\.bg-emerald-garden \.hp-ticker-row:not\(\.reverse\) \.hp-ticker-item\s*\{[\s\S]*?color:\s*#ffffff;/,
    )
    expect(emeraldCss).toContain(
      'linear-gradient(135deg, #dce8dc 0%, #7fa58c 30%, #236c55 58%, #063b2e 100%)',
    )
    expect(emeraldTradeCss).toContain(
      'linear-gradient(135deg, #dce8dc 0%, #7fa58c 30%, #236c55 58%, #063b2e 100%)',
    )
    expect(emeraldCss).not.toContain(
      'radial-gradient(ellipse at 9% 48%, rgba(255, 255, 255, 0.94)',
    )
    expect(emeraldCss).toMatch(
      /body\.bg-emerald-garden \.hp-hero-inner > div\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?backdrop-filter:\s*none;/,
    )
    expect(emeraldCss).not.toContain(
      'body.bg-emerald-garden .hp-signup .hp-signup-title,',
    )
  })

  it('builds duplicate ticker loops for measured pixel-speed animation', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )

    expect(homepage).toContain('buildTickerLoopItems(tradeTickerSource, 15)')
    expect(trade).toContain('buildTickerLoopItems(tradeTickerSource, 15)')
    expect(join).toContain('buildTickerLoopItems(tradeTickerSource, 15)')

    for (const jsx of [homepage, trade, join]) {
      expect(jsx).toContain('const ANNOUNCEMENT_TICKER_SPEED_PPS = 46')
      expect(jsx).toContain('const TRADE_TICKER_SPEED_PPS = 55.2')
      expect(jsx).toContain('function buildTickerLoopItems(items, minimumSegmentItems)')
      expect(jsx).toContain('function useDynamicTickerMotion()')
      expect(jsx).toContain('CONTENT.tradeBoardTickerItems')
      expect(jsx).toContain('{tr.name} - {tr.type || "Jewelry"} - {tr.collection || "Collection pending"}')
      expect(jsx).toContain('data-ticker-segment-start')
      expect(jsx).toContain('data-ticker-segment-repeat-start')
      expect(jsx).toContain('data-ticker-pps={TRADE_TICKER_SPEED_PPS}')
      expect(jsx).not.toContain('[...trades, ...trades, ...trades]')
      expect(jsx).not.toContain('[...TICKER_TRADES, ...TICKER_TRADES, ...TICKER_TRADES]')
      expect(jsx).not.toContain('trade.name} - {trade.meta')
      expect(jsx).not.toContain('trade.name} Â· {trade.price')
    }
  })

  it('ships shared customer-facing mobile CSS containment and motion safeguards', () => {
    const tokensCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/tokens.css'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(tokensCss).toContain('overflow-x: clip;')
    expect(tokensCss).toContain('max-width: 100%;')
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-ticker[\s\S]*?overflow-x:\s*clip;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-header-nav[\s\S]*?max-width:\s*100%;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-header-link[\s\S]*?font-size:\s*12px;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-ticker-track[\s\S]*?min-width:\s*max-content;/)
    expect(css).toContain('.hp-sticky-stack')
    expect(css).toMatch(/\.hp-sticky-stack\s*\{[\s\S]*?position:\s*sticky;/)
    expect(css).toMatch(/body\.homepage\s+#root,[\s\S]*?body\.tradepage\s+#root,[\s\S]*?body\.joinpage\s+#root\s*\{[\s\S]*?overflow:\s*visible;/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-header-link[\s\S]*?min-height:\s*44px;/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-queue-modal-close[\s\S]*?min-width:\s*44px;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hp-ticker-track[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?body\.tex-sparkle::before[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?body\.cta-pulse\s+\.hp-btn-primary:not\(\.outline\)[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/\.hp-hero-headline\s*\{[\s\S]*?line-height:\s*1\.08;/)
    expect(css).toMatch(/\.hp-hero-headline\s*\{[\s\S]*?padding-block:\s*0\.04em 0\.12em;/)
    expect(css).toMatch(/\.hp-hero-headline\s*\{[\s\S]*?overflow:\s*visible;/)
    expect(css).toMatch(/\.hp-section-title\s*\{[\s\S]*?line-height:\s*1\.12;/)
    expect(css).toMatch(/\.hp-section-title\s*\{[\s\S]*?padding-block:\s*0\.03em 0\.09em;/)
    expect(css).toMatch(/\.hp-signup-title\s*\{[\s\S]*?line-height:\s*1\.14;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?font-size:\s*clamp\(36px,\s*10\.5vw,\s*48px\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-inner[\s\S]*?width:\s*100vw;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-inner[\s\S]*?margin-inline:\s*calc\(50% - 50vw\);/)
    expect(css).toMatch(/\.hp-hero-inner\s*\{[\s\S]*?justify-content:\s*center;/)
    expect(css).toMatch(/\.hp-hero-inner\s*\{[\s\S]*?text-align:\s*center;/)
    expect(css).toMatch(/\.hp-hero-ctas\s*\{[\s\S]*?justify-content:\s*center;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?max-width:\s*11ch;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?padding-block:\s*0\.04em 0\.12em;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?overflow-wrap:\s*anywhere;/)
    expect(css).not.toContain('.hp-hero-media.placeholder::after')
  })

  it('maps structured editable content into the locked homepage tweak defaults', () => {
    const defaults = buildAmethystHomepageTweakDefaults(
      defaultAmethystHomepageTemplateData,
    )

    expect(defaults.repName).toBe(defaultAmethystHomepageTemplateData.repName)
    expect(defaults.businessName).toBe(
      defaultAmethystHomepageTemplateData.businessName,
    )
    expect(defaults.heroHeadline).toBe(
      defaultAmethystHomepageTemplateData.heroHeadline,
    )
    expect(defaults.heroSub).toBe(defaultAmethystHomepageTemplateData.heroSub)
    expect(defaults.heroMotion).toBe('sparkle_rise')
    expect(defaults.tickerTopText).toBe(
      defaultAmethystHomepageTemplateData.tickerTopText,
    )
  })

  it('serializes the full editable homepage payload for the locked export runtime', () => {
    const script = buildAmethystHomepageBootstrapScript(
      defaultAmethystHomepageTemplateData,
    )

    expect(script).toContain('window.AMETHYST_HOMEPAGE_TEMPLATE_DATA')
    expect(script).toContain('window.AMETHYST_HOMEPAGE_EVENTS')
    expect(script).toContain('"teamName"')
    expect(script).toContain('"aboutHeadline"')
    expect(script).toContain('"aboutParagraphs"')
    expect(script).toContain('"aboutMediaSlots"')
    expect(script).toContain('"typeLabel":"About media 1"')
    expect(script).toContain('"typeLabel":"About media 2"')
    expect(script).toContain('"heroMotion"')
    expect(script).toContain('"streamLinks"')
    expect(script).toContain('"socialLinks"')
    expect(script).toContain('"eventTime"')
    expect(script).toContain('"durationMinutes"')
    expect(script).toContain('"/amethyst/Trade.html"')
    expect(script).toContain('"/amethyst/Join.html"')
  })

  it('loads the runtime bootstrap script before the locked homepage export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(html).toContain(
      '<script src="template-loader.js" data-template-src="/api/amethyst/homepage-template"></script>',
    )
    expect(html.indexOf('template-loader.js')).toBeLessThan(
      html.indexOf('homepage.jsx'),
    )
  })

  it('keeps the saved hero motion when a skin supplies its other visual defaults', () => {
    expect(
      buildAmethystHomepageTweakDefaults(
        { ...defaultAmethystHomepageTemplateData, heroMotion: 'sparkle_rise' },
        'sparkle_suite_morganite',
      ).heroMotion,
    ).toBe('sparkle_rise')
    expect(
      buildAmethystHomepageTweakDefaults(
        { ...defaultAmethystHomepageTemplateData, heroMotion: 'soft_glow' },
        'black_diamond',
      ).heroMotion,
    ).toBe('soft_glow')
    expect(
      buildAmethystHomepageTweakDefaults(
        { ...defaultAmethystHomepageTemplateData, heroMotion: 'still' },
        'rose_quartz',
      ).heroMotion,
    ).toBe('still')
  })

  it('serializes the saved hero motion into the public bootstrap for every skin', () => {
    const sparkleRiseScript = buildAmethystHomepageBootstrapScript(
      { ...defaultAmethystHomepageTemplateData, heroMotion: 'sparkle_rise' },
      undefined,
      'sparkle_suite_morganite',
    )
    const softGlowScript = buildAmethystHomepageBootstrapScript(
      { ...defaultAmethystHomepageTemplateData, heroMotion: 'soft_glow' },
      undefined,
      'black_diamond',
    )

    expect(sparkleRiseScript).toContain('"heroMotion":"sparkle_rise"')
    expect(softGlowScript).toContain('"heroMotion":"soft_glow"')
  })

  it('uses two clear optional About media slots instead of a tiny three-card gallery', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('data-slot={`about media ${index + 1}`}')
    expect(jsx).toContain('function AboutMediaCard')
    expect(jsx).toContain('Heather Daugherty - BlingKitchen, Ohio')
    expect(jsx).toContain('Family recipes, kitchen tips, and Heather-style notes.')
    expect(jsx).not.toContain('data-slot="about media 3"')
    expect(jsx).not.toContain('hp-about-media-card-tall')
    expect(css).toMatch(/\.hp-about-media-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/)
    expect(css).toMatch(/\.hp-about-media-grid\s*\{[\s\S]*?grid-template-rows:\s*minmax\(420px,\s*1fr\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*700px\)[\s\S]*?\.hp-about-media-grid[\s\S]*?grid-template-columns:\s*1fr;/)
  })

  it('ships crawl and sharing metadata with the locked homepage export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(html).toContain(
      '<meta name="description" content="Shop live jewelry reveals, trade board highlights, and upcoming shows with Sparkle by Sasha." />',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Homepage.html" />',
    )
    expect(html).toContain('<meta name="robots" content="index,follow" />')
    expect(html).toContain(
      '<meta property="og:title" content="Sparkle by Sasha - Live jewelry reveals" />',
    )
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('uses real social media logo marks in the customer footer', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const unsubscribe = readFileSync(
      resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    for (const jsx of [homepage, unsubscribe]) {
      expect(jsx).toContain('function SocialLogo')
      expect(jsx).toContain('hp-footer-social-logo')
      expect(jsx).toContain('aria-label={')
      expect(jsx).not.toContain('className="hp-footer-social">TT</a>')
      expect(jsx).not.toContain('className="hp-footer-social">FB</a>')
      expect(jsx).not.toContain('className="hp-footer-social">IG</a>')
      expect(jsx).not.toContain('className="hp-footer-social">YT</a>')
    }
    expect(css).toContain('.hp-footer-social-logo')
    expect(css).toContain('.hp-footer-social-logo-stroke')
  })

  it('renders only configured customer social links in the homepage footer', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('Array.isArray(CONTENT.socialLinks)')
    expect(jsx).toContain('CONTENT.socialLinks\n    : []')
    expect(jsx).not.toContain('const defaultSocials = [')
  })

  it('keeps the customer footer to two unlabeled navigation columns for launch', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const shell = readFileSync(
      resolve(process.cwd(), 'components/amethyst/site-shell.tsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    const footerLabels = ['Home', 'Trade Board', 'Join Team']

    for (const source of [homepage, trade, join]) {
      for (const label of footerLabels) {
        expect(source).toContain(`>${label}</a>`)
      }
      expect(source).toContain('FAQ · Coming soon')
      expect(source).not.toContain('>Contact</a>')
      expect(source).not.toContain('>Shop Now</a>')
      expect(source).not.toContain('Bomb Party Catalog')
      expect(source).not.toContain('Pre-orders</a>')
      expect(source).not.toContain('Past shows</a>')
      expect(source).not.toContain('data-slot="optional 4th column"')
      expect(source).not.toContain('<h4>{FOOTER_COLUMN')
      expect(source).not.toContain('<h4>')
      expect(source).not.toContain('Hosting Soon')
    }
    expect(shell).toContain('lg:grid-cols-[1.4fr_1fr_1fr]')
    expect(shell).not.toContain('title:')
    expect(shell).not.toContain('<h2')
    expect(shell).not.toContain('FooterColumn title={content.footerColumn.title}')
    expect(css).toContain('grid-template-columns: minmax(260px, 1.4fr) repeat(2, minmax(120px, 1fr));')
    expect(css).not.toContain('.hp-footer-col h4')
    expect(css).toMatch(/\.hp-footer-col ul\s*\{[\s\S]*?gap:\s*4px;/)
    expect(css).toMatch(/\.hp-footer-col a\s*\{[\s\S]*?min-height:\s*26px;/)
    expect(css).toMatch(/\.hp-footer-bottom a\s*\{[\s\S]*?min-height:\s*24px;/)
  })

  it('wires the locked homepage export to Trade and parks Join Team as coming soon', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-header-nav"')
    expect(jsx).toContain('getTradeBoardHref()')
    expect(jsx).toContain('function ComingSoonNavItem')
    expect(jsx).toContain('className="hp-header-link hp-header-link-disabled"')
    expect(jsx).not.toContain('function JoinCta')
    expect(jsx).not.toContain('showJoinCta')
  })

  it('renders one sticky live reveal queue strip under the ticker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('function LiveQueueStrip')
    expect(jsx).toContain('className="hp-trade-preview"')
    expect(jsx).toContain('Live Reveal Queue')
    expect(jsx).toContain('View full queue')
    expect(jsx).toContain('function LiveQueueModal')
    expect(jsx).not.toContain('Next to reveal')
    expect(jsx).not.toContain('Open trade board')
    expect(jsx).not.toContain('<LiveQueueSection />')
    expect(jsx).toContain('className="hp-sticky-stack"')
    expect(css).toContain('.hp-trade-preview')
    expect(css).toContain('.hp-queue-modal-mask')
    expect(css).toContain('position: sticky;')
    expect(css).toMatch(/\.hp-sticky-stack\s*\{[\s\S]*?top:\s*0;/)
    expect(css).not.toContain('top: 144px;')
  })

  it('enriches targeted homepage data with workspace Trade Board and Live Queue state', () => {
    const data = enrichAmethystHomepageFeatureData(
      {
        ...defaultAmethystHomepageTemplateData,
        tickerTopText: 'Welcome to the live party',
      },
      {
        liveQueueSnapshot: {
          syncCode: 'MHF-7342',
          queue: ['Jamie', 'Priya'],
          queueLength: 2,
          currentCustomer: 'Jamie',
          onDeckCustomer: 'Priya',
          lastUpdated: '2026-06-20T18:00:00Z',
          ageSeconds: 20,
          staleAfterSeconds: 180,
          isFresh: true,
        },
        tradeBoardListings: [
          {
            id: 'listing-1',
            name: 'Opal Glow Ring',
            collection: 'OG',
            type: 'Ring',
            material: 'Sterling silver',
            stone: 'Opal',
            msrp: 88,
            size: '7',
            note: 'Item-for-item only',
            glyph: 'O',
            tier: 'diamond',
            photoUrl: null,
            photoSource: 'missing',
          },
        ],
      },
    )

    expect(data.tickerTopText).toBe('Welcome to the live party')
    expect(data.liveQueueState).toBe('live')
    expect(data.liveQueueEntries).toEqual([
      {
        position: 1,
        label: 'Currently Unboxing',
        name: 'Jamie',
        highlight: true,
      },
      {
        position: 2,
        label: 'On Deck',
        name: 'Priya',
        highlight: false,
      },
    ])
    expect(data.tradeBoardTickerItems).toEqual([
      {
        name: 'Opal Glow Ring',
        type: 'Ring',
        collection: 'OG',
      },
    ])
  })

  it('uses workspace-backed ticker and queue payloads in the public homepage export', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('CONTENT.liveQueueEntries')
    expect(jsx).toContain('CONTENT.liveQueueState')
    expect(jsx).toContain('CONTENT.liveQueueSummary')
    expect(jsx).toContain('CONTENT.tradeBoardTickerItems')
    expect(jsx).toContain('function SparkleSuiteHeaderStack')
    expect(jsx).toContain('<Ticker topText={t.tickerTopText} />')
    expect(jsx).toContain('<LiveQueueStrip state={effectiveLrqState} onOpen={onOpenQueue} />')
    expect(jsx).toContain('contentLiveQueueState || (scheduleIsLive ? t.lrqState : "offline")')
    expect(jsx).not.toContain('const LIVE_QUEUE_ENTRIES = RUNTIME_CONTEXT.targeted ? []')
    expect(jsx).not.toContain('const trades = RUNTIME_CONTEXT.targeted ? []')
    expect(jsx).not.toContain('function buildHybridTickerItems')
    expect(jsx).not.toContain('const tickerItems = [promoTickerText, promoTickerText, promoTickerText]')
  })

  it('renders customer TikTok media in an inline muted player instead of opening a new tab', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const templateData = readFileSync(
      resolve(process.cwd(), 'lib/amethyst/homepage-template-data.ts'),
      'utf8',
    )

    expect(jsx).toContain('function TikTokEmbed')
    expect(jsx).toContain('https://www.tiktok.com/player/v1/${videoId}')
    expect(jsx).toContain('autoplay=1&muted=1&loop=1&controls=0')
    expect(jsx).toContain('new IntersectionObserver')
    expect(jsx).toContain('type: nextMuted ? "mute" : "unMute"')
    expect(jsx).toContain('<TikTokEmbed')
    expect(jsx).toContain('ss-tiktok-embed-fallback')
    expect(jsx).toContain('data-tiktok-embed="false"')
    expect(jsx).toContain('ss-tiktok-embed-coming-soon')
    expect(jsx).toContain('hp-about-media-empty')
    expect(jsx).toContain('hp-media-coming-soon')
    expect(jsx).toContain('function AboutMediaCard')
    expect(jsx).not.toContain('hp-about-media-type')
    expect(jsx).not.toContain('hp-about-media-play')
    expect(jsx).not.toContain('window.open(slot.href')
    expect(templateData).not.toContain("window.open(content.showcaseVideoUrl")
    expect(templateData).not.toContain("window.open(slot.href, '_blank', 'noopener,noreferrer')")
  })

  it('derives live indicators from scheduled show windows instead of permanent live chrome', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('function isScheduledShowLive')
    expect(jsx).toContain('function getActiveLiveShow')
    expect(jsx).toContain('const scheduleIsLive = Boolean(activeLiveShow)')
    expect(jsx).toContain('const contentLiveQueueState = getContentLiveQueueState()')
    expect(jsx).toContain('const effectiveLrqState = contentLiveQueueState || (scheduleIsLive ? t.lrqState : "offline")')
    expect(jsx).toContain('{scheduleIsLive && <span className="hp-live-dot"')
    expect(jsx).toContain('{scheduleIsLive ? "Live now" : "Jewelry reveals"}')
    expect(jsx).toContain('getWatchCtaLabel(isLive)')
    expect(jsx).toContain('Watch on TikTok')
    expect(jsx).toContain('Queue opens when the next scheduled show starts.')
    expect(jsx).toContain('<LiveQueueStrip state={effectiveLrqState}')
    expect(jsx).toContain('state={effectiveLrqState}')
  })

  it('keeps hero visuals curated with controlled motion and intensity presets', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('function SparkleFx({ level, motion })')
    expect(jsx).toContain('<div className="hp-hero-media" aria-hidden="true" />')
    expect(jsx).not.toContain('className="hp-hero-eyebrow"')
    expect(jsx).not.toContain('Live schedule coming soon')
    expect(jsx).not.toContain('data-slot="hero photo"')
    expect(jsx).not.toContain('rep-swappable via Nic-Nac')
    expect(jsx).toContain('motion === "still"')
    expect(jsx).toContain('motion === "soft_glow"')
    expect(jsx).toContain('hp-fx-layer-glow')
    expect(jsx).toContain('<SparkleFx level={t.sparkleLevel} motion={t.heroMotion} />')
    expect(jsx).toContain('body.classList.add(`hero-motion-${t.heroMotion.replace("_", "-")}`)')
    expect(jsx).toContain('label="Hero motion"')
    expect(jsx).toContain('label: "Sparkle rise"')
    expect(jsx).toContain('label: "Soft glow"')
    expect(jsx).toContain('label: "Still"')
    expect(jsx).toContain('label="Hero sparkle intensity"')
    expect(css).toContain('.hp-fx-layer-glow::before')
    expect(css).toContain('.hp-fx-layer-glow::after')
    expect(css).toContain('.hp-hero .hp-hero-fx-layer')
    expect(css).toContain('@keyframes hp-fx-soft-glow')
    expect(css).toContain('body.hero-motion-soft-glow.tex-sparkle::before')
    expect(css).toContain('body.hero-motion-soft-glow.fx-confetti .hp-hero::before')
  })

  it('uses the live-show header grid with brand, centered nav, and primary shop CTA', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-live-dot"')
    expect(jsx).toContain('Shop live')
    expect(css).toContain('grid-template-columns: minmax(190px, 1fr) auto minmax(160px, 1fr);')
    expect(css).toContain('justify-self: center;')
    expect(css).toContain('justify-self: end;')
    expect(css).toContain('backdrop-filter: blur(18px);')
  })

  it('hydrates the locked homepage events from runtime data and keeps the show-card behaviors wired', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('window.AMETHYST_HOMEPAGE_EVENTS')
    expect(jsx).toContain('Intl.DateTimeFormat')
    expect(jsx).toContain('Intl.DateTimeFormat(undefined')
    expect(jsx).toContain('timeZoneName: "short"')
    expect(jsx).not.toContain('timeZone: "UTC"')
    expect(jsx).toContain('downloadCalendarEvent')
    expect(jsx).toContain('text/calendar')
    expect(jsx).toContain('URL.createObjectURL')
    expect(jsx).toContain('event.collections.map')
    expect(jsx).toContain('event.platforms.map')
    expect(jsx).toContain('Date TBD - Time TBD')
    expect(jsx).toContain('ev.when.split(" - ")')
    expect(jsx).not.toContain('Â')
    expect(jsx).not.toContain('Ã')
  })

  it('wires the customer signup form to the audience route with separate consent controls', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('withCurrentSearch("/api/amethyst/customer-audience")')
    expect(jsx).toContain('function buildContextSearch')
    expect(jsx).toContain('firstName')
    expect(jsx).toContain('lastName')
    expect(jsx).toContain('smsConsent')
    expect(jsx).toContain('emailConsent')
    expect(jsx).toContain('marketingConsent')
    expect(jsx).toContain('birthday')
    expect(jsx).toContain('favoriteGemOrStone')
    expect(jsx).toContain('favoriteMaterial')
    expect(jsx).toContain('favoriteCut')
    expect(jsx).toContain('favoriteCollection')
    expect(jsx).toContain('Only for birthday promotions and gift ideas. It will not be used for anything else.')
    expect(jsx).toContain('Choose SMS, email, or both')
    expect(jsx).toContain('/amethyst/Unsubscribe.html')
  })

  it('keeps signup submission state scoped to the signup form so the homepage can fresh-load', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const aboutStart = jsx.indexOf('function AboutSection')
    const signupStart = jsx.indexOf('function Signup')
    const aboutSectionSource = jsx.slice(aboutStart, signupStart)

    expect(aboutStart).toBeGreaterThan(-1)
    expect(signupStart).toBeGreaterThan(aboutStart)
    expect(aboutSectionSource).not.toContain('submitState')
  })

  it('ships the Sparkle Suite/Morganite skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('sparkle_suite_morganite')
    expect(jsx).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Black Diamond skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('black_diamond')
    expect(jsx).toContain('Black Diamond')
    expect(jsx).toContain('moonstone')
    expect(jsx).toContain('Moonstone')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
    expect(css).toContain('body.bg-black-velvet .hp-ticker')
    expect(css).toContain('body.bg-black-velvet .hp-ticker-row')
    expect(css).toContain('body.bg-black-velvet .hp-brand-name')
    expect(css).toContain('body.bg-black-velvet .hp-header-link')
    expect(css).toContain('body.bg-black-velvet .hp-trade-preview')
    expect(css).toContain('body.bg-black-velvet .hp-trade-preview-pill')
    expect(css).toContain('body.bg-black-velvet.tex-sparkle::before')
    expect(css).toContain('body.bg-black-velvet .hp-hero::after')
    expect(css).toContain('body.bg-black-velvet #events')
    expect(css).toContain('body.bg-black-velvet #wibp')
    expect(css).toContain('body.bg-black-velvet .hp-footer')
    expect(css).toContain('--hp-form-panel-bg: rgba(8, 8, 8, 0.66);')
    expect(css).toContain('body.bg-black-velvet .hp-signup-submit')
    expect(css).toContain('body.bg-moonstone-charcoal')
    expect(css).toContain('body.surface-silver-pearl .hp-event-card')
    expect(css).toContain('--hp-form-panel-bg: rgba(255, 255, 255, 0.8);')
    expect(css).toContain('body.surface-silver-pearl .hp-about-copy')
    expect(css).toContain('body.surface-silver-pearl .hp-about-copy .hp-section-title')
    expect(css).not.toContain('body.surface-silver-pearl .hp-section-title,')
    expect(css).toContain('body.surface-silver-pearl .hp-step')
    expect(css).toContain('body.surface-silver-pearl .hp-signup-title')
    expect(css).toContain('body.surface-silver-pearl .hp-signup-consent-box')
    expect(css).toContain('body.surface-silver-pearl .jp-hero-pitch')
    expect(css).toContain('body.surface-silver-pearl .tp-card-meta')
    expect(css).toContain('color: #f9f3ec;')
    expect(css).toMatch(/\.hp-queue-modal-row\s*\{[\s\S]*?color:\s*#2b1b1f;/)
    expect(css).toMatch(/\.hp-queue-modal-row \.name\s*\{[\s\S]*?color:\s*#2b1b1f;/)
  })

  it('ships the Rose Gold skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('rose_gold')
    expect(jsx).toContain('Rose Gold')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the approved batch skins in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('garnet')
    expect(jsx).toContain('Garnet')
    expect(jsx).toContain('amber')
    expect(jsx).toContain('Amber')
    expect(jsx).toContain('alpine_opal')
    expect(jsx).toContain('Alpine Opal')
    expect(jsx).toContain('emerald_garden')
    expect(jsx).toContain('Emerald Garden')
    expect(jsx).toContain('velvet')
    expect(jsx).toContain('Velvet')
    expect(jsx).toContain('rose_quartz')
    expect(jsx).toContain('Rose Quartz')
    expect(html).toContain('Bitter')
    expect(html).toContain('Nunito')
    expect(html).toContain('Great+Vibes')
    expect(html).toContain('Cormorant+Garamond')
    expect(html).toContain('Lato')
    expect(css).toContain('body.bg-suite-paper .hp-signup-submit')
    expect(css).toContain('body.bg-amber-paper .hp-signup-submit')
    expect(css).toContain('body.bg-quartz-paper .hp-signup-submit')
    expect(css).toContain('body.bg-emerald-garden')
    expect(css).toContain('body.surface-spa-ivory .hp-event-card')
    expect(css).toContain('body.btn-garden-lift .hp-btn-primary:hover')
    expect(css).toContain('body.champagne-botanical .tp-card.unicorn')
  })

  it('does not ship legacy placeholder skins in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
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

  it('ships a public unsubscribe export alongside the homepage', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Unsubscribe.html'),
      'utf8',
    )
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'),
      'utf8',
    )

    expect(html).toContain('unsubscribe.jsx')
    expect(jsx).toContain('/api/amethyst/customer-audience/unsubscribe')
  })

  it('uses large toggle-style unsubscribe rows for mobile preference changes', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-signup-check hp-unsubscribe-toggle"')
    expect(jsx).toContain('className="hp-toggle-control"')
    expect(css).toContain('.hp-unsubscribe-toggle')
    expect(css).toContain('.hp-toggle-control')
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-unsubscribe-toggle[\s\S]*?min-height:\s*56px;/)
  })
})
