import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'

type ProductScreen = (typeof sparkleSuitePublicLandingContent.hero.screens)[number]

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
    <a className={`sl-btn sl-btn--${variant}`} href={href}>
      {label}
      {variant === 'primary' ? (
        <span aria-hidden="true" className="sl-btn__arrow">
          -&gt;
        </span>
      ) : null}
    </a>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M12 3v18M5 7h14M6 17h12M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ProductMiniScreen({
  screen,
}: {
  screen: ProductScreen
}) {
  const action =
    screen.id === 'queue'
      ? 'View full queue'
      : screen.id === 'trade'
        ? 'View all trades'
        : screen.id === 'calendar'
          ? 'Add to calendar'
          : screen.id === 'email'
            ? 'Manage emails'
            : screen.id === 'sms'
              ? 'Manage texts'
              : 'Browse help'

  return (
    <article className={`sl-product-card sl-product-card--${screen.id}`}>
      <div className="sl-product-card__top">
        <SparkleIcon className="sl-product-card__icon" />
        <h3>{screen.title}</h3>
      </div>
      <MiniScreenBody screen={screen} />
      <a href="#tools">
        {action}
        <span aria-hidden="true">-&gt;</span>
      </a>
    </article>
  )
}

function MiniScreenBody({ screen }: { screen: ProductScreen }) {
  if (screen.id === 'queue') {
    return (
      <div className="sl-product-card__body sl-mini-queue">
        <div>
          <span>Now serving</span>
          <strong>{screen.body}</strong>
          <b>12</b>
        </div>
        <div>
          <span>Up next</span>
          <strong>Amanda</strong>
          <b>13</b>
        </div>
        <div>
          <span>After that</span>
          <strong>Jessica</strong>
          <b>14</b>
        </div>
      </div>
    )
  }

  if (screen.id === 'trade') {
    return (
      <div className="sl-product-card__body sl-mini-trades">
        <div>
          <strong>ISO</strong>
          <span>Have</span>
        </div>
        <p>{screen.label}</p>
        <p>ISO: Stackers</p>
        <p>{screen.body}</p>
      </div>
    )
  }

  if (screen.id === 'calendar') {
    return (
      <div className="sl-product-card__body sl-mini-action">
        <span>{screen.label}</span>
        <strong>{screen.body}</strong>
        <button type="button">Next show saved</button>
      </div>
    )
  }

  if (screen.id === 'email' || screen.id === 'sms') {
    return (
      <div className="sl-product-card__body sl-mini-action">
        <span>{screen.label}</span>
        <strong>{screen.body}</strong>
        <button type="button">Reminder sent</button>
      </div>
    )
  }

  return (
    <div className="sl-product-card__body sl-mini-action">
      <span>{screen.label}</span>
      <strong>{screen.body}</strong>
      <button type="button">Ask a question</button>
    </div>
  )
}

function ProductScreenCascade() {
  const { hero } = sparkleSuitePublicLandingContent

  return (
    <div aria-label="Sparkle Suite product previews" className="sl-product-universe sl-cascade">
      <article className="sl-browser-card">
        <div className="sl-browser-card__chrome">
          <SparkleSeal className="sl-browser-card__seal" />
          <nav aria-label="Example customer site navigation">
            <span>Home</span>
            <span>Live Shows</span>
            <span>Trades</span>
            <span>About</span>
            <span>Contact</span>
          </nav>
          <span>Join the List</span>
        </div>
        <div className="sl-browser-card__hero">
          <div>
            <h3>{hero.productHeadline}</h3>
            <p>{hero.productSubhead}</p>
            <span>Join the List</span>
          </div>
        </div>
        <div className="sl-browser-card__tiles">
          {[
            ['Upcoming Shows', 'See what is next'],
            ['Live Queue', 'See your place'],
            ['Trade Board', 'Give & get'],
            ['Get Updates', 'Email & SMS'],
          ].map(([tile, detail]) => (
            <span key={tile}>
              <strong>{tile}</strong>
              <small>{detail}</small>
            </span>
          ))}
        </div>
        <div className="sl-browser-card__show">
          <span>Upcoming Live Shows</span>
          <strong>Thursday, May 29 - 8:00 PM</strong>
          <button type="button">Save My Spot</button>
        </div>
      </article>
      <div aria-hidden="true" className="sl-connector sl-connector--queue" />
      <div aria-hidden="true" className="sl-connector sl-connector--trade" />
      <div aria-hidden="true" className="sl-connector sl-connector--updates" />
      {hero.screens.slice(1).map((screen) => (
        <ProductMiniScreen key={screen.id} screen={screen} />
      ))}
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="sl-header">
      <a aria-label="Sparkle Suite home" className="sl-brand" href="#top">
        <SparkleSeal className="sl-brand__seal" />
        <span>{sparkleSuitePublicLandingContent.brand}</span>
      </a>
      <nav aria-label="Sparkle Suite landing page">
        {sparkleSuitePublicLandingContent.nav.links.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="sl-header__actions">
        <a href="/login">Sign In</a>
        <LandingButton href="#pricing" label="Get Sparkle Suite" />
      </div>
    </header>
  )
}

function LandingHero() {
  const { hero } = sparkleSuitePublicLandingContent
  const [headlineLead, headlineAccent = ''] = hero.headline.split('feel more ')

  return (
    <>
      <section className="sl-hero" id="top">
        <div className="sl-hero__copy">
          <h1>
            {headlineLead}feel more <em>{headlineAccent}</em>
          </h1>
          <p>{hero.body}</p>
          <div className="sl-actions">
            <LandingButton href={hero.primaryCta.href} label={hero.primaryCta.label} />
            <LandingButton
              href={hero.secondaryCta.href}
              label={hero.secondaryCta.label}
              variant="ghost"
            />
          </div>
          <div className="sl-value-row">
            {hero.valueProps.map((item) => (
              <article key={`${item.title}-${item.body}`}>
                <SparkleIcon className="sl-value-row__icon" />
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </article>
            ))}
          </div>
        </div>
        <ProductScreenCascade />
      </section>
    </>
  )
}

function ComparisonBand() {
  const { comparison } = sparkleSuitePublicLandingContent

  return (
    <section aria-labelledby="comparison-heading" className="sl-comparison">
      <div className="sl-comparison__copy">
        <h2 id="comparison-heading">{comparison.heading}</h2>
        <p>{comparison.body}</p>
      </div>
      <div className="sl-comparison__grid">
        <article>
          <span>{comparison.beforeLabel}</span>
          <ul>
            {comparison.before.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="is-after">
          <span>{comparison.afterLabel}</span>
          <ul>
            {comparison.after.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

function FeatureProof() {
  const { features } = sparkleSuitePublicLandingContent

  return (
    <section aria-labelledby="features-heading" className="sl-section sl-features" id="tools">
      <div className="sl-section__head">
        <h2 id="features-heading">{features.heading}</h2>
        <p>{features.body}</p>
      </div>
      <div className="sl-feature-grid">
        {features.items.map((feature, index) => (
          <article className="sl-feature-card" key={feature.title}>
            <span className="sl-feature-card__num">{String(index + 1).padStart(2, '0')}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function CustomerPath() {
  const { customers } = sparkleSuitePublicLandingContent

  return (
    <section
      aria-labelledby="customers-heading"
      className="sl-section sl-customer-path"
      id="customers"
    >
      <div className="sl-section__head">
        <h2 id="customers-heading">{customers.heading}</h2>
        <p>{customers.body}</p>
      </div>
      <ol className="sl-path">
        {customers.steps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  )
}

function RepRelief() {
  const { reps } = sparkleSuitePublicLandingContent

  return (
    <section aria-labelledby="rep-heading" className="sl-section sl-rep-relief">
      <div>
        <h2 id="rep-heading">{reps.heading}</h2>
        <p>{reps.body}</p>
      </div>
      <div className="sl-relief-list">
        {reps.points.map((point) => (
          <article key={point.title}>
            <h3>{point.title}</h3>
            <p>{point.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function PricingCta() {
  const { pricing } = sparkleSuitePublicLandingContent

  return (
    <section aria-labelledby="pricing-heading" className="sl-pricing" id="pricing">
      <div>
        <h2 id="pricing-heading">{pricing.heading}</h2>
        <p>{pricing.body}</p>
        <p className="sl-pricing__note">{pricing.note}</p>
      </div>
      <LandingButton href={pricing.primaryCta.href} label={pricing.primaryCta.label} />
    </section>
  )
}

function LandingFaq() {
  const { faq } = sparkleSuitePublicLandingContent

  return (
    <section aria-labelledby="faq-heading" className="sl-section sl-faq" id="faq">
      <div className="sl-section__head">
        <h2 id="faq-heading">A few quick answers.</h2>
        <p>{sparkleSuitePublicLandingSafety.audienceClarifier}</p>
      </div>
      <div className="sl-faq__list">
        {faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="sl-footer">
      <div className="sl-footer__brand">
        <SparkleSeal className="sl-footer__seal" />
        <span>{sparkleSuitePublicLandingContent.brand}</span>
      </div>
      <p>{sparkleSuitePublicLandingSafety.disclaimer}</p>
      <div className="sl-footer__links">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-and-conditions">Terms and Conditions</a>
      </div>
    </footer>
  )
}

export function SparkleSuitePublicLanding() {
  return (
    <main className="sparkle-landing">
      <div className="sl-shell">
        <LandingHeader />
        <LandingHero />
        <ComparisonBand />
        <FeatureProof />
        <CustomerPath />
        <RepRelief />
        <PricingCta />
        <LandingFaq />
        <LandingFooter />
      </div>
    </main>
  )
}
