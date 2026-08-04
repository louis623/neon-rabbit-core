import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from './sparkle-suite-public-chrome'
import { SparkleSuitePublicNicNac } from './sparkle-suite-public-nic-nac'

function LandingButton({
  href,
  label,
  variant = 'primary',
}: {
  href: string
  label: string
  variant?: 'primary' | 'ghost'
}) {
  return (
    <a className={`sl2-btn sl2-btn--${variant}`} href={href}>
      {label}
    </a>
  )
}

function ProductHero() {
  const { hero, assets } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-hero" id="top">
      <div className="sl2-hero__copy">
        <span className="sl2-eyebrow">{hero.eyebrow}</span>
        <h1>{hero.headline}</h1>
        <p>{hero.body}</p>
        <LandingButton href={hero.primaryCta.href} label={hero.primaryCta.label} />
      </div>
      <div className="sl2-product-stack" aria-label="Real Sparkle Suite Trade Board preview">
        <img
          className="sl2-shot sl2-shot--trade-board-proof"
          src={assets.tradeBoardDesktopProof.src}
          alt={assets.tradeBoardDesktopProof.alt}
        />
      </div>
    </section>
  )
}

function WorkspaceProof() {
  const { workspaceProof, assets } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-workspace-proof" id="workspace-proof">
      <div className="sl2-workspace-proof__copy">
        <span className="sl2-eyebrow">{workspaceProof.eyebrow}</span>
        <h2>{workspaceProof.heading}</h2>
        <p>{workspaceProof.body}</p>
      </div>
      <div
        className="sl2-workspace-proof__shots"
        aria-label="Real Sparkle Suite Nic-Nac workspace preview"
      >
        <img
          src={assets.nicNacWorkspaceProof.src}
          alt={assets.nicNacWorkspaceProof.alt}
        />
      </div>
    </section>
  )
}

function CustomerSiteProof() {
  const { customerSiteProof, assets } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-customer-site-proof" id="customer-site-proof">
      <div className="sl2-customer-site-proof__copy">
        <span className="sl2-eyebrow">{customerSiteProof.eyebrow}</span>
        <h2>{customerSiteProof.heading}</h2>
        <p>{customerSiteProof.body}</p>
      </div>
      <div
        className="sl2-customer-site-proof__deck"
        aria-label="Three customer-facing Sparkle Suite site style previews"
      >
        <img
          className="sl2-customer-site-proof__card sl2-customer-site-proof__card--violet"
          src={assets.customerSiteVioletProof.src}
          alt={assets.customerSiteVioletProof.alt}
        />
        <img
          className="sl2-customer-site-proof__card sl2-customer-site-proof__card--night"
          src={assets.customerSiteNightProof.src}
          alt={assets.customerSiteNightProof.alt}
        />
        <img
          className="sl2-customer-site-proof__card sl2-customer-site-proof__card--blush"
          src={assets.customerSiteBlushProof.src}
          alt={assets.customerSiteBlushProof.alt}
        />
      </div>
    </section>
  )
}

function PricingSection() {
  const { pricing } = sparkleSuitePublicLandingContent
  const firstCheckoutPrice = pricing.standard.firstCheckout.split(' first checkout')[0]
  const firstCheckoutNote = pricing.standard.firstCheckout
    .replace(`${firstCheckoutPrice} first checkout`, '')
    .replace(/^[\s.]+/, '')
    .replace(/\.$/, '')

  return (
    <section className="sl2-pricing" id="pricing">
      <div className="sl2-pricing__intro">
        <span className="sl2-eyebrow">{pricing.eyebrow}</span>
        <h2>{pricing.heading}</h2>
        <p>{pricing.body}</p>
      </div>
      <article className="sl2-pricing-offer" aria-label="Sparkle Suite Standard pricing">
        <div className="sl2-pricing-offer__head">
          <span>{pricing.standard.badge}</span>
          <h3>Sparkle Suite Standard</h3>
        </div>
        <dl className="sl2-pricing-breakdown">
          <div className="sl2-pricing-line">
            <dt>One-time build fee</dt>
            <dd>{pricing.buildFee.price}</dd>
          </div>
          <div className="sl2-pricing-line">
            <dt>Monthly subscription</dt>
            <dd>{pricing.standard.price}</dd>
          </div>
        </dl>
        <div
          className="sl2-pricing-total"
          aria-label={`${firstCheckoutPrice} first checkout. ${firstCheckoutNote}.`}
        >
          <strong>{firstCheckoutPrice}</strong>
          <span>first checkout</span>
          <p>{firstCheckoutNote}.</p>
        </div>
        <p className="sl2-pricing-note">
          Build fee is one-time and non-refundable. Monthly subscription starts from
          checkout.
        </p>
      </article>
      <LandingButton href={pricing.sectionCta.href} label={pricing.sectionCta.label} />
      <SparkleSuitePublicNicNac />
    </section>
  )
}

export function SparkleSuitePublicLanding() {
  return (
    <main className="sparkle-landing sparkle-landing-v2">
      <div className="sl2-shell">
        <SparkleSuitePublicHeader homeHref="#top" />
        <ProductHero />
        <CustomerSiteProof />
        <WorkspaceProof />
        <PricingSection />
        <SparkleSuitePublicFooter />
      </div>
    </main>
  )
}
