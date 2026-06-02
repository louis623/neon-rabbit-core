import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'
import { SparkleSuitePublicNicNac } from './sparkle-suite-public-nic-nac'

function SparkleSeal({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        fill="#ffffff"
        r="30"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <text
        fill="currentColor"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="500"
        textAnchor="middle"
        x="32"
        y="42"
      >
        S
      </text>
    </svg>
  )
}

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

function LandingHeader() {
  const { brand } = sparkleSuitePublicLandingContent

  return (
    <header className="sl2-header">
      <a aria-label="Sparkle Suite home" className="sl2-brand" href="#top">
        <SparkleSeal className="sl2-brand__seal" />
        <span>{brand}</span>
      </a>
      <div className="sl2-header__actions">
        <span>Already have Sparkle Suite?</span>
        <a href="/login">Sign in here.</a>
      </div>
    </header>
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
      <div className="sl2-product-stack" aria-label="Real Sparkle Suite customer site previews">
        <img
          className="sl2-shot sl2-shot--customer"
          src={assets.customerMobile.src}
          alt={assets.customerMobile.alt}
        />
        <img
          className="sl2-shot sl2-shot--trade"
          src={assets.customerTradeMobile.src}
          alt={assets.customerTradeMobile.alt}
        />
        <img
          className="sl2-shot sl2-shot--landing"
          src={assets.customerDesktop.src}
          alt={assets.customerDesktop.alt}
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
        aria-label="Real Sparkle Suite workspace previews"
      >
        <img src={assets.workspaceDesktop.src} alt={assets.workspaceDesktop.alt} />
        <img src={assets.workspaceMobile.src} alt={assets.workspaceMobile.alt} />
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

function LandingFooter() {
  const { brand, footer } = sparkleSuitePublicLandingContent

  return (
    <footer className="sl2-footer">
      <div className="sl2-footer__brand">
        <SparkleSeal className="sl2-footer__seal" />
        <span>{brand}</span>
      </div>
      <div className="sl2-footer__nav" aria-label="Footer links">
        <div>
          <h2>Links</h2>
          {footer.links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div>
          <h2>Social</h2>
          {footer.socialLinks.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p>{sparkleSuitePublicLandingSafety.disclaimer}</p>
    </footer>
  )
}

export function SparkleSuitePublicLanding() {
  return (
    <main className="sparkle-landing sparkle-landing-v2">
      <div className="sl2-shell">
        <LandingHeader />
        <ProductHero />
        <WorkspaceProof />
        <PricingSection />
        <LandingFooter />
      </div>
    </main>
  )
}
