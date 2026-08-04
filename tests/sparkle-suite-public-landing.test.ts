import { createElement } from 'react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { metadata } from '@/app/page'
import { SparkleSuitePublicLanding } from '@/app/_components/sparkle-suite-public-landing'
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'
import { answerPublicNicNacQuestion } from '@/lib/sparkle-suite/public-nic-nac-assistant'

function renderLanding() {
  return renderToStaticMarkup(createElement(SparkleSuitePublicLanding))
}

function readGlobalCss() {
  return readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')
}

function publicAssetPath(src: string) {
  return join(process.cwd(), 'public', ...src.split('/').filter(Boolean))
}

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(selector)
  const openBrace = css.indexOf('{', start)
  const closeBrace = css.indexOf('}', openBrace)

  return start > -1 && openBrace > -1 && closeBrace > -1
    ? css.slice(openBrace + 1, closeBrace)
    : ''
}

describe('Sparkle Suite public landing page', () => {
  it('defines the short V2 product-grounded content model', () => {
    expect(sparkleSuitePublicLandingContent.hero).toMatchObject({
      eyebrow: 'Sparkle Suite for reps',
      headline: 'A better customer experience starts with a better rep setup.',
      body:
        'Sparkle Suite gives reps a polished customer site, standout live-show tools, and built-in support that helps customers feel the difference.',
      primaryCta: {
        label: 'Join the waitlist',
        href: '/prelaunch#waitlist',
      },
    })

    expect(sparkleSuitePublicLandingContent.workspaceProof).toMatchObject({
      eyebrow: 'Rep workspace',
      heading: 'Run the show with less scramble behind the scenes.',
      body:
        'Instead of chasing show details across scattered tools, reps get one workspace for Live queue, Trade board, Live event calendar, email and SMS updates, customer-site customizations, and Nic-Nac, the built-in assistant for live-show support.',
    })

    expect(sparkleSuitePublicLandingContent.sections.map((section) => section.id)).toEqual([
      'hero',
      'workspace-proof',
      'pricing',
    ])

    expect(sparkleSuitePublicLandingContent.assets).toEqual({
      tradeBoardDesktopProof: {
        src: '/sparkle-suite/landing/trade-board-desktop-proof.png',
        alt: 'Sparkle Suite customer Trade Board preview on desktop.',
      },
      nicNacWorkspaceProof: {
        src: '/sparkle-suite/landing/nic-nac-workspace-proof.png',
        alt: 'Sparkle Suite Nic-Nac workspace preview on desktop.',
      },
      workspaceDesktop: {
        src: '/sparkle-suite/landing/workspace-proof-desktop.png',
        alt: 'Sparkle Suite workspace setup checklist preview.',
      },
      workspaceMobile: {
        src: '/sparkle-suite/landing/workspace-proof-mobile.png',
        alt: 'Sparkle Suite mobile workspace setup preview.',
      },
    })

    expect(sparkleSuitePublicLandingContent.pricing).toMatchObject({
      heading: 'Time to level up.',
      body:
        'If you have been waiting for a sign to stop piecing it together, this is it.',
      buildFee: {
        label: 'Sparkle Suite build fee',
        price: '$49.99',
        body: 'One-time and non-refundable, itemized separately at checkout.',
      },
      standard: {
        label: 'Standard monthly',
        badge: 'Current monthly rate',
        price: '$74.99/month',
        term: 'Monthly subscription from the start.',
        firstCheckout: '$124.98 first checkout. Tax is not included in this price.',
      },
      primaryCta: {
        label: 'Join the waitlist',
        href: '/prelaunch#waitlist',
      },
      sectionCta: {
        label: 'Join the waitlist',
        href: '/prelaunch#waitlist',
      },
    })

    expect(sparkleSuitePublicLandingContent.publicNicNacAssistant).toMatchObject({
      teaser: 'Still have questions? Ask Nic-Nac.',
      body:
        "Get quick answers about setup, pricing, what's included, and whether Sparkle Suite fits your live-show workflow.",
      buttonLabel: 'Ask Nic-Nac',
      starterQuestions: [
        "What's included?",
        'How does setup work?',
        'Is Sparkle Suite affiliated with Bomb Party?',
      ],
    })
  })

  it('renders the approved short page in the expected order', () => {
    const html = renderLanding()
    const heroIndex = html.indexOf('Sparkle Suite for reps')
    const workspaceIndex = html.indexOf('Rep workspace')
    const pricingIndex = html.indexOf('Time to level up.')
    const footerIndex = html.indexOf('Sparkle Finder')
    const headerHtml = html.slice(0, html.indexOf('class="sl2-hero"'))

    expect(html).toContain('class="sparkle-landing sparkle-landing-v2"')
    expect(html).toContain('class="sl2-shell"')
    expect(headerHtml).toContain('Sparkle Suite account')
    expect(headerHtml).not.toContain('Start Sparkle Suite')
    expect(headerHtml).not.toContain('Level up your live stream')
    expect(heroIndex).toBeGreaterThan(-1)
    expect(workspaceIndex).toBeGreaterThan(heroIndex)
    expect(pricingIndex).toBeGreaterThan(workspaceIndex)
    expect(footerIndex).toBeGreaterThan(pricingIndex)
    expect(html).toContain('A better customer experience starts with a better rep setup.')
    expect(html).toContain('standout live-show tools')
    expect(html).toContain('Run the show with less scramble behind the scenes.')
    expect(html).toContain('Instead of chasing show details across scattered tools')
    expect(html).toContain('customer-site customizations')
    expect(html).toContain('Nic-Nac, the built-in assistant for live-show support')
    expect(html).toContain('Time to level up.')
    expect(html).toContain(
      'If you have been waiting for a sign to stop piecing it together, this is it.',
    )
    expect(html).toContain('class="sl2-pricing-offer"')
    expect(html).toContain('class="sl2-pricing-total"')
    expect(html).toContain('class="sl2-pricing-breakdown"')
    expect(html.indexOf('class="sl2-pricing-breakdown"')).toBeLessThan(
      html.indexOf('class="sl2-pricing-total"'),
    )
    expect(html).toContain('Sparkle Suite Standard')
    expect(html).not.toContain('aria-label="Included in Sparkle Suite"')
    expect(html).toContain('Real Sparkle Suite product previews')
    expect(html).toContain('Real Sparkle Suite workspace previews')
    expect(html).toContain('$49.99')
    expect(html).toContain('$74.99/month')
    expect(html).toContain('$124.98')
    expect(html).toContain('first checkout')
    expect(html).toContain('Tax is not included in this price.')
    expect(html).not.toContain('Stripe-calculated extras')
    expect(html).toContain('One-time build fee')
    expect(html).toContain('Monthly subscription')
    expect(html).toContain(
      'Build fee is one-time and non-refundable. Monthly subscription starts from checkout.',
    )
    expect(html).not.toContain('class="sl2-build-fee"')
    expect(html).not.toContain('class="sl2-pricing-card sl2-pricing-card--standard"')
    expect(html).toContain('href="/prelaunch#waitlist"')
    expect(html).not.toContain('href="/start"')
    expect(html).toContain('Join the waitlist')
    expect(html.indexOf('Join the waitlist')).toBeLessThan(
      html.indexOf('Still have questions? Ask Nic-Nac.'),
    )
    expect(html).toContain('Still have questions? Ask Nic-Nac.')
    expect(html).toContain(
      'Get quick answers about setup, pricing, what&#x27;s included, and whether Sparkle Suite fits your live-show workflow.',
    )
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('Ask Nic-Nac')
    expect(html).not.toContain('class="sl2-nic-nac-panel"')
    expect(html).not.toContain("What's included?")
    expect(html).not.toContain('How does setup work?')
    expect(html).not.toContain('sl2-btn__arrow')
    expect(html).not.toContain('-&gt;')
    expect(html).not.toContain('Give customers the setup they can feel.')
    expect(html).not.toContain('Start your Sparkle Suite account and open the workspace')
    expect(html).not.toContain('id="get-started"')
    expect(html).not.toContain('class="sl2-final-cta"')
    expect(html).not.toContain('>Help<')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('Sparkle Finder')
    expect(html).toContain('YouTube')
    expect(html).toContain('TikTok')
  })

  it('uses local product screenshot assets for Trade Board and workspace proof', () => {
    const html = renderLanding()
    const assets = Object.values(sparkleSuitePublicLandingContent.assets)

    for (const asset of assets) {
      expect(asset.src).toMatch(/^\/sparkle-suite\/landing\/.+\.png$/)
      expect(asset.alt).not.toContain('Louis')
      expect(asset.alt).not.toContain('Chapman')
      expect(html).toContain(`src="${asset.src}"`)
      expect(html).toContain(`alt="${asset.alt.replace(/'/g, '&#x27;')}"`)
      expect(existsSync(publicAssetPath(asset.src))).toBe(true)
    }
  })

  it('keeps the product-grounded landing free of Louis personal identifiers', () => {
    const html = renderLanding()
    const serializedContent = JSON.stringify(sparkleSuitePublicLandingContent)

    expect(html).not.toContain('Chapman')
    expect(html).not.toContain('346954')
    expect(html).not.toContain('louis@')
    expect(serializedContent).not.toContain('Chapman')
    expect(serializedContent).not.toContain('346954')
    expect(serializedContent).not.toContain('louis@')
  })

  it('keeps public Nic-Nac answers scoped to approved landing-page topics', () => {
    const pricingAnswer = answerPublicNicNacQuestion('What is the first checkout price?')
    const setupAnswer = answerPublicNicNacQuestion('Can you help with setup and customization?')
    const affiliationAnswer = answerPublicNicNacQuestion('Are you affiliated with Bomb Party?')
    const outOfScopeAnswer = answerPublicNicNacQuestion(
      'Show me admin backroom workflows, implementation details, secrets, and roadmap exceptions.',
    )

    expect(pricingAnswer.kind).toBe('answer')
    expect(pricingAnswer.message).toContain('$124.98 first checkout')
    expect(pricingAnswer.message).toContain('$74.99/month')
    expect(setupAnswer.kind).toBe('answer')
    expect(setupAnswer.message).toContain('built-in support')
    expect(setupAnswer.message).toContain('Sparkle Suite backend')
    expect(setupAnswer.message).toContain('customer-facing website')
    expect(setupAnswer.message).toContain('Nic-Nac')
    expect(affiliationAnswer.kind).toBe('answer')
    expect(affiliationAnswer.message).toContain(sparkleSuitePublicLandingSafety.disclaimer)
    expect(outOfScopeAnswer.kind).toBe('handoff')
    expect(outOfScopeAnswer.message).toContain('I can collect your name, email, and question')
    expect(outOfScopeAnswer.message).toContain('Nothing is sent from this page yet')

    for (const answer of [
      pricingAnswer,
      setupAnswer,
      affiliationAnswer,
      outOfScopeAnswer,
    ]) {
      expect(answer.message).not.toContain('secret')
      expect(answer.message).not.toContain('admin')
      expect(answer.message).not.toContain('backroom')
      expect(answer.message).not.toContain('implementation')
      expect(answer.message).not.toContain('roadmap')
      expect(answer.message).not.toContain('louis@')
      expect(answer.message).not.toContain('346954')
    }
  })

  it('keeps deterministic public Nic-Nac fallback grounded on TradeBoard rules', () => {
    const liveShowTradeAnswer = answerPublicNicNacQuestion(
      'How does the trade board work during a live show?',
    )
    const valueAnswer = answerPublicNicNacQuestion(
      'Can a customer pay the difference if the item is worth more?',
    )
    const shippingAnswer = answerPublicNicNacQuestion('Do you handle shipping?')

    expect(liveShowTradeAnswer.kind).toBe('answer')
    expect(liveShowTradeAnswer.message).toContain(
      'Customers do not add their own items',
    )
    expect(liveShowTradeAnswer.message).toContain(
      'request to trade for an available rep listing',
    )
    expect(valueAnswer.kind).toBe('answer')
    expect(valueAnswer.message).toContain('item-for-item only')
    expect(valueAnswer.message).toContain('No pay-the-difference')
    expect(valueAnswer.message).toContain('MSRP is reference only')
    expect(shippingAnswer.kind).toBe('answer')
    expect(shippingAnswer.message).toContain('does not handle shipping')
  })

  it('answers public waitlist form and next-step questions', () => {
    const formAnswer = answerPublicNicNacQuestion('What is this form for?')
    const cardAnswer = answerPublicNicNacQuestion('Do I need a card here?')
    const nextAnswer = answerPublicNicNacQuestion(
      'What happens after I create my account?',
    )

    expect(formAnswer.kind).toBe('answer')
    expect(formAnswer.message).toContain('Sparkle Suite waitlist')
    expect(formAnswer.message).toContain('does not create an account')
    expect(cardAnswer.kind).toBe('answer')
    expect(cardAnswer.message).toContain('No card is needed to join the waitlist')
    expect(cardAnswer.message).toContain('five-day trial account')
    expect(nextAnswer.kind).toBe('answer')
    expect(nextAnswer.message).toContain('Louis reviews your interest')
    expect(nextAnswer.message).toContain('schedules coaching')
    expect(nextAnswer.message).toContain('five-day trial account')
    expect(nextAnswer.message).toContain('complete billing from the workspace')
  })

  it('routes public Nic-Nac questions through the landing-page API', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )

    expect(source).toContain("fetch('/api/public/nic-nac'")
    expect(source).not.toContain('answerPublicNicNacQuestion(trimmedQuestion)')
    expect(source).toContain('isLoading')
    expect(source).toContain('collectContact')
  })

  it('keeps the public Nic-Nac conversation scrolled to the newest message', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )

    expect(source).toContain('threadEndRef')
    expect(source).toContain('scrollIntoView')
    expect(source).toContain('behavior: \'smooth\'')
  })

  it('uses the shared Nic-Nac pink N mark in the public chat shell', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )
    const markSource = readFileSync(
      join(process.cwd(), 'app', '_components', 'nic-nac-mark.tsx'),
      'utf8',
    )

    expect(source).toContain('NicNacMark')
    expect(markSource).toContain('N')
    expect(markSource).toContain('aria-hidden')
  })

  it('gives public Nic-Nac visible ecosystem controls for close and minimize', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )

    expect(source).toContain('aria-label="Minimize Nic-Nac"')
    expect(source).toContain('aria-label="Close Nic-Nac"')
    expect(source).toContain('aria-label="Open Nic-Nac"')
    expect(source).toContain('onKeyDown')
    expect(source).toContain('Escape')
  })

  it('styles public Nic-Nac controls as icon-sized chat window controls', () => {
    const css = readGlobalCss()

    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-panel__icon-button')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-reopen')
    expect(css).toContain('width: 36px')
    expect(css).toContain('height: 36px')
  })

  it('keeps the public Nic-Nac panel structured as a real chat window', () => {
    const css = readGlobalCss()

    expect(css).toContain('grid-template-rows: auto auto minmax(0, 1fr) auto')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-thread')
    expect(css).toContain('overflow-y: auto')
    expect(css).toContain('overscroll-behavior: contain')
    expect(css).toContain('position: sticky')
  })

  it('treats public Nic-Nac as a mobile bottom sheet', () => {
    const css = readGlobalCss()

    expect(css).toContain('@media (max-width: 680px)')
    expect(css).toContain('max-height: min(85dvh')
    expect(css).toContain('border-radius: 22px 22px 0 0')
  })

  it('uses the Nic-Nac mark on public assistant messages and a richer thinking state', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )
    const css = readGlobalCss()

    expect(source).toContain('sl2-nic-nac-message-row--assistant')
    expect(source).toContain('NicNacMark size={22}')
    expect(source).toContain('sl2-nic-nac-thinking-dots')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-message-row')
    expect(css).toContain('@keyframes sl2-nic-nac-dot-pulse')
  })

  it('handles public Nic-Nac focus and keyboard closing like a chat dialog', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )

    expect(source).toContain('openerRef')
    expect(source).toContain('inputRef')
    expect(source).toContain('inputRef.current?.focus()')
    expect(source).toContain('openerRef.current?.focus()')
    expect(source).toContain('handlePanelKeyDown')
    expect(source).toContain("event.key === 'Escape'")
  })

  it('presents public Nic-Nac handoff as a polished mini-card', () => {
    const source = readFileSync(
      join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
      'utf8',
    )
    const css = readGlobalCss()

    expect(source).toContain('sl2-nic-nac-handoff__head')
    expect(source).toContain('Leave this for Louis')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-handoff')
    expect(css).toContain('background: #fff6fa')
  })

  it('does not render old long-page sections or rejected hero machinery', () => {
    const html = renderLanding()

    expect(html).not.toContain('Inside the suite.')
    expect(html).not.toContain('Customers can feel the difference.')
    expect(html).not.toContain('Less patchwork behind the scenes.')
    expect(html).not.toContain('The edge customers can actually feel.')
    expect(html).not.toContain('What happens after checkout')
    expect(html).not.toContain('sl-product-scene')
    expect(html).not.toContain('sl-product-stage')
    expect(html).not.toContain('sl-depth-object')
    expect(html).not.toContain('sl-customer-card')
    expect(html).not.toContain('sl-feature-grid')
    expect(html).not.toContain('sl-product-card')
    expect(html).not.toContain('CSS 3D')
    expect(html).not.toContain('AI-powered platform')
    expect(html).not.toContain('Coming Soon')
    expect(html).toContain('Join the waitlist')
    expect(html).not.toContain('Founder pricing')
    expect(html).not.toContain('first 20 paid reps')
    expect(html).toContain('/prelaunch#waitlist')
    expect(html).not.toContain('post-launch')
    expect(html).not.toContain('pipeline')
    expect(html).not.toContain('modules')
    expect(html).not.toContain('backend')
    expect(html).not.toContain('fake testimonial')
    expect(html).not.toContain('ring photo')
    expect(html).not.toContain('gemstone')
    expect(html).not.toContain('>SS<')
  })

  it('adds isolated mobile-first V2 landing CSS', () => {
    const css = readGlobalCss()
    const teaserCss = cssBlock(css, '.sparkle-landing-v2 .sl2-nic-nac__teaser')
    const visitorMessageCss = cssBlock(
      css,
      '.sparkle-landing-v2 .sl2-nic-nac-message--visitor',
    )

    expect(css).toContain('.sparkle-landing-v2 {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-hero {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-header {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-header__inner {')
    expect(css).toContain('padding: 18px 44px;')
    expect(css).toContain('padding: 32px 0 52px;')
    expect(css).toContain('.sparkle-landing-v2 .sl2-hero h1 {')
    expect(css).toContain('font-size: clamp(3.4rem, 18vw, 5.2rem);')
    expect(css).toContain('.sparkle-landing-v2 .sl2-product-stack {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-shot--trade-board-proof {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-shot--nic-nac-workspace-proof {')
    expect(css).toContain('@media (min-width: 980px)')
    expect(css).toContain('grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);')
    expect(css).toContain('background: linear-gradient(145deg, #402924 0%, #36221d 100%);')
    expect(css).toContain('color: #f6e7da;')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing .sl2-eyebrow {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing__intro h2 {')
    expect(css).toContain('color: #f6e7da;')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing__intro p {')
    expect(css).toContain('color: rgba(246, 231, 218, 0.78);')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing-offer {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing-total {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing-breakdown {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing-line {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-pricing-line + .sl2-pricing-line::before {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-popover {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-panel {')
    expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-message--assistant {')
    expect(css).toContain('position: fixed;')
    expect(teaserCss).not.toContain('background:')
    expect(teaserCss).not.toContain('border:')
    expect(teaserCss).not.toContain('border-radius:')
    expect(teaserCss).not.toContain('box-shadow:')
    expect(visitorMessageCss).not.toContain('background: #402924;')
    expect(visitorMessageCss).toContain('color: #402924;')
    expect(css).toContain('content: "+";')
    expect(css).toContain('font-family: inherit;')
    expect(css).toContain('font-size: clamp(2rem, 8vw, 2.55rem);')
    expect(css).toContain('font-variant-numeric: lining-nums tabular-nums;')
    expect(css).toContain('font-size: clamp(2.15rem, 2.6vw, 2.65rem);')
    expect(css).toContain('margin-top: clamp(2.25rem, 7vw, 4.75rem);')
    expect(css).toContain('margin-left: calc(50% - 50vw);')
    expect(css).toContain('margin-right: calc(50% - 50vw);')
    expect(css).toContain('.sparkle-landing-v2 .sl2-footer__inner {')
    expect(css).toContain('padding: 34px 44px 44px;')
    expect(css).toContain('color: rgba(246, 231, 218, 0.72);')
    expect(css).toContain('justify-self: start;')
    expect(css).toContain('margin-top: 6px;')
    expect(css).toContain('text-align: left;')
  })

  it('keeps the trademark guardrail visible without putting third-party wording in the hero', () => {
    const html = renderLanding()
    const workspaceStart = html.indexOf('class="sl2-workspace-proof"')
    const heroHtml = workspaceStart > -1 ? html.slice(0, workspaceStart) : html

    expect(sparkleSuitePublicLandingSafety.disclaimer).toBe(
      'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
    )
    expect(html).toContain(sparkleSuitePublicLandingSafety.disclaimer)
    expect(heroHtml).not.toContain('Bomb Party')
    expect(heroHtml).not.toContain('BP reps')
    expect(heroHtml).not.toContain('BB business')
    expect(heroHtml).not.toContain('launch flow')
    expect(heroHtml).not.toContain('backend')
    expect(heroHtml).not.toContain('modules')
  })

  it('keeps the root landing public-safe without redirecting signed-in reps', () => {
    const pageSource = readFileSync(join(process.cwd(), 'app', 'page.tsx'), 'utf8')
    const accountActionSource = readFileSync(
      join(process.cwd(), 'app', '_components', 'SparkleSuitePublicAccountAction.tsx'),
      'utf8',
    )

    expect(pageSource).not.toContain("export const dynamic = 'force-dynamic'")
    expect(pageSource).not.toContain('createServerSupabaseClient')
    expect(pageSource).not.toContain('supabase.auth.getUser()')
    expect(pageSource).not.toContain("redirect('/nic-nac')")
    expect(pageSource).toContain('<SparkleSuitePublicLanding />')
    expect(pageSource).toContain('application/ld+json')
    expect(accountActionSource).toContain('getSession')
    expect(accountActionSource).not.toContain('redirectToWorkspaceUnlessAlreadyThere')
    expect(accountActionSource).not.toContain('window.location.replace')
    expect(accountActionSource).toContain('Sign in here.')
    expect(accountActionSource).toContain('href="/nic-nac"')
    expect(accountActionSource).toContain('Open workspace')
    expect(accountActionSource).toContain('Log out')
  })

  it('exports public landing metadata without third-party brand-led framing', () => {
    expect(metadata.title).toEqual({ absolute: 'Sparkle Suite' })
    expect(metadata.description).toBe(
      'A better customer experience starts with a better rep setup.',
    )
    expect(JSON.stringify(metadata)).not.toContain('Bomb Party')
  })
})
